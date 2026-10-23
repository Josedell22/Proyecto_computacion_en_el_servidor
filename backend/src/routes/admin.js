const Router = require("../router");
const { query } = require("../db");

const router = Router();

router.get("/users", async (req, res) => {
  const result = await query(
    `SELECT id, name, email, role, program, semester, is_active, created_at
     FROM users ORDER BY created_at DESC`
  );
  res.json({ users: result.rows });
});

router.patch("/users/:id/status", async (req, res) => {
  const isActive = Boolean(req.body?.isActive);
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ message: "No puede desactivar su propia cuenta." });
  }
  const updated = await query("UPDATE users SET is_active=$1 WHERE id=$2 RETURNING id, name, email, is_active", [
    isActive,
    req.params.id,
  ]);
  if (!updated.rows[0]) return res.status(404).json({ message: "Usuario no encontrado." });
  res.json({ user: updated.rows[0] });
});

router.get("/requests", async (_req, res) => {
  const result = await query(
    `SELECT tr.id, tr.status, tr.created_at, s.name AS subject_name,
            st.name AS student_name, adv.name AS advisor_name
     FROM tutoring_requests tr
     JOIN subjects s ON s.id=tr.subject_id
     JOIN users st ON st.id=tr.student_id
     LEFT JOIN users adv ON adv.id=tr.advisor_id
     ORDER BY tr.created_at DESC`
  );
  res.json({ requests: result.rows });
});

router.get("/reports", async (_req, res) => {
  const result = await query(
    `SELECT r.*, p.title, p.is_active AS publication_active, u.name AS reporter_name, a.name AS author_name
     FROM reports r
     JOIN publications p ON p.id = r.publication_id
     JOIN users u ON u.id = r.reporter_id
     JOIN users a ON a.id = p.user_id
     ORDER BY r.created_at DESC`
  );
  res.json({ reports: result.rows });
});

router.patch("/reports/:id", async (req, res) => {
  const action = req.body?.action;
  const current = await query("SELECT * FROM reports WHERE id=$1", [req.params.id]);
  const report = current.rows[0];
  if (!report) return res.status(404).json({ message: "Reporte no encontrado." });

  if (action === "keep") {
    await query("UPDATE reports SET status='kept' WHERE id=$1", [report.id]);
  } else if (action === "remove") {
    await query("UPDATE publications SET is_active=FALSE WHERE id=$1", [report.publication_id]);
    await query("UPDATE reports SET status='removed' WHERE publication_id=$1 AND status='active'", [
      report.publication_id,
    ]);
  } else if (action === "dismiss") {
    await query("UPDATE reports SET status='dismissed' WHERE id=$1", [report.id]);
  } else {
    return res.status(400).json({ message: "Acción de moderación no válida." });
  }
  res.json({ ok: true });
});

module.exports = router;
