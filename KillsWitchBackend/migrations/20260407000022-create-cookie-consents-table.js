'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('CookieConsents', {
      consent_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      session_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      ip_address: {
        type: Sequelize.STRING,
        allowNull: true
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      consent_given: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      consent_type: {
        type: Sequelize.ENUM('accept', 'reject'),
        allowNull: false
      },
      analytics_cookies: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      functional_cookies: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      marketing_cookies: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      consent_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      country: {
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
    await queryInterface.dropTable('CookieConsents');
  }
};
