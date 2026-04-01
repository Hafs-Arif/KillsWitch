const { query } = require("../config/db");

class ProductModel {
  static async bulkCreate(products) {
    if (!products.length) return 0;

    const valuePlaceholders = [];
    const vals = [];
    let idx = 1;

    for (const p of products) {
      valuePlaceholders.push(
        `($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++},
         $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, NOW(), NOW())`
      );
      vals.push(
        p.product_id,
        p.part_number,
        p.brandcategoryId,
        p.image,
        p.condition,
        p.sub_condition,
        parseFloat(p.price),
        parseInt(p.quantity, 10),
        p.short_description,
        p.long_description,
        p.status
      );
    }

    const { rowCount } = await query(
      `INSERT INTO products
         (product_id, part_number, brandcategory_id, image, condition, sub_condition, price, quantity, short_description, long_description, status, created_at, updated_at)
       VALUES ${valuePlaceholders.join(", ")}`,
      vals
    );
    return rowCount;
  }

  static async findById(product_id) {
    const { rows } = await query(`SELECT * FROM products WHERE product_id = $1`, [product_id]);
    return rows[0] || null;
  }

  static async findByPartNumber(partNumber) {
    const { rows } = await query(`SELECT * FROM products WHERE part_number = $1`, [partNumber]);
    return rows[0] || null;
  }

  static async search(queryString) {
    const { rows } = await query(
      `SELECT * FROM products 
       WHERE (short_description ILIKE $1 OR long_description ILIKE $1 OR part_number ILIKE $1)
       AND status = 'available'
       LIMIT 20`,
      [`%${queryString}%`]
    );
    return rows;
  }
}

module.exports = { ProductModel };