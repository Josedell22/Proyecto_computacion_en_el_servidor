const Router = require("../router");
const { query } = require("../db");

const router = Router();

const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function mapSlot(row) {
  return { ...row, weekdayLabel: WEEKDAYS[row.weekday] };
}

router.get("/", async (req, res) => {
  const subjectId = req.query.subjectId ? Number(req.query.subjectId) : null;
  if (req.query.subjectId && !subjectId) {
    return res.status(400).json({ message: "Debe seleccionar una materia válida." });
  }

  let subject = null;
  if (subjectId) {
    const found = await query("SELECT * FROM subjects WHERE id=$1 AND is_active=TRUE", [subjectId]);
    if (!found.rows[0]) {
      return res.status(400).json({ message: "La materia no está disponible." });
    }
    subject = found.rows[0];
  }

  const onlyAvailable = req.query.available === "1";
  const params = [req.user.id];
  let subjectFilter = "";
  if (subjectId) {
    params.push(subjectId);
    subjectFilter = `AND EXISTS (
      SELECT 1 FROM student_subjects ss
      JOIN subjects s ON s.id = ss.subject_id AND s.is_active = TRUE
      WHERE ss.user_id = u.id AND ss.subject_id = $${params.length}
    )`;
  }

  const result = await query(
    `SELECT u.id, u.name, u.program, u.semester, u.bio,
            COALESCE(rating.avg_rating, 0)::numeric(3,2) AS avg_rating,
            COALESCE(rating.rating_count, 0)::int AS rating_count,
            COALESCE(slots.slot_count, 0)::int AS slot_count,
            COALESCE(subs.subjects, '[]'::json) AS subjects
     FROM users u
     JOIN LATERAL (
       SELECT json_agg(json_build_object('id', s.id, 'name', s.name) ORDER BY s.name) AS subjects
       FROM student_subjects ss
       JOIN subjects s ON s.id = ss.subject_id AND s.is_active = TRUE
       WHERE ss.user_id = u.id
     ) subs ON TRUE
     LEFT JOIN LATERAL (
       SELECT AVG(r.stars)::numeric(3,2) AS avg_rating, COUNT(r.id)::int AS rating_count
       FROM sessions sess
       JOIN ratings r ON r.session_id = sess.id
       WHERE sess.advisor_id = u.id AND sess.status = 'finished'
     ) rating ON TRUE
     LEFT JOIN LATERAL (
       SELECT COUNT(*)::int AS slot_count FROM availability a WHERE a.user_id = u.id
     ) slots ON TRUE
     WHERE u.role = 'student'
       AND u.is_active = TRUE
       AND u.id <> $1
       AND subs.subjects IS NOT NULL
       ${subjectFilter}
       ${onlyAvailable ? "AND COALESCE(slots.slot_count, 0) > 0" : ""}
     ORDER BY COALESCE(rating.avg_rating, 0) DESC, u.name`,
    params
  );

  res.json({
    tutors: result.rows,
    subject,
    message: result.rows.length === 0 ? "No hay estudiantes disponibles." : undefined,
  });
});

router.get("/:id", async (req, res) => {
  const user = await query(
    `SELECT u.id, u.name, u.program, u.semester, u.bio,
            COALESCE(AVG(r.stars), 0)::numeric(3,2) AS avg_rating,
            COUNT(r.id)::int AS rating_count
     FROM users u
     LEFT JOIN sessions s ON s.advisor_id = u.id AND s.status = 'finished'
     LEFT JOIN ratings r ON r.session_id = s.id
     WHERE u.id=$1 AND u.role='student' AND u.is_active=TRUE
     GROUP BY u.id`,
    [req.params.id]
  );
  if (!user.rows[0]) return res.status(404).json({ message: "Estudiante no encontrado." });

  const subjects = await query(
    `SELECT s.id, s.name, s.description FROM student_subjects ss
     JOIN subjects s ON s.id=ss.subject_id
     WHERE ss.user_id=$1 AND s.is_active=TRUE ORDER BY s.name`,
    [req.params.id]
  );
  const slots = await query(
    "SELECT id, weekday, start_time, end_time FROM availability WHERE user_id=$1 ORDER BY weekday, start_time",
    [req.params.id]
  );
  const ratings = await query(
    `SELECT r.id, r.stars, r.comment, r.created_at,
            sub.name AS subject_name
     FROM ratings r
     JOIN sessions sess ON sess.id = r.session_id
     JOIN subjects sub ON sub.id = sess.subject_id
     WHERE sess.advisor_id=$1
     ORDER BY r.created_at DESC`,
    [req.params.id]
  );

  res.json({
    tutor: user.rows[0],
    subjects: subjects.rows,
    availability: slots.rows.map(mapSlot),
    ratings: ratings.rows,
  });
});

module.exports = router;
