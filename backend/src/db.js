const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
const useSsl = process.env.RENDER === "true" || /sslmode=require/i.test(connectionString || "");

const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

async function query(text, params) {
  const result = await pool.query(text, params);
  return result;
}

async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, withTransaction };
