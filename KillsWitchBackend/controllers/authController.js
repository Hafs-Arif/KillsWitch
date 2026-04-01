"use strict";

const bcrypt = require("bcrypt");
const jwt    = require("jsonwebtoken");
const crypto = require("crypto");

const { query, transaction }         = require("../config/db");
const { generateAccessToken, generateRefreshToken, getCookieOptions } = require("../utils/token");
const { OAuth2Client }               = require("google-auth-library");
const { sendEmail }                  = require("../utils/email");
const { otpEmailTemplate }           = require("../utils/emailTemplates");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ── Helpers ───────────────────────────────────────────────────────────────────

const hashToken  = (t)  => crypto.createHash("sha256").update(t).digest("hex");
const parseUa    = (req)=> (req.headers["user-agent"] || "").slice(0, 512);
const validEmail = (e)  => typeof e === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

async function createSession(userId, refreshToken, req) {
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await query(
    `INSERT INTO sessions (user_id, token_hash, user_agent, ip_address, expires_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
    [userId, tokenHash, parseUa(req), req.ip, expiresAt]
  );
}

// ── Register ──────────────────────────────────────────────────────────────────

exports.register = async (req, res) => {
  const { email, password, name, phoneno } = req.body;

  if (!validEmail(email))           return res.status(400).json({ message: "Valid email required" });
  if (!password || password.length < 8) return res.status(400).json({ message: "Password must be ≥ 8 chars" });
  if (!name?.trim())                return res.status(400).json({ message: "Name is required" });

  try {
    // Check duplicate — same generic error to prevent enumeration
    const { rowCount } = await query(
      "SELECT 1 FROM users WHERE email = $1",
      [email.toLowerCase()]
    );
    if (rowCount > 0) return res.status(400).json({ message: "Registration failed" });

    const hashed = await bcrypt.hash(password, 12);

    const { rows } = await query(
      `INSERT INTO users (name, email, password, phoneno, role, is_google_auth, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'user', false, NOW(), NOW())
       RETURNING id, email, name, role`,
      [name.trim(), email.toLowerCase(), hashed, phoneno || null]
    );
    const user = rows[0];

    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await createSession(user.id, refreshToken, req);

    const dur = user.role === "admin" ? 24 * 3600_000 : 7 * 24 * 3600_000;

    // Non-blocking activity log
    query(
      `INSERT INTO activity_logs (activity, user_email, details, created_at, updated_at)
       VALUES ('User Created', $1, $2, NOW(), NOW())`,
      [user.email, JSON.stringify({ name: user.name, email: user.email })]
    ).catch(console.error);

    return res
      .cookie("access_token",  accessToken,  getCookieOptions(dur))
      .cookie("refresh_token", refreshToken, getCookieOptions(30 * 24 * 3600_000))
      .status(201)
      .json({ message: "User registered", user });
  } catch (err) {
    console.error("register:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!validEmail(email) || !password)
    return res.status(401).json({ message: "Invalid credentials" });

  try {
    const { rows } = await query(
      "SELECT id, email, name, role, password FROM users WHERE email = $1",
      [email.toLowerCase()]
    );
    const user = rows[0];

    // Always run bcrypt to prevent timing-based enumeration
    const DUMMY = "$2b$12$notarealhashXXXXXXXXXXuDummyHashForTimingProtectionXXX";
    const match  = await bcrypt.compare(password, user?.password || DUMMY);

    if (!user || !match)
      return res.status(401).json({ message: "Invalid credentials" });

    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await createSession(user.id, refreshToken, req);

    const dur = user.role === "admin" ? 24 * 3600_000 : 7 * 24 * 3600_000;

    query(
      `INSERT INTO activity_logs (activity, user_email, details, created_at, updated_at)
       VALUES ('User Login', $1, $2, NOW(), NOW())`,
      [user.email, JSON.stringify({ email: user.email })]
    ).catch(console.error);

    return res
      .cookie("access_token",  accessToken,  getCookieOptions(dur))
      .cookie("refresh_token", refreshToken, getCookieOptions(30 * 24 * 3600_000))
      .json({ message: "Login successful" });
    // SECURITY: do not return raw tokens in the body when using httpOnly cookies
  } catch (err) {
    console.error("login:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── Google Signup ─────────────────────────────────────────────────────────────

exports.googleSignup = async (req, res) => {
  const { tokenId } = req.body;
  if (!tokenId) return res.status(400).json({ error: "tokenId required" });

  try {
    const ticket  = await googleClient.verifyIdToken({ idToken: tokenId, audience: process.env.GOOGLE_CLIENT_ID });
    const { email, sub: googleId, name } = ticket.getPayload();

    const { rowCount } = await query("SELECT 1 FROM users WHERE email = $1", [email.toLowerCase()]);
    if (rowCount > 0)
      return res.status(400).json({ error: "Email already registered. Try logging in." });

    const { rows } = await query(
      `INSERT INTO users (email, google_id, name, is_google_auth, role, created_at, updated_at)
       VALUES ($1, $2, $3, true, 'user', NOW(), NOW())
       RETURNING id, email, name, role`,
      [email.toLowerCase(), googleId, name]
    );
    const user = rows[0];

    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await createSession(user.id, refreshToken, req);

    return res
      .cookie("access_token",  accessToken,  getCookieOptions(15 * 60_000))
      .cookie("refresh_token", refreshToken, getCookieOptions(30 * 24 * 3600_000))
      .status(201)
      .json({ message: "Signup successful" });
  } catch (err) {
    console.error("googleSignup:", err.message);
    return res.status(500).json({ error: "Google signup failed" });
  }
};

// ── Refresh ───────────────────────────────────────────────────────────────────

exports.refresh = async (req, res) => {
  const provided = req.body?.refreshToken || req.cookies?.refresh_token;
  if (!provided) return res.status(401).json({ error: "Refresh token required" });

  try {
    let payload;
    try { payload = jwt.verify(provided, process.env.REFRESH_TOKEN_SECRET); }
    catch { return res.status(403).json({ error: "Invalid or expired token" }); }

    const tokenHash = hashToken(provided);
    const { rows }  = await query(
      `SELECT * FROM sessions
       WHERE user_id = $1 AND token_hash = $2 AND revoked_at IS NULL AND expires_at > NOW()`,
      [payload.id, tokenHash]
    );
    if (!rows.length) return res.status(403).json({ error: "Session invalid or expired" });

    // Rotate: revoke old session
    await query("UPDATE sessions SET revoked_at = NOW() WHERE token_hash = $1", [tokenHash]);

    const { rows: userRows } = await query(
      "SELECT id, email, role FROM users WHERE id = $1",
      [payload.id]
    );
    if (!userRows.length) return res.status(403).json({ error: "User not found" });
    const user = userRows[0];

    const newAccess  = generateAccessToken(user);
    const newRefresh = generateRefreshToken(user);
    await createSession(user.id, newRefresh, req);

    return res
      .cookie("access_token",  newAccess,  getCookieOptions(15 * 60_000))
      .cookie("refresh_token", newRefresh, getCookieOptions(30 * 24 * 3600_000))
      .json({ message: "Token refreshed" });
  } catch (err) {
    console.error("refresh:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── Logout ────────────────────────────────────────────────────────────────────

exports.logout = async (req, res) => {
  try {
    const provided = req.body?.refreshToken || req.cookies?.refresh_token;
    if (provided) {
      await query(
        "UPDATE sessions SET revoked_at = NOW() WHERE token_hash = $1",
        [hashToken(provided)]
      );
    }
    return res.clearCookie("access_token").clearCookie("refresh_token").json({ success: true });
  } catch (err) {
    console.error("logout:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.logoutAll = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });
    await query(
      "UPDATE sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL",
      [req.user.id]
    );
    return res.clearCookie("access_token").clearCookie("refresh_token").json({ success: true });
  } catch (err) {
    console.error("logoutAll:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── Forgot / Reset Password ───────────────────────────────────────────────────

exports.forgePassword = async (req, res) => {
  const { email } = req.body;
  if (!validEmail(email)) return res.status(400).json({ message: "Valid email required" });

  const GENERIC = { message: "If that email is registered, an OTP has been sent." };

  try {
    const { rows } = await query("SELECT id, email FROM users WHERE email = $1", [email.toLowerCase()]);
    if (!rows.length) return res.json(GENERIC);   // silent – no enumeration

    const otp      = String(crypto.randomInt(100_000, 999_999));
    const expireAt = new Date(Date.now() + 10 * 60_000);

    await query(
      `INSERT INTO password_resets (email, otp, expire_at, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())`,
      [email.toLowerCase(), otp, expireAt]
    );

    const from             = process.env.SMTP_FROM || process.env.SMTP_USER;
    const { subject, html } = otpEmailTemplate({ otp, appName: "Killswitch", validityMinutes: 10 });
    await sendEmail(from, email, subject, html);

    return res.json(GENERIC);
  } catch (err) {
    console.error("forgePassword:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!validEmail(email) || !otp) return res.status(400).json({ error: "Email and OTP required" });

  try {
    const { rows } = await query(
      `SELECT * FROM password_resets
       WHERE email = $1 AND otp = $2 AND expire_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email.toLowerCase(), String(otp)]
    );
    if (!rows.length) return res.status(400).json({ error: "Invalid or expired OTP" });
    return res.json({ message: "OTP verified" });
  } catch (err) {
    console.error("verifyOtp:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, password } = req.body;
  if (!validEmail(email) || !password || password.length < 8)
    return res.status(400).json({ message: "Valid email and password (≥8 chars) required" });

  try {
    const { rows } = await query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()]
    );
    if (!rows.length) return res.status(404).json({ message: "User not found" });

    const hashed = await bcrypt.hash(password, 12);

    await transaction(async (tx) => {
      await tx("UPDATE users SET password = $1, updated_at = NOW() WHERE email = $2", [hashed, email.toLowerCase()]);
      await tx("DELETE FROM password_resets WHERE email = $1", [email.toLowerCase()]);
      // Revoke all sessions so old tokens can't be reused
      await tx("UPDATE sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL", [rows[0].id]);
    });

    query(
      `INSERT INTO activity_logs (activity, user_email, details, created_at, updated_at)
       VALUES ('Password Reset', $1, $2, NOW(), NOW())`,
      [email.toLowerCase(), JSON.stringify({ email, timestamp: new Date() })]
    ).catch(console.error);

    return res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("resetPassword:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── Profile ───────────────────────────────────────────────────────────────────

exports.getProfile = async (req, res) => {
  try {
    const { rows } = await query(
      "SELECT id, email, name, phoneno, role, same_shipping_billing_default FROM users WHERE id = $1",
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: "User not found" });
    return res.json({ user: rows[0] });
  } catch (err) {
    console.error("getProfile:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateProfile = async (req, res) => {
  const { name, email, phoneno, password, sameShippingBillingDefault } = req.body;
  try {
    const { rows } = await query("SELECT * FROM users WHERE id = $1", [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: "User not found" });

    const user = rows[0];
    // Build dynamic SET clause — only update provided fields
    const updates = [];
    const vals    = [];
    let   i       = 1;

    if (name  !== undefined) { updates.push(`name = $${i++}`);   vals.push(name.trim()); }
    if (phoneno !== undefined){ updates.push(`phoneno = $${i++}`);vals.push(phoneno); }
    if (sameShippingBillingDefault !== undefined) {
      updates.push(`same_shipping_billing_default = $${i++}`);
      vals.push(!!sameShippingBillingDefault);
    }
    if (email !== undefined && email !== user.email) {
      if (!validEmail(email)) return res.status(400).json({ message: "Invalid email" });
      const { rowCount } = await query("SELECT 1 FROM users WHERE email = $1 AND id != $2", [email.toLowerCase(), req.user.id]);
      if (rowCount > 0) return res.status(400).json({ message: "Email already in use" });
      updates.push(`email = $${i++}`); vals.push(email.toLowerCase());
    }
    if (password) {
      if (password.length < 8) return res.status(400).json({ message: "Password too short" });
      updates.push(`password = $${i++}`); vals.push(await bcrypt.hash(password, 12));
    }

    if (!updates.length) return res.json({ success: true, message: "Nothing to update" });

    updates.push(`updated_at = NOW()`);
    vals.push(req.user.id);

    const { rows: updated } = await query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${i} RETURNING id, email, name, phoneno, role`,
      vals
    );
    return res.json({ success: true, user: updated[0] });
  } catch (err) {
    console.error("updateProfile:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateUserRole = async (req, res) => {
  const { email, newRole } = req.body;
  const ALLOWED = ["admin", "user"];

  if (!email || !newRole)             return res.status(400).json({ message: "email and newRole required" });
  if (!ALLOWED.includes(newRole))     return res.status(400).json({ message: "Invalid role" });

  try {
    const { rows } = await query(
      "UPDATE users SET role = $1, updated_at = NOW() WHERE email = $2 RETURNING id, email, role",
      [newRole, email.toLowerCase()]
    );
    if (!rows.length) return res.status(404).json({ message: "User not found" });
    return res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error("updateUserRole:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};