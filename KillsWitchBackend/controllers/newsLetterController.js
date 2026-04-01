"use strict";

const { query } = require("../config/db");
const { sendEmail } = require("../utils/email");

// ── Helpers ───────────────────────────────────────────────────────────────────

const validEmail = (e) =>
  typeof e === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

function buildWelcomeHtml(email) {
  const year = new Date().getFullYear();
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #c70007 0%, #a50005 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #c70007; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>🎮 Welcome to KillSwitch!</h1></div>
        <div class="content">
          <p><strong>Hi there!</strong></p>
          <p>Thank you for subscribing to the <strong>KillSwitch Newsletter</strong>! 🎉</p>
          <p>You're now part of our gaming community and will be the first to know about:</p>
          <ul>
            <li>🎮 New gaming hardware releases</li>
            <li>💰 Exclusive deals and discounts</li>
            <li>🔥 Hot gaming trends and tips</li>
            <li>⚡ Special promotions just for subscribers</li>
          </ul>
          <p style="text-align: center;">
            <a href="https://www.killswitch.us/products" class="button">Browse Our Products</a>
          </p>
          <p>Stay tuned for exciting updates!</p>
          <p><strong>Game On!</strong><br>The KillSwitch Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${year} KillSwitch. All rights reserved.</p>
          <p>8408/8409 Rise Commercial District, 7840 Tyler Boulevard, Mentor Ohio. 44060</p>
        </div>
      </div>
    </body>
    </html>`;
}

function buildAdminNotificationHtml(email) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #c70007; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 15px; border-left: 4px solid #c70007; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h2>📩 New Newsletter Subscription</h2></div>
        <div class="content">
          <p><strong>Dear Admin,</strong></p>
          <p>A new user has subscribed to the <strong>KillSwitch Newsletter</strong>! 🎉</p>
          <div class="info-box">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subscribed At:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p><em>This is an automated notification.</em></p>
        </div>
      </div>
    </body>
    </html>`;
}

// ── Subscribe ─────────────────────────────────────────────────────────────────

const handleNewsletterSubscription = async (req, res) => {
  try {
    const { email } = req.body;

    if (!validEmail(email)) {
      return res.status(400).json({ success: false, error: "Valid email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate
    const { rowCount } = await query(
      `SELECT 1 FROM newsletters WHERE email = $1`,
      [normalizedEmail]
    );
    if (rowCount > 0) {
      return res.status(409).json({
        success: false,
        error: "This email is already subscribed to our newsletter",
      });
    }

    // Create subscription
    const { rows } = await query(
      `INSERT INTO newsletters (email, created_at, updated_at)
       VALUES ($1, NOW(), NOW())
       RETURNING newsletter_id, email, created_at`,
      [normalizedEmail]
    );
    const newsletter = rows[0];

    // Activity log (non-blocking) — only attach user_email if user exists
    (async () => {
      try {
        const { rows: userRows } = await query(
          `SELECT 1 FROM users WHERE email = $1`,
          [normalizedEmail]
        );
        const userEmail = userRows.length ? normalizedEmail : null;

        await query(
          `INSERT INTO activity_logs (activity, user_email, details, created_at, updated_at)
           VALUES ('New Newsletter Subscription', $1, $2, NOW(), NOW())`,
          [userEmail, JSON.stringify({ email: normalizedEmail })]
        );
      } catch (logErr) {
        console.error("Failed to record activity log for newsletter:", logErr.message);
      }
    })();

    // Send emails (non-blocking)
    const from = process.env.SMTP_FROM || process.env.email_user;
    const adminEmail = process.env.email_user || "contact@killswitch.us";

    sendEmail(from, normalizedEmail, "🎉 Welcome to KillSwitch Newsletter!", buildWelcomeHtml(normalizedEmail))
      .catch((err) => console.error("Welcome email failed:", err.message));

    sendEmail(from, adminEmail, "📩 New Newsletter Subscription Alert", buildAdminNotificationHtml(normalizedEmail))
      .catch((err) => console.error("Admin notification email failed:", err.message));

    return res.status(201).json({
      success: true,
      message: "Successfully subscribed to newsletter",
      newsletter,
    });
  } catch (err) {
    console.error("handleNewsletterSubscription:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ── Get All Subscriptions (Admin) ─────────────────────────────────────────────

const getAllSubscriptions = async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT newsletter_id AS id, email, created_at AS "createdAt", updated_at AS "updatedAt"
       FROM newsletters
       ORDER BY created_at DESC`
    );

    return res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    console.error("getAllSubscriptions:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ── Delete Subscription (Admin) ───────────────────────────────────────────────

const deleteSubscription = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, error: "Valid subscriber ID required" });
    }

    const { rowCount } = await query(
      `DELETE FROM newsletters WHERE newsletter_id = $1`,
      [id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ success: false, error: "Subscriber not found" });
    }

    return res.json({ success: true, message: "Subscriber deleted successfully" });
  } catch (err) {
    console.error("deleteSubscription:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

module.exports = { handleNewsletterSubscription, getAllSubscriptions, deleteSubscription };