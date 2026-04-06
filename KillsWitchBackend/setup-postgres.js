#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🛠️  PostgreSQL Database Setup Script\n');
console.log('='.repeat(60) + '\n');

const DB_USER = 'postgres';
const DB_PASSWORD = 'pakistan2025';
const DB_NAME = 'ecommerce';

// Step 1: Check if running as root
console.log('1️⃣  Verifying permissions...\n');
try {
    execSync('sudo -n true', { stdio: 'pipe' });
    console.log('✅ Sudo access verified\n');
} catch (error) {
    console.log('❌ This script requires sudo access');
    console.log('Run with: sudo node setup-postgres.js\n');
    process.exit(1);
}

// Step 2: Set PostgreSQL password
console.log('2️⃣  Setting PostgreSQL password...\n');
try {
    const setPassword = `sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '${DB_PASSWORD}';"`;
    execSync(setPassword, { encoding: 'utf-8', stdio: 'pipe' });
    console.log(`✅ Password set for user '${DB_USER}'\n`);
} catch (error) {
    console.log('⚠️  Could not set password:', error.message.substring(0, 100));
}

// Step 3: Create database if it doesn't exist
console.log('3️⃣  Creating database if needed...\n');
try {
    const createDb = `sudo -u postgres createdb -h 127.0.0.1 ${DB_NAME} 2>&1 || true`;
    const result = execSync(createDb, { encoding: 'utf-8', shell: '/bin/bash' });
    if (result.includes('already exists')) {
        console.log(`✅ Database '${DB_NAME}' already exists\n`);
    } else {
        console.log(`✅ Database '${DB_NAME}' created\n`);
    }
} catch (error) {
    console.log('⚠️  Database creation:', error.message.substring(0, 100));
}

// Step 4: Verify connection
console.log('4️⃣  Verifying database connection...\n');
try {
    const testConnection = `PGPASSWORD=${DB_PASSWORD} psql -h 127.0.0.1 -U ${DB_USER} -d ${DB_NAME} -c "SELECT NOW();"`;
    const result = execSync(testConnection, { encoding: 'utf-8', shell: '/bin/bash' });
    console.log('✅ Connection successful!\n');
    console.log(result);
} catch (error) {
    console.log('❌ Connection failed');
    console.log('Error:', error.message.substring(0, 200));
    console.log('\n💡 Try these manual steps:');
    console.log(`sudo -u postgres psql -h 127.0.0.1 -U postgres`);
    console.log(`ALTER USER postgres WITH PASSWORD '${DB_PASSWORD}';`);
    console.log(`CREATE DATABASE ${DB_NAME};`);
    console.log('\\q\n');
    process.exit(1);
}

// Step 5: Summary
console.log('='.repeat(60));
console.log('\n✨ PostgreSQL Setup Complete!\n');
console.log('Configuration:');
console.log(`  Host:     localhost`);
console.log(`  Port:     5432`);
console.log(`  User:     ${DB_USER}`);
console.log(`  Password: ${DB_PASSWORD}`);
console.log(`  Database: ${DB_NAME}\n`);
console.log('You can now run migrations:');
console.log('  node run-all-migrations.js\n');
