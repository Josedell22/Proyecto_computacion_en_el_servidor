const Router = require("../router");
const { query, withTransaction } = require("../db");
const { parsePositiveId } = require("../academicValidation");

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
  const sessionId = parsePositiveId(req.params.id);
  if (!sessionId) return res.status(400).json({ message: "La sesión indicada no es válida." });
  await withTransaction(async (client) => {
    const current = await client.query("SELECT * FROM sessions WHERE id=$1 FOR UPDATE", [sessionId]);
    const session = current.rows[0];
    if (!session) {
      const error = new Error("Sesión no encontrada.");
      error.status = 404;
      throw error;
    }
    if (session.student_id !== req.user.id && session.advisor_id !== req.user.id) {
      const error = new Error("Solo los participantes pueden finalizar la sesión.");
      error.status = 403;
      throw error;
    }
    if (session.status !== "finished") {
      await client.query("UPDATE sessions SET status='finished' WHERE id=$1", [session.id]);
      await client.query("UPDATE tutoring_requests SET status='finished' WHERE id=$1", [session.request_id]);
    }
  });
  res.json({
    session: (await query(`${SESSION_SELECT} WHERE s.id=$1`, [sessionId])).rows[0],
  });
});

router.post("/:id/rating", async (req, res) => {
  const sessionId = parsePositiveId(req.params.id);
  const rawStars = req.body?.stars;
  const stars = ["number", "string"].includes(typeof rawStars) ? Number(rawStars) : NaN;
  if (req.body?.comment != null && typeof req.body.comment !== "string") {
    return res.status(400).json({ message: "El comentario debe ser texto." });
  }
  const comment = req.body?.comment?.trim() || null;
  if (!sessionId) return res.status(400).json({ message: "La sesión indicada no es válida." });
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return res.status(400).json({ message: "La valoración debe ser un valor entre 1 y 5 estrellas." });
  }
  if (comment && comment.length > 800) {
    return res.status(400).json({ message: "El comentario no puede superar los 800 caracteres." });
  }
  await withTransaction(async (client) => {
    const current = await client.query("SELECT * FROM sessions WHERE id=$1 FOR UPDATE", [sessionId]);
    const session = current.rows[0];
    if (!session) {
      const error = new Error("Sesión no encontrada.");
      error.status = 404;
      throw error;
    }
    if (session.student_id !== req.user.id) {
      const error = new Error("Solo el estudiante asesorado puede valorar esta sesión.");
      error.status = 403;
      throw error;
    }
    if (session.status !== "finished") {
      const error = new Error("La valoración solo puede realizarse después de finalizar la sesión.");
      error.status = 400;
      throw error;
    }
    const existing = await client.query("SELECT id FROM ratings WHERE session_id=$1", [session.id]);
    if (existing.rows[0]) {
      const error = new Error("Esta sesión ya fue valorada.");
      error.status = 409;
      throw error;
    }
    await client.query(
      "INSERT INTO ratings (session_id, student_id, stars, comment) VALUES ($1,$2,$3,$4)",
      [session.id, req.user.id, stars, comment]
    );
  });
  res.status(201).json({
    session: (await query(`${SESSION_SELECT} WHERE s.id=$1`, [sessionId])).rows[0],
  });
});

module.exports = router;
