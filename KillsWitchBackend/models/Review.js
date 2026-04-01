const { query } = require("../config/db");

class ReviewModel {
  static async create(rating, comment, reviewerName, productId, userId) {
    await query(
      `INSERT INTO reviews (rating, comment, reviewer_name, product_id, user_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [rating, comment, reviewerName, productId, userId || null]
    );
  }

  static async findByProductId(productId) {
    const { rows } = await query(`SELECT * FROM reviews WHERE product_id = $1 ORDER BY created_at DESC`, [productId]);
    return rows;
  }

  static async findByUser(userId) {
    const { rows } = await query(`SELECT * FROM reviews WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
    return rows;
  }
}

module.exports = { ReviewModel };