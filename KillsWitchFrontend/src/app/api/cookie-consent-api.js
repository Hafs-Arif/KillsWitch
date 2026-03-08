"use client";

import { BASE_URL } from "./api";

// Generate a unique session ID for anonymous users
export const generateSessionId = () => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Store cookie consent preference
export const storeCookieConsent = async (consentData) => {
  try {
    const response = await fetch(`${BASE_URL}/cookie-consent/consent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(consentData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to store cookie consent');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error storing cookie consent:', error);
    throw error;
  }
};

// Get cookie consent status
export const getCookieConsent = async (sessionId) => {
  try {
    const url = new URL(`${BASE_URL}/cookie-consent/consent`);
    if (sessionId) {
      url.searchParams.append('session_id', sessionId);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 404) {
        // No consent found - user needs to provide consent
        return {
          success: false,
          data: {
            consent_given: false,
            needs_consent: true
          }
        };
      }
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to get cookie consent');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // suppress typical network failures
    if (!error.message.toLowerCase().includes('failed to fetch')) {
      console.error('Error getting cookie consent:', error);
      throw error;
    } else {
      return {
        success: false,
        data: {
          consent_given: false,
          needs_consent: true
        }
      };
    }
  }
};

// Delete cookie consent (for GDPR compliance)
export const deleteCookieConsent = async (sessionId) => {
  try {
    const response = await fetch(`${BASE_URL}/cookie-consent/consent`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ session_id: sessionId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to delete cookie consent');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting cookie consent:', error);
    throw error;
  }
};

// Get cookie consent statistics (admin only)
export const getCookieConsentStats = async () => {
  try {
    const response = await fetch(`${BASE_URL}/cookie-consent/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to get cookie consent statistics');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting cookie consent statistics:', error);
    throw error;
  }
};

// Helper function to check if user is in a region that requires cookie consent
export const requiresCookieConsent = (userLocation = 'US') => {
  // For US users, we'll show the banner as requested
  // You can extend this for other regions like EU (GDPR), etc.
  const regionsRequiringConsent = ['US', 'EU', 'UK', 'CA'];
  return regionsRequiringConsent.includes(userLocation.toUpperCase());
};

// Helper function to get stored session ID from sessionStorage
export const getStoredSessionId = () => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('cookie_consent_session_id');
  }
  return null;
};

// Helper function to store session ID in sessionStorage
export const storeSessionId = (sessionId) => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('cookie_consent_session_id', sessionId);
  }
};
