const express = require('express');
const {
  storeCookieConsent,
  getCookieConsent,
  deleteCookieConsent,
  getCookieConsentStats
} = require('../controllers/cookieConsentController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes - no authentication required
router.post('/consent', storeCookieConsent); // Store cookie consent preference
router.get('/consent', getCookieConsent); // Get cookie consent status
router.delete('/consent', deleteCookieConsent); // Delete cookie consent (GDPR)

// Admin only routes
router.get('/stats', auth, authorize(['admin']), getCookieConsentStats); // Get consent statistics

module.exports = router;
