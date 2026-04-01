const { query } = require("../config/db");

class BrandCategoryModel {
  static async create(id, brandId, categoryId, subCategoryId) {
    await query(
      `INSERT INTO brand_categories (id, brand_id, category_id, sub_category_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET 
         brand_id = COALESCE(EXCLUDED.brand_id, brand_id),
         category_id = COALESCE(EXCLUDED.category_id, category_id),
         sub_category_id = COALESCE(EXCLUDED.sub_category_id, sub_category_id),
         updated_at = NOW()`,
      [id, brandId, categoryId, subCategoryId]
    );
  }

  static async findAll() {
    const { rows } = await query(`SELECT * FROM brand_categories ORDER BY id`);
    return rows;
  }
}

module.exports = { BrandCategoryModel };