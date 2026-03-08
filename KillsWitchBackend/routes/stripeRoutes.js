const express = require("express");
const router = express.Router();
const stripeController = require("../controllers/stripeController");
const { auth, authorize } = require('../middleware/auth');

router.get("/config", stripeController.getPublishableKey);
// Require authentication so stripeController.createPaymentIntent can access req.user
router.post("/create-payment-intent", auth, stripeController.createPaymentIntent);
// Checkout creates an order for the current user; require auth
router.post("/process-checkout", auth, stripeController.processCheckout);

// 👉 no express.raw here; app-level already set it
router.post("/webhook", stripeController.handleWebhook);

// Refunds should be protected; at minimum require auth (optionally restrict to admin)
router.post("/refund", auth, /* authorize(['admin']), */ stripeController.refundPayment);

module.exports = router;
