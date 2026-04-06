"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#000000",
      fontFamily: '"Inter", sans-serif',
      fontSmoothing: "antialiased",
      fontSize: "16px",
      "::placeholder": {
        color: "#9ca3af",
      },
    },
    invalid: {
      color: "#ef4444",
      iconColor: "#ef4444",
    },
  },
  hidePostalCode: false,
};

function TestPaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setLogs([]);

    try {
      addLog("Starting payment test...");

      // Step 1: Create payment intent
      addLog("Creating payment intent...");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stripe/create-payment-intent`, {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          amount: 100, // $1.00
          currency: "usd",
          metadata: {
            test: "true",
            timestamp: Date.now().toString()
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create payment intent");
      }

      const { clientSecret, paymentIntentId } = await response.json();
      addLog(`Payment intent created: ${paymentIntentId}`);

      // Step 2: Confirm payment
      addLog("Confirming payment with test card...");
      const cardElement = elements.getElement(CardElement);
      
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: "Test User",
            email: "test@example.com",
          },
        },
      });

      if (error) {
        addLog(`Payment error: ${error.message}`);
        throw new Error(error.message);
      }

      addLog(`Payment confirmed: ${paymentIntent.id}, status: ${paymentIntent.status}`);

      // Step 3: Process checkout
      addLog("Processing checkout...");
      const checkoutResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stripe/process-checkout`, {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          email: "test@example.com",
          amount: 1.00,
          paymentIntentId: paymentIntent.id,
          clientSecret: clientSecret,
          shippingName: "Test User",
          shippingAddress: "123 Test St",
          shippingCity: "Test City",
          shippingState: "TS",
          shippingCountry: "US",
          shippingPhone: "1234567890",
          orderDetails: {
            items: [{
              id: "test-item",
              name: "Test Item",
              price: 1.00,
              quantity: 1,
              condition: "NEW"
            }],
            subtotal: "1.00",
            shipping: "0.00",
            tax: "0.00",
            total: "1.00",
            isFullCart: false
          }
        }),
      });

      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json().catch(() => ({}));
        addLog(`Checkout error: ${errorData.error || 'Unknown error'}`);
        throw new Error(errorData.error || "Failed to process checkout");
      }

      const orderData = await checkoutResponse.json();
      addLog(`Order processed successfully: ${orderData.orderId}`);
      setMessage("✅ Payment test completed successfully!");

    } catch (error) {
      addLog(`Error: ${error.message}`);
      setMessage(`❌ Payment test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Stripe Payment Test</h1>
      
      <div className="bg-yellow-100 border border-yellow-400 rounded p-4 mb-6">
        <h3 className="font-bold text-yellow-800">Test Card Numbers:</h3>
        <ul className="text-sm text-yellow-700 mt-2">
          <li><strong>Success:</strong> 4242 4242 4242 4242</li>
          <li><strong>Decline:</strong> 4000 0000 0000 0002</li>
          <li><strong>Insufficient funds:</strong> 4000 0000 0000 9995</li>
          <li><strong>Expiry:</strong> Any future date (e.g., 12/25)</li>
          <li><strong>CVC:</strong> Any 3 digits (e.g., 123)</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border border-gray-300 rounded p-4">
          <label className="block text-sm font-medium mb-2">Card Details</label>
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>

        <button
          type="submit"
          disabled={!stripe || loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Processing..." : "Test Payment"}
        </button>
      </form>

      {message && (
        <div className={`mt-4 p-4 rounded ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      {logs.length > 0 && (
        <div className="mt-6">
          <h3 className="font-bold mb-2">Debug Logs:</h3>
          <div className="bg-gray-100 p-4 rounded text-sm font-mono max-h-60 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TestStripePage() {
  return (
    <Elements stripe={stripePromise}>
      <TestPaymentForm />
    </Elements>
  );
}
