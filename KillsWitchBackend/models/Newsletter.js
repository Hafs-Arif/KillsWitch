const { query } = require("../config/db");

class NewsletterModel {
  static async findByEmail(email) {
    const { rows } = await query(`SELECT 1 FROM newsletters WHERE email = $1`, [email.toLowerCase()]);
    return rows.length > 0;
  }

  static async create(email) {
    const { rows } = await query(
      `INSERT INTO newsletters (email, created_at, updated_at)
       VALUES ($1, NOW(), NOW())
       RETURNING newsletter_id, email, created_at`,
      [email.toLowerCase()]
    );
    return rows[0];
  }

  static async findAll() {
    const { rows } = await query(
      `SELECT newsletter_id AS id, email, created_at FROM newsletters ORDER BY created_at DESC`
    );
    return rows;
  }

  static async delete(newsletterId) {
    const { rowCount } = await query(`DELETE FROM newsletters WHERE newsletter_id = $1`, [newsletterId]);
    return rowCount > 0;
  }
}
module.exports = { NewsletterModel };