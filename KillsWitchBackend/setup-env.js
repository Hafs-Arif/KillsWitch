const fs = require('fs');
const path = require('path');

// Stripe credentials from your message
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51S6wRUFRh54ymVyz46j65BUnjiv0wDcJk1GZVShvEMfFnBuCJQ3qTqHa1QcgbKbDQO69OzfTWCjvnsp6SIxuvB0b00XqhBgrwY';
const STRIPE_SECRET_KEY = 'sk_test_51S6wRUFRh54ymVyzYOtVe1SJhUpEuP29RjjMUfVGzhiMhoWOXkyjEcyMYWk4DaQDy9g3AXCNGWHWamgzYvmeJDcQ00PHGQbAGl';

const envPath = path.join(__dirname, '.env');

// Read existing .env file if it exists
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

// Check if Stripe keys already exist
const hasStripePublishable = envContent.includes('STRIPE_PUBLISHABLE_KEY=');
const hasStripeSecret = envContent.includes('STRIPE_SECRET_KEY=');

// Add Stripe keys if they don't exist
if (!hasStripePublishable) {
  envContent += `\n# Stripe Configuration\nSTRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY}\n`;
}

if (!hasStripeSecret) {
  envContent += `STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}\n`;
}

// Write the updated .env file
fs.writeFileSync(envPath, envContent);

console.log('✅ Environment variables updated successfully!');
console.log('📝 Added Stripe configuration to .env file');
console.log('🚀 You can now start the server with: npm start');

// Clean up this setup file
fs.unlinkSync(__filename);
console.log('🧹 Setup file cleaned up');
