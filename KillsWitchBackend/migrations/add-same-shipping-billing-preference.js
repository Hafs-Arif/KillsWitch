module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users');
    if (!table.sameShippingBillingDefault) {
      await queryInterface.addColumn('users', 'sameShippingBillingDefault', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users');
    if (table.sameShippingBillingDefault) {
      await queryInterface.removeColumn('users', 'sameShippingBillingDefault');
    }
  },
};
