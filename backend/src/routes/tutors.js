const Router = require("../router");
const { query } = require("../db");

const router = Router();

const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

router.get("/", async (req, res) => {
  const subjectId = Number(req.query.subjectId);
  if (!subjectId) {
    return res.status(400).json({ message: "Debe seleccionar una materia." });
  }
  const subject = await query("SELECT * FROM subjects WHERE id=$1 AND is_active=TRUE", [subjectId]);
  if (!subject.rows[0]) {
    return res.status(400).json({ message: "La materia no está disponible." });
  }

  const result = await query(
    `SELECT u.id, u.name, u.program, u.semester, u.bio,
            COALESCE(AVG(r.stars), 0)::numeric(3,2) AS avg_rating,
            COUNT(r.id)::int AS rating_count
     FROM users u
     JOIN student_subjects ss ON ss.user_id = u.id
     LEFT JOIN sessions s ON s.advisor_id = u.id AND s.status = 'finished'
     LEFT JOIN ratings r ON r.session_id = s.id
     WHERE ss.subject_id = $1
       AND u.role = 'student'
       AND u.is_active = TRUE
       AND u.id <> $2
     GROUP BY u.id
     ORDER BY avg_rating DESC, u.name`,
    [subjectId, req.user.id]
  );
  res.json({ tutors: result.rows, subject: subject.rows[0] });
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
    `SELECT s.id, s.name FROM student_subjects ss
     JOIN subjects s ON s.id=ss.subject_id
     WHERE ss.user_id=$1 AND s.is_active=TRUE ORDER BY s.name`,
    [req.params.id]
  );
  const slots = await query(
    "SELECT id, weekday, start_time, end_time FROM availability WHERE user_id=$1 ORDER BY weekday, start_time",
    [req.params.id]
  );
  res.json({
    tutor: user.rows[0],
    subjects: subjects.rows,
    availability: slots.rows.map((row) => ({
      ...row,
      weekdayLabel: WEEKDAYS[row.weekday],
    })),
  });
});

module.exports = router;
