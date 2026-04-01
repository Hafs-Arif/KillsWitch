const { query, transaction } = require("../config/db");

class CartModel {
  static async create(userId, sessionId) {
    const { rows } = await query(
      `INSERT INTO carts
         (user_id, session_id, status, total_items, total_amount, currency, expires_at, created_at, updated_at)
       VALUES ($1, $2, 'active', 0, 0.00, 'USD', NULL, NOW(), NOW())
       RETURNING *`,
      [userId || null, sessionId]
    );
    return rows[0];
  }

  static async findById(id) {
    const { rows } = await query(`SELECT * FROM carts WHERE id = $1`, [id]);
    return rows[0] || null;
  }

  static async findBySession(sessionId) {
    const { rows } = await query(`SELECT * FROM carts WHERE session_id = $1 AND status != 'converted'`, [sessionId]);
    return rows[0] || null;
  }

  static async updateTotalAmount(cartId, totalItems, totalAmount) {
    await query(
      `UPDATE carts SET total_items = $1, total_amount = $2, updated_at = NOW() WHERE id = $3`,
      [totalItems, totalAmount, cartId]
    );
  }

  static async setStatus(id, status) {
    await query(`UPDATE carts SET status = $1, updated_at = NOW() WHERE id = $2`, [status, id]);
  }

  static async expireInactive() {
    await query(`UPDATE carts SET status = 'abandoned', updated_at = NOW() WHERE status = 'active' AND created_at < NOW() - INTERVAL '30 minutes'`);
  }
}

module.exports = { CartModel };