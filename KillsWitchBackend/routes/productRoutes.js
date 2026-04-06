const express = require('express');
const { 
  findAllProducts, 
  uploadProduct, 
  deleteProduct, 
  updateProduct,
  addProductImages,
  deleteProductImage,
  findProductById
} = require('../controllers/productController');
const { single, multiple } = require('../middleware/upload');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

// Public routes - anyone can view products
router.get('', findAllProducts);
router.get('/:id', findProductById);

// Protected routes - admin only
router.post('/upload', auth, authorize(['admin']), multiple.fields([
  { name: 'image', maxCount: 1 },
  { name: 'additional_images', maxCount: 9 },
  { name: 'video', maxCount: 1 }
]), uploadProduct);

router.put('/:id', auth, authorize(['admin']), multiple.fields([ 
  { name: 'image', maxCount: 1 },
  { name: 'additional_images', maxCount: 9 },
  { name: 'video', maxCount: 1 }
]), updateProduct);

router.delete('/:id', auth, authorize(['admin']), deleteProduct);

// Image management - admin only
router.post('/:productId/images', auth, authorize(['admin']), multiple.array('images', 10), addProductImages);
router.delete('/images/:imageId', auth, authorize(['admin']), deleteProductImage);

module.exports = router;