"use strict";

const { query } = require("../config/db");
const { sendEmail } = require("../utils/email");

// ── Helpers ───────────────────────────────────────────────────────────────────

const validEmail = (e) =>
  typeof e === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

const sanitize = (val) => (val == null ? null : String(val).trim());

function buildQuoteAdminHtml({ name, email, phoneno, productcode, message, condition, status, target_price }) {
  return `
    <p><strong>Dear Admin,</strong></p>
    <p>A new quote request has been received on <strong>KillSwitch</strong>! 📝</p>
    <ul>
      <li><strong>Name:</strong> ${name || "N/A"}</li>
      <li><strong>Email:</strong> ${email || "N/A"}</li>
      <li><strong>Phone:</strong> ${phoneno || "N/A"}</li>
      <li><strong>Product Code:</strong> ${productcode || "N/A"}</li>
      <li><strong>Message:</strong> ${message || "N/A"}</li>
      <li><strong>Condition:</strong> ${condition || "N/A"}</li>
      <li><strong>Status:</strong> ${status || "N/A"}</li>
      <li><strong>Target Price:</strong> ${target_price || "N/A"}</li>
      <li><strong>Requested On:</strong> ${new Date().toLocaleString()}</li>
    </ul>
    <p>Please review the request and get back to the client.</p>
    <hr />
    <p><em>This is an automated email. No reply is needed.</em></p>`;
}

// ── Handle Quote Request ──────────────────────────────────────────────────────

const handleQuoteRequest = async (req, res) => {
  try {
    const {
      name, email, phoneno, message, productcode,
      quantity, condition, target_price, status, recipient_email,
    } = req.body;

    // ── Validation ──────────────────────────────────────────
    if (!validEmail(email)) {
      return res.status(400).json({ success: false, error: "Valid email is required" });
    }
    if (!sanitize(name)) {
      return res.status(400).json({ success: false, error: "Name is required" });
    }
    if (!sanitize(productcode)) {
      return res.status(400).json({ success: false, error: "Product code is required" });
    }

    const parsedQuantity    = quantity    ? parseInt(quantity, 10)    : null;
    const parsedTargetPrice = target_price ? parseFloat(target_price) : null;

    if (parsedQuantity !== null && (!Number.isInteger(parsedQuantity) || parsedQuantity < 1)) {
      return res.status(400).json({ success: false, error: "Quantity must be a positive integer" });
    }
    if (parsedTargetPrice !== null && (isNaN(parsedTargetPrice) || parsedTargetPrice < 0)) {
      return res.status(400).json({ success: false, error: "Target price must be a non-negative number" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ── Insert quote ────────────────────────────────────────
    const { rows } = await query(
      `INSERT INTO quotes
         (name, email, phoneno, message, productcode,
          quantity, condition, target_price, status, recipient_email,
          created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, NOW(), NOW())
       RETURNING *`,
      [
        sanitize(name),
        normalizedEmail,
        sanitize(phoneno),
        sanitize(message),
        sanitize(productcode),
        parsedQuantity,
        sanitize(condition),
        parsedTargetPrice,
        sanitize(status) || "pending",
        recipient_email ? recipient_email.toLowerCase().trim() : null,
      ]
    );

    // ── Activity log (non-blocking) ─────────────────────────
    query(
      `INSERT INTO activity_logs (activity, user_email, details, created_at, updated_at)
       VALUES ('New Quote Added', $1, $2, NOW(), NOW())`,
      [
        normalizedEmail,
        JSON.stringify({
          name: sanitize(name),
          email: normalizedEmail,
          productcode: sanitize(productcode),
          quantity: parsedQuantity,
          condition: sanitize(condition),
          target_price: parsedTargetPrice,
        }),
      ]
    ).catch((err) => console.error("Quote activity log failed:", err.message));

    // ── Admin notification email (non-blocking) ─────────────
    const from        = process.env.SMTP_FROM || process.env.email_user;
    const adminTarget = recipient_email || process.env.MAIL_USER || process.env.email_user;
    const subject     = "📝 New Quote Request";
    const html        = buildQuoteAdminHtml({
      name, email: normalizedEmail, phoneno, productcode,
      message, condition, status, target_price,
    });

    sendEmail(from, adminTarget, subject, html)
      .catch((err) => console.error("Quote notification email failed:", err.message));

    return res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("handleQuoteRequest:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

module.exports = { handleQuoteRequest };