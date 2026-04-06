module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'sameShippingBillingDefault', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'sameShippingBillingDefault');
  },
};
