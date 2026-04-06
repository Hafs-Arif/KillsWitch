#!/usr/bin/env node

const { Sequelize } = require('sequelize');
require('dotenv').config();

async function fixDatabase() {
    console.log('🔧 Fixing database schema...\n');

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

    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database\n');

        const queryInterface = sequelize.getQueryInterface();

        // Step 1: Drop problematic tables in reverse order of dependencies
        console.log('1️⃣  Dropping dependent tables...');
        const tablesToDrop = [
            'brandcategories',
            'products',
            'product_images',
            'subcategories',
            'categories',
            'brands'
        ];

        for (const table of tablesToDrop) {
            try {
                await queryInterface.dropTable(table, { cascade: true });
                console.log(`   ✅ Dropped ${table}`);
            } catch (error) {
                if (error.message.includes('does not exist')) {
                    console.log(`   ⏭️  ${table} doesn't exist`);
                } else {
                    console.log(`   ⚠️  Error dropping ${table}`);
                }
            }
        }

        console.log('\n2️⃣  All problematic tables removed.');
        console.log('\n💡 Next steps:');
        console.log('1. Run migrations again:');
        console.log('   node run-all-migrations.js\n');
        console.log('2. Then run seeding:');
        console.log('   node seed.js\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

fixDatabase();
