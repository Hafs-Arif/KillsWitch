'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Add slug column
      await queryInterface.addColumn(
        'products',
        'slug',
        {
          type: Sequelize.STRING,
          unique: true,
          allowNull: false,
          defaultValue: `product-${Date.now()}`
        },
        { transaction }
      );
      console.log('✅ Added slug column to products table');

      // Add sale_price column
      await queryInterface.addColumn(
        'products',
        'sale_price',
        {
          type: Sequelize.FLOAT,
          allowNull: true,
          defaultValue: null
        },
        { transaction }
      );
      console.log('✅ Added sale_price column to products table');

      // Add video_url column
      await queryInterface.addColumn(
        'products',
        'video_url',
        {
          type: Sequelize.STRING,
          allowNull: true,
          defaultValue: null
        },
        { transaction }
      );
      console.log('✅ Added video_url column to products table');

      await transaction.commit();
      console.log('✅ Migration completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     * Example:
     * await queryInterface.dropTable('users');
     */
    
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Remove video_url column
      await queryInterface.removeColumn(
        'products',
        'video_url',
        { transaction }
      );
      console.log('✅ Removed video_url column from products table');

      // Remove sale_price column
      await queryInterface.removeColumn(
        'products',
        'sale_price',
        { transaction }
      );
      console.log('✅ Removed sale_price column from products table');

      // Remove slug column
      await queryInterface.removeColumn(
        'products',
        'slug',
        { transaction }
      );
      console.log('✅ Removed slug column from products table');

      await transaction.commit();
      console.log('✅ Rollback completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};
