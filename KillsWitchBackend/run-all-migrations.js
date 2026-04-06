#!/usr/bin/env node

require('dotenv').config();
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Create direct Sequelize connection without using models (avoids circular dependency issues)
const sequelize = new Sequelize(
    process.env.DB_NAME || 'ecommerce',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgree@umer',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
    }
);

async function testDatabaseConnection() {
    try {
        console.log('🔐 Testing database connection...\n');
        console.log('Configuration:');
        console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
        console.log(`  Port: ${process.env.DB_PORT || 5432}`);
        console.log(`  User: ${process.env.DB_USER || 'postgres'}`);
        console.log(`  Database: ${process.env.DB_NAME || 'ecommerce'}\n`);
        
        await sequelize.authenticate();
        console.log('✅ Connection successful!\n');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed!\n');
        console.error('Error:', error.message);
        console.error('\n💡 SOLUTION:\n');
        console.error('1. Verify .env file has correct credentials:');
        console.error('   cat .env\n');
        console.error('2. Check PostgreSQL is running and accepts connections:');
        console.error('   psql -U postgres -h localhost\n');
        console.error('3. If password is wrong, update .env:');
        console.error('   nano .env\n');
        console.error('4. Run this script again.\n');
        return false;
    }
}

async function runAllMigrations() {
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    try {
        // Test connection first
        const connectionOk = await testDatabaseConnection();
        if (!connectionOk) {
            process.exit(1);
        }

        console.log('🚀 Starting database migration process...\n');
        
        // Get all migration files from the migrations folder
        const migrationsDir = path.join(__dirname, 'migrations');
        const migrationFiles = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.js') && file.match(/^\d{14}-/)) // Only numbered migrations
            .sort(); // Sort by filename to ensure proper order
        
        console.log(`📋 Found ${migrationFiles.length} migration files\n`);
        
        // Run each migration in order
        for (const file of migrationFiles) {
            const filePath = path.join(migrationsDir, file);
            const migrationName = path.basename(file, '.js');
            
            try {
                console.log(`▶️  Running: ${migrationName}`);
                
                // Import the migration
                const migration = require(filePath);
                
                // Check if migration has up method
                if (typeof migration.up !== 'function') {
                    console.log(`   ⚠️  Skipped: No 'up' method found\n`);
                    skipCount++;
                    continue;
                }
                
                // Run the migration
                await migration.up(
                    sequelize.getQueryInterface(),
                    sequelize.Sequelize
                );
                
                console.log(`   ✅ Success\n`);
                successCount++;
                
            } catch (error) {
                // Check if it's an already exists error (which is okay)
                if (error.message.includes('already exists') || 
                    error.message.includes('Duplicate') ||
                    error.name === 'SequelizeDatabaseError' && error.message.includes('already')) {
                    console.log(`   ⏭️  Skipped: Table/field already exists\n`);
                    skipCount++;
                } else {
                    console.error(`   ❌ Failed: ${error.message}\n`);
                    errorCount++;
                }
            }
        }
        
        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 Migration Summary');
        console.log('='.repeat(60));
        console.log(`✅ Successful migrations: ${successCount}`);
        console.log(`⏭️  Skipped migrations: ${skipCount}`);
        console.log(`❌ Failed migrations: ${errorCount}`);
        console.log('='.repeat(60) + '\n');
        
        if (errorCount === 0) {
            console.log('🎉 All migrations completed successfully!');
        } else {
            console.log(`⚠️  ${errorCount} migration(s) failed. Please review the errors above.`);
        }
        
    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        console.error('\n💡 Troubleshooting:');
        console.error('1. Verify .env file exists with correct credentials');
        console.error('2. Check PostgreSQL is running');
        console.error('3. Verify database user password is correct');
        process.exit(1);

    } finally {
        // Close database connection
        await sequelize.close();
        process.exit(errorCount > 0 ? 1 : 0);
    }
}

// Run migrations
runAllMigrations();
