'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('sessions', {
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
      tokenHash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      userAgent: {
        type: Sequelize.STRING(512),
        allowNull: true
      },
      ipAddress: {
        type: Sequelize.STRING(64),
        allowNull: true
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      revokedAt: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex('sessions', ['userId']);
    await queryInterface.addIndex('sessions', ['expiresAt']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('sessions');
  }
};


