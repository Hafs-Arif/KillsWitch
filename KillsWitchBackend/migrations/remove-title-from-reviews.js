"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // remove the title column if it exists
    const tableName = "reviews";
    const columnName = "title";
    const tableDesc = await queryInterface.describeTable(tableName);
    if (tableDesc[columnName]) {
      await queryInterface.removeColumn(tableName, columnName);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // add the column back in case of rollback
    await queryInterface.addColumn("reviews", "title", {
      type: Sequelize.STRING(255),
      allowNull: true,
      validate: {
        len: [0, 255]
      }
    });
  }
};