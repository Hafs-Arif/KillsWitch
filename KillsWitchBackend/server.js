"use strict";
require("dotenv").config();

const express       = require("express");
const http          = require("http");
const cors          = require("cors");
const helmet        = require("helmet");
const rateLimit     = require("express-rate-limit");
const cookieParser  = require("cookie-parser");
const passport      = require("passport");
const crypto        = require("crypto");

// ── DB Connection (Consistent with Controllers) ───────────────────────────────
// Assumes ./config/db exports { query, transaction }
const { query, transaction } = require("./config/db");

// ── Passport & Socket Setup ───────────────────────────────────────────────────
const configurePassport = require("./config/passport");
const { setupSocket }   = require("./socket");
const messageCleanupService = require("./services/messageCleanupService");
const { initializeDatabase } = require("./config/initDb");
const { generateAccessToken, generateRefreshToken, getCookieOptions } = require("./utils/token");

// ── Routes (Fixed Typos) ─────────────────────────────────────────────────────
const authRoutes           = require("./routes/auth");
const productRoutes        = require("./routes/productRoutes");
const categoryRoutes       = require("./routes/categoryRoutes");
const uploadRoutes         = require("./routes/uploadRoutes");
const brandRoutes          = require("./routes/brandRoutes");
const orderRoutes          = require("./routes/orderRoutes");
const activityLogRoutes    = require("./routes/activityLogsRoutes"); 
const adminRequestRoutes   = require("./routes/adminRequestRoutes");
const quoteRoutes          = require("./routes/quoteRoutes");        
const contactRoutes        = require("./routes/contactRoutes");      
const newsLetterRoutes     = require("./routes/newsLetterRoutes");
const stripeRoutes         = require("./routes/stripeRoutes");
const reviewRoutes         = require("./routes/reviewRoutes");
const cartRoutes           = require("./routes/cartRoutes");
const chatRoutes           = require("./routes/chatRoutes");
const chatbotRoutes        = require("./routes/chatbotRoutes");
const cookieConsentRoutes  = require("./routes/cookieConsentRoutes");
const addressRoutes        = require("./routes/addressRoutes");
const analyticsRoutes      = require("./routes/analyticsRoutes");
const couponRoutes         = require("./routes/couponRoutes");

// ── App Initialization ───────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);

// ── Security Headers ──────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    // Disable default CSP for simplicity; enable explicitly if serving inline HTML
    contentSecurityPolicy: false, 
  })
);

// ── CORS – Restrict to Known Origins ──────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || process.env.WEB_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // Allow server-to-server
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many authentication attempts, please try again later." },
});

app.use(globalLimiter);

// ── Body Parsers ──────────────────────────────────────────────────────────────
// IMPORTANT: Stripe webhook requires raw body before generic JSON parsing
app.use("/stripe/webhook", express.raw({ type: "application/json" }));

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());

// ── Static Files ──────────────────────────────────────────────────────────────
app.use("/uploads", express.static("uploads"));

// ── Passport Configuration ────────────────────────────────────────────────────
configurePassport();
app.use(passport.initialize());

// ── Route Registration ────────────────────────────────────────────────────────
app.use("/auth",           authLimiter, authRoutes);
app.use("/categories",     categoryRoutes);
app.use("/data",           uploadRoutes);
app.use("/activity-logs",  activityLogRoutes);
app.use("/products",       productRoutes);
app.use("/admin-requests", adminRequestRoutes);
app.use("/contact",        contactRoutes);
app.use("/brand",          brandRoutes);
app.use("/orders",         orderRoutes);
app.use("/newsletter",     newsLetterRoutes);
app.use("/quotes",         quoteRoutes);
app.use("/stripe",         stripeRoutes);
app.use("/reviews",        reviewRoutes);
app.use("/cart",           cartRoutes);
app.use("/chat",           chatRoutes);
app.use("/chatbot",        chatbotRoutes);
app.use("/cookie-consent", cookieConsentRoutes);
app.use("/addresses",      addressRoutes);
app.use("/analytics",      analyticsRoutes);
app.use("/coupons",        couponRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/", (_req, res) => res.json({ status: "ok" }));

// ── Google OAuth Callback ─────────────────────────────────────────────────────
// Uses raw SQL for session creation (consistent with authController)
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  async (req, res) => {
    try {
      let user = req.user;
      if (!user?.id) {
        const email = user?.email;
        if (email) {
          const { rows } = await query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
          if (rows[0]) user = { ...user, id: rows[0].id };
        }
      }
      if (!user?.id) throw new Error("User not found after Google OAuth");

      const accessToken  = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      
      // Create Session using raw SQL (No ORM)
      const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await query(
        `INSERT INTO sessions (user_id, token_hash, user_agent, ip_address, expires_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [user.id, tokenHash, req.headers["user-agent"].slice(0, 512), req.ip, expiresAt]
      );

      const accessTokenDuration = user.role === "admin" ? 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000;

      // HTTP-only cookies (tokens in URL are insecure)
      res
        .cookie("access_token", accessToken, getCookieOptions(accessTokenDuration))
        .cookie("refresh_token", refreshToken, getCookieOptions(30 * 24 * 60 * 60 * 1000))
        .redirect(`${process.env.WEB_ORIGIN}/oauth-success`);

      // Log Activity
      query(
        `INSERT INTO activity_logs (activity, user_email, details, created_at, updated_at)
         VALUES ('Google OAuth Login', $1, $2, NOW(), NOW())`,
        [user.email, JSON.stringify({ user_name: user.name, email: user.email })]
      ).catch((err) => console.error("Activity log failed:", err.message));

    } catch (error) {
      console.error("Google OAuth callback error:", error.message);
      res.redirect(`${process.env.WEB_ORIGIN}/login?error=oauth_failed`);
    }
  }
);

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  // Only log details in development
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message });
  } else {
    console.error(err);
    res.status(err.status || 500).json({ error: "Internal server error" });
  }
});

// ── Graceful Shutdown (Good Practice) ─────────────────────────────────────────
const gracefulShutdown = () => {
  console.log("Shutting down gracefully...");
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// ── Startup ───────────────────────────────────────────────────────────────────
async function start() {
  try {
    // Initialize database schema
    console.log("Starting application...");
    await initializeDatabase();
    
    setupSocket(server);
    messageCleanupService.start();
    
    const PORT = process.env.PORT || 8000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
}

start();