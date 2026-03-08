/**
 * Safely extracts category information from a product object
 * @param {Object} product - The product object
 * @returns {Object} - A normalized category object with fallbacks
 */
export const getSafeCategory = (product) => {
  // Default fallback category
  const defaultCategory = {
    category_id: null,
    category_name: 'Uncategorized',
    isFallback: true
  };

  if (!product) {
    console.warn('getSafeCategory called with null/undefined product');
    return defaultCategory;
  }

  try {

    // Case 1: Already has a valid category object
    if (product.category && typeof product.category === 'object') {
      return {
        ...defaultCategory,
        ...product.category,
        category_id: product.category.category_id || product.category.id || null,
        category_name: product.category.category_name || product.category.name || 'Uncategorized',
        isFallback: false
      };
    }

    // Case 2: Has direct category properties
    if (product.category_name || product.category_category_name || product.category_id) {
      return {
        ...defaultCategory,
        category_id: product.category_id || product.category_product_category_id || null,
        category_name: product.category_name || product.category_category_name || 'Uncategorized',
        isFallback: false
      };
    }

    // Case 3: Has brand category
    if (product.brandcategory?.category) {
      const brandCat = product.brandcategory.category;
      return {
        ...defaultCategory,
        category_id: brandCat.product_category_id || brandCat.id || null,
        category_name: brandCat.category_name || brandCat.name || 'Uncategorized',
        isFallback: false
      };
    }

    // Case 4: Check for any other possible category locations
    for (const key in product) {
      if (key.toLowerCase().includes('category') && product[key]) {
        if (typeof product[key] === 'object') {
          const cat = product[key];
          return {
            ...defaultCategory,
            category_id: cat.id || cat.category_id || null,
            category_name: cat.name || cat.category_name || 'Uncategorized',
            isFallback: false
          };
        } else if (typeof product[key] === 'string') {
          return {
            ...defaultCategory,
            category_name: product[key],
            isFallback: false
          };
        }
      }
    }

    console.warn('No valid category found in product, using default', { 
      productId: product.id || product.product_id,
      availableKeys: Object.keys(product) 
    });
    return defaultCategory;
  } catch (error) {
    console.error('Error in getSafeCategory:', error, { product });
    return defaultCategory;
  }
};

/**
 * Gets a category name from a product object
 * @param {Object} product - The product object
 * @returns {string} - The category name or 'Uncategorized'
 */
export const getCategoryName = (product) => {
  return getSafeCategory(product).category_name;
};

/**
 * Checks if two products are in the same category
 * @param {Object} product1 - First product
 * @param {Object} product2 - Second product
 * @returns {boolean} - True if same category
 */
export const isSameCategory = (product1, product2) => {
  if (!product1 || !product2) return false;
  const cat1 = getCategoryName(product1).toLowerCase();
  const cat2 = getCategoryName(product2).toLowerCase();
  return cat1 === cat2 && cat1 !== 'uncategorized';
};
