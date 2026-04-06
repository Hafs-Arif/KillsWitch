const express = require('express');
const chatbotController = require('../controllers/chatbotController');
const router = express.Router();

// Public routes - no authentication required for chatbot
router.get('/welcome', chatbotController.getWelcome);
router.post('/message', chatbotController.sendMessage);
router.get('/search', chatbotController.searchProducts);
router.get('/knowledge-base', chatbotController.getKnowledgeBase);
router.post('/clear-history', chatbotController.clearHistory);
router.get('/history', chatbotController.getHistory);

module.exports = router;
 