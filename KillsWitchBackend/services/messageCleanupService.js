const { ChatMessage } = require('../models');
const { Op } = require('sequelize');

/**
 * Message Cleanup Service
 * Handles automatic cleanup of old chat messages
 */
class MessageCleanupService {
  constructor() {
    this.RETENTION_DAYS = 2; // Both user and admin messages kept for 2 days (as requested)
    this.CLEANUP_INTERVAL = 60 * 60 * 1000; // Run cleanup every hour (in milliseconds)
    this.isRunning = false;
  }

  /**
   * Start the automatic cleanup service
   */
  start() {
    if (this.isRunning) {
      console.log('[CLEANUP] Message cleanup service is already running');
      return;
    }

    console.log(`[CLEANUP] Starting message cleanup service - retention: ${this.RETENTION_DAYS} day(s)`);
    this.isRunning = true;

    // Run initial cleanup
    this.performCleanup();

    // Schedule periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Stop the automatic cleanup service
   */
  stop() {
    if (!this.isRunning) {
      console.log('[CLEANUP] Message cleanup service is not running');
      return;
    }

    console.log('[CLEANUP] Stopping message cleanup service');
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
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS);

      console.log(`[CLEANUP] Starting cleanup of messages older than ${cutoffDate.toISOString()}`);

      // Delete messages older than retention period
      const deletedCount = await ChatMessage.destroy({
        where: {
          createdAt: {
            [Op.lt]: cutoffDate
          }
        }
      });

      if (deletedCount > 0) {
        console.log(`[CLEANUP] Successfully deleted ${deletedCount} old messages`);
      } else {
        console.log('[CLEANUP] No old messages to delete');
      }

      // Get current message count for monitoring
      const totalMessages = await ChatMessage.count();
      console.log(`[CLEANUP] Total messages in database: ${totalMessages}`);

    } catch (error) {
      console.error('[CLEANUP] Error during message cleanup:', error);
    }
  }

  /**
   * Manual cleanup trigger (for testing or manual maintenance)
   */
  async manualCleanup() {
    console.log('[CLEANUP] Manual cleanup triggered');
    await this.performCleanup();
  }

  /**
   * Get cleanup statistics
   */
  async getCleanupStats() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS);

      const totalMessages = await ChatMessage.count();
      const oldMessages = await ChatMessage.count({
        where: {
          createdAt: {
            [Op.lt]: cutoffDate
          }
        }
      });

      const recentMessages = totalMessages - oldMessages;

      return {
        totalMessages,
        recentMessages,
        oldMessages,
        retentionDays: this.RETENTION_DAYS,
        cutoffDate: cutoffDate.toISOString(),
        isRunning: this.isRunning
      };
    } catch (error) {
      console.error('[CLEANUP] Error getting cleanup stats:', error);
      return null;
    }
  }
}

// Export singleton instance
const messageCleanupService = new MessageCleanupService();
module.exports = messageCleanupService;
