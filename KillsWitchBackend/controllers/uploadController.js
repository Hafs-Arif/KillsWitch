const { Workbook } = require("exceljs");
const {
  product,
  subcategory,
  brand,
  category,
  brandcategory,
} = require("../models");
const xlsx = require("xlsx");
const path = require("path");

exports.uploadBulkData = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet); 
    console.log("Sample row keys:", Object.keys(data[0]));

    const products = data.map((row, index) => {
      const part_number = String(
        row["Part Number"] || row["part_number"] || ""
      ).trim();
      const product_id = Number(row["product_id"] || row["Product_id"] || 0);
      const brandCategory =
        row["brand_category"] || row["Brand Category"] || "";
      const condition = row["Condition"] || row["condition"] || "";
      const sub_condition = row["sub_condition"] || row["Sub Condtion"] || "";
      const price = Number(row["price"] || 0);
      const quantity = Number(row["quantity"] || 0);
      const shortDesc = row["short_description"] || "";
      const longDesc = row["long_description"] || "";
      const status = row["status"] || "";

      return {
        product_id: product_id,
        part_number: part_number,
        brandcategoryId: Number(brandCategory),
        image: `https://killswitch.us/${part_number}.png`,
        condition: String(condition),
        sub_condition: String(sub_condition),
        price,
        quantity,
        short_description: String(shortDesc),
        long_description: String(longDesc),
        status: String(status),
      };
    });
    console.log(products);
    const createdProducts = await product.bulkCreate(products);
    res.json({ message: "Products created successfully", createdProducts });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};
exports.uploadBulkDataBrand = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    console.log("Sample row keys:", Object.keys(data[0]));

    const brands = data.map(async (row, index) => {
      console.log(`Row ${index}:`, row);
      const brand_name = String(
        row["brand_name"] || row["brand_name"] || ""
      ).trim();
      const brand_id = Number(row["brand_id"] || row["Brand_id"] || "");

      const createdBrand = await brand.create({
        brand_name: String(row.brand_name || ""),
        brand_id: Number(row.brand_id || 0),
      });
      return {
        brand_name: brand_name,
        brand_id: brand_id,
      };
    });
    console.log(brands);
    //const createdBrand = await brand.bulkCreate(brands);

    res.json({ message: "Products created successfully" });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};
exports.uploadBulkDataCategory = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    console.log("Sample row keys:", Object.keys(data[0]));

    const brands = data.map(async (row, index) => {
      const name = String(
        row["category_name"] || row["brand_name"] || ""
      ).trim();
      const category_id = Number(
        row["product_category_id"] || row["brand_id"] || 0
      );
      const createdBrand = await category.create({
        category_name: String(row.category_name || ""),
        product_category_id: Number(row.product_category_id || 0),
      });

      return {
        category_name: name,
        product_category_id: category_id,
      };
    });
    console.log(brands);
    //const createdBrand = await category.bulkCreate(brands);
    res.json({ message: "Products created successfully" });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};
exports.uploadBulkDataSubcategory = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    console.log("Sample row keys:", Object.keys(data[0]));

    const brands = data.map((row, index) => {
      const sub_category_id = Number(
        row["sub_category_id"] || row["brand"] || 0
      );
      const sub_category_name = String(
        row["sub_category_name"] || row["brand"] || ""
      ).trim();

      return {
        sub_category_name: sub_category_name,
        sub_category_id: sub_category_id,
      };
    });
    console.log(brands);
    const createdBrand = await subcategory.bulkCreate(brands);
    res.json({ message: "Products created successfully", createdBrand });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};
exports.uploadBulkDataBrandcategory = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    console.log("Sample row keys:", Object.keys(data[0]));

    const brands = data.map((row, index) => {
      const brandId = Number(row["brand_id"] || row["brand"] || 0);
      const id = Number(row["brand_category_id"] || 0);
      const categoryId = Number(row["category_id"] || row["brand"] || 0);
      const subcategoryId = Number(row["sub_category_id"] || row["brand"] || 0);

      return {
        id: id,
        brand_id: brandId,
        category_id: categoryId,
        sub_category_id: subcategoryId,
      };
    });
    console.log(brands);
    const createdBrand = await brandcategory.bulkCreate(brands);
    res.json({ message: "Products created successfully", createdBrand });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};
