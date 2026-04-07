'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Shipments', {
      shipment_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      shippingName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      shippingPhone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      shippingMethod: {
        type: Sequelize.STRING,
        allowNull: true
      },
      shippingAddress: {
        type: Sequelize.STRING,
        allowNull: true
      },
      shippingDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      shippingCity: {
        type: Sequelize.STRING,
        allowNull: true
      },
      shippingState: {
        type: Sequelize.STRING,
        allowNull: true
      },
      shippingCountry: {
        type: Sequelize.STRING,
        allowNull: true
      },
      shippingCompany: {
        type: Sequelize.STRING,
        allowNull: true
      },
      billingAddress: {
        type: Sequelize.STRING,
        allowNull: true
      },
      billingName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      billingCompany: {
        type: Sequelize.STRING,
        allowNull: true
      },
      billingPhone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      billingCity: {
        type: Sequelize.STRING,
        allowNull: true
      },
      billingState: {
        type: Sequelize.STRING,
        allowNull: true
      },
      billingCountry: {
        type: Sequelize.STRING,
        allowNull: true
      },
      billingEmail: {
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
    await queryInterface.dropTable('Shipments');
  }
};
