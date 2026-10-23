const path = require("path");
const Router = require("../router");
const fs = require("fs");
const multer = require("multer");
const { query } = require("../db");
const { REPORT_REASONS } = require("../utils");

const router = Router();
const uploadDir = path.join(__dirname, "..", "..", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
]);
const ALLOWED_EXT = new Set([".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED.has(file.mimetype) || !ALLOWED_EXT.has(ext)) {
      return cb(new Error("Formato no permitido. Use PDF, DOC, DOCX, PNG o JPG de máximo 5 MB."));
    }
    cb(null, true);
  },
});

function mapPub(row) {
  return {
    ...row,
    fileUrl: row.file_path ? `/uploads/${path.basename(row.file_path)}` : null,
  };
}

router.get("/", async (req, res) => {
  const q = (req.query.q || "").trim();
  const subjectId = req.query.subjectId ? Number(req.query.subjectId) : null;
  const params = [];
  let sql = `
    SELECT p.*, s.name AS subject_name, u.name AS author_name
    FROM publications p
    JOIN subjects s ON s.id = p.subject_id
    JOIN users u ON u.id = p.user_id
    WHERE p.is_active=TRUE`;
  if (q) {
    params.push(`%${q}%`);
    sql += ` AND (LOWER(p.title) LIKE LOWER($${params.length}) OR LOWER(s.name) LIKE LOWER($${params.length}))`;
  }
  if (subjectId) {
    params.push(subjectId);
    sql += ` AND p.subject_id=$${params.length}`;
  }
  sql += " ORDER BY p.created_at DESC";
  const result = await query(sql, params);
  res.json({ publications: result.rows.map(mapPub) });
});

router.get("/:id", async (req, res) => {
  const result = await query(
    `SELECT p.*, s.name AS subject_name, u.name AS author_name
     FROM publications p
     JOIN subjects s ON s.id = p.subject_id
     JOIN users u ON u.id = p.user_id
     WHERE p.id=$1`,
    [req.params.id]
  );
  const pub = result.rows[0];
  if (!pub || (!pub.is_active && req.user.role !== "admin" && pub.user_id !== req.user.id)) {
    return res.status(404).json({ message: "Publicación no encontrada." });
  }
  const mine = await query(
    "SELECT id FROM reports WHERE publication_id=$1 AND reporter_id=$2 AND status='active'",
    [pub.id, req.user.id]
  );
  res.json({ publication: mapPub(pub), alreadyReported: Boolean(mine.rows[0]) });
});

function handleUpload(req, res, next) {
  upload.single("file")(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "El archivo supera el límite de 5 MB." });
    }
    return res.status(400).json({ message: err.message });
  });
}

router.post("/", handleUpload, async (req, res) => {
  const { title, description, content, subjectId } = req.body || {};
  if (!title || !description || !subjectId) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(400).json({
      message: "Título, descripción y materia son obligatorios.",
    });
  }
  const subject = await query("SELECT id FROM subjects WHERE id=$1 AND is_active=TRUE", [subjectId]);
  if (!subject.rows[0]) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(400).json({ message: "La publicación debe estar asociada a una materia activa." });
  }
  if (!req.file && !content) {
    return res.status(400).json({ message: "Debe incluir contenido o un archivo válido." });
  }
  const created = await query(
    `INSERT INTO publications (user_id, subject_id, title, description, content, file_path, original_name)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [
      req.user.id,
      subjectId,
      String(title).trim(),
      String(description).trim(),
      content || null,
      req.file?.path || null,
      req.file?.originalname || null,
    ]
  );
  const full = await query(
    `SELECT p.*, s.name AS subject_name, u.name AS author_name
     FROM publications p JOIN subjects s ON s.id=p.subject_id JOIN users u ON u.id=p.user_id
     WHERE p.id=$1`,
    [created.rows[0].id]
  );
  res.status(201).json({ publication: mapPub(full.rows[0]) });
});

router.put("/:id", handleUpload, async (req, res) => {
  const current = await query("SELECT * FROM publications WHERE id=$1", [req.params.id]);
  const pub = current.rows[0];
  if (!pub) return res.status(404).json({ message: "Publicación no encontrada." });
  if (pub.user_id !== req.user.id) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(403).json({ message: "Solo puede modificar sus propias publicaciones." });
  }
  const title = req.body.title != null ? String(req.body.title).trim() : pub.title;
  const description = req.body.description != null ? String(req.body.description).trim() : pub.description;
  const content = req.body.content !== undefined ? req.body.content : pub.content;
  const subjectId = req.body.subjectId || pub.subject_id;
  const subject = await query("SELECT id FROM subjects WHERE id=$1 AND is_active=TRUE", [subjectId]);
  if (!subject.rows[0]) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(400).json({ message: "La materia seleccionada no está disponible." });
  }
  let filePath = pub.file_path;
  let originalName = pub.original_name;
  if (req.file) {
    if (pub.file_path) fs.unlink(pub.file_path, () => {});
    filePath = req.file.path;
    originalName = req.file.originalname;
  }
  await query(
    `UPDATE publications SET title=$1, description=$2, content=$3, subject_id=$4, file_path=$5, original_name=$6
     WHERE id=$7`,
    [title, description, content, subjectId, filePath, originalName, pub.id]
  );
  const full = await query(
    `SELECT p.*, s.name AS subject_name, u.name AS author_name
     FROM publications p JOIN subjects s ON s.id=p.subject_id JOIN users u ON u.id=p.user_id
     WHERE p.id=$1`,
    [pub.id]
  );
  res.json({ publication: mapPub(full.rows[0]) });
});

router.delete("/:id", async (req, res) => {
  const current = await query("SELECT * FROM publications WHERE id=$1", [req.params.id]);
  const pub = current.rows[0];
  if (!pub) return res.status(404).json({ message: "Publicación no encontrada." });
  if (pub.user_id !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ message: "Solo puede eliminar sus propias publicaciones." });
  }
  await query("DELETE FROM publications WHERE id=$1", [pub.id]);
  if (pub.file_path) fs.unlink(pub.file_path, () => {});
  res.json({ ok: true });
});

router.post("/:id/report", async (req, res) => {
  const reason = req.body?.reason;
  const details = req.body?.details || null;
  if (!REPORT_REASONS.includes(reason)) {
    return res.status(400).json({ message: "Debe indicar un motivo de reporte válido." });
  }
  const pub = await query("SELECT * FROM publications WHERE id=$1 AND is_active=TRUE", [req.params.id]);
  if (!pub.rows[0]) return res.status(404).json({ message: "Publicación no encontrada." });
  if (pub.rows[0].user_id === req.user.id) {
    return res.status(400).json({ message: "No puede reportar su propia publicación." });
  }
  const dup = await query(
    "SELECT id FROM reports WHERE publication_id=$1 AND reporter_id=$2 AND status='active'",
    [req.params.id, req.user.id]
  );
  if (dup.rows[0]) {
    return res.status(409).json({ message: "Ya tiene un reporte activo sobre esta publicación." });
  }
  const created = await query(
    `INSERT INTO reports (publication_id, reporter_id, reason, details)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.params.id, req.user.id, reason, details]
  );
  res.status(201).json({ report: created.rows[0] });
});

module.exports = router;
