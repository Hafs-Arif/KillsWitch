const { query } = require("../config/db");

class AdminRequestModel {
  static async create(isApproved, userEmail, orderId, updatedShippingAddress, updatedShippingPhone) {
    await query(
      `INSERT INTO admin_requests
         (admin_request_id, IsApproved, user_email, order_id, updatedshippingAddress, updatedshippingPhone, created_at, updated_at)
       VALUES (DEFAULT, $1, $2, $3, $4, $5, NOW(), NOW())`,
      [isApproved, userEmail, orderId, updatedShippingAddress, updatedShippingPhone]
    );
  }

  static async approve(requestId, isApproved = true) {
    await query(`UPDATE admin_requests SET IsApproved = $1, updated_at = NOW() WHERE admin_request_id = $2`, [isApproved, requestId]);
  }
}

module.exports = { AdminRequestModel };