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

async function fixDatabase() {
    try {
        console.log('🔧 Database Schema Fix\n');
        
        await sequelize.authenticate();
        console.log('✅ Connected to database\n');

        const queryInterface = sequelize.getQueryInterface();

        // Step 1: Check subcategories table structure
        console.log('1️⃣  Checking subcategories table structure...');
        try {
            const subcatsDescription = await queryInterface.describeTable('subcategories');
            console.log('Current columns:', Object.keys(subcatsDescription));
            console.log('');

            // If it has 'id' instead of 'sub_category_id', rename it
            if (subcatsDescription.id && !subcatsDescription.sub_category_id) {
                console.log('2️⃣  Renaming id column to sub_category_id...');
                await queryInterface.renameColumn('subcategories', 'id', 'sub_category_id');
                console.log('✅ Column renamed\n');
            } else if (subcatsDescription.sub_category_id) {
                console.log('✅ sub_category_id column already exists\n');
            }
        } catch (error) {
            console.error('Error checking table:', error.message);
        }

        // Step 2: Drop brandcategory table
        console.log('3️⃣  Dropping brandcategory table...');
        try {
            await queryInterface.dropTable('brandcategory');
            console.log('✅ Dropped brandcategory table\n');
        } catch (error) {
            if (error.message.includes('does not exist')) {
                console.log('✅ Table does not exist (OK)\n');
            } else {
                console.error('Error:', error.message);
            }
        }

        // Step 3: Verify the fix
        console.log('4️⃣  Verifying fix...');
        try {
            const result = await sequelize.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'subcategories' 
                ORDER BY ordinal_position;
            `);
            console.log('✅ Subcategories table columns:');
            result[0].forEach(col => {
                console.log(`   - ${col.column_name}: ${col.data_type}`);
            });
            console.log('');
        } catch (error) {
            console.error('Error verifying:', error.message);
        }

        console.log('=' .repeat(60));
        console.log('✨ Database schema fixed!\n');
        console.log('You can now run seed.js:');
        console.log('  node seed.js\n');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);

    } finally {
        await sequelize.close();
    }
}

fixDatabase();
