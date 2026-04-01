const { query } = require("../config/db");

class SubcategoryModel {
  static async create(subCategoryId, subCategoryName) {
    await query(
      `INSERT INTO subcategories (sub_category_id, sub_category_name, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (sub_category_id) DO UPDATE SET sub_category_name = EXCLUDED.sub_category_name`,
      [subCategoryId, subCategoryName]
    );
  }

  static async findAll() {
    const { rows } = await query(`SELECT * FROM subcategories ORDER BY sub_category_name`);
    return rows;
  }
}

module.exports = { SubcategoryModel };