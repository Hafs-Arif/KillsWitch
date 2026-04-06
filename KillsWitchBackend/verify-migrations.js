require('dotenv').config();
const { sequelize } = require('./models');

async function verifyMigrations() {
    try {
        console.log('🔍 Verifying database schema...\n');
        
        const expectedTables = [
            'users',
            'passwordResets',
            'categories',
            'brands',
            'subcategories',
            'brandcategories',
            'products',
            'productimages',
            'shipments',
            'payments',
            'orders',
            'order_items',
            'contacts',
            'newsletters',
            'activity_logs',
            'adminrequests',
            'quotes',
            'chat_messages',
            'cookie_consents',
            'coupons',
            'carts',
            'cart_items',
            'sessions',
            'addresses',
            'reviews'
        ];
        
        const queryInterface = sequelize.getQueryInterface();
        const tables = await queryInterface.showAllTables();
        
        console.log(`📊 Database: ${process.env.DB_NAME || 'killswitch_db'}`);
        console.log(`📍 Host: ${process.env.DB_HOST || 'localhost'}\n`);
        console.log('Checking tables...\n');
        
        let presentCount = 0;
        let missingCount = 0;
        
        for (const table of expectedTables) {
            if (tables.includes(table)) {
                console.log(`✅ ${table}`);
                presentCount++;
            } else {
                console.log(`❌ ${table}`);
                missingCount++;
            }
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('📈 Verification Summary');
        console.log('='.repeat(60));
        console.log(`✅ Present tables: ${presentCount}`);
        console.log(`❌ Missing tables: ${missingCount}`);
        console.log('='.repeat(60) + '\n');
        
        if (missingCount === 0) {
            console.log('🎉 All expected tables are present!');
        } else {
            console.log(`⚠️  ${missingCount} table(s) are missing. Run migrations to create them.`);
        }
        
        process.exit(missingCount > 0 ? 1 : 0);
        
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

verifyMigrations();
