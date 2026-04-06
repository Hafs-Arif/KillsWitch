"use strict";

const nodemailer = require("nodemailer");

// Build a transporter from environment variables
// Required: SMTP_USER, SMTP_PASS
// Optional: SMTP_HOST (default: smtp.gmail.com), SMTP_PORT (default: 587), SMTP_SECURE (true|false), SMTP_FROM
const getTransporter = () => {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);
  const secureEnv = String(process.env.SMTP_SECURE || "false").toLowerCase();
  const secure = secureEnv === "true" || port === 465; // true for 465, false for other ports

  const user = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.email_user;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.email_pass;

  if (!user || !pass) {
    throw new Error(
      "SMTP credentials are not set. Please provide SMTP_USER and SMTP_PASS in environment variables"
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
};

// Singleton transporter
let transporter;
function getOrCreateTransporter() {
  if (!transporter) {
    transporter = getTransporter();
  }
  return transporter;
}

// Send an email
// Options may include: to, subject, html, text, attachments
async function sendMail({ from, to, subject, html, text, attachments }) {
  const tx = getOrCreateTransporter();
  // always prefer explicit from address; fallback to contact@killswitch.us if none set
  const defaultFrom =
    process.env.SMTP_FROM ||
    process.env.EMAIL_FROM ||
    process.env.email_from ||
    process.env.SMTP_USER ||
    process.env.EMAIL_USER ||
    process.env.email_user ||
    'contact@killswitch.us';

  // debug log so we can verify which address is being used
  console.log('Mailer defaultFrom:', defaultFrom);

  const mailOptions = {
    from: from || defaultFrom,
    to,
    subject, 
    html,
    text,
    attachments,
  };

  // ensure from stays set correctly regardless of passed value
  mailOptions.from = mailOptions.from || defaultFrom;
  return tx.sendMail(mailOptions);
}

module.exports = {
  sendMail,
};
