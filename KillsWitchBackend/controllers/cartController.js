// controllers/cartController.js  –  raw SQL (pg)
"use strict";

const { query, transaction } = require("../config/db");

// ── Helpers ───────────────────────────────────────────────────────────────────

async function recalcCart(tx, cartId) {
  await tx(
    `UPDATE carts
     SET total_items  = (SELECT COALESCE(SUM(quantity), 0)             FROM cart_items WHERE cart_id = $1),
         total_amount = (SELECT COALESCE(SUM(quantity * price), 0.00)  FROM cart_items WHERE cart_id = $1),
         updated_at   = NOW()
     WHERE id = $1`,
    [cartId]
  );
}

async function getOrCreateCartRecord(userId, sessionId, tx) {
  const where  = userId ? "user_id = $1" : "session_id = $1";
  const param  = userId || sessionId;
  const { rows } = await tx(
    `SELECT id FROM carts WHERE ${where} AND status = 'active' LIMIT 1`, [param]
  );
  if (rows.length) return rows[0].id;

  const { rows: created } = await tx(
    `INSERT INTO carts (user_id, session_id, status, total_items, total_amount, expires_at, created_at, updated_at)
     VALUES ($1, $2, 'active', 0, 0.00, NOW() + INTERVAL '30 days', NOW(), NOW())
     RETURNING id`,
    [userId || null, sessionId || null]
  );
  return created[0].id;
}

function normalizeItems(items) {
  return items.map(ci => ({
    id:          ci.id,
    cart_id:     ci.cart_id,
    product_id:  ci.product_id,
    quantity:    ci.quantity,
    price:       ci.price,
    total_price: ci.total_price,
    notes:       ci.notes,
    // product fields
    product_part_number:       ci.part_number,
    product_image:             ci.image,
    product_price:             ci.price,
    product_short_description: ci.short_description,
    product_condition:         ci.condition,
    product_status:            ci.status,
    brand_name:                ci.brand_name,
    category_name:             ci.category_name,
    slug:                      ci.slug,
    sale_price:                ci.sale_price,
    video_url:                 ci.video_url,
  }));
}

async function fetchCartWithItems(cartId) {
  const { rows: [cart] } = await query(
    "SELECT * FROM carts WHERE id = $1", [cartId]
  );
  if (!cart) return null;

  const { rows: items } = await query(
    `SELECT ci.*,
            p.part_number, p.image, p.short_description, p.condition, p.status,
            p.sale_price, p.video_url, p.slug,
            b.brand_name,
            c.category_name
     FROM cart_items ci
     LEFT JOIN products     p  ON p.product_id            = ci.product_id
     LEFT JOIN brandcategory bc ON bc.id                  = p.brandcategory_id
     LEFT JOIN brands        b  ON b.brand_id             = bc.brand_id
     LEFT JOIN categories    c  ON c.product_category_id  = bc.category_id
     WHERE ci.cart_id = $1`,
    [cartId]
  );

  return { ...cart, items: normalizeItems(items) };
}

// ── Get or create cart ────────────────────────────────────────────────────────
exports.getOrCreateCart = async (req, res) => {
  const userId    = req.user?.id || null;
  const sessionId = req.body?.sessionId || null;

  if (!userId && !sessionId)
    return res.status(400).json({ success: false, message: "Authentication or sessionId required" });

  try {
    let cartId;
    await transaction(async (tx) => {
      cartId = await getOrCreateCartRecord(userId, sessionId, tx);
      await recalcCart(tx, cartId);
    });
    return res.json({ success: true, data: await fetchCartWithItems(cartId) });
  } catch (err) {
    console.error("getOrCreateCart:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── Get cart (authenticated) ──────────────────────────────────────────────────
exports.getCart = async (req, res) => {
  try {
    const { rows } = await query(
      "SELECT id FROM carts WHERE user_id = $1 AND status = 'active' LIMIT 1",
      [req.user.id]
    );
    if (!rows.length) return res.json({ success: true, data: { total_items: 0, total_amount: 0, items: [] } });

    const cart = await fetchCartWithItems(rows[0].id);
    return res.json({ success: true, data: cart });
  } catch (err) {
    console.error("getCart:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── Get cart summary ──────────────────────────────────────────────────────────
exports.getCartSummary = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT c.id, c.total_items, c.total_amount
       FROM carts c WHERE c.user_id = $1 AND c.status = 'active' LIMIT 1`,
      [req.user.id]
    );
    if (!rows.length) return res.json({ success: true, data: { total_items: 0, total_amount: 0, items: [] } });

    const cartId = rows[0].id;
    const { rows: items } = await query(
      `SELECT ci.id, ci.quantity, ci.price, ci.total_price,
              p.part_number, p.image
       FROM cart_items ci
       LEFT JOIN products p ON p.product_id = ci.product_id
       WHERE ci.cart_id = $1
       LIMIT 3`,
      [cartId]
    );

    const { rows: total } = await query("SELECT COUNT(*) AS n FROM cart_items WHERE cart_id = $1", [cartId]);

    return res.json({
      success: true,
      data: {
        total_items:  rows[0].total_items,
        total_amount: rows[0].total_amount,
        items,
        hasMore: parseInt(total[0].n, 10) > 3,
      },
    });
  } catch (err) {
    console.error("getCartSummary:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── Add item to cart ──────────────────────────────────────────────────────────
exports.addToCart = async (req, res) => {
  const userId    = req.user?.id || null;
  const { sessionId, productId, quantity = 1, notes } = req.body;

  if (!productId || quantity < 1)
    return res.status(400).json({ success: false, message: "productId and valid quantity required" });

  try {
    const { rows: prods } = await query(
      "SELECT product_id, price, quantity AS stock FROM products WHERE product_id = $1",
      [parseInt(productId, 10)]
    );
    if (!prods.length) return res.status(404).json({ success: false, message: "Product not found" });
    const product = prods[0];

    await transaction(async (tx) => {
      const cartId = await getOrCreateCartRecord(userId, sessionId, tx);

      const { rows: existing } = await tx(
        "SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2",
        [cartId, product.product_id]
      );

      if (existing.length) {
        const newQty = existing[0].quantity + parseInt(quantity, 10);
        if (newQty > product.stock)
          throw Object.assign(new Error(`Only ${product.stock - existing[0].quantity} more available`), { status: 400 });

        await tx(
          `UPDATE cart_items SET quantity=$1, total_price=$2, updated_at=NOW() WHERE id=$3`,
          [newQty, newQty * product.price, existing[0].id]
        );
      } else {
        const qty = parseInt(quantity, 10);
        await tx(
          `INSERT INTO cart_items (cart_id, product_id, quantity, price, total_price, notes, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())`,
          [cartId, product.product_id, qty, product.price, qty * product.price, notes || null]
        );
      }

      await recalcCart(tx, cartId);
    });

    return res.json({ success: true, message: "Item added to cart" });
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ success: false, message: err.message });
    console.error("addToCart:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── Update cart item quantity ─────────────────────────────────────────────────
exports.updateCartItem = async (req, res) => {
  const itemId  = parseInt(req.params.itemId, 10);
  const { quantity, notes } = req.body;

  if (!quantity || quantity < 1)
    return res.status(400).json({ success: false, message: "Valid quantity required" });

  try {
    await transaction(async (tx) => {
      // Verify item belongs to this user's active cart
      const { rows } = await tx(
        `SELECT ci.id, ci.price, c.id AS cart_id, p.quantity AS stock
         FROM cart_items ci
         JOIN carts    c ON c.id          = ci.cart_id AND c.user_id = $1 AND c.status = 'active'
         JOIN products p ON p.product_id  = ci.product_id
         WHERE ci.id = $2`,
        [req.user.id, itemId]
      );
      if (!rows.length) throw Object.assign(new Error("Cart item not found"), { status: 404 });

      const item = rows[0];
      if (quantity > item.stock)
        throw Object.assign(new Error(`Only ${item.stock} in stock`), { status: 400 });

      const sets = ["quantity=$1", "total_price=$2", "updated_at=NOW()"];
      const vals = [quantity, quantity * item.price];
      if (notes !== undefined) { sets.push(`notes=$${vals.length + 1}`); vals.push(notes); }
      vals.push(itemId);

      await tx(`UPDATE cart_items SET ${sets.join(",")} WHERE id=$${vals.length}`, vals);
      await recalcCart(tx, item.cart_id);
    });

    return res.json({ success: true, message: "Cart item updated" });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    console.error("updateCartItem:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── Remove item from cart ─────────────────────────────────────────────────────
exports.removeFromCart = async (req, res) => {
  const itemId = parseInt(req.params.itemId, 10);

  try {
    await transaction(async (tx) => {
      const { rows } = await tx(
        `SELECT ci.cart_id FROM cart_items ci
         JOIN carts c ON c.id = ci.cart_id AND c.user_id = $1 AND c.status = 'active'
         WHERE ci.id = $2`,
        [req.user.id, itemId]
      );
      if (!rows.length) throw Object.assign(new Error("Cart item not found"), { status: 404 });

      const cartId = rows[0].cart_id;
      await tx("DELETE FROM cart_items WHERE id = $1", [itemId]);
      await recalcCart(tx, cartId);
    });

    return res.json({ success: true, message: "Item removed" });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    console.error("removeFromCart:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── Clear entire cart ─────────────────────────────────────────────────────────
exports.clearCart = async (req, res) => {
  try {
    const { rows } = await query(
      "SELECT id FROM carts WHERE user_id = $1 AND status = 'active' LIMIT 1",
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: "Cart not found" });

    await transaction(async (tx) => {
      await tx("DELETE FROM cart_items WHERE cart_id = $1", [rows[0].id]);
      await recalcCart(tx, rows[0].id);
    });

    return res.json({ success: true, message: "Cart cleared" });
  } catch (err) {
    console.error("clearCart:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── Merge guest cart into user cart ──────────────────────────────────────────
exports.mergeCarts = async (req, res) => {
  const { guestSessionId } = req.body;
  if (!guestSessionId) return res.status(400).json({ success: false, message: "guestSessionId required" });

  try {
    await transaction(async (tx) => {
      const { rows: guestRows } = await tx(
        "SELECT id FROM carts WHERE session_id = $1 AND status = 'active' LIMIT 1",
        [guestSessionId]
      );
      if (!guestRows.length) return; // nothing to merge

      const guestCartId = guestRows[0].id;
      const { rows: guestItems } = await tx(
        "SELECT * FROM cart_items WHERE cart_id = $1", [guestCartId]
      );
      if (!guestItems.length) return;

      const userCartId = await getOrCreateCartRecord(req.user.id, null, tx);

      for (const gi of guestItems) {
        const { rows: existing } = await tx(
          "SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2",
          [userCartId, gi.product_id]
        );
        if (existing.length) {
          const newQty = existing[0].quantity + gi.quantity;
          await tx(
            "UPDATE cart_items SET quantity=$1, total_price=$2, updated_at=NOW() WHERE id=$3",
            [newQty, newQty * gi.price, existing[0].id]
          );
        } else {
          await tx(
            `INSERT INTO cart_items (cart_id, product_id, quantity, price, total_price, notes, created_at, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())`,
            [userCartId, gi.product_id, gi.quantity, gi.price, gi.total_price, gi.notes]
          );
        }
      }

      // Delete guest cart
      await tx("DELETE FROM cart_items WHERE cart_id = $1", [guestCartId]);
      await tx("DELETE FROM carts WHERE id = $1", [guestCartId]);
      await recalcCart(tx, userCartId);
    });

    return res.json({ success: true, message: "Carts merged" });
  } catch (err) {
    console.error("mergeCarts:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};