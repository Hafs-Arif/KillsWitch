'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('AdminRequest', {
      admin_request_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      IsApproved: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      user_email: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      updatedshippingAddress: {
        type: Sequelize.STRING,
        allowNull: true
      },
      updatedshippingPhone: {
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
    await queryInterface.dropTable('AdminRequest');
  }
};
