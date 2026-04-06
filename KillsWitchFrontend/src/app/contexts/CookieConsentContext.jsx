"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import {
  getCookieConsent,
  generateSessionId,
  getStoredSessionId,
  storeSessionId,
  requiresCookieConsent
} from '../api/cookie-consent-api';

const CookieConsentContext = createContext();

export const useCookieConsent = () => {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
};

export const CookieConsentProvider = ({ children }) => {
  const [consentStatus, setConsentStatus] = useState({
    hasConsent: false,
    consentType: null,
    analyticsEnabled: false,
    marketingEnabled: false,
    functionalEnabled: true, // Always enabled
    loading: true,
    sessionId: null
  });

  useEffect(() => {
    const initializeCookieConsent = async () => {
      try {
        // Check if user is in a region that requires consent
        if (!requiresCookieConsent('US')) {
          setConsentStatus(prev => ({
            ...prev,
            hasConsent: true,
            analyticsEnabled: true,
            marketingEnabled: true,
            loading: false
          }));
          return;
        }

        // Get or generate session ID
        let currentSessionId = getStoredSessionId();
        if (!currentSessionId) {
          currentSessionId = generateSessionId();
          storeSessionId(currentSessionId);
        }

        // Check existing consent
        const consentResponse = await getCookieConsent(currentSessionId);
        
        if (consentResponse.success && consentResponse.data && !consentResponse.data.needs_consent) {
          // User has provided consent
          setConsentStatus({
            hasConsent: true,
            consentType: consentResponse.data.consent_type,
            analyticsEnabled: consentResponse.data.analytics_cookies || false,
            marketingEnabled: consentResponse.data.marketing_cookies || false,
            functionalEnabled: consentResponse.data.functional_cookies || true,
            loading: false,
            sessionId: currentSessionId
          });
        } else {
          // User needs to provide consent
          setConsentStatus({
            hasConsent: false,
            consentType: null,
            analyticsEnabled: false,
            marketingEnabled: false,
            functionalEnabled: true,
            loading: false,
            sessionId: currentSessionId
          });
        }
      } catch (error) {
        console.error('Error initializing cookie consent:', error);
        setConsentStatus(prev => ({
          ...prev,
          loading: false
        }));
      }
    };

    initializeCookieConsent();
  }, []);

  const updateConsentStatus = (newStatus) => {
    setConsentStatus(prev => ({
      ...prev,
      ...newStatus
    }));
  };

  // Helper functions for components to check consent
  const canUseAnalytics = () => consentStatus.analyticsEnabled;
  const canUseMarketing = () => consentStatus.marketingEnabled;
  const canUseFunctional = () => consentStatus.functionalEnabled;

  const value = {
    consentStatus,
    updateConsentStatus,
    canUseAnalytics,
    canUseMarketing,
    canUseFunctional,
    isLoading: consentStatus.loading
  };

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
};
