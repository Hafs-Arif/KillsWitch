// Debug specific payment intent
require("dotenv").config();
const Stripe = require("stripe");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

async function debugPaymentIntent(paymentIntentId) {
  console.log(`=== Debugging Payment Intent: ${paymentIntentId} ===`);
  
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    console.log("✅ Payment Intent Found!");
    console.log("Details:", {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      created: new Date(paymentIntent.created * 1000).toISOString(),
      client_secret: paymentIntent.client_secret?.substring(0, 20) + '...',
      last_payment_error: paymentIntent.last_payment_error,
      charges: paymentIntent.charges?.data?.length || 0,
      metadata: paymentIntent.metadata
    });
    
    if (paymentIntent.charges?.data?.length > 0) {
      console.log("\nCharges:", paymentIntent.charges.data.map(charge => ({
        id: charge.id,
        status: charge.status,
        amount: charge.amount,
        paid: charge.paid,
        failure_code: charge.failure_code,
        failure_message: charge.failure_message
      })));
    }
    
    if (paymentIntent.last_payment_error) {
      console.log("\n❌ Last Payment Error:", paymentIntent.last_payment_error);
    }
    
    console.log(`\nStatus: ${paymentIntent.status}`);
    if (paymentIntent.status === "succeeded") {
      console.log("✅ Payment was successful!");
    } else {
      console.log("❌ Payment was not successful. Status:", paymentIntent.status);
    }
    
  } catch (error) {
    console.error("❌ Error retrieving payment intent:", error.message);
    console.error("Error details:", {
      type: error.type,
      code: error.code,
      param: error.param
    });
  }
}

// Debug the specific payment intent that's failing
const failingPaymentIntentId = "pi_3SDZRzQnEACynffS0SWvOYTu";
debugPaymentIntent(failingPaymentIntentId);
