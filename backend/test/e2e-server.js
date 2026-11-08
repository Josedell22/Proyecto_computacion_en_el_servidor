const { Pool } = require("pg");
const { randomUUID } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const bcrypt = require("bcrypt");

async function start() {
  const url = new URL(process.env.TEST_DATABASE_URL || "postgres://studymatch_test:local_test_only@127.0.0.1:55433/studymatch_test");
  if (!url.pathname.endsWith("_test")) throw new Error("El servidor E2E solo puede usar una base _test.");
  const schema = "browser_test_" + randomUUID().replaceAll("-", "");
  const admin = new Pool({ connectionString: url.toString() });
  await admin.query('CREATE SCHEMA "' + schema + '"');
  url.searchParams.set("options", "-c search_path=" + schema);
  process.env.DATABASE_URL = url.toString();
  process.env.JWT_SECRET = "browser-tests-local-only";
  process.env.NODE_ENV = "test";
  const { pool } = require("../src/db");
  await pool.query(fs.readFileSync(path.join(__dirname, "../src/schema.sql"), "utf8"));
  const password = await bcrypt.hash("Pruebas1234", 10);
  for (const [name, email] of [["Carlos Ruiz", "carlos@usco.edu.co"], ["Ana Torres", "ana@usco.edu.co"], ["Laura Gómez", "laura@usco.edu.co"]]) {
    await pool.query("INSERT INTO users(name,email,password_hash,program,semester,bio) VALUES($1,$2,$3,'Ingeniería de Sistemas',5,'Aprendemos juntos.')", [name, email, password]);
  }
  await pool.query("INSERT INTO subjects(name) VALUES('Álgebra lineal'),('Bases de datos'),('Programación I')");
  await pool.query("INSERT INTO student_subjects VALUES(2,1),(2,2),(3,3)");
  await pool.query("INSERT INTO availability(user_id,weekday,start_time,end_time) VALUES(2,1,'14:00','16:00'),(2,3,'10:00','12:00'),(2,5,'08:00','10:00')");
  for (const [status, description] of [
    ["pending", "Necesito reforzar matrices y determinantes antes del parcial. Me gustaría practicar con ejercicios paso a paso."],
    ["confirmed", "Repaso de espacios vectoriales y transformaciones lineales."],
    ["finished", "Comprender los sistemas de ecuaciones y el método de eliminación de Gauss."],
    ["rated", "Ejercicios de independencia lineal y bases."],
    ["cancelled", "Introducción a los vectores y sus operaciones."],
  ]) {
    const requestStatus = ["finished", "rated"].includes(status) ? "finished" : status === "confirmed" ? "accepted" : status;
    const when = new Date(Date.now() + (["finished", "rated", "cancelled"].includes(status) ? -2 : 2) * 86400000);
    const request = (await pool.query(
      "INSERT INTO tutoring_requests(student_id,advisor_id,subject_id,description,preferred_at,status) VALUES(1,2,1,$1,$2,$3) RETURNING id", [description, when, requestStatus]
    )).rows[0];
    if (["confirmed", "finished", "rated"].includes(status)) {
      const session = (await pool.query("INSERT INTO sessions(request_id,student_id,advisor_id,subject_id,scheduled_at,status) VALUES($1,1,2,1,$2,$3) RETURNING id", [request.id, when, status === "rated" ? "finished" : status])).rows[0];
      if (status === "rated") await pool.query("INSERT INTO ratings(session_id,student_id,stars,comment) VALUES($1,1,5,'Explicaciones claras y ejercicios que me ayudaron a entender. ¡Muchas gracias!')", [session.id]);
    }
  }
  const app = require("../src/index");
  const server = app.listen(4100, "127.0.0.1", () => console.log("E2E API ready on 4100"));
  async function stop() {
    server.close();
    await pool.end();
    await admin.query('DROP SCHEMA "' + schema + '" CASCADE');
    await admin.end();
    process.exit();
  }
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}
start().catch((error) => { console.error(error); process.exit(1); });
