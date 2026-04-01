"use strict";

const { query } = require("../config/db");

// ── Find logs by order_id (JSONB containment) ─────────────────────────────────

const findByOrder = async (req, res) => {
  const rawId = req.query.order_id;
  if (!rawId) return res.status(400).json({ message: "order_id is required" });

  const orderId = parseInt(rawId, 10);
  if (isNaN(orderId) || orderId <= 0)
    return res.status(400).json({ message: "order_id must be a positive integer" });

  try {
    // $1::jsonb safely casts the parameter – no interpolation of user data into the SQL string
    const { rows } = await query(
      `SELECT * FROM activity_logs
       WHERE details @> $1::jsonb
       ORDER BY created_at DESC`,
      [JSON.stringify({ order_id: orderId })]
    );
    return res.json(rows);
  } catch (err) {
    console.error("findByOrder:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── Get all logs ──────────────────────────────────────────────────────────────

const findAllLogs = async (_req, res) => {
  try {
    const { rows } = await query(
      "SELECT * FROM activity_logs ORDER BY created_at DESC"
    );
    return res.json(rows);
  } catch (err) {
    console.error("findAllLogs:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── Find a user by id ─────────────────────────────────────────────────────────

const findUser = async (req, res) => {
  const rawId = req.query.user_id;
  if (!rawId) return res.status(400).json({ message: "user_id is required" });

  const id = parseInt(rawId, 10);
  if (isNaN(id) || id <= 0)
    return res.status(400).json({ message: "user_id must be a positive integer" });

  try {
    const { rows } = await query(
      // Never return password, refresh_token, etc.
      "SELECT id, name, email, role, phoneno, created_at FROM users WHERE id = $1",
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: "User not found" });
    return res.json(rows[0]);
  } catch (err) {
    console.error("findUser:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── Get logs by email or order_id ─────────────────────────────────────────────

const getActivityLogs = async (req, res) => {
  const { email, order_id } = req.query;

  try {
    if (order_id) {
      const id = parseInt(order_id, 10);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid order_id" });

      const { rows } = await query(
        "SELECT * FROM activity_logs WHERE order_id = $1 ORDER BY created_at DESC",
        [id]
      );
      return res.json(rows);
    }

    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return res.status(400).json({ message: "Invalid email format" });

      const { rows } = await query(
        "SELECT * FROM activity_logs WHERE user_email = $1 ORDER BY created_at DESC",
        [email.toLowerCase()]
      );
      return res.json(rows);
    }

    return res.status(400).json({ message: "Provide either email or order_id" });
  } catch (err) {
    console.error("getActivityLogs:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { findAllLogs, findUser, getActivityLogs, findByOrder };