// controllers/reviewController.js  –  raw SQL (pg)
"use strict";

const { query } = require("../config/db");

// ── Get all reviews (paginated, filterable) ───────────────────────────────────
exports.getAllReviews = async (req, res) => {
  const {
    productId, userId, rating,
    page = 1, limit = 10,
    sortBy = "created_at", sortOrder = "DESC",
  } = req.query;

  // Whitelist sortBy to prevent column injection
  const ALLOWED_SORT = ["created_at", "rating", "id"];
  const safeSortBy   = ALLOWED_SORT.includes(sortBy) ? sortBy : "created_at";
  const safeOrder    = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

  const wheres = [];
  const vals   = [];
  let   i      = 1;

  if (productId) { wheres.push(`r.product_id=$${i++}`); vals.push(parseInt(productId, 10)); }
  if (userId)    { wheres.push(`r.user_id=$${i++}`);    vals.push(parseInt(userId,    10)); }
  if (rating)    { wheres.push(`r.rating=$${i++}`);     vals.push(parseInt(rating,    10)); }

  const WHERE  = wheres.length ? `WHERE ${wheres.join(" AND ")}` : "";
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  try {
    const { rows: reviews } = await query(
      `SELECT r.*, p.part_number, p.image AS product_image, u.name AS user_name
       FROM reviews r
       LEFT JOIN products p ON p.product_id = r.product_id
       LEFT JOIN users    u ON u.id          = r.user_id
       ${WHERE}
       ORDER BY r.${safeSortBy} ${safeOrder}
       LIMIT $${i++} OFFSET $${i++}`,
      [...vals, parseInt(limit, 10), offset]
    );

    const { rows: countRows } = await query(
      `SELECT COUNT(*) AS n FROM reviews r ${WHERE}`, vals
    );

    const total = parseInt(countRows[0].n, 10);
    return res.json({
      success: true,
      data:    reviews,
      pagination: {
        total,
        page:       parseInt(page, 10),
        limit:      parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (err) {
    console.error("getAllReviews:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── Get single review ─────────────────────────────────────────────────────────
exports.getReviewById = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid ID" });

  try {
    const { rows } = await query(
      `SELECT r.*, p.part_number, u.name AS user_name
       FROM reviews r
       LEFT JOIN products p ON p.product_id = r.product_id
       LEFT JOIN users    u ON u.id          = r.user_id
       WHERE r.id = $1`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: "Review not found" });
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("getReviewById:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── Get reviews for a product ─────────────────────────────────────────────────
exports.getProductReviews = async (req, res) => {
  const productId = parseInt(req.params.productId, 10);
  if (isNaN(productId)) return res.status(400).json({ success: false, message: "Invalid productId" });

  const { page = 1, limit = 10, sortBy = "created_at", sortOrder = "DESC" } = req.query;
  const ALLOWED_SORT = ["created_at","rating","id"];
  const safeSortBy   = ALLOWED_SORT.includes(sortBy) ? sortBy : "created_at";
  const safeOrder    = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
  const offset       = (parseInt(page,10)-1) * parseInt(limit,10);

  try {
    const { rowCount: exists } = await query("SELECT 1 FROM products WHERE product_id=$1", [productId]);
    if (!exists) return res.status(404).json({ success: false, message: "Product not found" });

    const { rows: reviews } = await query(
      `SELECT r.*, u.name AS user_name
       FROM reviews r
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.product_id=$1
       ORDER BY r.${safeSortBy} ${safeOrder}
       LIMIT $2 OFFSET $3`,
      [productId, parseInt(limit,10), offset]
    );

    const { rows: stats } = await query(
      "SELECT AVG(rating)::numeric(3,1) AS avg, COUNT(*) AS n FROM reviews WHERE product_id=$1",
      [productId]
    );

    return res.json({
      success:       true,
      data:          reviews,
      averageRating: stats[0].avg || "0.0",
      totalReviews:  parseInt(stats[0].n, 10),
      pagination: {
        total:      parseInt(stats[0].n, 10),
        page:       parseInt(page,  10),
        limit:      parseInt(limit, 10),
        totalPages: Math.ceil(parseInt(stats[0].n,10) / parseInt(limit,10)),
      },
    });
  } catch (err) {
    console.error("getProductReviews:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── Create review ─────────────────────────────────────────────────────────────
exports.createReview = async (req, res) => {
  const { productId, rating, comment, reviewer_name } = req.body;

  if (!productId || !rating)
    return res.status(400).json({ success: false, message: "productId and rating are required" });

  const ratingNum = parseInt(rating, 10);
  if (ratingNum < 1 || ratingNum > 5)
    return res.status(400).json({ success: false, message: "Rating must be 1–5" });

  const userId = req.user?.id || null;

  try {
    const { rowCount: exists } = await query("SELECT 1 FROM products WHERE product_id=$1", [parseInt(productId,10)]);
    if (!exists) return res.status(404).json({ success: false, message: "Product not found" });

    // One review per authenticated user per product
    if (userId) {
      const { rowCount: dup } = await query(
        "SELECT 1 FROM reviews WHERE product_id=$1 AND user_id=$2",
        [parseInt(productId,10), userId]
      );
      if (dup) return res.status(400).json({ success: false, message: "You have already reviewed this product" });
    }

    // Resolve display name
    let displayName = (reviewer_name || "").trim();
    if (!displayName && userId) {
      const { rows } = await query("SELECT name FROM users WHERE id=$1", [userId]);
      displayName = rows[0]?.name || "Anonymous";
    }
    if (!displayName) displayName = "Anonymous";

    const { rows } = await query(
      `INSERT INTO reviews (product_id, user_id, rating, comment, reviewer_name, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,NOW(),NOW()) RETURNING *`,
      [parseInt(productId,10), userId, ratingNum, comment||null, displayName]
    );
    return res.status(201).json({ success: true, message: "Review created", data: rows[0] });
  } catch (err) {
    console.error("createReview:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── Update review ─────────────────────────────────────────────────────────────
exports.updateReview = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { rating, comment, reviewer_name } = req.body;

  if (rating !== undefined && (rating < 1 || rating > 5))
    return res.status(400).json({ success: false, message: "Rating must be 1–5" });

  try {
    const sets = ["updated_at=NOW()"];
    const vals = [];
    let i = 1;

    if (rating        !== undefined) { sets.push(`rating=$${i++}`);        vals.push(parseInt(rating,10)); }
    if (comment       !== undefined) { sets.push(`comment=$${i++}`);       vals.push(comment); }
    if (reviewer_name !== undefined) { sets.push(`reviewer_name=$${i++}`); vals.push(reviewer_name); }

    if (vals.length === 0) return res.json({ success: true, message: "Nothing to update" });

    vals.push(id);
    const { rows } = await query(
      `UPDATE reviews SET ${sets.join(",")} WHERE id=$${i} RETURNING *`, vals
    );
    if (!rows.length) return res.status(404).json({ success: false, message: "Review not found" });
    return res.json({ success: true, message: "Review updated", data: rows[0] });
  } catch (err) {
    console.error("updateReview:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── Delete review ─────────────────────────────────────────────────────────────
exports.deleteReview = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const { rowCount } = await query("DELETE FROM reviews WHERE id=$1", [id]);
    if (!rowCount) return res.status(404).json({ success: false, message: "Review not found" });
    return res.json({ success: true, message: "Review deleted" });
  } catch (err) {
    console.error("deleteReview:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── Review stats for a product ────────────────────────────────────────────────
exports.getProductReviewStats = async (req, res) => {
  const productId = parseInt(req.params.productId, 10);
  if (isNaN(productId)) return res.status(400).json({ success: false, message: "Invalid productId" });

  try {
    const { rows: stats } = await query(
      `SELECT
         AVG(rating)::numeric(3,1) AS avg_rating,
         COUNT(*) AS total,
         MIN(rating) AS min_rating,
         MAX(rating) AS max_rating
       FROM reviews WHERE product_id=$1`,
      [productId]
    );
    const { rows: dist } = await query(
      "SELECT rating, COUNT(*) AS count FROM reviews WHERE product_id=$1 GROUP BY rating ORDER BY rating",
      [productId]
    );

    const distribution = {};
    dist.forEach(r => { distribution[r.rating] = parseInt(r.count, 10); });

    return res.json({
      success: true,
      data: {
        averageRating:    stats[0].avg_rating || "0.0",
        totalReviews:     parseInt(stats[0].total, 10),
        minRating:        parseInt(stats[0].min_rating || 0, 10),
        maxRating:        parseInt(stats[0].max_rating || 0, 10),
        ratingDistribution: distribution,
      },
    });
  } catch (err) {
    console.error("getProductReviewStats:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── Featured reviews (4–5 stars) ──────────────────────────────────────────────
exports.getFeaturedReviews = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  try {
    const { rows } = await query(
      `SELECT r.*, p.part_number, p.image AS product_image, p.price, u.name AS user_name
       FROM reviews r
       LEFT JOIN products p ON p.product_id = r.product_id
       LEFT JOIN users    u ON u.id          = r.user_id
       WHERE r.rating >= 4
       ORDER BY r.rating DESC, r.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    console.error("getFeaturedReviews:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// controllers/uploadController.js  –  raw SQL (pg)
// Bulk CSV/XLSX import for products, brands, categories, etc.
// ─────────────────────────────────────────────────────────────────────────────

const xlsx = require("xlsx");
const { query: dbQuery } = require("../config/db");

// Helper: read XLSX from buffer (multer memoryStorage)
function parseXlsx(buffer) {
  // SECURITY FIX: original used req.file.path which is undefined with memoryStorage
  const wb = xlsx.read(buffer, { type: "buffer" });
  return xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
}

exports.uploadBulkData = async (req, res) => {
  if (!req.file?.buffer) return res.status(400).json({ error: "No file uploaded" });

  try {
    const rows = parseXlsx(req.file.buffer);
    if (!rows.length) return res.status(400).json({ error: "File is empty or unreadable" });

    const inserts = [];
    for (const row of rows) {
      const part_number      = String(row["Part Number"] || row.part_number || "").trim();
      const brandcategoryId  = Number(row.brand_category || row.brandcategoryId || 0);
      const price            = Number(row.price || 0);
      const quantity         = Number(row.quantity || 0);
      const condition        = String(row.Condition || row.condition || "");
      const sub_condition    = String(row.sub_condition || row["Sub Condtion"] || "");
      const short_desc       = String(row.short_description || "");
      const long_desc        = String(row.long_description  || "");
      const status           = String(row.status || "active");
      const image            = String(row.image || `https://killswitch.us/${part_number}.png`);
      const slug             = part_number.toLowerCase().replace(/[^\w]/g, "-") + "-" + Date.now();

      if (!part_number || !brandcategoryId) continue; // skip bad rows silently

      inserts.push(dbQuery(
        `INSERT INTO products
           (part_number, brandcategory_id, image, slug, condition, sub_condition, price, quantity,
            short_description, long_description, status, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW())
         ON CONFLICT (slug) DO NOTHING`,
        [part_number, brandcategoryId, image, slug, condition, sub_condition,
         price, quantity, short_desc, long_desc, status]
      ));
    }

    await Promise.all(inserts);
    return res.json({ message: `${inserts.length} products processed` });
  } catch (err) {
    console.error("uploadBulkData:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.uploadBulkDataBrand = async (req, res) => {
  if (!req.file?.buffer) return res.status(400).json({ error: "No file uploaded" });
  try {
    const rows = parseXlsx(req.file.buffer);
    const inserts = rows.map(r =>
      dbQuery(
        "INSERT INTO brands (brand_id, brand_name) VALUES ($1,$2) ON CONFLICT (brand_id) DO NOTHING",
        [Number(r.brand_id), String(r.brand_name || "").trim()]
      )
    );
    await Promise.all(inserts);
    return res.json({ message: `${inserts.length} brands processed` });
  } catch (err) {
    console.error("uploadBulkDataBrand:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.uploadBulkDataCategory = async (req, res) => {
  if (!req.file?.buffer) return res.status(400).json({ error: "No file uploaded" });
  try {
    const rows = parseXlsx(req.file.buffer);
    const inserts = rows.map(r =>
      dbQuery(
        "INSERT INTO categories (product_category_id, category_name) VALUES ($1,$2) ON CONFLICT (product_category_id) DO NOTHING",
        [Number(r.product_category_id), String(r.category_name || "").trim()]
      )
    );
    await Promise.all(inserts);
    return res.json({ message: `${inserts.length} categories processed` });
  } catch (err) {
    console.error("uploadBulkDataCategory:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.uploadBulkDataSubcategory = async (req, res) => {
  if (!req.file?.buffer) return res.status(400).json({ error: "No file uploaded" });
  try {
    const rows = parseXlsx(req.file.buffer);
    const inserts = rows.map(r =>
      dbQuery(
        "INSERT INTO subcategories (sub_category_id, sub_category_name) VALUES ($1,$2) ON CONFLICT (sub_category_id) DO NOTHING",
        [Number(r.sub_category_id), String(r.sub_category_name || "").trim()]
      )
    );
    await Promise.all(inserts);
    return res.json({ message: `${inserts.length} subcategories processed` });
  } catch (err) {
    console.error("uploadBulkDataSubcategory:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.uploadBulkDataBrandcategory = async (req, res) => {
  if (!req.file?.buffer) return res.status(400).json({ error: "No file uploaded" });
  try {
    const rows = parseXlsx(req.file.buffer);
    const inserts = rows.map(r =>
      dbQuery(
        `INSERT INTO brandcategory (id, brand_id, category_id, sub_category_id)
         VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING`,
        [Number(r.brand_category_id || r.id), Number(r.brand_id), Number(r.category_id), Number(r.sub_category_id)]
      )
    );
    await Promise.all(inserts);
    return res.json({ message: `${inserts.length} brand-categories processed` });
  } catch (err) {
    console.error("uploadBulkDataBrandcategory:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};