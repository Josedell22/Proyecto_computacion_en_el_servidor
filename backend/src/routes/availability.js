const Router = require("../router");
const { query, withTransaction } = require("../db");
const { httpError, parsePositiveId, validateAvailabilitySlot } = require("../academicValidation");

const router = Router();
const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const mapSlot = (row) => ({ ...row, weekdayLabel: WEEKDAYS[row.weekday] });

router.use("/:id", (req, res, next) => {
  if (!parsePositiveId(req.params.id)) return res.status(400).json({ message: "El horario indicado no es válido." });
  next();
});

router.get("/", async (req, res) => {
  const result = await query("SELECT * FROM availability WHERE user_id=$1 ORDER BY weekday, start_time", [req.user.id]);
  res.json({ availability: result.rows.map(mapSlot) });
});

async function save(req, id) {
  return withTransaction(async (client) => {
    // All schedule writes for the same owner share this transaction lock.
    await client.query("SELECT pg_advisory_xact_lock(4103, $1)", [req.user.id]);
    let current = {};
    if (id) {
      current = (await client.query("SELECT * FROM availability WHERE id=$1 AND user_id=$2", [id, req.user.id])).rows[0];
      if (!current) throw httpError(404, "Horario no encontrado.");
    }
    const body = req.body || {};
    const validation = validateAvailabilitySlot({
      weekday: body.weekday === undefined ? current.weekday : body.weekday,
      startTime: body.startTime === undefined ? current.start_time : body.startTime,
      endTime: body.endTime === undefined ? current.end_time : body.endTime,
    });
    if (validation.error) throw httpError(400, validation.error);
    const { weekday, startTime, endTime } = validation.value;
    const overlap = await client.query(
      `SELECT id FROM availability WHERE user_id=$1 AND weekday=$2
       AND end_time > $3::time AND start_time < $4::time
       AND ($5::int IS NULL OR id <> $5)`,
      [req.user.id, weekday, startTime, endTime, id]
    );
    if (overlap.rowCount) throw httpError(409, "El horario se cruza con otro ya registrado.");
    const saved = id
      ? await client.query("UPDATE availability SET weekday=$1, start_time=$2, end_time=$3 WHERE id=$4 AND user_id=$5 RETURNING *",
        [weekday, startTime, endTime, id, req.user.id])
      : await client.query("INSERT INTO availability (user_id, weekday, start_time, end_time) VALUES ($1,$2,$3,$4) RETURNING *",
        [req.user.id, weekday, startTime, endTime]);
    return mapSlot(saved.rows[0]);
  });
}

router.post("/", async (req, res) => res.status(201).json({ slot: await save(req, null) }));
router.put("/:id", async (req, res) => res.json({ slot: await save(req, Number(req.params.id)) }));
router.delete("/:id", async (req, res) => {
  await withTransaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(4103, $1)", [req.user.id]);
    const result = await client.query("DELETE FROM availability WHERE id=$1 AND user_id=$2 RETURNING id", [req.params.id, req.user.id]);
    if (!result.rowCount) throw httpError(404, "Horario no encontrado.");
  });
  res.json({ ok: true });
});

module.exports = router;
