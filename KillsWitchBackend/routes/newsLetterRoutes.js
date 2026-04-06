const express = require('express');
const { handleNewsletterSubscription, getAllSubscriptions, deleteSubscription } = require('../controllers/newsLetterController');
const { auth } = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const router = express.Router();

// Public subscription endpoint
router.post('/newsletter', handleNewsletterSubscription);

// Admin-only: GET all subscribers
router.get('/subscribers', auth, isAdmin, getAllSubscriptions);

// Admin-only: DELETE a subscriber
router.delete('/:id', auth, isAdmin, deleteSubscription);

module.exports = router;
