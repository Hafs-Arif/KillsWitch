// models/contactModel.js
const { query } = require("../config/db");

class ContactModel {
  static async create(name, message, phoneNo, email) {
    await query(
      `INSERT INTO contacts (name, message, phoneno, email, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [name, message, phoneNo, email]
    );
  }
}

module.exports = { ContactModel };