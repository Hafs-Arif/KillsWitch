"use strict";

const { query } = require("../config/db");

// ── Helpers ───────────────────────────────────────────────────────────────────

const VALID_DISCOUNT_TYPES = ["percentage", "fixed"];

function sanitizeCode(raw) {
  if (!raw || !String(raw).trim()) return null;
  return String(raw).trim().toUpperCase();
}

function isPositiveNumber(val) {
  return typeof val === "number" && val > 0 && Number.isFinite(val);
}

// ── Get All Coupons (Admin) ───────────────────────────────────────────────────

exports.getAllCoupons = async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT * FROM coupons ORDER BY created_at DESC`
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error("getAllCoupons:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ── Get Coupon by ID (Admin) ──────────────────────────────────────────────────

exports.getCouponById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, error: "Valid coupon ID required" });
    }

    const { rows } = await query(
      `SELECT * FROM coupons WHERE id = $1`,
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, error: "Coupon not found" });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("getCouponById:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ── Create Coupon (Admin) ─────────────────────────────────────────────────────

exports.createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_purchase_amount,
      max_uses,
      expires_at,
      is_active,
    } = req.body;

    // ── Validation ──────────────────────────────────────────
    const cleanCode = sanitizeCode(code);
    if (!cleanCode) {
      return res.status(400).json({ success: false, error: "Coupon code is required" });
    }

    if (!VALID_DISCOUNT_TYPES.includes(discount_type)) {
      return res.status(400).json({ success: false, error: "discount_type must be 'percentage' or 'fixed'" });
    }

    if (!isPositiveNumber(discount_value)) {
      return res.status(400).json({ success: false, error: "discount_value must be a positive number" });
    }

    if (discount_type === "percentage" && discount_value > 100) {
      return res.status(400).json({ success: false, error: "Percentage discount cannot exceed 100" });
    }

    if (min_purchase_amount !== undefined && min_purchase_amount !== null) {
      if (typeof min_purchase_amount !== "number" || min_purchase_amount < 0) {
        return res.status(400).json({ success: false, error: "min_purchase_amount must be a non-negative number" });
      }
    }

    if (max_uses !== undefined && max_uses !== null) {
      if (!Number.isInteger(max_uses) || max_uses < 1) {
        return res.status(400).json({ success: false, error: "max_uses must be a positive integer" });
      }
    }

    if (expires_at !== undefined && expires_at !== null) {
      const expDate = new Date(expires_at);
      if (isNaN(expDate.getTime())) {
        return res.status(400).json({ success: false, error: "expires_at must be a valid date" });
      }
      if (expDate <= new Date()) {
        return res.status(400).json({ success: false, error: "expires_at must be in the future" });
      }
    }

    // ── Uniqueness check ────────────────────────────────────
    const { rowCount } = await query(
      `SELECT 1 FROM coupons WHERE code = $1`,
      [cleanCode]
    );
    if (rowCount > 0) {
      return res.status(409).json({ success: false, error: "Coupon code already exists" });
    }

    // ── Insert ──────────────────────────────────────────────
    const activeFlag = typeof is_active === "boolean" ? is_active : true;

    const { rows } = await query(
      `INSERT INTO coupons
         (code, description, discount_type, discount_value,
          min_purchase_amount, max_uses, uses_count, expires_at,
          is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8, NOW(), NOW())
       RETURNING *`,
      [
        cleanCode,
        description || null,
        discount_type,
        discount_value,
        min_purchase_amount ?? null,
        max_uses ?? null,
        expires_at ? new Date(expires_at) : null,
        activeFlag,
      ]
    );

    return res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("createCoupon:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ── Update Coupon (Admin) ─────────────────────────────────────────────────────

exports.updateCoupon = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, error: "Valid coupon ID required" });
    }

    // Check existence
    const { rows: existing } = await query(
      `SELECT id FROM coupons WHERE id = $1`,
      [id]
    );
    if (!existing.length) {
      return res.status(404).json({ success: false, error: "Coupon not found" });
    }

    // ── Whitelist & validate fields ─────────────────────────
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_purchase_amount,
      max_uses,
      expires_at,
      is_active,
    } = req.body;

    const sets = [];
    const vals = [];
    let i = 1;

    if (code !== undefined) {
      const cleanCode = sanitizeCode(code);
      if (!cleanCode) {
        return res.status(400).json({ success: false, error: "Coupon code cannot be empty" });
      }
      // Uniqueness among *other* coupons
      const { rowCount } = await query(
        `SELECT 1 FROM coupons WHERE code = $1 AND id != $2`,
        [cleanCode, id]
      );
      if (rowCount > 0) {
        return res.status(409).json({ success: false, error: "Another coupon already uses that code" });
      }
      sets.push(`code = $${i++}`);
      vals.push(cleanCode);
    }

    if (description !== undefined) {
      sets.push(`description = $${i++}`);
      vals.push(description || null);
    }

    if (discount_type !== undefined) {
      if (!VALID_DISCOUNT_TYPES.includes(discount_type)) {
        return res.status(400).json({ success: false, error: "discount_type must be 'percentage' or 'fixed'" });
      }
      sets.push(`discount_type = $${i++}`);
      vals.push(discount_type);
    }

    if (discount_value !== undefined) {
      if (!isPositiveNumber(discount_value)) {
        return res.status(400).json({ success: false, error: "discount_value must be a positive number" });
      }
      sets.push(`discount_value = $${i++}`);
      vals.push(discount_value);
    }

    if (min_purchase_amount !== undefined) {
      if (min_purchase_amount !== null && (typeof min_purchase_amount !== "number" || min_purchase_amount < 0)) {
        return res.status(400).json({ success: false, error: "min_purchase_amount must be a non-negative number" });
      }
      sets.push(`min_purchase_amount = $${i++}`);
      vals.push(min_purchase_amount);
    }

    if (max_uses !== undefined) {
      if (max_uses !== null && (!Number.isInteger(max_uses) || max_uses < 1)) {
        return res.status(400).json({ success: false, error: "max_uses must be a positive integer" });
      }
      sets.push(`max_uses = $${i++}`);
      vals.push(max_uses);
    }

    if (expires_at !== undefined) {
      if (expires_at !== null) {
        const expDate = new Date(expires_at);
        if (isNaN(expDate.getTime())) {
          return res.status(400).json({ success: false, error: "expires_at must be a valid date" });
        }
        sets.push(`expires_at = $${i++}`);
        vals.push(expDate);
      } else {
        sets.push(`expires_at = $${i++}`);
        vals.push(null);
      }
    }

    if (is_active !== undefined) {
      sets.push(`is_active = $${i++}`);
      vals.push(!!is_active);
    }

    if (!sets.length) {
      return res.json({ success: true, message: "Nothing to update" });
    }

    sets.push(`updated_at = NOW()`);
    vals.push(id);

    const { rows } = await query(
      `UPDATE coupons SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
      vals
    );

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("updateCoupon:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ── Delete Coupon (Admin) ─────────────────────────────────────────────────────

exports.deleteCoupon = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, error: "Valid coupon ID required" });
    }

    const { rowCount } = await query(
      `DELETE FROM coupons WHERE id = $1`,
      [id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ success: false, error: "Coupon not found" });
    }

    return res.json({ success: true, message: "Coupon deleted" });
  } catch (err) {
    console.error("deleteCoupon:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ── Validate Coupon (Public / Checkout) ───────────────────────────────────────

exports.validateCoupon = async (req, res) => {
  try {
    const cleanCode = sanitizeCode(req.query.code);
    const subtotal  = Math.max(0, parseFloat(req.query.subtotal) || 0);

    if (!cleanCode) {
      return res.status(400).json({ success: false, error: "Coupon code is required" });
    }

    const { rows } = await query(
      `SELECT * FROM coupons
       WHERE code = $1
         AND is_active = true`,
      [cleanCode]
    );

    if (!rows.length) {
      return res.json({ success: true, valid: false, reason: "Coupon not found or inactive" });
    }

    const coupon = rows[0];
    const now    = new Date();

    // ── Expiry ──────────────────────────────────────────────
    if (coupon.expires_at && new Date(coupon.expires_at) < now) {
      return res.json({ success: true, valid: false, reason: "Coupon has expired" });
    }

    // ── Max uses ────────────────────────────────────────────
    if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
      return res.json({ success: true, valid: false, reason: "Coupon usage limit reached" });
    }

    // ── Min purchase ────────────────────────────────────────
    if (coupon.min_purchase_amount !== null && subtotal < coupon.min_purchase_amount) {
      return res.json({
        success: true,
        valid: false,
        reason: `Minimum purchase of ${coupon.min_purchase_amount} required`,
      });
    }

    // ── Calculate discount ──────────────────────────────────
    let discount = 0;
    if (coupon.discount_type === "percentage") {
      discount = +(subtotal * (coupon.discount_value / 100)).toFixed(2);
    } else {
      discount = +coupon.discount_value;
    }
    discount = Math.min(discount, subtotal); // never exceed subtotal

    // Strip sensitive / internal fields before returning
    const { uses_count, ...safeCoupon } = coupon;

    return res.json({
      success: true,
      valid: true,
      discount,
      coupon: safeCoupon,
    });
  } catch (err) {
    console.error("validateCoupon:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};