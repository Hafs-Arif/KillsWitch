const express = require('express');
const { single } = require('../middleware/upload');
const { auth, authorize } = require('../middleware/auth');
const { 
  getAllProductWithBrandAndCategory, 
  getPartName,
  getBrandsByCategory, 
  getAllCategoriesOfAllBrand,
  // Brand CRUD
  getAllBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  // Category CRUD
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  // Subcategory CRUD
  getAllSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  // Brand Category CRUD
  getAllBrandCategories,
  createBrandCategory,
  updateBrandCategory,
  deleteBrandCategory
} = require('../controllers/brandController');
const router = express.Router();

// Public routes - anyone can view brands and categories
router.get('/product', getAllProductWithBrandAndCategory);
router.get('', getPartName);
router.get('/brands', getBrandsByCategory);
router.get('/categories', getAllCategoriesOfAllBrand);

// Admin only routes - Brand CRUD
router.get('/manage/brands', auth, authorize(['admin']), getAllBrands);
router.post('/manage/brands', auth, authorize(['admin']), single.single('brand_image'), createBrand);
router.put('/manage/brands/:id', auth, authorize(['admin']), single.single('brand_image'), updateBrand);
router.delete('/manage/brands/:id', auth, authorize(['admin']), deleteBrand);

// Admin only routes - Category CRUD
router.get('/manage/categories', auth, authorize(['admin']), getAllCategories);
router.post('/manage/categories', auth, authorize(['admin']), createCategory);
router.put('/manage/categories/:id', auth, authorize(['admin']), updateCategory);
router.delete('/manage/categories/:id', auth, authorize(['admin']), deleteCategory);

// Admin only routes - Subcategory CRUD
router.get('/manage/subcategories', auth, authorize(['admin']), getAllSubcategories);
router.post('/manage/subcategories', auth, authorize(['admin']), createSubcategory);
router.put('/manage/subcategories/:id', auth, authorize(['admin']), updateSubcategory);
router.delete('/manage/subcategories/:id', auth, authorize(['admin']), deleteSubcategory);

// Admin only routes - Brand Category CRUD
router.get('/manage/brand-categories', auth, authorize(['admin']), getAllBrandCategories);
router.post('/manage/brand-categories', auth, authorize(['admin']), createBrandCategory);
router.put('/manage/brand-categories/:id', auth, authorize(['admin']), updateBrandCategory);
router.delete('/manage/brand-categories/:id', auth, authorize(['admin']), deleteBrandCategory);

module.exports = router;