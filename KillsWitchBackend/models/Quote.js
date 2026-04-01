const { query } = require("../config/db");

class QuoteModel {
  static async create(name, email, phoneNo, message, productcode, quantity, condition, targetPrice, status = "pending") {
    const parsedQty = quantity ? parseInt(quantity, 10) : null;
    const parsedPrice = targetPrice ? parseFloat(targetPrice) : null;

    await query(
      `INSERT INTO quotes
         (name, email, phoneno, message, productcode, quantity, condition, target_price, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
      [name, email.toLowerCase(), phoneNo, message, productcode, parsedQty, condition, parsedPrice, status]
    );
  }

  static async findAll() {
    const { rows } = await query(`SELECT * FROM quotes ORDER BY created_at DESC`);
    return rows;
  }

  static async delete(id) {
    const { rowCount } = await query(`DELETE FROM quotes WHERE quote_id = $1`, [id]);
    return rowCount > 0;
  }
}

module.exports = { QuoteModel };