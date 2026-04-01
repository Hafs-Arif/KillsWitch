// controllers/cookieConsentController.js  –  raw SQL (pg)
"use strict";

const { query } = require("../config/db");
const { v4: uuidv4 } = require("uuid");

const getClientIP = (req) =>
  req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
  req.socket?.remoteAddress ||
  req.ip ||
  "unknown";

exports.generateSessionId = () => uuidv4();

exports.storeCookieConsent = async (req, res) => {
  const {
    consent_type,
    session_id,
    analytics_cookies   = false,
    marketing_cookies   = false,
    privacy_policy_version = "1.0",
  } = req.body;

  if (!consent_type || !["accept", "reject"].includes(consent_type))
    return res.status(400).json({ success: false, message: 'consent_type must be "accept" or "reject"' });

  const userId       = req.user?.id || null;
  const clientIP     = getClientIP(req);
  const userAgent    = (req.headers["user-agent"] || "").slice(0, 512);
  const finalSession = session_id || uuidv4();
  const accepted     = consent_type === "accept";
  const expiresAt    = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  try {
    // Check for existing record
    let existing;
    if (userId) {
      const { rows } = await query(
        "SELECT consent_id FROM cookie_consents WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1",
        [userId]
      );
      existing = rows[0];
    } else {
      const { rows } = await query(
        "SELECT consent_id FROM cookie_consents WHERE session_id=$1 ORDER BY created_at DESC LIMIT 1",
        [finalSession]
      );
      existing = rows[0];
    }

    let result;
    if (existing) {
      const { rows } = await query(
        `UPDATE cookie_consents SET
           consent_type=$1, consent_given=$2, analytics_cookies=$3, marketing_cookies=$4,
           consent_date=NOW(), expires_at=$5, ip_address=$6, user_agent=$7,
           privacy_policy_version=$8, updated_at=NOW()
         WHERE consent_id=$9 RETURNING *`,
        [consent_type, accepted, accepted && analytics_cookies, accepted && marketing_cookies,
         expiresAt, clientIP, userAgent, privacy_policy_version, existing.consent_id]
      );
      result = rows[0];
    } else {
      const { rows } = await query(
        `INSERT INTO cookie_consents
           (user_id, session_id, ip_address, user_agent, consent_given, consent_type,
            analytics_cookies, functional_cookies, marketing_cookies, consent_date,
            expires_at, privacy_policy_version, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8,NOW(),$9,$10,NOW(),NOW())
         RETURNING *`,
        [userId, finalSession, clientIP, userAgent, accepted, consent_type,
         accepted && analytics_cookies, accepted && marketing_cookies,
         expiresAt, privacy_policy_version]
      );
      result = rows[0];
    }

    return res.json({
      success:    true,
      message:    `Consent ${existing ? "updated" : "recorded"}`,
      data:       {
        consent_id:         result.consent_id,
        session_id:         finalSession,
        consent_type,
        consent_given:      accepted,
        analytics_cookies:  result.analytics_cookies,
        functional_cookies: true,
        marketing_cookies:  result.marketing_cookies,
        expires_at:         expiresAt,
      },
    });
  } catch (err) {
    console.error("storeCookieConsent:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getCookieConsent = async (req, res) => {
  const { session_id } = req.query;
  const userId = req.user?.id || null;

  if (!session_id && !userId)
    return res.status(400).json({ success: false, message: "session_id or auth required" });

  try {
    let rows = [];
    if (userId) {
      ({ rows } = await query(
        "SELECT * FROM cookie_consents WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1", [userId]
      ));
    }
    if (!rows.length && session_id) {
      ({ rows } = await query(
        "SELECT * FROM cookie_consents WHERE session_id=$1 ORDER BY created_at DESC LIMIT 1", [session_id]
      ));
    }

    if (!rows.length)
      return res.status(404).json({ success: false, data: { consent_given: false, needs_consent: true } });

    const c = rows[0];
    if (c.expires_at && new Date(c.expires_at) < new Date())
      return res.json({ success: true, data: { consent_given: false, needs_consent: true, expired: true } });

    return res.json({ success: true, data: { ...c, needs_consent: false } });
  } catch (err) {
    console.error("getCookieConsent:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.deleteCookieConsent = async (req, res) => {
  const { session_id } = req.body;
  const userId = req.user?.id || null;

  if (!session_id && !userId)
    return res.status(400).json({ success: false, message: "session_id or auth required" });

  try {
    const { rowCount } = userId
      ? await query("DELETE FROM cookie_consents WHERE user_id=$1", [userId])
      : await query("DELETE FROM cookie_consents WHERE session_id=$1", [session_id]);

    if (!rowCount) return res.status(404).json({ success: false, message: "No consent found" });
    return res.json({ success: true, data: { deleted_count: rowCount } });
  } catch (err) {
    console.error("deleteCookieConsent:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getCookieConsentStats = async (_req, res) => {
  try {
    const { rows: breakdown } = await query(
      "SELECT consent_type, COUNT(*) AS count FROM cookie_consents GROUP BY consent_type"
    );
    const { rows: totals } = await query(
      `SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') AS recent_30d
       FROM cookie_consents`
    );

    return res.json({
      success: true,
      data: {
        total_consents:            parseInt(totals[0].total, 10),
        recent_consents_30_days:   parseInt(totals[0].recent_30d, 10),
        consent_breakdown:         breakdown,
        generated_at:              new Date(),
      },
    });
  } catch (err) {
    console.error("getCookieConsentStats:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// controllers/couponController.js  –  raw SQL (pg)
// ─────────────────────────────────────────────────────────────────────────────

const couponQuery = require("../config/db").query;

exports.getAllCoupons = async (_req, res) => {
  try {
    const { rows } = await couponQuery("SELECT * FROM coupons ORDER BY created_at DESC");
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error("getAllCoupons:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

exports.getCouponById = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const { rows } = await couponQuery("SELECT * FROM coupons WHERE id=$1", [id]);
    if (!rows.length) return res.status(404).json({ success: false, error: "Coupon not found" });
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("getCouponById:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

exports.createCoupon = async (req, res) => {
  const { code, description, discount_type, discount_value, min_purchase_amount, max_uses, expires_at, is_active } = req.body;

  if (!code?.toString().trim()) return res.status(400).json({ success: false, error: "code is required" });
  const cleanCode = code.toString().trim().toUpperCase();

  try {
    const { rowCount } = await couponQuery("SELECT 1 FROM coupons WHERE code=$1", [cleanCode]);
    if (rowCount) return res.status(400).json({ success: false, error: "Coupon code already exists" });

    const { rows } = await couponQuery(
      `INSERT INTO coupons
         (code, description, discount_type, discount_value, min_purchase_amount,
          max_uses, expires_at, is_active, uses_count, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,0,NOW(),NOW())
       RETURNING *`,
      [cleanCode, description||null, discount_type||"percentage", parseFloat(discount_value)||0,
       min_purchase_amount ? parseFloat(min_purchase_amount) : null,
       max_uses ? parseInt(max_uses,10) : null,
       expires_at || null, typeof is_active === "boolean" ? is_active : true]
    );
    return res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("createCoupon:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

exports.updateCoupon = async (req, res) => {
  const id = parseInt(req.params.id, 10);

  try {
    const { rows: existing } = await couponQuery("SELECT id FROM coupons WHERE id=$1", [id]);
    if (!existing.length) return res.status(404).json({ success: false, error: "Coupon not found" });

    const sets  = ["updated_at=NOW()"];
    const vals  = [];
    let   i     = 1;
    const FIELDS = ["description","discount_type","discount_value","min_purchase_amount",
                    "max_uses","expires_at","is_active"];

    if (req.body.code) {
      const cleanCode = req.body.code.toString().trim().toUpperCase();
      const { rowCount } = await couponQuery("SELECT 1 FROM coupons WHERE code=$1 AND id!=$2", [cleanCode, id]);
      if (rowCount) return res.status(400).json({ success: false, error: "Code already in use" });
      sets.push(`code=$${i++}`); vals.push(cleanCode);
    }
    for (const f of FIELDS) {
      if (req.body[f] !== undefined) { sets.push(`${f}=$${i++}`); vals.push(req.body[f]); }
    }

    vals.push(id);
    const { rows } = await couponQuery(
      `UPDATE coupons SET ${sets.join(",")} WHERE id=$${i} RETURNING *`, vals
    );
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("updateCoupon:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

exports.deleteCoupon = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const { rowCount } = await couponQuery("DELETE FROM coupons WHERE id=$1", [id]);
    if (!rowCount) return res.status(404).json({ success: false, error: "Coupon not found" });
    return res.json({ success: true });
  } catch (err) {
    console.error("deleteCoupon:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

exports.validateCoupon = async (req, res) => {
  const code     = (req.query.code || "").toString().trim().toUpperCase();
  const subtotal = parseFloat(req.query.subtotal) || 0;

  if (!code) return res.status(400).json({ success: false, error: "code is required" });

  try {
    const { rows } = await couponQuery(
      `SELECT * FROM coupons
       WHERE code=$1 AND is_active=true
         AND (expires_at IS NULL OR expires_at > NOW())
         AND (max_uses IS NULL OR uses_count < max_uses)`,
      [code]
    );
    if (!rows.length) return res.json({ success: true, valid: false });

    const c = rows[0];
    if (c.min_purchase_amount && subtotal < c.min_purchase_amount)
      return res.json({ success: true, valid: false });

    let discount = c.discount_type === "percentage"
      ? +(subtotal * (c.discount_value / 100)).toFixed(2)
      : +c.discount_value;
    discount = Math.min(discount, subtotal);

    return res.json({ success: true, valid: true, discount, coupon: c });
  } catch (err) {
    console.error("validateCoupon:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};