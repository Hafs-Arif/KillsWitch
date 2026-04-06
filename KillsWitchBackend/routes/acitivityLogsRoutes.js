const express = require("express");
const {
  findAllLogs,
  findUser,
  getActivityLogs,
  findByOrder,
} = require("../controllers/activityLogsController");
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

// All activity log routes are admin only
router.get("/", auth, authorize(['admin']), findAllLogs);
router.get("/detail", auth, authorize(['admin']), findUser);
router.get("/UserEmail", auth, authorize(['admin']), getActivityLogs);
router.get("/OrderId", auth, authorize(['admin']), findByOrder);

module.exports = router;
