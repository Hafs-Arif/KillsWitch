const { query } = require("../config/db");

class PaymentModel {
  // ─── CREATE ────────────────────────────────────────────────────────────────
  static async create(userId, paymentMethod, amount, name = null, 
                      cardExpire = null, cardCVC = null, cardNumber = null) {
    
    // ⚠️ SECURITY NOTE: Never store full credit card numbers in plain text.
    // In a real production app, use PCI-compliant methods (Stripe Elements, tokenization).
    return query(
      `INSERT INTO payments 
         (user_id, payment_method, amount, payment_name, 
          card_expire, card_cvc, card_number, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING payment_id`,
      [userId, paymentMethod, amount || null, name, cardExpire, cardCVC, cardNumber]
    );
  }

  // ─── FIND BY USER ID ────────────────────────────────────────────────────────
  static async findByUserId(userId) {
    const { rows } = await query(
      `SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  }

  // ─── FIND BY PAYMENT ID ──────────────────────────────────────────────────────
  static async findById(paymentId) {
    const { rows } = await query(`SELECT * FROM payments WHERE payment_id = $1`, [paymentId]);
    return rows[0] || null;
  }

  // ─── UPDATE (e.g., mark as processed or link to order) ───────────────────────
  static async updateStatus(paymentId, status) {
    await query(
      `UPDATE payments SET payment_status = $1, updated_at = NOW() WHERE payment_id = $2`,
      [status, paymentId]
    );
  }

  // ─── DELETE (Soft delete preferred for audit trails) ─────────────────────────
  static async softDelete(paymentId) {
    await query(
      `UPDATE payments SET deleted_at = NOW() WHERE payment_id = $1`,
      [paymentId]
    );
  }
}

module.exports = { PaymentModel };