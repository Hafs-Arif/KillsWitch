const express = require('express');
const { 
  getAllReviews,
  getReviewById,
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  getProductReviewStats,
  getFeaturedReviews
} = require('../controllers/reviewController');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Public routes
router.get('/', getAllReviews); // Get all reviews with optional filtering
router.get('/featured', getFeaturedReviews); // Get featured reviews for homepage/about
router.get('/stats/:productId', getProductReviewStats); // Get review statistics for a product
router.get('/product/:productId', getProductReviews); // Get reviews for a specific product
router.get('/:id', getReviewById); // Get a single review by ID

// Protected routes (require authentication)
router.post('/', auth, createReview); // Create a new review
router.put('/:id', auth, updateReview); // Update a review
router.delete('/:id', auth, deleteReview); // Delete a review

module.exports = router;
