'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // these fields may already exist if sync with alter is running, so guard against duplicates
      const tableDesc = await queryInterface.describeTable('Orders');
      if (!tableDesc.couponCode) {
        await queryInterface.addColumn('Orders', 'couponCode', {
          type: Sequelize.STRING,
          allowNull: true,
        });
      }
      if (!tableDesc.discount) {
        await queryInterface.addColumn('Orders', 'discount', {
          type: Sequelize.FLOAT,
          allowNull: false,
          defaultValue: 0,
        });
      }
    } catch (error) {
      console.log('Migration warning:', error.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      const tableDesc = await queryInterface.describeTable('Orders');
      if (tableDesc.couponCode) {
        await queryInterface.removeColumn('Orders', 'couponCode');
      }
      if (tableDesc.discount) {
        await queryInterface.removeColumn('Orders', 'discount');
      }
    } catch (error) {
      console.log('Migration warning:', error.message);
    }
  }
};
