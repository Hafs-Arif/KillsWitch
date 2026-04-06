#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

function question(query) {
    return new Promise(resolve => {
        rl.question(query, resolve);
    });
}

async function setupAuth() {
    console.log('\n🔐 KillsWitch Database Authentication Setup\n');
    console.log('='.repeat(60));

    // Check if .env exists
    if (fs.existsSync(envPath)) {
        console.log('✅ .env file already exists\n');
        const overwrite = await question('Do you want to reconfigure it? (y/n): ');
        if (overwrite.toLowerCase() !== 'y') {
            console.log('\n✨ Setup cancelled.');
            rl.close();
            return;
        }
    }

    console.log('\n📝 Please enter your PostgreSQL credentials:\n');

    const dbHost = await question('Database Host (default: localhost): ');
    const dbPort = await question('Database Port (default: 5432): ');
    const dbUser = await question('Database User (default: postgres): ');
    const dbPassword = await question('Database Password: ');
    const dbName = await question('Database Name (default: killswitch_db): ');

    const envContent = `# Database Configuration
DB_HOST=${dbHost || 'localhost'}
DB_PORT=${dbPort || 5432}
DB_USER=${dbUser || 'postgres'}
DB_PASSWORD=${dbPassword}
DB_NAME=${dbName || 'killswitch_db'}
DB_DIALECT=postgres

# Environment
NODE_ENV=development

# Server Configuration
PORT=5000

# JWT Secrets
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Cloudinary (optional)
CLOUDINARY_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Stripe (optional)
STRIPE_SECRET_KEY=
STRIPE_PUBLIC_KEY=

# Email Configuration (optional)
EMAIL_USER=
EMAIL_PASSWORD=

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
`;

    try {
        fs.writeFileSync(envPath, envContent);
        console.log('\n✅ .env file created successfully!\n');
        console.log('Configuration:');
        console.log('='.repeat(60));
        console.log(`Host:     ${dbHost || 'localhost'}`);
        console.log(`Port:     ${dbPort || 5432}`);
        console.log(`User:     ${dbUser || 'postgres'}`);
        console.log(`Database: ${dbName || 'killswitch_db'}`);
        console.log('='.repeat(60) + '\n');

        console.log('📋 Next steps:\n');
        console.log('1. Test the database connection:');
        console.log('   node test-db-connection.js\n');
        console.log('2. Once connection is successful, run all migrations:');
        console.log('   node run-all-migrations.js\n');

    } catch (error) {
        console.error('\n❌ Error creating .env file:', error.message);
    }

    rl.close();
}

setupAuth();
