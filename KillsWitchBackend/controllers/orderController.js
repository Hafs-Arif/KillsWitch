"use strict";

const bcrypt = require("bcrypt");
const crypto = require("crypto");
const PDFDocument = require("pdfkit");

const { query, transaction }        = require("../config/db");
const { sendEmail }                 = require("../utils/email");
const { orderConfirmationTemplate, orderStatusUpdateTemplate } = require("../utils/emailTemplates");

// ── Helpers ───────────────────────────────────────────────────────────────────

const trackingNumber = () => `TRK${Date.now().toString().slice(-8)}${Math.floor(Math.random()*1000).toString().padStart(3,"0")}`;
const orderId        = () => `ORD-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

// ── Checkout ──────────────────────────────────────────────────────────────────

const checkout = async (req, res) => {
  try {
    const {
      email, password, name, phoneNumber, payment_method = "card",
      shippingName, shippingAddress, shippingCity, shippingState,
      shippingCountry, shippingPhone, shippingCompany,
      billingName,  billingAddress,  billingCity,  billingState,
      billingCountry, billingPhone, billingCompany,
      orderDetails = {},
    } = req.body;

    if (!email)                                   return res.status(400).json({ message: "Email required" });
    if (!orderDetails?.items?.length)             return res.status(400).json({ message: "Order items required" });
    if (!shippingName || !shippingAddress)        return res.status(400).json({ message: "Shipping info required" });

    // ── Validate items & re-compute totals server-side ─────────────────────
    const items     = orderDetails.items;
    const shipping  = Number(orderDetails.shipping) || 0;
    const TAX_RATE  = 0.2;

    // Fetch product prices from DB (never trust client prices)
    const productIds    = items.map(i => i.id);
    const placeholders  = productIds.map((_, n) => `$${n + 1}`).join(",");
    const { rows: products } = await query(
      `SELECT product_id, price, quantity, part_number FROM products WHERE product_id IN (${placeholders})`,
      productIds
    );
    const productMap = Object.fromEntries(products.map(p => [p.product_id, p]));

    // Stock validation
    for (const item of items) {
      const p = productMap[item.id];
      if (!p)            return res.status(400).json({ message: `Product ${item.id} not found` });
      if (p.quantity < item.quantity)
        return res.status(400).json({ message: `Insufficient stock for ${p.part_number}. Available: ${p.quantity}` });
    }

    // Coupon validation
    let discount = 0;
    let couponCode = null;
    if (orderDetails.couponCode) {
      const code = String(orderDetails.couponCode).trim().toUpperCase();
      const { rows: coupons } = await query(
        `SELECT * FROM coupons WHERE code = $1 AND is_active = true
         AND (expires_at IS NULL OR expires_at > NOW())
         AND (max_uses IS NULL OR uses_count < max_uses)`,
        [code]
      );
      if (coupons.length) {
        const c = coupons[0];
        const subtotalForCoupon = items.reduce((s, i) => s + (productMap[i.id]?.price || 0) * i.quantity, 0);
        if (!c.min_purchase_amount || subtotalForCoupon >= c.min_purchase_amount) {
          discount   = c.discount_type === "percentage"
            ? +(subtotalForCoupon * c.discount_value / 100).toFixed(2)
            : +c.discount_value;
          discount   = Math.min(discount, subtotalForCoupon);
          couponCode = c.code;
        }
      }
    }

    const subtotal      = items.reduce((s, i) => s + (productMap[i.id]?.price || 0) * i.quantity, 0);
    const taxableBase   = Math.max(0, subtotal - discount);
    const tax           = +(taxableBase * TAX_RATE).toFixed(2);
    const totalPrice    = +(taxableBase + shipping + tax).toFixed(2);
    const orderIdStr    = orderId();
    const trackNum      = trackingNumber();

    await transaction(async (tx) => {
      // Find or create user
      let { rows: userRows } = await tx("SELECT id, email, name FROM users WHERE email = $1", [email.toLowerCase()]);
      let userId;
      if (!userRows.length) {
        const hashed = await bcrypt.hash(password || crypto.randomBytes(16).toString("hex"), 12);
        const { rows: newUser } = await tx(
          `INSERT INTO users (name, email, password, phoneno, role, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 'user', NOW(), NOW()) RETURNING id`,
          [name || shippingName, email.toLowerCase(), hashed, phoneNumber || null]
        );
        userId = newUser[0].id;
      } else {
        userId = userRows[0].id;
      }

      // Shipment
      const { rows: shipRows } = await tx(
        `INSERT INTO shipments
         (shipping_name, shipping_address, shipping_city, shipping_state, shipping_country,
          shipping_phone, shipping_company, billing_name, billing_address, billing_city,
          billing_state, billing_country, billing_phone, billing_company)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING shipment_id`,
        [shippingName, shippingAddress, shippingCity, shippingState, shippingCountry,
         shippingPhone, shippingCompany||null,
         billingName||shippingName, billingAddress||shippingAddress, billingCity||shippingCity,
         billingState||shippingState, billingCountry||shippingCountry,
         billingPhone||shippingPhone, billingCompany||null]
      );
      const shipmentId = shipRows[0].shipment_id;

      // Payment — NEVER store raw card data.  Only metadata.
      const { rows: payRows } = await tx(
        `INSERT INTO payments (user_id, payment_method, payment_name, amount, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING payment_id`,
        [userId, payment_method, payment_method === "cod" ? "Cash on Delivery" : "Card Payment", totalPrice]
      );
      const paymentId = payRows[0].payment_id;

      const orderStatus = payment_method === "cod" ? "COD_PENDING" : "PENDING";

      // Order
      await tx(
        `INSERT INTO orders
         (order_id_str, email, amount, order_status, shipment_id, payment_id, user_id,
          subtotal, shipping_cost, tax, total_price, discount, coupon_code,
          tracking_number, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW(),NOW())`,
        [orderIdStr, email.toLowerCase(), totalPrice, orderStatus, shipmentId, paymentId, userId,
         subtotal, shipping, tax, totalPrice, discount, couponCode, trackNum]
      );

      // Get the auto-incremented order_id back
      const { rows: oRows } = await tx("SELECT order_id FROM orders WHERE order_id_str = $1", [orderIdStr]);
      const dbOrderId = oRows[0].order_id;

      // Order items + stock deduction
      for (const item of items) {
        const p = productMap[item.id];
        await tx(
          `INSERT INTO order_items (order_id, product_id, product_name, quantity, price, condition, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())`,
          [dbOrderId, item.id, p.part_number, item.quantity, p.price, item.condition || null]
        );
        await tx(
          "UPDATE products SET quantity = quantity - $1, updated_at = NOW() WHERE product_id = $2",
          [item.quantity, item.id]
        );
      }

      // Coupon uses counter
      if (couponCode) {
        await tx("UPDATE coupons SET uses_count = uses_count + 1 WHERE code = $1", [couponCode]);
      }

      // Activity log
      await tx(
        `INSERT INTO activity_logs (user_email, order_id, activity, details, created_at, updated_at)
         VALUES ($1,$2,'Order Created',$3,NOW(),NOW())`,
        [email.toLowerCase(), dbOrderId, JSON.stringify({ order_id: dbOrderId, total: totalPrice })]
      );
    });

    // Non-blocking confirmation email
    sendEmail(null, email, "Order Confirmed – Killswitch", `<p>Your order ${orderIdStr} has been placed. Tracking: ${trackNum}</p>`)
      .catch(console.error);

    return res.status(201).json({
      trackingNumber: trackNum,
      orderId:        orderIdStr,
      total:          totalPrice,
      discount,
      couponCode,
    });
  } catch (err) {
    console.error("checkout:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── Get All Orders (admin) ────────────────────────────────────────────────────

const getAllOrders = async (_req, res) => {
  try {
    const { rows: orders } = await query(
      `SELECT
         o.order_id, o.order_id_str, o.email, o.order_status, o.total_price,
         o.subtotal, o.shipping_cost, o.tax, o.discount, o.coupon_code,
         o.tracking_number, o.leadtime, o.created_at,
         u.name, u.phoneno,
         s.shipping_name, s.shipping_address, s.shipping_city, s.shipping_state,
         s.shipping_country, s.shipping_phone, s.shipping_company, s.shipping_method, s.shipping_date,
         s.billing_name, s.billing_address, s.billing_city, s.billing_state,
         s.billing_country, s.billing_phone, s.billing_company,
         p.payment_method, p.payment_name
       FROM orders o
       LEFT JOIN users    u ON u.id           = o.user_id
       LEFT JOIN shipments s ON s.shipment_id = o.shipment_id
       LEFT JOIN payments  p ON p.payment_id  = o.payment_id
       ORDER BY o.created_at DESC`
    );

    // Attach items per order in one query (avoid N+1)
    const orderIds = orders.map(o => o.order_id);
    let items = [];
    if (orderIds.length) {
      const ph = orderIds.map((_, n) => `$${n + 1}`).join(",");
      const { rows } = await query(
        `SELECT oi.*, pr.part_number, pr.image, pr.condition AS product_condition
         FROM order_items oi
         LEFT JOIN products pr ON pr.product_id = oi.product_id
         WHERE oi.order_id IN (${ph})`,
        orderIds
      );
      items = rows;
    }

    const itemsByOrder = {};
    items.forEach(i => { (itemsByOrder[i.order_id] = itemsByOrder[i.order_id] || []).push(i); });

    const result = orders.map(o => ({
      ...o,
      orderDetails: { items: itemsByOrder[o.order_id] || [] },
    }));

    return res.json(result);
  } catch (err) {
    console.error("getAllOrders:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── Track Orders by Email ─────────────────────────────────────────────────────

const trackOrders = async (req, res) => {
  const { email } = req.query;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ message: "Valid email required" });

  try {
    const { rows: orders } = await query(
      `SELECT o.*, s.shipping_method, s.shipping_phone, s.shipping_address,
              s.shipping_date, p.payment_method, u.name AS placed_by
       FROM orders o
       JOIN users u ON u.id = o.user_id AND u.email = $1
       LEFT JOIN shipments s ON s.shipment_id = o.shipment_id
       LEFT JOIN payments  p ON p.payment_id  = o.payment_id
       ORDER BY o.created_at DESC`,
      [email.toLowerCase()]
    );

    if (!orders.length) return res.status(404).json({ error: "No orders found" });

    const orderIds = orders.map(o => o.order_id);
    const ph       = orderIds.map((_, n) => `$${n + 1}`).join(",");
    const { rows: items } = await query(
      `SELECT oi.*, pr.part_number, pr.image FROM order_items oi
       LEFT JOIN products pr ON pr.product_id = oi.product_id
       WHERE oi.order_id IN (${ph})`,
      orderIds
    );

    const itemsByOrder = {};
    items.forEach(i => { (itemsByOrder[i.order_id] = itemsByOrder[i.order_id] || []).push(i); });

    return res.json(
      orders.map(o => ({ ...o, items: itemsByOrder[o.order_id] || [] }))
    );
  } catch (err) {
    console.error("trackOrders:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── Track by Tracking Number ──────────────────────────────────────────────────

const trackOrderByTracking = async (req, res) => {
  const raw = (req.query.trackingNumber || req.body?.trackingNumber || "").trim();
  if (!raw) return res.status(400).json({ message: "trackingNumber required" });

  try {
    const { rows } = await query(
      `SELECT o.*, s.shipping_name, s.shipping_address, s.shipping_city,
              s.shipping_state, s.shipping_country, s.shipping_phone, s.shipping_method,
              s.shipping_date, p.payment_method
       FROM orders o
       LEFT JOIN shipments s ON s.shipment_id = o.shipment_id
       LEFT JOIN payments  p ON p.payment_id  = o.payment_id
       WHERE o.tracking_number ILIKE $1`,
      [raw.toUpperCase()]
    );
    if (!rows.length) return res.status(404).json({ message: "Order not found" });
    const order = rows[0];

    const { rows: items } = await query(
      `SELECT oi.*, pr.part_number, pr.condition AS product_condition
       FROM order_items oi
       LEFT JOIN products pr ON pr.product_id = oi.product_id
       WHERE oi.order_id = $1`,
      [order.order_id]
    );

    return res.json({ success: true, order: { ...order, items } });
  } catch (err) {
    console.error("trackOrderByTracking:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── Update Order Status (admin) ───────────────────────────────────────────────

const updateOrderStatus = async (req, res) => {
  const { order_id, order_status, leadTime, shippingMethod, shippingDate } = req.body;
  if (!order_id) return res.status(400).json({ error: "order_id required" });

  try {
    const sets  = ["updated_at = NOW()"];
    const vals  = [];
    let   i     = 1;

    if (order_status) { sets.push(`order_status = $${i++}`); vals.push(order_status); }
    if (leadTime)     {
      const d = new Date(leadTime);
      if (isNaN(d.getTime())) return res.status(400).json({ error: "Invalid leadTime" });
      sets.push(`leadtime = $${i++}`); vals.push(d);
    }

    vals.push(order_id);
    await query(`UPDATE orders SET ${sets.join(",")} WHERE order_id = $${i}`, vals);

    if (shippingMethod || shippingDate) {
      await query(
        `UPDATE shipments SET
          shipping_method = COALESCE($1, shipping_method),
          shipping_date   = COALESCE($2, shipping_date)
         WHERE shipment_id = (SELECT shipment_id FROM orders WHERE order_id = $3)`,
        [shippingMethod || null, shippingDate || null, order_id]
      );
    }

    // Email notification for key status changes
    if (order_status && ["PROCESSING","SHIPPED","DELIVERED","CANCELLED"].includes(order_status)) {
      const { rows } = await query(
        "SELECT email FROM orders WHERE order_id = $1", [order_id]
      );
      if (rows.length) {
        const { subject, html } = orderStatusUpdateTemplate({
          order: { orderId: order_id }, items: [], newStatus: order_status,
        });
        sendEmail(null, rows[0].email, subject, html).catch(console.error);
      }
    }

    return res.json({ message: "Order updated" });
  } catch (err) {
    console.error("updateOrderStatus:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── User Cancel Order ─────────────────────────────────────────────────────────

const userCancelOrder = async (req, res) => {
  const { orderId } = req.params;
  const userEmail   = req.user?.email;
  if (!userEmail) return res.status(401).json({ error: "Unauthenticated" });

  try {
    const { rows } = await query(
      "SELECT * FROM orders WHERE (order_id_str = $1 OR order_id::text = $1) AND email = $2",
      [orderId.trim(), userEmail.toLowerCase()]
    );
    if (!rows.length) return res.status(404).json({ error: "Order not found" });

    const order            = rows[0];
    const CANCELLABLE      = ["COD_PENDING", "PENDING", "PROCESSING"];
    if (!CANCELLABLE.includes(order.order_status))
      return res.status(400).json({ error: `Cannot cancel order in status: ${order.order_status}` });

    await query(
      "UPDATE orders SET order_status = 'CANCELLED', updated_at = NOW() WHERE order_id = $1",
      [order.order_id]
    );

    return res.json({ message: "Order cancelled" });
  } catch (err) {
    console.error("userCancelOrder:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── Invoice PDF ───────────────────────────────────────────────────────────────

const getInvoice = async (req, res) => {
  const rawId = (req.params.orderId || "").trim();
  if (!rawId) return res.status(400).send("Missing order ID");

  try {
    const { rows } = await query(
      `SELECT o.*, s.shipping_name, s.shipping_address, s.shipping_city,
              s.shipping_state, s.shipping_country
       FROM orders o
       LEFT JOIN shipments s ON s.shipment_id = o.shipment_id
       WHERE o.order_id_str = $1 OR o.order_id::text = $1`,
      [rawId]
    );
    if (!rows.length) return res.status(404).send("Order not found");
    const order = rows[0];

    const { rows: items } = await query(
      `SELECT oi.*, pr.part_number FROM order_items oi
       LEFT JOIN products pr ON pr.product_id = oi.product_id
       WHERE oi.order_id = $1`,
      [order.order_id]
    );

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="invoice-${rawId}.pdf"`);
    doc.pipe(res);

    doc.fontSize(20).text("Invoice", { align: "left" }).moveDown();
    doc.fontSize(12).text(`Order: ${order.order_id_str || order.order_id}`);
    doc.text(`Date: ${order.created_at}`);
    doc.text(`Email: ${order.email}`);
    doc.text(`Tracking: ${order.tracking_number || ""}`).moveDown();
    doc.fontSize(14).text("Shipping").fontSize(10);
    doc.text(`${order.shipping_name || ""}`);
    doc.text(`${order.shipping_address || ""}`);
    doc.text(`${order.shipping_city || ""} ${order.shipping_state || ""} ${order.shipping_country || ""}`).moveDown();

    doc.fontSize(12).text("Items").moveDown(0.5);
    items.forEach((it, idx) => {
      doc.fontSize(10).text(
        `${idx + 1}. ${it.part_number || it.product_name} — Qty: ${it.quantity} — $${parseFloat(it.price).toFixed(2)}`
      );
    });
    doc.moveDown();
    doc.text(`Subtotal: $${parseFloat(order.subtotal || 0).toFixed(2)}`);
    doc.text(`Shipping: $${parseFloat(order.shipping_cost || 0).toFixed(2)}`);
    doc.text(`Tax:      $${parseFloat(order.tax || 0).toFixed(2)}`);
    doc.text(`Total:    $${parseFloat(order.total_price || 0).toFixed(2)}`);

    doc.end();
  } catch (err) {
    console.error("getInvoice:", err.message);
    return res.status(500).send("Failed to generate invoice");
  }
};

// Deletion disabled – change status to CANCELLED instead
const deleteOrder = (_req, res) =>
  res.status(403).json({ message: "Order deletion is prohibited. Use CANCELLED status instead." });

module.exports = {
  checkout, getAllOrders, trackOrders, trackOrderByTracking,
  updateOrderStatus, userCancelOrder, deleteOrder, getInvoice,
};