import React, { useState } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { motion } from "framer-motion";
import {
  CreditCard,
  Lock,
  CheckCircle,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import { notify } from "./ModernNotification";
import { getCountryCode } from "../utils/countryCodeMapping";
import { cartAPI } from "../api/api";

// Helper to include auth automatically
const withAuth = (options = {}) => {
  const token = (typeof window !== 'undefined' && localStorage.getItem('token')) || '';
  return {
    credentials: 'include',
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  };
};

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#ffffff",
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

const StripeCheckoutForm = ({
  formData,
  orderTotal,
  loading,
  setLoading,
  message,
  setMessage,
  router,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState(null);

  const handleCardChange = (event) => {
    setCardComplete(event.complete);
    setCardError(event.error ? event.error.message : null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // Validate required fields
      const requiredFields = [
        "email",
        "shippingName",
        "shippingAddress",
        "shippingCity",
        "shippingState",
        "shippingCountry",
        "shippingPhone",
      ];

      const missingFields = requiredFields.filter((field) => !formData[field]);

      if (missingFields.length > 0) {
        throw new Error(
          `Please fill in all required fields: ${missingFields.join(", ")}`
        );
      }

      if (!cardComplete) {
        throw new Error("Please complete your card information");
      }

      // Step 1: Create payment intent
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/stripe/create-payment-intent`,
        withAuth({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: parseFloat(orderTotal),
            currency: "usd",
            metadata: {
              email: formData.email,
              orderId: `temp-${Date.now()}`,
            },
          }),
        })
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized. Please log in before checking out.");
        }
        throw new Error("Failed to create payment intent");
      }

      const { clientSecret, paymentIntentId } = await response.json();

      // Step 2: Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement);
      

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: formData.billingName || formData.shippingName,
              email: formData.email,
              phone: formData.billingPhone || formData.shippingPhone,
              address: {
                line1: formData.billingAddress || formData.shippingAddress,
                city: formData.billingCity || formData.shippingCity,
                state: formData.billingState || formData.shippingState,
                country: getCountryCode(
                  formData.billingCountry || formData.shippingCountry
                ),
              },
            },
          },
        }
      );

      if (error) {
        console.error("Stripe payment error:", error);
        throw new Error(error.message);
      }
      if (paymentIntent.status === "succeeded") {
        // Step 3: Process checkout on backend
        const checkoutResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/stripe/process-checkout`,
          withAuth({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: formData.email,
              ...(formData.password && { password: formData.password }),
              ...(formData.phoneNumber && { phoneNumber: formData.phoneNumber }),
              ...(formData.fullName && { firstName: formData.fullName }),
              amount: orderTotal,
              paymentIntentId: paymentIntent.id,
              clientSecret: clientSecret, // Add clientSecret for debugging
              shippingName: formData.shippingName,
              shippingMethod: formData.shippingMethod || "standard",
              ...(formData.shippingCompany && { shippingCompany: formData.shippingCompany }),
              shippingPhone: formData.shippingPhone,
              shippingAddress: formData.shippingAddress,
              shippingCity: formData.shippingCity,
              shippingState: formData.shippingState,
              shippingCountry: formData.shippingCountry,
              billingName: formData.billingName || formData.shippingName,
              ...(formData.billingCompany && { billingCompany: formData.billingCompany }),
              billingPhone: formData.billingPhone || formData.shippingPhone,
              billingAddress: formData.billingAddress || formData.shippingAddress,
              billingCity: formData.billingCity || formData.shippingCity,
              billingState: formData.billingState || formData.shippingState,
              billingCountry: formData.billingCountry || formData.shippingCountry,
              orderDetails: formData.orderDetails,
            }),
          })
        );

        if (!checkoutResponse.ok) {
          if (checkoutResponse.status === 401) {
            throw new Error("Unauthorized. Please log in before checking out. If you are already logged in, please try logging out and logging back in.");
          }
          throw new Error("Failed to process order");
        }

        const orderData = await checkoutResponse.json();

        setMessage("Payment successful!");
        notify.success("Payment successful! Redirecting to confirmation page...");

        // Prepare data for confirmation page
        const confirmationData = {
          ...formData,
          orderId: orderData.orderId,
          trackingNumber: orderData.trackingNumber,
          paymentIntentId: paymentIntent.id,
          orderStatus: "processing",
          paymentStatus: "completed",
        };

        // Store confirmation data in localStorage
        localStorage.setItem(
          "orderConfirmation",
          JSON.stringify(confirmationData)
        );

        // Clear cart from database and all storage layers after successful order placement
        try {
          // Clear from backend database
          try {
            await cartAPI.clearCart();
          } catch (err) {
            console.warn('⚠️ Error clearing cart from database:', err);
          }
          
          // Clear from localStorage
          localStorage.removeItem('cart');
          localStorage.removeItem('checkoutData');
          
          // Clear from sessionStorage
          sessionStorage.clear();
          
          // Trigger cart count update
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('storage'));
          }
        } catch (error) {
          console.error('⚠️ Error clearing cart:', error);
        }

        // Redirect to confirmation page after 2 seconds
        setTimeout(() => {
          router.push("/order-confirmation");
        }, 2000);
      }
    } catch (error) {
      console.error("Payment Error:", error);
      setMessage(error.message || "Payment failed. Please try again.");
      notify.error(error.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Card Element */}
      <div className="space-y-4">
        <div className="bg-[#1c1816] border border-[#c70007]/30 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <CreditCard className="h-5 w-5 text-[#c70007] mr-2" />
            <span className="text-white font-medium">Card Information</span>
          </div>

          <div className="bg-[#1c1816] border border-[#c70007]/20 p-3 rounded-lg">
            <CardElement
              options={CARD_ELEMENT_OPTIONS}
              onChange={handleCardChange}
            />
          </div>

          {cardError && (
            <div className="mt-2 text-[#c70007] text-sm flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {cardError}
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="flex items-start p-3 bg-[#c70007]/20 rounded-lg">
          <Lock className="w-5 h-5 text-[#c70007] mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-gray-300">
              Your payment information is encrypted and secure. We use Stripe's
              industry-leading security to protect your data.
            </p>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <motion.button
          type="submit"
          disabled={loading || !stripe || !cardComplete}
          className="w-full bg-gradient-to-r from-[#c70007] to-[#c70007]/70 text-white rounded-lg p-3.5 font-bold text-lg shadow-lg shadow-[#c70007]/20 relative overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {loading ? (
              <>
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                Processing Payment...
              </>
            ) : (
              <>
                Pay ${orderTotal}
                <DollarSign className="w-5 h-5" />
              </>
            )}
          </span>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-[#c70007] to-[#e60008] w-0 group-hover:w-full transition-all duration-300"
            initial={{ width: 0 }}
            whileHover={{ width: "100%" }}
          />
        </motion.button>
      </div>

      {/* Message Display */}
      {message && (
        <motion.div
          className={`p-4 rounded-lg ${
            message.includes("success")
              ? "bg-green-500/20 text-green-300 border border-green-500/30"
              : "bg-[#c70007]/20 text-[#c70007] border border-[#c70007]/30"
          }`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="flex items-center gap-2">
            {message.includes("success") ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            {message}
          </p>
        </motion.div>
      )}
    </form>
  );
};

export default StripeCheckoutForm;
