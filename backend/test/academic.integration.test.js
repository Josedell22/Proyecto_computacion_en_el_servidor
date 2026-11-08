const assert = require("node:assert/strict");
const { test, before, after } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");
const { randomUUID } = require("node:crypto");

const url = new URL(process.env.TEST_DATABASE_URL || "postgres://studymatch_test:local_test_only@127.0.0.1:55433/studymatch_test");
if (!url.pathname.endsWith("_test")) throw new Error("Use exclusivamente una base cuyo nombre termine en _test.");
const schema = "academic_test_" + randomUUID().replaceAll("-", "");
const admin = new Pool({ connectionString: url.toString() });
let pool, server, origin, signToken;
let sequence = 0;

before(async () => {
  await admin.query('CREATE SCHEMA "' + schema + '"');
  url.searchParams.set("options", "-c search_path=" + schema);
  process.env.DATABASE_URL = url.toString();
  process.env.JWT_SECRET = "isolated-integration-tests-only";
  process.env.NODE_ENV = "test";
  pool = require("../src/db").pool;
  const sql = fs.readFileSync(path.join(__dirname, "../src/schema.sql"), "utf8");
  await pool.query(sql);
  await pool.query(sql); // Schema/index migration must be repeatable.
  signToken = require("../src/middleware/auth").signToken;
  const app = require("../src/index");
  server = await new Promise((resolve) => { const instance = app.listen(0, "127.0.0.1", () => resolve(instance)); });
  origin = "http://127.0.0.1:" + server.address().port;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (pool) await pool.end();
  // Only this suite's generated schema in the explicitly isolated test database.
  await admin.query('DROP SCHEMA IF EXISTS "' + schema + '" CASCADE');
  await admin.end();
});

async function call(user, route, method = "GET", body) {
  const response = await fetch(origin + "/api" + route, {
    method,
    headers: { "Content-Type": "application/json", ...(user ? { Authorization: "Bearer " + signToken(user) } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, data: await response.json() };
}
const future = (hours = 24) => new Date(Date.now() + hours * 3600000).toISOString();

async function fixture() {
  const suffix = ++sequence;
  const users = [];
  for (const name of ["Solicitante", "Asesor", "Asesora", "Externo"]) {
    users.push((await pool.query(
      "INSERT INTO users(name,email,password_hash,program,semester) VALUES($1,$2,'unused','Sistemas',5) RETURNING *",
      [name, name + suffix + "@usco.edu.co"]
    )).rows[0]);
  }
  const subject = (await pool.query("INSERT INTO subjects(name) VALUES($1) RETURNING id", ["Materia " + suffix])).rows[0].id;
  for (const user of users.slice(0, 3)) await pool.query("INSERT INTO student_subjects VALUES($1,$2)", [user.id, subject]);
  return { student: users[0], advisor: users[1], other: users[2], outsider: users[3], subject };
}

async function create(f, overrides = {}) {
  const result = await call(f.student, "/requests", "POST", {
    subjectId: f.subject, description: "Practicar matrices", preferredAt: future(), ...overrides,
  });
  assert.equal(result.status, 201, JSON.stringify(result.data));
  return result.data.request;
}

async function accept(f, request, user = f.advisor, body = {}) {
  const result = await call(user, "/requests/" + request.id + "/accept", "PATCH", body);
  assert.equal(result.status, 200, JSON.stringify(result.data));
  return result.data.session;
}

test("authentication, input validation and isolation of request lists", async () => {
  const f = await fixture();
  assert.equal((await call(null, "/requests")).status, 401);
  for (const patch of [
    { subjectId: true }, { advisorId: 0 }, { advisorId: [] }, { description: {} },
    { description: " ".repeat(8) }, { preferredAt: "2026-02-30T15:00:00Z" },
    { preferredAt: new Date(0).toISOString() }, { subjectId: "999999999999999" },
  ]) assert.equal((await call(f.student, "/requests", "POST", { subjectId: f.subject, description: "Tema", preferredAt: future(), ...patch })).status, 400);
  const request = await create(f);
  assert.equal((await call(f.student, "/requests?scope=open")).data.requests.length, 0);
  assert.equal((await call(f.advisor, "/requests?scope=received")).data.requests.length, 0);
  assert.equal((await call(f.advisor, "/requests?scope=open")).data.requests.length, 1);
  assert.equal((await call(f.outsider, "/requests?scope=open")).data.requests.length, 0);
  assert.equal((await call(f.outsider, "/requests/" + request.id + "/accept", "PATCH")).status, 403);
  assert.equal((await call(f.outsider, "/requests/" + request.id + "/cancel", "PATCH")).status, 404);
  assert.equal((await call(f.student, "/requests?scope=bad")).status, 400);
  for (const action of ["cancel", "reject", "accept"]) assert.equal((await call(f.student, "/requests/nope/" + action, "PATCH")).status, 400);
});

test("concurrent duplicate open/direct requests create one record", async () => {
  const f = await fixture();
  for (const advisorId of [null, f.advisor.id]) {
    const payload = { subjectId: f.subject, advisorId, description: "Duplicada", preferredAt: future() };
    const results = await Promise.all([call(f.student, "/requests", "POST", payload), call(f.student, "/requests", "POST", payload)]);
    assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  }
});

test("direct rejection and cancellation are private and terminal", async () => {
  const f = await fixture();
  const r = await create(f, { advisorId: f.advisor.id });
  assert.equal((await call(f.other, "/requests/" + r.id + "/reject", "PATCH")).status, 404);
  assert.equal((await call(f.advisor, "/requests/" + r.id + "/reject", "PATCH")).status, 200);
  assert.equal((await call(f.advisor, "/requests/" + r.id + "/accept", "PATCH")).status, 409);
  const next = await create(f, { advisorId: f.advisor.id });
  assert.equal((await call(f.student, "/requests/" + next.id + "/cancel", "PATCH")).status, 200);
  assert.equal((await call(f.advisor, "/requests?scope=received")).data.requests.find((x) => x.id === next.id).status, "cancelled");
});

test("two advisors claiming an open request create exactly one session", async () => {
  const f = await fixture();
  const r = await create(f);
  const results = await Promise.all([f.advisor, f.other].map((u) => call(u, "/requests/" + r.id + "/accept", "PATCH")));
  assert.equal(results.filter((x) => x.status === 200).length, 1);
  assert.equal((await pool.query("SELECT * FROM sessions WHERE request_id=$1", [r.id])).rowCount, 1);
  assert.equal((await call(f.other, "/requests?scope=open")).data.requests.length, 0);
});

test("accept versus cancel/reject races preserve a consistent request/session pair", async () => {
  for (const action of ["cancel", "reject"]) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const f = await fixture();
      const r = await create(f, { advisorId: f.advisor.id });
      await Promise.all([
        call(f.advisor, "/requests/" + r.id + "/accept", "PATCH"),
        call(action === "cancel" ? f.student : f.advisor, "/requests/" + r.id + "/" + action, "PATCH"),
      ]);
      const row = (await pool.query("SELECT status FROM tutoring_requests WHERE id=$1", [r.id])).rows[0];
      const sessions = await pool.query("SELECT * FROM sessions WHERE request_id=$1", [r.id]);
      assert.equal(sessions.rowCount, row.status === "accepted" ? 1 : 0);
    }
  }
});

test("concurrent bookings protect both participants even across roles", async () => {
  const f = await fixture();
  const at = future();
  const a = await create(f, { advisorId: f.advisor.id, preferredAt: at });
  const b = await create(f, { advisorId: f.other.id, preferredAt: at });
  const responses = await Promise.all([
    call(f.advisor, "/requests/" + a.id + "/accept", "PATCH"),
    call(f.other, "/requests/" + b.id + "/accept", "PATCH"),
  ]);
  assert.deepEqual(responses.map((r) => r.status).sort(), [200, 409]);
  const c = await create({ ...f, student: f.other }, { advisorId: f.student.id, preferredAt: at });
  assert.equal((await call(f.student, "/requests/" + c.id + "/accept", "PATCH")).status, 409);
});

test("failed scheduling rolls back and stale or removed expertise cannot be accepted", async () => {
  const f = await fixture();
  const r = await create(f, { advisorId: f.advisor.id });
  await pool.query("UPDATE tutoring_requests SET preferred_at=NULL WHERE id=$1", [r.id]);
  assert.equal((await call(f.advisor, "/requests/" + r.id + "/accept", "PATCH")).status, 400);
  assert.equal((await pool.query("SELECT status FROM tutoring_requests WHERE id=$1", [r.id])).rows[0].status, "pending");
  await pool.query("DELETE FROM student_subjects WHERE user_id=$1", [f.advisor.id]);
  assert.equal((await call(f.advisor, "/requests/" + r.id + "/accept", "PATCH", { scheduledAt: future() })).status, 403);
  await pool.query("INSERT INTO student_subjects VALUES($1,$2)", [f.advisor.id, f.subject]);
  assert.ok((await accept(f, r, f.advisor, { scheduledAt: future() })).id);
});

test("a failed session insert rolls back the acceptance", async () => {
  const f = await fixture();
  const r = await create(f);
  // Force a database error after the request UPDATE, exclusively in this test schema.
  await pool.query(`CREATE FUNCTION fail_test_session() RETURNS trigger LANGUAGE plpgsql AS
    $$ BEGIN RAISE EXCEPTION 'Intentional rollback test'; END $$`);
  await pool.query("CREATE TRIGGER fail_test_session BEFORE INSERT ON sessions FOR EACH ROW EXECUTE FUNCTION fail_test_session()");
  try {
    assert.equal((await call(f.advisor, "/requests/" + r.id + "/accept", "PATCH")).status, 500);
    assert.equal((await pool.query("SELECT status FROM tutoring_requests WHERE id=$1", [r.id])).rows[0].status, "pending");
    assert.equal((await pool.query("SELECT id FROM sessions WHERE request_id=$1", [r.id])).rowCount, 0);
  } finally {
    await pool.query("DROP TRIGGER fail_test_session ON sessions");
    await pool.query("DROP FUNCTION fail_test_session()");
  }
  assert.ok((await accept(f, r)).id);
});

test("availability create/edit/delete validates ownership, boundaries and concurrent overlaps", async () => {
  const f = await fixture();
  const payload = { weekday: 1, startTime: "14:00", endTime: "16:00" };
  const results = await Promise.all([call(f.advisor, "/availability", "POST", payload), call(f.advisor, "/availability", "POST", payload)]);
  assert.deepEqual(results.map((x) => x.status).sort(), [201, 409]);
  const slot = results.find((x) => x.status === 201).data.slot;
  assert.equal((await call(f.advisor, "/availability", "POST", { ...payload, startTime: "16:00", endTime: "17:00" })).status, 201);
  assert.equal((await call(f.advisor, "/availability/" + slot.id, "PUT", { endTime: "16:30" })).status, 409);
  for (const patch of [{ weekday: null }, { weekday: "" }, { weekday: 1.5 }, { startTime: "" }, { startTime: "16:00", endTime: "16:00:00" }]) {
    assert.equal((await call(f.advisor, "/availability/" + slot.id, "PUT", patch)).status, 400);
  }
  assert.equal((await call(f.other, "/availability/" + slot.id, "PUT", payload)).status, 404);
  assert.equal((await call(f.other, "/availability/" + slot.id, "DELETE")).status, 404);
  assert.equal((await call(f.advisor, "/availability/" + slot.id, "PUT", { weekday: 2 })).status, 200);
  assert.equal((await call(f.advisor, "/availability/" + slot.id, "DELETE")).status, 200);
  assert.equal((await call(f.advisor, "/availability/bad", "DELETE")).status, 400);
});

test("finishing and rating enforce participants, one rating and a live average", async () => {
  const f = await fixture();
  for (const stars of [5, 3]) {
    const session = await accept(f, await create(f));
    assert.equal((await call(f.student, "/sessions/" + session.id + "/rating", "POST", { stars })).status, 400);
    assert.equal((await call(f.outsider, "/sessions/" + session.id + "/finish", "PATCH")).status, 403);
    assert.equal((await call(f.advisor, "/sessions/" + session.id + "/finish", "PATCH")).status, 200);
    assert.equal((await call(f.student, "/sessions/" + session.id + "/finish", "PATCH")).status, 200);
    assert.equal((await call(f.advisor, "/sessions/" + session.id + "/rating", "POST", { stars })).status, 403);
    for (const bad of [0, 6, 1.5, true, [5]]) assert.equal((await call(f.student, "/sessions/" + session.id + "/rating", "POST", { stars: bad })).status, 400);
    const results = await Promise.all([1, 2].map(() => call(f.student, "/sessions/" + session.id + "/rating", "POST", { stars, comment: "Excelente explicación." })));
    assert.deepEqual(results.map((x) => x.status).sort(), [201, 409]);
  }
  const detail = await call(f.student, "/tutors/" + f.advisor.id);
  assert.equal(Number(detail.data.tutor.avg_rating), 4);
  assert.equal(detail.data.tutor.rating_count, 2);
  assert.equal((await call(f.outsider, "/sessions")).data.sessions.length, 0);
});

test("history filters are private, include inactive subjects, and use inclusive Colombian dates", async () => {
  const f = await fixture();
  const r = await create(f, { advisorId: f.advisor.id });
  await pool.query("UPDATE tutoring_requests SET preferred_at='2030-01-03T04:59:59.999Z', status='cancelled' WHERE id=$1", [r.id]);
  const route = "/history?dateFrom=2030-01-02&dateTo=2030-01-02&status=cancelled&subjectId=" + f.subject;
  assert.equal((await call(f.student, route + "&role=student")).data.history.length, 1);
  assert.equal((await call(f.student, route + "&role=advisor")).data.history.length, 0);
  assert.equal((await call(f.outsider, "/history")).data.history.length, 0);
  assert.equal((await call(f.student, "/history?dateFrom=2030-01-03")).data.history.length, 0);
  await pool.query("UPDATE subjects SET is_active=FALSE WHERE id=$1", [f.subject]);
  assert.equal((await call(f.student, "/history")).data.subjects[0].id, f.subject);
  for (const filter of ["dateFrom=2030-02-30", "dateFrom=2030-02-02&dateTo=2030-01-01", "role=invalid", "subjectId=abc"]) {
    assert.equal((await call(f.student, "/history?" + filter)).status, 400);
  }
});

test("disabled accounts cannot operate any module with an existing JWT", async () => {
  const f = await fixture();
  await pool.query("UPDATE users SET is_active=FALSE WHERE id=$1", [f.student.id]);
  for (const route of ["/requests", "/sessions", "/history", "/availability"]) assert.equal((await call(f.student, route)).status, 403);
});
