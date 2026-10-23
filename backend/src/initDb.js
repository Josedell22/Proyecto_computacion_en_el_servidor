require("dotenv").config();
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const { validateAdminSeedConfig } = require("./config");
const { pool } = require("./db");

const SUBJECTS = [
  ["Cálculo I", "Límites, derivadas e integrales básicas."],
  ["Cálculo II", "Integrales, series y aplicaciones."],
  ["Álgebra lineal", "Matrices, vectores y sistemas lineales."],
  ["Programación I", "Fundamentos de algoritmos y estructuras de control."],
  ["Estructuras de datos", "Listas, árboles, colas y complejidad."],
  ["Bases de datos", "Modelo relacional, SQL y diseño."],
  ["Computación en el servidor", "Arquitectura cliente-servidor y APIs."],
  ["Inglés técnico", "Lectura y escritura académica en inglés."],
  ["Física I", "Mecánica clásica y cinemática."],
  ["Estadística", "Probabilidad, muestreo e inferencia."],
];

async function init() {
  validateAdminSeedConfig();
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await pool.query(schema);

  const adminEmail = process.env.ADMIN_EMAIL || "admin@studymatch.edu";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin1234";
  const hash = await bcrypt.hash(adminPassword, 10);

  await pool.query(
    `INSERT INTO users (name, email, password_hash, role, program, semester, bio)
     VALUES ($1, $2, $3, 'admin', 'Ingeniería de Software', 8, 'Administrador de StudyMatch')
     ON CONFLICT DO NOTHING`,
    ["Administrador StudyMatch", adminEmail, hash]
  );

  for (const [name, description] of SUBJECTS) {
    await pool.query(
      `INSERT INTO subjects (name, description) VALUES ($1, $2)
       ON CONFLICT (name) DO NOTHING`,
      [name, description]
    );
  }

  if (process.env.NODE_ENV !== "production") {
    const demoHash = await bcrypt.hash("Estudiante1", 10);
    const demos = [
      ["Ana Torres", "ana@usco.edu.co", "Ingeniería de Sistemas", 6, "Me gusta explicar álgebra y bases de datos."],
      ["Carlos Ruiz", "carlos@usco.edu.co", "Ingeniería de Sistemas", 4, "Busco refuerzo en cálculo y física."],
      ["Laura Gómez", "laura@usco.edu.co", "Ingeniería Electrónica", 5, "Ofrezco apoyo en programación."],
    ];

    for (const [name, email, program, semester, bio] of demos) {
      await pool.query(
        `INSERT INTO users (name, email, password_hash, role, program, semester, bio)
         VALUES ($1, $2, $3, 'student', $4, $5, $6)
         ON CONFLICT (email) DO NOTHING`,
        [name, email, demoHash, program, semester, bio]
      );
    }

    const ana = await pool.query("SELECT id FROM users WHERE email=$1", ["ana@usco.edu.co"]);
    const laura = await pool.query("SELECT id FROM users WHERE email=$1", ["laura@usco.edu.co"]);
    const calc = await pool.query("SELECT id FROM subjects WHERE name=$1", ["Álgebra lineal"]);
    const db = await pool.query("SELECT id FROM subjects WHERE name=$1", ["Bases de datos"]);
    const prog = await pool.query("SELECT id FROM subjects WHERE name=$1", ["Programación I"]);

    if (ana.rows[0] && calc.rows[0] && db.rows[0]) {
      await pool.query(
        `INSERT INTO student_subjects (user_id, subject_id) VALUES ($1, $2), ($1, $3)
         ON CONFLICT DO NOTHING`,
        [ana.rows[0].id, calc.rows[0].id, db.rows[0].id]
      );
      await pool.query(
        `INSERT INTO availability (user_id, weekday, start_time, end_time)
         SELECT $1, 1, '14:00', '16:00'
         WHERE NOT EXISTS (SELECT 1 FROM availability WHERE user_id=$1 AND weekday=1)`,
        [ana.rows[0].id]
      );
    }
    if (laura.rows[0] && prog.rows[0]) {
      await pool.query(
        `INSERT INTO student_subjects (user_id, subject_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [laura.rows[0].id, prog.rows[0].id]
      );
    }
  }

  console.log("Base de datos inicializada.");
  console.log(`Administrador configurado: ${adminEmail}`);
  if (process.env.NODE_ENV !== "production") {
    console.log("Estudiantes demo: ana@usco.edu.co, carlos@usco.edu.co, laura@usco.edu.co / Estudiante1");
  }
  await pool.end();
}

init().catch((err) => {
  console.error(err);
  process.exit(1);
});
