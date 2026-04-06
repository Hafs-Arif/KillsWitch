"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  CheckCircle,
  Package,
  Truck,
  MapPin,
  Calendar,
  CreditCard,
  User,
  Mail,
  Phone,
  Download,
  ArrowLeft,
  Star,
  Clock,
  ShoppingBag,
  Receipt,
  Eye,
  Copy,
  Check
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Navbar from "../component/HomeComponents/Navbar"
import Footer from "../component/HomeComponents/Footer"
import { notify, ModernNotificationContainer } from "../components/ModernNotification"

export default function OrderConfirmationPage() {
  const router = useRouter()
  const [orderData, setOrderData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Load order confirmation data from localStorage
    const loadOrderData = () => {
      try {
        const confirmationData = localStorage.getItem('orderConfirmation')
        if (confirmationData) {
          const parsedData = JSON.parse(confirmationData)
          setOrderData(parsedData)
        } else {
          // If no order data found, redirect to home
          notify.error('No order confirmation data found')
          setTimeout(() => {
            router.push('/')
          }, 2000)
        }
      } catch (error) {
        console.error('Error loading order confirmation data:', error)
        notify.error('Error loading order details')
      } finally {
        setLoading(false)
      }
    }

    loadOrderData()
  }, [router])

  const copyOrderId = () => {
    if (orderData?.orderId) {
      navigator.clipboard.writeText(orderData.orderId)
      setCopied(true)
      notify.success('Order ID copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const copyTrackingNumber = () => {
    if (orderData?.trackingNumber) {
      navigator.clipboard.writeText(orderData.trackingNumber)
      notify.success('Tracking number copied to clipboard')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const downloadReceipt = () => {
    // Create a simple receipt text
    if (orderData) {
      const receiptText = `
ORDER CONFIRMATION RECEIPT
========================

Order ID: ${orderData.orderId}
Tracking Number: ${orderData.trackingNumber}
Date: ${new Date().toLocaleDateString()}
Status: ${orderData.orderStatus}

CUSTOMER INFORMATION:
Email: ${orderData.email}
Name: ${orderData.shippingName}
Phone: ${orderData.shippingPhone}

SHIPPING ADDRESS:
${orderData.shippingAddress}
${orderData.shippingCity}, ${orderData.shippingState}
${orderData.shippingCountry}

ORDER DETAILS:
${orderData.orderDetails?.items?.map(item => 
  `- ${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`
).join('\n') || 'No items found'}

PAYMENT INFORMATION:
Method: ${orderData.paymentMethod || 'Card Payment'}
Status: ${orderData.orderStatus === 'COD_PENDING' ? 'Payment Due on Delivery' : 'Completed'}
${orderData.orderStatus === 'COD_PENDING' ? 'Please have exact amount ready: $' + orderData.amount : ''}

TOTALS:
Subtotal: $${orderData.orderDetails?.subtotal || '0.00'}
Shipping: $${orderData.orderDetails?.shipping || '0.00'}
Tax: $${orderData.orderDetails?.tax || '0.00'}
Total: $${orderData.orderDetails?.total || '0.00'}

Thank you for your order!
      `
      
      const blob = new Blob([receiptText], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `receipt-${orderData.orderId}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      notify.success('Receipt downloaded!')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-black text-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-[#c70007] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-300">Loading order confirmation...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!orderData) {
    return (
      <div className="flex flex-col min-h-screen bg-black text-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Package className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
            <p className="text-gray-400 mb-6">We couldn't find your order confirmation details.</p>
            <Link href="/">
              <motion.button
                className="px-6 py-3 bg-gradient-to-r from-[#c70007] to-[#a50005] hover:from-[#a50005] hover:to-[#850004] rounded-lg text-white transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Return to Home
              </motion.button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Navbar />
      <ModernNotificationContainer />

      <div className="flex-1 relative">
        {/* Animated background elements */}
        <div className="fixed inset-0 z-[-1] overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(199,0,7,0.08),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(199,0,7,0.04),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(199,0,7,0.04),transparent_50%)]" />
          </div>
          
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-1/4 left-1/6 w-32 h-32 border border-[#c70007]/20 rotate-45 rounded-lg" />
            <div className="absolute top-3/4 right-1/4 w-24 h-24 border border-[#c70007]/15 rotate-12 rounded-full" />
            <div className="absolute top-1/2 left-3/4 w-16 h-16 border border-[#c70007]/10 -rotate-12 rounded-lg" />
          </div>

          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-[#c70007]/10 to-[#c70007]/10 blur-3xl"
            animate={{
              x: [0, 50, 0],
              y: [0, -50, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ 
              duration: 25, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-gradient-to-r from-[#c70007]/10 to-[#c70007]/10 blur-3xl"
            animate={{
              x: [0, -60, 0],
              y: [0, 60, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ 
              duration: 30, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
        </div>

        <div className="pt-10 pb-16 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            {/* Success Header */}
            <motion.div
              className="text-center mb-10"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                className="inline-flex items-center justify-center w-20 h-20 bg-[#c70007]/20 rounded-full mb-6 border border-[#c70007]/30"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <CheckCircle className="w-10 h-10 text-[#c70007]" />
              </motion.div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                  Order Confirmed!
                </span>
              </h1>
              <div className="flex justify-center items-center gap-3 mb-6">
                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#c70007] rounded-full" />
                <div className="w-2 h-2 bg-[#c70007] rounded-full animate-pulse" />
                <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#c70007] rounded-full" />
              </div>
              <p className="text-xl text-gray-300 mb-2">
                Thank you for your purchase. Your order has been successfully placed.
              </p>
              {orderData?.email && (
                <p className="text-sm text-gray-400 mb-6 flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" />
                  A confirmation email has been sent to
                  <span className="text-white font-medium">{orderData.email}</span>
                </p>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <div className="flex items-center gap-2 backdrop-blur-xl bg-[#1c1816] border border-[#c70007]/30 px-4 py-2 rounded-lg shadow-lg">
                  <Receipt className="w-5 h-5 text-[#c70007]" />
                  <span className="text-sm text-gray-300">Order ID:</span>
                  <span className="font-mono text-white">{orderData.orderId}</span>
                  <button
                    onClick={copyOrderId}
                    className="ml-2 p-1 hover:bg-[#c70007]/20 rounded transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-[#c70007]" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400 hover:text-[#c70007]" />
                    )}
                  </button>
                </div>
                
                {orderData.trackingNumber && (
                  <div className="flex items-center gap-2 backdrop-blur-xl bg-[#1c1816] border border-[#c70007]/30 px-4 py-2 rounded-lg shadow-lg">
                    <Truck className="w-5 h-5 text-[#c70007]" />
                    <span className="text-sm text-gray-300">Tracking:</span>
                    <span className="font-mono text-white">{orderData.trackingNumber}</span>
                    <button
                      onClick={copyTrackingNumber}
                      className="ml-2 p-1 hover:bg-[#c70007]/20 rounded transition-colors"
                    >
                      <Copy className="w-4 h-4 text-gray-400 hover:text-[#c70007]" />
                    </button>
                  </div>
                )}
                {/* delivery estimate on confirmation page */}
                {orderData.leadTime && (
                  <p className="text-gray-300 mt-2">Estimated delivery in <span className="font-medium text-white">{orderData.leadTime} day{orderData.leadTime > 1 ? 's' : ''}</span></p>
                )}
                {orderData.shippingDate && (
                  <p className="text-gray-300 mt-1">Shipped on {new Date(orderData.shippingDate).toLocaleDateString()}</p>
                )}
              </div>
            </motion.div>

            {/* Order Status Timeline */}
            <motion.div
              className="backdrop-blur-xl bg-[#1c1816] border border-[#c70007]/30 p-6 rounded-2xl shadow-2xl hover:shadow-[0_20px_40px_rgba(199,0,7,0.15)] transition-all duration-300 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-[#c70007]" />
                Order Status
              </h2>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-[#c70007] rounded-full flex items-center justify-center shadow-lg shadow-[#c70007]/20">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-white">Order Placed</p>
                    <p className="text-sm text-gray-400">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="flex-1 h-0.5 bg-gradient-to-r from-[#c70007] to-gray-700 mx-4"></div>
                
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-[#c70007]/60 rounded-full flex items-center justify-center">
                    <Package className="w-4 h-4 text-white" />
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-white">Processing</p>
                    <p className="text-sm text-gray-400">1-2 business days</p>
                  </div>
                </div>
                
                <div className="flex-1 h-0.5 bg-gray-700 mx-4"></div>
                
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                    <Truck className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-400">Shipped</p>
                    <p className="text-sm text-gray-500">3-5 business days</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Order Details */}
              <motion.div
                className="backdrop-blur-xl bg-[#1c1816] border border-[#c70007]/30 p-6 rounded-2xl shadow-2xl hover:shadow-[0_20px_40px_rgba(199,0,7,0.15)] transition-all duration-300"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <ShoppingBag className="w-5 h-5 mr-2 text-[#c70007]" />
                  Order Details
                </h2>
                
                {orderData.orderDetails?.items && orderData.orderDetails.items.length > 0 ? (
                  <div className="space-y-4">
                    {orderData.orderDetails.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-black/30 border border-[#c70007]/20 rounded-lg hover:border-[#c70007]/40 transition-all duration-300">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#c70007]/20 to-[#c70007]/10 rounded-lg flex items-center justify-center border border-[#c70007]/30">
                          <Package className="w-8 h-8 text-[#c70007]" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-white">{item.item || item.name || 'Product'}</h3>
                          <p className="text-sm text-gray-400">
                            Condition: {item.condition || 'New'} | Qty: {item.quantity}
                          </p>
                          <p className="text-sm text-[#c70007] font-medium">
                            ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {/* Order Totals */}
                    <div className="border-t border-[#c70007]/30 pt-4 space-y-2">
                      <div className="flex justify-between text-gray-300">
                        <span>Subtotal:</span>
                        <span>${(orderData.orderDetails.subtotal || 0).toFixed ? (orderData.orderDetails.subtotal || 0).toFixed(2) : (orderData.orderDetails.subtotal || '0.00')}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Shipping:</span>
                        <span>${(orderData.orderDetails.shipping || 0).toFixed ? (orderData.orderDetails.shipping || 0).toFixed(2) : (orderData.orderDetails.shipping || '0.00')}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Tax:</span>
                        <span>${(orderData.orderDetails.tax || 0).toFixed ? (orderData.orderDetails.tax || 0).toFixed(2) : (orderData.orderDetails.tax || '0.00')}</span>
                      </div>
                      <div className="flex justify-between text-white font-semibold text-lg border-t border-[#c70007]/30 pt-2">
                        <span>Total:</span>
                        <span className="text-[#c70007]">${(orderData.orderDetails.total || 0).toFixed ? (orderData.orderDetails.total || 0).toFixed(2) : (orderData.orderDetails.total || '0.00')}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400">No order items found</p>
                )}
              </motion.div>

              {/* Customer & Shipping Info */}
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                {/* Customer Information */}
                <div className="backdrop-blur-xl bg-[#1c1816] border border-[#c70007]/30 p-6 rounded-2xl shadow-2xl hover:shadow-[0_20px_40px_rgba(199,0,7,0.15)] transition-all duration-300">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-[#c70007]" />
                    Customer Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">{orderData.email}</span>
                    </div>
                    {orderData.shippingPhone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300">{orderData.shippingPhone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="backdrop-blur-xl bg-[#1c1816] border border-[#c70007]/30 p-6 rounded-2xl shadow-2xl hover:shadow-[0_20px_40px_rgba(199,0,7,0.15)] transition-all duration-300">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-[#c70007]" />
                    Shipping Address
                  </h3>
                  <div className="text-gray-300 space-y-1">
                    <p className="font-medium">{orderData.shippingName}</p>
                    {orderData.shippingCompany && (
                      <p className="text-sm text-gray-400">{orderData.shippingCompany}</p>
                    )}
                    <p>{orderData.shippingAddress}</p>
                    <p>
                      {orderData.shippingCity}, {orderData.shippingState}
                    </p>
                    <p>{orderData.shippingCountry}</p>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="backdrop-blur-xl bg-[#1c1816] border border-[#c70007]/30 p-6 rounded-2xl shadow-2xl hover:shadow-[0_20px_40px_rgba(199,0,7,0.15)] transition-all duration-300">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-[#c70007]" />
                    Payment Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Method:</span>
                      <span className="text-white font-medium">{orderData.paymentMethod || 'Card Payment'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={`font-medium ${
                        orderData.orderStatus === 'COD_PENDING' ? 'text-yellow-400' : 'text-[#c70007]'
                      }`}>
                        {orderData.orderStatus === 'COD_PENDING' ? 'Payment Due on Delivery' : (orderData.paymentStatus || 'Completed')}
                      </span>
                    </div>
                    {orderData.paymentMethod !== 'Cash on Delivery (COD)' && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Payment ID:</span>
                        <span className="text-gray-300 font-mono text-sm">{orderData.paymentIntentId || 'N/A'}</span>
                      </div>
                    )}
                    {orderData.orderStatus === 'COD_PENDING' && (
                      <div className="mt-3 p-3 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
                        <p className="text-yellow-400 text-sm flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          Please have the exact amount ready when your order arrives: <strong className="ml-1">${orderData.amount}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Action Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center mt-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <motion.button
                onClick={downloadReceipt}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#c70007] to-[#a50005] hover:from-[#a50005] hover:to-[#850004] rounded-lg text-white transition-all shadow-lg shadow-[#c70007]/20"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Download className="w-5 h-5" />
                Download Receipt
              </motion.button>
              
              <Link href="/track-order">
                <motion.button
                  className="flex items-center gap-2 px-6 py-3 border border-[#c70007] text-[#c70007] rounded-lg hover:bg-[#c70007]/10 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Eye className="w-5 h-5" />
                  Track Order
                </motion.button>
              </Link>
              
              <Link href="/orders">
                <motion.button
                  className="flex items-center gap-2 px-6 py-3 bg-[#c70007]/20 border border-[#c70007] text-[#c70007] rounded-lg hover:bg-[#c70007]/30 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ShoppingBag className="w-5 h-5" />
                  View All Orders
                </motion.button>
              </Link>
              
              <Link href="/">
                <motion.button
                  className="flex items-center gap-2 px-6 py-3 border border-white/20 text-white rounded-lg hover:bg-white/5 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft className="w-5 h-5" />
                  Continue Shopping
                </motion.button>
              </Link>
            </motion.div>

            {/* Additional Information */}
            <motion.div
              className="mt-10 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <div className="backdrop-blur-xl bg-[#1c1816] border border-[#c70007]/30 p-6 rounded-2xl shadow-2xl">
                <h3 className="text-lg font-semibold text-white mb-3">What's Next?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#c70007]" />
                    <span>You'll receive an email confirmation shortly</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#c70007]" />
                    <span>Your order will be processed within 1-2 business days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#c70007]" />
                    <span>Tracking information will be sent when shipped</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
