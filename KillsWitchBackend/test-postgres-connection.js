#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔐 PostgreSQL Connection Test\n');
console.log('='.repeat(60) + '\n');

// Test 1: Direct connection as postgres system user
console.log('1️⃣  Testing connection as postgres system user...\n');
try {
    const result = execSync('sudo -u postgres psql -h 127.0.0.1 -U postgres -d postgres -c "SELECT version();"', { encoding: 'utf-8' });
    console.log('✅ Connection successful!\n');
    console.log(result);
} catch (error) {
    console.log('❌ Connection failed');
    console.log('Error:', error.message.substring(0, 200));
}

// Test 2: Check PostgreSQL configuration
console.log('\n2️⃣  Checking PostgreSQL configuration...\n');
try {
    const config = execSync('sudo cat /etc/postgresql/16/main/postgresql.conf | grep -E "^listen_addresses|^port" | grep -v "^#"', { encoding: 'utf-8', shell: '/bin/bash' });
    console.log(config || 'Using default settings');
} catch (error) {
    console.log('Could not read config');
}

// Test 3: Check pg_hba.conf
console.log('\n3️⃣  Checking PostgreSQL authentication config...\n');
try {
    const hba = execSync('sudo tail -20 /etc/postgresql/16/main/pg_hba.conf', { encoding: 'utf-8' });
    console.log(hba);
} catch (error) {
    console.log('Could not read authentication config');
}

// Test 4: List existing databases and users
console.log('\n4️⃣  Listing existing databases and users...\n');
try {
    const databases = execSync('sudo -u postgres psql -h 127.0.0.1 -U postgres -d postgres -c "\\l"', { encoding: 'utf-8' });
    console.log(databases);
} catch (error) {
    console.log('Could not list databases');
}

try {
    const users = execSync('sudo -u postgres psql -h 127.0.0.1 -U postgres -d postgres -c "\\du"', { encoding: 'utf-8' });
    console.log('\nUsers:\n');
    console.log(users);
} catch (error) {
    console.log('Could not list users');
}

console.log('\n' + '='.repeat(60));
console.log('\n💡 NEXT STEPS:\n');
console.log('If connection works, verify the database and user exist:');
console.log('1. Check if "ecommerce" database exists:');
console.log('   sudo -u postgres createdb ecommerce\n');
console.log('2. Verify postgres user password:');
console.log('   sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD \'pakistan2025\';"');
console.log('   (You may need to change the password)\n');
console.log('3. Test connection with password:');
console.log('   psql -h localhost -U postgres -d postgres\n');
console.log('4. Once verified, run migrations:');
console.log('   node run-all-migrations.js\n');
