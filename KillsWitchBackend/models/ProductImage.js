// models/productImageModel.js
const { query } = require("../config/db");

class ProductImageModel {
  // ─── CREATE ────────────────────────────────────────────────────────────────
  static async create(url, productId) {
    // Validate URL format (basic security check)
    if (!url || !/^https?:\/\/.+/.test(url)) {
      throw new Error("Invalid image URL format");
    }

    return query(
      `INSERT INTO product_images
         (url, product_id, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       RETURNING id`,
      [url, productId]
    );
  }

  // ─── FIND BY PRODUCT ID ─────────────────────────────────────────────────────
  static async findByProductId(productId) {
    const { rows } = await query(
      `SELECT * FROM product_images WHERE product_id = $1 ORDER BY created_at DESC`,
      [productId]
    );
    return rows;
  }

  // ─── FIND ALL IMAGES FOR A PRODUCT (Ordered Priority) ───────────────────────
  static async findMainAndExtraImages(productId) {
    const { rows } = await query(
      `SELECT 
         id, url, product_id, created_at,
         CASE WHEN url LIKE '%hero%' THEN 0 ELSE 1 END AS display_priority
      FROM product_images 
      WHERE product_id = $1 
      ORDER BY display_priority ASC, created_at DESC`,
      [productId]
    );
    return rows;
  }

  // ─── GET THUMBNAIL VARIANTS (If needed) ─────────────────────────────────────
  static async getThumbnailVariants(productId) {
    const { rows } = await query(
      `SELECT 
         id, url, product_id,
         CASE 
           WHEN url LIKE '%small%' THEN 'thumbnail'
           WHEN url LIKE '%medium%' THEN 'medium'
           ELSE 'large'
         END AS size_variants
      FROM product_images 
      WHERE product_id = $1`,
      [productId]
    );
    return rows;
  }

  // ─── UPDATE IMAGE URL ───────────────────────────────────────────────────────
  static async update(id, url) {
    if (!url || !/^https?:\/\/.+/.test(url)) {
      throw new Error("Invalid image URL format");
    }

    return query(
      `UPDATE product_images 
         SET url = $1, updated_at = NOW() 
         WHERE id = $2`,
      [url, id]
    );
  }

  // ─── DELETE IMAGE ────────────────────────────────────────────────────────────
  static async delete(id) {
    const { rowCount } = await query(
      `DELETE FROM product_images WHERE id = $1`,
      [id]
    );
    return rowCount > 0;
  }

  // ─── DELETE ALL IMAGES FOR A PRODUCT ────────────────────────────────────────
  static async deleteAllForProduct(productId) {
    const { rowCount } = await query(
      `DELETE FROM product_images WHERE product_id = $1`,
      [productId]
    );
    return rowCount;
  }

  // ─── COUNT IMAGES PER PRODUCT ───────────────────────────────────────────────
  static async countByProductId(productId) {
    const { rows } = await query(
      `SELECT COUNT(*) as count FROM product_images WHERE product_id = $1`,
      [productId]
    );
    return parseInt(rows[0].count, 10);
  }

  // ─── CHECK IF PRODUCT HAS IMAGES ────────────────────────────────────────────
  static async hasImages(productId) {
    const { rows } = await query(
      `SELECT EXISTS(SELECT 1 FROM product_images WHERE product_id = $1)`,
      [productId]
    );
    return rows[0].exists;
  }
}

module.exports = { ProductImageModel };