// controllers/chatController.js  –  raw SQL (pg)
"use strict";

const { query }  = require("../config/db");
 
const messageCleanupService = require("../services/messageCleanupService");

const getAdmins = async (_req, res) => {
  try {
    const { rows } = await query(
      "SELECT id, email, name FROM users WHERE role = 'admin' ORDER BY name"
    );
    return res.json(rows);
  } catch (err) {
    console.error("getAdmins:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getConversations = async (req, res) => {
  const { adminEmail } = req.query;
  if (!adminEmail) return res.status(400).json({ error: "adminEmail is required" });

  try {
    const { rows } = await query(
      `SELECT DISTINCT ON (other_party)
         CASE
           WHEN "senderEmail" = $1 THEN "receiverEmail"
           ELSE "senderEmail"
         END AS other_party,
         message AS last_message,
         "createdAt" AS last_message_time
       FROM chat_messages
       WHERE "senderEmail" = $1 OR "receiverEmail" = $1 OR "receiverEmail" = 'admin'
       ORDER BY other_party, "createdAt" DESC`,
      [adminEmail]
    );

    const conversations = rows
      .filter(r => r.other_party && r.other_party !== adminEmail && r.other_party !== "admin")
      .map(r => ({
        email:           r.other_party,
        isGuest:         r.other_party.startsWith("guest_"),
        lastMessage:     r.last_message,
        lastMessageTime: r.last_message_time,
      }));

    return res.json(conversations);
  } catch (err) {
    console.error("getConversations:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getMessages = async (req, res) => {
  const { adminEmail, userEmail } = req.query;
  if (!adminEmail || !userEmail) return res.status(400).json({ error: "adminEmail and userEmail required" });

  try {
    const { rows } = await query(
      `SELECT * FROM chat_messages
       WHERE
         ("senderEmail" = $1 AND "receiverEmail" = $2) OR
         ("senderEmail" = $2 AND "receiverEmail" = $1) OR
         ("senderEmail" = $2 AND "receiverEmail" IN ('admin', NULL))
       ORDER BY "createdAt" ASC`,
      [adminEmail, userEmail]
    );
    return res.json(rows);
  } catch (err) {
    console.error("getMessages:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const sendMessage = async (req, res) => {
  const { senderEmail, receiverEmail, message } = req.body;
  if (!senderEmail || !receiverEmail || !message)
    return res.status(400).json({ error: "senderEmail, receiverEmail, message are required" });

  try {
    const { rows } = await query(
      `INSERT INTO chat_messages ("senderEmail", "receiverEmail", message, "createdAt", "updatedAt")
       VALUES ($1,$2,$3,NOW(),NOW()) RETURNING *`,
      [senderEmail, receiverEmail, message.slice(0, 4000)]
    );
    return res.status(201).json({ message: "Message sent", data: rows[0] });
  } catch (err) {
    console.error("sendMessage:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getMessagesBetweenUsers = async (req, res) => {
  const { user1, user2 } = req.query;
  if (!user1 || !user2) return res.status(400).json({ error: "user1 and user2 required" });

  try {
    const { rows } = await query(
      `SELECT * FROM chat_messages
       WHERE ("senderEmail"=$1 AND "receiverEmail"=$2)
          OR ("senderEmail"=$2 AND "receiverEmail"=$1)
       ORDER BY "createdAt" ASC`,
      [user1, user2]
    );
    return res.json({ messages: rows });
  } catch (err) {
    console.error("getMessagesBetweenUsers:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const triggerCleanup = async (_req, res) => {
  try {
    await messageCleanupService.manualCleanup();
    const stats = await messageCleanupService.getCleanupStats();
    return res.json({ message: "Cleanup complete", stats });
  } catch (err) {
    console.error("triggerCleanup:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getCleanupStats = async (_req, res) => {
  try {
    const stats = await messageCleanupService.getCleanupStats();
    return res.json(stats);
  } catch (err) {
    console.error("getCleanupStats:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getOfflineMessages = async (req, res) => {
  const { adminEmail } = req.query;
  if (!adminEmail) return res.status(400).json({ error: "adminEmail required" });

  try {
    const { rows } = await query(
      `SELECT DISTINCT ON ("senderEmail") *
       FROM chat_messages
       WHERE ("receiverEmail" = $1 OR "receiverEmail" = 'admin')
         AND "isOfflineMessage" = true AND "seenByAdmin" = false
       ORDER BY "senderEmail", "createdAt" DESC`,
      [adminEmail]
    );
    return res.json({ messages: rows, count: rows.length });
  } catch (err) {
    console.error("getOfflineMessages:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const markOfflineMessagesDelivered = async (req, res) => {
  const { adminEmail, messageIds } = req.body;
  if (!adminEmail) return res.status(400).json({ error: "adminEmail required" });

  try {
    let sql, params;
    if (messageIds?.length) {
      const ph = messageIds.map((_, n) => `$${n + 1}`).join(",");
      sql    = `UPDATE chat_messages SET "isOfflineMessage"=false, "deliveredAt"=NOW() WHERE id IN (${ph})`;
      params = messageIds;
    } else {
      sql    = `UPDATE chat_messages SET "isOfflineMessage"=false, "deliveredAt"=NOW()
                WHERE ("receiverEmail"=$1 OR "receiverEmail"='admin') AND "isOfflineMessage"=true`;
      params = [adminEmail];
    }
    const { rowCount } = await query(sql, params);
    return res.json({ message: "Marked as delivered", updatedCount: rowCount });
  } catch (err) {
    console.error("markOfflineMessagesDelivered:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const markMessagesAsSeen = async (req, res) => {
  const { adminEmail, userEmail } = req.body;
  if (!adminEmail || !userEmail) return res.status(400).json({ error: "adminEmail and userEmail required" });

  try {
    const { rowCount } = await query(
      `UPDATE chat_messages
       SET "seenByAdmin"=true, "seenAt"=NOW(), "isOfflineMessage"=false
       WHERE "senderEmail"=$1
         AND ("receiverEmail"=$2 OR "receiverEmail"='admin')
         AND "seenByAdmin"=false`,
      [userEmail, adminEmail]
    );
    return res.json({ message: "Marked as seen", updatedCount: rowCount });
  } catch (err) {
    console.error("markMessagesAsSeen:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getAdmins, getConversations, getMessages, sendMessage,
  getMessagesBetweenUsers, triggerCleanup, getCleanupStats,
  getOfflineMessages, markOfflineMessagesDelivered, markMessagesAsSeen,
};