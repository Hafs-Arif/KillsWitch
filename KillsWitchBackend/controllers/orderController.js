// controllers/orderController.js
const {
  User,
  Shipment,
  Payment,
  Order,
  OrderItem,
  Cart,
  ActivityLog,
  product,
  ProductImage,
  brandcategory,
  brand,
  category,
  subcategory,
  Address,
  Coupon,
} = require("../models"); // Import models
const { Op } = require("sequelize"); // Import Sequelize operators
const bcrypt = require("bcrypt");
const PDFDocument = require('pdfkit');
const { sendEmail } = require("../utils/email");
const { orderConfirmationTemplate, orderStatusUpdateTemplate } = require("../utils/emailTemplates");

// Checkout controller method (with secure coupon handling)
const checkout = async (req, res, next) => {
  try {
    console.log('=== CHECKOUT REQUEST ===');
    console.log('Payment method:', req.body.payment_method);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Order details:', req.body.orderDetails);
    
    // Validate required fields
    if (!req.body.email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    
    if (!req.body.orderDetails || !req.body.orderDetails.items || req.body.orderDetails.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order items are required' });
    }
    
    // Find or create the user
    let user = await User.findOne({ where: { email: req.body.email } });

    if (!user) {
      const hashedpass = await bcrypt.hash(req.body.password, 10);
      user = await User.create({
        name: req.body.name,
        phoneno: req.body.phoneNumber,
        email: req.body.email,
        password: hashedpass,
      });
    }
    console.log(`User created: ${user.name}`);

    // Create shipment record
    const shipment = await Shipment.create({
      shippingAddress: req.body.shippingAddress,
      shippingCity: req.body.shippingCity,
      shippingCountry: req.body.shippingCountry,
      shippingState: req.body.shippingState,
      shippingCompany: req.body.shippingCompany,
      shippingPhone: req.body.shippingPhone,
      shippingName: req.body.shippingName,
      billingName: req.body.billingName,
      billingAddress: req.body.billingAddress,
      billingCity: req.body.billingCity,
      billingState: req.body.billingState,
      billingCompany: req.body.billingCompany,
      billingPhone: req.body.billingPhone,
      billingCountry: req.body.billingCountry,
    });

    // ===== SECURE TOTALS RE-CALC (includes coupon) =====
    const orderDetails = req.body.orderDetails || {};
    const itemsForCalc = (orderDetails.items || []).map((i) => {
      // use effective_price if provided (handles sale prices), else sale_price, else price
      const effectivePrice = Number(i.effective_price) || Number(i.sale_price) || Number(i.price) || 0;
      return {
        price: Number(i.price) || 0,
        effective_price: effectivePrice,
        quantity: Number(i.quantity) || 1,
      };
    });

    const computedSubtotal = itemsForCalc.reduce(
      (sum, it) => sum + it.effective_price * it.quantity,
      0
    );

    const shippingCost = Number(orderDetails.shipping) || 0;
    const taxRate = 0.2; // keep same as frontend

    // coupon lookup and validation
    let appliedCoupon = null;
    let discount = 0;

    if (orderDetails.couponCode) {
      const code = orderDetails.couponCode.toString().trim().toUpperCase();
      appliedCoupon = await Coupon.findOne({ where: { code, is_active: true } });
      if (appliedCoupon) {
        const now = new Date();
        if (
          (appliedCoupon.expires_at && new Date(appliedCoupon.expires_at) < now) ||
          (appliedCoupon.min_purchase_amount && computedSubtotal < appliedCoupon.min_purchase_amount) ||
          (appliedCoupon.max_uses && appliedCoupon.uses_count >= appliedCoupon.max_uses)
        ) {
          // coupon no longer valid
          appliedCoupon = null;
        }
      }

      if (appliedCoupon) {
        if (appliedCoupon.discount_type === 'percentage') {
          discount = +(computedSubtotal * (appliedCoupon.discount_value / 100)).toFixed(2);
        } else {
          discount = +appliedCoupon.discount_value;
        }
        discount = Math.min(discount, computedSubtotal);
      }
    }

    const taxableBase = Math.max(0, computedSubtotal - discount);
    const tax = +(taxableBase * taxRate).toFixed(2);
    const computedTotal = +(taxableBase + shippingCost + tax).toFixed(2);

    // Process payment (use computedTotal, do not trust client)
    // Handle different payment methods including COD
    const paymentMethod = req.body.payment_method || "card";
    
    let paymentData = {
      userId: user.id,
      payment_method: paymentMethod,
      payment_name: req.body.payment_name || (paymentMethod === "cod" ? "Cash on Delivery" : "Card Payment"),
      amount: computedTotal,
    };
    
    // Add card details for non-COD payments, null for COD
    if (paymentMethod !== "cod") {
      paymentData.card_number = req.body.cardNumber;
      paymentData.cardCVC = req.body.cardCVC;
      paymentData.cardExpire = req.body.cardExpiry;
    } else {
      // Set default values for COD payments (database doesn't allow null)
      paymentData.card_number = "COD";
      paymentData.cardCVC = "000";
      paymentData.cardExpire = "00/00";
    }
    
    // Prepare cart items (use request items but totals are from server calc)
    const cartItems = (orderDetails.items || []).map((item) => {
      // use effective_price (sale price) if available, else regular price
      const chargedPrice = Number(item.effective_price) || Number(item.sale_price) || Number(item.price) || 0;
      return {
        product_id: item.id,
        quantity: item.quantity,
        price: chargedPrice,
        condition: item.condition,
      };
    });
    
    // VALIDATE STOCK AVAILABILITY BEFORE CREATING ANY RECORDS
    console.log('Validating stock for items:', cartItems);
    for (const item of cartItems) {
      const products = await product.findOne({
        where: { product_id: item.product_id },
      });

      if (!products) {
        return res.status(400).json({ 
          success: false, 
          message: `Product with ID ${item.product_id} not found`,
          error: `Product ${item.product_id} not found` 
        });
      }
      
      console.log(`Product ${item.product_id}: Available=${products.quantity}, Requested=${item.quantity}`);
      
      if (products.quantity < item.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for product ${products.product_name || item.product_id}. Available: ${products.quantity}, Requested: ${item.quantity}`,
          error: `Not enough stock for product: ${item.product_id}`,
          productName: products.product_name,
          availableStock: products.quantity,
          requestedQuantity: item.quantity
        });
      }
    }
    console.log('Stock validation passed for all items');
    
    console.log('Creating payment with data:', paymentData);
    const payment = await Payment.create(paymentData);
    console.log(`Payment created successfully: ${payment.payment_id}, amount: ${payment.amount}`);

    // Create order with appropriate status based on payment method
    const orderStatus = paymentMethod === "cod" ? "COD_PENDING" : "PENDING";
    
    // Generate unique order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const order = await Order.create({
      userId: user.id,
      orderId: orderId,
      email: user.email,
      amount: computedTotal,
      order_status: orderStatus,
      shipment_id: shipment.shipment_id,
      subtotal: computedSubtotal,
      shipping_cost: shippingCost,
      tax,
      total_price: computedTotal,
      discount,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      payment_id: payment.payment_id,
      // Add shipping and billing information directly to order
      shippingName: req.body.shippingName,
      shippingMethod: req.body.shippingMethod,
      shippingCompany: req.body.shippingCompany,
      shippingPhone: req.body.shippingPhone,
      shippingAddress: req.body.shippingAddress,
      shippingCity: req.body.shippingCity,
      shippingState: req.body.shippingState,
      shippingCountry: req.body.shippingCountry,
      billingName: req.body.billingName,
      billingCompany: req.body.billingCompany,
      billingPhone: req.body.billingPhone,
      billingAddress: req.body.billingAddress,
      billingCity: req.body.billingCity,
      billingState: req.body.billingState,
      billingCountry: req.body.billingCountry,
    });

    // if a coupon was applied, increment its usage counter
    if (appliedCoupon) {
      appliedCoupon.uses_count = (appliedCoupon.uses_count || 0) + 1;
      try {
        await appliedCoupon.save();
      } catch (err) {
        console.warn('Failed to increment coupon uses_count:', err);
      }
    }

    console.log(`Order created: ${order.order_id}`);

    // Save shipping and billing addresses to Address table (linked to userId)
    try {
      // Save shipping address
      if (req.body.shippingName && req.body.shippingAddress) {
        await Address.create({
          userId: user.id,
          type: 'shipping',
          name: req.body.shippingName,
          company: req.body.shippingCompany || '',
          phone: req.body.shippingPhone,
          address: req.body.shippingAddress,
          city: req.body.shippingCity,
          state: req.body.shippingState,
          country: req.body.shippingCountry,
          email: user.email,
          isDefault: false,
        });
        console.log(`Shipping address saved for user ${user.id}`);
      }

      // Save billing address if different from shipping
      if (req.body.billingName && req.body.billingAddress) {
        await Address.create({
          userId: user.id,
          type: 'billing',
          name: req.body.billingName,
          company: req.body.billingCompany || '',
          phone: req.body.billingPhone,
          address: req.body.billingAddress,
          city: req.body.billingCity,
          state: req.body.billingState,
          country: req.body.billingCountry,
          email: user.email,
          isDefault: false,
        });
        console.log(`Billing address saved for user ${user.id}`);
      }
    } catch (addressError) {
      console.error('Error saving addresses:', addressError);
      // Don't fail the order if address save fails
    }

    // Create order items and update product stock (stock already validated)
    for (const item of cartItems) {
      // Get product again to reduce stock (we already validated availability)
      const products = await product.findOne({
        where: { product_id: item.product_id },
      });

      // Reduce stock (no need to check again, already validated)
      products.quantity -= item.quantity;
      await products.save();
      console.log(`Reduced stock for product ${item.product_id}: ${products.quantity + item.quantity} -> ${products.quantity}`);

      // Create order item
      await OrderItem.create({
        orderId: order.order_id,
        productId: item.product_id,
        productName: products.product_name || products.product_part_number || `Product ${item.product_id}`,
        quantity: item.quantity,
        price: item.price,
        condition: item.condition,
      });
      console.log(`Order Item created for product ${item.product_id}`);
    }

    // Log activity (include coupon + discount details)
    await ActivityLog.create({
      user_email: user.email,
      order_id: order.order_id,
      activity: "Order created",
      details: {
        order_id: order.order_id,
        email: user.email,
        phoneNumber: user.phoneno,
        firstName: user.first_name,
        amount: order.total_price,
        shippingName: shipment.shippingName,
        shippingPhone: shipment.shippingPhone,
        shippingAddress: shipment.shippingAddress,
        shippingCity: shipment.shippingCity,
        shippingState: shipment.shippingState,
        shippingCountry: shipment.shippingCountry,
        billingName: shipment.billingName,
        billingCompany: shipment.billingCompany,
        billingPhone: shipment.billingPhone,
        billingAddress: shipment.billingAddress,
        billingCity: shipment.billingCity,
        billingState: shipment.billingState,
        billingCountry: shipment.billingCountry,
        orderDetails: {
          items: cartItems,
          subtotal: order.subtotal,
          shipping: order.shipping_cost,
          discount,
          couponCode: appliedCoupon ? appliedCoupon.code : "",
          tax: order.tax,
          total: order.total_price,
        },
      },
    });

    // Generate a more realistic tracking number
    const generateTrackingNumber = () => {
      const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
      return `TRK${timestamp}${random}`;
    };

    const trackingNumber = generateTrackingNumber();

    // Update the order with the tracking number
    await order.update({ trackingNumber: trackingNumber });

    // Calculate user's order number (sequential for this user)
    const userOrderCount = await Order.count({ where: { userId: user.id } });
    const userOrderNumber = userOrderCount;

    // Send confirmation email to user
    try {
      const orderItems = await OrderItem.findAll({
        where: { orderId: order.order_id },
        include: [{ model: product, as: 'product' }]
      });
      const items = orderItems.map(item => ({
        name: item.product?.name || item.productName || 'Product',
        quantity: item.quantity,
        price: item.price
      }));
      const { subject, html } = orderConfirmationTemplate({
        order: {
          orderId: userOrderNumber, // Use user-specific order number
          subtotal: order.subtotal,
          shipping_cost: order.shipping_cost,
          tax: order.tax,
          total_price: order.total_price,
          shippingName: shipment.shippingName,
          shippingAddress: shipment.shippingAddress,
          shippingCity: shipment.shippingCity,
          shippingState: shipment.shippingState,
          shippingCountry: shipment.shippingCountry,
          shippingPhone: shipment.shippingPhone,
          shippingMethod: order.shippingMethod,
          trackingNumber: trackingNumber
        },
        items
      });
      await sendEmail(null, user.email, subject, html);

      // Send notification to admin
      const adminEmail = process.env.ADMIN_EMAIL || 'contact@killswitch.us';
      await sendEmail(null, adminEmail, `New Order Received #${order.order_id}`, `<p>A new order has been placed by ${user.email}.</p><p>User Order #: ${userOrderNumber}</p><p>System Order ID: ${order.order_id}</p><p>Total: $${order.total_price}</p><p>Tracking: ${trackingNumber}</p>`);
    } catch (emailError) {
      console.error('Error sending order confirmation email:', emailError);
    }

    // Respond with order details (reflect secure totals + coupon)
    return res.status(201).json({

      trackingNumber: trackingNumber,
      email: user.email,
      phoneNumber: user.phoneno,
      Name: user.first_name,
      amount: order.total_price,
      cardExpiry: payment.cardExpire,
      AmountPaidBy: payment.payment_name,
      shippingDetails: shipment,
      billingDetails: shipment,
      paymentMethod: payment.payment_method,
      orderDetails: {
        items: cartItems,
        subtotal: order.subtotal,
        shipping: order.shipping_cost,
        discount,
        couponCode: appliedCoupon ? appliedCoupon.code : "",
        tax: order.tax,
        total: order.total_price,
      },
    });
  } catch (error) {
    console.error('Checkout error:', error);
    
    // Return JSON error response instead of HTML
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process checkout',
      error: process.env.NODE_ENV === 'development' ? error.stack : 'Internal server error'
    });
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: Shipment,
          as: "shipment",
          required: false, // LEFT JOIN instead of INNER JOIN
        },
        {
          model: User,
          as: "user",
          required: false,
        },
        {
          model: Payment,
          as: "payment",
          required: false,
        },
        {
          model: OrderItem,
          as: "orderItem",
          required: false,
          include: [
            {
              model: product,
              as: "product",
              required: false,
              include: [
                {
                  model: ProductImage,
                  as: "images",
                  attributes: ["id", "url"],
                  required: false
                },
                {
                  model: brandcategory,
                  as: "brandcategory",
                  required: false,
                  include: [
                    {
                      model: brand,
                      as: "brand",
                      attributes: ["brand_id", "brand_name"],
                      required: false
                    },
                    {
                      model: category,
                      as: "category",
                      attributes: ["product_category_id", "category_name"],
                      required: false
                    },
                    {
                      model: subcategory,
                      as: "subcategory",
                      attributes: ["sub_category_id", "sub_category_name"],
                      required: false
                    }
                  ]
                }
              ]
            }
          ]
        },
      ],
    });

    const formattedOrders = orders.map((order) => {
      const shipment = order.shipment;
      const user = order.user;
      const payment = order.payment;
      const items = order.orderItem;
      console.log("Order data:", { shipment, payment, user });

      return {
        orderId: order.order_id,
        order_id: order.order_id, // Add both formats for compatibility
        order_status: order.order_status,
        created_at: order.createdAt,
        email: user?.email ?? null,
        phoneNumber: user?.phoneno ?? null,
        Name: user?.name ?? null,
        amount: order.total_price,
        total_price: order.total_price, // Add both formats
        cardExpiry: payment?.cardExpire ?? null,
        AmountPaidBy: payment?.payment_name ?? null,
        paymentMethod: payment?.payment_method ?? "Card Payment",

        // Use order fields directly if shipment is null
        shippingName: shipment?.shippingName ?? order.shippingName ?? null,
        shippingCompany:
          shipment?.shippingCompany ?? order.shippingCompany ?? null,
        shippingPhone: shipment?.shippingPhone ?? order.shippingPhone ?? null,
        shippingAddress:
          shipment?.shippingAddress ?? order.shippingAddress ?? null,
        shippingCity: shipment?.shippingCity ?? order.shippingCity ?? null,
        shippingState: shipment?.shippingState ?? order.shippingState ?? null,
        shippingCountry:
          shipment?.shippingCountry ?? order.shippingCountry ?? null,
        shippingMethod:
          shipment?.shippingMethod ?? order.shippingMethod ?? null,
        shippingDate: shipment?.shippingDate ?? null,

        // Billing Details
        billingName: shipment?.billingName ?? order.billingName ?? null,
        billingCompany:
          shipment?.billingCompany ?? order.billingCompany ?? null,
        billingPhone: shipment?.billingPhone ?? order.billingPhone ?? null,
        billingAddress:
          shipment?.billingAddress ?? order.billingAddress ?? null,
        billingCity: shipment?.billingCity ?? order.billingCity ?? null,
        billingState: shipment?.billingState ?? order.billingState ?? null,
        billingCountry:
          shipment?.billingCountry ?? order.billingCountry ?? null,

        // Lead time
        leadtime: order.leadtime,
        leadTime: order.leadtime, // Add both formats

        // include tracking number for frontend display
        trackingNumber: order.trackingNumber || order.order_id,

        // Order Details
        orderDetails: {
          items: items ? items.map(item => {
            const productData = item.product;
            return {
              // Order item details
              order_item_id: item.order_item_id,
              quantity: item.quantity,
              condition: item.condition,
              price: item.price,
              unit_price: item.price,
              
              // Product details
              id: productData?.product_id,
              product_id: productData?.product_id,
              product_name: item.productName || productData?.part_number,
              name: item.productName || productData?.part_number,
              item: item.productName || productData?.part_number,
              
              // Part number with multiple field names for compatibility
              part_number: productData?.part_number,
              product_part_number: productData?.part_number,
              partNumber: productData?.part_number,
              productPartNumber: productData?.part_number,
              sku: productData?.part_number,
              product_code: productData?.part_number,
              productCode: productData?.part_number,
              
              // Product images - Cloudinary URLs
              product_image_url: productData?.image, // Main image from product table
              image_url: productData?.image,
              image: productData?.image,
              product_image: productData?.image,
              productImage: productData?.image,
              
              // Additional images from ProductImage table
              product_images: productData?.images || [],
              images: productData?.images || [],
              additional_images: productData?.images?.map(img => img.url) || [],
              
              // Brand information
              brand: productData?.brandcategory?.brand?.brand_name,
              brand_name: productData?.brandcategory?.brand?.brand_name,
              brandName: productData?.brandcategory?.brand?.brand_name,
              product_brand: productData?.brandcategory?.brand?.brand_name,
              manufacturer: productData?.brandcategory?.brand?.brand_name,
              
              // Category information
              category: productData?.brandcategory?.category?.category_name,
              category_name: productData?.brandcategory?.category?.category_name,
              categoryName: productData?.brandcategory?.category?.category_name,
              product_category: productData?.brandcategory?.category?.category_name,
              type: productData?.brandcategory?.category?.category_name,
              
              // Product specifications
              specifications: productData?.long_description,
              specs: productData?.long_description,
              product_specifications: productData?.long_description,
              technical_specs: productData?.long_description,
              features: productData?.long_description,
              
              // Product description
              description: productData?.short_description,
              product_description: productData?.short_description,
              details: productData?.short_description,
              summary: productData?.short_description,
              
              // Product condition
              product_condition: productData?.condition,
              product_sub_condition: productData?.sub_condition,
              
              // Product status
              status: productData?.status,
              product_status: productData?.status,
            };
          }) : [],
          subtotal: order.subtotal,
          shipping: order.shipping_cost,
          tax: order.tax,
          total: order.total_price,
        },
        // Coupon and discount info at root level for easy access
        couponCode: order.couponCode,
        discount: order.discount,
      };
    });

    return res.status(200).json(formattedOrders);
  } catch (error) {
    console.error("Error in getAllOrders:", error);
    next(error);
  }
};

// Track a single order's progress by email + numeric orderId (from your DB)
const trackProgress = async (req, res) => {
  try {
    const emailRaw = (req.query.email || "").trim();
    const orderIdRaw = (req.query.orderId || "").toString().trim();

    if (!emailRaw || !orderIdRaw) {
      return res
        .status(400)
        .json({ message: "Email and orderId are required" });
    }

    // order_id in your DB is numeric; reject non-numeric values early
    if (!/^\d+$/.test(orderIdRaw)) {
      return res.status(400).json({ message: "orderId must be a numeric ID" });
    }
    const orderId = parseInt(orderIdRaw, 10);

    // Normalize email and match case-insensitively (Postgres)
    const email = emailRaw.toLowerCase();

    const order = await Order.findOne({
      where: { order_id: orderId },
      include: [
        {
          model: User,
          as: "user",
          required: true,
          where: { email: { [Op.iLike]: email } },
          attributes: ["name", "email", "phoneno"],
        },
        {
          model: OrderItem,
          as: "orderItem",
          required: false,
          include: [
            {
              model: product,
              as: "product",
              required: false,
              attributes: ["part_number", "condition"],
            },
          ],
        },
        {
          model: Shipment,
          as: "shipment",
          required: false,
          attributes: [
            "shippingMethod",
            "shippingDate",
            "shippingPhone",
            "shippingAddress",
            "shippingCity",
            "shippingState",
            "shippingCountry",
          ],
        },
        {
          model: Payment,
          as: "payment",
          required: false,
          attributes: ["payment_method"],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.json({
      items: (order.orderItem || []).map((item) => ({
        item: item.product?.part_number || `Product ${item.product_id}`,
        condition: item.product?.condition || item.condition || "N/A",
        quantity: item.quantity,
      })),
      shippingMethod: order.shipment?.shippingMethod || "N/A",
      shippingDate: order.shipment?.shippingDate || "N/A",
      shippingPhone: order.shipment?.shippingPhone || "N/A",
      shippingAddress: order.shipment?.shippingAddress || "N/A",
      shippingCity: order.shipment?.shippingCity || "N/A",
      shippingState: order.shipment?.shippingState || "N/A",
      shippingCountry: order.shipment?.shippingCountry || "N/A",
      paymentMethod: order.payment?.payment_method || "Card Payment",
      orderDate: order.createdAt,
      orderId: order.order_id,
      orderStatus: order.order_status,
      leadTime: order.leadtime || "N/A",
      orderPlacedBy: order.user?.name || "N/A",
      amountPaid: order.total_price,
    });
  } catch (error) {
    console.error("Track Progress Error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

const updateOrderStatus = async (req, res) => {
  const { order_id, order_status, leadTime, shippingMethod, shippingDate } =
    req.body;

  try {
    // Find order including shipment
    const order = await Order.findOne({
      where: { order_id },
      include: [
        {
          model: Shipment,
          as: "shipment",
        },
      ],
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const changes = {};

    // Update order status
    if (order_status && order.order_status !== order_status) {
      changes.order_status = order_status;
      order.order_status = order_status;
    }

    // Update leadTime
    if (leadTime) {
      const newLeadTime = new Date(leadTime);
      if (isNaN(newLeadTime.getTime())) {
        return res
          .status(400)
          .json({ error: "Invalid leadTime format. Expected YYYY-MM-DD." });
      }
      changes.leadTime = newLeadTime;
      order.leadtime = newLeadTime;
    }

    // Handle shipment updates - create shipment if it doesn't exist
    if (shippingMethod || shippingDate) {
      if (order.shipment) {
        // Update existing shipment
        if (
          shippingMethod &&
          order.shipment.shippingMethod !== shippingMethod
        ) {
          changes.shippingMethod = shippingMethod;
          order.shipment.shippingMethod = shippingMethod;
        }

        if (shippingDate && order.shipment.shippingDate !== shippingDate) { 
          changes.shippingDate = shippingDate;
          order.shipment.shippingDate = shippingDate;
        }

        // Save shipment changes
        await order.shipment.save();
      } else {
        // Create new shipment if it doesn't exist
        console.log("Creating new shipment for order:", order_id);
        const newShipment = await Shipment.create({
          shippingMethod: shippingMethod || null,
          shippingDate: shippingDate || null,
        });

        // Update order with new shipment_id
        order.shipment_id = newShipment.shipment_id;
        changes.shipment_created = true;
        changes.shippingMethod = shippingMethod;
        changes.shippingDate = shippingDate;
      }
    }

    // Save order changes
    await order.save();

    // Send email if status changed to notification-worthy statuses
    if (changes.order_status && ['PROCESSING', 'CANCELLED', 'SHIPPED', 'DELIVERED'].includes(order_status)) {
      try {
        const orderItems = await OrderItem.findAll({
          where: { orderId: order.order_id },
          include: [{ model: product, as: 'product' }]
        });
        const items = orderItems.map(item => ({
          name: item.product?.name || item.productName || 'Product',
          quantity: item.quantity,
          price: item.price
        }));
        const user = await User.findByPk(order.userId);
        if (user) {
          // Calculate user's order number (sequential for this user)
          const userOrderCount = await Order.count({
            where: {
              userId: user.id,
              createdAt: { [Op.lte]: order.createdAt }
            }
          });
          const { subject, html } = orderStatusUpdateTemplate({
            order: {
              orderId: userOrderCount, // Use user-specific order number
              shippingName: order.shipment?.shippingName,
              id: userOrderCount
            },
            items,
            newStatus: order_status
          });
          await sendEmail(null, user.email, subject, html);
        }
      } catch (emailError) {
        console.error('Error sending status update email:', emailError);
      }
    }

    // Return the updated order data for frontend state update
    const updatedOrder = await Order.findOne({
      where: { order_id: order.order_id },
      include: [
        {
          model: Shipment,
          as: "shipment",
        },
        {
          model: User,
          as: "user",
          attributes: ["name", "email", "phoneno"],
        },
        {
          model: OrderItem,
          as: "orderItem",
          include: [
            {
              model: product,
              as: "product",
              attributes: ["part_number", "condition", "price"],
            },
          ],
        },
        {
          model: Payment,
          as: "payment",
          attributes: ["payment_method", "payment_name", "amount"],
        },
      ],
    });

    res.json({ 
      message: "Order updated successfully", 
      changes,
      order: updatedOrder
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// User cancel order function
const userCancelOrder = async (req, res) => {
  const { orderId } = req.params;
  const cleanOrderId = orderId.trim();
  const userEmail = req.user?.email; // Assuming auth middleware sets req.user

  if (!userEmail) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    // Find order by orderId (string) and user email
    let whereCondition = { email: { [Op.iLike]: userEmail } };
    
    if (/^\d+$/.test(cleanOrderId)) {
      // If orderId is numeric, treat as order_id
      whereCondition.order_id = parseInt(cleanOrderId, 10);
    } else {
      // Otherwise, treat as string orderId
      whereCondition.orderId = cleanOrderId;
    }
    
    const order = await Order.findOne({
      where: whereCondition,
      include: [
        {
          model: Shipment,
          as: "shipment",
        },
      ],
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found or does not belong to user" });
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['COD_PENDING', 'PROCESSING', 'PENDING'];
    if (!cancellableStatuses.includes(order.order_status)) {
      return res.status(400).json({ error: `Order cannot be cancelled at this stage. Current status: ${order.order_status}` });
    }

    // Update status to CANCELLED
    order.order_status = 'CANCELLED';
    await order.save();

    // Send email notification
    try {
      const orderItems = await OrderItem.findAll({
        where: { orderId: order.order_id },
        include: [{ model: product, as: 'product' }]
      });
      const items = orderItems.map(item => ({
        name: item.product?.name || item.productName || 'Product',
        quantity: item.quantity,
        price: item.price
      }));
      const user = await User.findOne({ where: { email: userEmail } });
      if (user) {
        // Calculate user's order number
        const userOrderCount = await Order.count({
          where: {
            userId: user.id,
            createdAt: { [Op.lte]: order.createdAt }
          }
        });
        const { subject, html } = orderStatusUpdateTemplate({
          order: {
            orderId: userOrderCount,
            shippingName: order.shipment?.shippingName,
            id: userOrderCount
          },
          items,
          newStatus: 'CANCELLED'
        });
        await sendEmail(null, user.email, subject, html);
      }
    } catch (emailError) {
      console.error('Error sending cancellation email:', emailError);
    }

    res.json({ message: "Order cancelled successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// Track orders by email
const trackOrders = async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ message: "Invalid email" });
  }
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: User,
          as: "user",
          where: { email },
          attributes: ["name"],
        },
        {
          model: OrderItem,
          as: "orderItem",
          include: [
            {
              model: product,
              as: "product",
              attributes: ["product_id", "part_number", "condition", "image", "short_description", "long_description"],
              include: [
                {
                  model: ProductImage,
                  as: "images",
                  attributes: ["id", "url"],
                  required: false
                },
                {
                  model: brandcategory,
                  as: "brandcategory",
                  required: false,
                  include: [
                    {
                      model: brand,
                      as: "brand",
                      attributes: ["brand_id", "brand_name"],
                      required: false
                    },
                    {
                      model: category,
                      as: "category",
                      attributes: ["product_category_id", "category_name"],
                      required: false
                    }
                  ]
                }
              ]
            },
          ],
        },
        {
          model: Shipment,
          as: "shipment",
        },
        {
          model: Payment,
          as: "payment",
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ error: "No orders found for this email" });
    }

    const formatted = orders.map((order) => ({
      orderId: order.order_id,
      orderStatus: order.order_status,
      orderDate: order.createdAt,
      leadTime: order.leadtime,
      orderPlacedBy: order.user.name,
      // include tracking number for frontend display
      trackingNumber: order.trackingNumber || order.order_id,
      amountPaid: order.total_price,
      shippingMethod: order.shipment?.shippingMethod || "N/A",
      shippingPhone: order.shipment?.shippingPhone || "N/A",
      shippingAddress: order.shipment?.shippingAddress || "N/A",
      shippingDate: order.shipment?.shippingDate || "N/A",
      paymentMethod: order.payment?.payment_method || "Card Payment",
      items: order.orderItem.map((item) => {
        const productData = item.product;
        return {
          // Product name with multiple field names for compatibility
          product_name: productData?.part_number || `Product ${item.productId}`,
          productName: productData?.part_number || `Product ${item.productId}`,
          item: productData?.part_number || `Product ${item.productId}`,
          name: productData?.part_number || `Product ${item.productId}`,
          
          // Part number information
          part_number: productData?.part_number,
          product_part_number: productData?.part_number,
          partNumber: productData?.part_number,
          sku: productData?.part_number,
          product_code: productData?.part_number,
          productCode: productData?.part_number,
          
          // Product condition
          condition: productData?.condition || item.condition || "New",
          product_condition: productData?.condition || item.condition || "New",
          
          // Quantity
          quantity: item.quantity || 1,
          
          // Price information
          price: item.price || 0,
          product_price: item.price || 0,
          unit_price: item.price || 0,
          
          // Product ID
          id: item.productId,
          product_id: item.productId,
          
          // Product images - Cloudinary URLs
          product_image_url: productData?.image, // Main image from product table
          image_url: productData?.image,
          image: productData?.image,
          product_image: productData?.image,
          productImage: productData?.image,
          
          // Additional images from ProductImage table
          product_images: productData?.images || [],
          images: productData?.images || [],
          additional_images: productData?.images?.map(img => img.url) || [],
          
          // Brand information
          brand: productData?.brandcategory?.brand?.brand_name,
          brand_name: productData?.brandcategory?.brand?.brand_name,
          brandName: productData?.brandcategory?.brand?.brand_name,
          product_brand: productData?.brandcategory?.brand?.brand_name,
          manufacturer: productData?.brandcategory?.brand?.brand_name,
          
          // Category information
          category: productData?.brandcategory?.category?.category_name,
          category_name: productData?.brandcategory?.category?.category_name,
          categoryName: productData?.brandcategory?.category?.category_name,
          product_category: productData?.brandcategory?.category?.category_name,
          type: productData?.brandcategory?.category?.category_name,
          
          // Product descriptions
          description: productData?.short_description,
          product_description: productData?.short_description,
          details: productData?.short_description,
          summary: productData?.short_description,
          
          // Product specifications
          specifications: productData?.long_description,
          specs: productData?.long_description,
          product_specifications: productData?.long_description,
          technical_specs: productData?.long_description,
          features: productData?.long_description,
        };
      }),
      // Pricing and payment information
      subtotal: order.subtotal,
      shipping: order.shipping_cost,
      tax: order.tax,
      couponCode: order.couponCode,
      discount: order.discount,
      total: order.total_price,
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// Deletion disabled: admins are not allowed to remove orders from the database.
// They should instead update the order_status to "CANCELLED" via the update endpoint.
const deleteOrder = async (req, res) => {
  const { orderId } = req.params;
  console.warn(`Attempted deletion of order ${orderId} - operation blocked.`);
  return res.status(403).json({
    success: false,
    message: "Order deletion is prohibited. Update status to CANCELLED instead."
  });
};

// Enhanced tracking endpoint with better error handling and logging
// Track order by tracking number ONLY (no email/orderId)
const trackOrderByTracking = async (req, res) => {
  try {
    const raw = (req.query.trackingNumber || req.body.trackingNumber || "")
      .toString()
      .trim();
    if (!raw) {
      return res
        .status(400)
        .json({ success: false, message: "trackingNumber is required" });
    }

    const clean = raw.toUpperCase();
    const numeric = clean.replace(/\D/g, "");

    const order = await Order.findOne({
      where: {
        [Op.or]: [
          { trackingNumber: clean },
          ...(numeric
            ? [{ trackingNumber: { [Op.iLike]: `%${numeric}%` } }]
            : []),
          { orderId: clean }, // fallback if you ever store TRK... in orderId
        ],
      },
      include: [
        {
          model: User,
          as: "user",
          required: false,
          attributes: ["name", "email", "phoneno"],
        },
        {
          model: OrderItem,
          as: "orderItem",
          required: false,
          include: [
            {
              model: product,
              as: "product",
              required: false,
              attributes: ["part_number", "condition", "price"],
            },
          ],
        },
        { model: Shipment, as: "shipment", required: false },
        {
          model: Payment,
          as: "payment",
          required: false,
          attributes: ["payment_method", "payment_name", "amount"],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found for the provided tracking number.",
      });
    }

    const items = (order.orderItem || []).map((it) => ({
      id: it.product_id,
      name: it.product?.part_number || `Product ${it.product_id}`,
      item: it.product?.part_number || `Product ${it.product_id}`,
      condition: it.product?.condition || it.condition || "New",
      quantity: it.quantity || 1,
      price: it.price ?? it.product?.price ?? 0,
    }));

    return res.json({
      success: true,
      order: {
        orderId: order.order_id,
        orderDate: order.createdAt,
        orderStatus: order.order_status,
        trackingNumber: order.trackingNumber || order.orderId,
        email: order.email || order.user?.email || null,
        shippingName:
          order.shippingName || order.shipment?.shippingName || "N/A",
        shippingAddress:
          order.shippingAddress || order.shipment?.shippingAddress || "N/A",
        shippingCity:
          order.shippingCity || order.shipment?.shippingCity || "N/A",
        shippingState:
          order.shippingState || order.shipment?.shippingState || "N/A",
        shippingCountry:
          order.shippingCountry || order.shipment?.shippingCountry || "N/A",
        shippingPhone:
          order.shippingPhone || order.shipment?.shippingPhone || "N/A",
        shippingMethod:
          order.shippingMethod || order.shipment?.shippingMethod || "N/A",
        shippingDate:
          order.shippingDate || order.shipment?.shippingDate || "N/A",
        paymentStatus: order.paymentStatus || "completed",
        paymentMethod: order.payment?.payment_method || "Card",
        AmountPaidBy: order.payment?.payment_name || "Card Holder",
        subtotal: order.subtotal || 0,
        shipping_cost: order.shipping_cost || 0,
        tax: order.tax || 0,
        total_price: order.total_price ?? order.amount ?? 0,
        amountPaid: order.total_price ?? order.amount ?? 0,
        leadtime: order.leadtime || "N/A",
        items,
        orderDetails: {
          items,
          subtotal: order.subtotal || 0,
          shipping: order.shipping_cost || 0,
          tax: order.tax || 0,
          total: order.total_price ?? order.amount ?? 0,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error occurred",
    });
  }
};

// Generate and stream a simple PDF invoice for an order
const getInvoice = async (req, res) => {
  try {
    const rawId = (req.params.orderId || '').toString().trim();
    if (!rawId) return res.status(400).send('Missing order identifier');

    // Determine whether rawId is numeric (order_id) or the orderId string
    const where = /^\d+$/.test(rawId) ? { order_id: parseInt(rawId, 10) } : { orderId: rawId };

    const order = await Order.findOne({
      where,
      include: [
        { model: User, as: 'user', required: false },
        { model: OrderItem, as: 'orderItem', required: false, include: [{ model: product, as: 'product', required: false }] },
        { model: Shipment, as: 'shipment', required: false },
        { model: Payment, as: 'payment', required: false }
      ]
    });

    if (!order) return res.status(404).send('Order not found');

    // Create PDF document
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    const filename = `invoice-${order.orderId || order.order_id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Invoice', { align: 'left' });
    doc.moveDown();

    // Order metadata
    doc.fontSize(12).text(`Order: ${order.orderId || order.order_id}`);
    doc.text(`Date: ${order.createdAt}`);
    doc.text(`Email: ${order.email || order.user?.email || ''}`);
    doc.text(`Tracking: ${order.trackingNumber || ''}`);
    doc.moveDown();

    // Shipping
    doc.fontSize(14).text('Shipping Information');
    doc.fontSize(10).text(`${order.shippingName || ''}`);
    doc.text(`${order.shippingAddress || ''}`);
    doc.text(`${order.shippingCity || ''} ${order.shippingState || ''} ${order.shippingCountry || ''}`);
    doc.moveDown();

    // Items table header
    doc.fontSize(12).text('Items');
    doc.moveDown(0.5);

    const items = order.orderItem || [];
    items.forEach((it, idx) => {
      const name = it.product?.part_number || it.productName || `Product ${it.productId}`;
      const qty = it.quantity || 1;
      const price = parseFloat(it.price || 0).toFixed(2);
      doc.fontSize(10).text(`${idx + 1}. ${name} — Qty: ${qty} — $${price}`);
    });

    doc.moveDown();
    doc.text(`Subtotal: $${parseFloat(order.subtotal || 0).toFixed(2)}`);
    doc.text(`Shipping: $${parseFloat(order.shipping_cost || 0).toFixed(2)}`);
    doc.text(`Tax: $${parseFloat(order.tax || 0).toFixed(2)}`);
    doc.text(`Total: $${parseFloat(order.total_price || order.amount || 0).toFixed(2)}`);

    doc.end();
  } catch (err) {
    console.error('getInvoice error:', err);
    return res.status(500).send('Failed to generate invoice');
  }
};

module.exports = {
  checkout,
  getAllOrders,
  trackProgress,
  updateOrderStatus,
  userCancelOrder,
  trackOrders,
  deleteOrder,
  trackOrderByTracking,
  getInvoice,
};
