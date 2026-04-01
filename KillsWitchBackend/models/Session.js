const { query } = require("../config/db");

class SessionModel {
  static async create(userId, tokenHash, userAgent, ipAddress, expiresAt) {
    await query(
      `INSERT INTO sessions (user_id, token_hash, user_agent, ip_address, expires_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [userId, tokenHash, userAgent.slice(0, 512), ipAddress, expiresAt]
    );
  }

  static async findByTokenHash(tokenHash) {
    const { rows } = await query(
      `SELECT * FROM sessions WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()`,
      [tokenHash]
    );
    return rows[0] || null;
  }

  static async revokeByUserId(userId) {
    await query(`UPDATE sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`, [userId]);
  }

  static async revokeByTokenHash(tokenHash) {
    await query(`UPDATE sessions SET revoked_at = NOW() WHERE token_hash = $1`, [tokenHash]);
  }
}

module.exports = { SessionModel };