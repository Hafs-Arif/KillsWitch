// Load environment variables first
require("dotenv").config();

const Stripe = require("stripe");
const { Order, OrderItem, User } = require("../models");
const { sendEmail } = require("../utils/email");
const { orderConfirmationTemplate } = require("../utils/emailTemplates");

// Initialize Stripe with proper error handling
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const STRIPE_KEY_MODE = process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') ? 'test' : (process.env.STRIPE_SECRET_KEY.startsWith('sk_live_') ? 'live' : 'unknown');

/**
 * Create a payment intent for Stripe
 */
exports.createPaymentIntent = async (req, res) => {
  try {
    // Verify user is authenticated (auth middleware sets req.user)
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { amount, currency = "usd", metadata = {} } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Valid amount is required" });
    }

    // Add user information to metadata for tracking
    const enhancedMetadata = {
      ...metadata,
      userId: req.user.id.toString(),
      userEmail: req.user.email,
    };

    // Create payment intent (CardElement flow)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: enhancedMetadata,
      payment_method_types: ["card"],
      receipt_email: req.user?.email || undefined,
    });

    console.log(`[Stripe][createPaymentIntent] mode=${STRIPE_KEY_MODE} id=${paymentIntent.id} amount=${amount} user=${req.user.email}`);
    console.log(`[Stripe][createPaymentIntent] Using Stripe key: ${process.env.STRIPE_SECRET_KEY?.substring(0, 12)}...`);
    console.log(`[Stripe][createPaymentIntent] Payment intent created successfully:`, {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      client_secret: paymentIntent.client_secret?.substring(0, 20) + '...'
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({ error: "Failed to create payment intent" });
  }
};

/**
 * Process checkout with Stripe payment
 */
exports.processCheckout = async (req, res) => {
  try {
    const {
      email,
      password,
      phoneNumber,
      firstName,
      amount,
      paymentIntentId,
      clientSecret,
      shippingName,
      shippingMethod,
      shippingCompany,
      shippingPhone,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingCountry,
      billingName,
      billingCompany,
      billingPhone,
      billingAddress,
      billingCity,
      billingState,
      billingCountry,
      orderDetails,
    } = req.body;

    // Validate required fields
    if (
      !email ||
      !amount ||
      !paymentIntentId ||
      !shippingName ||
      !shippingAddress
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log(`[Stripe][processCheckout] mode=${STRIPE_KEY_MODE} received paymentIntentId=${paymentIntentId}`);
    console.log(`[Stripe][processCheckout] Stripe key mode: ${STRIPE_KEY_MODE}`);
    console.log(`[Stripe][processCheckout] Using Stripe key: ${process.env.STRIPE_SECRET_KEY?.substring(0, 12)}...`);
    
    // Verify payment intent with Stripe
    let paymentIntent;
    try {
      console.log(`[Stripe][processCheckout] Attempting to retrieve payment intent: ${paymentIntentId}`);
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      console.log(`[Stripe][processCheckout] Successfully retrieved payment intent: ${paymentIntent.id}, status: ${paymentIntent.status}`);
    } catch (e) {
      console.error("Stripe retrieve payment intent failed:", e?.message || e);
      console.error("Stripe error details:", {
        type: e?.type,
        code: e?.code,
        param: e?.param,
        message: e?.message
      });
      
      // Fallback: derive ID from clientSecret if provided (format: pi_xxx_secret_xxx)
      if (clientSecret && typeof clientSecret === 'string' && clientSecret.startsWith('pi_')) {
        const derivedId = clientSecret.split('_secret')[0];
        console.warn(`[Stripe][processCheckout] Falling back to derived PaymentIntent id from clientSecret: ${derivedId}`);
        try {
          paymentIntent = await stripe.paymentIntents.retrieve(derivedId);
          console.log(`[Stripe][processCheckout] Successfully retrieved payment intent via fallback: ${paymentIntent.id}`);
        } catch (e2) {
          console.error("Stripe retrieve (fallback) payment intent failed:", e2?.message || e2);
          return res.status(400).json({ 
            error: `Invalid payment intent (fallback): ${e2?.message || 'unknown error'}`,
            details: {
              originalError: e?.message,
              fallbackError: e2?.message,
              paymentIntentId,
              derivedId,
              stripeMode: STRIPE_KEY_MODE
            }
          });
        }
      } else {
        return res.status(400).json({ 
          error: `Invalid payment intent: ${e?.message || 'unknown error'}`,
          details: {
            error: e?.message,
            paymentIntentId,
            stripeMode: STRIPE_KEY_MODE,
            hasClientSecret: !!clientSecret
          }
        });
      }
    }

    console.log(`[Stripe][processCheckout] Payment intent status: ${paymentIntent.status}`);
    
    if (paymentIntent.status !== "succeeded") {
      console.warn(`[Stripe][processCheckout] Payment intent status is ${paymentIntent.status}, not succeeded`);
      console.warn(`[Stripe][processCheckout] Payment intent details:`, {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        last_payment_error: paymentIntent.last_payment_error,
        charges: paymentIntent.charges?.data?.length || 0
      });
      
      return res.status(400).json({ 
        error: `Payment not completed. Status: ${paymentIntent.status}`, 
        details: {
          status: paymentIntent.status,
          paymentIntentId: paymentIntent.id,
          message: paymentIntent.last_payment_error?.message || "Payment was not completed successfully"
        }
      });
    }

    // Check if user exists or create new user
    let user = null;
    if (email) {
      user = await User.findOne({ where: { email } });

      if (!user) {
        const bcrypt = require("bcrypt");
        // Use provided password OR generate a random temp password for guest checkout
        const rawPass =
          (password && password.trim()) ||
          Math.random().toString(36).slice(-12);
        const hashedPassword = await bcrypt.hash(rawPass, 10);

        user = await User.create({
          email,
          password: hashedPassword,
          name: firstName || shippingName || "Guest",
          phoneno: phoneNumber || null,
        });
      }
    }

    // Generate order ID
    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const trackingNumber = `TRK${Date.now().toString().slice(-8)}`;

    // Create order record
    const order = await Order.create({
      orderId,
      userId: user ? user.id : null,
      email,
      amount: parseFloat(amount),
      paymentIntentId,
      paymentStatus: "completed",
      order_status: "processing", // Fixed field name
      trackingNumber,

      // Shipping information
      shippingName,
      shippingMethod: shippingMethod || "standard",
      shippingCompany,
      shippingPhone,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingCountry,

      // Billing information
      billingName: billingName || shippingName,
      billingCompany,
      billingPhone: billingPhone || shippingPhone,
      billingAddress: billingAddress || shippingAddress,
      billingCity: billingCity || shippingCity,
      billingState: billingState || shippingState,
      billingCountry: billingCountry || shippingCountry,

      // Order details
      subtotal: parseFloat(orderDetails.subtotal),
      shipping_cost: parseFloat(orderDetails.shipping), // Fixed field name
      tax: parseFloat(orderDetails.tax),
      total_price: parseFloat(orderDetails.total), // Fixed field name
      isFullCart: orderDetails.isFullCart || false,
    });

    // Create order items
    if (orderDetails.items && orderDetails.items.length > 0) {
      const orderItems = orderDetails.items.map((item) => ({
        orderId: order.order_id, // Use the primary key from the created order
        productId: item.id,
        productName: item.name,
        price: parseFloat(item.price),
        quantity: item.quantity || 1,
        condition: item.condition || "USED",
      }));

      await OrderItem.bulkCreate(orderItems);
    }

    // Send order confirmation email (non-blocking)
    try {
      const fromAddress =
        process.env.SMTP_FROM ||
        process.env.EMAIL_FROM ||
        process.env.email_from ||
        process.env.SMTP_USER ||
        process.env.EMAIL_USER ||
        process.env.email_user;

      const itemsForEmail = (orderDetails?.items || []).map((it) => ({
        name: it.name || it.productName || it.item || "Item",
        quantity: it.quantity || 1,
        price: parseFloat(it.price) || 0,
      }));

      const { subject, html } = orderConfirmationTemplate({
        order,
        items: itemsForEmail,
        currencyCode: "USD",
        appName: "Killswitch",
      });

      // Fire and forget; don't block checkout response on email
      sendEmail(fromAddress, email, subject, html).catch((err) =>
        console.error("Order confirmation email failed:", err.message)
      );
    } catch (mailErr) {
      console.error("Error preparing order confirmation email:", mailErr);
    }

    res.json({
      success: true,
      message: "Order processed successfully",
      orderId: order.orderId,
      trackingNumber: order.trackingNumber,
      paymentIntentId: paymentIntent.id,
      order: {
        id: order.orderId,
        status: order.order_status, // Fixed field name
        total: order.total_price, // Fixed field name
        trackingNumber: order.trackingNumber,
      },
    });
  } catch (error) {
    console.error("Error processing checkout:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
    });
    res.status(500).json({
      error: "Failed to process checkout",
      details: error.message,
    });
  }
};

/**
 * Get Stripe publishable key
 */
exports.getPublishableKey = async (req, res) => {
  try {
    const publishableKey =
      process.env.STRIPE_PUBLISHABLE_KEY ||
      "pk_live_51S8kWHLP2FlHJkxxVebexLnCZNPu0V2ueJFAvtVLrCGP8S43BQSm1cZo8M89CBgDLFAyXo4y54HKjEQuCC6GF3RM00FZhf0Ozv";
    res.json({
      publishableKey: publishableKey,
    });
  } catch (error) {
    console.error("Error getting publishable key:", error);
    res.status(500).json({ error: "Failed to get publishable key" });
  }
};

/**
 * Handle Stripe webhooks
 */
exports.handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      console.log("Payment succeeded:", paymentIntent.id);

      // Update order status if needed
      try {
        await Order.update(
          { paymentStatus: "completed" },
          { where: { paymentIntentId: paymentIntent.id } }
        );
      } catch (error) {
        console.error("Error updating order status:", error);
      }
      break;

    case "payment_intent.payment_failed":
      const failedPayment = event.data.object;
      console.log("Payment failed:", failedPayment.id);

      // Update order status
      try {
        await Order.update(
          { paymentStatus: "failed" },
          { where: { paymentIntentId: failedPayment.id } }
        );
      } catch (error) {
        console.error("Error updating failed payment status:", error);
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

/**
 * Refund a payment
 */
exports.refundPayment = async (req, res) => {
  try {
    const {
      paymentIntentId,
      amount,
      reason = "requested_by_customer",
    } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: "Payment Intent ID is required" });
    }

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents or refund full amount
      reason: reason,
    });

    // Update order status
    await Order.update(
      { paymentStatus: "refunded" },
      { where: { paymentIntentId } }
    );

    res.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount / 100, // Convert back to dollars
        status: refund.status,
      },
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    res.status(500).json({ error: "Failed to process refund" });
  }
};
