"use strict";

const { query, transaction } = require("../config/db");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicId,
} = require("../utils/cloudinaryHelper");

// ── Shared columns helper ─────────────────────────────────────────────────────
// All the spec fields shared across findAll / findById / update responses
const SPEC_FIELDS = [
  "product_model","motherboard","material","front_ports","gpu_length","cpu_height",
  "hdd_support","ssd_support","expansion_slots","case_size","water_cooling_support",
  "case_fan_support","carton_size","loading_capacity","pump_parameter","pump_bearing",
  "pump_speed","pump_interface","pump_noise","tdp","pipe_length_material","light_effect",
  "drainage_size","fan_size","fan_speed","fan_voltage","fan_interface","fan_airflow",
  "fan_wind_pressure","fan_noise","fan_bearing_type","fan_power","fan_rated_voltage",
  "axis","number_of_keys","weight","carton_weight","package_size","carton_size_kb",
  "keycap_technology","wire_length","lighting_style","body_material","dpi",
  "return_rate","engine_solution","surface_technology","package","packing",
  "moq_customization","customization_options",
];

function formatProduct(p, images = [], reviews = []) {
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return {
    product_product_id:          p.product_id,
    product_part_number:         p.part_number,
    product_price:               p.price,
    product_image:               p.image,
    product_quantity:            p.quantity,
    product_short_description:   p.short_description,
    product_status:              p.status,
    product_condition:           p.condition,
    product_sub_condition:       p.sub_condition,
    product_long_description:    p.long_description,
    sale_price:                  p.sale_price,
    video_url:                   p.video_url,
    slug:                        p.slug,
    category_product_category_id: p.product_category_id,
    category_category_name:      p.category_name,
    brand_brand_id:              p.brand_id,
    brand_brand_name:            p.brand_name,
    sub_category_sub_category_id:  p.sub_category_id,
    sub_category_sub_category_name: p.sub_category_name,
    category:                    { category_id: p.product_category_id, category_name: p.category_name },
    product_images:              images,
    reviews,
    review_count:                reviews.length,
    average_rating:              avgRating,
    ...Object.fromEntries(SPEC_FIELDS.map(f => [f, p[f]])),
  };
}

// ── Find All Products ─────────────────────────────────────────────────────────

exports.findAllProducts = async (_req, res) => {
  try {
    const { rows: products } = await query(
      `SELECT p.*,
              c.product_category_id, c.category_name,
              b.brand_id,            b.brand_name,
              sc.sub_category_id,    sc.sub_category_name
       FROM products p
       LEFT JOIN brandcategory bc ON bc.id            = p.brandcategory_id
       LEFT JOIN categories    c  ON c.product_category_id = bc.category_id
       LEFT JOIN brands        b  ON b.brand_id        = bc.brand_id
       LEFT JOIN subcategories sc ON sc.sub_category_id = bc.sub_category_id
       ORDER BY p.product_id ASC`
    );

    const productIds = products.map(p => p.product_id);
    if (!productIds.length) return res.json([]);

    const ph = productIds.map((_, n) => `$${n + 1}`).join(",");

    const { rows: images }  = await query(
      `SELECT id, url, product_id FROM product_images WHERE product_id IN (${ph})`, productIds
    );
    const { rows: reviews } = await query(
      `SELECT id, rating, title, comment, reviewer_name, created_at, product_id
       FROM reviews WHERE product_id IN (${ph})`, productIds
    );

    const imgByProduct    = {};
    const reviewByProduct = {};
    images.forEach(i  => { (imgByProduct[i.product_id]    = imgByProduct[i.product_id]    || []).push(i); });
    reviews.forEach(r => { (reviewByProduct[r.product_id] = reviewByProduct[r.product_id] || []).push(r); });

    return res.json(
      products.map(p => formatProduct(p, imgByProduct[p.product_id] || [], reviewByProduct[p.product_id] || []))
    );
  } catch (err) {
    console.error("findAllProducts:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── Find Product by ID ────────────────────────────────────────────────────────

exports.findProductById = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid product ID" });

  try {
    const { rows } = await query(
      `SELECT p.*,
              c.product_category_id, c.category_name,
              b.brand_id,            b.brand_name,
              sc.sub_category_id,    sc.sub_category_name
       FROM products p
       LEFT JOIN brandcategory bc ON bc.id                 = p.brandcategory_id
       LEFT JOIN categories    c  ON c.product_category_id = bc.category_id
       LEFT JOIN brands        b  ON b.brand_id            = bc.brand_id
       LEFT JOIN subcategories sc ON sc.sub_category_id    = bc.sub_category_id
       WHERE p.product_id = $1`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: "Product not found" });

    const [{ rows: images }, { rows: reviews }] = await Promise.all([
      query("SELECT id, url FROM product_images WHERE product_id = $1", [id]),
      query("SELECT id, rating, title, comment, reviewer_name, created_at FROM reviews WHERE product_id = $1", [id]),
    ]);

    return res.json(formatProduct(rows[0], images, reviews));
  } catch (err) {
    console.error("findProductById:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── Upload Product ────────────────────────────────────────────────────────────

exports.uploadProduct = async (req, res) => {
  try {
    const files          = req.files || {};
    const mainImageFile  = files.image?.[0];
    const additionalImgs = files.additional_images || [];
    const videoFile      = files.video?.[0];

    if (!mainImageFile) return res.status(400).json({ message: "Main image required" });
    if (additionalImgs.length > 9) return res.status(400).json({ message: "Max 9 additional images" });

    const {
      brand_name, category_name, sub_category_name,
      price, sale_price, quantity, short_description,
      status, part_number, condition, sub_condition, long_description,
    } = req.body;

    if (!brand_name || !category_name || !sub_category_name || !price || !part_number)
      return res.status(400).json({ message: "brand_name, category_name, sub_category_name, price, part_number required" });

    // Resolve brand-category-subcategory relationship
    const { rows: bcRows } = await query(
      `SELECT bc.id FROM brandcategory bc
       JOIN brands        b  ON b.brand_id            = bc.brand_id    AND b.brand_name      ILIKE $1
       JOIN categories    c  ON c.product_category_id = bc.category_id AND c.category_name   ILIKE $2
       JOIN subcategories sc ON sc.sub_category_id    = bc.sub_category_id AND sc.sub_category_name ILIKE $3
       LIMIT 1`,
      [brand_name, category_name, sub_category_name]
    );
    if (!bcRows.length)
      return res.status(404).json({ message: `No relation found for ${brand_name} › ${category_name} › ${sub_category_name}` });

    const brandcategoryId = bcRows[0].id;

    // Parallel Cloudinary uploads
    const [mainResult, ...rest] = await Promise.all([
      uploadToCloudinary(mainImageFile.buffer, "products", mainImageFile.originalname),
      ...additionalImgs.map((f, i) => uploadToCloudinary(f.buffer, "products", `add_${i}_${f.originalname}`)),
      ...(videoFile ? [uploadToCloudinary(videoFile.buffer, "product-videos", videoFile.originalname, { resource_type: "video" })] : []),
    ]);

    const additionalResults = rest.slice(0, additionalImgs.length);
    const videoResult       = videoFile ? rest[additionalImgs.length] : null;

    // Slug generation with uniqueness check
    const baseSlug = (req.body.slug || part_number).toLowerCase().replace(/[^\w\s-]/g,"").replace(/\s+/g,"-").slice(0,50);
    let slug = baseSlug, counter = 1;
    while (true) {
      const { rowCount } = await query("SELECT 1 FROM products WHERE slug = $1", [slug]);
      if (!rowCount) break;
      slug = `${baseSlug}-${counter++}`;
    }

    // Collect spec fields from req.body
    const specVals  = SPEC_FIELDS.map(f => req.body[f] || null);
    const specCols  = SPEC_FIELDS.join(", ");
    const specPh    = SPEC_FIELDS.map((_, n) => `$${n + 14}`).join(", ");

    const { rows: newProduct } = await query(
      `INSERT INTO products
         (image, slug, price, sale_price, video_url, quantity, short_description,
          status, part_number, condition, sub_condition, long_description, brandcategory_id,
          ${specCols}, created_at, updated_at)
       VALUES
         ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,
          ${specPh}, NOW(), NOW())
       RETURNING product_id`,
      [
        mainResult.secure_url, slug, price, sale_price || null, videoResult?.secure_url || null,
        quantity, short_description, status, part_number, condition, sub_condition, long_description,
        brandcategoryId,
        ...specVals,
      ]
    );
    const productId = newProduct[0].product_id;

    // Additional images
    if (additionalResults.length) {
      const imgVals   = additionalResults.flatMap((r, n) => [productId, r.secure_url, n]);
      const imgPh     = additionalResults.map((_, n) => `($${n*3+1},$${n*3+2},$${n*3+3})`).join(",");
      await query(
        `INSERT INTO product_images (product_id, url, sort_order) VALUES ${imgPh}`,
        imgVals
      );
    }

    return res.status(201).json({ success: true, product_id: productId });
  } catch (err) {
    console.error("uploadProduct:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── Update Product ────────────────────────────────────────────────────────────

exports.updateProduct = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: "Invalid product ID" });

  try {
    const { rows } = await query("SELECT * FROM products WHERE product_id = $1", [id]);
    if (!rows.length) return res.status(404).json({ message: "Product not found" });

    const product   = rows[0];
    const files     = req.files || {};
    const sets      = ["updated_at = NOW()"];
    const vals      = [];
    let   i         = 1;

    // Simple scalar fields
    const SIMPLE = ["price","sale_price","quantity","short_description","status","part_number",
                    "condition","sub_condition","long_description","slug",...SPEC_FIELDS];
    for (const f of SIMPLE) {
      if (req.body[f] !== undefined) { sets.push(`${f} = $${i++}`); vals.push(req.body[f]); }
    }

    // New main image
    if (files.image?.[0]) {
      const old = extractPublicId(product.image);
      if (old) deleteFromCloudinary(old).catch(()=>{});
      const r = await uploadToCloudinary(files.image[0].buffer, "products", files.image[0].originalname);
      sets.push(`image = $${i++}`); vals.push(r.secure_url);
    }

    // New video
    if (files.video?.[0]) {
      const old = extractPublicId(product.video_url);
      if (old) deleteFromCloudinary(old, { resource_type:"video" }).catch(()=>{});
      const r = await uploadToCloudinary(files.video[0].buffer, "product-videos", files.video[0].originalname, { resource_type:"video" });
      sets.push(`video_url = $${i++}`); vals.push(r.secure_url);
    }

    // Brand/category change
    if (req.body.brand_name && req.body.category_name && req.body.sub_category_name) {
      const { rows: bcRows } = await query(
        `SELECT bc.id FROM brandcategory bc
         JOIN brands        b  ON b.brand_id            = bc.brand_id         AND b.brand_name      ILIKE $1
         JOIN categories    c  ON c.product_category_id = bc.category_id      AND c.category_name   ILIKE $2
         JOIN subcategories sc ON sc.sub_category_id    = bc.sub_category_id  AND sc.sub_category_name ILIKE $3
         LIMIT 1`,
        [req.body.brand_name, req.body.category_name, req.body.sub_category_name]
      );
      if (!bcRows.length) return res.status(404).json({ message: "Brand/category relation not found" });
      sets.push(`brandcategory_id = $${i++}`); vals.push(bcRows[0].id);
    }

    vals.push(id);
    await query(`UPDATE products SET ${sets.join(",")} WHERE product_id = $${i}`, vals);

    // Replace additional images if new ones uploaded
    if (files.additional_images?.length) {
      const { rows: oldImgs } = await query("SELECT url FROM product_images WHERE product_id = $1", [id]);
      oldImgs.forEach(img => { const pid = extractPublicId(img.url); if(pid) deleteFromCloudinary(pid).catch(()=>{}); });
      await query("DELETE FROM product_images WHERE product_id = $1", [id]);

      const newImgs = await Promise.all(
        files.additional_images.map((f, n) => uploadToCloudinary(f.buffer, "products", `${id}_${n}_${f.originalname}`))
      );
      if (newImgs.length) {
        const ph  = newImgs.map((_,n) => `($${n*2+1},$${n*2+2})`).join(",");
        await query(
          `INSERT INTO product_images (product_id, url) VALUES ${ph}`,
          newImgs.flatMap(r => [id, r.secure_url])
        );
      }
    }

    return res.json({ message: "Product updated" });
  } catch (err) {
    console.error("updateProduct:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── Delete Product ────────────────────────────────────────────────────────────

exports.deleteProduct = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: "Invalid product ID" });

  try {
    const { rows } = await query(
      "SELECT image FROM products WHERE product_id = $1",
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: "Product not found" });

    const { rows: imgs } = await query(
      "SELECT url FROM product_images WHERE product_id = $1", [id]
    );
    const toDelete = [rows[0].image, ...imgs.map(i => i.url)].filter(Boolean).map(extractPublicId).filter(Boolean);
    await Promise.allSettled(toDelete.map(pid => deleteFromCloudinary(pid)));

    await query("DELETE FROM products WHERE product_id = $1", [id]);
    return res.json({ message: "Product deleted" });
  } catch (err) {
    console.error("deleteProduct:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── Find Product by ID (with images) ──────────────────────────────────────────
exports.findProductById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, error: "Valid product ID required" });
    }

    // Get product
    const { rows: products } = await query(
      `SELECT product_id, part_number, slug, image, price, sale_price, quantity, 
              status, short_description, long_description, condition, sub_condition,
              brandcategory_id, video_url, product_model, motherboard, material,
              fan_speed, fan_noise, dpi, weight, created_at
       FROM products 
       WHERE product_id = $1`,
      [id]
    );
    
    if (!products.length) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    // Get images
    const { rows: images } = await query(
      `SELECT id, url FROM product_images WHERE product_id = $1 ORDER BY id`,
      [id]
    );

    return res.json({ 
      success: true, 
      data: { ...products[0], images } 
    });
  } catch (err) {
    console.error("findProductById:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ── Add Product Images ────────────────────────────────────────────────────────
exports.addProductImages = async (req, res) => {
  try {
    const productId = parseInt(req.params.productId, 10);
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ success: false, error: "Valid product ID required" });
    }

    // Verify product exists
    const { rowCount } = await query(
      "SELECT 1 FROM products WHERE product_id = $1",
      [productId]
    );
    if (rowCount === 0) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    // req.files from multer
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: "No images uploaded" });
    }

    // Build bulk insert
    const placeholders = [];
    const values = [];
    let idx = 1;

    for (const file of req.files) {
      const imageUrl = `/uploads/products/${file.filename}`;
      placeholders.push(`($${idx++}, $${idx++})`);
      values.push(productId, imageUrl);
    }

    const { rows } = await query(
      `INSERT INTO product_images (product_id, url) 
       VALUES ${placeholders.join(", ")} 
       RETURNING id, url, product_id`,
      values
    );

    return res.status(201).json({
      success: true,
      message: `${rows.length} image(s) added`,
      data: rows
    });
  } catch (err) {
    console.error("addProductImages:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ── Delete Product Image ──────────────────────────────────────────────────────
exports.deleteProductImage = async (req, res) => {
  try {
    const imageId = parseInt(req.params.imageId, 10);
    if (!Number.isInteger(imageId) || imageId <= 0) {
      return res.status(400).json({ success: false, error: "Valid image ID required" });
    }

    // Get image details before delete (optional: for file deletion)
    const { rows } = await query(
      "SELECT id, url, product_id FROM product_images WHERE id = $1",
      [imageId]
    );
    
    if (!rows.length) {
      return res.status(404).json({ success: false, error: "Image not found" });
    }

    const image = rows[0];

    // Delete from DB
    await query("DELETE FROM product_images WHERE id = $1", [imageId]);

    // TODO: Delete physical file if needed
    // const fs = require('fs');
    // const path = require('path');
    // fs.unlinkSync(path.join(__dirname, '..', image.url));

    return res.json({ 
      success: true, 
      message: "Image deleted successfully",
      data: { id: image.id, product_id: image.product_id }
    });
  } catch (err) {
    console.error("deleteProductImage:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};