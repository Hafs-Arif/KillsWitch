// models/chatMessageModel.js
const { query } = require("../config/db");

class ChatMessageModel {
  // ─── CREATE ────────────────────────────────────────────────────────────────
  static async create(senderEmail, receiverEmail, message, isOfflineMessage = false) {
    const messageHash = Buffer.from(`${senderEmail}:${receiverEmail}:${message}`).toString("base64");
    
    return query(
      `INSERT INTO chat_messages 
         ("senderEmail", "receiverEmail", message, "isOfflineMessage", "messageHash", "storedAt")
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id`,
      [senderEmail.toLowerCase(), receiverEmail.toLowerCase(), message, isOfflineMessage, messageHash]
    );
  }

  // ─── FIND BY USER (INBOX/SENT) ─────────────────────────────────────────────
  static async findByUser(userEmail) {
    const { rows } = await query(
      `SELECT id, "senderEmail", "receiverEmail", message, 
               "isOfflineMessage", "deliveredAt", "storedAt", "seenByAdmin", "seenAt", "createdAt"
        FROM chat_messages 
        WHERE "senderEmail" = $1 OR "receiverEmail" = $1
        ORDER BY "storedAt" ASC`,
      [userEmail.toLowerCase()]
    );
    return rows;
  }

  // ─── MARK SEEN ─────────────────────────────────────────────────────────────
  static async markAsSeen(messageId) {
    return query(
      `UPDATE chat_messages 
         SET "seenByAdmin" = true, "seenAt" = NOW() 
         WHERE id = $1`,
      [messageId]
    );
  }

  // ─── MARK DELIVERED ────────────────────────────────────────────────────────
  static async markDelivered(messageId) {
    return query(
      `UPDATE chat_messages 
         SET "deliveredAt" = NOW() 
         WHERE id = $1`,
      [messageId]
    );
  }

  // ─── OFFLINE CLEANUP (Used by messageCleanupService) ────────────────────────
  static async cleanupOfflineMessages(hoursAgo = 1) {
    return query(
      `DELETE FROM chat_messages 
       WHERE "isOfflineMessage" = true 
         AND "storedAt" < NOW() - INTERVAL '${hoursAgo} hour'`,
      []
    );
  }
  
  // ─── CHECK DUPLICATE HASH ───────────────────────────────────────────────────
  static async checkDuplicate(hash) {
    const { rows } = await query(`SELECT id FROM chat_messages WHERE "messageHash" = $1`, [hash]);
    return rows.length > 0;
  }
}

module.exports = ChatMessageModel;