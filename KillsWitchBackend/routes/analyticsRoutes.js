const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const { auth } = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");

router.get("/dashboard", auth, isAdmin, analyticsController.getDashboardAnalytics);
router.get("/summary", auth, isAdmin, analyticsController.getSummary);
router.get("/order-breakdown", auth, isAdmin, analyticsController.getOrderStatusBreakdown);

module.exports = router;
