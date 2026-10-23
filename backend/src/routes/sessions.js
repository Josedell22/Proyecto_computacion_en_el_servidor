const Router = require("../router");
const { query } = require("../db");

const router = Router();

const SESSION_SELECT = `
  SELECT s.*,
         sub.name AS subject_name,
         st.name AS student_name,
         adv.name AS advisor_name,
         r.stars, r.comment AS rating_comment
  FROM sessions s
  JOIN subjects sub ON sub.id = s.subject_id
  JOIN users st ON st.id = s.student_id
  JOIN users adv ON adv.id = s.advisor_id
  LEFT JOIN ratings r ON r.session_id = s.id
`;

router.get("/", async (req, res) => {
  const result = await query(
    `${SESSION_SELECT}
     WHERE s.student_id=$1 OR s.advisor_id=$1
     ORDER BY s.scheduled_at DESC`,
    [req.user.id]
  );
  res.json({ sessions: result.rows });
});

router.patch("/:id/finish", async (req, res) => {
  const current = await query("SELECT * FROM sessions WHERE id=$1", [req.params.id]);
  const session = current.rows[0];
  if (!session) return res.status(404).json({ message: "Sesión no encontrada." });
  if (session.student_id !== req.user.id && session.advisor_id !== req.user.id) {
    return res.status(403).json({ message: "Solo los participantes pueden finalizar la sesión." });
  }
  if (session.status === "finished") {
    return res.json({
      session: (await query(`${SESSION_SELECT} WHERE s.id=$1`, [session.id])).rows[0],
    });
  }
  await query("UPDATE sessions SET status='finished' WHERE id=$1", [session.id]);
  await query("UPDATE tutoring_requests SET status='finished' WHERE id=$1", [session.request_id]);
  res.json({
    session: (await query(`${SESSION_SELECT} WHERE s.id=$1`, [session.id])).rows[0],
  });
});

router.post("/:id/rating", async (req, res) => {
  const stars = Number(req.body?.stars);
  const comment = req.body?.comment ? String(req.body.comment).trim() : null;
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return res.status(400).json({ message: "La valoración debe ser un valor entre 1 y 5 estrellas." });
  }
  const current = await query("SELECT * FROM sessions WHERE id=$1", [req.params.id]);
  const session = current.rows[0];
  if (!session) return res.status(404).json({ message: "Sesión no encontrada." });
  if (session.student_id !== req.user.id) {
    return res.status(403).json({ message: "Solo el estudiante asesorado puede valorar esta sesión." });
  }
  if (session.status !== "finished") {
    return res.status(400).json({ message: "La valoración solo puede realizarse después de finalizar la sesión." });
  }
  const existing = await query("SELECT id FROM ratings WHERE session_id=$1", [session.id]);
  if (existing.rows[0]) {
    return res.status(409).json({ message: "Esta sesión ya fue valorada." });
  }
  await query(
    "INSERT INTO ratings (session_id, student_id, stars, comment) VALUES ($1,$2,$3,$4)",
    [session.id, req.user.id, stars, comment]
  );
  res.status(201).json({
    session: (await query(`${SESSION_SELECT} WHERE s.id=$1`, [session.id])).rows[0],
  });
});

module.exports = router;
