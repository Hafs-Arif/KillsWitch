const { CookieConsent } = require('../models');
// Note: User model import removed to avoid dependency issues during table creation
const { v4: uuidv4 } = require('uuid');

// Helper function to generate session ID
const generateSessionId = () => {
  return uuidv4();
};

// Helper function to get client IP address
const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.ip ||
         '127.0.0.1';
};

// Store cookie consent preference
const storeCookieConsent = async (req, res) => {
  try {
    const {
      consent_type, // 'accept' or 'reject'
      session_id,
      analytics_cookies = false,
      marketing_cookies = false,
      privacy_policy_version = '1.0'
    } = req.body;

    // Validate required fields
    if (!consent_type || !['accept', 'reject'].includes(consent_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid consent type. Must be "accept" or "reject".'
      });
    }

    // Get user information
    const userId = req.user ? req.user.id : null;
    const clientIP = getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';
    
    // Generate session ID if not provided
    const finalSessionId = session_id || generateSessionId();

    // Set cookie preferences based on consent type
    const consentGiven = consent_type === 'accept';
    const finalAnalyticsCookies = consentGiven ? analytics_cookies : false;
    const finalMarketingCookies = consentGiven ? marketing_cookies : false;

    // Set expiration date (1 year from now)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Check if consent already exists for this session/user
    let existingConsent = null;
    if (userId) {
      existingConsent = await CookieConsent.findOne({
        where: { user_id: userId },
        order: [['created_at', 'DESC']]
      });
    } else {
      existingConsent = await CookieConsent.findOne({
        where: { session_id: finalSessionId },
        order: [['created_at', 'DESC']]
      });
    }

    let cookieConsent;

    if (existingConsent) {
      // Update existing consent
      cookieConsent = await existingConsent.update({
        consent_type,
        consent_given: consentGiven,
        analytics_cookies: finalAnalyticsCookies,
        marketing_cookies: finalMarketingCookies,
        consent_date: new Date(),
        expires_at: expiresAt,
        ip_address: clientIP,
        user_agent: userAgent,
        privacy_policy_version
      });
    } else {
      // Create new consent record
      cookieConsent = await CookieConsent.create({
        user_id: userId,
        session_id: finalSessionId,
        ip_address: clientIP,
        user_agent: userAgent,
        consent_given: consentGiven,
        consent_type,
        analytics_cookies: finalAnalyticsCookies,
        functional_cookies: true, // Always true for essential cookies
        marketing_cookies: finalMarketingCookies,
        consent_date: new Date(),
        expires_at: expiresAt,
        country: 'US',
        privacy_policy_version
      });
    }

    console.log(`Cookie consent ${existingConsent ? 'updated' : 'stored'} for ${userId ? `user ${userId}` : `session ${finalSessionId}`}: ${consent_type}`);

    return res.status(200).json({
      success: true,
      message: `Cookie consent ${existingConsent ? 'updated' : 'recorded'} successfully`,
      data: {
        consent_id: cookieConsent.consent_id,
        session_id: finalSessionId,
        consent_type,
        consent_given: consentGiven,
        analytics_cookies: finalAnalyticsCookies,
        functional_cookies: true,
        marketing_cookies: finalMarketingCookies,
        expires_at: expiresAt
      }
    });

  } catch (error) {
    console.error('Error storing cookie consent:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to store cookie consent',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get cookie consent status
const getCookieConsent = async (req, res) => {
  try {
    const { session_id } = req.query;
    const userId = req.user ? req.user.id : null;

    if (!session_id && !userId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID or user authentication required'
      });
    }

    let cookieConsent = null;

    // Try to find by user ID first, then by session ID
    if (userId) {
      cookieConsent = await CookieConsent.findOne({
        where: { user_id: userId },
        order: [['created_at', 'DESC']]
      });
    }

    if (!cookieConsent && session_id) {
      cookieConsent = await CookieConsent.findOne({
        where: { session_id },
        order: [['created_at', 'DESC']]
      });
    }

    if (!cookieConsent) {
      return res.status(404).json({
        success: false,
        message: 'No cookie consent found',
        data: {
          consent_given: false,
          needs_consent: true
        }
      });
    }

    // Check if consent has expired
    const now = new Date();
    const isExpired = cookieConsent.expires_at && new Date(cookieConsent.expires_at) < now;

    if (isExpired) {
      return res.status(200).json({
        success: true,
        message: 'Cookie consent has expired',
        data: {
          consent_given: false,
          needs_consent: true,
          expired: true
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cookie consent found',
      data: {
        consent_id: cookieConsent.consent_id,
        consent_type: cookieConsent.consent_type,
        consent_given: cookieConsent.consent_given,
        analytics_cookies: cookieConsent.analytics_cookies,
        functional_cookies: cookieConsent.functional_cookies,
        marketing_cookies: cookieConsent.marketing_cookies,
        consent_date: cookieConsent.consent_date,
        expires_at: cookieConsent.expires_at,
        needs_consent: false
      }
    });

  } catch (error) {
    console.error('Error getting cookie consent:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get cookie consent',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Delete cookie consent (for GDPR compliance)
const deleteCookieConsent = async (req, res) => {
  try {
    const { session_id } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!session_id && !userId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID or user authentication required'
      });
    }

    let deletedCount = 0;

    if (userId) {
      deletedCount = await CookieConsent.destroy({
        where: { user_id: userId }
      });
    } else if (session_id) {
      deletedCount = await CookieConsent.destroy({
        where: { session_id }
      });
    }

    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'No cookie consent found to delete'
      });
    }

    console.log(`Deleted ${deletedCount} cookie consent record(s) for ${userId ? `user ${userId}` : `session ${session_id}`}`);

    return res.status(200).json({
      success: true,
      message: 'Cookie consent deleted successfully',
      data: {
        deleted_count: deletedCount
      }
    });

  } catch (error) {
    console.error('Error deleting cookie consent:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete cookie consent',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get cookie consent statistics (admin only)
const getCookieConsentStats = async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const { sequelize } = require('../models');

    // Get consent statistics
    const stats = await CookieConsent.findAll({
      attributes: [
        'consent_type',
        [sequelize.fn('COUNT', sequelize.col('consent_id')), 'count']
      ],
      group: ['consent_type']
    });

    // Get recent consents (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentConsents = await CookieConsent.count({
      where: {
        consent_date: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });

    // Get total consents
    const totalConsents = await CookieConsent.count();

    return res.status(200).json({
      success: true,
      message: 'Cookie consent statistics retrieved successfully',
      data: {
        total_consents: totalConsents,
        recent_consents_30_days: recentConsents,
        consent_breakdown: stats,
        generated_at: new Date()
      }
    });

  } catch (error) {
    console.error('Error getting cookie consent statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get cookie consent statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  storeCookieConsent,
  getCookieConsent,
  deleteCookieConsent,
  getCookieConsentStats,
  generateSessionId
};
