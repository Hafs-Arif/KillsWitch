const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

const { auth } = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

router.get('/admins', auth, isAdmin, chatController.getAdmins);
router.get('/conversations', auth, isAdmin, chatController.getConversations);
router.get('/messages', auth, isAdmin, chatController.getMessages);

// Message cleanup routes
router.post('/cleanup', chatController.triggerCleanup);
router.get('/cleanup/stats', chatController.getCleanupStats);

// Offline message routes
router.get('/offline-messages', chatController.getOfflineMessages);
router.post('/offline-messages/delivered', chatController.markOfflineMessagesDelivered);

// Message seen status routes
router.post('/messages/seen', chatController.markMessagesAsSeen);

module.exports = router;


