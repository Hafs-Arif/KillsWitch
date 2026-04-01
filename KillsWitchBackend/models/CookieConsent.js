const { query } = require("../config/db");

class CookieConsentModel {
  static async findBySession(sessionId) {
    const { rows } = await query(`SELECT * FROM cookie_consents WHERE session_id = $1`, [sessionId]);
    return rows[0] || null;
  }

  static async create(sessionId, consentType, ipAddr, userAgent, country = "US") {
    await query(
      `INSERT INTO cookie_consents
         (session_id, ip_address, user_agent, consent_given, consent_type, analytics_cookies, functional_cookies, marketing_cookies, consent_date, country, privacy_policy_version, created_at, updated_at)
       VALUES ($1, $2, $3, true, $4, false, true, false, NOW(), $5, '1.0', NOW(), NOW())`,
      [sessionId, ipAddr, userAgent?.slice(0, 512), consentType, country]
    );
  }
}

module.exports = { CookieConsentModel };