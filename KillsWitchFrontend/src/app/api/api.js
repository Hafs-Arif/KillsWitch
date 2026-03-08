// API endpoints
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const API = {
  BASE_URL,

  // Brands and Categories API
  brands: {
    fetchBrandsCategories: async () => {
      try {
        const response = await fetch(`${BASE_URL}/brand/categories`, { 
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) throw new Error("Failed to fetch brands");
        return response;
      } catch (error) {
        console.error("Error fetching brands:", error);
      }
    },
  },

  // Reviews API
  reviews: {
    // Get featured reviews (public - no auth required)
    getFeaturedReviews: async (limit = 10) => {
      try {
        const response = await fetch(`${BASE_URL}/reviews/featured?limit=${limit}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          credentials: 'omit'
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          throw new Error(`Failed to fetch featured reviews: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.error('Error fetching featured reviews:', error);
        throw error;
      }
    },

    // Get all reviews with optional filtering
    getAllReviews: async (filters = {}) => {
      try {
        const queryParams = new URLSearchParams();
        
        // Add filters to query params
        Object.keys(filters).forEach(key => {
          if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
            queryParams.append(key, filters[key]);
          }
        });

        const url = `${BASE_URL}/reviews${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error:", response.status, errorText);
          throw new Error(`Failed to fetch reviews: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        return result;
      } catch (error) {
        console.error("API: Error fetching reviews:", error);
        throw error;
      }
    },

    // Get reviews for a specific product
    getProductReviews: async (productId, options = {}) => {
      try {
        const queryParams = new URLSearchParams();
        
        // Add pagination and sorting options
        Object.keys(options).forEach(key => {
          if (options[key] !== undefined && options[key] !== null && options[key] !== '') {
            queryParams.append(key, options[key]);
          }
        });

        const url = `${BASE_URL}/reviews/product/${productId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        
        const response = await fetch(url, {
          method: "GET",
          credentials: 'include',
          cache: 'no-store',
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error:", response.status, errorText);
          throw new Error(`Failed to fetch product reviews: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        return result;
      } catch (error) {
        console.error("API: Error fetching product reviews:", error);
        throw error;
      }
    },

    // Create a new review (requires authentication)
    createReview: async (reviewData) => {
      try {
        // Some backends require Authorization header even with cookie sessions.
        let authHeader = {};
        if (typeof document !== 'undefined') {
          try {
            const m = document.cookie.match(/(?:^|;\s*)access_token=([^;]*)/);
            if (m && m[1]) {
              authHeader = { 'Authorization': `Bearer ${m[1]}` };
            }
          } catch (_) {}
        }
        
        // Ensure we have the required fields
        const reviewPayload = {
          productId: reviewData.productId,
          rating: reviewData.rating,
          comment: reviewData.comment || '',
          reviewer_name: reviewData.reviewer_name || 'Anonymous User',
          userId: reviewData.userId || null
        };
        
        
        const response = await fetch(`${BASE_URL}/reviews`, {
          method: "POST",
          credentials: 'include',
          headers: {
            "Content-Type": "application/json",
            ...authHeader
          },
          body: JSON.stringify(reviewPayload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error:", response.status, errorText);
          throw new Error(`Failed to create review: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        return result;
      } catch (error) {
        console.error("API: Error creating review:", error);
        throw error;
      }
    }
  },

  auth: {
    // Fetch logged-in user's profile using cookie-based session (no localStorage token)
    getProfile: async () => {
      try {
        const response = await fetch(`${BASE_URL}/auth/profile`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          // treat any unauthorized as simply no profile; avoid refresh attempts
          if (response.status === 401 || response.status === 403) {
            return null;
          }
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to fetch profile');
          }
          const text = await response.text();
          throw new Error(text || `Failed to fetch profile (status ${response.status})`);
        }

        return await response.json();
      } catch (error) {
        // Treat auth errors and network failures as unauthenticated state for consumer components
        // Only log unexpected errors
        if (
          error.message &&
          !error.message.includes('401') &&
          !error.message.includes('403') &&
          !error.message.toLowerCase().includes('failed to fetch')
        ) {
          console.error('Error fetching profile:', error);
        }
        return null;
      }
    },
    login: async (credentials) => {
      try {
        // First, make the login request
        const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(credentials)
        });

        if (!loginResponse.ok) {
          const errorData = await loginResponse.json().catch(() => ({}));
          throw new Error(errorData.message || 'Login failed');
        }

        // Get user profile after successful login (cookie-based)
        const profileResponse = await fetch(`${BASE_URL}/auth/profile`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (!profileResponse.ok) {
          const contentType = profileResponse.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await profileResponse.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to get profile. Please login again.");
          } else {
            const errorText = await profileResponse.text();
            console.error('Profile fetch error:', errorText);
            throw new Error(`Failed to get profile. Status: ${profileResponse.status}`);
          }
        }

        // Return profile data
        const profileData = await profileResponse.json();
        return profileData;
      } catch (error) {
        console.error("Login error:", error);
        throw error;
      }
    },

    updateProfile: async (data) => {
      try {
        const response = await fetch(`${BASE_URL}/auth/profile`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to update profile');
        }
        return await response.json();
      } catch (error) {
        console.error('API.auth.updateProfile error', error);
        throw error;
      }
    },

    updateProfile: async (data) => {
      try {
        const response = await fetch(`${BASE_URL}/auth/profile`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to update profile');
        }
        return await response.json();
      } catch (error) {
        console.error('API.updateProfile error', error);
        throw error;
      }
    },

    
    refreshToken: async () => {
      try {
        const response = await fetch(`${BASE_URL}/auth/refresh-token`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          // treat failure silently; caller will handle absence of refreshed token
          console.warn('refreshToken response not ok', response.status);
          return null;
        }

        return await response.json();
      } catch (error) {
        console.error('Refresh token error:', error);
        return null;
      }
    },

    logout: () => {
      return fetch(`${BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
    },

    isAuthenticated: async () => {
      try {
        await API.auth.getProfile();
        return true;
      } catch {
        return false;
      }
    },

    // Google OAuth Authentication
    googleAuth: () => {
      // Redirect to Google OAuth endpoint
      window.location.href = `${BASE_URL}/auth/google`;
    },

    // Handle Google OAuth callback (extract token from URL)
    handleGoogleCallback: () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (token) {
          // Backend already set cookies; token in URL can be ignored for cookies flow
          
          // Clean up the URL
          const url = new URL(window.location);
          url.searchParams.delete('token');
          window.history.replaceState({}, document.title, url);
          
          return token;
        }
        
        return null;
      } catch (error) {
        console.error("Google OAuth callback error:", error);
        return null;
      }
    },

    // Forgot Password APIs
    forgotPassword: async (email) => {
      // <<<<-----------------------------------------------------------------------------------done
      try {
        const response = await fetch(`${BASE_URL}/auth/forget-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        if (!response.ok) {
          const text = await response.text();
          let errMsg = `Failed to send password reset email`;
          try {
            const errorData = JSON.parse(text);
            errMsg = errorData.error || errorData.err || errorData.message || errMsg;
          } catch {
            // keep default errMsg
          }
          throw new Error(errMsg);
        }

        return await response.json();
      } catch (error) {
        console.error("Forgot password error:", error);
        throw error;
      }
    },

    verifyOtp: async (email, otp) => {
      // <<<<-----------------------------------------------------------------------------------done
      try {
        const response = await fetch(`${BASE_URL}/auth/verify-otp`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, otp }),
        });

        if (!response.ok) {
          const text = await response.text();
          let errMsg = `OTP verification failed`;
          try {
            const errorData = JSON.parse(text);
            errMsg = errorData.error || errorData.message || errMsg;
          } catch {
            // keep default errMsg
          }
          throw new Error(errMsg);
        }

        return await response.json();
      } catch (error) {
        console.error("OTP verification error:", error);
        throw error;
      }
    },

    resetPassword: async (email, newPassword) => {
      // <<<<-----------------------------------------------------------------------------------done
      try {
        const response = await fetch(`${BASE_URL}/auth/reset-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password: newPassword }),
        });

        if (!response.ok) {
          const text = await response.text();
          let errMsg = `Password reset failed`;
          try {
            const errorData = JSON.parse(text);
            errMsg = errorData.error || errorData.message || errMsg;
          } catch {
            // keep default errMsg
          }
          throw new Error(errMsg);
        }

        return await response.json();
      } catch (error) {
        console.error("Reset password error:", error);
        throw error;
      }
    },
  },

  // Addresses API
  addresses: {
    // Get all user addresses
    getAddresses: async () => {
      try {
        const response = await fetch(`${BASE_URL}/addresses`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            return null;
          }
          throw new Error(`Failed to fetch addresses`);
        }

        return await response.json();
      } catch (error) {
        console.error('Error fetching addresses:', error);
        return null;
      }
    },

    // Save or update address
    saveAddress: async (addressData) => {
      try {
        const response = await fetch(`${BASE_URL}/addresses`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(addressData)
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to save address');
        }

        return await response.json();
      } catch (error) {
        console.error('Error saving address:', error);
        throw error;
      }
    },

    // Delete address
    deleteAddress: async (addressId) => {
      try {
        const response = await fetch(`${BASE_URL}/addresses/${addressId}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to delete address');
        }

        return await response.json();
      } catch (error) {
        console.error('Error deleting address:', error);
        throw error;
      }
    },

    // Get specific address
    getAddress: async (addressId) => {
      try {
        const response = await fetch(`${BASE_URL}/addresses/${addressId}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch address');
        }

        return await response.json();
      } catch (error) {
        console.error('Error fetching address:', error);
        throw error;
      }
    },
  },
};

// API functions for fetching data
export async function fetchBrands() {
  try {
    // Check localStorage for cached brands data
    const cachedBrands = localStorage.getItem("killswitch_brands");
    const cachedTimestamp = localStorage.getItem("killswitch_brands_timestamp");

    // Use cached data if it exists and is less than 1 hour old
    if (cachedBrands && cachedTimestamp) {
      const isExpired = Date.now() - Number.parseInt(cachedTimestamp) > 3600000; // 1 hour
      if (!isExpired) {
        return JSON.parse(cachedBrands);
      } else {
        console.log("Cached brands data is expired, fetching fresh data");
      }
    }

    const response = await fetch(`${BASE_URL}/brand`, { credentials: 'include' }); // <<<<----------------------------------------------------------------done

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    // Save to localStorage with timestamp
    localStorage.setItem("killswitch_brands", JSON.stringify(data));
    localStorage.setItem("killswitch_brands_timestamp", Date.now().toString());

    return data;
  } catch (error) {
    console.error("Error fetching brands:", error);

    // Try to use cached data even if expired in case of error
    const cachedBrands = localStorage.getItem("killswitch_brands");
    if (cachedBrands) {
      return JSON.parse(cachedBrands);
    }

    return [];
  }
}

export async function fetchAllProducts(options = { force: false, ttlMs: 60000 }) {
  try {
    const { force = false, ttlMs = 60000 } = options || {};

    // Try cached data first if not forcing and within TTL
    if (!force && typeof window !== 'undefined') {
      const cached = localStorage.getItem("killswitch_products");
      const ts = localStorage.getItem("killswitch_products_timestamp");
      if (cached && ts) {
        const fresh = Date.now() - Number(ts) < ttlMs;
        if (fresh) {
          try {
            const arr = JSON.parse(cached);
            if (Array.isArray(arr)) {
              return arr;
            }
          } catch (_) {}
        }
      }
    }

    const response = await fetch(`${BASE_URL}/products`, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn('Products endpoint not found. The server might be down or the endpoint has changed.');
        return [];  // Return empty array instead of throwing error
      }
      
      const errorText = await response.text();
      console.error("Error response:", errorText);
      
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || `API request failed with status ${response.status}`;
      } catch {
        errorMessage = `API request failed with status ${response.status}`;
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const products = Array.isArray(data) ? data : [];

    // Cache the products with timestamp
    try {
      localStorage.setItem("killswitch_products", JSON.stringify(products));
      localStorage.setItem("killswitch_products_timestamp", Date.now().toString());
    } catch (storageError) {
      console.warn('Failed to cache products:', storageError);
    }

    return products;
  } catch (error) {
    // Only log unexpected errors; network failures are common when backend is offline
    if (!error.message.toLowerCase().includes('failed to fetch')) {
      console.error("Error in fetchAllProducts:", error);
    } else {
      console.log("fetchAllProducts network error, attempting cache fallback");
    }

    // Try to use cached data as fallback
    try {
      const cachedProducts = localStorage.getItem("killswitch_products");
      if (cachedProducts) {
        return JSON.parse(cachedProducts);
      }
    } catch (parseError) {
      console.error('Error parsing cached products:', parseError);
    }

    return [];
  }
}

// Enhanced product functions with new specifications
export const enhancedProductAPI = {
  // Get product with full specifications and reviews
  getProductWithSpecs: async (productId) => {
    try {
      const response = await fetch(`${BASE_URL}/products/${productId}`, { credentials: 'include' });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(`Failed to fetch product: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("API: Error fetching product with specs:", error);
      throw error;
    }
  },

  // Search products by specifications
  searchProductsBySpecs: async (searchCriteria) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add search criteria to query params
      Object.keys(searchCriteria).forEach(key => {
        if (searchCriteria[key] !== undefined && searchCriteria[key] !== null && searchCriteria[key] !== '') {
          queryParams.append(key, searchCriteria[key]);
        }
      });

      const url = `${BASE_URL}/products/search${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url, { method: "GET", credentials: 'include' });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(`Failed to search products: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("API: Error searching products:", error);
      throw error;
    }
  },

  // Get products by category with specifications
  getProductsByCategoryWithSpecs: async (categoryName, filters = {}) => {
    try {
      const allProducts = await fetchAllProducts();
      
      // Filter by category
      let categoryProducts = allProducts.filter((product) => {
        const categoryLower = categoryName.toLowerCase().trim();
        const productCategory = product.category_category_name?.toLowerCase().trim();
        return productCategory === categoryLower;
      });

      // Apply additional filters
      if (Object.keys(filters).length > 0) {
        categoryProducts = categoryProducts.filter(product => {
          return Object.keys(filters).every(filterKey => {
            const filterValue = filters[filterKey];
            const productValue = product[filterKey];
            
            if (filterValue === undefined || filterValue === null || filterValue === '') {
              return true;
            }
            
            if (typeof filterValue === 'string') {
              return productValue?.toLowerCase().includes(filterValue.toLowerCase());
            }
            
            return productValue === filterValue;
          });
        });
      }

      return categoryProducts;
    } catch (error) {
      console.error("API: Error fetching products by category with specs:", error);
      throw error;
    }
  },

  // Get products by price range
  getProductsByPriceRange: async (minPrice, maxPrice, category = null) => {
    try {
      let products = await fetchAllProducts();
      
      // Filter by category if specified
      if (category) {
        products = products.filter(product => {
          const categoryLower = category.toLowerCase().trim();
          const productCategory = product.category_category_name?.toLowerCase().trim();
          return productCategory === categoryLower;
        });
      }
      
      // Filter by price range
      const filteredProducts = products.filter(product => {
        const price = parseFloat(product.product_price);
        return price >= minPrice && price <= maxPrice;
      });

      return filteredProducts;
    } catch (error) {
      console.error("API: Error fetching products by price range:", error);
      throw error;
    }
  },
};

export async function fetchProductsByBrand(brandName) {
  // <<<<------------------------------------------------------------------------done
  try {

    // First try to get all products and filter client-side
    const allProducts = await fetchAllProducts();

    // Filter by brand name (case-insensitive and trimmed)
    return allProducts.filter((product) => {
      const brandLower = brandName.toLowerCase().trim();
      const productBrandName = product.brand_brand_name?.toLowerCase().trim();
      return productBrandName === brandLower;
    });
  } catch (error) {
    console.error(`Error fetching products for brand ${brandName}:`, error);
    return [];
  }
}

export async function fetchProductsByCategory(brandName, categoryName) {
  // <<<<------------------------------------------------------------------------done
  try {

    // First get products by brand
    const brandProducts = await fetchProductsByBrand(brandName);

    // Then filter by category (case-insensitive and trimmed)
    return brandProducts.filter((product) => {
      const categoryLower = categoryName.toLowerCase().trim();
      const productCategory = product.category_category_name
        ?.toLowerCase()
        .trim();
      return productCategory === categoryLower;
    });
  } catch (error) {
    console.error(
      `Error fetching products for brand ${brandName} and category ${categoryName}:`,
      error
    );
    return [];
  }
}

export async function fetchProductsBySubcategory(
  brandName,
  categoryName,
  subcategoryName
) {
  // <<<<---------------------------------------------------done
  try {

    // First get products by category
    const categoryProducts = await fetchProductsByCategory(
      brandName,
      categoryName
    );

    // Then filter by subcategory (case-insensitive and trimmed)
    return categoryProducts.filter((product) => {
      const subcategoryLower = subcategoryName.toLowerCase().trim();
      const productSubcategory = product.subcategory_subcategory_name
        ?.toLowerCase()
        .trim();
      return productSubcategory === subcategoryLower;
    });
  } catch (error) {
    console.error(
      `Error fetching products for subcategory ${subcategoryName}:`,
      error
    );
    return [];
  }
}

export async function fetchProductByPartNumber(brandName, partNumber) {
  // <<<<------------------------------------------------------------------------done
  try {
    // First get products by brand
    const brandProducts = await fetchProductsByBrand(brandName);

    // Then filter by part number (case-insensitive and trimmed)
    return brandProducts.filter((product) => {
      const partNumberLower = partNumber.toLowerCase().trim();
      const productPartNumber = product.product_part_number
        ?.toLowerCase()
        .trim();
      return productPartNumber === partNumberLower;
    });
  } catch (error) {
    console.error(
      `Error fetching product with part number ${partNumber}:`,
      error
    );
    return [];
  }
}

export const topProducts = async (category) => {
  try {
    // Ensure category parameter is provided
    if (!category) {
      throw new Error("Category is required for topProducts");
    }

    const headers = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };

    // Updated endpoint to use categoryName instead of category
    const response = await fetch(
      `${BASE_URL}/brand/brands?categoryName=${encodeURIComponent(category)}`,
      headers
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${category} products:`, error);
    throw error;
  }
};

//checkout api  <<<<-----------------------------------------------------------------------------------done
export async function processCheckout(checkoutData) {
  try {
    // Format the request exactly as shown in the provided example
    const formattedData = {
      // Always include all fields, even if empty
      email: checkoutData.email || "",
      password: checkoutData.password || "",
      phoneNumber: checkoutData.phoneNumber || "",
      firstName: checkoutData.firstName || "",
      amount: checkoutData.amount || "0.00",
      cardNumber: checkoutData.cardNumber || "",
      cardExpiry: checkoutData.cardExpiry || "",
      cardCVC: checkoutData.cardCVC || "",
      payment_name: checkoutData.payment_name || "",
      shippingName: checkoutData.shippingName || "",
      shippingMethod: checkoutData.shippingMethod || "",
      shippingCompany: checkoutData.shippingCompany || "",
      shippingPhone: checkoutData.shippingPhone || "",
      shippingAddress: checkoutData.shippingAddress || "",
      shippingCity: checkoutData.shippingCity || "",
      shippingState: checkoutData.shippingState || "",
      shippingCountry: checkoutData.shippingCountry || "",
      billingName: checkoutData.billingName || "",
      billingCompany: checkoutData.billingCompany || "",
      billingPhone: checkoutData.billingPhone || "",
      billingAddress: checkoutData.billingAddress || "",
      billingCity: checkoutData.billingCity || "",
      billingState: checkoutData.billingState || "",
      billingCountry: checkoutData.billingCountry || "",
      orderDetails: {
        isFullCart: false, // Hardcoded to false as requested
        items: checkoutData.orderDetails.items.map((item) => ({
          id: item.id,
          name: item.name || "",
          price: item.price || 0,
          quantity: item.quantity || 1,
          condition: item.condition || "USED",
        })),
        subtotal: checkoutData.orderDetails.subtotal || "0.00",
        shipping: checkoutData.orderDetails.shipping || "0.00",
        tax: checkoutData.orderDetails.tax || "0.00",
        total: checkoutData.orderDetails.total || "0.00",
      },
    };

    const response = await fetch(`${BASE_URL}/stripe/process-checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formattedData),
    });

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Payment failed");
      }

      return data;
    } else {
      // Handle non-JSON response (like HTML error pages)
      const textResponse = await response.text();
      console.error("Non-JSON response:", textResponse);
      throw new Error("Server returned an invalid response format");
    }
  } catch (error) {
    console.error("Checkout Error:", error);
    throw error;
  }
}

// Function to track an order by tracking number
export const trackOrder = async (email, trackingNumber) => {
  try {
    const url = `${BASE_URL}/orders/tracking?email=${email}&trackingNumber=${trackingNumber}`;
    const response = await fetch(url, { method: "GET", credentials: 'include' });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to fetch order details");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error tracking order:", error);
    throw error;
  }
};

// Function to transform order data to consistent format
export const transformOrderData = (order) => {
  return {
    orderId: order.order_id || order.orderId,
    orderstatus: order.order_status || order.orderstatus || "N/A",
    orderDate: order.created_at || order.orderDate || "N/A",
    items: order.items || [],
    shippingMethod: order.shipping_method || order.shippingMethod || "N/A",
    shippingDate: order.estimated_delivery || order.shippingDate || "N/A",
    shippingAddress: order.shipping_address || order.shippingAddress || "N/A",
    shippingPhone: order.shipping_phone || order.shippingPhone || "N/A",
    paymentMethod: order.payment_method || order.paymentMethod || "N/A",
    leadTime: order.leadtime || order.leadTime || null,
    orderPlacedBy: order.order_placed_by || order.orderPlacedBy || "",
    amountPaid:
      order.amount_paid || order.amountPaid || order.total_price || "0.00",
    subtotal: order.subtotal || "0.00",
    tax: order.tax || "0.00",
    shippingCost: order.shipping_cost || order.shippingCost || "0.00",
  };
};

// Function to get a quote
export const getQuote = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/quote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to submit quote request");
    }

    return response.json();
  } catch (error) {
    console.error("Error in getQuote:", error);
    throw error;
  }
};

// Order Management API Functions
export const orderAPI = {
  // Function to fetch all orders (admin)
  fetchAllOrders: async () => {
    try {
      const response = await fetch(`${BASE_URL}/orders`, {
        method: "GET",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching all orders:", error);
      throw error;
    }
  },

  // Function to delete an order
  deleteOrder: async (orderId) => {
    try {
      const response = await fetch(`${BASE_URL}/orders/${orderId}`, {
        method: "DELETE",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete order");
      }

      return true;
    } catch (error) {
      console.error("Error deleting order:", error);
      throw error;
    }
  },

  // Function to update order details
  updateOrder: async (orderData) => {
    try {
      const response = await fetch(`${BASE_URL}/orders/update`, {
        method: "PUT",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error("Failed to update order");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error updating order:", error);
      throw error;
    }
  },

  // Function to fetch notifications
  fetchNotifications: async () => {
    try {
      const response = await fetch(`${BASE_URL}/admin-requests`, {
        method: "GET",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  },

  // Function to update notification status
  updateNotificationStatus: async (adminRequestId, orderId, isApproved) => {
    try {
      const requestBody = {
        admin_req_id: adminRequestId,
        order_id: orderId,
        isApproved: isApproved,
      };

      const response = await fetch(`${BASE_URL}/admin-requests/updateStatus`, {
        method: "PUT",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Failed to update notification status");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error updating notification status:", error);
      throw error;
    }
  },

  // Function to get user email from profile
  getUserEmail: async () => {
    try {
      const profile = await API.auth.getProfile();
      return profile?.user?.email || profile?.email || null;
    } catch (error) {
      console.error("Error getting user email:", error);
      return null;
    }
  },

  // Function to fetch orders by email
  fetchOrdersByEmail: async () => {
    try {
      const email = await orderAPI.getUserEmail();
      if (!email) {
        throw new Error("User email not found. Please log in again.");
      }

      const url = `${BASE_URL}/orders/orderByEmail?email=${email}`;

      const response = await fetch(url, {
        method: "GET",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to fetch order details");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }
  },

  // Function to update order shipping details
  updateOrderShipping: async (orderId, shippingAddress, shippingPhone) => {
    try {
      const email = await orderAPI.getUserEmail();
      if (!email) {
        throw new Error("User email not found. Please log in again.");
      }

      const url = `${BASE_URL}/admin-requests`;

      const requestData = {
        order_id: orderId,
        user_email: email,
        updatedshippingAddress: shippingAddress,
        updatedshippingPhone: shippingPhone,
      };

      const response = await fetch(url, {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to update order");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error updating order:", error);
      throw error;
    }
  },
};

// Product Management API Functions
export const productAPI = {
  // Clear product cache function
  clearProductCache: () => {
    localStorage.removeItem("niftyorbit_products");
    localStorage.removeItem("niftyorbit_products_timestamp");
  },

  // Add product function
  addProduct: async (formData) => {
    try {
      const response = await fetch(`${BASE_URL}/products/upload`, {
        method: "POST",
        credentials: 'include',
        body: formData, // Send the FormData directly
        // Don't set Content-Type header, it will be set automatically with boundary
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        if (response.status === 401 || response.status === 403) {
          // most likely session has expired or user is not authorized
          throw new Error(
            "Your login session has expired or you are not authorized.\nPlease log in again to add/update products or upload videos."
          );
        }
        throw new Error(
          `Failed to add product: ${response.status} ${errorText}`
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("API: Error adding product:", error);
      throw error;
    }
  },

  // Update product function
  updateProduct: async (id, formData) => {
    try {
      const response = await fetch(`${BASE_URL}/products/${id}`, {
        method: "PUT",
        credentials: 'include',
        body: formData, // Send the FormData directly
        // Don't set Content-Type header, it will be set automatically with boundary
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        if (response.status === 401 || response.status === 403) {
          throw new Error(
            "Your login session has expired or you are not authorized.\nPlease log in again to add/update products or upload videos."
          );
        }
        throw new Error(
          `Failed to update product: ${response.status} ${errorText}`
        );
      }

      const result = await response.json();
      // Invalidate cached products so frontend sees updates immediately
      try {
        localStorage.removeItem("niftyorbit_products");
        localStorage.removeItem("niftyorbit_products_timestamp");
      } catch (_) {}
      return result;
    } catch (error) {
      console.error("API: Error updating product:", error);
      throw error;
    }
  },

  // Delete product function
  deleteProduct: async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/products/${id}`, {
        method: "DELETE",
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(
          `Failed to delete product: ${response.status} ${errorText}`
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("API: Error deleting product:", error);
      throw error;
    }
  },

  // Add multiple images to existing product
  addProductImages: async (productId, formData) => {
    try {
      const response = await fetch(`${BASE_URL}/products/${productId}/images`, {
        method: "POST",
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(
          `Failed to add images: ${response.status} ${errorText}`
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("API: Error adding images:", error);
      throw error;
    }
  },

  // Delete specific product image
  deleteProductImage: async (imageId) => {
    try {
      const response = await fetch(`${BASE_URL}/products/images/${imageId}`, {
        method: "DELETE",
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(
          `Failed to delete image: ${response.status} ${errorText}`
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("API: Error deleting image:", error);
      throw error;
    }
  },

  // Get product by ID with full specifications
  getProductById: async (productId) => {
    
    // First, try to get from cache if available
    const getFromCache = () => {
      if (typeof window === 'undefined') return null;
      
      try {
        const cachedProducts = localStorage.getItem("niftyorbit_products");
        if (cachedProducts) {
          const products = JSON.parse(cachedProducts);
          const cachedProduct = products.find(p => 
            p.product_product_id == productId || p.id == productId
          );
          
          if (cachedProduct) {
            // Ensure the cached product has a valid category
            if (cachedProduct && !cachedProduct.category) {
              cachedProduct.category = { 
                category_name: cachedProduct.category_category_name || 'Uncategorized',
                category_id: cachedProduct.category_id || null
              };
            }
            return cachedProduct;
          }
        }
      } catch (e) {
        console.error('Error getting product from cache:', e);
      }
      return null;
    };

    try {
      // Try to get from cache first
      const cachedProduct = getFromCache();
      if (cachedProduct) {
        return cachedProduct;
      }

      // If not in cache, fetch from API
      const response = await fetch(`${BASE_URL}/products/${productId}`, { 
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || 'Failed to fetch product';
        
        if (response.status === 401) {
          console.warn('Authentication required');
          if (typeof window !== 'undefined') {
            localStorage.setItem('redirectAfterLogin', window.location.pathname);
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }
          throw new Error('Authentication required');
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();

      // Ensure the product has a valid category structure
      if (result) {
        // Create a normalized category object
        const categoryData = {
          category_id: result.category_id || result.category_product_category_id || null,
          category_name: result.category_name || result.category_category_name || 'Uncategorized',
          ...(result.category || {})
        };
        
        // Set the normalized category on the result
        result.category = categoryData;
        
        // Ensure backward compatibility with existing code
        if (!result.category_category_name && categoryData.category_name) {
          result.category_category_name = categoryData.category_name;
        }

        // Cache the product data
        if (typeof window !== 'undefined') {
          try {
            const cachedProducts = JSON.parse(localStorage.getItem("niftyorbit_products") || "[]");
            const existingIndex = cachedProducts.findIndex(p => 
              p.product_product_id === result.product_product_id || p.id === result.product_product_id
            );
            
            if (existingIndex >= 0) {
              cachedProducts[existingIndex] = result;
            } else {
              cachedProducts.push(result);
            }
            
            localStorage.setItem("niftyorbit_products", JSON.stringify(cachedProducts));
          } catch (e) {
            console.error('Error caching product:', e);
          }
        }
      }

      return result;
    } catch (error) {
      console.error("API: Error fetching product:", error);
      
      // If we can't get the product from API, try cache one more time
      try {
        const cachedProduct = getFromCache();
        if (cachedProduct) return cachedProduct;
      } catch (e) {
        console.error('Error getting fallback from cache:', e);
      }
      
      // If all else fails, return a minimal product object to prevent crashes
      return {
        id: productId,
        name: 'Product not found',
        category: { 
          category_name: 'Uncategorized',
          category_id: null 
        },
        product_product_id: productId,
        product_image: '/placeholder-product.png',
        product_price: 0,
        product_short_description: 'This product could not be loaded.'
      };
    }
  }
};

export const reviewAPI = {
  // Get all reviews with optional filtering
  getAllReviews: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });

      const url = `${BASE_URL}/reviews${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(`Failed to fetch reviews: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("API: Error fetching reviews:", error);
      throw error;
    }
  },

  // Get reviews for a specific product
  getProductReviews: async (productId, options = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add pagination and sorting options
      Object.keys(options).forEach(key => {
        if (options[key] !== undefined && options[key] !== null && options[key] !== '') {
          queryParams.append(key, options[key]);
        }
      });

      const url = `${BASE_URL}/reviews/product/${productId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url, {
        method: "GET",
        credentials: 'include',
        cache: 'no-store',
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(`Failed to fetch product reviews: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("API: Error fetching product reviews:", error);
      throw error;
    }
  },

  // Get review statistics for a product
  getProductReviewStats: async (productId) => {
    try {
      const response = await fetch(`${BASE_URL}/reviews/stats/${productId}`, {
        method: "GET",
        credentials: 'include',
        cache: 'no-store',
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(`Failed to fetch review stats: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("API: Error fetching review stats:", error);
      throw error;
    }
  },

  // Create a new review (requires authentication)
  createReview: async (reviewData) => {
    try {
      // Some backends require Authorization header even with cookie sessions.
      let authHeader = {};
      if (typeof document !== 'undefined') {
        try {
          const m = document.cookie.match(/(?:^|;\s*)access_token=([^;]*)/);
          if (m && m[1]) {
            authHeader = { 'Authorization': `Bearer ${m[1]}` };
          }
        } catch (_) {}
      }
      
      // Ensure we have the required fields
      const reviewPayload = {
        productId: reviewData.productId,
        rating: reviewData.rating,
        comment: reviewData.comment || '',
        reviewer_name: reviewData.reviewer_name || 'Anonymous User',
        userId: reviewData.userId || null
      };
      
      
      const response = await fetch(`${BASE_URL}/reviews`, {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
          ...authHeader
        },
        body: JSON.stringify(reviewPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(`Failed to create review: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("API: Error creating review:", error);
      throw error;
    }
  },

  // Update an existing review (requires authentication)
  updateReview: async (reviewId, updateData) => {
    try {
      const response = await fetch(`${BASE_URL}/reviews/${reviewId}`, {
        method: "PUT",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(`Failed to update review: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("API: Error updating review:", error);
      throw error;
    }
  },

  // Delete a review (requires authentication)
  deleteReview: async (reviewId) => {
    try {
      const response = await fetch(`${BASE_URL}/reviews/${reviewId}`, {
        method: "DELETE",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(`Failed to delete review: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("API: Error deleting review:", error);
      throw error;
    }
  },

  // Get a single review by ID
  getReviewById: async (reviewId) => {
    try {
      const response = await fetch(`${BASE_URL}/reviews/${reviewId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(`Failed to fetch review: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("API: Error fetching review:", error);
      throw error;
    }
  },
};

// Shopping Cart API Functions
export const cartAPI = {
  // Sync localStorage cart with backend after login
  syncCartAfterLogin: async () => {
    try {
      // Get localStorage cart
      const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
      
      if (localCart.length === 0) {
        return { success: true, message: "No items to sync" };
      }

      return { success: true, message: "Cart items preserved in localStorage" };
      
      
    } catch (error) {
      console.error("API: Error syncing cart:", error);
      // Don't clear localStorage cart if sync failed
      return { success: false, error: error.message };
    }
  },

  // Clear cart after successful checkout
  clearCartAfterCheckout: async () => {
    try {
      // Clear localStorage cart
      localStorage.removeItem('cart');
      
      // Skip backend cart clearing for now to avoid authentication issues
      // TODO: Implement proper backend cart clearing when authentication is stable
      
      // Trigger cart count update
      window.dispatchEvent(new Event('storage'));
      
      return { success: true };
    } catch (error) {
      console.error("API: Error clearing cart after checkout:", error);
      return { success: false, error: error.message };
    }
  },
  // Get current cart
  getCart: async () => {
    try {
      const response = await fetch(`${BASE_URL}/cart`, {
        method: "GET",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
      });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error:", response.status, errorText);
          
          // Handle authentication errors specifically
          if (response.status === 401) {
            throw new Error(`Authentication required: ${errorText}`);
          }
          
          throw new Error(`Failed to fetch cart: ${response.status} ${errorText}`);
        }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("API: Error fetching cart:", error);
      throw error;
    }
  },

  // Get cart summary (for header/mini cart)
  getCartSummary: async () => {
    try {
      const response = await fetch(`${BASE_URL}/cart/summary`, {
        method: "GET",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(`Failed to fetch cart summary: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("API: Error fetching cart summary:", error);
      throw error;
    }
  },

  // Add item to cart
  addToCart: async (cartData) => {
    try {
      const response = await fetch(`${BASE_URL}/cart/items`, {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cartData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        
        // Handle specific authentication errors
        if (response.status === 401) {
          throw new Error("Please login to add items to cart.");
        }
        
        throw new Error(`Failed to add item to cart: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("API: Error adding item to cart:", error);
      throw error;
    }
  },

  // Update cart item
  updateCartItem: async (itemId, updateData) => {
    try {
      const response = await fetch(`${BASE_URL}/cart/items/${itemId}`, {
        method: "PUT",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(`Failed to update cart item: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("API: Error updating cart item:", error);
      throw error;
    }
  },

  // Remove item from cart
  removeFromCart: async (itemId) => {
    try {
      const response = await fetch(`${BASE_URL}/cart/items/${itemId}`, {
        method: "DELETE",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(`Failed to remove cart item: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("API: Error removing cart item:", error);
      throw error;
    }
  },

  // Clear entire cart
  clearCart: async () => {
    try {
      const response = await fetch(`${BASE_URL}/cart/clear`, {
        method: "DELETE",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(`Failed to clear cart: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("API: Error clearing cart:", error);
      throw error;
    }
  },

  // Merge guest cart with user cart
  mergeCarts: async (guestSessionId) => {
    try {
      const response = await fetch(`${BASE_URL}/cart/merge`, {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ guestSessionId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(`Failed to merge carts: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("API: Error merging carts:", error);
      throw error;
    }
  },

  // Get or create cart (for initialization)
  getOrCreateCart: async (sessionId = null) => {
    try {
      const response = await fetch(`${BASE_URL}/cart`, {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(`Failed to get or create cart: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("API: Error getting or creating cart:", error);
      throw error;
    }
  },
};

// Utility functions for better API management
export const apiUtils = {
  // Get authentication headers (cookie-based, no need for manual headers)
  getAuthHeaders: () => {
    return {
      "Content-Type": "application/json",
    };
  },

  // Check if user is authenticated and session is valid
  isAuthenticatedAndValid: async () => {
    try {
      await API.auth.getProfile();
      return true;
    } catch (error) {
      console.error("Auth validation error:", error);
      return false;
    }
  },

  // Handle authentication required errors with user-friendly messages
  handleAuthError: (error, actionName = "perform this action") => {
    if (error.message.includes("Invalid token") || 
        error.message.includes("Authorization token missing") ||
        error.message.includes("session has expired")) {
      return `Please login to ${actionName}. Your session may have expired.`;
    }
    return error.message;
  },

  // Handle API response with better error handling
  handleApiResponse: async (response) => {
    const contentType = response.headers.get("content-type");
    
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || `API request failed with status ${response.status}`);
      }
      
      return data;
    } else {
      const text = await response.text();
      
      if (!response.ok) {
        throw new Error(text || `API request failed with status ${response.status}`);
      }
      
      return { message: text };
    }
  },

  // Check if user is authenticated (async version using cookie session)
  isAuthenticated: async () => {
    try {
      await API.auth.getProfile();
      return true;
    } catch {
      return false;
    }
  },

  // Get user info from profile (cookie-based session)
  getUserFromToken: async () => {
    try {
      const profile = await API.auth.getProfile();
      return {
        id: profile?.user?.id || profile?.id,
        email: profile?.user?.email || profile?.email,
        role: profile?.user?.role || profile?.role
      };
    } catch (error) {
      console.error("Error getting user from profile:", error);
      return null;
    }
  },

  // Generate session ID for guest users
  generateSessionId: () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // Clear all cached data
  clearCache: () => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('niftyorbit_') || key.includes('cache_')) {
        localStorage.removeItem(key);
      }
    });
  },

  // Retry failed requests
  retryRequest: async (requestFn, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  },
};

// API configuration
const API_CONFIG = {
  TIMEOUT: 10000, // 10 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
};

export const enhancedApi = {
  call: async (url, options = {}, retryCount = 0) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...apiUtils.getAuthHeaders(),
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle 401 Unauthorized; do not attempt automatic logout or repeated refreshing
        if (response.status === 401 && retryCount === 0) {
          const ref = await API.auth.refreshToken();
          if (ref) {
            // retry once only
            return enhancedApi.call(url, options, retryCount + 1);
          }
          // no refresh available – surface error but avoid forcing logout here
          throw new Error('Session expired. Please login again.');
        }

        // Handle other errors
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || 'Unknown error occurred' };
        }
        
        const error = new Error(errorData.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return await response.text();
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Handle network errors and timeouts
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      
      // Retry on network errors (up to MAX_RETRIES times)
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        if (retryCount < API_CONFIG.MAX_RETRIES) {
          console.warn(`Retrying (${retryCount + 1}/${API_CONFIG.MAX_RETRIES})...`);
          await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY * (retryCount + 1)));
          return enhancedApi.call(url, options, retryCount + 1);
        }
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      console.error(`API call to ${url} failed:`, error);
      throw error;
    }
  }
};

// Chatbot API functions
export const chatbotAPI = {
  // Get welcome message
  getWelcome: async () => {
    try {
      const response = await fetch(`${BASE_URL}/chatbot/welcome`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get welcome message');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting chatbot welcome:', error);
      throw error;
    }
  },

  // Send message to chatbot
  sendMessage: async (message, sessionId, userEmail) => {
    try {
      const response = await fetch(`${BASE_URL}/chatbot/message`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          sessionId,
          userEmail
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message to chatbot');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      throw error;
    }
  },

  // Search products via chatbot
  searchProducts: async (query) => {
    try {
      const response = await fetch(`${BASE_URL}/chatbot/search?query=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to search products');
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching products via chatbot:', error);
      throw error;
    }
  },

  // Get chatbot knowledge base
  getKnowledgeBase: async () => {
    try {
      const response = await fetch(`${BASE_URL}/chatbot/knowledge-base`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get knowledge base');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting chatbot knowledge base:', error);
      throw error;
    }
  },

  // Clear conversation history
  clearHistory: async (sessionId, userEmail) => {
    try {
      const response = await fetch(`${BASE_URL}/chatbot/clear-history`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          userEmail
        })
      });

      if (!response.ok) {
        throw new Error('Failed to clear history');
      }

      return await response.json();
    } catch (error) {
      console.error('Error clearing chatbot history:', error);
      throw error;
    }
  },

  // Get conversation history
  getHistory: async (sessionId, userEmail) => {
    try {
      const response = await fetch(`${BASE_URL}/chatbot/history?sessionId=${sessionId}&userEmail=${userEmail}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get history');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting chatbot history:', error);
      throw error;
    }
  },

  // Newsletter API
  newsletter: {
    // Subscribe to newsletter
    subscribe: async (email) => {
      try {
        const response = await fetch(`${BASE_URL}/newsletter/newsletter`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to subscribe to newsletter');
        }

        return await response.json();
      } catch (error) {
        console.error('Error subscribing to newsletter:', error);
        throw error;
      }
    }
  },

};
