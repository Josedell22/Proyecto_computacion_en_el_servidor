const Router = require("../router");
const { query } = require("../db");

const router = Router();

router.get("/", async (req, res) => {
  const status = req.query.status || "";
  const subjectId = req.query.subjectId ? Number(req.query.subjectId) : null;
  const params = [req.user.id];
  let where = "WHERE (tr.student_id=$1 OR tr.advisor_id=$1)";
  if (status) {
    params.push(status);
    where += ` AND tr.status=$${params.length}`;
  }
  if (subjectId) {
    params.push(subjectId);
    where += ` AND tr.subject_id=$${params.length}`;
  }

  const result = await query(
    `SELECT tr.id, tr.status, tr.description, tr.preferred_at, tr.created_at,
            s.name AS subject_name, s.id AS subject_id,
            st.name AS student_name, adv.name AS advisor_name,
            sess.id AS session_id, sess.scheduled_at, sess.status AS session_status,
            r.stars, CASE WHEN r.id IS NULL THEN FALSE ELSE TRUE END AS rated
     FROM tutoring_requests tr
     JOIN subjects s ON s.id = tr.subject_id
     JOIN users st ON st.id = tr.student_id
     LEFT JOIN users adv ON adv.id = tr.advisor_id
     LEFT JOIN sessions sess ON sess.request_id = tr.id
     LEFT JOIN ratings r ON r.session_id = sess.id
     ${where}
     ORDER BY COALESCE(sess.scheduled_at, tr.created_at) DESC`,
    params
  );
  res.json({ history: result.rows });
});

module.exports = router;
