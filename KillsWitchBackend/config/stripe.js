const Stripe = require('stripe');

// Ensure environment variables are loaded
require('dotenv').config();

// Validate that the Stripe secret key is available
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is not set in environment variables');
  throw new Error('STRIPE_SECRET_KEY is required');
}

// Initialize Stripe with secret key
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = stripe;
