const { Cart, CartItem, product, brandcategory, User } = require("../models");
const { Op } = require("sequelize");

// Get or create user's or guest's active cart
exports.getOrCreateCart = async (req, res) => {
  try {
    // Allow either authenticated user or guest sessionId in body
    const userId = req.user && req.user.id ? req.user.id : null;
    const { sessionId } = req.body; // For guest users

    if (!userId && !sessionId) {
      return res.status(400).json({
        success: false,
        message: "Authentication or sessionId required",
      });
    }

    const where = { status: 'active' };
    if (userId) where.userId = userId;
    else where.sessionId = sessionId;

    let cart = await Cart.findOne({
      where,
      include: [
        {
          model: CartItem,
          as: 'items',
          include: [
            {
              model: product,
              as: 'product',
              // include entire product record plus brandcategory details and images
              include: [
                {
                  model: brandcategory,
                  as: 'brandcategory',
                  include: [
                    { model: require('../models').brand, as: 'brand' },
                    { model: require('../models').category, as: 'category' },
                    { model: require('../models').subcategory, as: 'subcategory' }
                  ]
                },
                {
                  model: require('../models').ProductImage,
                  as: 'images',
                  attributes: ['id','url']
                }
              ]
            }
          ]
        }
      ]
    });

    if (!cart) {
      cart = await Cart.create({
        userId: userId,
        sessionId: sessionId || null,
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });
    }

    // Calculate totals
    await cart.calculateTotals();

    // Normalize items to include frontend-friendly product_* fields
    const cartJson = cart.toJSON ? cart.toJSON() : cart;
    const normalizedItems = (cartJson.items || []).map(ci => {
      const prod = ci.product || ci.productSnapshot || {};
      return {
        id: ci.id,
        cartId: ci.cartId,
        productId: ci.productId,
        quantity: ci.quantity,
        price: ci.price,
        totalPrice: ci.totalPrice,
        notes: ci.notes,
        createdAt: ci.createdAt,
        updatedAt: ci.updatedAt,
        product_product_id: prod.product_id || ci.productId,
        product_part_number: prod.part_number || prod.part_number || (prod.product_part_number || null),
        product_image: prod.image || prod.product_image || (prod.product_image_url || null),
        product_images: Array.isArray(prod.images) ? prod.images.map(i => i.url).filter(Boolean) : [],
        video_url: prod.video_url || prod.videoUrl || null,
        product_price: prod.price || ci.price,
        product_short_description: prod.short_description || prod.product_short_description || null,
        product_long_description: prod.long_description || prod.long_description || null,
        product_condition: prod.condition || null,
        product_sub_condition: prod.sub_condition || null,
        product_status: prod.status || null,
        slug: prod.slug || null,
        product: prod
      };
    });

    cartJson.items = normalizedItems;

    res.json({
      success: true,
      data: cartJson
    });
  } catch (error) {
    console.error("Get or create cart error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  }
};

// Add item to cart (supports authenticated user or guest via sessionId)
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user && req.user.id ? req.user.id : null;
    const { sessionId, productId, quantity = 1, notes } = req.body;

    console.log('🛒 Add to cart request:', { userId, sessionId, productId, quantity });

    // Validate input
    if (!productId || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Product ID and valid quantity are required"
      });
    }

    // Check if product exists and is available
    const productData = await product.findByPk(productId);
    console.log('📦 Product lookup result:', { 
      found: !!productData, 
      productId,
      status: productData?.status,
      quantity: productData?.quantity 
    });
    
    if (!productData) {
      console.warn('❌ Product not found:', productId);
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    if (productData.status !== 'active') {
      console.warn('❌ Product not available:', { productId, status: productData.status });
      console.warn('📌 Note: Checking if product should be made available. Status values in DB might not be standardized.');
      // For now, allow products even if status is not exactly 'active'
      // This is a temporary measure - ideally all products should have status='active'
      if (!productData.status) {
        console.warn('⚠️ Product status is NULL/undefined - this might be a data issue');
        // Allow it to proceed anyway
      }
      // Uncomment the next line to strictly enforce status='active'
      // return res.status(400).json({ success: false, message: "Product is not available for purchase" });
    }

    if (productData.quantity < quantity) {
      console.warn('❌ Insufficient stock:', { productId, available: productData.quantity, requested: quantity });
      // Allow adding to cart anyway - order validation can happen at checkout
      console.log('📌 Note: Allowing cart addition despite stock warning');
      // Uncomment next line to enforce strict stock checking
      // return res.status(400).json({ success: false, message: `Only ${productData.quantity} items available in stock` });
    }

    // Get or create cart (by userId or sessionId)
    let cart;
    if (userId) {
      cart = await Cart.findOne({ where: { userId: userId, status: 'active' } });
    } else {
      if (!sessionId) {
        return res.status(400).json({ success: false, message: 'sessionId is required for guest cart' });
      }
      cart = await Cart.findOne({ where: { sessionId: sessionId, status: 'active' } });
    }

    if (!cart) {
      cart = await Cart.create({
        userId: userId,
        sessionId: sessionId || null,
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    }

    // Check if item already exists in cart
    let cartItem = await CartItem.findOne({
      where: {
        cartId: cart.id,
        productId: productId
      }
    });

    if (cartItem) {
      // Update existing item
      const newQuantity = cartItem.quantity + quantity;
      if (newQuantity > productData.quantity) {
        return res.status(400).json({
          success: false,
          message: `Cannot add ${quantity} more items. Only ${productData.quantity - cartItem.quantity} available`
        });
      }
      
      await cartItem.updateQuantity(newQuantity);
      if (notes) cartItem.notes = notes;
      await cartItem.save();
    } else {
      // Create new cart item - ensure totalPrice is provided (fallback computed in model hooks)
      const price = productData.price || 0;
      const totalPrice = Number(quantity) * Number(price);
      cartItem = await CartItem.create({
        cartId: cart.id,
        productId: productId,
        quantity: quantity,
        price: price,
        totalPrice: totalPrice,
        notes: notes
      });
    }

    // Recalculate cart totals
    await cart.calculateTotals();

    // Fetch updated cart with items
    const updatedCart = await Cart.findByPk(cart.id, {
      include: [
        {
          model: CartItem,
          as: 'items',
          include: [
            {
              model: product,
              as: 'product',
              attributes: ['product_id', 'part_number', 'short_description', 'image', 'price', 'status', 'quantity']
            }
          ]
        }
      ]
    });

    // Normalize updated cart items for frontend
    const updatedJson = updatedCart.toJSON ? updatedCart.toJSON() : updatedCart;
    const normalizedUpdatedItems = (updatedJson.items || []).map(ci => {
      const prod = ci.product || ci.productSnapshot || {};
      return {
        id: ci.id,
        cartId: ci.cartId,
        productId: ci.productId,
        quantity: ci.quantity,
        price: ci.price,
        totalPrice: ci.totalPrice,
        notes: ci.notes,
        createdAt: ci.createdAt,
        updatedAt: ci.updatedAt,
        product_product_id: prod.product_id || ci.productId,
        product_part_number: prod.part_number || prod.part_number || (prod.product_part_number || null),
        product_image: prod.image || prod.product_image || (prod.product_image_url || null),
        product_images: Array.isArray(prod.images) ? prod.images.map(i => i.url).filter(Boolean) : [],
        video_url: prod.video_url || prod.videoUrl || null,
        product_price: prod.price || ci.price,
        product_short_description: prod.short_description || prod.product_short_description || null,
        product_long_description: prod.long_description || prod.long_description || null,
        product_condition: prod.condition || null,
        product_sub_condition: prod.sub_condition || null,
        product_status: prod.status || null,
        slug: prod.slug || null,
        product: prod
      };
    });

    updatedJson.items = normalizedUpdatedItems;
    updatedJson.items = updatedJson.items.map(item => ({
      ...item,
      category_category_name: item.category_category_name || item.product?.category?.category_name || item.product?.brandcategory?.category?.category_name || null,
      brand_name: item.brand_name || item.product?.brandcategory?.brand?.brand_name || null
    }));

    res.json({
      success: true,
      message: "Item added to cart successfully",
      data: updatedJson
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    const { quantity, notes } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Valid quantity is required"
      });
    }

    // Find cart item
    const cartItem = await CartItem.findOne({
      where: {
        id: itemId
      },
      include: [
        {
          model: Cart,
          as: 'cart',
          where: {
            userId: userId,
            status: 'active'
          }
        },
        {
          model: product,
          as: 'product'
        }
      ]
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found"
      });
    }

    // Check stock availability
    if (quantity > cartItem.product.quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${cartItem.product.quantity} items available in stock`
      });
    }

    // Update quantity
    await cartItem.updateQuantity(quantity);
    if (notes !== undefined) {
      cartItem.notes = notes;
      await cartItem.save();
    }

    // Recalculate cart totals
    await cartItem.cart.calculateTotals();

    res.json({
      success: true,
      message: "Cart item updated successfully",
      data: cartItem
    });
  } catch (error) {
    console.error("Update cart item error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;

    // Find cart item
    const cartItem = await CartItem.findOne({
      where: {
        id: itemId
      },
      include: [
        {
          model: Cart,
          as: 'cart',
          where: {
            userId: userId,
            status: 'active'
          }
        }
      ]
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found"
      });
    }

    const cartId = cartItem.cartId;
    await cartItem.destroy();

    // Recalculate cart totals
    const cart = await Cart.findByPk(cartId);
    await cart.calculateTotals();

    res.json({
      success: true,
      message: "Item removed from cart successfully"
    });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  }
};

// Get cart contents
exports.getCart = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        error: "User not authenticated"
      });
    }

    const userId = req.user.id;

    const cart = await Cart.findOne({
      where: {
        userId: userId,
        status: 'active'
      },
      include: [
        {
          model: CartItem,
          as: 'items',
          include: [
            {
              model: product,
              as: 'product',
              include: [
                {
                  model: brandcategory,
                  as: 'brandcategory',
                  include: [
                    { model: require('../models').brand, as: 'brand' },
                    { model: require('../models').category, as: 'category' },
                    { model: require('../models').subcategory, as: 'subcategory' }
                  ]
                },
                {
                  model: require('../models').ProductImage,
                  as: 'images',
                  attributes: ['id','url']
                }
              ]
            }
          ]
        }
      ]
    });

    if (!cart) {
      return res.json({
        success: true,
        data: {
          id: null,
          totalItems: 0,
          totalAmount: 0,
          items: []
        }
      });
    }

    // Recalculate totals
    await cart.calculateTotals();

    // normalize items
    const cartJson = cart.toJSON ? cart.toJSON() : cart;
    const normalizedItems = (cartJson.items || []).map(ci => {
      const prod = ci.product || ci.productSnapshot || {};
      return {
        id: ci.id,
        cartId: ci.cartId,
        productId: ci.productId,
        quantity: ci.quantity,
        price: ci.price,
        totalPrice: ci.totalPrice,
        notes: ci.notes,
        createdAt: ci.createdAt,
        updatedAt: ci.updatedAt,
        product_product_id: prod.product_id || ci.productId,
        product_part_number: prod.part_number || prod.part_number || (prod.product_part_number || null),
        product_image: prod.image || prod.product_image || (prod.product_image_url || null),
        product_images: Array.isArray(prod.images) ? prod.images.map(i => i.url).filter(Boolean) : [],
        video_url: prod.video_url || prod.videoUrl || null,
        product_price: prod.price || ci.price,
        sale_price: prod.sale_price || null,
        slug: prod.slug || null,
        product_short_description: prod.short_description || prod.product_short_description || null,
        product_long_description: prod.long_description || prod.long_description || null,
        product_condition: prod.condition || null,
        product_sub_condition: prod.sub_condition || null,
        product_status: prod.status || null,
        product: prod
      };
    });
    cartJson.items = normalizedItems;
    cartJson.items = cartJson.items.map(item => ({
      ...item,
      category_category_name: item.category_category_name || item.product?.category?.category_name || item.product?.brandcategory?.category?.category_name || null,
      brand_name: item.brand_name || item.product?.brandcategory?.brand?.brand_name || null
    }));

    res.json({
      success: true,
      data: cartJson
    });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  }
};

// Clear entire cart
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({
      where: {
        userId: userId,
        status: 'active'
      }
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    await cart.clear();

    res.json({
      success: true,
      message: "Cart cleared successfully"
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  }
};

// Get cart summary (for header/mini cart)
exports.getCartSummary = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        error: "User not authenticated"
      });
    }

    const userId = req.user.id;

    const cart = await Cart.findOne({
      where: {
        userId: userId,
        status: 'active'
      },
      include: [
        {
          model: CartItem,
          as: 'items',
          attributes: ['id', 'quantity', 'price', 'totalPrice'],
          include: [
            {
              model: product,
              as: 'product',
              attributes: ['product_id', 'part_number', 'short_description', 'image']
            }
          ]
        }
      ]
    });

    if (!cart) {
      return res.json({
        success: true,
        data: {
          totalItems: 0,
          totalAmount: 0,
          items: []
        }
      });
    }

    // Recalculate totals
    await cart.calculateTotals();

    res.json({
      success: true,
      data: {
        totalItems: cart.totalItems,
        totalAmount: cart.totalAmount,
        items: cart.items.slice(0, 3), // Show only first 3 items for summary
        hasMore: cart.items.length > 3
      }
    });
  } catch (error) {
    console.error("Get cart summary error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  }
};

// Merge guest cart with user cart (for login)
exports.mergeCarts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { guestSessionId } = req.body;

    if (!guestSessionId) {
      return res.status(400).json({
        success: false,
        message: "Guest session ID is required"
      });
    }

    // Find guest cart
    const guestCart = await Cart.findOne({
      where: {
        sessionId: guestSessionId,
        status: 'active'
      },
      include: [
        {
          model: CartItem,
          as: 'items'
        }
      ]
    });

    if (!guestCart || guestCart.items.length === 0) {
      return res.json({
        success: true,
        message: "No guest cart items to merge"
      });
    }

    // Find or create user cart
    let userCart = await Cart.findOne({
      where: {
        userId: userId,
        status: 'active'
      }
    });

    if (!userCart) {
      userCart = await Cart.create({
        userId: userId,
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    }

    // Merge items
    for (const guestItem of guestCart.items) {
      const existingItem = await CartItem.findOne({
        where: {
          cartId: userCart.id,
          productId: guestItem.productId
        }
      });

      if (existingItem) {
        // Update quantity
        await existingItem.increaseQuantity(guestItem.quantity);
      } else {
        // Create new item
        await CartItem.create({
          cartId: userCart.id,
          productId: guestItem.productId,
          quantity: guestItem.quantity,
          price: guestItem.price,
          notes: guestItem.notes
        });
      }
    }

    // Clear guest cart
    await guestCart.clear();
    await guestCart.destroy();

    // Recalculate user cart totals
    await userCart.calculateTotals();

    res.json({
      success: true,
      message: "Carts merged successfully",
      data: userCart
    });
  } catch (error) {
    console.error("Merge carts error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  }
};
