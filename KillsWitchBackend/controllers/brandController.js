// controller.js
const { brand, category, subcategory, brandcategory, product } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../models'); // your Sequelize instance



exports.getAllProductWithBrandAndCategory = async (req, res) => {
    const { brandId, categoryId, subcategoryId } = req.query;
  
    try {
      if (!brandId) {
        return res.status(400).json({ error: 'brandId is required' });
      }
  
      const brands = await brand.findAll({
        attributes: ['brand_id', 'brand_name'],
        where: { brand_id: brandId },
        include: [
          {
            model: brandcategory,
            as: 'brandcategory',
            include: [
              {
                model: category,
                as: 'category',
                where: categoryId ? { product_category_id: categoryId } : undefined,
                required: !!categoryId,
              },
              {
                model: subcategory,
                as: 'subcategory',
                where: subcategoryId ? { sub_category_id: subcategoryId } : undefined,
                required: !!subcategoryId,
              },
              {
                model: product,
                as: 'product',
                required: false,
              },
            ],
          },
        ],
      });
  
      if (!brands.length) {
        return res.status(404).json({ error: 'No matching data found' });
      }
  
      const response = brands.map((b) => {
        const brandObj = {
          brand_id: b.brand_id,
          brand_name: b.brand_name,
        };
  
        // If only brandId → return brand with all products (across all brandcategory entries)
        if (!categoryId && !subcategoryId) {
          const allProducts = b.brandcategory.flatMap((bc) => bc.product || []);
          brandObj.products = allProducts.map((p) => ({
            product_id: p.product_id,
            part_number: p.part_number,
          }));
          return brandObj;
        }
  
        // If brandId + categoryId (and optionally subcategoryId)
        brandObj.categories = b.brandcategory.map((bc) => {
          const categoryInfo = {
            category_id: bc.category?.product_category_id,
            category_name: bc.category?.category_name,
          };
  
          if (subcategoryId) {
            categoryInfo.subcategories = [
              {
                sub_category_id: bc.subcategory?.sub_category_id,
                sub_category_name: bc.subcategory?.sub_category_name,
                products: (bc.product || []).map((p) => ({
                  product_id: p.product_id,
                  part_number: p.part_number,
                })),
              },
            ];
          } else {
            categoryInfo.products = (bc.product || []).map((p) => ({
              product_id: p.product_id,
              part_number: p.part_number,
            }));
          }
  
          return categoryInfo;
        });
  
        return brandObj;
      });
  
      res.json(response);
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({ error: error.message });
    }
};

exports.getPartName = async (req, res) => {
    try {
      // Fetch flat joined data using Sequelize
      const data = await brand.findAll({
        attributes: ['brand_id', 'brand_name'],
        include: [
          {
            model: brandcategory,
            as: 'brandcategory',
            attributes: ['id'],
            include: [
              {
                model: category,
                as: 'category',
                attributes: ['product_category_id', 'category_name'],
              },
              {
                model: subcategory,
                as: 'subcategory',
                attributes: ['sub_category_id', 'sub_category_name'],
              },
              {
                model: product,
                as: 'product',
                attributes: ['product_id', 'part_number'],
              },
            ],
          },
        ],
        order: [
          ['brand_id', 'ASC'],
          [{ model: brandcategory, as: 'brandcategory' }, { model: category, as: 'category' }, 'product_category_id', 'ASC'],
          [{ model: brandcategory, as: 'brandcategory' }, { model: subcategory, as: 'subcategory' }, 'sub_category_id', 'ASC'],
          [{ model: brandcategory, as: 'brandcategory' }, { model: product, as: 'product' }, 'product_id', 'ASC'],
        ],
      });
  
      if (!data.length) {
        return res.status(404).json({ error: 'No brands found.' });
      }
  
      // ✅ Transform to nested structure
      const result = data.map((b) => {
        const brandObj = {
          brand_id: b.brand_id,
          brand_name: b.brand_name,
          categories: [],
        };
  
        const categoryMap = new Map();
  
        b.brandcategory.forEach((bc) => {
          const cat = bc.category;
          const sub = bc.subcategory;
          const prodList = bc.product || [];
  
          // Add null safety checks
          if (!cat || !sub) return;
  
          if (!categoryMap.has(cat.product_category_id)) {
            categoryMap.set(cat.product_category_id, {
              category_id: cat.product_category_id,
              category_name: cat.category_name,
              subcategories: [],
            });
          }

          const categoryEntry = categoryMap.get(cat.product_category_id);

          let subcategoryEntry = categoryEntry.subcategories.find(s => s.subcategory_id === sub.sub_category_id);
          if (!subcategoryEntry) {
            subcategoryEntry = {
              subcategory_id: sub.sub_category_id,
              subcategory_name: sub.sub_category_name,
              products: [],
            };
            categoryEntry.subcategories.push(subcategoryEntry);
          }

          prodList.forEach((p) => {
            if (!subcategoryEntry.products.find(pr => pr.product_id === p.product_id)) {
              subcategoryEntry.products.push({
                product_id: p.product_id,
                product_name: p.part_number,
              });
            }
          });
        });

        brandObj.categories = Array.from(categoryMap.values());
        return brandObj;
      });
  
      res.json(result);
    } catch (err) {
      console.error('Error fetching part names:', err);
      res.status(500).json({ error: err.message });
    }
};
exports.getBrandsByCategory = async (req, res) => {
    try {
      const { categoryName } = req.query;
  
      if (!categoryName) {
        return res.status(400).json({ error: 'categoryName is required.' });
      }
  
      // STEP 1: Get category IDs matching 'router' (case-insensitive)
      const matchingCategories = await category.findAll({
        where: {
           // name: categoryName
          category_name: {
            [Op.iLike]: `%${categoryName}%`,
          },
        },
        attributes: ['product_category_id'],
      });
  
      const categoryIds = matchingCategories.map((cat) => cat.product_category_id);
  
      if (!categoryIds.length) {
        return res.status(404).json({ error: 'No matching categories found.' });
      }
  
      // STEP 2: Fetch brands with brandcategories matching those category IDs
      const brands = await brand.findAll({
        attributes: ['brand_id', 'brand_name'],
        include: [
          {
            model: brandcategory,
            as: 'brandcategory',
            attributes: ['id'],
            where: {
              category_id: {
                [Op.in]: categoryIds,
              },
            },
            include: [
              {
                model: category,
                as: 'category',
                attributes: ['product_category_id', 'category_name'],
              },
              {
                model: subcategory,
                as: 'subcategory',
                attributes: ['sub_category_id', 'sub_category_name'],
                required: false,
              },
              {
                model: product,
                as: 'product',
                attributes: [
                  'product_id',
                  'part_number',
                  'price',
                  'quantity',
                  'short_description',
                  'long_description',
                  'image',
                  'sub_condition',
                  'condition',
                ],
                required: false,
              },
            ],
          },
        ],
      });
  
      // STEP 3: Transform the response
      const result = brands.map((b) => {
        const brandObj = {
          brand_id: b.brand_id,
          brand_name: b.brand_name,
          categories: [],
        };
  
        const categoryMap = new Map();
  
        b.brandcategory.forEach((bc) => {
          const cat = bc.category;
          if (!cat) return;
  
          const sub = bc.subcategory;
          const prodList = bc.product || [];
  
          if (!categoryMap.has(cat.product_category_id)) {
            categoryMap.set(cat.product_category_id, {
              category_id: cat.product_category_id,
              category_name: cat.category_name,
              subcategories: [],
            });
          }
  
          const categoryEntry = categoryMap.get(cat.product_category_id);
  
          if (sub) {
            let subcategoryEntry = categoryEntry.subcategories.find(
              (s) => s.subcategory_id === sub.sub_category_id
            );
  
            if (!subcategoryEntry) {
              subcategoryEntry = {
                subcategory_id: sub.sub_category_id,
                subcategory_name: sub.sub_category_name,
                products: [],
              };
              categoryEntry.subcategories.push(subcategoryEntry);
            }
  
            prodList.forEach((p) => {
              subcategoryEntry.products.push({
                product_id: p.product_id,
                product_name: p.part_number,
                price: p.price,
                quantity: p.quantity,
                short_des: p.short_description,
                long_description: p.long_description,
                product_image: p.image,
                SubCondition: p.sub_condition,
                condition: p.condition,
              });
            });
          }
        });
  
        brandObj.categories = Array.from(categoryMap.values());
        return brandObj;
      });
  
      res.json(result);
    } catch (err) {
      console.error('Error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getAllCategoriesOfAllBrand = async (req, res) => {
  try {
    const results = await sequelize.query(
      `
      SELECT
        b.brand_id,
        b.brand_name,
        JSON_AGG(DISTINCT c.category_name) AS categories
      FROM
        brands b
      LEFT JOIN brandcategory bc ON bc."brand_id" = b.brand_id
      LEFT JOIN categories c ON bc."category_id" = c.product_category_id
      LEFT JOIN subcategories s ON bc."sub_category_id" = s.sub_category_id
      GROUP BY b.brand_id, b.brand_name
      ORDER BY b.brand_id ASC
      `,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.json(results);
  } catch (error) {
    console.error('Error fetching brand categories:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// CRUD Operations for Brands
exports.getAllBrands = async (req, res) => {
  try {
    const brands = await brand.findAll({
      attributes: ['brand_id', 'brand_name'],
      order: [['brand_id', 'ASC']]
    });
    res.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.createBrand = async (req, res) => {
  try {
    const { brand_name, brand_id } = req.body;
    
    if (!brand_name || !brand_id) {
      return res.status(400).json({ error: 'Brand name and ID are required' });
    }

    // Check if brand already exists
    const existingBrand = await brand.findOne({ where: { brand_id } });
    if (existingBrand) {
      return res.status(409).json({ error: 'Brand with this ID already exists' });
    }

    const newBrand = await brand.create({ 
      brand_name, 
      brand_id
    });

    res.status(201).json({
      message: 'Brand created successfully',
      brand: newBrand
    });
  } catch (error) {
    console.error('Error creating brand:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { brand_name } = req.body;

    if (!brand_name) {
      return res.status(400).json({ error: 'Brand name is required' });
    }

    const existingBrand = await brand.findByPk(id);
    if (!existingBrand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    await existingBrand.update({ brand_name });

    res.json({
      message: 'Brand updated successfully',
      brand: existingBrand
    });
  } catch (error) {
    console.error('Error updating brand:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;

    const brandToDelete = await brand.findByPk(id);
    if (!brandToDelete) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    // Check if brand is being used in brandcategory
    const brandCategoryCount = await brandcategory.count({
      where: { brand_id: id }
    });

    if (brandCategoryCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete brand. It is being used in brand-category relationships.' 
      });
    }

    await brandToDelete.destroy();

    res.json({
      message: 'Brand deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// CRUD Operations for Categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await category.findAll({
      order: [['product_category_id', 'ASC']]
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { category_name, product_category_id } = req.body;
    
    if (!category_name || !product_category_id) {
      return res.status(400).json({ error: 'Category name and ID are required' });
    }

    // Check if category already exists
    const existingCategory = await category.findOne({ where: { product_category_id } });
    if (existingCategory) {
      return res.status(409).json({ error: 'Category with this ID already exists' });
    }

    const newCategory = await category.create({ category_name, product_category_id });
    res.status(201).json({ message: 'Category created successfully', category: newCategory });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_name } = req.body;

    if (!category_name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const categoryToUpdate = await category.findByPk(id);
    if (!categoryToUpdate) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await categoryToUpdate.update({ category_name });
    res.json({ message: 'Category updated successfully', category: categoryToUpdate });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const categoryToDelete = await category.findByPk(id);
    if (!categoryToDelete) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await categoryToDelete.destroy();
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: error.message });
  }
};

// CRUD Operations for Subcategories
exports.getAllSubcategories = async (req, res) => {
  try {
    const subcategories = await subcategory.findAll({
      order: [['sub_category_id', 'ASC']]
    });
    res.json(subcategories);
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.createSubcategory = async (req, res) => {
  try {
    const { sub_category_name, sub_category_id } = req.body;
    
    if (!sub_category_name || !sub_category_id) {
      return res.status(400).json({ error: 'Subcategory name and ID are required' });
    }

    // Check if subcategory already exists
    const existingSubcategory = await subcategory.findOne({ where: { sub_category_id } });
    if (existingSubcategory) {
      return res.status(409).json({ error: 'Subcategory with this ID already exists' });
    }

    const newSubcategory = await subcategory.create({ sub_category_name, sub_category_id });
    res.status(201).json({ message: 'Subcategory created successfully', subcategory: newSubcategory });
  } catch (error) {
    console.error('Error creating subcategory:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { sub_category_name } = req.body;

    if (!sub_category_name) {
      return res.status(400).json({ error: 'Subcategory name is required' });
    }

    const subcategoryToUpdate = await subcategory.findByPk(id);
    if (!subcategoryToUpdate) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    await subcategoryToUpdate.update({ sub_category_name });
    res.json({ message: 'Subcategory updated successfully', subcategory: subcategoryToUpdate });
  } catch (error) {
    console.error('Error updating subcategory:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteSubcategory = async (req, res) => {
  try {
    const { id } = req.params;

    const subcategoryToDelete = await subcategory.findByPk(id);
    if (!subcategoryToDelete) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    await subcategoryToDelete.destroy();
    res.json({ message: 'Subcategory deleted successfully' });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    res.status(500).json({ error: error.message });
  }
};

// CRUD Operations for Brand Categories
exports.getAllBrandCategories = async (req, res) => {
  try {
    const brandCategories = await brandcategory.findAll({
      include: [
        {
          model: brand,
          as: 'brand',
          attributes: ['brand_id', 'brand_name']
        },
        {
          model: category,
          as: 'category',
          attributes: ['product_category_id', 'category_name']
        },
        {
          model: subcategory,
          as: 'subcategory',
          attributes: ['sub_category_id', 'sub_category_name']
        }
      ],
      order: [['id', 'ASC']]
    });
    res.json(brandCategories);
  } catch (error) {
    console.error('Error fetching brand categories:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.createBrandCategory = async (req, res) => {
  try {
    const { brand_id, category_id, sub_category_id, id } = req.body;
    
    if (!brand_id || !category_id || !sub_category_id || !id) {
      return res.status(400).json({ error: 'Brand ID, Category ID, Subcategory ID, and ID are required' });
    }

    // Check if brand category already exists
    const existingBrandCategory = await brandcategory.findOne({ where: { id } });
    if (existingBrandCategory) {
      return res.status(409).json({ error: 'Brand category with this ID already exists' });
    }

    // Verify that the referenced entities exist
    const brandExists = await brand.findByPk(brand_id);
    const categoryExists = await category.findByPk(category_id);
    const subcategoryExists = await subcategory.findByPk(sub_category_id);

    if (!brandExists) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    if (!categoryExists) {
      return res.status(404).json({ error: 'Category not found' });
    }
    if (!subcategoryExists) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    const newBrandCategory = await brandcategory.create({ id, brand_id, category_id, sub_category_id });
    
    // Fetch the created brand category with associations
    const createdBrandCategory = await brandcategory.findByPk(newBrandCategory.id, {
      include: [
        { model: brand, as: 'brand', attributes: ['brand_id', 'brand_name'] },
        { model: category, as: 'category', attributes: ['product_category_id', 'category_name'] },
        { model: subcategory, as: 'subcategory', attributes: ['sub_category_id', 'sub_category_name'] }
      ]
    });

    res.status(201).json({ message: 'Brand category created successfully', brandCategory: createdBrandCategory });
  } catch (error) {
    console.error('Error creating brand category:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateBrandCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { brand_id, category_id, sub_category_id } = req.body;

    if (!brand_id || !category_id || !sub_category_id) {
      return res.status(400).json({ error: 'Brand ID, Category ID, and Subcategory ID are required' });
    }

    const brandCategoryToUpdate = await brandcategory.findByPk(id);
    if (!brandCategoryToUpdate) {
      return res.status(404).json({ error: 'Brand category not found' });
    }

    // Verify that the referenced entities exist
    const brandExists = await brand.findByPk(brand_id);
    const categoryExists = await category.findByPk(category_id);
    const subcategoryExists = await subcategory.findByPk(sub_category_id);

    if (!brandExists) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    if (!categoryExists) {
      return res.status(404).json({ error: 'Category not found' });
    }
    if (!subcategoryExists) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    await brandCategoryToUpdate.update({ brand_id, category_id, sub_category_id });
    
    // Fetch updated brand category with associations
    const updatedBrandCategory = await brandcategory.findByPk(id, {
      include: [
        { model: brand, as: 'brand', attributes: ['brand_id', 'brand_name'] },
        { model: category, as: 'category', attributes: ['product_category_id', 'category_name'] },
        { model: subcategory, as: 'subcategory', attributes: ['sub_category_id', 'sub_category_name'] }
      ]
    });

    res.json({ message: 'Brand category updated successfully', brandCategory: updatedBrandCategory });
  } catch (error) {
    console.error('Error updating brand category:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteBrandCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const brandCategoryToDelete = await brandcategory.findByPk(id);
    if (!brandCategoryToDelete) {
      return res.status(404).json({ error: 'Brand category not found' });
    }

    await brandCategoryToDelete.destroy();
    res.json({ message: 'Brand category deleted successfully' });
  } catch (error) {
    console.error('Error deleting brand category:', error);
    res.status(500).json({ error: error.message });
  }
};