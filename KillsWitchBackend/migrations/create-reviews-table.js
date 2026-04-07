'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Check if reviews table already exists
      const tables = await queryInterface.showAllTables();
      if (tables.includes('reviews')) {
        console.log('reviews table already exists, skipping creation');
        return;
      }
    } catch (error) {
      // Continue with creation if check fails
    }

    await queryInterface.createTable('reviews', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5
        }
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      reviewer_name: {
        type: Sequelize.STRING(100),
        allowNull: false
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
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('reviews', ['productId']);
    await queryInterface.addIndex('reviews', ['userId']);
    await queryInterface.addIndex('reviews', ['rating']);
    await queryInterface.addIndex('reviews', ['createdAt']);
    
    // Add composite index for unique constraint (user can only review a product once)
    await queryInterface.addIndex('reviews', ['productId', 'userId'], {
      unique: true,
      where: {
        userId: {
          [Sequelize.Op.ne]: null
        }
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('reviews');
  }
};
