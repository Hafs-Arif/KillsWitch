"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // remove the title column if it exists
      const tableName = "reviews";
      const columnName = "title";
      
      // Check if the table exists first
      const tableDesc = await queryInterface.describeTable(tableName);
      
      // Check if the column exists
      if (tableDesc && tableDesc[columnName]) {
        await queryInterface.removeColumn(tableName, columnName);
      }
      // Column doesn't exist, which is fine - it may have never been created
    } catch (error) {
      // If column doesn't exist or table doesn't exist, silently continue
      if (!error.message.includes("does not exist")) {
        throw error;
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // add the column back in case of rollback
      await queryInterface.addColumn("reviews", "title", {
        type: Sequelize.STRING(255),
        allowNull: true
      });
    } catch (error) {
      // If column already exists, silently continue
      if (!error.message.includes("already exists")) {
        throw error;
      }
    }
  }
};