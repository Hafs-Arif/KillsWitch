'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('chat_messages', 'isOfflineMessage', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });

    await queryInterface.addColumn('chat_messages', 'deliveredAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('chat_messages', 'storedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('chat_messages', 'isOfflineMessage');
    await queryInterface.removeColumn('chat_messages', 'deliveredAt');
    await queryInterface.removeColumn('chat_messages', 'storedAt');
  }
};
