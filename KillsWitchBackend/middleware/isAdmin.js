"use strict";

/**
 * Requires the authenticated user to have the "admin" role.
 * Must be used AFTER the `auth` middleware.
 */
module.exports = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ error: "Access denied. Admins only." });
};