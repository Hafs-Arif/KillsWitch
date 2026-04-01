// controllers/brandController.js  –  raw SQL (pg)
"use strict";

const { query, transaction } = require("../config/db");

// ═══════════════════════════════════════════════════════════════════════════════
// READ / BROWSE  (public)
// ═══════════════════════════════════════════════════════════════════════════════

exports.getAllProductWithBrandAndCategory = async (req, res) => {
  const { brandId, categoryId, subcategoryId } = req.query;
  if (!brandId) return res.status(400).json({ error: "brandId is required" });

  const bid = parseInt(brandId, 10);
  if (isNaN(bid)) return res.status(400).json({ error: "Invalid brandId" });

  try {
    const params = [bid];
    let catFilter = "";
    let subFilter = "";

    if (categoryId)   { catFilter = `AND c.product_category_id = $${params.push(parseInt(categoryId,   10))}`; }
    if (subcategoryId){ subFilter = `AND sc.sub_category_id    = $${params.push(parseInt(subcategoryId, 10))}`; }

    const { rows } = await query(
      `SELECT
         b.brand_id, b.brand_name,
         c.product_category_id AS category_id, c.category_name,
         sc.sub_category_id,  sc.sub_category_name,
         p.product_id, p.part_number, p.price, p.image, p.condition, p.status
       FROM brands b
       JOIN brandcategory bc ON bc.brand_id            = b.brand_id     ${catFilter} ${subFilter}
       JOIN categories    c  ON c.product_category_id  = bc.category_id
       JOIN subcategories sc ON sc.sub_category_id     = bc.sub_category_id
       LEFT JOIN products p  ON p.brandcategory_id     = bc.id
       WHERE b.brand_id = $1
       ORDER BY c.product_category_id, sc.sub_category_id, p.product_id`,
      params
    );

    if (!rows.length) return res.status(404).json({ error: "No matching data found" });
    return res.json(rows);
  } catch (err) {
    console.error("getAllProductWithBrandAndCategory:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getPartName = async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT
         b.brand_id, b.brand_name,
         c.product_category_id, c.category_name,
         sc.sub_category_id, sc.sub_category_name,
         p.product_id, p.part_number
       FROM brands b
       JOIN brandcategory bc ON bc.brand_id            = b.brand_id
       JOIN categories    c  ON c.product_category_id  = bc.category_id
       JOIN subcategories sc ON sc.sub_category_id     = bc.sub_category_id
       LEFT JOIN products p  ON p.brandcategory_id     = bc.id
       ORDER BY b.brand_id, c.product_category_id, sc.sub_category_id, p.product_id`
    );

    // Build nested structure in JS
    const brandMap = new Map();
    for (const r of rows) {
      if (!brandMap.has(r.brand_id)) {
        brandMap.set(r.brand_id, { brand_id: r.brand_id, brand_name: r.brand_name, categories: [] });
      }
      const brand = brandMap.get(r.brand_id);
      let cat = brand.categories.find(c => c.category_id === r.product_category_id);
      if (!cat) {
        cat = { category_id: r.product_category_id, category_name: r.category_name, subcategories: [] };
        brand.categories.push(cat);
      }
      let sub = cat.subcategories.find(s => s.subcategory_id === r.sub_category_id);
      if (!sub) {
        sub = { subcategory_id: r.sub_category_id, subcategory_name: r.sub_category_name, products: [] };
        cat.subcategories.push(sub);
      }
      if (r.product_id && !sub.products.find(p => p.product_id === r.product_id)) {
        sub.products.push({ product_id: r.product_id, product_name: r.part_number });
      }
    }
    return res.json(Array.from(brandMap.values()));
  } catch (err) {
    console.error("getPartName:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getBrandsByCategory = async (req, res) => {
  const { categoryName } = req.query;
  if (!categoryName) return res.status(400).json({ error: "categoryName is required" });

  try {
    const { rows } = await query(
      `SELECT
         b.brand_id, b.brand_name,
         c.product_category_id, c.category_name,
         sc.sub_category_id, sc.sub_category_name,
         p.product_id, p.part_number, p.price, p.quantity,
         p.short_description, p.long_description, p.image,
         p.sub_condition, p.condition
       FROM brands b
       JOIN brandcategory bc ON bc.brand_id            = b.brand_id
       JOIN categories    c  ON c.product_category_id  = bc.category_id  AND c.category_name ILIKE $1
       JOIN subcategories sc ON sc.sub_category_id     = bc.sub_category_id
       LEFT JOIN products p  ON p.brandcategory_id     = bc.id
       ORDER BY b.brand_id, c.product_category_id, sc.sub_category_id`,
      [`%${categoryName}%`]
    );

    if (!rows.length) return res.status(404).json({ error: "No matching categories found" });
    return res.json(rows);
  } catch (err) {
    console.error("getBrandsByCategory:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAllCategoriesOfAllBrand = async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT b.brand_id, b.brand_name,
              JSON_AGG(DISTINCT c.category_name) AS categories
       FROM brands b
       LEFT JOIN brandcategory bc ON bc.brand_id            = b.brand_id
       LEFT JOIN categories    c  ON c.product_category_id  = bc.category_id
       GROUP BY b.brand_id, b.brand_name
       ORDER BY b.brand_id`
    );
    return res.json(rows);
  } catch (err) {
    console.error("getAllCategoriesOfAllBrand:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// BRANDS CRUD  (admin)
// ═══════════════════════════════════════════════════════════════════════════════

exports.getAllBrands = async (_req, res) => {
  try {
    const { rows } = await query("SELECT brand_id, brand_name FROM brands ORDER BY brand_id");
    return res.json(rows);
  } catch (err) {
    console.error("getAllBrands:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.createBrand = async (req, res) => {
  const { brand_name, brand_id } = req.body;
  if (!brand_name || !brand_id) return res.status(400).json({ error: "brand_name and brand_id are required" });

  try {
    const { rowCount } = await query("SELECT 1 FROM brands WHERE brand_id = $1", [brand_id]);
    if (rowCount) return res.status(409).json({ error: "Brand ID already exists" });

    const { rows } = await query(
      "INSERT INTO brands (brand_id, brand_name) VALUES ($1, $2) RETURNING *",
      [parseInt(brand_id, 10), brand_name.trim()]
    );
    return res.status(201).json({ message: "Brand created", brand: rows[0] });
  } catch (err) {
    console.error("createBrand:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateBrand = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { brand_name } = req.body;
  if (!brand_name) return res.status(400).json({ error: "brand_name is required" });

  try {
    const { rows } = await query(
      "UPDATE brands SET brand_name = $1 WHERE brand_id = $2 RETURNING *",
      [brand_name.trim(), id]
    );
    if (!rows.length) return res.status(404).json({ error: "Brand not found" });
    return res.json({ message: "Brand updated", brand: rows[0] });
  } catch (err) {
    console.error("updateBrand:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteBrand = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const { rowCount: inUse } = await query(
      "SELECT 1 FROM brandcategory WHERE brand_id = $1 LIMIT 1", [id]
    );
    if (inUse) return res.status(400).json({ error: "Brand is in use; remove its category links first" });

    const { rowCount } = await query("DELETE FROM brands WHERE brand_id = $1", [id]);
    if (!rowCount) return res.status(404).json({ error: "Brand not found" });
    return res.json({ message: "Brand deleted" });
  } catch (err) {
    console.error("deleteBrand:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORIES CRUD  (admin)
// ═══════════════════════════════════════════════════════════════════════════════

exports.getAllCategories = async (_req, res) => {
  try {
    const { rows } = await query("SELECT * FROM categories ORDER BY product_category_id");
    return res.json(rows);
  } catch (err) {
    console.error("getAllCategories:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.createCategory = async (req, res) => {
  const { category_name, product_category_id } = req.body;
  if (!category_name || !product_category_id)
    return res.status(400).json({ error: "category_name and product_category_id are required" });

  try {
    const { rowCount } = await query(
      "SELECT 1 FROM categories WHERE product_category_id = $1", [product_category_id]
    );
    if (rowCount) return res.status(409).json({ error: "Category ID already exists" });

    const { rows } = await query(
      "INSERT INTO categories (product_category_id, category_name) VALUES ($1,$2) RETURNING *",
      [parseInt(product_category_id, 10), category_name.trim()]
    );
    return res.status(201).json({ message: "Category created", category: rows[0] });
  } catch (err) {
    console.error("createCategory:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateCategory = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { category_name } = req.body;
  if (!category_name) return res.status(400).json({ error: "category_name is required" });

  try {
    const { rows } = await query(
      "UPDATE categories SET category_name=$1 WHERE product_category_id=$2 RETURNING *",
      [category_name.trim(), id]
    );
    if (!rows.length) return res.status(404).json({ error: "Category not found" });
    return res.json({ message: "Category updated", category: rows[0] });
  } catch (err) {
    console.error("updateCategory:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteCategory = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const { rowCount } = await query("DELETE FROM categories WHERE product_category_id=$1", [id]);
    if (!rowCount) return res.status(404).json({ error: "Category not found" });
    return res.json({ message: "Category deleted" });
  } catch (err) {
    console.error("deleteCategory:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUBCATEGORIES CRUD  (admin)
// ═══════════════════════════════════════════════════════════════════════════════

exports.getAllSubcategories = async (_req, res) => {
  try {
    const { rows } = await query("SELECT * FROM subcategories ORDER BY sub_category_id");
    return res.json(rows);
  } catch (err) {
    console.error("getAllSubcategories:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.createSubcategory = async (req, res) => {
  const { sub_category_name, sub_category_id } = req.body;
  if (!sub_category_name || !sub_category_id)
    return res.status(400).json({ error: "sub_category_name and sub_category_id are required" });

  try {
    const { rowCount } = await query(
      "SELECT 1 FROM subcategories WHERE sub_category_id = $1", [sub_category_id]
    );
    if (rowCount) return res.status(409).json({ error: "Subcategory ID already exists" });

    const { rows } = await query(
      "INSERT INTO subcategories (sub_category_id, sub_category_name) VALUES ($1,$2) RETURNING *",
      [parseInt(sub_category_id, 10), sub_category_name.trim()]
    );
    return res.status(201).json({ message: "Subcategory created", subcategory: rows[0] });
  } catch (err) {
    console.error("createSubcategory:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateSubcategory = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { sub_category_name } = req.body;
  if (!sub_category_name) return res.status(400).json({ error: "sub_category_name is required" });

  try {
    const { rows } = await query(
      "UPDATE subcategories SET sub_category_name=$1 WHERE sub_category_id=$2 RETURNING *",
      [sub_category_name.trim(), id]
    );
    if (!rows.length) return res.status(404).json({ error: "Subcategory not found" });
    return res.json({ message: "Subcategory updated", subcategory: rows[0] });
  } catch (err) {
    console.error("updateSubcategory:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteSubcategory = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const { rowCount } = await query("DELETE FROM subcategories WHERE sub_category_id=$1", [id]);
    if (!rowCount) return res.status(404).json({ error: "Subcategory not found" });
    return res.json({ message: "Subcategory deleted" });
  } catch (err) {
    console.error("deleteSubcategory:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// BRAND-CATEGORY LINKS CRUD  (admin)
// ═══════════════════════════════════════════════════════════════════════════════

exports.getAllBrandCategories = async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT bc.*,
              b.brand_name,
              c.category_name,
              sc.sub_category_name
       FROM brandcategory bc
       JOIN brands        b  ON b.brand_id            = bc.brand_id
       JOIN categories    c  ON c.product_category_id = bc.category_id
       JOIN subcategories sc ON sc.sub_category_id    = bc.sub_category_id
       ORDER BY bc.id`
    );
    return res.json(rows);
  } catch (err) {
    console.error("getAllBrandCategories:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.createBrandCategory = async (req, res) => {
  const { id, brand_id, category_id, sub_category_id } = req.body;
  if (!id || !brand_id || !category_id || !sub_category_id)
    return res.status(400).json({ error: "id, brand_id, category_id, sub_category_id are required" });

  try {
    // Verify referenced entities exist
    const checks = await Promise.all([
      query("SELECT 1 FROM brands        WHERE brand_id            = $1", [brand_id]),
      query("SELECT 1 FROM categories    WHERE product_category_id = $1", [category_id]),
      query("SELECT 1 FROM subcategories WHERE sub_category_id     = $1", [sub_category_id]),
      query("SELECT 1 FROM brandcategory WHERE id                  = $1", [id]),
    ]);
    if (!checks[0].rowCount) return res.status(404).json({ error: "Brand not found" });
    if (!checks[1].rowCount) return res.status(404).json({ error: "Category not found" });
    if (!checks[2].rowCount) return res.status(404).json({ error: "Subcategory not found" });
    if ( checks[3].rowCount) return res.status(409).json({ error: "Brand-category ID already exists" });

    const { rows } = await query(
      "INSERT INTO brandcategory (id, brand_id, category_id, sub_category_id) VALUES ($1,$2,$3,$4) RETURNING *",
      [parseInt(id,10), parseInt(brand_id,10), parseInt(category_id,10), parseInt(sub_category_id,10)]
    );
    return res.status(201).json({ message: "Brand-category created", brandCategory: rows[0] });
  } catch (err) {
    console.error("createBrandCategory:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateBrandCategory = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { brand_id, category_id, sub_category_id } = req.body;
  if (!brand_id || !category_id || !sub_category_id)
    return res.status(400).json({ error: "brand_id, category_id, sub_category_id are required" });

  try {
    const { rows } = await query(
      `UPDATE brandcategory
       SET brand_id=$1, category_id=$2, sub_category_id=$3
       WHERE id=$4 RETURNING *`,
      [parseInt(brand_id,10), parseInt(category_id,10), parseInt(sub_category_id,10), id]
    );
    if (!rows.length) return res.status(404).json({ error: "Brand-category not found" });
    return res.json({ message: "Brand-category updated", brandCategory: rows[0] });
  } catch (err) {
    console.error("updateBrandCategory:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteBrandCategory = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const { rowCount } = await query("DELETE FROM brandcategory WHERE id=$1", [id]);
    if (!rowCount) return res.status(404).json({ error: "Brand-category not found" });
    return res.json({ message: "Brand-category deleted" });
  } catch (err) {
    console.error("deleteBrandCategory:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};