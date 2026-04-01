const { query } = require("../config/db");

class BrandModel {
  static async create(brandId, brandName) {
    await query(
      `INSERT INTO brands (brand_id, brand_name, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (brand_id) DO UPDATE SET brand_name = EXCLUDED.brand_name`,
      [brandId, brandName]
    );
  }

  static async findAll() {
    const { rows } = await query(`SELECT * FROM brands ORDER BY brand_name`);
    return rows;
  }

  static async findById(brandId) {
    const { rows } = await query(`SELECT * FROM brands WHERE brand_id = $1`, [brandId]);
    return rows[0] || null;
  }
}

module.exports = { BrandModel };