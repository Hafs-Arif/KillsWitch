const { query, transaction } = require("../config/db");

class OrderItemModel {
  static async bulkCreate(orderId, items) {
    if (!items.length) return;

    await transaction(async (tx) => {
      const valuePlaceholders = [];
      const vals = [];
      let idx = 1;

      for (const item of items) {
        valuePlaceholders.push(
          `($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, NOW(), NOW())`
        );
        vals.push(
          orderId,
          item.productId,
          item.productName,
          parseFloat(item.price),
          parseInt(item.quantity, 10) || 1,
          item.condition || "USED"
        );
      }

      await tx(
        `INSERT INTO order_items
           (order_id, product_id, product_name, price, quantity, condition, created_at, updated_at)
         VALUES ${valuePlaceholders.join(", ")}`,
        vals
      );
    });
  }

  static async findByOrderId(orderId) {
    const { rows } = await query(`SELECT * FROM order_items WHERE order_id = $1`, [orderId]);
    return rows;
  }
}

module.exports = { OrderItemModel };