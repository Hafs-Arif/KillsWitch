#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔍 PostgreSQL Diagnostic Tool\n');
console.log('='.repeat(60));

// Check 1: PostgreSQL Service Status
console.log('\n1️⃣  Checking PostgreSQL Service Status...\n');
try {
    const status = execSync('systemctl status postgresql', { encoding: 'utf-8' });
    console.log(status);
} catch (error) {
    console.log('PostgreSQL service status check failed');
}

// Check 2: PostgreSQL Process
console.log('\n2️⃣  Checking for PostgreSQL processes...\n');
try {
    const processes = execSync('ps aux | grep postgres', { encoding: 'utf-8' });
    console.log(processes);
} catch (error) {
    console.log('No PostgreSQL processes found');
}

// Check 3: PostgreSQL Port
console.log('\n3️⃣  Checking if PostgreSQL is listening on port 5432...\n');
try {
    const ports = execSync('netstat -tulpn 2>/dev/null | grep 5432 || ss -tulpn 2>/dev/null | grep 5432', { encoding: 'utf-8', shell: '/bin/bash' });
    console.log(ports);
} catch (error) {
    console.log('PostgreSQL is not listening on port 5432');
}

// Check 4: PostgreSQL Data Directory
console.log('\n4️⃣  Checking PostgreSQL data directory...\n');
try {
    const dataDir = execSync('sudo -u postgres psql --version', { encoding: 'utf-8' });
    console.log('PostgreSQL version:', dataDir);
} catch (error) {
    console.log('Could not get PostgreSQL version');
}

console.log('\n' + '='.repeat(60));
console.log('\n💡 NEXT STEPS:\n');
console.log('If PostgreSQL is not running:');
console.log('1. Start PostgreSQL:');
console.log('   sudo systemctl start postgresql\n');
console.log('2. Check if it started successfully:');
console.log('   sudo systemctl status postgresql\n');
console.log('3. View PostgreSQL logs:');
console.log('   sudo journalctl -xe -u postgresql | tail -50\n');
console.log('4. If there are errors, check the data directory:');
console.log('   sudo pg_lsclusters\n');
console.log('5. Initialize database cluster if needed:');
console.log('   sudo -u postgres /usr/lib/postgresql/*/bin/initdb -D /var/lib/postgresql/*/main\n');
console.log('6. Once PostgreSQL is running, verify connection:');
console.log('   psql -U postgres -h localhost -d postgres -c "SELECT version();"\n');
console.log('7. Then run migrations:');
console.log('   node run-all-migrations.js\n');
