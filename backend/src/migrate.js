require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const { pool, withTransaction } = require("./db");

async function migrate() {
  if (!process.env.DATABASE_URL) throw new Error("Configure DATABASE_URL antes de migrar.");
  await withTransaction(async (client) => {
    await client.query(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));
  });
  console.log("Esquema actualizado. Los datos existentes se conservaron.");
}

migrate().catch((error) => {
  if (error.code === "23505") {
    console.error("Existen solicitudes pendientes duplicadas. Revise y cancele los duplicados antes de repetir la migración. No se eliminó ningún registro.");
  } else console.error(error.message);
  process.exitCode = 1;
}).finally(() => pool.end());
