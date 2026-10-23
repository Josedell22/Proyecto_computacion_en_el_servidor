const Router = require("../router");
const { query } = require("../db");

const router = Router();

const REQUEST_SELECT = `
  SELECT tr.*,
         s.name AS subject_name,
         st.name AS student_name,
         adv.name AS advisor_name,
         sess.id AS session_id,
         sess.status AS session_status,
         sess.scheduled_at
  FROM tutoring_requests tr
  JOIN subjects s ON s.id = tr.subject_id
  JOIN users st ON st.id = tr.student_id
  LEFT JOIN users adv ON adv.id = tr.advisor_id
  LEFT JOIN sessions sess ON sess.request_id = tr.id
`;

async function getRequest(id) {
  const result = await query(`${REQUEST_SELECT} WHERE tr.id=$1`, [id]);
  return result.rows[0];
}

async function hasAdvisorConflict(advisorId, scheduledAt, excludeSessionId) {
  const result = await query(
    `SELECT id FROM sessions
     WHERE advisor_id=$1 AND status='confirmed' AND scheduled_at=$2
       AND ($3::int IS NULL OR id <> $3)`,
    [advisorId, scheduledAt, excludeSessionId || null]
  );
  return Boolean(result.rows[0]);
}

router.get("/", async (req, res) => {
  const scope = req.query.scope || "mine";
  if (scope === "open") {
    const result = await query(
      `${REQUEST_SELECT}
       WHERE tr.status='pending' AND tr.advisor_id IS NULL
         AND tr.subject_id IN (SELECT subject_id FROM student_subjects WHERE user_id=$1)
         AND tr.student_id <> $1
       ORDER BY tr.created_at DESC`,
      [req.user.id]
    );
    return res.json({ requests: result.rows });
  }
  if (scope === "received") {
    const result = await query(
      `${REQUEST_SELECT}
       WHERE tr.status IN ('pending','accepted','rejected','finished')
         AND (
           tr.advisor_id=$1
           OR (tr.advisor_id IS NULL AND tr.status='pending'
               AND tr.subject_id IN (SELECT subject_id FROM student_subjects WHERE user_id=$1)
               AND tr.student_id <> $1)
         )
       ORDER BY tr.created_at DESC`,
      [req.user.id]
    );
    return res.json({ requests: result.rows });
  }
  const result = await query(
    `${REQUEST_SELECT} WHERE tr.student_id=$1 ORDER BY tr.created_at DESC`,
    [req.user.id]
  );
  res.json({ requests: result.rows });
});

router.post("/", async (req, res) => {
  const { subjectId, description, preferredAt, advisorId } = req.body || {};
  if (!subjectId || !description || !String(description).trim()) {
    return res.status(400).json({
      message: "Debe completar la materia y la descripción del tema.",
      fields: {
        subjectId: !subjectId ? "Seleccione una materia." : null,
        description: !description || !String(description).trim() ? "Explique el tema que necesita." : null,
      },
    });
  }

  const subject = await query("SELECT * FROM subjects WHERE id=$1 AND is_active=TRUE", [subjectId]);
  if (!subject.rows[0]) {
    return res.status(400).json({ message: "Solo puede usar materias activas registradas." });
  }

  let advisor = null;
  if (advisorId) {
    if (Number(advisorId) === req.user.id) {
      return res.status(400).json({ message: "No puede enviarse una solicitud a sí mismo." });
    }
    const advisorRow = await query(
      `SELECT u.id FROM users u
       JOIN student_subjects ss ON ss.user_id=u.id
       WHERE u.id=$1 AND u.is_active=TRUE AND ss.subject_id=$2`,
      [advisorId, subjectId]
    );
    if (!advisorRow.rows[0]) {
      return res.status(400).json({
        message: "El estudiante seleccionado no tiene dominio registrado en esa materia.",
      });
    }
    advisor = advisorRow.rows[0].id;
    const dup = await query(
      `SELECT id FROM tutoring_requests
       WHERE student_id=$1 AND advisor_id=$2 AND subject_id=$3 AND status='pending'`,
      [req.user.id, advisor, subjectId]
    );
    if (dup.rows[0]) {
      return res.status(409).json({ message: "Ya existe una solicitud activa para esta asesoría." });
    }
  }

  const created = await query(
    `INSERT INTO tutoring_requests (student_id, advisor_id, subject_id, description, preferred_at)
     VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [req.user.id, advisor, subjectId, String(description).trim(), preferredAt || null]
  );
  res.status(201).json({ request: await getRequest(created.rows[0].id) });
});

router.patch("/:id/cancel", async (req, res) => {
  const current = await getRequest(req.params.id);
  if (!current || current.student_id !== req.user.id) {
    return res.status(404).json({ message: "Solicitud no encontrada." });
  }
  if (current.status !== "pending") {
    return res.status(400).json({ message: "Solo puede cancelar una solicitud que aún no ha sido aceptada." });
  }
  await query("UPDATE tutoring_requests SET status='cancelled' WHERE id=$1", [current.id]);
  res.json({ request: await getRequest(current.id) });
});

router.patch("/:id/accept", async (req, res) => {
  const current = await getRequest(req.params.id);
  if (!current) return res.status(404).json({ message: "Solicitud no encontrada." });
  if (current.status === "cancelled") {
    return res.status(400).json({ message: "Las solicitudes canceladas no pueden aceptarse." });
  }
  if (current.status !== "pending") {
    return res.status(400).json({ message: "Solo se pueden aceptar solicitudes pendientes." });
  }

  const isAssigned = current.advisor_id === req.user.id;
  const canClaimOpen =
    !current.advisor_id &&
    current.student_id !== req.user.id &&
    (
      await query("SELECT 1 FROM student_subjects WHERE user_id=$1 AND subject_id=$2", [
        req.user.id,
        current.subject_id,
      ])
    ).rows[0];

  if (!isAssigned && !canClaimOpen) {
    return res.status(403).json({ message: "No puede aceptar esta solicitud." });
  }

  const scheduledAt = current.preferred_at || new Date();
  if (await hasAdvisorConflict(req.user.id, scheduledAt)) {
    return res.status(409).json({
      message: "Ya tiene una sesión confirmada en ese horario.",
    });
  }

  await query("UPDATE tutoring_requests SET status='accepted', advisor_id=$1 WHERE id=$2", [
    req.user.id,
    current.id,
  ]);
  const session = await query(
    `INSERT INTO sessions (request_id, student_id, advisor_id, subject_id, scheduled_at)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [current.id, current.student_id, req.user.id, current.subject_id, scheduledAt]
  );
  res.json({ request: await getRequest(current.id), session: session.rows[0] });
});

router.patch("/:id/reject", async (req, res) => {
  const current = await getRequest(req.params.id);
  if (!current) return res.status(404).json({ message: "Solicitud no encontrada." });
  if (current.advisor_id !== req.user.id) {
    return res.status(403).json({ message: "Solo el asesor asignado puede rechazar esta solicitud." });
  }
  if (current.status !== "pending") {
    return res.status(400).json({ message: "Solo se pueden rechazar solicitudes pendientes." });
  }
  await query("UPDATE tutoring_requests SET status='rejected' WHERE id=$1", [current.id]);
  res.json({ request: await getRequest(current.id) });
});

module.exports = router;
