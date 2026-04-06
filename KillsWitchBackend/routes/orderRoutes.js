const express = require('express');
const { checkout, getAllOrders, trackProgress, updateOrderStatus, userCancelOrder, trackOrders, deleteOrder, trackOrderByTracking, getInvoice } = require('../controllers/orderController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/checkout', checkout); // Checkout can be public or require auth based on your business logic
router.get('/tracking', trackOrderByTracking); // Public order tracking by tracking number

// Invoice download (public access - can be protected if desired)
router.get('/:orderId/invoice', getInvoice);

// Protected routes - authenticated users
router.get('/orderByEmail', auth, trackOrders); // User's own orders
router.put('/:orderId/cancel', auth, userCancelOrder); // User cancel order

// Admin only routes
router.get('/', auth, authorize(['admin']), getAllOrders); // All orders - admin only
router.put('/update', auth, authorize(['admin']), updateOrderStatus); // Update order - admin only
// DELETE endpoint retained for backward-compatibility but it now returns 403
// admins should simply change the status to CANCELLED instead of deleting
router.delete('/:orderId', auth, authorize(['admin']), deleteOrder);



module.exports = router;
 