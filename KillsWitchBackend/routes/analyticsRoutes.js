const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const { auth } = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");

// Route to get comprehensive dashboard analytics
router.get("/dashboard", auth, isAdmin, analyticsController.getDashboardAnalytics);

// Route to get summary (faster, lightweight)
router.get("/summary", auth, isAdmin, analyticsController.getSummary);

// Route to get order status breakdown
router.get("/order-breakdown", auth, isAdmin, analyticsController.getOrderStatusBreakdown);

module.exports = router;
