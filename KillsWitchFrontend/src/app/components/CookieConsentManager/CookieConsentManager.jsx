"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cookie, Shield, Eye, Settings, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useCookieConsent } from '../../contexts/CookieConsentContext';
import {
  storeCookieConsent,
  deleteCookieConsent,
  getCookieConsent
} from '../../api/cookie-consent-api';

const CookieConsentManager = () => {
  const { consentStatus, updateConsentStatus } = useCookieConsent();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    analytics: false,
    marketing: false,
    functional: true
  });

  useEffect(() => {
    if (consentStatus.hasConsent) {
      setPreferences({
        analytics: consentStatus.analyticsEnabled,
        marketing: consentStatus.marketingEnabled,
        functional: consentStatus.functionalEnabled
      });
    }
  }, [consentStatus]);

  const handleUpdatePreferences = async () => {
    if (!consentStatus.sessionId) return;

    setLoading(true);
    try {
      const consentData = {
        consent_type: (preferences.analytics || preferences.marketing) ? 'accept' : 'reject',
        session_id: consentStatus.sessionId,
        analytics_cookies: preferences.analytics,
        marketing_cookies: preferences.marketing,
        privacy_policy_version: '1.0'
      };

      const response = await storeCookieConsent(consentData);
      
      if (response.success) {
        updateConsentStatus({
          hasConsent: true,
          consentType: consentData.consent_type,
          analyticsEnabled: preferences.analytics,
          marketingEnabled: preferences.marketing,
          functionalEnabled: true
        });
        
        alert('Cookie preferences updated successfully!');
      }
    } catch (error) {
      console.error('Error updating cookie preferences:', error);
      alert('Failed to update cookie preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConsent = async () => {
    if (!consentStatus.sessionId) return;
    
    if (!confirm('Are you sure you want to delete your cookie consent? This will reset all your preferences.')) {
      return;
    }

    setLoading(true);
    try {
      await deleteCookieConsent(consentStatus.sessionId);
      
      updateConsentStatus({
        hasConsent: false,
        consentType: null,
        analyticsEnabled: false,
        marketingEnabled: false,
        functionalEnabled: true
      });
      
      setPreferences({
        analytics: false,
        marketing: false,
        functional: true
      });
      
      alert('Cookie consent deleted successfully!');
    } catch (error) {
      console.error('Error deleting cookie consent:', error);
      alert('Failed to delete cookie consent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (consentStatus.loading) {
    return (
      <div className="bg-[#1c1816] border border-[#c70007]/30 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-3 bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-[#1c1816] border border-[#c70007]/30 rounded-xl p-6 shadow-2xl"
    >
      <div className="flex items-center gap-3 mb-6">
        <Cookie className="w-6 h-6 text-[#c70007]" />
        <h2 className="text-xl font-semibold text-white">Cookie Preferences</h2>
      </div>

      {!consentStatus.hasConsent ? (
        <div className="text-center py-8">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Cookie Consent Found</h3>
          <p className="text-gray-400 mb-4">
            You haven't provided cookie consent yet. The cookie banner will appear when you visit the site.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Current Status */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              {consentStatus.consentType === 'accept' ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
              <span className="text-white font-medium">
                Current Status: {consentStatus.consentType === 'accept' ? 'Accepted' : 'Rejected'}
              </span>
            </div>
            <p className="text-sm text-gray-400">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Cookie Categories */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Cookie Categories
            </h3>

            {/* Functional Cookies */}
            <div className="bg-gray-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-white font-medium">Essential Cookies</h4>
                  <p className="text-sm text-gray-400">Required for basic site functionality</p>
                </div>
                <div className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                  Always Active
                </div>
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="bg-gray-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-white font-medium">Analytics Cookies</h4>
                  <p className="text-sm text-gray-400">Help us understand how visitors use our site</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                    className="sr-only peer"
                    disabled={loading}
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c70007]"></div>
                </label>
              </div>
            </div>

            {/* Marketing Cookies */}
            <div className="bg-gray-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-white font-medium">Marketing Cookies</h4>
                  <p className="text-sm text-gray-400">Used to deliver personalized advertisements</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences(prev => ({ ...prev, marketing: e.target.checked }))}
                    className="sr-only peer"
                    disabled={loading}
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c70007]"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-700">
            <button
              onClick={handleUpdatePreferences}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#c70007] to-[#a50005] hover:from-[#a50005] hover:to-[#850004] text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Updating...' : 'Update Preferences'}
            </button>
            
            <button
              onClick={handleDeleteConsent}
              disabled={loading}
              className="px-6 py-3 border border-red-600 text-red-400 hover:bg-red-600/10 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 justify-center"
            >
              <Trash2 className="w-4 h-4" />
              Delete Consent
            </button>
          </div>

          {/* Privacy Policy Link */}
          <div className="text-center pt-4 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              Learn more about our data practices in our{' '}
              <a 
                href="/PrivacyPolicy" 
                className="text-[#c70007] hover:text-[#a50005] underline transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CookieConsentManager;
