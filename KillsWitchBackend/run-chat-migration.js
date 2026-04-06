const { sequelize } = require('./models');
const migration = require('./migrations/add-message-deduplication-fields.js');

async function runMigration() {
  try {
    console.log('🔄 Running chat message deduplication migration...');
    
    await migration.up(sequelize.getQueryInterface(), sequelize.constructor);
    
    console.log('✅ Migration completed successfully!');
    console.log('📋 Added new fields:');
    console.log('   - seenByAdmin (BOOLEAN)');
    console.log('   - seenAt (DATE)');
    console.log('   - messageHash (STRING)');
    console.log('📊 Added indexes for better performance');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
