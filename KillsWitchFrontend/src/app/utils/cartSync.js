/**
 * Cart Synchronization Utilities
 * Handles synchronization between localStorage cart and backend cart
 */

import { cartAPI, API } from '../api/api';

/**
 * Generate or retrieve guest session ID for tracking guest carts
 */
export const getOrCreateGuestSessionId = () => {
  if (typeof window === 'undefined') return null;
  
  let sessionId = localStorage.getItem('guestSessionId');
  if (!sessionId) {
    // Generate unique session ID
    sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('guestSessionId', sessionId);
  }
  return sessionId;
};

/**
 * Clear guest session ID after merge (when user logs in)
 */
export const clearGuestSessionId = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('guestSessionId');
  }
};

/**
 * Merge guest cart from localStorage into user account (database)
 * Guest cart is kept in localStorage until user logs in
 */
export const mergeGuestCart = async () => {
  try {
    // Get localStorage guest cart
    const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    if (localCart.length === 0) {
      return { success: true, message: 'No guest cart to merge' };
    }

    // Check if already merged
    if (localStorage.getItem('cart_merged') === '1') {
      return { success: true, message: 'Cart already merged' };
    }
    const syncResults = [];
    for (const item of localCart) {
      try {
        const id = item.product_id || item.product_product_id || item.id;
        const result = await cartAPI.addToCart({
          productId: id,
          quantity: item.quantity || 1,
          notes: `Migrated from guest cart`
        });
        syncResults.push({ success: true, item: item.product_part_number || id });
      } catch (error) {
        console.warn(`⚠️ Failed to sync item ${item.product_part_number}:`, error);
        syncResults.push({ success: false, item: item.product_part_number, error });
      }
    }
    
    // Mark as merged
    localStorage.setItem('cart_merged', '1');
    
    // Clear local guest session ID
    clearGuestSessionId();
    
    // Clear local localStorage cart after successful merge
    localStorage.removeItem('cart');
    
    // Trigger UI refresh
    window.dispatchEvent(new Event('storage'));
    
    const successCount = syncResults.filter(r => r.success).length;
    const failCount = syncResults.filter(r => !r.success).length;
        
    return { 
      success: true, 
      message: `${successCount} items merged into your account`,
      details: syncResults
    };
  } catch (error) {
    console.error('❌ Error merging guest cart:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sync localStorage cart with backend after login
 * This should be called after successful login
 */
export const syncCartAfterLogin = async () => {
  try {
    
    // Get localStorage cart
    const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    if (localCart.length === 0) {
      return { success: true, message: 'No items to sync' };
    }
    const syncResults = [];
    for (const item of localCart) {
      try {
        const id = item.product_id || item.product_product_id || item.id;
        const result = await cartAPI.addToCart({
          productId: id,
          quantity: item.quantity || 1,
          notes: `Synced from guest cart at ${new Date().toISOString()}`
        });
        syncResults.push({ success: true, item: item.product_part_number || item.product_name });
      } catch (error) {
        console.warn(`⚠️ Failed to sync item ${item.product_part_number || item.product_name}:`, error);
        syncResults.push({ success: false, item: item.product_part_number || item.product_name, error });
      }
    }

    // Clear localStorage cart after successful sync
    localStorage.removeItem('cart');
    
    // Trigger cart count update
    window.dispatchEvent(new Event('storage'));
    
    const successCount = syncResults.filter(r => r.success).length;
    const failCount = syncResults.filter(r => !r.success).length;
    
    
    return { 
      success: true, 
      message: `${successCount} items synced to your account`,
      details: syncResults
    };
  } catch (error) {
    console.error('❌ Cart sync error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Clear cart after successful checkout
 * This should be called after successful payment/order placement
 */
export const clearCartAfterCheckout = async () => {
  try {
    
    // Clear localStorage cart
    localStorage.removeItem('cart');
    
    // Clear backend cart if user is logged in
    try {
      await cartAPI.clearCart();
    } catch (error) {
      console.warn('⚠️ Failed to clear backend cart (user might not be logged in):', error);
    }
    
    // Trigger cart count update
    window.dispatchEvent(new Event('storage'));
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error clearing cart after checkout:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get cart count from appropriate source (backend for logged in users, localStorage for guests)
 */
export const getCartCount = async () => {
  try {
    // Check if user is authenticated first
    const profile = await API.auth.getProfile();
    
    if (profile && profile.user) {
      // User is authenticated, try backend cart
      try {
        const backendCart = await cartAPI.getCart();
        const count = backendCart.data?.items?.length || 0;
        return count;
      } catch (error) {
        console.warn('Backend cart failed, using localStorage:', error);
        // Fallback to localStorage
        if (typeof window !== 'undefined') {
          const cart = JSON.parse(localStorage.getItem('cart') || '[]');
          return cart.length;
        }
      }
    } else {
      // User not authenticated, use localStorage
      if (typeof window !== 'undefined') {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        return cart.length;
      }
    }
    return 0;
  } catch (error) {
    // Auth check failed, use localStorage
    if (typeof window !== 'undefined') {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      return cart.length;
    }
    return 0;
  }
};

/**
 * Add item to appropriate cart:
 * - Guest users: Save to localStorage ONLY (no backend yet)
 * - Authenticated users: Save to backend database with userId
 */
export const addToCart = async (product, quantity = 1) => {
  try {
    // Check if user is authenticated first
    const profile = await API.auth.getProfile();
    
    if (profile && profile.user) {
      // ✅ AUTHENTICATED USER: Add directly to backend with userId
      try {
        const id = product.product_id || product.product_product_id || product.id;
        const result = await cartAPI.addToCart({
          productId: id,
          quantity: quantity
        });
        
        
        // Trigger cart count update
        window.dispatchEvent(new Event('storage'));
        
        return { success: true, message: 'Item added to cart', source: 'database' };
      } catch (error) {
        console.error('❌ Failed to add item to database cart:', error);
        throw error;
      }
    } else {
      if (typeof window !== 'undefined') {
        const id = product.product_id || product.product_product_id || product.id;
        
        const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
        
        // Check if product already exists in cart
        const existingIndex = existingCart.findIndex(item => 
          (item.product_id || item.product_product_id) === id
        );
        
        if (existingIndex >= 0) {
          // Update quantity
          existingCart[existingIndex].quantity += quantity;
        } else {
          // Add new item
          existingCart.push({
            ...product,
            quantity: quantity,
            addedAt: new Date().toISOString()
          });
        }
        
        localStorage.setItem('cart', JSON.stringify(existingCart));
        
        // Trigger cart count update
        window.dispatchEvent(new Event('storage'));
        
        return { success: true, message: 'Item added to guest cart', source: 'localStorage' };
      }
    }
    
    throw new Error('Failed to add item to cart');
  } catch (error) {
    console.error('❌ Error adding to cart:', error);
    throw error;
  }
};

export default {
  getOrCreateGuestSessionId,
  clearGuestSessionId,
  mergeGuestCart,
  syncCartAfterLogin,
  clearCartAfterCheckout,
  getCartCount,
  addToCart
};
