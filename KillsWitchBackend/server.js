require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');

const configurePassport = require("./config/passport");
const db = require("./models");
const { setupSocket } = require("./socket");
const Sequelize = require('sequelize');
const messageCleanupService = require("./services/messageCleanupService");
const { generateAccessToken, generateRefreshToken, getCookieOptions } = require("./utils/token");

// routes
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const brandRoutes = require("./routes/brandRoutes");
const orderRoutes = require("./routes/orderRoutes");
const activityLogRoutes = require("./routes/acitivityLogsRoutes");
const adminRequestRoutes = require("./routes/adminRequestRoutes");
const quoteRoutes = require("./routes/qouteRoutes");
const contactRoutes = require("./routes/contantRoutes");
const newsLetterRoutes = require("./routes/newsLetterRoutes");
const stripeRoutes = require("./routes/stripeRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const cartRoutes = require("./routes/cartRoutes");
const chatRoutes = require("./routes/chatRoutes"); 
const chatbotRoutes = require("./routes/chatbotRoutes");
const cookieConsentRoutes = require("./routes/cookieConsentRoutes");
const addressRoutes = require("./routes/addressRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const couponRoutes = require("./routes/couponRoutes");

const app = express();
const server = http.createServer(app);
setupSocket(server);

// middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:5173'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/uploads", express.static("uploads"));

app.use("/stripe/webhook", express.raw({ type: "application/json" }));

configurePassport();
app.use(passport.initialize());

// routes
app.use("/categories", categoryRoutes);
app.use("/data", uploadRoutes);
app.use("/activity-logs", activityLogRoutes);
app.use("/products", productRoutes);
app.use("/auth", authRoutes);
app.use("/admin-requests", adminRequestRoutes);
app.use("/contact", contactRoutes);
app.use("/brand", brandRoutes);
app.use("/orders", orderRoutes);
app.use("/newsletter", newsLetterRoutes);
app.use("/quotes", quoteRoutes);
app.use("/stripe", stripeRoutes);
app.use("/reviews", reviewRoutes);
app.use("/cart", cartRoutes);
app.use("/chat", chatRoutes);
app.use("/chatbot", chatbotRoutes);
app.use("/cookie-consent", cookieConsentRoutes);
app.use("/addresses", addressRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/coupons", couponRoutes);

// health
app.get("/", (req, res) => res.send("Hello World!"));
// Test protected route
// Google OAuth
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Helper functions for Google OAuth
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function parseUa(req) {
  return (req.headers['user-agent'] || '').slice(0, 512);
} 

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { 
    session: false,
    failureRedirect: "/login",
  }),
  async (req, res) => {
    try {
      let user = req.user;

      // if for some reason passport returned a plain object instead of a Sequelize
      // instance, fetch/ensure the record is present before issuing tokens.
      if (!user || !user.id) {
        console.warn("Google callback: req.user missing or no id, attempting lookup by email");
        const email = req.user && req.user.email;
        if (email) {
          user = await db.User.findOne({ where: { email } });
        }
      }

      console.log("Google callback user:", user && { id: user.id, email: user.email });

      // Generate proper tokens using the same system as regular login
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      const tokenHash = hashToken(refreshToken);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Create session in database
      await db.Session.create({
        userId: user.id,
        tokenHash,
        userAgent: parseUa(req),
        ipAddress: req.ip,
        expiresAt
      });

      // Admin sessions last 1 day, regular users 2 hours
      const accessTokenDuration = user.role === 'admin' ? 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000;
      
      // Set HTTP-only cookies and redirect with token for frontend verification
      res
        .cookie('access_token', accessToken, getCookieOptions(accessTokenDuration))
        .cookie('refresh_token', refreshToken, getCookieOptions(30 * 24 * 60 * 60 * 1000))
        .redirect(`${process.env.WEB_ORIGIN}?token=${accessToken}`);
        
      // Log the activity
      await db.ActivityLog.create({
        user_email: user.email,
        activity: "Google OAuth Login",
        details: {
          user_name: user.name,
          email: user.email,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      res.redirect(`${process.env.WEB_ORIGIN}/login?error=oauth_failed`);
    }
  }
);

// log OpenAI key presence (not value)
if (process.env.OPENAI_API_KEY) {
  console.log("OpenAI API key detected - chatbot will use ChatGPT for responses.");
} else {
  console.log("No OpenAI API key set, chatbot will use fallback rules only.");
}

// DB sync (no alter by default)
const SHOULD_SYNC_ALTER = process.env.DB_SYNC_ALTER === "true";
db.sequelize
  .sync({ alter: SHOULD_SYNC_ALTER, logging: false })
  .then(() => db.ChatMessage.sync())
  .then(async () => {
    console.log("Database synced");
    // Ensure sameShippingBillingDefault column exists even if migration hasn't run
    try {
      const qi = db.sequelize.getQueryInterface();
      const tableDesc = await qi.describeTable('users');
      if (!tableDesc.sameShippingBillingDefault) {
        console.log('Adding missing sameShippingBillingDefault column to users');
        await qi.addColumn('users', 'sameShippingBillingDefault', {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false,
        });
      }
    } catch (err) {
      console.error('Error ensuring users column:', err);
    }

    // Start message cleanup service after DB is ready
    messageCleanupService.start();
  })
  .catch((err) => console.error("Sync error:", err));

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
