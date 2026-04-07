const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('chat_messages');
    
    // Add new fields for better message tracking and deduplication
    if (!table.seenByAdmin) {
      await queryInterface.addColumn('chat_messages', 'seenByAdmin', {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      });
    }

    if (!table.seenAt) {
      await queryInterface.addColumn('chat_messages', 'seenAt', {
        type: DataTypes.DATE,
        allowNull: true,
      });
    }

    if (!table.messageHash) {
      await queryInterface.addColumn('chat_messages', 'messageHash', {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Hash for deduplication'
      });
    }

    // Add index for better query performance
    try {
      await queryInterface.addIndex('chat_messages', ['messageHash'], {
        name: 'idx_chat_messages_hash'
      });
    } catch (error) {
      // Index might already exist
    }

    try {
      await queryInterface.addIndex('chat_messages', ['seenByAdmin'], {
        name: 'idx_chat_messages_seen_by_admin'
      });
    } catch (error) {
      // Index might already exist
    }
  },

  down: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('chat_messages');
    
    // Remove indexes first
    try {
      await queryInterface.removeIndex('chat_messages', 'idx_chat_messages_hash');
    } catch (error) {
      // Index might not exist
    }
    
    try {
      await queryInterface.removeIndex('chat_messages', 'idx_chat_messages_seen_by_admin');
    } catch (error) {
      // Index might not exist
    }

    // Remove columns
    if (table.seenByAdmin) {
      await queryInterface.removeColumn('chat_messages', 'seenByAdmin');
    }
    if (table.seenAt) {
      await queryInterface.removeColumn('chat_messages', 'seenAt');
    }
    if (table.messageHash) {
      await queryInterface.removeColumn('chat_messages', 'messageHash');
    }
  }
};
