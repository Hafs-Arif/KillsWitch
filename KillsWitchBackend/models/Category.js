class CategoryModel {
  static async create(categoryId, categoryName) {
    await query(
      `INSERT INTO categories (product_category_id, category_name, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (product_category_id) DO UPDATE SET category_name = EXCLUDED.category_name`,
      [categoryId, categoryName]
    );
  }

  static async findAll() {
    const { rows } = await query(`SELECT * FROM categories ORDER BY category_name`);
    return rows;
  }
}

module.exports = { CategoryModel };