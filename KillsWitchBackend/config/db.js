// config/db.js  –  raw pg connection pool (no ORM)
"use strict";

require("dotenv").config();
const { Pool } = require("pg");

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

const pool = new Pool({
  host:     process.env.DB_HOST     || "localhost",
  port:     Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || "killswitch_db",
  user:     process.env.DB_USER     || "postgres",
  password: requireEnv("DB_PASSWORD"),   // never a hardcoded fallback
  ssl:      process.env.NODE_ENV === "production"
              ? { rejectUnauthorized: true }
              : false,
  max:              20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (err) => {
  console.error("[DB] Unexpected client error:", err.message);
});

/**
 * Execute a parameterised query.
 *
 *   const { rows } = await query("SELECT * FROM users WHERE id = $1", [id]);
 *
 * NEVER interpolate user input into the SQL string.
 */
async function query(sql, params = []) {
  const start = Date.now();
  try {
    const res = await pool.query(sql, params);
    const ms  = Date.now() - start;
    if (ms > 500) console.warn(`[DB] Slow query (${ms}ms):`, sql.slice(0, 120));
    return res;
  } catch (err) {
    console.error("[DB] Query error:", err.message, "| SQL:", sql.slice(0, 120));
    throw err;
  }
}

/**
 * Run multiple queries in a single transaction.
 *
 *   await transaction(async (tx) => {
 *     await tx("INSERT INTO orders ...", [...]);
 *     await tx("INSERT INTO order_items ...", [...]);
 *   });
 */
async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // wrap client.query in the same signature as `query()`
    const tx = (sql, params) => client.query(sql, params);
    const result = await fn(tx);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, transaction };