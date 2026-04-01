const { query } = require("../config/db");

class UserModel {
  static async create(name, email, password, role = "user", phoneno = null, googleId = null, isGoogleAuth = false) {
    const { rows } = await query(
      `INSERT INTO users (name, email, password, role, phoneno, google_id, is_google_auth, created_at, updated_at, same_shipping_billing_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), false)
       RETURNING id, email, name, role`,
      [name, email.toLowerCase(), password, role, phoneno, googleId, isGoogleAuth]
    );
    return rows[0];
  }

  static async findByEmail(email) {
    const { rows } = await query(`SELECT * FROM users WHERE email = $1`, [email.toLowerCase()]);
    return rows[0] || null;
  }

  static async findById(id) {
    const { rows } = await query(`SELECT id, email, name, role, phoneno FROM users WHERE id = $1`, [id]);
    return rows[0] || null;
  }

  static async findByIdWithPassword(id) {
    const { rows } = await query(`SELECT id, email, name, role, phoneno, password, google_id FROM users WHERE id = $1`, [id]);
    return rows[0] || null;
  }

  static async updatePassword(email, hashedPassword) {
    await query(
      `UPDATE users SET password = $1, updated_at = NOW() WHERE email = $2`,
      [hashedPassword, email.toLowerCase()]
    );
  }
}

module.exports = { UserModel };