#!/usr/bin/env node

require('dotenv').config();
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

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

async function rollbackMigrations(steps = 1) {
    let successCount = 0;
    let errorCount = 0;

    try {
        console.log('🔐 Testing database connection...\n');
        await sequelize.authenticate();
        console.log('✅ Connection successful!\n');

        console.log(`🔄 Starting rollback (${steps} step(s))...\n`);

        // Get all migration files from the migrations folder
        const migrationsDir = path.join(__dirname, 'migrations');
        const migrationFiles = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.js') && file.match(/^\d{14}-/))
            .sort()
            .reverse(); // Reverse order for rollback

        console.log(`📋 Found ${migrationFiles.length} migration files\n`);

        let stepsProcessed = 0;

        // Run rollback for each migration
        for (const file of migrationFiles) {
            if (stepsProcessed >= steps) break;

            const filePath = path.join(migrationsDir, file);
            const migrationName = path.basename(file, '.js');

            try {
                console.log(`⬅️  Rolling back: ${migrationName}`);

                // Import the migration
                const migration = require(filePath);

                // Check if migration has down method
                if (typeof migration.down !== 'function') {
                    console.log(`   ⚠️  Skipped: No 'down' method found\n`);
                    continue;
                }

                // Run the rollback
                await migration.down(
                    sequelize.getQueryInterface(),
                    sequelize.Sequelize
                );

                console.log(`   ✅ Rolled back successfully\n`);
                successCount++;
                stepsProcessed++;

            } catch (error) {
                if (error.message.includes('does not exist') || 
                    error.message.includes('already exists')) {
                    console.log(`   ⏭️  Skipped: ${error.message.substring(0, 50)}...\n`);
                } else {
                    console.error(`   ❌ Rollback failed: ${error.message}\n`);
                    errorCount++;
                }
            }
        }

        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 Rollback Summary');
        console.log('='.repeat(60));
        console.log(`✅ Successful rollbacks: ${successCount}`);
        console.log(`❌ Failed rollbacks: ${errorCount}`);
        console.log('='.repeat(60) + '\n');

        if (errorCount === 0) {
            console.log(`🔄 Rollback complete! You can now fix the migrations and run them again.`);
            console.log('Command: node run-all-migrations.js\n');
            process.exit(0);
        } else {
            console.log(`⚠️  Some rollbacks failed. Please review the errors above.`);
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        process.exit(1);

    } finally {
        await sequelize.close();
    }
}

// Get number of steps from command line argument
const steps = parseInt(process.argv[2]) || 1;

if (steps < 1) {
    console.error('❌ Number of steps must be at least 1');
    process.exit(1);
}

console.log(`\n⚠️  WARNING: This will undo the last ${steps} migration(s)!\n`);
console.log('The following tables/columns will be removed:');
console.log('  - Make sure you have backups if needed\n');

// For safety, ask for confirmation (optional)
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Do you want to proceed? (yes/no): ', (answer) => {
    rl.close();
    if (answer.toLowerCase() === 'yes') {
        rollbackMigrations(steps);
    } else {
        console.log('❌ Rollback cancelled');
        process.exit(0);
    }
});
