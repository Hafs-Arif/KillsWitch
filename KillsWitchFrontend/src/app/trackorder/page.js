"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "../component/GeneralComponents/Modal";
import {
  Search,
  Package,
  Truck,
  Calendar,
  Clock,
  MapPin,
  Phone,
  CreditCard,
  Mail,
  FileText,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";
import dynamic from "next/dynamic";
import Footer from "../component/HomeComponents/Footer";
import Link from "next/link";
import UserChat from "../component/socketsComponents/UserChat";
import { BASE_URL } from "../api/api";
import { notify, ModernNotificationContainer } from "../components/ModernNotification";

// Dynamically import Navbar with SSR disabled
const Navbar = dynamic(() => import("../component/HomeComponents/Navbar"), {
  ssr: false,
});

const TrackingPage = () => {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [isVisible, setIsVisible] = useState({});
  const [isClient, setIsClient] = useState(false); // For client-side particle rendering
  const router = useRouter();
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({
    type: "",
    message: "",
  });

  useEffect(() => {
    // Set client-side flag for particles
    setIsClient(true);

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
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleTrackClick = async (e) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      setModalContent({
        type: "error",
        message: "Please enter your Tracking Number",
      });
      setShowModal(true);
      return;
    }
    // Accept TRK followed by digits, or ORD-/digits, or just digits
    const trackingRegex = /^(?:TRK\d+|(?:ORD-)?\d+)$/i;
    if (!trackingRegex.test(trackingNumber.trim())) {
      setModalContent({
        type: "error",
        message:
          "Please enter a valid tracking number (e.g., TRK74265874, ORD-123, or 123)",
      });
      setShowModal(true);
      return;
    }
    await fetchOrder();
  };

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const url = `${BASE_URL}/orders/tracking?trackingNumber=${encodeURIComponent(
        trackingNumber.trim()
      )}`;
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const contentType = response.headers.get("content-type") || "";
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(
          text?.slice(0, 200) || `Request failed with status ${response.status}`
        );
      }
      if (!contentType.includes("application/json")) {
        const text = await response.text().catch(() => "");
        throw new Error(
          text?.slice(0, 200) || "Unexpected response format (expected JSON)"
        );
      }

      const data = await response.json();
      if (data?.success && data?.order) {
        const o = data.order;
        const transformedOrder = {
          orderId: o.orderId ?? o.order_id,
          orderDate: o.orderDate ?? o.createdAt ?? o.created_at,
          orderstatus: o.orderStatus ?? o.order_status ?? "processing",
          paymentMethod: o.paymentMethod ?? "Card Payment",
          leadTime: o.leadTime ?? o.leadtime ?? "N/A",
          orderPlacedBy: o.orderPlacedBy ?? o.shippingName ?? "Customer",
          amountPaid: o.amountPaid ?? o.total_price ?? "0.00",
          subtotal: o.subtotal ?? "0.00",
          tax: o.tax ?? "0.00",
          shippingCost: o.shipping_cost ?? o.shippingCost ?? "0.00",
          trackingNumber: o.trackingNumber ?? "N/A",
          paymentStatus: o.paymentStatus ?? "completed",
          email: o.email ?? "N/A",
          shippingName: o.shippingName ?? "N/A",
          shippingAddress: o.shippingAddress ?? "N/A",
          shippingCity: o.shippingCity ?? "N/A",
          shippingState: o.shippingState ?? "N/A",
          shippingCountry: o.shippingCountry ?? "N/A",
          shippingPhone: o.shippingPhone ?? "N/A",
          shippingMethod: o.shippingMethod ?? "Standard Shipping",
          shippingDate: o.shippingDate ?? "N/A",
          billingName: o.billingName ?? "N/A",
          billingAddress: o.billingAddress ?? "N/A",
          billingCity: o.billingCity ?? "N/A",
          billingState: o.billingState ?? "N/A",
          billingCountry: o.billingCountry ?? "N/A",
          items: Array.isArray(o.items) ? o.items : [],
        };

        setOrders([transformedOrder]);
        setModalContent({ 
          type: "success", 
          message: getStatusNotificationMessage(transformedOrder.orderstatus) 
        });
        setShowModal(true);
      } else {
        setOrders([]);
        setModalContent({
          type: "error",
          message:
            data?.message || "Order not found. Please check your tracking number.",
        });
        setShowModal(true);
      }
    } catch (err) {
      console.error("Error:", err);
      setModalContent({
        type: "error",
        message: err.message || "Failed to track order. Please try again.",
      });
      setShowModal(true);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    notify.success(`${label} copied to clipboard`);
  };

  const handleDownloadInvoice = async (order) => {
    if (!order || !order.orderId) {
      setModalContent({ type: 'error', message: 'Invalid order for invoice download' });
      setShowModal(true);
      return;
    }

    const id = order.orderId;
    setDownloadingInvoiceId(id);
    try {
      const resp = await fetch(`${BASE_URL}/orders/${encodeURIComponent(id)}/invoice`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        throw new Error(text || `Failed to download invoice: ${resp.status}`);
      }

      const contentType = resp.headers.get('content-type') || '';
      const blob = await resp.blob();

      // Ensure we got a PDF (but proceed anyway if not)
      if (!contentType.includes('application/pdf')) {
        console.warn('Invoice response content-type is', contentType);
      }

      // Try to derive filename from Content-Disposition header
      let filename = `invoice-${id}.pdf`;
      const cd = resp.headers.get('content-disposition');
      if (cd) {
        const match = cd.match(/filename\*=UTF-8''([^;\n]+)/i) || cd.match(/filename="?([^";\n]+)"?/i);
        if (match && match[1]) filename = decodeURIComponent(match[1]);
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      notify.success('Invoice download started');
    } catch (err) {
      console.error('Invoice download error:', err);
      setModalContent({ type: 'error', message: err.message || 'Failed to download invoice' });
      setShowModal(true);
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === "N/A") return dateString;
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

  const closeModal = () => setShowModal(false);

  // Generate status-specific notification messages
  const getStatusNotificationMessage = (status) => {
    const statusLower = (status || "").toLowerCase();
    
    switch (statusLower) {
      case "pending":
        return "Order found! Your order is currently pending and will be processed soon.";
      case "processing":
        return "Order found! Your order is being processed and will be shipped shortly.";
      case "shipped":
        return "Order found! Your order has been shipped and is on its way to you.";
      case "delivered":
        return "Order found! Your order has been successfully delivered.";
      case "cancelled":
        return "Order found! Your order has been cancelled. Please contact support if you have questions.";
      case "confirmed":
      case "confirm":
        return "Order found! Your order has been confirmed and is being prepared for shipment.";
      case "completed":
        return "Order found! Your order has been completed successfully.";
      case "on hold":
      case "hold":
        return "Order found! Your order is currently on hold. Please contact support for more information.";
      case "refunded":
        return "Order found! Your order has been refunded. The refund should appear in your account soon.";
      case "returned":
        return "Order found! Your order has been returned and is being processed.";
      default:
        return `Order found! Your order status is: ${status || "Unknown"}`;
    }
  };

  const getStatusColor = (status) => {
    const statusLower = (status || "").toLowerCase();
    
    switch (statusLower) {
      case "pending":
        return "bg-yellow-500/10 border-yellow-500/50 text-yellow-400";
      case "processing":
        return "bg-blue-500/10 border-blue-500/50 text-blue-400";
      case "shipped":
        return "bg-purple-500/10 border-purple-500/50 text-purple-400";
      case "delivered":
      case "completed":
        return "bg-green-500/10 border-green-500/50 text-green-400";
      case "cancelled":
        return "bg-red-500/10 border-red-500/50 text-red-400";
      case "confirmed":
      case "confirm":
        return "bg-emerald-500/10 border-emerald-500/50 text-emerald-400";
      case "on hold":
      case "hold":
        return "bg-orange-500/10 border-orange-500/50 text-orange-400";
      case "refunded":
      case "returned":
        return "bg-gray-500/10 border-gray-500/50 text-gray-400";
      default:
        return "bg-[#1c1816]/50 border-[#c70007]/50 text-[#c70007]";
    }
  };

  const getStatusIcon = (status) => {
    const statusLower = (status || "").toLowerCase();
    
    switch (statusLower) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case "processing":
        return <Truck className="w-4 h-4 text-blue-400" />;
      case "shipped":
        return <Truck className="w-4 h-4 text-purple-400" />;
      case "delivered":
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "cancelled":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case "confirmed":
      case "confirm":
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case "on hold":
      case "hold":
        return <AlertCircle className="w-4 h-4 text-orange-400" />;
      case "refunded":
      case "returned":
        return <Package className="w-4 h-4 text-gray-400" />;
      default:
        return <Package className="w-4 h-4 text-[#c70007]" />;
    }
  };

  return (
    <>
      <Navbar />
      <ModernNotificationContainer />
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        type={modalContent.type}
        message={modalContent.message}
      />
      <div className="min-h-screen py-20 px-4 sm:px-6 bg-[#000000] text-white">
        <div className="fixed inset-0 z-[-1] overflow-hidden">
          <div className="absolute top-0 left-1/4 w-px h-full bg-[#c70007]/5"></div>
          <div className="absolute top-0 left-2/4 w-px h-full bg-[#c70007]/5"></div>
          <div className="absolute top-0 left-3/4 w-px h-full bg-[#c70007]/5"></div>
          <div className="absolute top-1/3 left-0 w-full h-px bg-[#c70007]/5"></div>
          <div className="absolute top-2/3 left-0 w-full h-px bg-[#c70007]/5"></div>
          <motion.div
            className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-[#c70007]/20 blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
            transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#c70007]/20 blur-3xl"
            animate={{ x: [0, -40, 0], y: [0, 40, 0] }}
            transition={{ duration: 25, repeat: Number.POSITIVE_INFINITY }}
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

        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <section id="header" className="relative mb-12">
            <motion.div
              className="text-center relative z-10"
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible["header"] ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Track Your Order
              </h1>
              <div className="h-1 w-24 bg-gradient-to-r from-[#c70007] via-[#a50005] to-[#c70007] mx-auto mb-6"></div>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Enter your tracking number below to check the current status
              </p>
            </motion.div>
          </section>

          {/* Tracking Form */}
          <section id="tracking-form" className="relative mb-12">
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible["tracking-form"] ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <div className="bg-[#1c1816] border border-[#c70007]/50 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-8 md:p-12">
                  <form onSubmit={handleTrackClick} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Tracking Number */}
                      <div
                        className="relative"
                        onFocus={() => setActiveField("trackingNumber")}
                        onBlur={() => setActiveField(null)}
                      >
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Tracking Number*
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Package className="h-5 w-5 text-[#c70007]" />
                          </div>
                          <input
                            type="text"
                            className="w-full bg-[#000000] border border-[#c70007]/50 text-white rounded-xl pl-12 pr-5 py-4 outline-none focus:border-[#c70007]/70 transition-all duration-300"
                            placeholder="Enter your tracking number (e.g. TRK45644620)"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            required
                          />
                          <motion.div
                            className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#c70007] via-[#a50005] to-[#c70007] w-0"
                            animate={{
                              width:
                                activeField === "trackingNumber"
                                  ? "100%"
                                  : "0%",
                            }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </div>

                      {/* Placeholder right column for symmetry */}
                      <div className="hidden md:block" />
                    </div>

                    <div className="flex justify-center pt-4">
                      <motion.button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-4 bg-gradient-to-r from-[#c70007] to-[#a50005] hover:from-[#a50005] hover:to-[#850004] rounded-xl text-white transition-all flex items-center justify-center gap-2 overflow-hidden relative"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="relative z-10">
                          {loading ? "Tracking..." : "Track Order"}
                        </span>
                        {!loading && (
                          <motion.div
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            <Search className="w-5 h-5 text-white" />
                          </motion.div>
                        )}
                        {loading && (
                          <svg
                            className="animate-spin ml-2 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        )}
                      </motion.button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </section>

          {/* Order Results */}
          <AnimatePresence>
            {orders.length > 0 && (
              <motion.section
                id="order-results"
                className="relative"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.8 }}
              >
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-white mb-4">
                    Your Order Details
                  </h2>
                  <div className="h-0.5 w-16 bg-gradient-to-r from-[#c70007] via-[#a50005] to-[#c70007] mb-6"></div>
                </div>

                <div className="space-y-8">
                  {orders.map((order, orderIndex) => (
                    <motion.div
                      key={`${order.orderId}-${order.orderDate}`}
                      className="bg-[#1c1816] border border-[#c70007]/50 rounded-3xl overflow-hidden shadow-lg"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: orderIndex * 0.1 }}
                      whileHover={{ scale: 1.01 }}
                    >
                      {/* Order Header */}
                      <div className="p-6 md:p-8 border-b border-[#c70007]/50">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-3">
                              <ShoppingBag className="h-6 w-6 text-[#c70007]" />
                              <h3 className="text-2xl font-bold text-white">
                                Order #{order.orderId}
                              </h3>
                            </div>
                            <p className="text-gray-400 mt-1">
                              Placed on {formatDate(order.orderDate)}
                            </p>
                            <p className="text-gray-400 mt-1">
                              Placed by: {order.orderPlacedBy}
                            </p>
                          </div>
                          <div className="flex items-center">
                            <div
                              className={`flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(
                                order.orderstatus
                              )}`}
                            >
                              {getStatusIcon(order.orderstatus)}
                              <span className="text-sm font-medium">
                                {order.orderstatus}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Order Content */}
                      <div className="p-6 md:p-8">
                        {/* Items Section */}
                        <div className="mb-8">
                          <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                            <Package className="mr-2 h-5 w-5 text-[#c70007]" />
                            Order Items
                          </h4>
                          <div className="bg-[#1c1816]/50 rounded-xl p-4">
                            {order.items && order.items.length > 0 ? (
                              <div className="divide-y divide-[#c70007]/50">
                                {order.items.map((item, index) => (
                                  <motion.div
                                    key={`${order.orderId}-item-${index}`}
                                    className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                                    whileHover={{ x: 5 }}
                                  >
                                    <div>
                                      <p className="text-white font-medium">
                                        {item.item || "Product"}
                                      </p>
                                      <p className="text-sm text-gray-400">
                                        Condition: {item.condition || "New"}
                                      </p>
                                      <p className="text-sm text-[#c70007]">
                                        ${parseFloat(item.price || 0).toFixed(2)}
                                      </p>
                                    </div>
                                    <div className="bg-[#c70007]/10 px-3 py-1 rounded-full text-sm text-white">
                                      Qty: {item.quantity || 1}
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-400">No items found</p>
                            )}
                          </div>
                        </div>

                        {/* Shipping and Payment Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                          {/* Shipping Information */}
                          <div>
                            <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                              <Truck className="mr-2 h-5 w-5 text-[#c70007]" />
                              Shipping Information
                            </h4>
                            <div className="bg-[#1c1816]/50 rounded-xl p-6 space-y-4">
                              <div className="flex items-start gap-3">
                                <div className="mt-1 flex-shrink-0">
                                  <div className="w-8 h-8 rounded-full bg-[#c70007]/10 flex items-center justify-center">
                                    <Truck className="h-4 w-4 text-[#c70007]" />
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-400">
                                    Shipping Method
                                  </p>
                                  <p className="text-white">
                                    {order.shippingMethod}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-start gap-3">
                                <div className="mt-1 flex-shrink-0">
                                  <div className="w-8 h-8 rounded-full bg-[#c70007]/10 flex items-center justify-center">
                                    <Calendar className="h-4 w-4 text-[#c70007]" />
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-400">
                                    Estimated Delivery
                                  </p>
                                  <p className="text-white">
                                    {formatDate(order.shippingDate)}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-start gap-3">
                                <div className="mt-1 flex-shrink-0">
                                  <div className="w-8 h-8 rounded-full bg-[#c70007]/10 flex items-center justify-center">
                                    <Clock className="h-4 w-4 text-[#c70007]" />
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-400">
                                    Lead Time
                                  </p>
                                  <p className="text-white">{order.leadTime}</p>
                                </div>
                              </div>

                              <div className="flex items-start gap-3">
                                <div className="mt-1 flex-shrink-0">
                                  <div className="w-8 h-8 rounded-full bg-[#c70007]/10 flex items-center justify-center">
                                    <MapPin className="h-4 w-4 text-[#c70007]" />
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-400">
                                    Shipping Address
                                  </p>
                                  <div className="text-white">
                                    <p>{order.shippingName}</p>
                                    <p>{order.shippingAddress}</p>
                                    <p>
                                      {order.shippingCity},{" "}
                                      {order.shippingState}
                                    </p>
                                    <p>{order.shippingCountry}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-start gap-3">
                                <div className="mt-1 flex-shrink-0">
                                  <div className="w-8 h-8 rounded-full bg-[#c70007]/10 flex items-center justify-center">
                                    <Phone className="h-4 w-4 text-[#c70007]" />
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-400">
                                    Contact Phone
                                  </p>
                                  <p className="text-white">
                                    {order.shippingPhone}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Payment Information */}
                          <div>
                            <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                              <CreditCard className="mr-2 h-5 w-5 text-[#c70007]" />
                              Payment Information
                            </h4>
                            <div className="bg-[#1c1816]/50 rounded-xl p-6 space-y-4">
                              <div className="flex items-start gap-3">
                                <div className="mt-1 flex-shrink-0">
                                  <div className="w-8 h-8 rounded-full bg-[#c70007]/10 flex items-center justify-center">
                                    <CreditCard className="h-4 w-4 text-[#c70007]" />
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-400">
                                    Payment Method
                                  </p>
                                  <p className="text-white">
                                    {order.paymentMethod}
                                  </p>
                                </div>
                              </div>

                              <div className="pt-4 border-t border-[#c70007]/50">
                                <div className="flex justify-between items-center mb-2">
                                  <p className="text-gray-400">Subtotal</p>
                                  <p className="text-white">
                                    ${parseFloat(order.subtotal || 0).toFixed(2)}
                                  </p>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                  <p className="text-gray-400">Shipping</p>
                                  <p className="text-white">
                                    ${parseFloat(order.shippingCost || 0).toFixed(2)}
                                  </p>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                  <p className="text-gray-400">Tax</p>
                                  <p className="text-white">
                                    ${parseFloat(order.tax || 0).toFixed(2)}
                                  </p>
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t border-[#c70007]/50 mt-3">
                                  <p className="text-lg font-medium text-white">
                                    Total
                                  </p>
                                  <p className="text-xl font-bold text-white">
                                    ${parseFloat(order.amountPaid || 0).toFixed(2)}
                                  </p>
                                </div>

                                <div className="mt-4 pt-4 border-t border-[#c70007]/50">
                                  <div className="flex justify-between items-center mb-2">
                                    <p className="text-gray-400">
                                      Payment Status
                                    </p>
                                    <p className="text-[#c70007] font-medium">
                                      {order.paymentStatus}
                                    </p>
                                  </div>
                                  {order.trackingNumber &&
                                    order.trackingNumber !== "N/A" && (
                                      <div className="flex justify-between items-center mb-2">
                                        <p className="text-gray-400">
                                          Tracking Number
                                        </p>
                                        <p className="text-white font-mono text-sm">
                                          {order.trackingNumber}
                                        </p>
                                      </div>
                                    )}
                                  <div className="flex justify-between items-center">
                                    <p className="text-gray-400">Order Email</p>
                                    <p className="text-white text-sm">
                                      {order.email}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Order Actions */}
                        <div className="flex flex-wrap gap-4 justify-end">
                          <motion.button
                          onClick={() => router.push('/ContactUs')}
                            className="px-5 py-2 bg-[#c70007]/10 border border-[#c70007]/50 rounded-full text-white hover:bg-[#c70007]/20 transition-colors flex items-center space-x-2"
                            whileHover={{ scale: 1.05, x: 5 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <span>Contact Support</span>
                            <ChevronRight className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            onClick={() => handleDownloadInvoice(order)}
                            disabled={downloadingInvoiceId === order.orderId}
                            className="px-5 py-2 bg-[#c70007]/10 border border-[#c70007]/50 rounded-full text-white hover:bg-[#c70007]/20 transition-colors flex items-center space-x-2 disabled:opacity-50"
                            whileHover={{ scale: 1.05, x: 5 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <span>{downloadingInvoiceId === order.orderId ? 'Downloading...' : 'Download Invoice'}</span>
                            {downloadingInvoiceId === order.orderId ? (
                              <svg className="animate-spin ml-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                              </svg>
                            ) : (
                              <ArrowRight className="w-4 h-4" />
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Help Section */}
          <section id="help" className="relative mt-20">
            <motion.div
              className="bg-[#1c1816] border border-[#c70007]/50 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible["help"] ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              whileHover={{ scale: 1.01 }}
            >
              <div className="absolute inset-0 z-0">
                <motion.div
                  className="absolute top-0 left-1/4 w-40 h-40 rounded-full bg-[#c70007]/20 blur-xl"
                  animate={{
                    y: [0, 20, 0],
                    opacity: [0.2, 0.3, 0.2],
                  }}
                  transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY }}
                />
                <motion.div
                  className="absolute bottom-0 right-1/4 w-40 h-40 rounded-full bg-[#c70007]/20 blur-xl"
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.2, 0.3, 0.2],
                  }}
                  transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY }}
                />
              </div>
              <div className="relative z-10 max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Need Help With Your Order?
                </h2>
                <p className="text-gray-300 mb-8">
                  Our customer support team is available to assist you with any
                  questions or concerns about your order. We're here to help!
                </p>
                <motion.button
                  className="px-8 py-4 bg-gradient-to-r from-[#c70007] to-[#a50005] hover:from-[#a50005] hover:to-[#850004] rounded-full text-white transition-all flex items-center space-x-2 mx-auto"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link href="/ContactUs">
                    <span>Contact Support</span>
                  </Link>
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          </section>
        </div>
      </div>
      <UserChat />
      <Footer />
    </>
  );
};

export default TrackingPage;