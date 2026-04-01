const { query } = require("../config/db");

class PasswordResetModel {
  static async create(email, otp, expireAt) {
    await query(
      `INSERT INTO password_resets (email, otp, expire_at, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())`,
      [email.toLowerCase(), otp, expireAt]
    );
  }

  static async findActive(email, otp) {
    const { rows } = await query(
      `SELECT * FROM password_resets WHERE email = $1 AND otp = $2 AND expire_at > NOW() ORDER BY created_at DESC LIMIT 1`,
      [email.toLowerCase(), String(otp)]
    );
    return rows[0] || null;
  }

  static async deleteByEmail(email) {
    await query(`DELETE FROM password_resets WHERE email = $1`, [email.toLowerCase()]);
  }
}

module.exports = { PasswordResetModel };