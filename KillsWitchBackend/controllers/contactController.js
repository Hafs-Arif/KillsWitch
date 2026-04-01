// controllers/contactController.js  –  raw SQL (pg)
"use strict";

const { query }    = require("../config/db");
const { sendEmail} = require("../utils/email");

const handleContactRequest = async (req, res) => {
  const { name, email, message, phoneno, subject, recipient_email } = req.body;

  if (!name || !email || !message || !phoneno)
    return res.status(400).json({ success: false, error: "name, email, message, phoneno are required" });

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ success: false, error: "Invalid email" });

  try {
    await query(
      `INSERT INTO contacts (name, email, message, phoneno, created_at, updated_at)
       VALUES ($1,$2,$3,$4,NOW(),NOW())`,
      [name, email, message, phoneno]
    );

    await query(
      `INSERT INTO activity_logs (user_email, activity, details, created_at, updated_at)
       VALUES ($1,$2,$3,NOW(),NOW())`,
      [email, subject || "New Contact Request", JSON.stringify({ name, email, message, phoneno })]
    );

    const from    = process.env.SMTP_FROM || process.env.SMTP_USER || "contact@killswitch.us";
    const adminTo = recipient_email || process.env.MAIL_USER || "contact@killswitch.us";

    const adminHtml = `
      <p><strong>Dear Admin,</strong></p>
      <p>New contact inquiry from <strong>KillSwitch</strong>:</p>
      <ul>
        <li><strong>Name:</strong> ${name}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Phone:</strong> ${phoneno}</li>
        <li><strong>Message:</strong> ${message}</li>
        <li><strong>Submitted:</strong> ${new Date().toLocaleString()}</li>
      </ul>`;

    const userHtml = `
      <p>Hi ${name},</p>
      <p>Thanks for reaching out to KillSwitch! We'll get back to you shortly.</p>
      <blockquote>${message}</blockquote>
      <p>— The KillSwitch Team</p>`;

    // Fire and forget – don't block the HTTP response on email delivery
    sendEmail(from, adminTo, `📩 New Contact Request from ${name}`, adminHtml).catch(console.error);
    sendEmail(from, email,   "📧 Your message has been received",   userHtml).catch(console.error);

    return res.json({ success: true });
  } catch (err) {
    console.error("handleContactRequest:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

module.exports = { handleContactRequest };


// ─────────────────────────────────────────────────────────────────────────────
// controllers/newsletterController.js  –  raw SQL (pg)
// ─────────────────────────────────────────────────────────────────────────────

const handleNewsletterSubscription = async (req, res) => {
  const { email } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ success: false, error: "Valid email is required" });

  try {
    const { rowCount } = await query(
      "SELECT 1 FROM newsletters WHERE email = $1", [email.toLowerCase()]
    );
    if (rowCount) return res.status(400).json({ success: false, error: "Email already subscribed" });

    await query(
      "INSERT INTO newsletters (email, created_at, updated_at) VALUES ($1,NOW(),NOW())",
      [email.toLowerCase()]
    );

    // Optional: activity log (non-blocking, only if user account exists)
    query("SELECT id FROM users WHERE email=$1", [email.toLowerCase()]).then(({ rows }) => {
      if (rows.length) {
        query(
          "INSERT INTO activity_logs (user_email, activity, details, created_at, updated_at) VALUES ($1,'Newsletter Subscription',$2,NOW(),NOW())",
          [email.toLowerCase(), JSON.stringify({ email })]
        ).catch(()=>{});
      }
    }).catch(()=>{});

    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    const welcomeHtml = `
      <h2>Welcome to KillSwitch!</h2>
      <p>You're now subscribed. Expect exclusive deals and gaming news.</p>
      <p>— The KillSwitch Team</p>`;

    sendEmail(from, email, "🎉 Welcome to KillSwitch Newsletter!", welcomeHtml).catch(console.error);
    sendEmail(from, process.env.SMTP_USER, "New Newsletter Subscriber", `<p>New subscriber: ${email}</p>`).catch(console.error);

    return res.json({ success: true, message: "Successfully subscribed" });
  } catch (err) {
    console.error("handleNewsletterSubscription:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const getAllSubscriptions = async (_req, res) => {
  try {
    const { rows } = await query(
      "SELECT newsletter_id AS id, email, created_at, updated_at FROM newsletters ORDER BY created_at DESC"
    );
    return res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    console.error("getAllSubscriptions:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const deleteSubscription = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ success: false, error: "Invalid subscriber ID" });

  try {
    const { rowCount } = await query(
      "DELETE FROM newsletters WHERE newsletter_id = $1", [id]
    );
    if (!rowCount) return res.status(404).json({ success: false, error: "Subscriber not found" });
    return res.json({ success: true, message: "Subscriber deleted" });
  } catch (err) {
    console.error("deleteSubscription:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

module.exports.handleNewsletterSubscription = handleNewsletterSubscription;
module.exports.getAllSubscriptions           = getAllSubscriptions;
module.exports.deleteSubscription            = deleteSubscription;


// ─────────────────────────────────────────────────────────────────────────────
// controllers/quoteController.js  –  raw SQL (pg)
// ─────────────────────────────────────────────────────────────────────────────

const handleQuoteRequest = async (req, res) => {
  const { name, email, phoneno, message, productcode, quantity, condition, target_price, status, recipient_email } = req.body;

  if (!name || !email || !phoneno || !productcode || !quantity || !condition || !target_price || !status)
    return res.status(400).json({ success: false, error: "Missing required fields" });

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ success: false, error: "Invalid email" });

  try {
    await query(
      `INSERT INTO quotes
         (name, email, phoneno, message, productcode, quantity, condition, target_price, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())`,
      [name, email, phoneno, message||null, productcode, parseInt(quantity,10), condition,
       parseFloat(target_price), status]
    );

    await query(
      `INSERT INTO activity_logs (user_email, activity, details, created_at, updated_at)
       VALUES ($1,'New Quote Added',$2,NOW(),NOW())`,
      [email, JSON.stringify({ name, email, phoneno, productcode, quantity, condition, target_price, status })]
    );

    const from     = process.env.SMTP_FROM || process.env.SMTP_USER;
    const adminTo  = recipient_email || process.env.MAIL_USER || "contact@killswitch.us";

    const mailHtml = `
      <p><strong>Dear Admin,</strong></p>
      <p>New quote request on <strong>KillSwitch</strong>:</p>
      <ul>
        <li><strong>Name:</strong> ${name}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Phone:</strong> ${phoneno}</li>
        <li><strong>Product Code:</strong> ${productcode}</li>
        <li><strong>Quantity:</strong> ${quantity}</li>
        <li><strong>Condition:</strong> ${condition}</li>
        <li><strong>Target Price:</strong> ${target_price}</li>
        <li><strong>Status:</strong> ${status}</li>
      </ul>`;

    sendEmail(from, adminTo, "📝 New Quote Request", mailHtml).catch(console.error);

    return res.json({ success: true });
  } catch (err) {
    console.error("handleQuoteRequest:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

module.exports.handleQuoteRequest = handleQuoteRequest;