"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie } from 'lucide-react';
import { storeCookieConsent } from '../../api/cookie-consent-api';
import { useCookieConsent } from '../../contexts/CookieConsentContext';

const CookieConsentBanner = () => {
  const { consentStatus, updateConsentStatus } = useCookieConsent();
  const [loading, setLoading] = useState(false);
  
  // Show banner only if user hasn't provided consent and not loading
  const showBanner = !consentStatus.loading && !consentStatus.hasConsent;

  const handleConsent = async (consentType) => {
    if (!consentStatus.sessionId) return;

    setLoading(true);
    try {
      const consentData = {
        consent_type: consentType,
        session_id: consentStatus.sessionId,
        analytics_cookies: consentType === 'accept',
        marketing_cookies: consentType === 'accept',
        privacy_policy_version: '1.0'
      };

      const response = await storeCookieConsent(consentData);
      
      if (response.success) {
        
        updateConsentStatus({
          hasConsent: true,
          consentType: consentType,
          analyticsEnabled: consentType === 'accept',
          marketingEnabled: consentType === 'accept',
          functionalEnabled: true
        });
        
        // Optional: Trigger analytics or other tracking based on consent
        if (consentType === 'accept') {
          console.log('Analytics cookies enabled');
        } else {
          console.log('Analytics cookies disabled');
        }
      }
    } catch (error) {
      console.error('Error storing cookie consent:', error);
      // Update context to hide banner even on error
      updateConsentStatus({
        hasConsent: true,
        consentType: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => handleConsent('accept');
  const handleReject = () => handleConsent('reject');

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed bottom-4 left-4 z-50 max-w-sm"
      >
        <div className="bg-black border border-[#c70007]/30 rounded-lg p-4 shadow-2xl">
          <div className="flex items-start gap-3 mb-3">
            <Cookie className="w-5 h-5 text-[#c70007] mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-white font-medium text-sm mb-1">Cookie Notice</h3>
              <p className="text-gray-300 text-xs leading-relaxed">
                We use cookies to improve your experience and analyze site usage.
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleReject}
              disabled={loading}
              className="flex-1 px-3 py-2 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 rounded text-xs transition-all disabled:opacity-50"
            >
              {loading ? '...' : 'Reject'}
            </button>
            
            <button
              onClick={handleAccept}
              disabled={loading}
              className="flex-1 px-3 py-2 bg-[#c70007] hover:bg-[#a50005] text-white rounded text-xs transition-all disabled:opacity-50"
            >
              {loading ? '...' : 'Accept'}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CookieConsentBanner;
