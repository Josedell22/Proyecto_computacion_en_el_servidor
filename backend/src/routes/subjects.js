const Router = require("../router");
const { query } = require("../db");
const { requireAdmin } = require("../middleware/auth");

const router = Router();

router.get("/", async (req, res) => {
  const q = (req.query.q || "").trim();
  const includeInactive = req.user?.role === "admin" && req.query.all === "1";
  const params = [];
  let sql = "SELECT * FROM subjects WHERE 1=1";
  if (!includeInactive) {
    sql += " AND is_active=TRUE";
  }
  if (q) {
    params.push(`%${q}%`);
    sql += ` AND LOWER(name) LIKE LOWER($${params.length})`;
  }
  sql += " ORDER BY name";
  const result = await query(sql, params);
  if (q && result.rows.length === 0) {
    return res.json({ subjects: [], message: "No se encontraron materias." });
  }
  res.json({ subjects: result.rows });
});

router.post("/", requireAdmin, async (req, res) => {
  const { name, description } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: "El nombre de la materia es obligatorio." });
  }
  try {
    const created = await query(
      "INSERT INTO subjects (name, description) VALUES ($1, $2) RETURNING *",
      [String(name).trim(), description || null]
    );
    res.status(201).json({ subject: created.rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ message: "Ya existe una materia con ese nombre." });
    }
    throw err;
  }
});

router.put("/:id", requireAdmin, async (req, res) => {
  const { name, description, isActive } = req.body || {};
  const current = await query("SELECT * FROM subjects WHERE id=$1", [req.params.id]);
  if (!current.rows[0]) return res.status(404).json({ message: "Materia no encontrada." });
  const nextName = name != null ? String(name).trim() : current.rows[0].name;
  const nextDesc = description !== undefined ? description : current.rows[0].description;
  const nextActive = isActive !== undefined ? Boolean(isActive) : current.rows[0].is_active;
  if (!nextName) return res.status(400).json({ message: "El nombre de la materia es obligatorio." });
  const updated = await query(
    "UPDATE subjects SET name=$1, description=$2, is_active=$3 WHERE id=$4 RETURNING *",
    [nextName, nextDesc, nextActive, req.params.id]
  );
  res.json({ subject: updated.rows[0] });
});

module.exports = router;
