/**
 * Database Initialization Script
 * Creates all necessary tables if they don't exist
 */

const { query } = require("./db");

async function initializeDatabase() {
  try {
    console.log("[DB INIT] Starting database initialization...");

    // ─── USERS TABLE ─────────────────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        phoneno VARCHAR(20),
        google_id VARCHAR(255),
        is_google_auth BOOLEAN DEFAULT false,
        same_shipping_billing_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("[DB INIT] ✓ users table ready");

    // ─── SESSIONS TABLE ──────────────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) UNIQUE NOT NULL,
        user_agent VARCHAR(512),
        ip_address VARCHAR(50),
        revoked_at TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("[DB INIT] ✓ sessions table ready");

    // ─── PASSWORD RESETS TABLE ──────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp VARCHAR(10) NOT NULL,
        expire_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("[DB INIT] ✓ password_resets table ready");

    // ─── ACTIVITY LOGS TABLE ────────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        activity VARCHAR(255),
        user_email VARCHAR(255),
        details JSONB,
        order_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("[DB INIT] ✓ activity_logs table ready");

    // ─── ADDRESSES TABLE ────────────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS addresses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50),
        name VARCHAR(255),
        phone VARCHAR(20),
        address VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(100),
        country VARCHAR(100),
        email VARCHAR(255),
        company VARCHAR(255),
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("[DB INIT] ✓ addresses table ready");

    // ─── ADMIN REQUESTS TABLE ───────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS admin_requests (
        admin_request_id SERIAL PRIMARY KEY,
        IsApproved BOOLEAN DEFAULT false,
        user_email VARCHAR(255),
        order_id VARCHAR(255),
        updatedshippingAddress VARCHAR(255),
        updatedshippingPhone VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("[DB INIT] ✓ admin_requests table ready");

    // ─── CATEGORIES TABLE ───────────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        product_category_id VARCHAR(255) UNIQUE,
        category_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("[DB INIT] ✓ categories table ready");

    // ─── SUBCATEGORIES TABLE ────────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS subcategories (
        id SERIAL PRIMARY KEY,
        sub_category_id VARCHAR(255) UNIQUE,
        sub_category_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("[DB INIT] ✓ subcategories table ready");

    // ─── BRANDS TABLE ───────────────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS brands (
        id SERIAL PRIMARY KEY,
        brand_id VARCHAR(255) UNIQUE,
        brand_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("[DB INIT] ✓ brands table ready");

    // ─── BRAND CATEGORIES TABLE ─────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS brand_categories (
        id VARCHAR(255) PRIMARY KEY,
        brand_id VARCHAR(255),
        category_id VARCHAR(255),
        sub_category_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("[DB INIT] ✓ brand_categories table ready");

    // ─── PRODUCTS TABLE ─────────────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        product_id VARCHAR(255) UNIQUE,
        part_number VARCHAR(255),
        brandcategory_id VARCHAR(255),
        image VARCHAR(255),
        condition VARCHAR(100),
        sub_condition VARCHAR(100),
        price DECIMAL(10, 2),
        quantity INTEGER,
        short_description TEXT,
        long_description TEXT,
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("[DB INIT] ✓ products table ready");

    // ─── PRODUCT IMAGES TABLE ───────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id SERIAL PRIMARY KEY,
        url TEXT NOT NULL,
        product_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("[DB INIT] ✓ product_images table ready");

    // ─── ORDERS TABLE ───────────────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(255) UNIQUE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        email VARCHAR(255),
        amount DECIMAL(10, 2),
        payment_intent_id VARCHAR(255),
        payment_status VARCHAR(50),
        order_status VARCHAR(50),
        tracking_number VARCHAR(255),
        shipping_name VARCHAR(255),
        shipping_method VARCHAR(100),
        shipping_company VARCHAR(100),
        shipping_phone VARCHAR(20),
        shipping_address VARCHAR(255),
        shipping_city VARCHAR(100),
        shipping_state VARCHAR(100),
        shipping_country VARCHAR(100),
        billing_name VARCHAR(255),
        billing_company VARCHAR(100),
        billing_phone VARCHAR(20),
        billing_address VARCHAR(255),
        billing_city VARCHAR(100),
        billing_state VARCHAR(100),
        billing_country VARCHAR(100),
        subtotal DECIMAL(10, 2),
        shipping_cost DECIMAL(10, 2),
        tax DECIMAL(10, 2),
        total_price DECIMAL(10, 2),
        is_full_cart BOOLEAN,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("[DB INIT] ✓ orders table ready");

    // ─── ORDER ITEMS TABLE ──────────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(255),
        product_id VARCHAR(255),
        product_name VARCHAR(255),
        price DECIMAL(10, 2),
        quantity INTEGER,
        condition VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("[DB INIT] ✓ order_items table ready");

    // ─── CARTS TABLE ────────────────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS carts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        session_id VARCHAR(255),
        status VARCHAR(50),
        total_items INTEGER,
        total_amount DECIMAL(10, 2),
        currency VARCHAR(10),
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("[DB INIT] ✓ carts table ready");

    // ─── CART ITEMS TABLE ───────────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        cart_id INTEGER REFERENCES carts(id) ON DELETE CASCADE,
        product_id VARCHAR(255),
        quantity INTEGER,
        price DECIMAL(10, 2),
        total_price DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("[DB INIT] ✓ cart_items table ready");

    // ─── REVIEWS TABLE ──────────────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        rating INTEGER,
        comment TEXT,
        reviewer_name VARCHAR(255),
        product_id VARCHAR(255),
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("[DB INIT] ✓ reviews table ready");

    // ─── QUOTES TABLE ───────────────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS quotes (
        quote_id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255),
        phoneno VARCHAR(20),
        message TEXT,
        productcode VARCHAR(255),
        quantity INTEGER,
        condition VARCHAR(100),
        target_price DECIMAL(10, 2),
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("[DB INIT] ✓ quotes table ready");

    // ─── CONTACTS TABLE ─────────────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        message TEXT,
        phoneno VARCHAR(20),
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("[DB INIT] ✓ contacts table ready");

    // ─── NEWSLETTERS TABLE ──────────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS newsletters (
        newsletter_id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("[DB INIT] ✓ newsletters table ready");

    // ─── PAYMENTS TABLE ─────────────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS payments (
        payment_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        payment_method VARCHAR(100),
        amount DECIMAL(10, 2),
        payment_name VARCHAR(255),
        card_expire VARCHAR(10),
        card_cvc VARCHAR(10),
        card_number VARCHAR(50),
        payment_status VARCHAR(50),
        deleted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("[DB INIT] ✓ payments table ready");

    // ─── SHIPMENTS TABLE ────────────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS shipments (
        id SERIAL PRIMARY KEY,
        shipment_id VARCHAR(255),
        shipping_name VARCHAR(255),
        shipping_phone VARCHAR(20),
        shipping_method VARCHAR(100),
        shipping_address VARCHAR(255),
        shipping_date DATE,
        shipping_city VARCHAR(100),
        shipping_state VARCHAR(100),
        shipping_country VARCHAR(100),
        shipping_company VARCHAR(100),
        billing_address VARCHAR(255),
        billing_name VARCHAR(255),
        billing_company VARCHAR(100),
        billing_phone VARCHAR(20),
        billing_city VARCHAR(100),
        billing_state VARCHAR(100),
        billing_country VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("[DB INIT] ✓ shipments table ready");

    // ─── COOKIE CONSENTS TABLE ──────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS cookie_consents (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255),
        ip_address VARCHAR(50),
        user_agent VARCHAR(512),
        consent_given BOOLEAN,
        consent_type VARCHAR(100),
        analytics_cookies BOOLEAN DEFAULT false,
        functional_cookies BOOLEAN DEFAULT true,
        marketing_cookies BOOLEAN DEFAULT false,
        consent_date TIMESTAMP,
        country VARCHAR(100),
        privacy_policy_version VARCHAR(10),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("[DB INIT] ✓ cookie_consents table ready");

    // ─── COUPONS TABLE ──────────────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE,
        description TEXT,
        discount_type VARCHAR(50),
        discount_value DECIMAL(10, 2),
        min_purchase_amount DECIMAL(10, 2),
        max_uses INTEGER,
        uses_count INTEGER DEFAULT 0,
        expires_at TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("[DB INIT] ✓ coupons table ready");

    // ─── CHAT MESSAGES TABLE ────────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        "senderEmail" VARCHAR(255),
        "receiverEmail" VARCHAR(255),
        message TEXT,
        "isOfflineMessage" BOOLEAN DEFAULT false,
        "messageHash" VARCHAR(255),
        "deliveredAt" TIMESTAMP,
        "seenByAdmin" BOOLEAN DEFAULT false,
        "seenAt" TIMESTAMP,
        "storedAt" TIMESTAMP DEFAULT NOW(),
        "createdAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("[DB INIT] ✓ chat_messages table ready");

    // ─── CREATE INDEXES FOR PERFORMANCE ─────────────────────────────────────
    await query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_activity_logs_user_email ON activity_logs(user_email)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_products_product_id ON products(product_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_chat_messages_emails ON chat_messages("senderEmail", "receiverEmail")`);
    await query(`CREATE INDEX IF NOT EXISTS idx_chat_messages_stored_at ON chat_messages("storedAt")`);
    console.log("[DB INIT] ✓ Indexes created");

    console.log("[DB INIT] ✅ Database initialization completed successfully");
    return true;
  } catch (error) {
    console.error("[DB INIT] ❌ Database initialization failed:", error.message);
    // Don't throw, just log - allow app to continue with warning
    return false;
  }
}

module.exports = { initializeDatabase };
