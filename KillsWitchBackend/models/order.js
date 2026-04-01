const { query, transaction } = require("../config/db");

class OrderModel {
  static async create(userData) {
    const {
      orderId, userId, email, amount, paymentIntentId, trackingNumber,
      shippingName, shippingMethod, shippingCompany, shippingPhone,
      shippingAddress, shippingCity, shippingState, shippingCountry,
      billingName, billingCompany, billingPhone, billingAddress, billingCity, billingState, billingCountry,
      subtotal, shippingCost, tax, totalPrice, isFullCart
    } = userData;

    const { rows } = await transaction(async (tx) => {
      const { rows: orderRows } = await tx(
        `INSERT INTO orders
           (order_id, user_id, email, amount, payment_intent_id, payment_status, order_status, tracking_number,
            shipping_name, shipping_method, shipping_company, shipping_phone,
            shipping_address, shipping_city, shipping_state, shipping_country,
            billing_name, billing_company, billing_phone, billing_address, billing_city, billing_state, billing_country,
            subtotal, shipping_cost, tax, total_price, is_full_cart,
            created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,'completed','processing',$6,
                 $7,$8,$9,$10,$11,$12,$13,$14,
                 $15,$16,$17,$18,$19,$20,$21,
                 $22,$23,$24,$25,$26,
                 NOW(), NOW())
         RETURNING *`,
        [
          orderId, userId, email, amount, paymentIntentId, trackingNumber,
          shippingName, shippingMethod, shippingCompany, shippingPhone,
          shippingAddress, shippingCity, shippingState, shippingCountry,
          billingName, billingCompany, billingPhone, billingAddress, billingCity, billingState, billingCountry,
          subtotal, parseFloat(shippingCost), tax, totalPrice, isFullCart
        ]
      );
      return orderRows[0];
    });

    return rows;
  }

  static async findByOrderId(orderId) {
    const { rows } = await query(`SELECT * FROM orders WHERE order_id = $1`, [orderId]);
    return rows[0] || null;
  }

  static async findByEmail(email) {
    const { rows } = await query(`SELECT * FROM orders WHERE email = $1 ORDER BY created_at DESC`, [email]);
    return rows;
  }

  static async findByUser(userId) {
    const { rows } = await query(`SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
    return rows;
  }

  static async updateStatus(orderId, status, paymentStatus = null) {
    const fields = ["order_status = $1"];
    const values = [status];
    let idx = 2;

    if (paymentStatus) {
      fields.push(`payment_status = $${idx++}`);
      values.push(paymentStatus);
    }

    fields.push(`updated_at = NOW()`);
    values.push(orderId);

    await query(
      `UPDATE orders SET ${fields.join(", ")} WHERE order_id = $${idx} AND payment_intent_id IS NOT NULL`,
      values.slice(0, -1) // exclude ID placeholder
    );
  }
}

module.exports = { OrderModel };