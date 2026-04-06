const express = require('express');
const {
  getAllCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} = require('../controllers/couponController');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

// Public validation endpoint for frontend checkout (MUST be before /:id)
router.get('/validate', validateCoupon);

// Admin-only endpoints
router.get('/', auth, authorize(['admin']), getAllCoupons);
router.get('/:id', auth, authorize(['admin']), getCouponById);
router.post('/', auth, authorize(['admin']), createCoupon);
router.put('/:id', auth, authorize(['admin']), updateCoupon);
router.delete('/:id', auth, authorize(['admin']), deleteCoupon);

module.exports = router;
