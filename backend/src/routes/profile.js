const Router = require("../router");
const { query } = require("../db");
const { publicUser, profileStatus } = require("../utils");

const router = Router();

async function withProfile(userId) {
  const user = await query(
    "SELECT id, name, email, role, program, semester, bio, is_active, created_at FROM users WHERE id=$1",
    [userId]
  );
  const subjects = await query(
    `SELECT s.id, s.name, s.description
     FROM student_subjects ss JOIN subjects s ON s.id = ss.subject_id
     WHERE ss.user_id=$1 AND s.is_active=TRUE
     ORDER BY s.name`,
    [userId]
  );
  const account = user.rows[0];
  return {
    user: publicUser(account),
    subjects: subjects.rows,
    profile: profileStatus(account, subjects.rows.length),
  };
}

router.get("/", async (req, res) => {
  res.json(await withProfile(req.user.id));
});

router.put("/", async (req, res) => {
  const { name, program, semester, bio } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: "El nombre es obligatorio." });
  }
  const sem = semester === "" || semester == null ? null : Number(semester);
  if (sem != null && (Number.isNaN(sem) || sem < 1 || sem > 20)) {
    return res.status(400).json({ message: "El semestre debe estar entre 1 y 20." });
  }
  await query("UPDATE users SET name=$1, program=$2, semester=$3, bio=$4 WHERE id=$5", [
    String(name).trim(),
    program ? String(program).trim() : null,
    sem,
    bio ? String(bio).trim() : null,
    req.user.id,
  ]);
  res.json(await withProfile(req.user.id));
});

router.put("/subjects", async (req, res) => {
  const subjectIds = Array.isArray(req.body?.subjectIds) ? req.body.subjectIds.map(Number) : [];
  if (subjectIds.some((id) => Number.isNaN(id))) {
    return res.status(400).json({ message: "Las materias seleccionadas no son válidas." });
  }
  if (subjectIds.length) {
    const found = await query(
      "SELECT id FROM subjects WHERE id = ANY($1::int[]) AND is_active=TRUE",
      [subjectIds]
    );
    if (found.rows.length !== subjectIds.length) {
      return res.status(400).json({ message: "Solo puede seleccionar materias activas existentes." });
    }
  }
  await query("DELETE FROM student_subjects WHERE user_id=$1", [req.user.id]);
  for (const id of subjectIds) {
    await query("INSERT INTO student_subjects (user_id, subject_id) VALUES ($1, $2)", [req.user.id, id]);
  }
  res.json(await withProfile(req.user.id));
});

module.exports = router;
