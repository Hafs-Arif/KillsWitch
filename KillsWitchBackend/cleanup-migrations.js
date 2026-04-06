const fs = require('fs');
const path = require('path');

// Files to remove (old duplicates without proper timestamps)
const filesToRemove = [
    'add-coupon-fields-to-orders.js',
    'add-message-deduplication-fields.js',
    'add-offline-message-fields.js',
    'add-product-specifications-and-images.js',
    'add-same-shipping-billing-preference.js',
    'add-slug-sale-price-video-to-products.js',
    'create-addresses-table.js',
    'create-cart-tables.js',
    'create-coupons-table.js',
    'create-reviews-table.js',
    'create-sessions-table.js',
    'remove-title-from-reviews.js'
];

const migrationsDir = path.join(__dirname, 'migrations');

console.log('🧹 Cleaning up duplicate migration files...\n');

let removedCount = 0;

for (const file of filesToRemove) {
    const filePath = path.join(migrationsDir, file);
    
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            console.log(`✅ Removed: ${file}`);
            removedCount++;
        } catch (error) {
            console.error(`❌ Failed to remove ${file}: ${error.message}`);
        }
    } else {
        console.log(`⏭️  Skipped: ${file} (not found)`);
    }
}

console.log(`\n✨ Cleanup complete! Removed ${removedCount} duplicate files.`);
