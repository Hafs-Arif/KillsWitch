// models/activityLogModel.js
const { query } = require("../config/db");

class ActivityLogModel {
  static async create(activity, userEmail, details, orderId = null) {
    return query(
      `INSERT INTO activity_logs
         (activity, user_email, details, order_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [activity, userEmail || null, JSON.stringify(details), orderId]
    );
  }

  static async findByOrder(orderId) {
    const { rows } = await query(
      `SELECT * FROM activity_logs WHERE order_id = $1 ORDER BY created_at DESC`,
      [orderId]
    );
    return rows;
  }

  static async findAll(limit = 100, offset = 0) {
    const { rows } = await query(
      `SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return rows;
  }
}

module.exports = { ActivityLogModel };