"use strict";

require("dotenv").config();

const Stripe  = require("stripe");
const bcrypt  = require("bcrypt");
const crypto  = require("crypto");

const { query, transaction } = require("../config/db");
const { sendEmail }          = require("../utils/email");
const { orderConfirmationTemplate } = require("../utils/emailTemplates");

// ── Stripe init ───────────────────────────────────────────────────────────────

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}
const stripe        = Stripe(process.env.STRIPE_SECRET_KEY);
const STRIPE_MODE   = process.env.STRIPE_SECRET_KEY.startsWith("sk_test_") ? "test"
                    : process.env.STRIPE_SECRET_KEY.startsWith("sk_live_") ? "live"
                    : "unknown";

// ── Helpers ───────────────────────────────────────────────────────────────────

const validEmail = (e) =>
  typeof e === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

function generateOrderId() {
  return `ORD-${Date.now()}-${crypto.randomInt(100, 999)}`;
}

function generateTrackingNumber() {
  return `TRK${Date.now().toString().slice(-8)}`;
}

// ── Create Payment Intent ─────────────────────────────────────────────────────

exports.createPaymentIntent = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { amount, currency = "usd", metadata = {} } = req.body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ error: "Valid positive amount is required" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount:               Math.round(amount * 100),
      currency,
      payment_method_types: ["card"],
      receipt_email:        req.user.email || undefined,
      metadata: {
        ...metadata,
        userId:    String(req.user.id),
        userEmail: req.user.email,
      },
    });

    console.log(`[Stripe][createPaymentIntent] mode=${STRIPE_MODE} id=${paymentIntent.id} amount=${amount}`);

    return res.json({
      clientSecret:    paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    console.error("createPaymentIntent:", err.message);
    return res.status(500).json({ error: "Failed to create payment intent" });
  }
};

// ── Process Checkout ──────────────────────────────────────────────────────────

exports.processCheckout = async (req, res) => {
  try {
    const {
      email, password, phoneNumber, firstName, amount,
      paymentIntentId, clientSecret,
      shippingName, shippingMethod, shippingCompany, shippingPhone,
      shippingAddress, shippingCity, shippingState, shippingCountry,
      billingName, billingCompany, billingPhone,
      billingAddress, billingCity, billingState, billingCountry,
      orderDetails,
    } = req.body;

    // ── Required field validation ───────────────────────────
    if (!validEmail(email))   return res.status(400).json({ error: "Valid email is required" });
    if (!amount || amount <= 0) return res.status(400).json({ error: "Valid amount is required" });
    if (!paymentIntentId)     return res.status(400).json({ error: "Payment intent ID is required" });
    if (!shippingName?.trim()) return res.status(400).json({ error: "Shipping name is required" });
    if (!shippingAddress?.trim()) return res.status(400).json({ error: "Shipping address is required" });
    if (!orderDetails?.items?.length) return res.status(400).json({ error: "Order items are required" });

    const normalizedEmail = email.toLowerCase().trim();

    // ── Verify payment with Stripe ──────────────────────────
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (e) {
      // Fallback: derive ID from clientSecret (format: pi_xxx_secret_xxx)
      if (clientSecret && typeof clientSecret === "string" && clientSecret.startsWith("pi_")) {
        const derivedId = clientSecret.split("_secret")[0];
        try {
          paymentIntent = await stripe.paymentIntents.retrieve(derivedId);
        } catch (e2) {
          console.error("Stripe retrieve (fallback) failed:", e2.message);
          return res.status(400).json({ error: "Invalid payment intent" });
        }
      } else {
        console.error("Stripe retrieve failed:", e.message);
        return res.status(400).json({ error: "Invalid payment intent" });
      }
    }

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        error: `Payment not completed. Status: ${paymentIntent.status}`,
      });
    }

    // ── Find or create user ─────────────────────────────────
    let userId = null;
    const { rows: existingUsers } = await query(
      `SELECT id FROM users WHERE email = $1`,
      [normalizedEmail]
    );

    if (existingUsers.length) {
      userId = existingUsers[0].id;
    } else {
      const rawPass   = password?.trim() || crypto.randomBytes(9).toString("base64");
      const hashedPwd = await bcrypt.hash(rawPass, 12);

      const { rows: newUser } = await query(
        `INSERT INTO users (email, password, name, phoneno, role, is_google_auth, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'user', false, NOW(), NOW())
         RETURNING id`,
        [normalizedEmail, hashedPwd, firstName || shippingName || "Guest", phoneNumber || null]
      );
      userId = newUser[0].id;
    }

    // ── Create order + items in a transaction ───────────────
    const orderId        = generateOrderId();
    const trackingNumber = generateTrackingNumber();

    const orderRow = await transaction(async (tx) => {
      const { rows: orderRows } = await tx(
        `INSERT INTO orders (
           order_id, user_id, email, amount, payment_intent_id,
           payment_status, order_status, tracking_number,
           shipping_name, shipping_method, shipping_company, shipping_phone,
           shipping_address, shipping_city, shipping_state, shipping_country,
           billing_name, billing_company, billing_phone,
           billing_address, billing_city, billing_state, billing_country,
           subtotal, shipping_cost, tax, total_price, is_full_cart,
           created_at, updated_at
         ) VALUES (
           $1,$2,$3,$4,$5,
           'completed','processing',$6,
           $7,$8,$9,$10,
           $11,$12,$13,$14,
           $15,$16,$17,
           $18,$19,$20,$21,
           $22,$23,$24,$25,$26,
           NOW(), NOW()
         ) RETURNING *`,
        [
          orderId, userId, normalizedEmail, parseFloat(amount), paymentIntentId,
          trackingNumber,
          shippingName, shippingMethod || "standard", shippingCompany || null, shippingPhone || null,
          shippingAddress, shippingCity || null, shippingState || null, shippingCountry || null,
          billingName || shippingName, billingCompany || null, billingPhone || shippingPhone || null,
          billingAddress || shippingAddress, billingCity || shippingCity || null,
          billingState || shippingState || null, billingCountry || shippingCountry || null,
          parseFloat(orderDetails.subtotal), parseFloat(orderDetails.shipping),
          parseFloat(orderDetails.tax), parseFloat(orderDetails.total),
          orderDetails.isFullCart || false,
        ]
      );

      const order = orderRows[0];

      // Build bulk insert for order items
      if (orderDetails.items.length > 0) {
        const valuePlaceholders = [];
        const itemVals = [];
        let idx = 1;

        for (const item of orderDetails.items) {
          valuePlaceholders.push(
            `($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, NOW(), NOW())`
          );
          itemVals.push(
            order.order_id,
            item.id,
            item.name || "Item",
            parseFloat(item.price) || 0,
            parseInt(item.quantity, 10) || 1,
            item.condition || "USED"
          );
        }

        await tx(
          `INSERT INTO order_items
             (order_id, product_id, product_name, price, quantity, condition, created_at, updated_at)
           VALUES ${valuePlaceholders.join(", ")}`,
          itemVals
        );
      }

      return order;
    });

    // ── Confirmation email (non-blocking) ───────────────────
    try {
      const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || process.env.email_user;
      const itemsForEmail = (orderDetails.items || []).map((it) => ({
        name:     it.name || "Item",
        quantity: it.quantity || 1,
        price:    parseFloat(it.price) || 0,
      }));

      const { subject, html } = orderConfirmationTemplate({
        order: orderRow,
        items: itemsForEmail,
        currencyCode: "USD",
        appName: "Killswitch",
      });

      sendEmail(from, normalizedEmail, subject, html)
        .catch((err) => console.error("Order confirmation email failed:", err.message));
    } catch (mailErr) {
      console.error("Error preparing order email:", mailErr.message);
    }

    return res.json({
      success: true,
      message: "Order processed successfully",
      orderId:        orderRow.order_id,
      trackingNumber: orderRow.tracking_number,
      paymentIntentId: paymentIntent.id,
      order: {
        id:             orderRow.order_id,
        status:         orderRow.order_status,
        total:          orderRow.total_price,
        trackingNumber: orderRow.tracking_number,
      },
    });
  } catch (err) {
    console.error("processCheckout:", err.message);
    return res.status(500).json({ error: "Failed to process checkout" });
  }
};

// ── Get Publishable Key ───────────────────────────────────────────────────────

exports.getPublishableKey = async (_req, res) => {
  try {
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      return res.status(500).json({ error: "Stripe publishable key not configured" });
    }
    return res.json({ publishableKey });
  } catch (err) {
    console.error("getPublishableKey:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── Webhook ───────────────────────────────────────────────────────────────────

exports.handleWebhook = async (req, res) => {
  const sig            = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !endpointSecret) {
    return res.status(400).json({ error: "Missing webhook signature or secret" });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object;
      console.log("Payment succeeded:", pi.id);
      query(
        `UPDATE orders SET payment_status = 'completed', updated_at = NOW()
         WHERE payment_intent_id = $1`,
        [pi.id]
      ).catch((e) => console.error("Webhook order update failed:", e.message));
      break;
    }

    case "payment_intent.payment_failed": {
      const pi = event.data.object;
      console.log("Payment failed:", pi.id);
      query(
        `UPDATE orders SET payment_status = 'failed', updated_at = NOW()
         WHERE payment_intent_id = $1`,
        [pi.id]
      ).catch((e) => console.error("Webhook order update failed:", e.message));
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return res.json({ received: true });
};

// ── Refund ─────────────────────────────────────────────────────────────────────

exports.refundPayment = async (req, res) => {
  try {
    const { paymentIntentId, amount, reason = "requested_by_customer" } = req.body;

    if (!paymentIntentId || typeof paymentIntentId !== "string") {
      return res.status(400).json({ error: "Valid Payment Intent ID is required" });
    }

    const ALLOWED_REASONS = ["duplicate", "fraudulent", "requested_by_customer"];
    if (!ALLOWED_REASONS.includes(reason)) {
      return res.status(400).json({ error: "Invalid refund reason" });
    }

    if (amount !== undefined && (typeof amount !== "number" || amount <= 0)) {
      return res.status(400).json({ error: "Refund amount must be a positive number" });
    }

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason,
    });

    await query(
      `UPDATE orders SET payment_status = 'refunded', updated_at = NOW()
       WHERE payment_intent_id = $1`,
      [paymentIntentId]
    );

    return res.json({
      success: true,
      refund: {
        id:     refund.id,
        amount: refund.amount / 100,
        status: refund.status,
      },
    });
  } catch (err) {
    console.error("refundPayment:", err.message);
    return res.status(500).json({ error: "Failed to process refund" });
  }
};