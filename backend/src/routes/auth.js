const bcrypt = require("bcrypt");
const Router = require("../router");
const { query } = require("../db");
const { signToken, requireAuth, loadUser } = require("../middleware/auth");
const { isValidEmail, isValidPassword, publicUser, profileStatus } = require("../utils");

const router = Router();

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Nombre, correo y contraseña son obligatorios." });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({ message: "El correo electrónico no tiene un formato válido." });
  }
  if (!isValidPassword(password)) {
    return res.status(400).json({
      message: "La contraseña debe tener al menos 8 caracteres, una letra y un número.",
    });
  }

  const existing = await query("SELECT id FROM users WHERE LOWER(email)=LOWER($1)", [normalizedEmail]);
  if (existing.rows[0]) {
    return res.status(409).json({ message: "Este correo ya está registrado." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  let created;
  try {
    created = await query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role, program, semester, bio, is_active, created_at`,
      [String(name).trim(), normalizedEmail, passwordHash]
    );
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ message: "Este correo ya está registrado." });
    }
    throw err;
  }
  const user = created.rows[0];
  const token = signToken(user);
  res.status(201).json({ token, user: publicUser(user) });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "Correo y contraseña son obligatorios." });
  }
  const result = await query("SELECT * FROM users WHERE LOWER(email)=LOWER($1)", [email]);
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ message: "Los datos de acceso no son válidos." });
  }
  if (!user.is_active) {
    return res.status(403).json({ message: "Esta cuenta fue desactivada." });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get("/me", requireAuth, loadUser, async (req, res) => {
  const count = await query("SELECT COUNT(*)::int AS n FROM student_subjects WHERE user_id=$1", [
    req.account.id,
  ]);
  res.json({
    user: publicUser(req.account),
    profile: profileStatus(req.account, count.rows[0].n),
  });
});

module.exports = router;
