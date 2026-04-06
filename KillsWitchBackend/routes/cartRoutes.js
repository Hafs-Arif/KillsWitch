const express = require('express');
const { 
  getOrCreateCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  getCart,
  clearCart,
  getCartSummary,
  mergeCarts
} = require('../controllers/cartController');
const { auth, optionalAuth } = require('../middleware/auth');
const router = express.Router();

// Cart routes: apply auth only to routes that need it

// Cart management
router.get('/', auth, getCart); // Get current cart (requires auth or use sessionId via POST)
router.post('/', getOrCreateCart); // Get or create cart (accepts sessionId for guests)
router.get('/summary', auth, getCartSummary); // Get cart summary for header
router.delete('/clear', auth, clearCart); // Clear entire cart

// Cart items
router.post('/items', optionalAuth, addToCart); // Add item to cart (supports guest via sessionId or authenticated user)
router.put('/items/:itemId', auth, updateCartItem); // Update cart item
router.delete('/items/:itemId', auth, removeFromCart); // Remove item from cart

// Cart merging (for guest to user conversion)
router.post('/merge', auth, mergeCarts); // Merge guest cart with user cart

module.exports = router;
