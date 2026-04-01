// controllers/addressController.js  –  raw SQL (pg)
"use strict";

const { query } = require("../config/db");

const ALLOWED_TYPES = ["shipping", "billing"];

// ── Get all addresses for the authenticated user ──────────────────────────────
exports.getUserAddresses = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, type, name, company, phone, address, city, state, country, email, is_default, created_at
       FROM addresses WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.json({ success: true, addresses: rows });
  } catch (err) {
    console.error("getUserAddresses:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── Get a single address ──────────────────────────────────────────────────────
exports.getAddress = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid address ID" });

  try {
    const { rows } = await query(
      "SELECT * FROM addresses WHERE id = $1 AND user_id = $2",
      [id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Address not found" });
    return res.json({ success: true, address: rows[0] });
  } catch (err) {
    console.error("getAddress:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── Create or update an address ───────────────────────────────────────────────
exports.saveAddress = async (req, res) => {
  const { id, type, name, company, phone, address, city, state, country, email, isDefault } = req.body;

  if (!type || !ALLOWED_TYPES.includes(type))
    return res.status(400).json({ error: `type must be one of: ${ALLOWED_TYPES.join(", ")}` });
  if (!name || !phone || !address || !city || !state || !country || !email)
    return res.status(400).json({ error: "name, phone, address, city, state, country, email are required" });

  try {
    let saved;

    if (id) {
      // Update – ensure the address belongs to this user
      const { rows } = await query(
        `UPDATE addresses
         SET type=$1, name=$2, company=$3, phone=$4, address=$5, city=$6,
             state=$7, country=$8, email=$9, is_default=$10, updated_at=NOW()
         WHERE id=$11 AND user_id=$12
         RETURNING *`,
        [type, name, company || null, phone, address, city,
         state, country, email, isDefault || false, parseInt(id, 10), req.user.id]
      );
      if (!rows.length) return res.status(404).json({ error: "Address not found" });
      saved = rows[0];
    } else {
      const { rows } = await query(
        `INSERT INTO addresses
           (user_id, type, name, company, phone, address, city, state, country, email, is_default, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW())
         RETURNING *`,
        [req.user.id, type, name, company || null, phone, address,
         city, state, country, email, isDefault || false]
      );
      saved = rows[0];
    }

    return res.json({ success: true, address: saved });
  } catch (err) {
    console.error("saveAddress:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── Delete an address ─────────────────────────────────────────────────────────
exports.deleteAddress = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid address ID" });

  try {
    const { rowCount } = await query(
      "DELETE FROM addresses WHERE id = $1 AND user_id = $2",
      [id, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ error: "Address not found" });
    return res.json({ success: true, message: "Address deleted" });
  } catch (err) {
    console.error("deleteAddress:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};