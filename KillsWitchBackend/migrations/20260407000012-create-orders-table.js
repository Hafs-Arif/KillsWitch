'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Orders', {
      order_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      orderId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      paymentIntentId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      paymentStatus: {
        type: Sequelize.ENUM('pending', 'completed', 'failed', 'refunded'),
        allowNull: false,
        defaultValue: 'pending'
      },
      order_status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'processing'
      },
      trackingNumber: {
        type: Sequelize.STRING,
        allowNull: true
      },
      shippingName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      shippingMethod: {
        type: Sequelize.STRING,
        allowNull: true
      },
      shippingCompany: {
        type: Sequelize.STRING,
        allowNull: true
      },
      shippingPhone: {
        type: Sequelize.STRING,
        allowNull: false
      },
      shippingAddress: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      shippingCity: {
        type: Sequelize.STRING,
        allowNull: false
      },
      shippingState: {
        type: Sequelize.STRING,
        allowNull: false
      },
      shippingCountry: {
        type: Sequelize.STRING,
        allowNull: false
      },
      billingName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      billingCompany: {
        type: Sequelize.STRING,
        allowNull: true
      },
      billingPhone: {
        type: Sequelize.STRING,
        allowNull: false
      },
      billingAddress: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      billingCity: {
        type: Sequelize.STRING,
        allowNull: false
      },
      billingState: {
        type: Sequelize.STRING,
        allowNull: false
      },
      billingCountry: {
        type: Sequelize.STRING,
        allowNull: false
      },
      subtotal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      shipping: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      tax: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      total: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      couponCode: {
        type: Sequelize.STRING,
        allowNull: true
      },
      discount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      isFullCart: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      leadtime: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      shipment_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Shipments',
          key: 'shipment_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      payment_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Payments',
          key: 'payment_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    await queryInterface.dropTable('Orders');
  }
};
