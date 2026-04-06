"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Modal from "../component/GeneralComponents/Modal"
import {
  Package,
  Truck,
  Calendar,
  Clock,
  MapPin,
  Phone,
  CreditCard,
  Edit2,
  AlertCircle,
  CheckCircle,
  Check,
  ShoppingBag,
  ChevronRight,
  Loader,
  X,
  TrendingUp,
  DollarSign,
  BarChart3,
  Activity,
  Archive,
  Star,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import dynamic from "next/dynamic"
import Footer from "../component/HomeComponents/Footer"
import { fetchOrdersByEmail, updateOrderShipping } from "../api/orders-api/order-api"
import { API, BASE_URL } from "../api/api"
import UserChat from "../component/socketsComponents/UserChat"

// Dynamically import Navbar with SSR disabled
const Navbar = dynamic(() => import("../component/HomeComponents/Navbar"), {
  ssr: false,
})

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, isProcessing }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <motion.div
        className="backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl w-full max-w-md"
        style={{ backgroundColor: '#1c1816' }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-gray-300 hover:text-white transition-colors"
            disabled={isProcessing}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <p className="text-gray-300 text-center">{message}</p>
          <p className="text-xs text-gray-400 text-center mt-4">
            This action cannot be undone.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <motion.button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#c70007]/50 rounded-lg text-gray-300 hover:bg-[#c70007]/20 hover:text-white transition-all"
            whileTap={{ scale: 0.95 }}
            disabled={isProcessing}
          >
            No, Keep Order
          </motion.button>
          <motion.button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg text-white transition-all flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader className="animate-spin h-4 w-4" />
                <span>Cancelling...</span>
              </>
            ) : (
              <>
                <X className="w-4 h-4" />
                <span>Yes, Cancel Order</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isVisible, setIsVisible] = useState({})
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // State for expanded/collapsed orders
  const [expandedOrders, setExpandedOrders] = useState(new Set())

  // auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  // Update modal state
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [currentOrderId, setCurrentOrderId] = useState(null)
  const [updateFormData, setUpdateFormData] = useState({
    shippingAddress: "",
    shippingPhone: "",
  })
  const [updatingOrder, setUpdatingOrder] = useState(false)

  // Cancel order modal state
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancellingOrder, setCancellingOrder] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState(null)

  // Modal state for notifications
  const [showModal, setShowModal] = useState(false)
  const [modalContent, setModalContent] = useState({
    type: "",
    message: "",
  })

  // State for recently updated orders
  const [recentlyUpdated, setRecentlyUpdated] = useState(new Set())

  // Dashboard statistics
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    completedOrders: 0,
    pendingOrders: 0,
    averageOrderValue: 0,
    totalItems: 0,
  })

  // Track processing buttons to prevent double clicks
  const [processingActions, setProcessingActions] = useState(new Set())

  // Toggle order expansion
  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  useEffect(() => {
    setIsClient(true)

    const checkAuth = async () => {
      try {
        const profile = await API.auth.getProfile()
        setIsLoggedIn(!!profile)
      } catch (_) {
        setIsLoggedIn(false)
      } finally {
        setAuthChecked(true)
      }
    }
    checkAuth()

    const handleScroll = () => {
      const sections = document.querySelectorAll("section")
      sections.forEach((section) => {
        const sectionTop = section.getBoundingClientRect().top
        const sectionId = section.id
        if (sectionTop < window.innerHeight * 0.75) {
          setIsVisible((prev) => ({ ...prev, [sectionId]: true }))
        }
      })
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Calculate statistics when orders change
  useEffect(() => {
    if (orders.length > 0) {
      const totalSpent = orders.reduce((sum, order) => {
        const amount = parseFloat(order.amountPaid) || 0
        return sum + amount
      }, 0)

      const completedCount = orders.filter(
        (order) => order.orderStatus?.toLowerCase() === "completed"
      ).length

      const pendingCount = orders.filter(
        (order) => order.orderStatus?.toLowerCase() === "pending" || 
                   order.orderStatus?.toLowerCase() === "processing"
      ).length

      const totalItems = orders.reduce((sum, order) => {
        if (order.items && Array.isArray(order.items)) {
          return sum + order.items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0)
        }
        return sum
      }, 0)

      setStats({
        totalOrders: orders.length,
        totalSpent: totalSpent,
        completedOrders: completedCount,
        pendingOrders: pendingCount,
        averageOrderValue: orders.length > 0 ? totalSpent / orders.length : 0,
        totalItems: totalItems,
      })
    }
  }, [orders])

  // Function to check for approved/declined updates
  const checkForApprovedUpdates = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API.BASE_URL}/admin-requests`, {
        method: 'GET',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      })


      if (response.ok) {
        const requests = await response.json()

        // Update orders with approved/declined changes
        if (requests && requests.length > 0) {
          setOrders(prevOrders => 
            prevOrders.map(order => {
              const request = requests.find(req => 
                req.order_id === order.orderId && 
                (req.IsApproved === true || req.IsApproved === false) &&
                order.updatePending
              )
              
              if (request) {
                if (request.IsApproved === true) {
                  // Approved request
                  setModalContent({
                    type: "success",
                    message: `🎉 Your order #${order.orderId} has been updated successfully! Your shipping details have been approved and updated.`,
                  })
                  setShowModal(true)
                  
                  // Mark as recently updated
                  setRecentlyUpdated(prev => new Set([...prev, order.orderId]))
                  
                  // Remove from recently updated after 5 seconds
                  setTimeout(() => {
                    setRecentlyUpdated(prev => {
                      const newSet = new Set(prev)
                      newSet.delete(order.orderId)
                      return newSet
                    })
                  }, 5000)
                  
                  return {
                    ...order,
                    shippingAddress: request.updatedshippingAddress || order.shippingAddress,
                    shippingPhone: request.updatedshippingPhone || order.shippingPhone,
                    updatePending: false,
                    pendingChanges: null,
                    updateRequestId: null
                  }
                } else if (request.IsApproved === false) {
                  // Declined request
                  setModalContent({
                    type: "error",
                    message: `❌ Your update request for order #${order.orderId} was declined. Please contact support for more information.`,
                  })
                  setShowModal(true)
                  
                  return {
                    ...order,
                    updatePending: false,
                    pendingChanges: null,
                    updateRequestId: null
                  }
                }
              }
              return order
            })
          )
        }
      }
    } catch (err) {
      console.error('Error checking update status:', err)
    }
  }

  // Function to refresh orders
  const refreshOrders = async () => {
    try {
      const data = await fetchOrdersByEmail()
      let ordersArray = []
      
      if (data && typeof data === 'object' && data.orders && Array.isArray(data.orders)) {
        ordersArray = data.orders
      } else if (Array.isArray(data)) {
        ordersArray = data
      }
      
      if (ordersArray.length > 0) {
        const sortedOrders = ordersArray.sort((a, b) => {
          const dateA = new Date(a.orderDate || a.createdAt || 0).getTime()
          const dateB = new Date(b.orderDate || b.createdAt || 0).getTime()
          return dateB - dateA
        })
        
        const ordersWithNumbers = sortedOrders.map((order, index) => ({
          ...order,
          userOrderNumber: sortedOrders.length - index
        }))
        
        setOrders(ordersWithNumbers)
      } else {
        setOrders([])
      }
    } catch (err) {
      console.error("Failed to refresh orders:", err)
    }
  }

  useEffect(() => {
    if (!authChecked) return
    if (!isLoggedIn) {
      setLoading(false)
      return
    }

    async function getOrders() {
      try {
        setLoading(true)
        const data = await fetchOrdersByEmail()
        
        let ordersArray = []
        // Handle the case where API returns {orders: [], message: 'No orders found'}
        if (data && typeof data === 'object' && data.orders && Array.isArray(data.orders)) {
          ordersArray = data.orders
        } else if (Array.isArray(data)) {
          if (data[0]?.items) {
            console.log("First order items:")
          }
          ordersArray = data
        } else {
          ordersArray = []
        }
        
        // Sort orders by date descending (newest first) and assign user-relative order numbers
        if (ordersArray.length > 0) {
          const sortedOrders = ordersArray.sort((a, b) => {
            const dateA = new Date(a.orderDate || a.createdAt || 0).getTime()
            const dateB = new Date(b.orderDate || b.createdAt || 0).getTime()
            return dateB - dateA // Descending order (newest first)
          })
          
          // Assign user-relative order numbers (oldest = #1, newest = highest number)
          const ordersWithNumbers = sortedOrders.map((order, index) => ({
            ...order,
            userOrderNumber: sortedOrders.length - index // Reverse index for numbering
          }))
          
          setOrders(ordersWithNumbers)
        } else {
          setOrders([])
        }
        
        // Check for approved updates after loading orders
        await checkForApprovedUpdates()
        
        setLoading(false)
      } catch (err) {
        console.error("Failed to fetch orders:", err)
        // Don't show error for 'No orders found' case
        if (err.message.includes('No orders found')) {
          setOrders([])
          setError(null)
        } else {
          setError(err.message || "Failed to load orders. Please try again.")
        }
        setLoading(false)
      }
    }

    getOrders()

    // Set up periodic check for approved updates (every 30 seconds)
    const intervalId = setInterval(checkForApprovedUpdates, 30000)
    
    return () => clearInterval(intervalId)
  }, [authChecked, isLoggedIn])

  const formatDate = (dateString) => {
    if (!dateString || dateString === "N/A") return "N/A"
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateString
    }
  }

  const closeModal = () => {
    setShowModal(false)
  }

  const getStatusColor = (status) => {
    if (!status) return "backdrop-blur-xl border-[#c70007]/50 text-white bg-[#1c1816]"

    const statusLower = status.toLowerCase()
    if (statusLower === "completed" || statusLower === "delivered") return "backdrop-blur-xl border-green-500/50 text-green-400 bg-[#1c1816]"
    if (statusLower === "pending") return "backdrop-blur-xl border-yellow-500/50 text-yellow-400 bg-[#1c1816]"
    if (statusLower === "cod_pending") return "backdrop-blur-xl border-orange-500/50 text-orange-400 bg-[#1c1816]"
    if (statusLower === "cod_confirmed") return "backdrop-blur-xl border-green-500/50 text-green-400 bg-[#1c1816]"
    if (statusLower === "processing") return "backdrop-blur-xl border-blue-500/50 text-blue-400 bg-[#1c1816]"
    if (statusLower === "cancelled") return "backdrop-blur-xl border-red-500/50 text-red-400 bg-[#1c1816]"
    return "backdrop-blur-xl border-[#c70007]/50 text-white bg-[#1c1816]"
  }

  const getStatusIcon = (status) => {
    if (!status) return <Package className="w-4 h-4 text-white" />

    const statusLower = status.toLowerCase()
    if (statusLower === "completed" || statusLower === "delivered") return <CheckCircle className="w-4 h-4 text-green-400" />
    if (statusLower === "pending") return <Clock className="w-4 h-4 text-yellow-400" />
    if (statusLower === "processing") return <Truck className="w-4 h-4 text-blue-400" />
    if (statusLower === "cancelled") return <AlertCircle className="w-4 h-4 text-red-400" />
    return <Package className="w-4 h-4 text-white" />
  }

  const handleUpdateClick = (orderId, currentAddress, currentPhone) => {
    // Prevent if already processing
    if (processingActions.has(`update-${orderId}`)) return;
    
    setCurrentOrderId(orderId)
    setUpdateFormData({
      shippingAddress: currentAddress !== "N/A" ? currentAddress : "",
      shippingPhone: currentPhone !== "N/A" ? currentPhone : "",
    })
    setShowUpdateModal(true)
  }

  const handleUpdateSubmit = async (e) => {
    e.preventDefault()
    
    // Prevent double submission
    if (updatingOrder) return;
    
    setUpdatingOrder(true)
    setProcessingActions(prev => new Set([...prev, `update-${currentOrderId}`]))

    try {
      // First try to submit update request to admin for approval
      const token = localStorage.getItem('token')
      let response;
      let result;
      
      try {
        response = await fetch(`${API.BASE_URL}/admin-requests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          credentials: 'include',
          body: JSON.stringify({
            order_id: currentOrderId,
            updatedshippingAddress: updateFormData.shippingAddress,
            updatedshippingPhone: updateFormData.shippingPhone,
            request_type: 'shipping_update',
            user_email: localStorage.getItem('userEmail') || 'user@example.com'
          })
        })


        if (!response.ok) {
          const errorText = await response.text()
          console.error('Update request error response:', errorText)
          throw new Error(`Admin request failed: ${response.status} ${response.statusText}`)
        }

        result = await response.json()
        
      } catch (adminRequestError) {
        console.warn('Admin request endpoint failed, trying direct order update:', adminRequestError.message)
        
        // Fallback: Try direct order update
        try {
          await updateOrderShipping(currentOrderId, updateFormData.shippingAddress, updateFormData.shippingPhone)
          result = { success: true, method: 'direct_update' }
        } catch (directUpdateError) {
          console.error('Direct update also failed:', directUpdateError)
          throw new Error('Both admin request and direct update failed. Please try again or contact support.')
        }
      }

      // Update local state based on the result
      if (result.method === 'direct_update') {
        // Direct update was successful, update the order immediately
        setOrders(
          orders.map((order) => {
            if (order.orderId === currentOrderId) {
              return {
                ...order,
                shippingAddress: updateFormData.shippingAddress,
                shippingPhone: updateFormData.shippingPhone,
                updatePending: false,
                pendingChanges: null,
                updateRequestId: null
              }
            }
            return order
          }),
        )

        setModalContent({
          type: "success",
          message: "Order updated successfully! Your shipping details have been updated.",
        })
      } else {
        // Admin request was submitted, show pending status
        setOrders(
          orders.map((order) => {
            if (order.orderId === currentOrderId) {
              return {
                ...order,
                updatePending: true,
                pendingChanges: {
                  shippingAddress: updateFormData.shippingAddress,
                  shippingPhone: updateFormData.shippingPhone,
                },
                updateRequestId: result.admin_request_id || result.id || result._id
              }
            }
            return order
          }),
        )

        setModalContent({
          type: "success",
          message: "Update request submitted successfully! Our team will review and approve your changes shortly.",
        })
      }
      
      setShowModal(true)
      setShowUpdateModal(false)
    } catch (err) {
      console.error("Update Error Details:", {
        message: err.message,
        stack: err.stack,
        currentOrderId,
        updateFormData
      })
      
      let errorMessage = "Failed to submit update request. Please try again."
      
      if (err.message.includes('401')) {
        errorMessage = "Authentication failed. Please log in again."
      } else if (err.message.includes('403')) {
        errorMessage = "You don't have permission to update this order."
      } else if (err.message.includes('404')) {
        errorMessage = "Order not found. Please refresh and try again."
      } else if (err.message.includes('500')) {
        errorMessage = "Server error. Please try again later."
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setModalContent({
        type: "error",
        message: errorMessage,
      })
      setShowModal(true)
    } finally {
      setUpdatingOrder(false)
      setProcessingActions(prev => {
        const newSet = new Set(prev)
        newSet.delete(`update-${currentOrderId}`)
        return newSet
      })
    }
  }

  // Handle cancel order - show modal first
  const handleCancelClick = (order) => {
    // Prevent if already processing
    if (processingActions.has(`cancel-${order.orderId}`)) return;
    
    setOrderToCancel(order)
    setShowCancelModal(true)
  }

  // Handle actual cancel order after confirmation
  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;
    
    // Prevent double submission
    if (cancellingOrder) return;
    
    setCancellingOrder(true)
    setProcessingActions(prev => new Set([...prev, `cancel-${orderToCancel.orderId}`]))

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/orders/${orderToCancel.orderId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      if (!response.ok) {
        let errorMessage = 'Failed to cancel order';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If response is not JSON (e.g., HTML error page), use status
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Update the local orders state immediately instead of refreshing
      setOrders(prevOrders => prevOrders.map(order => 
        order.orderId === orderToCancel.orderId ? { ...order, orderStatus: 'CANCELLED' } : order
      ));
      setRecentlyUpdated(prev => new Set(prev).add(orderToCancel.orderId));

      setModalContent({
        type: "success",
        message: "✅ Order cancelled successfully! You will receive an email confirmation shortly.",
      });
      setShowModal(true);
      
      // Close the cancel modal 
      setShowCancelModal(false);
      setOrderToCancel(null);
      
    } catch (error) {
      console.error('Cancel order error:', error);
      setModalContent({
        type: "error",
        message: error.message || "Failed to cancel order",
      });
      setShowModal(true);
    } finally {
      setCancellingOrder(false);
      if (orderToCancel) {
        setProcessingActions(prev => {
          const newSet = new Set(prev)
          newSet.delete(`cancel-${orderToCancel.orderId}`)
          return newSet
        })
      }
    }
  };

  // Stat Card Component
  const StatCard = ({ icon: Icon, label, value, subtitle, delay }) => (
    <div
      className="backdrop-blur-xl border border-white/10 hover:border-[#c70007]/50 rounded-2xl p-6 relative overflow-hidden shadow-lg hover:shadow-[0_20px_40px_rgba(199,0,7,0.15)] transition-all duration-300"
      style={{ backgroundColor: '#1c1816' }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#c70007]/10 to-transparent rounded-full blur-2xl" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#c70007] to-[#a50005] flex items-center justify-center">
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
        <h3 className="text-gray-300 text-sm font-medium mb-1">{label}</h3>
        <p className="text-3xl font-bold text-white mb-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  )

  return (
    <>
      <div className="bg-black text-white min-h-screen py-20 px-4 sm:px-6">
        <Navbar />
        
        {/* Background Elements */}
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
          
          {isClient && [...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-[#c70007]/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <Modal isOpen={showModal} onClose={closeModal} type={modalContent.type} message={modalContent.message} />

        {/* Cancel Order Confirmation Modal */}
        <ConfirmationModal
          isOpen={showCancelModal}
          onClose={() => {
            setShowCancelModal(false)
            setOrderToCancel(null)
          }}
          onConfirm={handleConfirmCancel}
          title="Cancel Order"
          message={`Are you sure you want to cancel order #${orderToCancel?.userOrderNumber || orderToCancel?.orderId}? This action cannot be undone.`}
          isProcessing={cancellingOrder}
        />

        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <section id="header" className="relative mb-12">
            <motion.div
              className="text-center relative z-10"
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible["header"] ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h1 className="text-5xl md:text-6xl font-bold mb-4">
                  <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                    My Dashboard
                  </span>
                </h1>
                <div className="flex justify-center items-center gap-3 mb-6">
                  <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#c70007] rounded-full" />
                  <div className="w-2 h-2 bg-[#c70007] rounded-full animate-pulse" />
                  <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#c70007] rounded-full" />
                </div>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto">Track your orders, spending, and account activity</p>
              </motion.div>
            </motion.div>
          </section>

          {/* Main Content */}
          {!authChecked ? (
            <motion.div
              className="flex flex-col items-center justify-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Loader className="h-12 w-12 text-[#c70007] animate-spin mb-4" />
              <p className="text-gray-300 text-lg">Checking your session…</p>
            </motion.div>
          ) : !isLoggedIn ? (
            <motion.div
              className="bg-[#1c1816] border border-[#c70007]/50 rounded-xl p-10 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <AlertCircle className="h-16 w-16 text-[#c70007] mx-auto mb-4" />
              <h3 className="text-2xl font-medium text-white mb-2">Login Required</h3>
              <p className="text-gray-300 max-w-md mx-auto mb-6">
                Please login to access your dashboard and view your orders.
              </p>
              <motion.button
                onClick={() => router.push(`/login?next=${encodeURIComponent(pathname || "/orders")}`)}
                className="px-6 py-3 bg-gradient-to-r from-[#c70007] to-[#a50005] hover:from-[#a50005] hover:to-[#850004] rounded-lg text-white transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Go to Login
              </motion.button>
            </motion.div>
          ) : loading ? (
            <motion.div
              className="flex flex-col items-center justify-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Loader className="h-12 w-12 text-[#c70007] animate-spin mb-4" />
              <p className="text-gray-300 text-lg">Loading your dashboard...</p>
            </motion.div>
          ) : (
            <>
              {/* Statistics Cards */}
              <section id="stats" className="mb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <StatCard
                    icon={ShoppingBag}
                    label="Total Orders"
                    value={stats.totalOrders}
                    subtitle="All time orders"
                  />
                  <StatCard
                    icon={DollarSign}
                    label="Total Spent"
                    value={`$${stats.totalSpent.toFixed(2)}`}
                    subtitle={`Avg: $${stats.averageOrderValue.toFixed(2)} per order`}
                  />
                  <StatCard
                    icon={CheckCircle}
                    label="Completed Orders"
                    value={stats.completedOrders}
                    subtitle={`${stats.pendingOrders} in progress`}
                  />
                  <StatCard
                    icon={Package}
                    label="Total Items"
                    value={stats.totalItems}
                    subtitle="Products ordered"
                  />
                  <StatCard
                    icon={Activity}
                    label="Active Orders"
                    value={stats.pendingOrders}
                    subtitle="Currently processing"
                  />
                  <StatCard
                    icon={Star}
                    label="Success Rate"
                    value={stats.totalOrders > 0 ? `${((stats.completedOrders / stats.totalOrders) * 100).toFixed(0)}%` : '0%'}
                    subtitle="Order completion"
                  />
                </div>
              </section>

              {/* Orders Section */}
              <section id="orders" className="relative">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">Order History</h2>
                  <p className="text-gray-400">View and manage all your orders</p>
                </div>

                {orders.length === 0 ? (
                  <div className="bg-[#1c1816] border border-[#c70007]/50 rounded-xl p-10 text-center">
                    <Archive className="h-16 w-16 text-[#c70007] mx-auto mb-4" />
                    <h3 className="text-2xl font-medium text-white mb-2">No Orders Yet</h3>
                    <p className="text-gray-300 max-w-md mx-auto mb-6">
                      {error ? 'Unable to load orders. Please try refreshing.' : 'Start your shopping journey with us today!'}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 border border-[#c70007] text-[#c70007] rounded-lg hover:bg-[#c70007]/10 transition-all flex items-center gap-2 justify-center"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Refresh Orders
                      </button>
                      <button
                        onClick={() => router.push('/products')}
                        className="px-6 py-3 bg-gradient-to-r from-[#c70007] to-[#a50005] hover:from-[#a50005] hover:to-[#850004] rounded-lg text-white transition-all"
                      >
                        Browse Products
                      </button>
                    </div>
                  </div>
                ) : (
                  <AnimatePresence>
                    <motion.div
                      className="space-y-8"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      {orders.map((order, orderIndex) => (
                        <motion.div
                          key={`order-${order.orderId}`}
                          className={`backdrop-blur-xl rounded-2xl border transition-all duration-300 overflow-hidden shadow-2xl hover:shadow-[0_20px_40px_rgba(199,0,7,0.15)] ${
                            recentlyUpdated.has(order.orderId) 
                              ? 'border-green-500/50 shadow-[0_20px_40px_rgba(34,197,94,0.15)]' 
                              : 'border-white/10 hover:border-[#c70007]/50'
                          }`}
                          style={{backgroundColor: '#1c1816'}}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: orderIndex * 0.1 }}
                          whileHover={{ scale: 1.01 }}
                        >
                          {/* Success Banner for Recently Updated Orders */}
                          {recentlyUpdated.has(order.orderId) && (
                            <motion.div 
                              className="bg-green-500/10 border-y border-green-500/50 px-6 py-3"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <div className="flex items-center text-green-400">
                                <motion.div
                                  animate={{ 
                                    scale: [1, 1.1, 1],
                                    rotate: [0, 5, -5, 0]
                                  }}
                                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                >
                                  <CheckCircle className="h-5 w-5 mr-2" />
                                </motion.div>
                                <div>
                                  <p className="text-sm font-medium">✅ Order Updated Successfully!</p>
                                  <p className="text-xs text-green-300">Your shipping details have been approved and updated</p>
                                </div>
                              </div>
                            </motion.div>
                          )}

                          {/* Order Header */}
                          <div className="p-6 md:p-8 border-b border-[#c70007]/30 backdrop-blur-xl">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-3">
                                  <ShoppingBag className="h-6 w-6 text-[#c70007]" />
                                  <h3 className="text-2xl font-bold text-white">Order #{order.userOrderNumber || order.orderId || 'N/A'}</h3>
                                </div>
                                <p className="text-gray-300 mt-1">Placed on {formatDate(order.orderDate)}</p>
                                {/* order status label (similar to confirmation page) */}
                                {order.orderStatus && (
                                  <p className="text-gray-300 mt-1">
                                    Status: <span className="font-medium text-white">{order.orderStatus}</span>
                                  </p>
                                )}
                                {order.trackingNumber && (
                                  <p className="text-gray-300 mt-1 flex items-center gap-1">
                                    <Truck className="w-4 h-4 text-[#c70007]" />
                                    Tracking: <span className="font-mono text-white">{order.trackingNumber}</span>
                                  </p>
                                )}

                                {/* delivery estimate and dates */}
                                {order.leadTime && (
                                  <p className="text-gray-300 mt-1">
                                    Estimated delivery in <span className="font-medium text-white">{order.leadTime} day{order.leadTime > 1 ? 's' : ''}</span>
                                  </p>
                                )}
                               
                                <p className="text-gray-300 mt-1">Placed by: {order.orderPlacedBy || "N/A"}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                {(order.orderStatus?.toLowerCase() === "cod_pending" || order.orderStatus?.toLowerCase() === "processing" || order.orderStatus?.toLowerCase() === "pending") && (
                                  <>
                                    {order.orderStatus?.toLowerCase() === "processing" && (
                                      <motion.button
                                        className={`px-3 py-1.5 bg-[#c70007]/10 border border-[#c70007]/50 rounded-lg text-white hover:bg-[#c70007]/20 transition-all flex items-center gap-2 ${
                                          processingActions.has(`update-${order.orderId}`) ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                        onClick={() =>
                                          handleUpdateClick(order.orderId, order.shippingAddress, order.shippingPhone)
                                        }
                                        whileHover={!processingActions.has(`update-${order.orderId}`) ? { scale: 1.05 } : {}}
                                        whileTap={!processingActions.has(`update-${order.orderId}`) ? { scale: 0.95 } : {}}
                                        disabled={processingActions.has(`update-${order.orderId}`)}
                                      >
                                        <Edit2 className="w-4 h-4" />
                                        <span>Update</span>
                                      </motion.button>
                                    )}
                                    <motion.button
                                      className={`px-3 py-1.5 bg-red-500/10 border border-red-500/50 rounded-lg text-white hover:bg-red-500/20 transition-all flex items-center gap-2 ${
                                        processingActions.has(`cancel-${order.orderId}`) ? 'opacity-50 cursor-not-allowed' : ''
                                      }`}
                                      onClick={() => handleCancelClick(order)}
                                      whileHover={!processingActions.has(`cancel-${order.orderId}`) ? { scale: 1.05 } : {}}
                                      whileTap={!processingActions.has(`cancel-${order.orderId}`) ? { scale: 0.95 } : {}}
                                      disabled={processingActions.has(`cancel-${order.orderId}`)}
                                    >
                                      <X className="w-4 h-4" />
                                      <span>Cancel</span>
                                    </motion.button>
                                  </>
                                )}
                                <div
                                  className={`flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(
                                    order.orderStatus,
                                  )}`}
                                >
                                  {getStatusIcon(order.orderStatus)}
                                  <span className="text-sm font-medium">{order.orderStatus}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Centered and Responsive Status Timeline */}
                          <div className="w-full px-4 sm:px-6 md:px-8 py-4">
                            <motion.div 
                              className="backdrop-blur-xl bg-[#1c1816] border border-[#c70007]/30 p-4 sm:p-5 md:p-6 rounded-2xl shadow-2xl transition-all duration-300 max-w-6xl mx-auto"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5, delay: 0.2 }}
                            >
                              <h4 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center justify-center md:justify-start">
                                <Clock className="w-4 h-4 mr-2 text-[#c70007]" />
                                Order Timeline
                              </h4>
                              
                              {/* Desktop Timeline - Hidden on mobile */}
                              <div className="hidden md:flex items-center justify-between">
                                {/* Placed */}
                                <div className="flex items-center flex-1 min-w-0">
                                  <div className="flex-shrink-0 w-8 h-8 bg-[#c70007] rounded-full flex items-center justify-center shadow-lg shadow-[#c70007]/20">
                                    <Check className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="ml-3 flex-1 min-w-0">
                                    <p className="font-medium text-white truncate">Placed</p>
                                    <p className="text-xs text-gray-400">{formatDate(order.orderDate)}</p>
                                  </div>
                                </div>
                                
                                {/* Progress Line */}
                                <div className="flex-1 h-0.5 bg-gradient-to-r from-[#c70007] to-gray-700 mx-4" />
                                
                                {/* Processing */}
                                <div className="flex items-center flex-1 min-w-0">
                                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                                    order.orderStatus?.toLowerCase() === 'processing' || 
                                    order.orderStatus?.toLowerCase() === 'shipped' || 
                                    order.orderStatus?.toLowerCase() === 'delivered' ||
                                    order.orderStatus?.toLowerCase() === 'completed' ||
                                    order.orderStatus?.toLowerCase() === 'cod_confirmed'
                                      ? 'bg-[#c70007]' 
                                      : 'bg-gray-600'
                                  }`}>
                                    <Package className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="ml-3 flex-1 min-w-0">
                                    <p className={`font-medium truncate ${
                                      order.orderStatus?.toLowerCase() === 'processing' || 
                                      order.orderStatus?.toLowerCase() === 'shipped' || 
                                      order.orderStatus?.toLowerCase() === 'delivered' ||
                                      order.orderStatus?.toLowerCase() === 'completed' ||
                                      order.orderStatus?.toLowerCase() === 'cod_confirmed'
                                        ? 'text-white' 
                                        : 'text-gray-400'
                                    }`}>Processing</p>
                                  </div>
                                </div>
                                
                                {/* Progress Line */}
                                <div className="flex-1 h-0.5 bg-gray-700 mx-4" />
                                {/* Shipped */}
                                <div className="flex items-center flex-1 min-w-0">
                                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                                    order.orderStatus?.toLowerCase() === 'shipped' ||
                                    order.orderStatus?.toLowerCase() === 'delivered'
                                      ? 'bg-[#c70007]'
                                      : 'bg-gray-600'
                                  }`}>
                                    <Truck className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="ml-3 flex-1 min-w-0">
                                    <p className={`font-medium truncate ${
                                      order.orderStatus?.toLowerCase() === 'shipped' ||
                                      order.orderStatus?.toLowerCase() === 'delivered'
                                        ? 'text-white'
                                        : 'text-gray-400'
                                    }`}>Shipped</p>
                                    {order.shippingDate && (
                                      <p className="text-xs text-gray-400">{formatDate(order.shippingDate)}</p>
                                    )}
                                  </div>
                                </div>
                                {/* Progress Line */}
                                <div className="flex-1 h-0.5 bg-gray-700 mx-4" />
                                {/* Delivered */}
                                <div className="flex items-center flex-1 min-w-0">
                                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                                    order.orderStatus?.toLowerCase() === 'delivered'
                                      ? 'bg-[#c70007]'
                                      : 'bg-gray-600'
                                  }`}>
                                    <Check className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="ml-3 flex-1 min-w-0">
                                    <p className={`font-medium truncate ${
                                      order.orderStatus?.toLowerCase() === 'delivered'
                                        ? 'text-white'
                                        : 'text-gray-400'
                                    }`}>Delivered</p>
                                    {order.orderStatus?.toLowerCase() === 'delivered' && (
                                      <p className="text-xs text-gray-400">{formatDate(order.shippingDate || order.updatedAt)}</p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Mobile Timeline - Vertical with connecting lines */}
                              <div className="md:hidden space-y-2">
                                {/* Placed */}
                                <div className="flex items-start gap-3 relative">
                                  <div className="flex-shrink-0 relative">
                                    <div className="w-8 h-8 bg-[#c70007] rounded-full flex items-center justify-center shadow-lg shadow-[#c70007]/20 z-10 relative">
                                      <Check className="w-4 h-4 text-white" />
                                    </div>
                                    {/* Vertical line */}
                                    <div className="absolute top-8 left-4 w-0.5 h-12 bg-gradient-to-b from-[#c70007] to-gray-700 -translate-x-1/2" />
                                  </div>
                                  <div className="flex-1 pb-6">
                                    <p className="font-medium text-white">Placed</p>
                                    <p className="text-xs text-gray-400 break-words">{formatDate(order.orderDate)}</p>
                                  </div>
                                </div>
                                
                                {/* Processing */}
                                <div className="flex items-start gap-3 relative">
                                  <div className="flex-shrink-0 relative">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg z-10 relative ${
                                      order.orderStatus?.toLowerCase() === 'processing' || 
                                      order.orderStatus?.toLowerCase() === 'shipped' || 
                                      order.orderStatus?.toLowerCase() === 'delivered' ||
                                      order.orderStatus?.toLowerCase() === 'completed' ||
                                      order.orderStatus?.toLowerCase() === 'cod_confirmed'
                                        ? 'bg-[#c70007]' 
                                        : 'bg-gray-600'
                                    }`}>
                                      <Package className="w-4 h-4 text-white" />
                                    </div>
                                    {/* Vertical line - only show if not last active or if there are more steps */}
                                    <div className="absolute top-8 left-4 w-0.5 h-12 bg-gray-700 -translate-x-1/2" />
                                  </div>
                                  <div className="flex-1 pb-6">
                                    <p className={`font-medium ${
                                      order.orderStatus?.toLowerCase() === 'processing' || 
                                      order.orderStatus?.toLowerCase() === 'shipped' || 
                                      order.orderStatus?.toLowerCase() === 'delivered' ||
                                      order.orderStatus?.toLowerCase() === 'completed' ||
                                      order.orderStatus?.toLowerCase() === 'cod_confirmed'
                                        ? 'text-white' 
                                        : 'text-gray-400'
                                    }`}>Processing</p>
                                    <p className="text-xs text-gray-400">Your order is being processed</p>
                                  </div>
                                </div>
                                
                                {/* Shipped */}
                                <div className="flex items-start gap-3 relative">
                                  <div className="flex-shrink-0 relative">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                                      order.orderStatus?.toLowerCase() === 'shipped' || 
                                      order.orderStatus?.toLowerCase() === 'delivered' 
                                        ? 'bg-[#c70007]' 
                                        : 'bg-gray-600'
                                    }`}>
                                      <Truck className="w-4 h-4 text-white" />
                                    </div>
                                    {/* Vertical line */}
                                    <div className="absolute top-8 left-4 w-0.5 h-12 bg-gray-700 -translate-x-1/2" />
                                  </div>
                                  <div className="flex-1">
                                    <p className={`font-medium ${
                                      order.orderStatus?.toLowerCase() === 'shipped' || 
                                      order.orderStatus?.toLowerCase() === 'delivered' 
                                        ? 'text-white' 
                                        : 'text-gray-400'
                                    }`}>Shipped</p>
                                    {order.shippingDate ? (
                                      <p className="text-xs text-gray-400 break-words">{formatDate(order.shippingDate)}</p>
                                    ) : (
                                      <p className="text-xs text-gray-400">
                                        Awaiting shipment
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Delivered */}
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                                      order.orderStatus?.toLowerCase() === 'delivered' 
                                        ? 'bg-[#c70007]' 
                                        : 'bg-gray-600'
                                    }`}>
                                      <Check className="w-4 h-4 text-white" />
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <p className={`font-medium ${
                                      order.orderStatus?.toLowerCase() === 'delivered' 
                                        ? 'text-white' 
                                        : 'text-gray-400'
                                    }`}>Delivered</p>
                                    {order.orderStatus?.toLowerCase() === 'delivered' && (
                                      <p className="text-xs text-gray-400 break-words">{formatDate(order.shippingDate || order.updatedAt)}</p>
                                    )}
                                  </div>
                                </div>

                              </div>

                              {/* Current Status Badge - Mobile Only */}
                              <div className="mt-4 pt-4 border-t border-[#c70007]/30 md:hidden">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-400">Current Status:</span>
                                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getStatusColor(order.orderStatus)}`}>
                                    {getStatusIcon(order.orderStatus)}
                                    <span className="text-xs font-medium">{order.orderStatus}</span>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </div>

                          {/* Enhanced Pending Update Banner */}
                          {order.updatePending && (
                            <motion.div 
                              className="bg-[#c70007]/10 border-y border-[#c70007]/50 px-6 py-4"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              transition={{ duration: 0.3 }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center text-[#c70007]">
                                  <motion.div
                                    animate={{ 
                                      scale: [1, 1.1, 1],
                                      rotate: [0, 5, -5, 0]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                  >
                                    <AlertCircle className="h-5 w-5 mr-2" />
                                  </motion.div>
                                  <div>
                                    <p className="text-sm font-medium">Update Request Pending Approval</p>
                                    <p className="text-xs text-gray-400">Our team is reviewing your changes</p>
                                  </div>
                                </div>
                                <motion.button
                                  onClick={checkForApprovedUpdates}
                                  className="px-3 py-1 bg-[#c70007]/20 border border-[#c70007]/50 rounded-lg text-[#c70007] text-xs hover:bg-[#c70007]/30 transition-all flex items-center gap-1"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  Check Status
                                </motion.button>
                              </div>
                              <div className="mt-3 pl-7 text-sm text-gray-300 space-y-2">
                                <div className="bg-black/20 rounded-lg p-3 border border-[#c70007]/20">
                                  <p className="text-xs text-gray-400 mb-1">Requested Changes:</p>
                                  <div className="space-y-1">
                                    <p><span className="text-gray-400">Address:</span> {order.pendingChanges?.shippingAddress}</p>
                                    <p><span className="text-gray-400">Phone:</span> {order.pendingChanges?.shippingPhone}</p>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  You'll be notified once approved
                                </p>
                              </div>
                            </motion.div>
                          )}

                          {/* Show/Hide Details Button */}
                          <div className="px-6 md:px-8 py-4 border-t border-[#c70007]/30 flex justify-center">
                            <motion.button
                              onClick={() => toggleOrderExpansion(order.orderId)}
                              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#c70007]/20 to-[#a50005]/20 hover:from-[#c70007]/30 hover:to-[#a50005]/30 rounded-full text-white transition-all border border-[#c70007]/50"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {expandedOrders.has(order.orderId) ? (
                                <>
                                  <ChevronUp className="w-5 h-5" />
                                  <span>Hide Details</span>
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-5 h-5" />
                                  <span>Show Details</span>
                                </>
                              )}
                            </motion.button>
                          </div>

                          {/* Collapsible Order Details */}
                          <AnimatePresence>
                            {expandedOrders.has(order.orderId) && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                {/* Order Content */}
                                <div className="p-6 md:p-8 border-t border-[#c70007]/30">
                                  {/* Items Section */}
                                  <div className="mb-8">
                                    <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                                      <Package className="mr-2 h-5 w-5 text-[#c70007]" /> Order Items
                                    </h4>
                                    <div className="backdrop-blur-xl rounded-xl p-4 border border-white/10" style={{backgroundColor: '#1c1816'}}>
                                      {order.items && order.items.length > 0 ? (
                                        <div className="divide-y divide-[#c70007]/50">
                                          {order.items.map((item, index) => {

                                            const productName = item.product_name || item.productName || item.item || item.name || "Product";
                                            const itemPrice = parseFloat(item.price || item.product_price || item.unit_price || 0) || 0;
                                            const actualPrice = parseFloat(item.actual_price || item.actualPrice || item.mrp || item.compare_at_price || item.original_price || item.list_price || itemPrice) || itemPrice;
                                            const quantity = parseInt(item.quantity || 1, 10) || 1;
                                            const itemTotal = (quantity * itemPrice).toFixed(2);

                                            // Resolve images/video from many possible shapes
                                            const resolveImage = (img) => {
                                              if (!img) return null;
                                              if (typeof img === 'string') return img;
                                              return img.url || img.src || img.image_url || img.path || img.image || null;
                                            };

                                            const images = [];
                                            // single-image fields on item
                                            ['image', 'image_url', 'product_image', 'product_image_url', 'thumbnail', 'photo', 'img'].forEach(k => {
                                              const v = item[k] || (item.product && item.product[k]);
                                              if (v) {
                                                const url = resolveImage(v);
                                                if (url && !images.includes(url)) images.push(url);
                                              }
                                            });

                                            // array fields
                                            ['images', 'product_images', 'image_gallery', 'media', 'photos', 'image_urls'].forEach(k => {
                                              const arr = item[k] || (item.product && item.product[k]);
                                              if (Array.isArray(arr)) {
                                                arr.forEach(a => {
                                                  const url = resolveImage(a);
                                                  if (url && !images.includes(url)) images.push(url);
                                                });
                                              }
                                            });

                                            // video fields
                                            const video = item.video || item.product_video || item.video_url || item.product?.video || null;

                                            const partNumber = item.part_number || item.product_part_number || item.partNumber || item.sku || item.product_code;
                                            let productSlug = item.product_slug || item.slug || item.product?.slug;
                                            // avoid using literal "product" or "products" as slug because
                                            // our root slug route would treat that as the generic path
                                            // and users would be redirected to the wrong place.
                                            if (productSlug && ['product', 'products'].includes(productSlug.toLowerCase())) {
                                              productSlug = null;
                                            }
                                            let productLink = productSlug ? `/${productSlug}` : (item.product_link || item.url || '/products');
                                            // if fallback has a "/product" prefix, strip it so link stays root-level
                                            if (productLink && productLink.startsWith('/product/')) {
                                              productLink = productLink.replace(/^\/product\//, '/');
                                            }
                                            if (productLink && productLink.startsWith('/products/')) {
                                              productLink = productLink.replace(/^\/products\//, '/');
                                            }

                                            return (
                                              <div key={`${order.orderId}-item-${index}`} className="py-4">
                                                <div className="flex flex-col sm:flex-row gap-4 items-start">
                                                  <div className="w-full sm:w-48 flex-shrink-0">
                                                    <div className="w-full h-40 bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center border border-white/5">
                                                      {video ? (
                                                        <video controls className="w-full h-full object-cover">
                                                          <source src={video} />
                                                        </video>
                                                      ) : images && images.length > 0 ? (
                                                        <img
                                                          src={images[0]}
                                                          alt={productName}
                                                          className="w-full h-full object-cover"
                                                          onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder.png' }}
                                                        />
                                                      ) : (
                                                        <div className="text-gray-500 text-xs">No image</div>
                                                      )}
                                                    </div>
                                                  </div>

                                                  <div className="flex-1">
                                                    <div className="flex items-start justify-between">
                                                      <div>
                                                        <p className="text-sm text-gray-300">Product</p>
                                                        {partNumber && <p className="text-xs text-gray-400">Part #: {partNumber}</p>}
                                                        {item.condition && <p className="text-xs text-gray-400">Condition: {item.condition}</p>}
                                                      </div>

                                                      <div className="text-right flex">
                                                        <p className="text-sm text-gray-300">Qty : </p><p className="text-white">&nbsp;{quantity}</p>
                                                      </div>
                                                    </div>

                                                    <div className="mt-3 flex items-center justify-between">
                                                      <div className="flex items-center gap-3">
                                                        <div>
                                                          <p className="text-sm text-gray-300">Price</p>
                                                          <div className="flex items-baseline gap-2">
                                                            {actualPrice > itemPrice && (
                                                              <span className="text-xs text-gray-400 line-through">${actualPrice.toFixed(2)}</span>
                                                            )}
                                                            <span className="text-white font-medium">${itemPrice.toFixed(2)}</span>
                                                          </div>
                                                        </div>
                                                        <div className="ml-6">
                                                          <p className="text-sm text-gray-300">Item Total</p>
                                                          <p className="text-[#c70007] font-bold">${itemTotal}</p>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <p className="text-gray-400 text-center py-4">No items found</p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Price Breakdown Section */}
                                  <div className="border-t border-white/10 pt-8">
                                    <h4 className="text-lg font-medium text-white mb-6 flex items-center">
                                      <DollarSign className="mr-2 h-5 w-5 text-[#c70007]" /> Order Summary
                                    </h4>
                                    <div className="backdrop-blur-xl rounded-xl p-5 border border-white/10" style={{backgroundColor: '#1c1816'}}>
                                      {/* Coupon Info Banner */}
                                      {(order.couponCode || order.discount) && Number(order.discount || 0) > 0 && (
                                        <div className="p-3 rounded-lg border-2 border-[#c70007]/40 mb-5" style={{ backgroundColor: 'rgba(199, 0, 7, 0.15)' }}>
                                          <div className="flex items-center gap-3 mb-2">
                                            <div className="w-6 h-6 rounded-full bg-[#c70007]/30 flex items-center justify-center flex-shrink-0">
                                              <span className="text-xs text-[#c70007] font-bold">%</span>
                                            </div>
                                            <p className="text-sm font-bold text-[#c70007]">
                                              Coupon Code Applied: <span className="font-extrabold ml-1">{order.couponCode}</span>
                                            </p>
                                          </div>
                                          <p className="text-xs text-gray-300 pl-9">
                                            Discount amount: <span className="text-green-400 font-semibold">${Number(order.discount || 0).toFixed(2)}</span>
                                          </p>
                                        </div>
                                      )}

                                      {/* Price Breakdown Items */}
                                      <div className="space-y-3">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Price Breakdown</p>
                                        
                                        {/* Subtotal */}
                                        <div className="flex justify-between items-center py-2 px-2 rounded hover:bg-white/5 transition-colors">
                                          <span className="text-gray-400 flex items-center">
                                            <span className="text-[#c70007] mr-2">•</span> Subtotal
                                          </span>
                                          <span className="text-white font-medium">
                                            ${Number(order.subtotal || 0).toFixed(2)}
                                          </span>
                                        </div>

                                        {/* Discount */}
                                        {order.couponCode && Number(order.discount || 0) > 0 && (
                                          <div className="flex justify-between items-center py-2 px-2 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)' }}>
                                            <span className="text-green-400 flex items-center font-semibold">
                                              <span className="text-green-400 mr-2">✓</span> Discount ({order.couponCode})
                                            </span>
                                            <span className="text-green-400 font-bold">
                                              - ${Number(order.discount || 0).toFixed(2)}
                                            </span>
                                          </div>
                                        )}

                                        {/* Shipping */}
                                        <div className="flex justify-between items-center py-2 px-2 rounded hover:bg-white/5 transition-colors">
                                          <span className="text-gray-400 flex items-center">
                                            <span className="text-[#c70007] mr-2">•</span> Shipping
                                          </span>
                                          <span className="text-white font-medium">
                                            ${Number(order.shipping || 0).toFixed(2)}
                                          </span>
                                        </div>

                                        {/* Tax */}
                                        <div className="flex justify-between items-center py-2 px-2 rounded" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}>
                                          <span className="text-blue-400 flex items-center font-semibold">
                                            <span className="text-blue-400 mr-2">ⓘ</span> Tax
                                          </span>
                                          <span className="text-white font-bold">
                                            ${Number(order.tax || 0).toFixed(2)}
                                          </span>
                                        </div>

                                        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-3"></div>

                                        {/* Total Amount */}
                                        <div className="flex justify-between items-center pt-2 px-2">
                                          <p className="text-lg font-bold text-white">
                                            Total Amount
                                          </p>
                                          <p className="text-2xl font-extrabold" style={{ color: '#c70007' }}>
                                            ${Number(order.amountPaid || order.total || 0).toFixed(2)}
                                          </p>
                                        </div>

                                        {/* Savings Summary */}
                                        {order.couponCode && Number(order.discount || 0) > 0 && (
                                          <div className="mt-4 p-4 rounded-lg border border-green-500/30" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}>
                                            <p className="text-sm text-gray-300 flex items-center mb-2">
                                              <span className="text-2xl mr-2">💰</span>
                                              <span>Savings Summary</span>
                                            </p>
                                            <div className="pl-8">
                                              <p className="text-xs text-gray-300">
                                                You saved <span className="text-green-400 font-bold">${Number(order.discount || 0).toFixed(2)}</span>
                                              </p>
                                              <p className="text-xs text-gray-300 mt-1">
                                                with coupon code <span className="text-[#c70007] font-bold">{order.couponCode}</span>
                                              </p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Order Footer */}
                          <div className="border-t border-[#c70007]/50 p-6 flex justify-between items-center bg-[#1c1816]/30">
                            <p className="text-sm text-gray-300">Order #{order.userOrderNumber || order.orderId || 'N/A'}</p>
                            <motion.button
                              onClick={() => router.push('/ContactUs')}
                              className="px-8 py-4 bg-gradient-to-r from-[#c70007] to-[#a50005] hover:from-[#a50005] hover:to-[#850004] rounded-full text-white transition-all flex items-center justify-center gap-2"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <span>Contact Support</span>
                              <ChevronRight className="w-5 h-5" />
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                )}
              </section>

              {/* Quick Actions Section */}
              <section id="quick-actions" className="relative mt-20">
                <motion.div
                  className="backdrop-blur-xl border border-white/10 hover:border-[#c70007]/50 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden shadow-2xl transition-all duration-300"
                  style={{backgroundColor: '#1c1816'}}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isVisible["quick-actions"] ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.8 }}
                  whileHover={{ scale: 1.01 }}
                >
                  {/* Animated background elements */}
                  <div className="absolute inset-0 z-0">
                    <motion.div
                      className="absolute top-0 left-1/4 w-40 h-40 rounded-full bg-[#c70007]/20 blur-xl"
                      animate={{
                        y: [0, 20, 0],
                        opacity: [0.2, 0.3, 0.2],
                      }}
                      transition={{ duration: 10, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute bottom-0 right-1/4 w-40 h-40 rounded-full bg-[#c70007]/20 blur-xl"
                      animate={{
                        y: [0, -20, 0],
                        opacity: [0.2, 0.3, 0.2],
                      }}
                      transition={{ duration: 10, repeat: Infinity }}
                    />
                  </div>

                  <div className="relative z-10 max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-4">Need Help With Your Order?</h2>
                    <p className="text-gray-300 mb-8">
                      Our customer support team is available 24/7 to assist you with any questions or concerns about your orders.
                      We're here to help!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <motion.button
                        onClick={() => router.push('/ContactUs')}
                        className="px-8 py-4 bg-gradient-to-r from-[#c70007] to-[#a50005] hover:from-[#a50005] hover:to-[#850004] rounded-full text-white transition-all flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span>Contact Support</span>
                        <ChevronRight className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        onClick={() => router.push('/')}
                        className="px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full text-white transition-all flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ShoppingBag className="w-5 h-5" />
                        <span>Continue Shopping</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </section>
            </>
          )}
        </div>
      </div>

      {/* Update Order Modal */}
      <AnimatePresence>
        {showUpdateModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <motion.div
              className="backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl w-full max-w-md"
              style={{backgroundColor: '#1c1816'}}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">Update Order #{currentOrderId} (ID: {currentOrderId})</h3>
                <button 
                  onClick={() => setShowUpdateModal(false)} 
                  className="text-gray-300 hover:text-white transition-colors"
                  disabled={updatingOrder}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Shipping Address</label>
                  <textarea
                    className="w-full p-3 bg-[#000000] border border-[#c70007]/50 rounded-lg text-white outline-none focus:border-[#c70007] transition-all duration-300 resize-none"
                    placeholder="Enter your shipping address"
                    value={updateFormData.shippingAddress}
                    onChange={(e) => setUpdateFormData({ ...updateFormData, shippingAddress: e.target.value })}
                    rows={3}
                    required
                    disabled={updatingOrder}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Phone Number</label>
                  <input
                    type="text"
                    className="w-full p-3 bg-[#000000] border border-[#c70007]/50 rounded-lg text-white outline-none focus:border-[#c70007] transition-all duration-300"
                    placeholder="Enter your phone number"
                    value={updateFormData.shippingPhone}
                    onChange={(e) => setUpdateFormData({ ...updateFormData, shippingPhone: e.target.value })}
                    required
                    disabled={updatingOrder}
                  />
                </div>
                <motion.div 
                  className="mt-4 p-4 bg-[#c70007]/10 border border-[#c70007]/30 rounded-xl"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-start gap-3">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <AlertCircle className="w-5 h-5 text-[#c70007] flex-shrink-0 mt-0.5" />
                    </motion.div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-300 font-medium">Approval Process</p>
                      <p className="text-xs text-gray-400">
                        Your update request will be reviewed by our admin team. This usually takes 1-2 business hours.
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>You'll receive a notification once approved</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
                <div className="flex justify-end gap-3 mt-6">
                  <motion.button
                    type="button"
                    onClick={() => setShowUpdateModal(false)}
                    className="px-4 py-2 border border-[#c70007]/50 rounded-lg text-gray-300 hover:bg-[#c70007]/20 hover:text-white transition-all"
                    whileTap={{ scale: 0.95 }}
                    disabled={updatingOrder}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    className={`px-5 py-2 bg-gradient-to-r from-[#c70007] to-[#a50005] hover:from-[#a50005] hover:to-[#850004] rounded-lg text-white transition-all flex items-center gap-2 ${
                      updatingOrder ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    whileHover={!updatingOrder ? { scale: 1.05 } : {}}
                    whileTap={!updatingOrder ? { scale: 0.95 } : {}}
                    disabled={updatingOrder}
                  >
                    {updatingOrder ? (
                      <>
                        <Loader className="animate-spin h-4 w-4" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Update Order</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <UserChat />
      <Footer />
    </>
  )
}

export default OrdersPage;