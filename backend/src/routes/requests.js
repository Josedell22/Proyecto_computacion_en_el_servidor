const Router = require("../router");
const { query, withTransaction } = require("../db");
const { httpError, parseFutureDate, parsePositiveId } = require("../academicValidation");

const router = Router();
const REQUEST_SELECT = `
  SELECT tr.*, s.name AS subject_name, st.name AS student_name, adv.name AS advisor_name,
         sess.id AS session_id, sess.status AS session_status, sess.scheduled_at
  FROM tutoring_requests tr
  JOIN subjects s ON s.id = tr.subject_id
  JOIN users st ON st.id = tr.student_id
  LEFT JOIN users adv ON adv.id = tr.advisor_id
  LEFT JOIN sessions sess ON sess.request_id = tr.id
`;

async function getRequest(id) {
  return (await query(REQUEST_SELECT + " WHERE tr.id=$1", [id])).rows[0];
}

router.use("/:id", (req, res, next) => {
  if (!parsePositiveId(req.params.id)) return res.status(400).json({ message: "La solicitud indicada no es válida." });
  next();
});

router.get("/", async (req, res) => {
  const scope = req.query.scope || "mine";
  if (!["mine", "received", "open"].includes(scope)) throw httpError(400, "La vista solicitada no es válida.");
  const where = scope === "open"
    ? `tr.status='pending' AND tr.advisor_id IS NULL AND tr.student_id <> $1
       AND s.is_active AND st.is_active
       AND tr.subject_id IN (SELECT subject_id FROM student_subjects WHERE user_id=$1)`
    : scope === "received" ? "tr.advisor_id=$1" : "tr.student_id=$1";
  const result = await query(REQUEST_SELECT + " WHERE " + where + " ORDER BY tr.created_at DESC, tr.id DESC", [req.user.id]);
  res.json({ requests: result.rows });
});

router.post("/", async (req, res) => {
  const { subjectId, description, preferredAt, advisorId } = req.body || {};
  const subject = parsePositiveId(subjectId);
  const direct = advisorId !== undefined && advisorId !== null && advisorId !== "";
  const advisor = direct ? parsePositiveId(advisorId) : null;
  const schedule = parseFutureDate(preferredAt);
  const text = typeof description === "string" ? description.trim() : "";
  const fields = {
    subjectId: !subject ? "Seleccione una materia válida." : null,
    advisorId: direct && !advisor ? "Seleccione un asesor válido." : null,
    description: !text ? "Explique el tema que necesita." : text.length > 1200 ? "Use hasta 1200 caracteres." : null,
    preferredAt: schedule.error || null,
  };
  if (Object.values(fields).some(Boolean)) return res.status(400).json({ message: "Revise la información de la solicitud.", fields });
  if (advisor === req.user.id) throw httpError(400, "No puede enviarse una solicitud a sí mismo.");
  if (!(await query("SELECT 1 FROM subjects WHERE id=$1 AND is_active", [subject])).rowCount) {
    throw httpError(400, "Solo puede usar materias activas registradas.");
  }
  if (advisor && !(await query(
    `SELECT 1 FROM users u JOIN student_subjects ss ON ss.user_id=u.id
     WHERE u.id=$1 AND u.is_active AND u.role='student' AND ss.subject_id=$2`, [advisor, subject]
  )).rowCount) throw httpError(400, "El estudiante seleccionado no tiene dominio registrado en esa materia.");

  const id = await withTransaction(async (client) => {
    // Serialize duplicate checks also on installations awaiting the index migration.
    await client.query("SELECT pg_advisory_xact_lock(4101, $1)", [req.user.id]);
    const duplicate = await client.query(
      `SELECT id FROM tutoring_requests WHERE student_id=$1 AND subject_id=$2
       AND advisor_id IS NOT DISTINCT FROM $3::int AND status='pending'`, [req.user.id, subject, advisor]
    );
    if (duplicate.rowCount) throw httpError(409, "Ya existe una solicitud pendiente para esta materia y destinatario.");
    const result = await client.query(
      `INSERT INTO tutoring_requests (student_id, advisor_id, subject_id, description, preferred_at)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`, [req.user.id, advisor, subject, text, schedule.value]
    );
    return result.rows[0].id;
  });
  res.status(201).json({ request: await getRequest(id) });
});

for (const action of ["cancel", "reject"]) {
  router.patch("/:id/" + action, async (req, res) => {
    const id = Number(req.params.id);
    // UPDATE rechecks the state after a concurrent accept commits.
    const owner = action === "cancel" ? "student_id" : "advisor_id";
    const status = action === "cancel" ? "cancelled" : "rejected";
    const updated = await query(
      "UPDATE tutoring_requests SET status=$1 WHERE id=$2 AND " + owner + "=$3 AND status='pending' RETURNING id",
      [status, id, req.user.id]
    );
    if (!updated.rowCount) {
      const current = await getRequest(id);
      if (!current || current[owner] !== req.user.id) throw httpError(404, "Solicitud no encontrada.");
      throw httpError(409, "La solicitud ya fue atendida. Actualice la lista para ver su estado.");
    }
    res.json({ request: await getRequest(id) });
  });
}

router.patch("/:id/accept", async (req, res) => {
  const requestId = Number(req.params.id);
  const session = await withTransaction(async (client) => {
    const current = (await client.query("SELECT * FROM tutoring_requests WHERE id=$1 FOR UPDATE", [requestId])).rows[0];
    if (!current) throw httpError(404, "Solicitud no encontrada.");
    if (current.student_id === req.user.id || (current.advisor_id && current.advisor_id !== req.user.id)) {
      throw httpError(403, "No puede aceptar esta solicitud.");
    }
    if (current.status !== "pending") throw httpError(409, "Esta solicitud ya fue atendida y no puede volver a aceptarse.");
    const eligible = await client.query(
      `SELECT 1 FROM student_subjects ss JOIN subjects s ON s.id=ss.subject_id
       JOIN users u ON u.id=ss.user_id
       WHERE ss.user_id=$1 AND ss.subject_id=$2 AND s.is_active AND u.is_active AND u.role='student'`,
      [req.user.id, current.subject_id]
    );
    if (!eligible.rowCount) throw httpError(403, "Debe tener dominio registrado en una materia activa para aceptar.");

    const date = parseFutureDate(req.body?.scheduledAt ?? current.preferred_at?.toISOString());
    if (date.error) throw httpError(400, "Indique una fecha futura para programar la sesión.");
    // Ordered locks protect both participants, including when they switch roles.
    for (const id of [current.student_id, req.user.id].sort((a, b) => a - b)) {
      await client.query("SELECT pg_advisory_xact_lock(4102, $1)", [id]);
    }
    const active = await client.query("SELECT id FROM users WHERE id=ANY($1::int[]) AND is_active", [[current.student_id, req.user.id]]);
    if (active.rowCount !== 2) throw httpError(409, "Uno de los participantes tiene la cuenta desactivada.");
    const conflict = await client.query(
      `SELECT id FROM sessions WHERE status='confirmed' AND scheduled_at=$1
       AND (student_id=ANY($2::int[]) OR advisor_id=ANY($2::int[]))`,
      [date.value, [current.student_id, req.user.id]]
    );
    if (conflict.rowCount) throw httpError(409, "Uno de los participantes ya tiene una sesión confirmada en ese horario.");
    await client.query("UPDATE tutoring_requests SET status='accepted', advisor_id=$1 WHERE id=$2", [req.user.id, requestId]);
    return (await client.query(
      `INSERT INTO sessions (request_id, student_id, advisor_id, subject_id, scheduled_at)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [requestId, current.student_id, req.user.id, current.subject_id, date.value]
    )).rows[0];
  });
  res.json({ request: await getRequest(requestId), session });
});

module.exports = router;
