require('dotenv').config();
const { Sequelize } = require('sequelize');

async function testDatabaseConnection() {
    console.log('🔐 Testing Database Connection\n');
    console.log('Configuration:');
    console.log('='.repeat(60));
    console.log(`Host:     ${process.env.DB_HOST || 'localhost'}`);
    console.log(`Port:     ${process.env.DB_PORT || 5432}`);
    console.log(`User:     ${process.env.DB_USER || 'postgres'}`);
    console.log(`Database: ${process.env.DB_NAME || 'killswitch_db'}`);
    console.log(`Password: ${process.env.DB_PASSWORD ? '••••••••' : 'NOT SET'}`);
    console.log('='.repeat(60) + '\n');

    const sequelize = new Sequelize(
        process.env.DB_NAME || 'killswitch_db',
        process.env.DB_USER || 'postgres',
        process.env.DB_PASSWORD || 'postgree@umer',
        {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            dialect: 'postgres',
            logging: false,
        }
    );

    try {
        console.log('📡 Connecting to database...\n');
        await sequelize.authenticate();
        console.log('✅ Connection successful!\n');

        console.log('📋 Database Information:');
        console.log('='.repeat(60));

        const queryInterface = sequelize.getQueryInterface();
        const tables = await queryInterface.showAllTables();

        console.log(`Total tables: ${tables.length}\n`);

        if (tables.length > 0) {
            console.log('Existing tables:');
            tables.forEach((table) => {
                console.log(`  • ${table}`);
            });
        } else {
            console.log('No tables found. Run migrations to create them.');
        }

        console.log('='.repeat(60) + '\n');
        console.log('🎉 Database is ready for migrations!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Connection failed!\n');
        console.error('Error:', error.message);
        console.error('\n💡 Troubleshooting:');
        console.error('1. Ensure PostgreSQL is running');
        console.error('2. Check that credentials are correct in .env file');
        console.error('3. Verify the database user has access');
        console.error('4. Try connecting manually:');
        console.error(`   psql -h ${process.env.DB_HOST || 'localhost'} -U ${process.env.DB_USER || 'postgres'} -d ${process.env.DB_NAME || 'killswitch_db'}\n`);

        process.exit(1);

    } finally {
        await sequelize.close();
    }
}

testDatabaseConnection();
