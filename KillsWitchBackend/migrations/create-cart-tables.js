'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create carts table
    await queryInterface.createTable('carts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      sessionId: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'For guest users - stores session ID'
      },
      status: {
        type: Sequelize.ENUM('active', 'abandoned', 'converted'),
        defaultValue: 'active',
        allowNull: false
      },
      totalItems: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
        validate: {
          min: 0
        }
      },
      totalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00,
        allowNull: false,
        validate: {
          min: 0
        }
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'USD',
        allowNull: false
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Cart expiration date for cleanup'
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

    // Create cart_items table
    await queryInterface.createTable('cart_items', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      cartId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'carts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      productId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'products',
          key: 'product_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1,
          max: 999
        }
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        },
        comment: 'Price at the time of adding to cart'
      },
      totalPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        },
        comment: 'quantity * price'
      },
      productSnapshot: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Snapshot of product data at time of adding to cart'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Special notes for this cart item'
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

    // Add indexes for carts table
    await queryInterface.addIndex('carts', ['userId']);
    await queryInterface.addIndex('carts', ['sessionId']);
    await queryInterface.addIndex('carts', ['status']);
    await queryInterface.addIndex('carts', ['expiresAt']);
    await queryInterface.addIndex('carts', ['createdAt']);

    // Add indexes for cart_items table
    await queryInterface.addIndex('cart_items', ['cartId']);
    await queryInterface.addIndex('cart_items', ['productId']);
    
    // Add unique constraint for cart-product combination
    await queryInterface.addIndex('cart_items', ['cartId', 'productId'], {
      unique: true,
      name: 'unique_cart_product'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('cart_items');
    await queryInterface.dropTable('carts');
  }
};
