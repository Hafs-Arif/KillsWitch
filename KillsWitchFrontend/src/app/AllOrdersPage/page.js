"use client";

// Helper to inject auth into fetch calls
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

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ShoppingBag,
  ChevronRight,
  Loader,
  X,
  Bell,
  Filter,
  RefreshCw,
  Box,
  Info,
  Banknote,
} from "lucide-react";
import Navbar from "../component/HomeComponents/Navbar";
import Modal from "../component/GeneralComponents/Modal";
import { PlaceholderImage } from "../component/GeneralComponents/PlaceholderImage";
import { BASE_URL } from "../api/api";
import RouteGuard from "../components/RouteGuard";

const AllOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [formData, setFormData] = useState({
    shippingMethod: "",
    leadTime: "",
    shippingDate: "",
    order_status: "COD_PENDING",
  });
  // Make header visible immediately on load
  const [isVisible, setIsVisible] = useState({ header: true });

  // Notification related states
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationRef = useRef(null);

  // Filter states
  const [filteredOrders, setFilteredOrders] = useState([]);
  // Status filter for tab-based filtering
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal state for notifications
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({
    type: "",
    message: "",
  });

  // Track processing actions to prevent double clicks
  const [processingActions, setProcessingActions] = useState(new Set());

  // Track if update is in progress
  const [updatingOrder, setUpdatingOrder] = useState(false);

  // Status options matching your backend enum
  const statusOptions = [
    { value: "COD_PENDING", label: "COD Pending" },
    { value: "PROCESSING", label: "Processing" },
    { value: "SHIPPED", label: "Shipped" },
    { value: "DELIVERED", label: "Delivered" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  // Shipping method options
  const shippingMethods = [
    { value: "By Hand", label: "By Hand" },
    { value: "DHL", label: "DHL" },
    { value: "FedEx", label: "FedEx" },
    { value: "UPS", label: "UPS" },
    { value: "Aramex", label: "Aramex" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll("section");
      sections.forEach((section) => {
        const sectionTop = section.getBoundingClientRect().top;
        const sectionId = section.id;
        if (sectionTop < window.innerHeight * 0.75) {
          setIsVisible((prev) => ({ ...prev, [sectionId]: true }));
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check on initial load
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent scroll propagation for notification dropdown
  const handleNotificationScroll = (e) => {
    e.stopPropagation();
  };

  // Fetch notifications
  const getNotifications = async () => {
    // Prevent double fetch
    if (loadingNotifications) return;

    try {
      setLoadingNotifications(true);

      const response = await fetch(`${BASE_URL}/admin-requests`, withAuth());

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();

      setNotifications(data);

      // Count pending notifications (where IsApproved is false)
      const pendingCount = data.filter(
        (notification) => notification.IsApproved === false
      ).length;
      setNotificationCount(pendingCount);
    } catch (err) {
      console.error("❌ Error fetching notifications:", err);
      setModalContent({
        type: "error",
        message: "Failed to load notifications",
      });
      setShowModal(true);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Handle notification action (accept/decline)
  const handleNotificationAction = async (
    adminRequestId,
    orderId,
    isApproved
  ) => {
    // Prevent double processing
    const actionKey = `notification-${adminRequestId}`;
    if (processingActions.has(actionKey)) return;

    setProcessingActions(prev => new Set([...prev, actionKey]));

    try {
      const requestBody = {
        admin_req_id: adminRequestId,
        order_id: orderId,
        isApproved: isApproved,
      };

      const response = await fetch(
        `${BASE_URL}/admin-requests/updateStatus`,
        withAuth({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        })
      );

      if (!response.ok) {
        throw new Error("Failed to update notification status");
      }

      const data = await response.json();

      // Update the notifications list
      setNotifications(
        notifications.map((notification) =>
          notification.admin_request_id === adminRequestId
            ? { ...notification, IsApproved: isApproved }
            : notification
        )
      );

      // Update notification count
      setNotificationCount((prev) => Math.max(0, prev - 1));

      setModalContent({
        type: "success",
        message: `Request ${isApproved ? "approved" : "declined"} successfully`,
      });
      setShowModal(true);
    } catch (err) {
      console.error("❌ Error updating notification:", err);
      setModalContent({
        type: "error",
        message: err.message || "Failed to process the request",
      });
      setShowModal(true);
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
    }
  };

  // Close notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch notifications on component mount and periodically
  useEffect(() => {
    getNotifications();

    // Set up periodic refresh (every 5 minutes)
    const intervalId = setInterval(getNotifications, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Function to refresh orders data
  const refreshOrders = async () => {
    try {
      const response = await fetch(`${BASE_URL}/orders`, withAuth());

      if (response.status === 401) {
        throw new Error("Unauthorized. Please log in as an admin.");
      }
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();

      // Sort orders newest-first by available date fields
      const safeDate = (o) => {
        const d = o?.orderDate || o?.createdAt || o?.created_at || o?.order_date || o?.created_at;
        const t = new Date(d).getTime();
        return isNaN(t) ? 0 : t;
      };

      const sorted = Array.isArray(data)
        ? data.slice().sort((a, b) => safeDate(b) - safeDate(a))
        : [];

      setOrders(sorted);
      updateFilteredOrders(sorted, statusFilter);
    } catch (err) {
      console.error("❌ Error refreshing orders:", err);
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BASE_URL}/orders`, withAuth());



        if (response.status === 401) {
          throw new Error("Unauthorized. Please log in as an admin.");
        }
        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }

        const data = await response.json();
        // Sort orders newest-first by available date fields
        const safeDate = (o) => {
          const d = o?.orderDate || o?.createdAt || o?.created_at || o?.order_date || o?.created_at;
          const t = new Date(d).getTime();
          return isNaN(t) ? 0 : t;
        };

        const sorted = Array.isArray(data)
          ? data.slice().sort((a, b) => safeDate(b) - safeDate(a))
          : [];

        setOrders(sorted);

        // Initialize filtered orders with sorted list
        updateFilteredOrders(sorted, statusFilter);
      } catch (err) {
        console.error("❌ Error fetching orders:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Helper function to update filtered orders based on status filter
  const updateFilteredOrders = (ordersList, statusFilterParam) => {
    if (!statusFilterParam || statusFilterParam === 'ALL') {
      // Show all orders when 'ALL' is selected
      setFilteredOrders(ordersList);
    } else {
      // Filter orders by specific status
      const filtered = ordersList.filter((order) => {
        const status = (order.order_status || order.orderstatus || '').toUpperCase();
        return status === statusFilterParam.toUpperCase();
      });
      setFilteredOrders(filtered);
    }
  };

  // Update filtered orders when orders or status filter changes
  useEffect(() => {
    updateFilteredOrders(orders, statusFilter);
  }, [orders, statusFilter]);

  // Compute stats: counts and totals per status and overall
  const computeStats = (ordersList) => {
    const normStatus = (s) => (s || '').toString().toUpperCase();
    const statuses = ['COD_PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    const initial = {
      TOTAL: { count: 0, amount: 0 },
    };
    statuses.forEach((s) => (initial[s] = { count: 0, amount: 0 }));

    const getOrderTotal = (order) => {
      if (order.total_price) return parseFloat(order.total_price) || 0;
      if (order.amount) return parseFloat(order.amount) || 0;
      if (order.amountPaid) return parseFloat(order.amountPaid) || 0;
      if (order.orderDetails?.total) return parseFloat(order.orderDetails.total) || 0;
      return 0;
    };

    ordersList.forEach((o) => {
      const s = normStatus(o.order_status || o.orderstatus);
      const amt = getOrderTotal(o);
      initial.TOTAL.count += 1;
      initial.TOTAL.amount += amt;
      if (initial[s]) {
        initial[s].count += 1;
        initial[s].amount += amt;
      }
    });
    return initial;
  };

  const stats = computeStats(orders);

  // Handle status filter change
  const handleStatusFilterChange = (newStatus) => {
    setStatusFilter(newStatus);
  };

  const handleUpdateClick = (order) => {
    // Prevent if already processing this order
    const actionKey = `update-${order.order_id || order.orderId}`;
    if (processingActions.has(actionKey)) return;
    setCurrentOrder(order);
    // Format existing dates to YYYY-MM-DD format for the form
    const formatDateForForm = (dateString) => {
      if (!dateString || dateString === "N/A") return "";
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "";
        return date.toISOString().split("T")[0]; // Returns YYYY-MM-DD
      } catch {
        return "";
      }
    };

    setFormData({
      shippingMethod:
        order.shipment?.shippingMethod || order.shippingMethod || "",
      leadTime: formatDateForForm(order.leadtime || order.leadTime),
      shippingDate: formatDateForForm(
        order.shipment?.shippingDate || order.shippingDate
      ),
      order_status: order.order_status || order.orderstatus || "COD_PENDING",
    });

    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    const orderId = currentOrder?.order_id || currentOrder?.orderId;
    const actionKey = `update-submit-${orderId}`;
    
    if (updatingOrder || processingActions.has(actionKey)) return;

    setUpdatingOrder(true);
    setProcessingActions(prev => new Set([...prev, actionKey]));

    try {
      // Format dates to ensure YYYY-MM-DD format
      const formatDateForBackend = (dateString) => {
        if (!dateString) return null;
        // If it's already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          return dateString;
        }
        // Try to parse and format the date
        try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return null;
          return date.toISOString().split("T")[0]; // Returns YYYY-MM-DD
        } catch {
          return null;
        }
      };

      const requestBody = {
        order_id: currentOrder.order_id || currentOrder.orderId,
        shippingMethod: formData.shippingMethod,
        leadTime: formatDateForBackend(formData.leadTime),
        shippingDate: formatDateForBackend(formData.shippingDate),
        order_status: formData.order_status,
      };
      const response = await fetch(
        `${BASE_URL}/orders/update`,
        withAuth({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        })
      );

      if (response.status === 401) {
        throw new Error("Unauthorized. Please log in as an admin.");
      }
      if (!response.ok) {
        throw new Error("Failed to update order");
      }

      const responseData = await response.json();
      const updatedOrder = responseData.order;

      // Update the orders state with the updated order data from the response
      setOrders(
        orders.map((order) => {
          if (
            order.order_id === updatedOrder.order_id ||
            order.orderId === updatedOrder.order_id
          ) {
            return updatedOrder;
          }
          return order;
        })
      );

      // Update filtered orders immediately
      updateFilteredOrders(
        orders.map((order) => {
          if (
            order.order_id === updatedOrder.order_id ||
            order.orderId === updatedOrder.order_id
          ) {
            return updatedOrder;
          }
          return order;
        }),
        statusFilter
      );

      setModalContent({
        type: "success",
        message: "Order updated successfully!",
      });
      setShowModal(true);
      setIsModalOpen(false);
    } catch (err) {
      console.error("❌ Error updating order:", err);
      setModalContent({
        type: "error",
        message: err.message || "Failed to update order",
      });
      setShowModal(true);
    } finally {
      setUpdatingOrder(false);
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleExpandOrder = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === "N/A") return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    if (!status) return "bg-white/10 border-white/30 text-white";
 
    const statusLower = status.toLowerCase();
    if (
      statusLower === "completed" ||
      statusLower === "confirm" ||
      statusLower === "delivered"
    )
      return "bg-white/10 border-green-500 text-green-400";
    if (statusLower === "pending")
      return "bg-white/10 border-blue-500 text-blue-400";
    if (statusLower === "processing" || statusLower === "shipped")
      return "bg-white/10 border-yellow-500 text-yellow-400";
    if (statusLower === "cancelled")
      return "bg-white/10 border-red-500 text-red-400";
    return "bg-white/10 border-white/30 text-white";
  };

  const getStatusIcon = (status) => {
    if (!status) return <Package className="w-4 h-4 text-white" />;

    const statusLower = status.toLowerCase();
    if (
      statusLower === "completed" ||
      statusLower === "confirm" ||
      statusLower === "delivered"
    )
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (statusLower === "pending")
      return <Clock className="w-4 h-4 text-blue-400" />;
    if (statusLower === "processing")
      return <Package className="w-4 h-4 text-yellow-400" />;
    if (statusLower === "shipped")
      return <Truck className="w-4 h-4 text-yellow-400" />;
    if (statusLower === "cancelled")
      return <AlertCircle className="w-4 h-4 text-red-400" />;
    return <Package className="w-4 h-4 text-white" />;
  };

  // Helper function to get order ID regardless of API format
  const getOrderId = (order) => {
    if (order.order_id) return order.order_id;
    if (order.orderId) return order.orderId;
    return `unknown-${Math.random().toString(36).substr(2, 9)}`; // Generate random ID if none exists
  };

  // Helper function to get order status regardless of API format
  const getOrderStatus = (order) =>
    order.order_status || order.orderstatus || "COD_PENDING";

  // Helper function to get order date regardless of API format
  const getOrderDate = (order) =>
    order.order_date || order.orderDate || order.created_at || "N/A";

  // Helper function to get order total price regardless of API format
  const getOrderTotal = (order) => {
    if (order.total_price) return order.total_price;
    if (order.amount) return order.amount;
    if (order.amountPaid) return order.amountPaid;
    if (order.orderDetails?.total) return order.orderDetails.total;
    return "0.00";
  };

  // Count orders by status for display
  const getOrderCountByStatus = (status) => {
    if (status === 'ALL') return orders.length;
    return orders.filter((order) => {
      const orderStatus = (order.order_status || order.orderstatus || '').toUpperCase();
      return orderStatus === status.toUpperCase();
    }).length;
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <RouteGuard allowedRoles={["admin"]} redirectTo="/login">
      <Navbar />

      {/* Enhanced KillSwitch-themed Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        type={modalContent.type}
        message={modalContent.message}
      />

      <div className="min-h-screen py-20 px-4 sm:px-6 text-white" style={{ backgroundColor: '#000000' }}>
        {/* Animated background elements */}
        <div className="fixed inset-0 z-[-1] overflow-hidden">
          {/* Grid lines */}
          <div className="absolute top-0 left-1/4 w-px h-full bg-white/5"></div>
          <div className="absolute top-0 left-2/4 w-px h-full bg-white/5"></div>
          <div className="absolute top-0 left-3/4 w-px h-full bg-white/5"></div>
          <div className="absolute top-1/3 left-0 w-full h-px bg-white/5"></div>
          <div className="absolute top-2/3 left-0 w-full h-px bg-white/5"></div>

          {/* Animated orbs */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl"
            style={{ backgroundColor: 'rgba(199, 0, 7, 0.2)' }}
            animate={{
              x: [0, 30, 0],
              y: [0, -30, 0],
            }}
            transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl"
            style={{ backgroundColor: 'rgba(199, 0, 7, 0.15)' }}
            animate={{
              x: [0, -40, 0],
              y: [0, 40, 0],
            }}
            transition={{ duration: 25, repeat: Number.POSITIVE_INFINITY }}
          />
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Header with animated elements */}
          <section id="header" className="relative mb-12">
            {/* Go to Admin button on the left of the heading */}
            <div className="absolute left-4 top-0 z-20">
              <a
                href="/Admin"
                onClick={(e) => e.stopPropagation()}
                className="px-3 py-1 rounded-full text-xs text-white/80 transition-colors"
                style={{ backgroundColor: '#1c1816', borderColor: 'rgba(199, 0, 7, 0.3)', borderWidth: '1px' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(199, 0, 7, 0.2)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#1c1816'}
                title="Go to Admin Dashboard"
              >
                Admin
              </a>
            </div>
            <motion.div
              className="text-center relative z-10"
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible["header"] ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                All Orders
              </h1>
              <div className="h-1 w-24 mx-auto mb-6" style={{ background: 'linear-gradient(to right, #c70007, rgba(199, 0, 7, 0.6), #c70007)' }}></div>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-3">
                View and manage all customer orders
              </p>

              {/* Minimal Status Tabs under heading */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                {[
                  { key: 'ALL', label: 'All' },
                  { key: 'PENDING', label: 'Pending' },
                  { key: 'COD_PENDING', label: 'COD Pending' },
                  { key: 'PROCESSING', label: 'Processing' },
                  { key: 'CONFIRM', label: 'Confirm' },
                  { key: 'COD_CONFIRMED', label: 'COD Confirmed' },
                  { key: 'SHIPPED', label: 'Shipped' },
                  { key: 'DELIVERED', label: 'Delivered' },
                  { key: 'CANCELLED', label: 'Cancelled' },
                ].map((t) => {
                  const isActive = statusFilter === t.key;
                  const statKey = t.key === 'ALL' ? 'TOTAL' : t.key;
                  return (
                    <motion.button
                      key={t.key}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusFilterChange(t.key);
                      }}
                      aria-pressed={isActive}
                      title={`Show ${t.label} orders`}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        isActive ? 'text-white' : 'text-white/80'
                      }`}
                      style={isActive 
                        ? { backgroundColor: '#c70007', borderColor: '#c70007', borderWidth: '1px' }
                        : { backgroundColor: '#1c1816', borderColor: 'rgba(199, 0, 7, 0.3)', borderWidth: '1px' }
                      }
                      whileHover={!isActive ? { scale: 1.05, backgroundColor: 'rgba(199, 0, 7, 0.2)' } : {}}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="font-medium mr-2">{t.label}</span>
                      <span className="text-white/80 mr-1">{getOrderCountByStatus(t.key)}</span>
                      <span className="text-white/60 text-xs">${Number(stats[statKey]?.amount || 0).toFixed(0)}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Filter and Notification Controls (kept minimal) */}
            <div className="absolute right-4 top-0 z-20 flex items-center space-x-3">
              {/* Refresh Button */}
              <motion.button
                onClick={() => {
                  refreshOrders();
                  getNotifications();
                }}
                className="p-2.5 text-white rounded-full transition-all duration-300"
                style={{ backgroundColor: '#1c1816', borderColor: 'rgba(199, 0, 7, 0.3)', borderWidth: '1px' }}
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(199, 0, 7, 0.2)' }}
                whileTap={{ scale: 0.95 }}
                title="Refresh Data"
              >
                <RefreshCw className="h-5 w-5" />
              </motion.button>

              {/* Back to All Orders root */}
              <a
                href="/AllOrdersPage"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="px-3 py-1 rounded-full text-xs bg-white/10 border border-white/20 text-white/80 hover:bg-white/15"
                title="Back to All Orders"
              >
                Back
              </a>

              {/* Notification Bell */}
              <div ref={notificationRef} className="relative">
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNotifications(!showNotifications);
                    if (!showNotifications) {
                      getNotifications();
                    }
                  }}
                  className="relative p-2.5 text-white rounded-full transition-all duration-300"
                  style={{ backgroundColor: '#1c1816', borderColor: 'rgba(199, 0, 7, 0.3)', borderWidth: '1px' }}
                  whileHover={{ scale: 1.1, backgroundColor: 'rgba(199, 0, 7, 0.2)' }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Notifications"
                  title="Notifications"
                  disabled={loadingNotifications}
                >
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500/80 rounded-full animate-pulse">
                      {notificationCount}
                    </span>
                  )}
                </motion.button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute right-0 mt-3 w-[400px] rounded-xl shadow-2xl z-50 max-h-[80vh] overflow-hidden"
                    style={{ backgroundColor: 'rgba(28, 24, 22, 0.95)', borderColor: 'rgba(199, 0, 7, 0.3)', borderWidth: '1px' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="sticky top-0 z-10 text-white p-4 rounded-t-xl border-b border-white/10" style={{ background: 'linear-gradient(to right, rgba(28, 24, 22, 0.8), rgba(28, 24, 22, 0.8))' }}>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold flex items-center">
                          <Bell className="mr-2 h-5 w-5" /> Notifications
                        </h3>
                        <span className="text-white text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(199, 0, 7, 0.2)' }}>
                          {notificationCount} pending
                        </span>
                      </div>
                    </div>

                    <div
                      className="overflow-y-auto max-h-[calc(80vh-120px)]"
                      onScroll={handleNotificationScroll}
                    >
                      {loadingNotifications ? (
                        <div className="p-8 text-center">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-white/10 border-t-white/60 mb-4"></div>
                          <p className="text-gray-400">
                            Loading notifications...
                          </p>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <div className="p-4 rounded-full inline-block mb-3" style={{ backgroundColor: 'rgba(199, 0, 7, 0.1)' }}>
                            <Info className="h-8 w-8 text-white/40" />
                          </div>
                          <p className="text-gray-300">
                            No notifications found
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            You're all caught up!
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-white/10">
                          {notifications.map((notification, index) => {
                            const actionKey = `notification-${notification.admin_request_id}`;
                            const isProcessing = processingActions.has(actionKey);
                            
                            return (
                              <div
                                key={notification.admin_request_id}
                                className={`relative transition-all duration-300 ${
                                  notification.IsApproved === false
                                    ? "hover:bg-white/5"
                                    : "hover:bg-white/5"
                                }`}
                              >
                                {notification.IsApproved === false && (
                                  <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: '#c70007' }}></div>
                                )}

                                <div className="p-4 pl-5">
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="font-medium text-white flex items-center">
                                      <span className="text-white/80 px-2 py-0.5 rounded text-xs mr-2" style={{ backgroundColor: 'rgba(199, 0, 7, 0.2)' }}>
                                        #{notification.order_id}
                                      </span>
                                      Order Update Request
                                    </span>
                                    <span className="text-xs text-gray-400 flex items-center">
                                      <Clock className="mr-1 h-3 w-3" />{" "}
                                      {formatDate(notification.created_at)}
                                    </span>
                                  </div>

                                  <div className="mb-3">
                                    {notification.user_email && (
                                      <p className="text-sm text-gray-400 mb-2 flex items-center">
                                        <span className="p-1 rounded-full mr-2" style={{ backgroundColor: 'rgba(199, 0, 7, 0.1)' }}>
                                          <svg
                                            className="h-4 w-4 text-white/60"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth="2"
                                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                            />
                                          </svg>
                                        </span>
                                        <span className="font-medium">
                                          {notification.user_email}
                                        </span>
                                      </p>
                                    )}

                                    <div className="space-y-2 pl-2 border-l-2 border-white/10">
                                      {notification.updatedshippingAddress && (
                                        <div className="text-sm text-gray-300 flex items-start">
                                          <MapPin className="h-4 w-4 text-white/60 mr-2 mt-0.5 flex-shrink-0" />
                                          <div>
                                            <span className="text-xs text-white/60 font-medium block">
                                              New Address:
                                            </span>
                                            <span className="text-gray-300">
                                              {
                                                notification.updatedshippingAddress
                                              }
                                            </span>
                                          </div>
                                        </div>
                                      )}

                                      {notification.updatedshippingPhone && (
                                        <div className="text-sm text-gray-300 flex items-start">
                                          <Phone className="h-4 w-4 text-white/60 mr-2 mt-0.5 flex-shrink-0" />
                                          <div>
                                            <span className="text-xs text-white/60 font-medium block">
                                              New Phone:
                                            </span>
                                            <span className="text-gray-300">
                                              {notification.updatedshippingPhone}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {notification.IsApproved === false ? (
                                    <div className="flex justify-end space-x-2 mt-3">
                                      <motion.button
                                        onClick={() =>
                                          handleNotificationAction(
                                            notification.admin_request_id,
                                            notification.order_id,
                                            false
                                          )
                                        }
                                        className={`px-3 py-1.5 text-white/70 rounded-md text-xs font-medium flex items-center transition-colors duration-300 ${
                                          isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                        style={{ backgroundColor: 'rgba(199, 0, 7, 0.1)', borderColor: 'rgba(199, 0, 7, 0.3)', borderWidth: '1px' }}
                                        onMouseEnter={(e) => !isProcessing && (e.target.style.backgroundColor = 'rgba(199, 0, 7, 0.2)')}
                                        onMouseLeave={(e) => !isProcessing && (e.target.style.backgroundColor = 'rgba(199, 0, 7, 0.1)')}
                                        whileHover={!isProcessing ? { scale: 1.05 } : {}}
                                        whileTap={!isProcessing ? { scale: 0.95 } : {}}
                                        disabled={isProcessing}
                                      >
                                        {isProcessing ? (
                                          <Loader className="mr-1 h-4 w-4 animate-spin" />
                                        ) : (
                                          <X className="mr-1 h-4 w-4" />
                                        )} Decline
                                      </motion.button>
                                      <motion.button
                                        onClick={() =>
                                          handleNotificationAction(
                                            notification.admin_request_id,
                                            notification.order_id,
                                            true
                                          )
                                        }
                                        className={`px-3 py-1.5 text-white rounded-md text-xs font-medium flex items-center transition-colors duration-300 shadow-sm hover:shadow transform hover:translate-y-[-1px] ${
                                          isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                        style={{ backgroundColor: '#c70007' }}
                                        onMouseEnter={(e) => !isProcessing && (e.target.style.backgroundColor = 'rgba(199, 0, 7, 0.8)')}
                                        onMouseLeave={(e) => !isProcessing && (e.target.style.backgroundColor = '#c70007')}
                                        whileHover={!isProcessing ? { scale: 1.05 } : {}}
                                        whileTap={!isProcessing ? { scale: 0.95 } : {}}
                                        disabled={isProcessing}
                                      >
                                        {isProcessing ? (
                                          <Loader className="mr-1 h-4 w-4 animate-spin" />
                                        ) : (
                                          <CheckCircle className="mr-1 h-4 w-4" />
                                        )} Accept
                                      </motion.button>
                                    </div>
                                  ) : (
                                    <div className="flex justify-end mt-3">
                                      <span
                                        className={`px-3 py-1 rounded-md text-xs font-medium flex items-center ${
                                          notification.IsApproved
                                            ? "bg-green-900/20 text-green-400 border border-green-500/30"
                                            : "bg-red-900/20 text-red-400 border border-red-500/30"
                                        }`}
                                      >
                                        {notification.IsApproved ? (
                                          <>
                                            <CheckCircle className="mr-1 h-4 w-4" />{" "}
                                            Approved
                                          </>
                                        ) : (
                                          <>
                                            <X className="mr-1 h-4 w-4" />{" "}
                                            Declined
                                          </>
                                        )}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="sticky bottom-0 p-3 text-center rounded-b-xl border-t border-white/10" style={{ backgroundColor: 'rgba(28, 24, 22, 0.8)' }}>
                      <motion.button
                        onClick={getNotifications}
                        className="text-xs text-white/60 hover:text-white font-medium transition-colors duration-300 flex items-center justify-center mx-auto"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={loadingNotifications}
                      >
                        <RefreshCw className={`mr-1 h-3 w-3 ${loadingNotifications ? 'animate-spin' : ''}`} /> 
                        {loadingNotifications ? 'Refreshing...' : 'Refresh Notifications'}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </section>

          {/* Status Filter Indicator */}
          {statusFilter !== 'ALL' && (
            <motion.div
              className="p-4 mb-6 rounded-lg"
              style={{ backgroundColor: 'rgba(199, 0, 7, 0.1)', borderLeftColor: '#c70007', borderLeftWidth: '4px' }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="flex items-center mb-3 md:mb-0">
                  <Filter className="h-5 w-5 text-white/70 mr-2" />
                  <span className="text-white/80">
                    Showing{" "}
                    <span className="font-bold text-white">
                      {filteredOrders.length}
                    </span>
                    {" "}{statusFilter.toLowerCase().replace('_', ' ')}{" "}
                    orders
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <motion.button
                    onClick={() => handleStatusFilterChange('ALL')}
                    className="flex items-center text-white/70 hover:text-white text-sm font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" /> Show All Orders
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Orders Section */}
          <section id="orders" className="relative">
            {loading ? (
              <motion.div
                className="flex flex-col items-center justify-center py-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Loader className="h-12 w-12 text-white/70 animate-spin mb-4" />
                <p className="text-white/70 text-lg">Loading orders...</p>
              </motion.div>
            ) : error ? (
              <motion.div
                className="bg-white/5 border border-red-500/30 rounded-xl p-6 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">
                  Error Loading Orders
                </h3>
                <p className="text-gray-400">{error}</p>
                <motion.button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Try Again
                </motion.button>
              </motion.div>
            ) : filteredOrders.length === 0 ? (
              <motion.div
                className="bg-white/5 border border-white/10 rounded-xl p-10 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Package className="h-16 w-16 text-white/50 mx-auto mb-4" />
                <h3 className="text-2xl font-medium text-white mb-2">
                  No Orders Found
                </h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  {statusFilter === 'ALL'
                    ? "There are no orders to display."
                    : `There are no ${statusFilter.toLowerCase().replace('_', ' ')} orders to display.`}
                </p>
                {statusFilter !== 'ALL' && (
                  <motion.button
                    onClick={() => handleStatusFilterChange('ALL')}
                    className="mt-6 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center mx-auto"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" /> Show All Orders
                  </motion.button>
                )}
              </motion.div>
            ) : (
              <AnimatePresence>
                <motion.div
                  className="space-y-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {filteredOrders.map((order, orderIndex) => {
                    const orderId = getOrderId(order);
                    const updateActionKey = `update-${orderId}`;
                    const isProcessingUpdate = processingActions.has(updateActionKey);
                    
                    return (
                      <motion.div
                        key={`order-${orderId}-${orderIndex}`}
                        className="bg-none border border-white/10 rounded-3xl overflow-hidden shadow-lg"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: orderIndex * 0.1 }}
                        whileHover={{ scale: 1.01 }}
                      >
                        {/* Order Header */}
                        <div className="p-6 md:p-8 border-b border-white/10">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-3">
                                <ShoppingBag className="h-6 w-6 text-white/70" />
                                <h3 className="text-2xl font-bold text-white">
                                  Order #{orderId}
                                </h3>
                              </div>
                              <p className="text-gray-400 mt-1">
                                Placed on {formatDate(getOrderDate(order))}
                              </p>
                              <p className="text-gray-400 mt-1">
                                Placed by:{" "}
                                {order.email ||
                                  order.Name ||
                                  order.orderPlacedBy ||
                                  "Customer"}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(
                                  getOrderStatus(order)
                                )}`}
                              >
                                {getStatusIcon(getOrderStatus(order))}
                                <span className="text-sm font-medium">
                                  {getOrderStatus(order)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateClick(order);
                              }}
                              className={`text-white px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-sm border border-white/20 flex items-center ${
                                isProcessingUpdate ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              whileHover={!isProcessingUpdate ? { scale: 1.05 } : {}}
                              whileTap={!isProcessingUpdate ? { scale: 0.95 } : {}}
                              disabled={isProcessingUpdate}
                            >
                              <Edit2 className="h-4 w-4 mr-2" /> Update
                            </motion.button>

                            <motion.button
                              onClick={() => toggleExpandOrder(orderId)}
                              className="text-white px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-sm border border-white/20 flex items-center ml-auto"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {expandedOrder === orderId ? (
                                <>Hide Details</>
                              ) : (
                                <>View Details</>
                              )}
                              <ChevronRight
                                className={`h-4 w-4 ml-1 transition-transform ${
                                  expandedOrder === orderId
                                    ? "rotate-90"
                                    : ""
                                }`}
                              />
                            </motion.button>
                          </div>
                        </div>

                        {/* Order Details (Expanded) */}
                        {expandedOrder === orderId && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="border-t border-white/10"
                          >
                            <div className="p-6 md:p-8">
                              {/* Items Section */}
                              <div className="mb-8">
                                <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                                  <Package className="mr-2 h-5 w-5 text-white/70" />{" "}
                                  Order Items
                                </h4>
                                <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(28, 24, 22, 0.5)', borderColor: 'rgba(199, 0, 7, 0.2)', borderWidth: '1px' }}>
                                  {order.orderDetails?.items &&
                                  order.orderDetails.items.length > 0 ? (
                                    <div className="space-y-4">
                                      {order.orderDetails.items.map(
                                        (item, index) => (
                                          <motion.div
                                            key={`${orderId}-item-${index}`}
                                            className="rounded-lg p-4 border"
                                            style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', borderColor: 'rgba(199, 0, 7, 0.2)' }}
                                            whileHover={{ scale: 1.02, borderColor: 'rgba(199, 0, 7, 0.4)' }}
                                            transition={{ duration: 0.2 }}
                                          >
                                            <div className="flex flex-col lg:flex-row gap-4">
                                              {/* Product Image */}
                                              <div className="flex-shrink-0">
                                                <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-lg overflow-hidden border" style={{ borderColor: 'rgba(199, 0, 7, 0.3)' }}>
                                                  {(() => {
                                                  
                                                    // Try multiple possible image field names, prioritizing Cloudinary URLs
                                                    const imageUrl = item.product_image_url || 
                                                                   item.image_url || 
                                                                   item.image || 
                                                                   item.product_image || 
                                                                   item.productImage ||
                                                                   // Try additional images array
                                                                   (item.additional_images && item.additional_images[0]) ||
                                                                   (item.product_images && item.product_images[0]?.url) ||
                                                                   (item.images && item.images[0]?.url) ||
                                                                   // Fallback to constructed URLs (less likely to work with Cloudinary)
                                                                   (item.id && `${BASE_URL}/uploads/products/${item.id}.jpg`) ||
                                                                   (item.product_id && `${BASE_URL}/uploads/products/${item.product_id}.jpg`);
                                                   
                                                    
                                                    return imageUrl ? (
                                                      <img
                                                        src={imageUrl}
                                                        alt={item.product_name || item.name || item.item || `Product ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                          console.error(`Failed to load image for product ${index + 1}:`, imageUrl);
                                                          e.target.style.display = 'none';
                                                          e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                        onLoad={() => {
                                                          console.log(`Successfully loaded image for product ${index + 1}:`, imageUrl);
                                                        }}
                                                      />
                                                    ) : null;
                                                  })()}
                                                  <div 
                                                    className="w-full h-full flex items-center justify-center"
                                                    style={{ 
                                                      display: (() => {
                                                        const hasImage = item.product_image_url || 
                                                                       item.image_url || 
                                                                       item.image || 
                                                                       item.product_image || 
                                                                       item.productImage ||
                                                                       (item.additional_images && item.additional_images[0]) ||
                                                                       (item.product_images && item.product_images[0]?.url) ||
                                                                       (item.images && item.images[0]?.url) ||
                                                                       (item.id && `${BASE_URL}/uploads/products/${item.id}.jpg`) ||
                                                                       (item.product_id && `${BASE_URL}/uploads/products/${item.product_id}.jpg`);
                                                        return hasImage ? 'none' : 'flex';
                                                      })()
                                                    }}
                                                  >
                                                    <PlaceholderImage width={128} height={128} className="w-full h-full" />
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Product Details */}
                                              <div className="flex-1 min-w-0">
                                                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3">
                                                  <div className="flex-1">
                                                    <h5 className="text-lg font-semibold text-white mb-2">
                                                      {item.product_name || item.name || item.item || `Product #${index + 1}`}
                                                    </h5>
                                                    
                                                    {/* Product Information Grid */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                                      {(() => {
                                                        // Try multiple possible part number field names
                                                        const partNumber = item.part_number || 
                                                                         item.product_part_number || 
                                                                         item.partNumber || 
                                                                         item.productPartNumber ||
                                                                         item.sku ||
                                                                         item.product_code ||
                                                                         item.productCode;
                                                        
                                                        return partNumber ? (
                                                          <div>
                                                            <span className="text-gray-400">Part Number:</span>
                                                            <p className="text-white font-medium">{partNumber}</p>
                                                          </div>
                                                        ) : null;
                                                      })()}
                                                      
                                                      {item.condition && (
                                                        <div>
                                                          <span className="text-gray-400">Condition:</span>
                                                          <p className="text-white font-medium">
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" 
                                                                  style={{ backgroundColor: 'rgba(199, 0, 7, 0.2)', color: '#ffffff' }}>
                                                              {item.condition}
                                                            </span>
                                                          </p>
                                                        </div>
                                                      )}
                                                      
                                                      {(() => {
                                                        // Try multiple possible brand field names
                                                        const brand = item.brand || 
                                                                    item.brand_name || 
                                                                    item.brandName ||
                                                                    item.product_brand ||
                                                                    item.manufacturer;
                                                        
                                                        return brand ? (
                                                          <div>
                                                            <span className="text-gray-400">Brand:</span>
                                                            <p className="text-white font-medium">{brand}</p>
                                                          </div>
                                                        ) : null;
                                                      })()}
                                                      
                                                      {(() => {
                                                        // Try multiple possible category field names
                                                        const category = item.category || 
                                                                       item.category_name || 
                                                                       item.categoryName ||
                                                                       item.product_category ||
                                                                       item.type;
                                                        
                                                        return category ? (
                                                          <div>
                                                            <span className="text-gray-400">Category:</span>
                                                            <p className="text-white font-medium">{category}</p>
                                                          </div>
                                                        ) : null;
                                                      })()}
                                                      
                                                      {(() => {
                                                        // Try multiple possible specification field names
                                                        const specifications = item.specifications || 
                                                                             item.specs ||
                                                                             item.product_specifications ||
                                                                             item.technical_specs ||
                                                                             item.features;
                                                        
                                                        return specifications ? (
                                                          <div className="sm:col-span-2">
                                                            <span className="text-gray-400">Specifications:</span>
                                                            <p className="text-white font-medium text-xs mt-1 p-2 rounded" 
                                                               style={{ backgroundColor: 'rgba(199, 0, 7, 0.1)' }}>
                                                              {specifications}
                                                            </p>
                                                          </div>
                                                        ) : null;
                                                      })()}
                                                      
                                                      {(() => {
                                                        // Try multiple possible description field names
                                                        const description = item.description || 
                                                                          item.product_description ||
                                                                          item.details ||
                                                                          item.summary;
                                                        
                                                        return description ? (
                                                          <div className="sm:col-span-2">
                                                            <span className="text-gray-400">Description:</span>
                                                            <p className="text-white text-xs mt-1">{description}</p>
                                                          </div>
                                                        ) : null;
                                                      })()}
                                                    </div>
                                                  </div>

                                                  {/* Quantity and Price */}
                                                  <div className="flex flex-row lg:flex-col gap-3 lg:gap-2 lg:items-end">
                                                    <div className="text-center lg:text-right">
                                                      <span className="text-gray-400 text-sm block">Quantity</span>
                                                      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium" 
                                                           style={{ backgroundColor: 'rgba(199, 0, 7, 0.2)', color: '#ffffff' }}>
                                                        {item.quantity || 1}
                                                      </div>
                                                    </div>
                                                    
                                                    {(() => {
                                                      // Try multiple possible price field names
                                                      const price = item.price || 
                                                                  item.unit_price ||
                                                                  item.unitPrice ||
                                                                  item.product_price ||
                                                                  item.cost ||
                                                                  item.amount;
                                                      
                                                      return price ? (
                                                        <div className="text-center lg:text-right">
                                                          <span className="text-gray-400 text-sm block">Unit Price</span>
                                                          <p className="text-white font-bold text-lg">
                                                          ${Number(price || 0).toFixed(2)}
                                                          </p>
                                                        </div>
                                                      ) : null;
                                                    })()}
                                                    
                                                    {(() => {
                                                      // Calculate total price with fallback logic
                                                      const price = item.price || 
                                                                  item.unit_price ||
                                                                  item.unitPrice ||
                                                                  item.product_price ||
                                                                  item.cost ||
                                                                  item.amount;
                                                      const quantity = item.quantity || 1;
                                                      
                                                      return price ? (
                                                        <div className="text-center lg:text-right">
                                                          <span className="text-gray-400 text-sm block">Total</span>
                                                          <p className="text-white font-bold text-xl" style={{ color: '#c70007' }}>
                                                          ${(Number(price || 0) * Number(quantity)).toFixed(2)}
                                                          </p>
                                                        </div>
                                                      ) : null;
                                                    })()}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </motion.div>
                                        )
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-center py-8">
                                      <Package className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                                      <p className="text-gray-400">No items found in this order</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Shipping and Payment Info */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                {/* Shipping Information */}
                                <div>
                                  <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                                    <Truck className="mr-2 h-5 w-5 text-white/70" />{" "}
                                    Shipping Information
                                  </h4>
                                  <div className="bg-white/5 rounded-xl p-6 space-y-4">
                                    <div className="flex items-start gap-3">
                                      <div className="mt-1 flex-shrink-0">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                          <Truck className="h-4 w-4 text-white/70" />
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-400">
                                          Shipping Method
                                        </p>
                                        <p className="text-white">
                                          {order.shippingMethod ||
                                            "Not specified"}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                      <div className="mt-1 flex-shrink-0">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                          <Calendar className="h-4 w-4 text-white/70" />
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-400">
                                          Shipping Date
                                        </p>
                                        <p className="text-white">
                                          {formatDate(order.shippingDate) ||
                                            "Not scheduled"}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                      <div className="mt-1 flex-shrink-0">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                          <Clock className="h-4 w-4 text-white/70" />
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-400">
                                          Lead Time
                                        </p>
                                        <p className="text-white">
                                          {order.leadtime ||
                                            order.leadTime ||
                                            "Not specified"}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                      <div className="mt-1 flex-shrink-0">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                          <MapPin className="h-4 w-4 text-white/70" />
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-400">
                                          Shipping Address
                                        </p>
                                        <p className="text-white">
                                          {order.shippingAddress ||
                                            "Not provided"}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                      <div className="mt-1 flex-shrink-0">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                          <Phone className="h-4 w-4 text-white/70" />
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-400">
                                          Contact Phone
                                        </p>
                                        <p className="text-white">
                                          {order.shippingPhone || "Not provided"}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Payment Information */}
                                <div>
                                  <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                                    <CreditCard className="mr-2 h-5 w-5 text-white/70" />{" "}
                                    Payment Information
                                  </h4>
                                  <div className="bg-white/5 rounded-xl p-6 space-y-4">
                                    <div className="flex items-start gap-3">
                                      <div className="mt-1 flex-shrink-0">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                          {(order.order_status === 'COD_PENDING' || order.order_status === 'COD_CONFIRMED' || (order.payment && order.payment.payment_method === 'cod')) ? (
                                            <Banknote className="h-4 w-4 text-white/70" />
                                          ) : (
                                            <CreditCard className="h-4 w-4 text-white/70" />
                                          )}
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-400">
                                          Payment Method
                                        </p>
                                        <p className="text-white">
                                          {(order.order_status === 'COD_PENDING' || order.order_status === 'COD_CONFIRMED' || (order.payment && order.payment.payment_method === 'cod')) 
                                            ? "Cash on Delivery (COD)"
                                            : (order.AmountPaidBy || order.paymentMethod || "Card Payment")
                                          }
                                        </p>
                                        {/* Show card details only for non-COD payments */}
                                        {!(order.order_status === 'COD_PENDING' || order.order_status === 'COD_CONFIRMED' || (order.payment && order.payment.payment_method === 'cod')) && order.payment && order.payment.card_number && order.payment.card_number !== 'COD' && (
                                          <p className="text-sm text-gray-400 mt-1">
                                            Card ending in {order.payment.card_number.slice(-4)}
                                          </p>
                                        )}
                                        {(order.order_status === 'COD_PENDING' || order.order_status === 'COD_CONFIRMED') && (
                                          <p className="text-sm text-yellow-400 mt-1">
                                            {order.order_status === 'COD_PENDING' ? 'Payment due on delivery' : 'COD payment confirmed'}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Coupon Information - Show with enhanced styling */}
                                    {(order.couponCode || order.orderDetails?.couponCode) && Number(order.discount || order.orderDetails?.discount || 0) > 0 && (
                                      <div className="p-3 rounded-lg border-2 border-[#c70007]/40" style={{ backgroundColor: 'rgba(199, 0, 7, 0.15)' }}>
                                        <div className="flex items-center gap-3 mb-2">
                                          <div className="w-6 h-6 rounded-full bg-[#c70007]/30 flex items-center justify-center flex-shrink-0">
                                            <span className="text-xs text-[#c70007] font-bold">%</span>
                                          </div>
                                          <p className="text-sm font-bold text-[#c70007]">
                                            Coupon Code Applied: <span className="font-extrabold ml-1">{order.couponCode || order.orderDetails?.couponCode}</span>
                                          </p>
                                        </div>
                                        <p className="text-xs text-gray-300 pl-9">
                                          Discount amount: <span className="text-green-400 font-semibold">${Number(order.discount || order.orderDetails?.discount || 0).toFixed(2)}</span>
                                        </p>
                                      </div>
                                    )}

                                    <div className="pt-4 border-t border-white/10 space-y-3">
                                      {/* Price Breakdown Header */}
                                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Price Breakdown</p>
                                      
                                      {/* Subtotal */}
                                      <div className="flex justify-between items-center py-2 px-2 rounded hover:bg-white/5 transition-colors">
                                        <span className="text-gray-400 flex items-center">
                                          <span className="text-[#c70007] mr-2">•</span> Subtotal
                                        </span>
                                        <span className="text-white font-medium">
                                          ${Number(order.orderDetails?.subtotal || order.subtotal || 0).toFixed(2)}
                                        </span>
                                      </div>

                                      {/* Discount - with prominent display */}
                                      {(order.couponCode || order.orderDetails?.couponCode) && Number(order.discount || order.orderDetails?.discount || 0) > 0 && (
                                        <div className="flex justify-between items-center py-2 px-2 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)' }}>
                                          <span className="text-green-400 flex items-center font-semibold">
                                            <span className="text-green-400 mr-2">✓</span> Discount ({order.couponCode || order.orderDetails?.couponCode})
                                          </span>
                                          <span className="text-green-400 font-bold">
                                            - ${Number(order.discount || order.orderDetails?.discount || 0).toFixed(2)}
                                          </span>
                                        </div>
                                      )}

                                      {/* Shipping */}
                                      <div className="flex justify-between items-center py-2 px-2 rounded hover:bg-white/5 transition-colors">
                                        <span className="text-gray-400 flex items-center">
                                          <span className="text-[#c70007] mr-2">•</span> Shipping
                                        </span>
                                        <span className="text-white font-medium">
                                          ${Number(order.orderDetails?.shipping || order.shipping || 0).toFixed(2)}
                                        </span>
                                      </div>

                                      {/* Tax - with prominent display */}
                                      <div className="flex justify-between items-center py-2 px-2 rounded" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}>
                                        <span className="text-blue-400 flex items-center font-semibold">
                                          <span className="text-blue-400 mr-2">ⓘ</span> Tax
                                        </span>
                                        <span className="text-white font-bold">
                                          ${Number(order.orderDetails?.tax || order.tax || 0).toFixed(2)}
                                        </span>
                                      </div>

                                      <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-3"></div>

                                      {/* Total Amount */}
                                      <div className="flex justify-between items-center pt-2 px-2">
                                        <p className="text-lg font-bold text-white">
                                          Total Amount
                                        </p>
                                        <p className="text-2xl font-extrabold" style={{ color: '#c70007' }}>
                                          ${getOrderTotal(order)}
                                        </p>
                                      </div>

                                      {/* Savings Summary */}
                                      {(order.couponCode || order.orderDetails?.couponCode) && Number(order.discount || order.orderDetails?.discount || 0) > 0 && (
                                        <div className="mt-4 p-4 rounded-lg border border-green-500/30" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}>
                                          <p className="text-sm text-gray-300 flex items-center mb-2">
                                            <span className="text-2xl mr-2">💰</span>
                                            <span>Savings Summary</span>
                                          </p>
                                          <div className="pl-8">
                                            <p className="text-xs text-gray-300">
                                              You saved <span className="text-green-400 font-bold">${Number(order.discount || order.orderDetails?.discount || 0).toFixed(2)}</span>
                                            </p>
                                            <p className="text-xs text-gray-300 mt-1">
                                              with coupon code <span className="text-[#c70007] font-bold">{order.couponCode || order.orderDetails?.couponCode}</span>
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Customer Information */}
                              {(order.Name ||
                                order.email ||
                                order.phoneNumber) && (
                                <div className="mb-8">
                                  <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                                    <svg
                                      className="h-5 w-5 mr-2 text-white/70"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                      />
                                    </svg>
                                    Customer Information
                                  </h4>
                                  <div className="bg-white/5 rounded-xl p-6 space-y-4">
                                    {order.Name && (
                                      <div className="flex items-start gap-3">
                                        <div className="mt-1 flex-shrink-0">
                                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                            <svg
                                              className="h-4 w-4 text-white/70"
                                              fill="none"
                                              viewBox="0 0 24 24"
                                              stroke="currentColor"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                              />
                                            </svg>
                                          </div>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-400">
                                            Name
                                          </p>
                                          <p className="text-white">
                                            {order.Name}
                                          </p>
                                        </div>
                                      </div>
                                    )}

                                    {order.phoneNumber && (
                                      <div className="flex items-start gap-3">
                                        <div className="mt-1 flex-shrink-0">
                                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                            <Phone className="h-4 w-4 text-white/70" />
                                          </div>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-400">
                                            Phone
                                          </p>
                                          <p className="text-white">
                                            {order.phoneNumber}
                                          </p>
                                        </div>
                                      </div>
                                    )}

                                    {order.email && (
                                      <div className="flex items-start gap-3">
                                        <div className="mt-1 flex-shrink-0">
                                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                            <svg
                                              className="h-4 w-4 text-white/70"
                                              fill="none"
                                              viewBox="0 0 24 24"
                                              stroke="currentColor"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                              />
                                            </svg>
                                          </div>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-400">
                                            Email
                                          </p>
                                          <p className="text-white">
                                            {order.email}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}

                        {/* Order Footer */}
                        <div className="border-t border-white/10 p-6 flex justify-between items-center">
                          <p className="text-sm text-gray-400">
                            Order #{orderId}
                          </p>
                          <p className="text-sm text-gray-400">
                            Total:{" "}
                            <span className="text-white font-bold">
                              ${getOrderTotal(order)}
                            </span>
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            )}
          </section>
        </div>
      </div>

      {/* Enhanced KillSwitch-themed Update Order Modal */}
      {isModalOpen && currentOrder && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
            className="relative z-50 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #1c1816 0%, #2a2520 100%)',
              border: '1px solid rgba(199, 0, 7, 0.3)',
              boxShadow: '0 20px 60px rgba(199, 0, 7, 0.2), 0 0 0 1px rgba(199, 0, 7, 0.1)'
            }}
          >
            {/* Animated header background */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: 'linear-gradient(90deg, rgba(199, 0, 7, 0.05) 0%, transparent 50%, rgba(199, 0, 7, 0.05) 100%)'
              }}
              animate={{
                background: [
                  'linear-gradient(90deg, rgba(199, 0, 7, 0.05) 0%, transparent 50%, rgba(199, 0, 7, 0.05) 100%)',
                  'linear-gradient(90deg, transparent 0%, rgba(199, 0, 7, 0.1) 50%, transparent 100%)',
                  'linear-gradient(90deg, rgba(199, 0, 7, 0.05) 0%, transparent 50%, rgba(199, 0, 7, 0.05) 100%)'
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />

            <div className="relative z-10 sticky top-0 p-6 border-b border-gray-500/30 flex justify-between items-center" style={{backgroundColor: '#1c1816'}}>
              <div className="flex items-center gap-3">
                <motion.div 
                  className="p-2 rounded-full flex items-center justify-center"
                  style={{backgroundColor: '#c70007'}}
                  animate={{ 
                    scale: [1, 1.05, 1],
                    rotate: [0, 2, -2, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                >
                  <Edit2 className="w-5 h-5 text-white" />
                </motion.div>
                <h3 className="text-xl font-bold text-white">
                  Update Order #{currentOrder.order_id || currentOrder.orderId}
                </h3>
              </div>
              <motion.button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div>

            <form onSubmit={handleFormSubmit} className="relative z-10 p-6 space-y-6">
              {/* Shipping Method */}
              <div className="space-y-3">
                <label
                  htmlFor="shippingMethod"
                  className="block text-sm font-bold text-white flex items-center gap-2"
                >
                  <Truck className="w-4 h-4" style={{color: '#c70007'}} />
                  Shipping Method
                </label>
                <select
                  id="shippingMethod"
                  name="shippingMethod"
                  value={formData.shippingMethod}
                  onChange={handleInputChange}
                  className="w-full rounded-xl px-4 py-3 text-white transition-all duration-300 focus:ring-2 focus:ring-[#c70007]/20 focus:border-[#c70007]"
                  style={{
                    backgroundColor: '#000000',
                    border: '1px solid rgba(199, 0, 7, 0.3)'
                  }}
                  disabled={updatingOrder}
                >
                  <option value="" style={{backgroundColor: '#000000', color: '#ffffff'}}>Select a shipping method</option>
                  {shippingMethods.map((method) => (
                    <option key={method.value} value={method.value} style={{backgroundColor: '#000000', color: '#ffffff'}}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lead Time */}
              <div className="space-y-3">
                <label
                  htmlFor="leadTime"
                  className="block text-sm font-bold text-white flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" style={{color: '#c70007'}} />
                  Lead Time (Date)
                </label>
                <input
                  type="date"
                  id="leadTime"
                  name="leadTime"
                  value={formData.leadTime}
                  onChange={handleInputChange}
                  className="w-full rounded-xl px-4 py-3 text-white transition-all duration-300 focus:ring-2 focus:ring-[#c70007]/20 focus:border-[#c70007]"
                  style={{
                    backgroundColor: '#000000',
                    border: '1px solid rgba(199, 0, 7, 0.3)'
                  }}
                  disabled={updatingOrder}
                />
              </div>

              {/* Shipping Date */}
              <div className="space-y-3">
                <label
                  htmlFor="shippingDate"
                  className="block text-sm font-bold text-white flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" style={{color: '#c70007'}} />
                  Shipping Date
                </label>
                <input
                  type="date"
                  id="shippingDate"
                  name="shippingDate"
                  value={formData.shippingDate}
                  onChange={handleInputChange}
                  className="w-full rounded-xl px-4 py-3 text-white transition-all duration-300 focus:ring-2 focus:ring-[#c70007]/20 focus:border-[#c70007]"
                  style={{
                    backgroundColor: '#000000',
                    border: '1px solid rgba(199, 0, 7, 0.3)'
                  }}
                  disabled={updatingOrder}
                />
              </div>

              {/* Order Status */}
              <div className="space-y-3">
                <label
                  htmlFor="order_status"
                  className="block text-sm font-bold text-white flex items-center gap-2"
                >
                  <Package className="w-4 h-4" style={{color: '#c70007'}} />
                  Order Status
                </label>
                <select
                  id="order_status"
                  name="order_status"
                  value={formData.order_status}
                  onChange={handleInputChange}
                  className="w-full rounded-xl px-4 py-3 text-white transition-all duration-300 focus:ring-2 focus:ring-[#c70007]/20 focus:border-[#c70007]"
                  style={{
                    backgroundColor: '#000000',
                    border: '1px solid rgba(199, 0, 7, 0.3)'
                  }}
                  disabled={updatingOrder}
                >
                  <option value="" style={{backgroundColor: '#000000', color: '#ffffff'}}>Select a status</option>
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value} style={{backgroundColor: '#000000', color: '#ffffff'}}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-6 flex justify-end space-x-3">
                <motion.button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl text-white font-medium transition-all duration-300"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)'
                  }}
                  whileTap={{ scale: 0.95 }}
                  disabled={updatingOrder}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  className={`px-6 py-3 rounded-xl text-white font-bold transition-all duration-300 flex items-center ${
                    updatingOrder ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  style={{
                    backgroundColor: '#c70007',
                    border: '1px solid #c70007',
                    boxShadow: '0 4px 15px rgba(199, 0, 7, 0.3)'
                  }}
                  whileHover={!updatingOrder ? { 
                    scale: 1.05,
                    boxShadow: '0 8px 25px rgba(199, 0, 7, 0.4)'
                  } : {}}
                  whileTap={!updatingOrder ? { scale: 0.95 } : {}}
                  disabled={updatingOrder}
                >
                  {updatingOrder ? (
                    <>
                      <Loader className="animate-spin h-4 w-4 mr-2" />
                      Updating...
                    </>
                  ) : (
                    'Update Order'
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </RouteGuard>
  );
};

export default AllOrdersPage;