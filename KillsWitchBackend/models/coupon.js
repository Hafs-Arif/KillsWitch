const { query } = require("../config/db");

class CouponModel {
  static async findByCode(code) {
    const { rows } = await query(`SELECT * FROM coupons WHERE code = $1 AND is_active = true`, [code.toUpperCase()]);
    return rows[0] || null;
  }

  static async create(code, description, discountType, discountValue, minPurchaseAmount, maxUses, expiresAt, isActive) {
    const { rows } = await query(
      `INSERT INTO coupons
         (code, description, discount_type, discount_value, min_purchase_amount, max_uses, uses_count, expires_at, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8, NOW(), NOW())
       RETURNING *`,
      [code.toUpperCase(), description, discountType, discountValue, minPurchaseAmount, maxUses, expiresAt, isActive]
    );
    return rows[0];
  }

  static async incrementUsage(couponId) {
    await query(`UPDATE coupons SET uses_count = uses_count + 1, updated_at = NOW() WHERE id = $1`, [couponId]);
  }

  static async delete(id) {
    const { rowCount } = await query(`DELETE FROM coupons WHERE id = $1`, [id]);
    return rowCount > 0;
  }
}

module.exports = { CouponModel };