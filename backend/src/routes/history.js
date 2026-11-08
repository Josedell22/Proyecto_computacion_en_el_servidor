const Router = require("../router");
const { query } = require("../db");
const {
  HISTORY_ROLES,
  REQUEST_STATUSES,
  parseDateBoundary,
  parsePositiveId,
} = require("../academicValidation");

const router = Router();

router.get("/", async (req, res) => {
  const status = req.query.status || "";
  const role = req.query.role || "";
  const subjectId = req.query.subjectId ? parsePositiveId(req.query.subjectId) : null;
  const from = parseDateBoundary(req.query.dateFrom || "");
  const to = parseDateBoundary(req.query.dateTo || "", true);
  if (status && !REQUEST_STATUSES.includes(status)) {
    return res.status(400).json({ message: "El estado seleccionado no es válido." });
  }
  if (role && !HISTORY_ROLES.includes(role)) {
    return res.status(400).json({ message: "El rol seleccionado no es válido." });
  }
  if (req.query.subjectId && !subjectId) {
    return res.status(400).json({ message: "La materia seleccionada no es válida." });
  }
  if (from.error || to.error) {
    return res.status(400).json({ message: from.error || to.error });
  }
  if (from.value && to.value && from.value > to.value) {
    return res.status(400).json({ message: "La fecha inicial no puede ser posterior a la fecha final." });
  }
  const params = [req.user.id];
  let where = "WHERE (tr.student_id=$1 OR tr.advisor_id=$1)";
  if (role === "student") where += " AND tr.student_id=$1";
  if (role === "advisor") where += " AND tr.advisor_id=$1";
  if (status) {
    params.push(status);
    where += ` AND tr.status=$${params.length}`;
  }
  if (subjectId) {
    params.push(subjectId);
    where += ` AND tr.subject_id=$${params.length}`;
  }
  if (from.value) {
    params.push(from.value);
    where += ` AND COALESCE(sess.scheduled_at, tr.preferred_at, tr.created_at) >= $${params.length}`;
  }
  if (to.value) {
    params.push(to.value);
    where += ` AND COALESCE(sess.scheduled_at, tr.preferred_at, tr.created_at) <= $${params.length}`;
  }

  const result = await query(
    `SELECT tr.id, tr.student_id, tr.advisor_id, tr.status, tr.description,
            tr.preferred_at, tr.created_at,
            s.name AS subject_name, s.id AS subject_id,
            st.name AS student_name, adv.name AS advisor_name,
            sess.id AS session_id, sess.scheduled_at, sess.status AS session_status,
            r.stars, r.comment AS rating_comment, CASE WHEN r.id IS NULL THEN FALSE ELSE TRUE END AS rated
     FROM tutoring_requests tr
     JOIN subjects s ON s.id = tr.subject_id
     JOIN users st ON st.id = tr.student_id
     LEFT JOIN users adv ON adv.id = tr.advisor_id
     LEFT JOIN sessions sess ON sess.request_id = tr.id
     LEFT JOIN ratings r ON r.session_id = sess.id
     ${where}
     ORDER BY COALESCE(sess.scheduled_at, tr.preferred_at, tr.created_at) DESC, tr.id DESC`,
    params
  );
  const subjects = await query(
    `SELECT DISTINCT s.id, s.name FROM tutoring_requests tr
     JOIN subjects s ON s.id=tr.subject_id
     WHERE tr.student_id=$1 OR tr.advisor_id=$1 ORDER BY s.name`,
    [req.user.id]
  );
  res.json({
    subjects: subjects.rows,
    history: result.rows.map((item) => ({
      ...item,
      participation_role: item.student_id === req.user.id ? "student" : "advisor",
    })),
  });
});

module.exports = router;
