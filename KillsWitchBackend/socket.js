// socket.js
"use strict";

const { Server } = require("socket.io");
const { ChatMessage, User } = require("./models");
const crypto = require("crypto");

// ── Helpers ───────────────────────────────────────────────────────────────────

const generateMessageHash = (senderEmail, receiverEmail, message, timestamp) => {
  const data = `${senderEmail}:${receiverEmail || "admin"}:${message}:${timestamp}`;
  return crypto.createHash("sha256").update(data).digest("hex"); // SHA-256 > MD5
};

// Load admin emails dynamically from the database instead of hardcoding them
async function getAdminEmails() {
  try {
    const admins = await User.findAll({ where: { role: "admin" }, attributes: ["email"] });
    return admins.map((u) => u.email);
  } catch {
    return [];
  }
}

// ── Setup ─────────────────────────────────────────────────────────────────────

function setupSocket(server) {
  const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || process.env.WEB_ORIGIN || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  const io = new Server(server, {
    cors: {
      origin: ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : false,
      credentials: true,
    },
  });

  /** email → socket */
  const connectedUsers  = new Map();
  /** adminEmail → socket */
  const connectedAdmins = new Map();
  /** adminEmail → Message[] */
  const offlineMessages = new Map();

  io.on("connection", (socket) => {
    console.log(`[Socket] ${socket.id} connected`);

    // ── Identify ────────────────────────────────────────────────────────────
    socket.on("identify", async (payload) => {
      let email   = typeof payload === "string" ? payload : payload?.email || payload?.userEmail;
      let role    = typeof payload === "object"  ? (payload.role || "user")    : "user";
      let isGuest = typeof payload === "object"  ? (payload.isGuest || false)  : false;

      if (!email) {
        console.warn("[Socket] identify: no email provided");
        return;
      }

      // SECURITY: sanitise email string
      email = String(email).trim().toLowerCase().slice(0, 254);

      connectedUsers.set(email, socket);

      if (role === "admin") {
        connectedAdmins.set(email, socket);
        console.log(`[Socket] Admin ${email} online. Total admins: ${connectedAdmins.size}`);

        // Deliver queued offline messages
        const pending = offlineMessages.get(email) || [];
        if (pending.length) {
          console.log(`[Socket] Delivering ${pending.length} offline messages to ${email}`);
          pending.forEach((msg) => socket.emit("message", msg));
          offlineMessages.delete(email);
        }
      } else {
        console.log(`[Socket] User ${email} connected (guest=${isGuest})`);
      }
    });

    // ── Send Message ────────────────────────────────────────────────────────
    socket.on("sendMessage", async ({ senderEmail, receiverEmail, message, timestamp }) => {
      try {
        if (!senderEmail || !message) {
          return socket.emit("error", { message: "Missing required fields" });
        }

        // Sanitise inputs
        const cleanSender   = String(senderEmail).trim().toLowerCase().slice(0, 254);
        const cleanReceiver = receiverEmail ? String(receiverEmail).trim().toLowerCase().slice(0, 254) : null;
        const cleanMessage  = String(message).trim().slice(0, 4000);
        const ts            = timestamp || new Date().toISOString();

        const messageHash = generateMessageHash(cleanSender, cleanReceiver, cleanMessage, ts);

        // Deduplication
        const existing = await ChatMessage.findOne({ where: { messageHash } });
        if (existing) return; // silently discard duplicate

        const saved = await ChatMessage.create({
          senderEmail:   cleanSender,
          receiverEmail: cleanReceiver || "admin",
          message:       cleanMessage,
          messageHash,
        });

        const toEmit = { ...saved.toJSON(), timestamp: ts };

        const isToAdmin =
          !cleanReceiver ||
          cleanReceiver === "admin" ||
          cleanReceiver.includes("admin");

        if (isToAdmin) {
          if (connectedAdmins.size > 0) {
            for (const [adminEmail, adminSocket] of connectedAdmins.entries()) {
              if (adminSocket !== socket) {
                adminSocket.emit("message", { ...toEmit, receiverEmail: adminEmail });
              }
            }
          } else {
            // No admins online → persist offline and queue in memory
            console.log("[Socket] No admins online – storing offline message");
            await ChatMessage.upsert({ ...saved.toJSON(), isOfflineMessage: true });

            // SECURITY FIX: dynamically load admin emails from DB instead of hardcoded list
            const adminEmails = await getAdminEmails();
            adminEmails.forEach((adminEmail) => {
              if (!offlineMessages.has(adminEmail)) offlineMessages.set(adminEmail, []);
              offlineMessages.get(adminEmail).push({ ...toEmit, receiverEmail: adminEmail, isOfflineMessage: true });
            });
          }
        } else {
          const receiverSocket = connectedUsers.get(cleanReceiver);
          if (receiverSocket && receiverSocket !== socket) {
            receiverSocket.emit("message", toEmit);
          }
        }
      } catch (err) {
        console.error("[Socket] sendMessage error:", err.message);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // ── Disconnect ──────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      for (const [email, sock] of connectedUsers.entries()) {
        if (sock === socket) {
          connectedUsers.delete(email);
          connectedAdmins.delete(email);
          console.log(`[Socket] ${email} disconnected`);
          break;
        }
      }
    });
  });
}

module.exports = { setupSocket };