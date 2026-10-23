const jwt = require("jsonwebtoken");
const { query } = require("../db");

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: "Debe iniciar sesión para continuar." });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ message: "La sesión no es válida o expiró." });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Solo el administrador puede realizar esta operación." });
  }
  next();
}

async function loadUser(req, res, next) {
  const result = await query(
    "SELECT id, name, email, role, program, semester, bio, is_active FROM users WHERE id=$1",
    [req.user.id]
  );
  if (!result.rows[0] || !result.rows[0].is_active) {
    return res.status(403).json({ message: "La cuenta no está activa." });
  }
  req.account = result.rows[0];
  next();
}

module.exports = { signToken, requireAuth, requireAdmin, loadUser };
