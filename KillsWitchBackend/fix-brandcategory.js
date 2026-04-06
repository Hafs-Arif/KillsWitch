#!/usr/bin/env node

require('dotenv').config();
const { Sequelize } = require('sequelize');

// Create direct Sequelize connection
const sequelize = new Sequelize(
    process.env.DB_NAME || 'ecommerce',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'pakistan2025',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
    }
);

async function fixBrandcategoryTable() {
    try {
        console.log('🔧 Fixing brandcategory table...\n');
        
        await sequelize.authenticate();
        console.log('✅ Connected to database\n');

        const queryInterface = sequelize.getQueryInterface();

        // Step 1: Drop the brandcategory table if it exists
        console.log('1️⃣  Dropping brandcategory table if exists...');
        try {
            await queryInterface.dropTable('brandcategory');
            console.log('✅ Dropped brandcategory table\n');
        } catch (error) {
            if (error.message.includes('does not exist')) {
                console.log('✅ Table does not exist (OK)\n');
            } else {
                throw error;
            }
        }

        // Step 2: Create the correct brandcategory table
        console.log('2️⃣  Creating correct brandcategory table...');
        await queryInterface.createTable('brandcategory', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            brand_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'brands',
                    key: 'brand_id',
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            category_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'categories',
                    key: 'product_category_id',
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            sub_category_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'subcategories',
                    key: 'sub_category_id',
                },
                onDelete: 'NO ACTION',
                onUpdate: 'CASCADE',
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn('NOW'),
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn('NOW'),
            },
        });
        console.log('✅ Created brandcategory table with correct foreign keys\n');

        console.log('=' .repeat(60));
        console.log('✨ Fix complete!\n');
        console.log('You can now run seed.js:');
        console.log('  node seed.js\n');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('\nFull error details:');
        console.error(error);
        process.exit(1);

    } finally {
        await sequelize.close();
    }
}

fixBrandcategoryTable();
