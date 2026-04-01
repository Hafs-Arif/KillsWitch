const { query } = require("../config/db");

class CartItemModel {
  static async create(cartId, productId, quantity, price) {
    return query(
      `INSERT INTO cart_items
         (cart_id, product_id, quantity, price, total_price, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $3 * $4, NOW(), NOW())
       RETURNING *`,
      [cartId, productId, quantity, price]
    );
  }

  static async updateQuantity(cartItemId, newQuantity, price) {
    await query(
      `UPDATE cart_items
         SET quantity = $1, total_price = $1 * $2, updated_at = NOW()
         WHERE id = $3`,
      [newQuantity, price, cartItemId]
    );
  }

  static async findByCart(cartId) {
    const { rows } = await query(`SELECT * FROM cart_items WHERE cart_id = $1`, [cartId]);
    return rows;
  }

  static async delete(cartItemId) {
    const { rowCount } = await query(`DELETE FROM cart_items WHERE id = $1`, [cartItemId]);
    return rowCount > 0;
  }

  static async removeOutOfStock(items) {
    // items array: [{id, productId}]
    const values = items.map(item => 
      `($1::text, $${item.id + 2})`
    ).join(", ");
    
    const ids = [items.length].concat(items.map((_, i) => i + 2));
    // Simplified version
    for (const item of items) {
      await CartItemModel.delete(item.id);
    }
  }
}

module.exports = { CartItemModel };