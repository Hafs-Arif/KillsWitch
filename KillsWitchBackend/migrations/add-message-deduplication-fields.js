const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new fields for better message tracking and deduplication
    await queryInterface.addColumn('chat_messages', 'seenByAdmin', {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });

    await queryInterface.addColumn('chat_messages', 'seenAt', {
      type: DataTypes.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('chat_messages', 'messageHash', {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Hash for deduplication'
    });

    // Add index for better query performance
    await queryInterface.addIndex('chat_messages', ['messageHash'], {
      name: 'idx_chat_messages_hash'
    });

    await queryInterface.addIndex('chat_messages', ['seenByAdmin'], {
      name: 'idx_chat_messages_seen_by_admin'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes first
    await queryInterface.removeIndex('chat_messages', 'idx_chat_messages_hash');
    await queryInterface.removeIndex('chat_messages', 'idx_chat_messages_seen_by_admin');

    // Remove columns
    await queryInterface.removeColumn('chat_messages', 'seenByAdmin');
    await queryInterface.removeColumn('chat_messages', 'seenAt');
    await queryInterface.removeColumn('chat_messages', 'messageHash');
  }
};
