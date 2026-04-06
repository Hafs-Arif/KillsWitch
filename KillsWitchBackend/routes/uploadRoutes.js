// routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const { uploadBulkData, uploadBulkDataCategory, uploadBulkDataBrand, uploadBulkDataSubcategory, uploadBulkDataBrandcategory } = require('../controllers/uploadController');
const { single } = require('../middleware/upload');
const { auth, authorize } = require('../middleware/auth');

// Bulk upload routes - admin only
router.post('/product', auth, authorize(['admin']), single.single('file'), uploadBulkData);
router.post('/category', auth, authorize(['admin']), single.single('file'), uploadBulkDataCategory);
router.post('/brand', auth, authorize(['admin']), single.single('file'), uploadBulkDataBrand);
router.post('/subcategory', auth, authorize(['admin']), single.single('file'), uploadBulkDataSubcategory);
router.post('/brandcategory', auth, authorize(['admin']), single.single('file'), uploadBulkDataBrandcategory);



module.exports = router;
 