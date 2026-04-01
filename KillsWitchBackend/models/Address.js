// models/addressModel.js
const { query } = require("../config/db");

class AddressModel {
  static async create(userId, type, name, phone, address, city, state, country, email, company = null, isDefault = false) {
    const { rows } = await query(
      `INSERT INTO addresses
         (user_id, type, name, phone, address, city, state, country, email, company, is_default, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
       RETURNING *`,
      [userId, type, name, phone, address, city, state, country, email, company, isDefault]
    );
    return rows[0];
  }

  static async findByUserId(userId) {
    const { rows } = await query(
      `SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );
    return rows;
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;

    if ("name" in data) { fields.push(`name = $${idx++}`); values.push(data.name); }
    if ("type" in data) { fields.push(`type = $${idx++}`); values.push(data.type); }
    if ("phone" in data) { fields.push(`phone = $${idx++}`); values.push(data.phone); }
    if ("address" in data) { fields.push(`address = $${idx++}`); values.push(data.address); }
    if ("city" in data) { fields.push(`city = $${idx++}`); values.push(data.city); }
    if ("state" in data) { fields.push(`state = $${idx++}`); values.push(data.state); }
    if ("country" in data) { fields.push(`country = $${idx++}`); values.push(data.country); }
    if ("email" in data) { fields.push(`email = $${idx++}`); values.push(data.email); }
    if ("company" in data) { fields.push(`company = $${idx++}`); values.push(data.company); }
    if ("isDefault" in data) { fields.push(`is_default = $${idx++}`); values.push(data.isDefault); }

    if (fields.length > 0) {
      fields.push(`updated_at = NOW()`);
      values.push(id);
      
      const { rows } = await query(
        `UPDATE addresses SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
        values
      );
      return rows[0];
    }
  }

  static async destroy(id) {
    const { rowCount } = await query(
      `DELETE FROM addresses WHERE id = $1`,
      [id]
    );
    return rowCount > 0;
  }
}

module.exports = { AddressModel };