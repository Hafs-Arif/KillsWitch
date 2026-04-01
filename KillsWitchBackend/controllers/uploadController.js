"use strict";

const xlsx           = require("xlsx");
const { query }      = require("../config/db");

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseSheet(filePath) {
  const workbook  = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("Uploaded file contains no sheets");
  return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
}

function requireFile(req) {
  if (!req.file) {
    const err  = new Error("No file uploaded");
    err.status = 400;
    throw err;
  }
}

// ── Bulk Upload Products ──────────────────────────────────────────────────────

exports.uploadBulkData = async (req, res) => {
  try {
    requireFile(req);
    const data = parseSheet(req.file.path);

    if (!data.length) {
      return res.status(400).json({ error: "File contains no data rows" });
    }

    const valuePlaceholders = [];
    const vals = [];
    let idx = 1;

    for (const row of data) {
      const partNumber = String(row["Part Number"] || row["part_number"] || "").trim();
      const productId  = parseInt(row["product_id"] || row["Product_id"] || 0, 10);

      valuePlaceholders.push(
        `($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++},
          $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, NOW(), NOW())`
      );
      vals.push(
        productId,
        partNumber,
        parseInt(row["brand_category"] || row["Brand Category"] || 0, 10),
        `https://killswitch.us/${partNumber}.png`,
        String(row["Condition"]         || row["condition"]         || ""),
        String(row["sub_condition"]     || row["Sub Condtion"]      || ""),
        parseFloat(row["price"]         || 0),
        parseInt(row["quantity"]        || 0, 10),
        String(row["short_description"] || ""),
        String(row["long_description"]  || ""),
        String(row["status"]            || "")
      );
    }

    const { rowCount } = await query(
      `INSERT INTO products
         (product_id, part_number, brandcategory_id, image,
          condition, sub_condition, price, quantity,
          short_description, long_description, status,
          created_at, updated_at)
       VALUES ${valuePlaceholders.join(", ")}`,
      vals
    );

    return res.status(201).json({
      success: true,
      message: `${rowCount} products created successfully`,
    });
  } catch (err) {
    console.error("uploadBulkData:", err.message);
    return res.status(err.status || 500).json({ error: err.status ? err.message : "Internal server error" });
  }
};

// ── Bulk Upload Brands ────────────────────────────────────────────────────────

exports.uploadBulkDataBrand = async (req, res) => {
  try {
    requireFile(req);
    const data = parseSheet(req.file.path);

    if (!data.length) {
      return res.status(400).json({ error: "File contains no data rows" });
    }

    const valuePlaceholders = [];
    const vals = [];
    let idx = 1;

    for (const row of data) {
      valuePlaceholders.push(`($${idx++}, $${idx++}, NOW(), NOW())`);
      vals.push(
        parseInt(row["brand_id"] || 0, 10),
        String(row["brand_name"] || "").trim()
      );
    }

    const { rowCount } = await query(
      `INSERT INTO brands (brand_id, brand_name, created_at, updated_at)
       VALUES ${valuePlaceholders.join(", ")}`,
      vals
    );

    return res.status(201).json({
      success: true,
      message: `${rowCount} brands created successfully`,
    });
  } catch (err) {
    console.error("uploadBulkDataBrand:", err.message);
    return res.status(err.status || 500).json({ error: err.status ? err.message : "Internal server error" });
  }
};

// ── Bulk Upload Categories ────────────────────────────────────────────────────

exports.uploadBulkDataCategory = async (req, res) => {
  try {
    requireFile(req);
    const data = parseSheet(req.file.path);

    if (!data.length) {
      return res.status(400).json({ error: "File contains no data rows" });
    }

    const valuePlaceholders = [];
    const vals = [];
    let idx = 1;

    for (const row of data) {
      valuePlaceholders.push(`($${idx++}, $${idx++}, NOW(), NOW())`);
      vals.push(
        parseInt(row["product_category_id"] || 0, 10),
        String(row["category_name"] || "").trim()
      );
    }

    const { rowCount } = await query(
      `INSERT INTO categories (product_category_id, category_name, created_at, updated_at)
       VALUES ${valuePlaceholders.join(", ")}`,
      vals
    );

    return res.status(201).json({
      success: true,
      message: `${rowCount} categories created successfully`,
    });
  } catch (err) {
    console.error("uploadBulkDataCategory:", err.message);
    return res.status(err.status || 500).json({ error: err.status ? err.message : "Internal server error" });
  }
};

// ── Bulk Upload Subcategories ─────────────────────────────────────────────────

exports.uploadBulkDataSubcategory = async (req, res) => {
  try {
    requireFile(req);
    const data = parseSheet(req.file.path);

    if (!data.length) {
      return res.status(400).json({ error: "File contains no data rows" });
    }

    const valuePlaceholders = [];
    const vals = [];
    let idx = 1;

    for (const row of data) {
      valuePlaceholders.push(`($${idx++}, $${idx++}, NOW(), NOW())`);
      vals.push(
        parseInt(row["sub_category_id"] || 0, 10),
        String(row["sub_category_name"] || "").trim()
      );
    }

    const { rowCount } = await query(
      `INSERT INTO subcategories (sub_category_id, sub_category_name, created_at, updated_at)
       VALUES ${valuePlaceholders.join(", ")}`,
      vals
    );

    return res.status(201).json({
      success: true,
      message: `${rowCount} subcategories created successfully`,
    });
  } catch (err) {
    console.error("uploadBulkDataSubcategory:", err.message);
    return res.status(err.status || 500).json({ error: err.status ? err.message : "Internal server error" });
  }
};

// ── Bulk Upload Brand Categories ──────────────────────────────────────────────

exports.uploadBulkDataBrandcategory = async (req, res) => {
  try {
    requireFile(req);
    const data = parseSheet(req.file.path);

    if (!data.length) {
      return res.status(400).json({ error: "File contains no data rows" });
    }

    const valuePlaceholders = [];
    const vals = [];
    let idx = 1;

    for (const row of data) {
      valuePlaceholders.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, NOW(), NOW())`);
      vals.push(
        parseInt(row["brand_category_id"] || 0, 10),
        parseInt(row["brand_id"]          || 0, 10),
        parseInt(row["category_id"]       || 0, 10),
        parseInt(row["sub_category_id"]   || 0, 10)
      );
    }

    const { rowCount } = await query(
      `INSERT INTO brand_categories (id, brand_id, category_id, sub_category_id, created_at, updated_at)
       VALUES ${valuePlaceholders.join(", ")}`,
      vals
    );

    return res.status(201).json({
      success: true,
      message: `${rowCount} brand categories created successfully`,
    });
  } catch (err) {
    console.error("uploadBulkDataBrandcategory:", err.message);
    return res.status(err.status || 500).json({ error: err.status ? err.message : "Internal server error" });
  }
};