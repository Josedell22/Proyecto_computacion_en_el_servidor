const Router = require("../router");
const { query } = require("../db");

const router = Router();
const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function mapSlot(row) {
  return { ...row, weekdayLabel: WEEKDAYS[row.weekday] };
}

async function overlaps(userId, weekday, start, end, excludeId) {
  const result = await query(
    `SELECT id FROM availability
     WHERE user_id=$1 AND weekday=$2
       AND NOT (end_time <= $3::time OR start_time >= $4::time)
       AND ($5::int IS NULL OR id <> $5)`,
    [userId, weekday, start, end, excludeId || null]
  );
  return result.rows[0];
}

router.get("/", async (req, res) => {
  const result = await query(
    "SELECT * FROM availability WHERE user_id=$1 ORDER BY weekday, start_time",
    [req.user.id]
  );
  res.json({ availability: result.rows.map(mapSlot) });
});

router.post("/", async (req, res) => {
  const weekday = Number(req.body?.weekday);
  const { startTime, endTime } = req.body || {};
  if (Number.isNaN(weekday) || weekday < 0 || weekday > 6 || !startTime || !endTime) {
    return res.status(400).json({ message: "Día y horario son obligatorios." });
  }
  if (endTime <= startTime) {
    return res.status(400).json({ message: "La hora de fin debe ser posterior a la de inicio." });
  }
  if (await overlaps(req.user.id, weekday, startTime, endTime)) {
    return res.status(409).json({ message: "El horario se cruza con otro ya registrado." });
  }
  const created = await query(
    `INSERT INTO availability (user_id, weekday, start_time, end_time)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.id, weekday, startTime, endTime]
  );
  res.status(201).json({ slot: mapSlot(created.rows[0]) });
});

router.put("/:id", async (req, res) => {
  const current = await query("SELECT * FROM availability WHERE id=$1 AND user_id=$2", [
    req.params.id,
    req.user.id,
  ]);
  if (!current.rows[0]) return res.status(404).json({ message: "Horario no encontrado." });
  const weekday = req.body.weekday != null ? Number(req.body.weekday) : current.rows[0].weekday;
  const startTime = req.body.startTime || current.rows[0].start_time;
  const endTime = req.body.endTime || current.rows[0].end_time;
  if (endTime <= startTime) {
    return res.status(400).json({ message: "La hora de fin debe ser posterior a la de inicio." });
  }
  if (await overlaps(req.user.id, weekday, startTime, endTime, current.rows[0].id)) {
    return res.status(409).json({ message: "El horario se cruza con otro ya registrado." });
  }
  const updated = await query(
    "UPDATE availability SET weekday=$1, start_time=$2, end_time=$3 WHERE id=$4 RETURNING *",
    [weekday, startTime, endTime, req.params.id]
  );
  res.json({ slot: mapSlot(updated.rows[0]) });
});

router.delete("/:id", async (req, res) => {
  const deleted = await query("DELETE FROM availability WHERE id=$1 AND user_id=$2 RETURNING id", [
    req.params.id,
    req.user.id,
  ]);
  if (!deleted.rows[0]) return res.status(404).json({ message: "Horario no encontrado." });
  res.json({ ok: true });
});

module.exports = router;
