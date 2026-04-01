require("dotenv").config();
const { query } = require("../config/db");

/**
 * Message Cleanup Service
 * Handles automatic cleanup of old chat messages (Raw SQL version)
 */
class MessageCleanupService {
  constructor() {
    this.RETENTION_DAYS = 2; // Keep messages for 2 days
    this.CLEANUP_INTERVAL = 60 * 60 * 1000; // Run every hour
    this.isRunning = false;
    this.cleanupInterval = null;
  }

  /**
   * Start the automatic cleanup service
   */
  start() {
    if (this.isRunning) {
      console.log("[CLEANUP] Message cleanup service is already running");
      return;
    }

    console.log(`[CLEANUP] Starting message cleanup service - retention: ${this.RETENTION_DAYS} day(s)`);
    this.isRunning = true;

    // Run initial cleanup immediately
    this.performCleanup();

    // Schedule periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.performCleanup().catch((err) => {
        console.error("[CLEANUP] Periodic cleanup failed:", err.message);
      });
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Stop the automatic cleanup service
   */
  stop() {
    if (!this.isRunning) {
      console.log("[CLEANUP] Message cleanup service is not running");
      return;
    }

    console.log("[CLEANUP] Stopping message cleanup service");
    this.isRunning = false;

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Perform the actual cleanup of old messages
   */
  async performCleanup() {
    try {
      console.log(`[CLEANUP] Scanning for messages older than ${this.RETENTION_DAYS} days...`);

      // Delete messages older than retention period using interval subtraction
      const result = await query(
        `DELETE FROM chat_messages 
         WHERE "storedAt" < NOW() - INTERVAL '${this.RETENTION_DAYS} days'`,
        []
      );

      const deletedCount = result.rowCount || 0;

      if (deletedCount > 0) {
        console.log(`[CLEANUP] Successfully deleted ${deletedCount} old messages`);
      } else {
        console.log("[CLEANUP] No old messages to delete");
      }

      // Get total count for monitoring
      const stats = await this.getStats();
      console.log(`[CLEANUP] Current database state: ${stats.totalMessages} total messages`);

    } catch (error) {
      console.error("[CLEANUP] Error during cleanup:", error.message);
      throw error; // Re-throw to be handled by interval catch block
    }
  }

  /**
   * Manual cleanup trigger
   */
  async manualCleanup() {
    console.log("[CLEANUP] Manual cleanup triggered");
    await this.performCleanup();
  }

  /**
   * Get cleanup statistics (Raw SQL version)
   */
  async getStats() {
    try {
      const cutoffDate = new Date(Date.now() - this.RETENTION_DAYS * 24 * 60 * 60 * 1000);

      // Count total
      const totalResult = await query(`SELECT COUNT(*) as count FROM chat_messages`);
      const totalMessages = parseInt(totalResult.rows[0].count, 10);

      // Count old messages
      const oldResult = await query(
        `SELECT COUNT(*) as count FROM chat_messages WHERE "storedAt" < $1`,
        [cutoffDate]
      );
      const oldMessages = parseInt(oldResult.rows[0].count, 10);

      const recentMessages = Math.max(0, totalMessages - oldMessages);

      return {
        totalMessages,
        recentMessages,
        oldMessages,
        retentionDays: this.RETENTION_DAYS,
        cutoffDate: cutoffDate.toISOString(),
        isRunning: this.isRunning,
      };
    } catch (error) {
      console.error("[CLEANUP] Error getting stats:", error.message);
      return null;
    }
  }

  /**
   * Alias for getStats() for backward compatibility
   */
  async getCleanupStats() {
    return this.getStats();
  }
}

// Export singleton instance
const messageCleanupService = new MessageCleanupService();
module.exports = messageCleanupService;