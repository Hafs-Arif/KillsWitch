const express = require('express');
const router = express.Router();
const {
  createAdminRequest,
  updateApprovalStatus,
  findAllAdminRequests
} = require('../controllers/adminRequestController');
const { auth, authorize } = require('../middleware/auth');

router.post('', auth, authorize(['admin']), createAdminRequest);
router.put('/updateStatus', auth, authorize(['admin']), updateApprovalStatus);
router.get('', auth, authorize(['admin']), findAllAdminRequests);

module.exports = router;
