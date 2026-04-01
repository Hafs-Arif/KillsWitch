"use strict";

const jwt = require("jsonwebtoken");

/**
 * Full auth – requires a valid JWT.
 * Accepts token from Authorization header OR httpOnly cookie.
 * SECURITY: Never accepts token from query string (?token=...).
 */
exports.auth = (req, res, next) => {
  const token = _extractToken(req);
  if (!token) {
    return res.status(401).json({ error: "Authorization token missing" });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (ex) {
    // Don't leak whether the token was expired vs invalid
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

/**
 * Optional auth – never fails the request but populates req.user if a
 * valid token is present.
 */
exports.optionalAuth = (req, _res, next) => {
  const token = _extractToken(req);
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      // ignore – treat as unauthenticated
    }
  }
  next();
};

/**
 * Role-based authorization guard.
 * Usage:  router.delete("/x", auth, authorize(["admin"]), handler)
 */
exports.authorize = (roles = []) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: "Forbidden: insufficient permissions" });
  }
  next();
};

// ── Private helpers ───────────────────────────────────────────────────────────

function _extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  // httpOnly cookie – safe because JS on the page cannot read it
  if (req.cookies && req.cookies.access_token) {
    return req.cookies.access_token;
  }
  // SECURITY: intentionally NOT reading from req.query.token
  return null;
}