// controllers/adminRequestController.js  –  raw SQL (pg)
"use strict";

const { query, transaction } = require("../config/db");

// ── Create admin request ──────────────────────────────────────────────────────
const createAdminRequest = async (req, res) => {
  const { order_id, user_email, updatedshippingAddress, updatedshippingPhone } = req.body;

  if (!order_id) return res.status(400).json({ message: "order_id is required" });

  try {
    const { rowCount } = await query(
      "SELECT 1 FROM orders WHERE order_id = $1",
      [parseInt(order_id, 10)]
    );
    if (!rowCount) return res.status(404).json({ message: "Order not found" });

    const { rows } = await query(
      `INSERT INTO admin_requests
         (order_id, user_email, is_approved, updated_shipping_address, updated_shipping_phone, created_at, updated_at)
       VALUES ($1, $2, false, $3, $4, NOW(), NOW())
       RETURNING *`,
      [parseInt(order_id, 10), user_email || null, updatedshippingAddress || null, updatedshippingPhone || null]
    );

    return res.status(201).json({ message: "Admin request created", data: rows[0] });
  } catch (err) {
    console.error("createAdminRequest:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ── Update approval status ────────────────────────────────────────────────────
const updateApprovalStatus = async (req, res) => {
  const { admin_req_id, isApproved, order_id } = req.body;

  if (admin_req_id === undefined || isApproved === undefined)
    return res.status(400).json({ message: "admin_req_id and isApproved are required" });

  try {
    await transaction(async (tx) => {
      // Update approval flag
      const { rows } = await tx(
        `UPDATE admin_requests SET is_approved = $1, updated_at = NOW()
         WHERE admin_request_id = $2
         RETURNING *`,
        [!!isApproved, parseInt(admin_req_id, 10)]
      );
      if (!rows.length) throw Object.assign(new Error("Request not found"), { status: 404 });

      const req_ = rows[0];

      // If approved, propagate shipping changes to the shipment table
      if (isApproved && order_id) {
        await tx(
          `UPDATE shipments s
           SET shipping_address = COALESCE($1, s.shipping_address),
               shipping_phone   = COALESCE($2, s.shipping_phone)
           FROM orders o
           WHERE o.shipment_id = s.shipment_id AND o.order_id = $3`,
          [req_.updated_shipping_address, req_.updated_shipping_phone, parseInt(order_id, 10)]
        );
      }
    });

    return res.json({ success: true, message: "Approval status updated" });
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ message: err.message });
    console.error("updateApprovalStatus:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ── Get all admin requests ────────────────────────────────────────────────────
const findAllAdminRequests = async (_req, res) => {
  try {
    const { rows } = await query(
      "SELECT * FROM admin_requests ORDER BY created_at DESC"
    );
    return res.json(rows);
  } catch (err) {
    console.error("findAllAdminRequests:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { createAdminRequest, updateApprovalStatus, findAllAdminRequests };