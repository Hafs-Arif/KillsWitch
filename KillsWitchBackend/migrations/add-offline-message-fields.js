'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('chat_messages');
    
    // Only add columns if they don't already exist
    if (!table.isOfflineMessage) {
      await queryInterface.addColumn('chat_messages', 'isOfflineMessage', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      });
    }

    if (!table.deliveredAt) {
      await queryInterface.addColumn('chat_messages', 'deliveredAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    if (!table.storedAt) {
      await queryInterface.addColumn('chat_messages', 'storedAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('chat_messages');
    
    if (table.isOfflineMessage) {
      await queryInterface.removeColumn('chat_messages', 'isOfflineMessage');
    }
    if (table.deliveredAt) {
      await queryInterface.removeColumn('chat_messages', 'deliveredAt');
    }
    if (table.storedAt) {
      await queryInterface.removeColumn('chat_messages', 'storedAt');
    }
  }
};
