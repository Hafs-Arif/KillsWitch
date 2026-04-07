'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('chat_messages', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      senderEmail: {
        type: Sequelize.STRING,
        allowNull: false
      },
      receiverEmail: {
        type: Sequelize.STRING,
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      isOfflineMessage: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      deliveredAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      storedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      seenByAdmin: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      seenAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      messageHash: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('chat_messages');
  }
};
