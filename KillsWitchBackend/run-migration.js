require('dotenv').config();
const { sequelize } = require('./models');
const migration = require('./migrations/create-sessions-table.js');

async function runMigration() {
    try {
        console.log('Running product specifications migration...');
        
        // Run the migration
        await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
        
        console.log('Migration completed successfully!');
        console.log('Product table now includes all specification columns.');
        
    } catch (error) {
        console.error('Migration failed:', error.message);
        
        // If columns already exist, that's okay
        if (error.message.includes('already exists')) {
            console.log('Columns already exist - migration was previously run.');
        }
    } finally {
        await sequelize.close();
    }
}

runMigration();