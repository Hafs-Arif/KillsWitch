"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  Package,
  Tag,
  Star,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  FileText,
  Info,
  MessageSquare,
  Truck,
  Shield,
  RotateCcw,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../component/HomeComponents/Navbar";
import Footer from "../component/HomeComponents/Footer";
import Modal from "../component/GeneralComponents/Modal";
import UserChat from "../component/socketsComponents/UserChat";
import { API, cartAPI } from "../api/api";

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalInfo, setModalInfo] = useState({
    type: "success",
    message: "",
  });

  const navigateToProductDetail = (product) => {
    const identifier = product.slug;
    if (identifier) {
      router.push(`/${identifier}`);
    } else {
      // fallback: show error or do nothing
      setModalInfo({ type: "error", message: "No slug found for this product." });
      setShowModal(true);
    }
  };

  // Calculate cart totals
const cartTotal = cartItems.reduce((total, item) => {
  const effectivePrice = item.sale_price ? Number.parseFloat(item.sale_price) : Number.parseFloat(item.product_price) || 0;
  return total + effectivePrice * item.quantity;
}, 0);

  const totalItems = cartItems.reduce((count, item) => count + item.quantity, 0);

  // Load cart data from backend (if authenticated) or localStorage (if guest)
  useEffect(() => {
    const loadCartData = async () => {
      try {
        // Check if user is authenticated first
        const profile = await API.auth.getProfile();
        
        if (profile && profile.user) {
          // User is authenticated - fetch cart from backend
          try {
            const response = await fetch(`${API.BASE_URL}/cart`, {
              method: 'GET',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if (response.ok) {
              const result = await response.json();
              if (result.success && result.data.items) {
                setCartItems(result.data.items);
              } else {
                console.warn('Invalid backend response, using localStorage');
                const cartData = localStorage.getItem('cart');
                if (cartData) {
                  const parsedData = JSON.parse(cartData);
                  setCartItems(parsedData);
                }
              }
            } else {
              console.warn('Backend cart fetch failed, using localStorage:', response.status);
              // Fallback to localStorage
              const cartData = localStorage.getItem('cart');
              if (cartData) {
                const parsedData = JSON.parse(cartData);
                setCartItems(parsedData);
              }
            }
          } catch (error) {
            console.warn('Error fetching from backend, using localStorage:', error);
            // Fallback to localStorage
            const cartData = localStorage.getItem('cart');
            if (cartData) {
              const parsedData = JSON.parse(cartData);
              setCartItems(parsedData);
            }
          }
        } else {
          // Guest user - use localStorage
          const cartData = localStorage.getItem('cart');
          if (cartData) {
            const parsedData = JSON.parse(cartData);
            setCartItems(parsedData);
          }
        }
      } catch (error) {
        console.error('Error loading cart data:', error);
        // Fallback: try localStorage
        try {
          const cartData = localStorage.getItem('cart');
          if (cartData) {
            const parsedData = JSON.parse(cartData);
            setCartItems(parsedData);
          }
        } catch (e) {
          console.error('Error parsing localStorage:', e);
        }
      } finally {
        setLoading(false);
      }
    };

    if (typeof window !== 'undefined') {
      loadCartData();
    }
  }, []);

  // update cart items when localStorage changes (from another tab/page)
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'cart') { 
        try {
          const newCart = JSON.parse(e.newValue || '[]');
          setCartItems(newCart);
        } catch (_) {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Handle scroll animations
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
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Update item quantity
  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;

    const item = cartItems.find((i) => i.product_product_id === productId);

    const updatedCart = cartItems.map((item) =>
      item.product_product_id === productId ? { ...item, quantity: newQuantity } : item
    );

    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));

    // send change to backend if possible
    if (item && item.id) {
      try {
        await cartAPI.updateCartItem(item.id, { quantity: newQuantity });
      } catch (err) {
        console.warn('Failed to update cart item on server', err);
      }
    }

    // Trigger cart count update in Navbar
    window.dispatchEvent(new Event('storage'));
  };

  // Remove item from cart
  const removeFromCart = async (productId) => {
    const item = cartItems.find((i) => i.product_product_id === productId);
    const updatedCart = cartItems.filter((item) => item.product_product_id !== productId);
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));

    if (item && item.id) {
      try {
        await cartAPI.updateCartItem(item.id, { quantity: 0 });
      } catch (err) {
        console.warn('Failed to remove cart item on server', err);
      }
    }

    // Trigger cart count update in Navbar
    window.dispatchEvent(new Event('storage'));

    setModalInfo({
      type: "info",
      message: "Item has been removed from your cart.",
    });
    setShowModal(true);
  };

  // Clear entire cart
  const clearCart = async () => {
    setCartItems([]);
    localStorage.setItem("cart", JSON.stringify([]));

    try {
      await cartAPI.clearCart();
    } catch (err) {
      console.warn('Failed to clear server cart', err);
    }

    // Trigger cart count update in Navbar
    window.dispatchEvent(new Event('storage'));

    setModalInfo({
      type: "info",
      message: "Your cart has been cleared.",
    });
    setShowModal(true);
  };

  // Checkout all items
  const checkoutAllItems = async () => {
    try {
      // Check if user is authenticated using cookie-based session
      const profile = await API.auth.getProfile();
      if (!profile || !profile.user) {
        throw new Error('Unauthenticated');
      }
      
      const checkoutData = {
        items: cartItems,
        totalAmount: cartTotal,
        itemCount: totalItems,
        checkoutType: "full",
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem("checkoutData", JSON.stringify(checkoutData));
      router.push("/Payment");
    } catch (error) {
      setModalInfo({
        type: "error",
        message: "Please log in to place an order. You will be redirected to the login page.",
      });
      setShowModal(true);
      // Redirect immediately to login preserving next
      router.push("/login?next=" + encodeURIComponent("/cart"));
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Navbar />

      <div className="flex-1 relative">
        {/* Animated background elements */}
        <div className="fixed inset-0 z-[-1] overflow-hidden">
          <div className="absolute top-0 left-1/4 w-px h-full bg-[#1c1816]"></div>
          <div className="absolute top-0 left-2/4 w-px h-full bg-[#1c1816]"></div>
          <div className="absolute top-0 left-3/4 w-px h-full bg-[#1c1816]"></div>
          <div className="absolute top-1/3 left-0 w-full h-px bg-[#1c1816]"></div>
          <div className="absolute top-2/3 left-0 w-full h-px bg-[#1c1816]"></div>

          <motion.div
            className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-[#c70007]/20 blur-3xl"
            animate={{
              x: [0, 30, 0],
              y: [0, -30, 0],
            }}
            transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#c70007]/20 blur-3xl"
            animate={{
              x: [0, -40, 0],
              y: [0, 40, 0],
            }}
            transition={{ duration: 25, repeat: Number.POSITIVE_INFINITY }}
          />
        </div>

        <div className="pt-6 pb-12 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <section id="header" className="relative mb-12">
              <motion.div
                className="text-center relative z-10"
                initial={{ opacity: 0, y: 30 }}
                animate={isVisible["header"] ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8 }}
              >
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Your Cart</h1>
                <div className="h-1 w-24 bg-gradient-to-r from-[#c70007] to-[#c70007]/50 mx-auto mb-6"></div>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-4">
                  {totalItems > 0
                    ? `You have ${totalItems} item${totalItems !== 1 ? "s" : ""} in your cart`
                    : "Your cart is empty"}
                </p>
                <Link href="/products">
                  <motion.button
                    className="flex items-center gap-2 px-4 py-2 bg-[#1c1816] border border-[#c70007]/50 rounded-lg text-white hover:bg-[#c70007]/20 transition-colors mx-auto"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Continue Shopping
                  </motion.button>
                </Link>
              </motion.div>
            </section>

            {/* Cart Content */}
            <section id="cart-content" className="relative">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#c70007]"></div>
                </div>
              ) : cartItems.length === 0 ? (
                <motion.div
                  className="text-center py-16 px-4 bg-[#1c1816] rounded-xl border border-[#c70007]/20"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="inline-flex justify-center items-center p-6 bg-[#c70007]/10 rounded-full mb-6">
                    <ShoppingCart className="w-12 h-12 text-[#c70007]" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-4">Your Cart is Empty</h2>
                  <p className="text-gray-300 mb-8 max-w-md mx-auto">
                    Looks like you haven't added any products to your cart yet. Browse our products and find something
                    you'll love.
                  </p>
                  <Link href="/products">
                    <motion.button
                      className="px-6 py-3 bg-[#c70007] border border-[#c70007] rounded-lg text-white hover:bg-[#c70007]/80 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Browse Products
                    </motion.button>
                  </Link>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Cart Items */}
                  <motion.div className="lg:col-span-2 space-y-6" variants={containerVariants} initial="hidden" animate="visible">
                    {cartItems.map((item) => (
                      <CartItem
                        key={item.product_product_id}
                        item={item}
                        updateQuantity={updateQuantity}
                        removeFromCart={removeFromCart}
                        navigateToProductDetail={navigateToProductDetail}
                      />
                    ))}
                    
                    <div className="flex justify-end">
                      <motion.button
                        onClick={clearCart}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1c1816] border border-[#c70007]/50 text-[#c70007] rounded-lg hover:bg-[#c70007]/20 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Trash2 className="w-4 h-4" />
                        Clear Cart
                      </motion.button>
                    </div>
                  </motion.div>

                  {/* Order Summary */}
                  <motion.div
                    className="lg:col-span-1"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <div className="bg-[#1c1816] border border-[#c70007]/20 rounded-xl p-6 sticky top-24">
                      <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>
                      {/* Order Items */}
                      <div className="space-y-3 mb-4">
                       {cartItems.map((item) => (
  <div key={item.product_product_id} className="flex justify-between items-center">
    <div className="flex-1">
      <span className="text-sm text-gray-300">{item.product_name}</span>
      <span className="text-sm text-gray-400 ml-2">x{item.quantity}</span>
    </div>
    <div className="text-right">
      {item.sale_price ? (
        <div className="flex flex-col">
          <span className="text-sm text-gray-400 line-through">
            ${(item.product_price * item.quantity).toFixed(2)}
          </span>
          <span className="text-sm font-bold text-green-400">
            ${(item.sale_price * item.quantity).toFixed(2)}
          </span>
        </div>
      ) : (
        <span className="text-sm font-bold text-white">
          ${(item.product_price * item.quantity).toFixed(2)}
        </span>
      )}
    </div>
  </div>
))}
                      </div>
                      <div className="h-px bg-[#c70007]/20 my-4"></div>
                      <div className="space-y-4 mb-6">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Subtotal</span>
                          <span className="text-white">${cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Shipping</span>
                          <span className="text-gray-300">Calculated at checkout</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Tax</span>
                          <span className="text-gray-300">Calculated at checkout</span>
                        </div>
                        <div className="h-px bg-[#c70007]/20 my-4"></div>
                        <div className="flex justify-between text-lg font-bold">
                          <span className="text-white">Total</span>
                          <span className="text-white">${cartTotal.toFixed(2)}</span>
                        </div>
                      </div>
                      <motion.button
                        onClick={checkoutAllItems}
                        className="w-full py-3 bg-[#c70007] border border-[#c70007] rounded-lg text-white hover:bg-[#c70007]/80 transition-colors flex items-center justify-center gap-2 relative overflow-hidden group"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="relative z-10">Proceed to Checkout</span>
                        <CreditCard className="w-5 h-5 relative z-10" />
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-[#c70007]/80 to-[#c70007]/40 w-0 group-hover:w-full transition-all duration-300"
                          initial={{ width: 0 }}
                          whileHover={{ width: "100%" }}
                        />
                      </motion.button>
                      <div className="mt-6 text-sm text-gray-300 text-center">
                        <p>Need help? Contact our support team</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
      <UserChat />
      <Footer />
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} type={modalInfo.type} message={modalInfo.message} />
    </div>
  );
}

function CartItem({ item, updateQuantity, removeFromCart, navigateToProductDetail }) {
  const router = useRouter();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showFullscreenVideo, setShowFullscreenVideo] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [navigationFeedback, setNavigationFeedback] = useState("");

  // Helper to read a field from either the flattened item or nested product object
  const getField = (key) => {
    if (!item) return null;
    // direct key on item
    if (item[key] !== undefined && item[key] !== null) return item[key];
    // nested on product
    if (item.product && item.product[key] !== undefined && item.product[key] !== null) return item.product[key];
    // sometimes backend uses non-prefixed keys on product (e.g., 'model' vs 'product_model')
    if (key.startsWith('product_')) {
      const bare = key.replace(/^product_/, '');
      if (item.product && item.product[bare] !== undefined && item.product[bare] !== null) return item.product[bare];
    }
    return null;
  };

  // Get product images
  const productImages = (() => {
    if (!item) return [];

    const images = [];
    const push = (url) => {
      if (!url) return;
      if (!images.includes(url)) images.push(url);
    };

    // Common single-image keys (main/front image)
    push(item.product_image || item.image || item.main_image || item.thumbnail);

    // Back-side image fields (various shapes)
    const backArrays = [item.back_images, item.product_back_images, item.images_back, item.product_back];
    backArrays.forEach(arr => {
      if (!Array.isArray(arr)) return;
      arr.forEach(img => {
        if (!img) return;
        const url = typeof img === 'string' ? img : (img?.url || img?.image_url || img?.image);
        push(url);
      });
    });

    // Generic arrays containing images
    const arrays = [item.product_images, item.images, item.pictures, item.product_images_data];
    arrays.forEach(arr => {
      if (!Array.isArray(arr)) return;
      arr.forEach(img => {
        if (!img) return;
        const url = typeof img === 'string' ? img : (img?.url || img?.image_url || img?.image || img?.src);
        push(url);
      });
    });

    // Single-object keys that might contain a url
    const singleKeys = ['image', 'image_url', 'url', 'product_image_url', 'src'];
    singleKeys.forEach(k => push(item[k]));

    return images.filter(Boolean);
  })();

  // Navigation functions for images
  const goToPreviousImage = (e) => {
    if (e) e.stopPropagation();
    
    const totalMedia = productImages.length + (item?.video_url ? 1 : 0);
    if (totalMedia <= 1) return;
    
    setSelectedImageIndex(prevIndex => {
      let newIndex;
      if (prevIndex === -1) {
        newIndex = productImages.length - 1;
      } else if (prevIndex === 0) {
        newIndex = item?.video_url ? -1 : productImages.length - 1;
      } else {
        newIndex = prevIndex - 1;
      }
      
      const label = newIndex === -1 ? 'Video' : `Image ${newIndex + 1}/${productImages.length}`;
      setNavigationFeedback(`← ${label}`);
      setTimeout(() => setNavigationFeedback(""), 1000);
      
      return newIndex;
    });
  };

  const goToNextImage = (e) => {
    if (e) e.stopPropagation();
    
    const totalMedia = productImages.length + (item?.video_url ? 1 : 0);
    if (totalMedia <= 1) return;
    
    setSelectedImageIndex(prevIndex => {
      let newIndex;
      if (prevIndex === -1) {
        newIndex = 0;
      } else if (prevIndex === productImages.length - 1) {
        newIndex = item?.video_url ? -1 : 0;
      } else {
        newIndex = prevIndex + 1;
      }
      
      const label = newIndex === -1 ? 'Video' : `Image ${newIndex + 1}/${productImages.length}`;
      setNavigationFeedback(`→ ${label}`);
      setTimeout(() => setNavigationFeedback(""), 1000);
      
      return newIndex;
    });
  };

  const handleThumbnailClick = (index, e) => {
    if (e) e.stopPropagation();
    
    if (index < 0 || index >= productImages.length) return;
    
    setSelectedImageIndex(index);
    setNavigationFeedback(`Image ${index + 1}/${productImages.length}`);
    setTimeout(() => setNavigationFeedback(""), 1000);
  };

  const checkoutSingleItem = async () => {
    try {
      const profile = await API.auth.getProfile();
      if (!profile || !profile.user) {
        throw new Error('Unauthenticated');
      }
      
      const effectivePrice = item.sale_price ? Number.parseFloat(item.sale_price) : Number.parseFloat(item.product_price) || 0;
      const checkoutData = {
        items: [item],
        totalAmount: effectivePrice * item.quantity,
        itemCount: item.quantity,
        checkoutType: "single",
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem("checkoutData", JSON.stringify(checkoutData));
      router.push("/Payment");
    } catch (error) {
      // redirect to login preserving next to cart
      router.push("/login?next=" + encodeURIComponent("/cart"));
    }
  };

  const toggleFavorite = (e) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const shareProduct = async (e) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.product_name,
          text: item.product_short_description,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Check if product has specifications
  const hasSpecifications = () => {
    const specFields = [
      'product_model', 'motherboard', 'material', 'case_size', 'front_ports',
      'gpu_length', 'cpu_height', 'hdd_support', 'ssd_support', 'expansion_slots',
      'water_cooling_support', 'case_fan_support', 'carton_size', 'loading_capacity',
      'pump_parameter', 'pump_bearing', 'pump_speed', 'pump_interface', 'pump_noise',
      'tdp', 'pipe_length_material', 'light_effect', 'drainage_size',
      'fan_size', 'fan_speed', 'fan_voltage', 'fan_interface', 'fan_airflow',
      'fan_wind_pressure', 'fan_noise', 'fan_bearing_type', 'fan_power', 'fan_rated_voltage',
      'axis', 'number_of_keys', 'weight', 'carton_weight', 'package_size',
      'carton_size_kb', 'keycap_technology', 'wire_length', 'lighting_style', 'body_material',
      'dpi', 'return_rate', 'engine_solution', 'surface_technology',
      'package', 'packing', 'moq_customization', 'customization_options'
    ];
    
    return specFields.some(field => Boolean(getField(field)));
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className="bg-[#1c1816] border border-[#c70007]/20 rounded-xl overflow-hidden transition-all duration-300 hover:border-[#c70007]/50"
    >

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-6">
{/* Product Images Section - Left Side (2 columns) */}
<div className="lg:col-span-2 space-y-4">
  {/* Main Image/Video Display */}
  <div className="relative">
    {/* Media Counter Badge */}
    {(productImages.length > 1 || item.video_url) && (
      <div className="absolute top-4 right-4 z-10 bg-black/70 backdrop-blur-xl text-white px-3 py-1 rounded-full text-sm font-medium border border-white/20">
        {selectedImageIndex === -1 ? 'Video' : `${selectedImageIndex + 1} / ${productImages.length}`}
      </div>
    )}

    {/* Navigation Feedback */}
    {navigationFeedback && (
      <div className="absolute top-4 left-4 z-10 bg-[#c70007]/90 backdrop-blur-xl text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse border border-[#c70007]/50">
        {navigationFeedback}
      </div>
    )}

    {selectedImageIndex === -1 ? (
      // Video Display
      item.video_url ? (
        <div
          className="relative w-full aspect-square rounded-xl overflow-hidden border border-white/10 bg-gray-800/30 backdrop-blur-xl cursor-pointer group"
          style={{backgroundColor: '#1c1816'}}
          onClick={(e) => {
            e.stopPropagation();
            setShowFullscreenVideo(true);
          }}
        >
          <video
            className="w-full h-full object-contain"
            style={{backgroundColor: '#0a0a0a'}}
            controls
            controlsList="nodownload"
          >
            <source src={item.video_url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
            <ZoomIn className="w-8 h-8 text-white" />
          </div>
        </div>
      ) : (
        <div className="w-full aspect-square rounded-xl overflow-hidden border border-white/10 bg-gray-800/30 backdrop-blur-xl flex items-center justify-center" style={{backgroundColor: '#1c1816'}}>
          <Package className="w-16 h-16 text-gray-500" />
        </div>
      )
    ) : (
      // Image Display
      <div
        className="relative w-full aspect-square rounded-xl overflow-hidden cursor-zoom-in border border-white/10 bg-gray-800/30 backdrop-blur-xl group"
        style={{backgroundColor: '#1c1816'}}
        onClick={(e) => {
          e.stopPropagation();
          setShowImageModal(true);
        }}
      >
        {productImages.length > 0 && productImages[selectedImageIndex] ? (
          <img
            src={productImages[selectedImageIndex]}
            alt={`${item.product_name} - Image ${selectedImageIndex + 1}`}
            className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-110"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/placeholder.svg?height=400&width=400";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-gray-500" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    )}

    {/* Navigation Arrows */}
    {(productImages.length > 1 || item.video_url) && (
      <>
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            goToPreviousImage(e);
          }}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            goToNextImage(e);
          }}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </>
    )}
  </div>

  {/* Thumbnail Strip - All Images and Video */}
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <h4 className="text-sm font-medium text-gray-300">
        Media ({productImages.length + (item.video_url ? 1 : 0)})
      </h4>
      {(productImages.length > 1 || item.video_url) && (
        <p className="text-xs text-gray-400">
          Click to view
        </p>
      )}
    </div>
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#c70007]/50 scrollbar-track-gray-800">
      {/* All Product Images */}
      {productImages.map((image, index) => (
        <motion.button
          key={`img-${index}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedImageIndex(index);
            setNavigationFeedback(`Image ${index + 1}/${productImages.length}`);
            setTimeout(() => setNavigationFeedback(""), 1000);
          }}
          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
            selectedImageIndex === index
              ? "border-[#c70007] shadow-lg shadow-[#c70007]/25 ring-2 ring-[#c70007]/20"
              : "border-white/20 hover:border-white/40"
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <img
            src={image}
            alt={`Thumbnail ${index + 1}`}
            className="w-full h-full object-contain p-1"
            style={{backgroundColor: '#1c1816'}}
            onError={(e) => {
              e.target.src = "/placeholder.svg";
            }}
          />
          {selectedImageIndex === index && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-1.5 h-1.5 bg-[#c70007] rounded-full shadow-lg"></div>
            </div>
          )}
        </motion.button>
      ))}

      {/* Video Thumbnail if exists */}
      {item.video_url && (
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedImageIndex(-1);
            setNavigationFeedback('Video');
            setTimeout(() => setNavigationFeedback(""), 1000);
          }}
          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 flex items-center justify-center ${
            selectedImageIndex === -1
              ? "border-[#c70007] shadow-lg shadow-[#c70007]/25 ring-2 ring-[#c70007]/20"
              : "border-white/20 hover:border-white/40"
          }`}
          style={{backgroundColor: '#1c1816'}}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="text-center">
            <div className="text-2xl">🎬</div>
            <p className="text-[10px] text-gray-300">Video</p>
          </div>
        </motion.button>
      )}
    </div>
  </div>
</div>
        {/* Product Details Section - Right Side (3 columns) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Price and Quick Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h3
          className="font-semibold text-2xl text-white cursor-pointer hover:text-[#c70007] transition-colors"
          onClick={() => navigateToProductDetail(item)}
        >
          {item.product_name}
        </h3>
             {item.product_price && (
                <div>
                  {item.sale_price ? (
                    <div className="flex flex-col">
                      <span className="text-lg text-gray-400 line-through">
                        ${parseFloat(item.product_price).toFixed(2)}
                      </span>
                      <span className="text-xl font-bold text-green-400">
                        ${parseFloat(item.sale_price).toFixed(2)}
                      </span>
                      <div className="text-sm text-gray-400">
                        Save {((1 - item.sale_price / item.product_price) * 100).toFixed(0)}%
                      </div>
                    </div>
                  ) : (
                    <div className="text-xl font-bold text-[#c70007]">
                      ${parseFloat(item.product_price).toFixed(2)}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateToProductDetail(item);
                }}
                className="px-3 py-1.5 bg-[#c70007]/80 backdrop-blur-sm rounded-lg text-white text-sm border border-[#c70007]/50 hover:bg-[#c70007] transition-colors flex items-center gap-1.5"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Eye className="w-3.5 h-3.5" />
                View Details
              </motion.button>
              <motion.button
                onClick={checkoutSingleItem}
                className="px-3 py-1.5 bg-[#c70007]/80 backdrop-blur-sm rounded-lg text-white text-sm border border-[#c70007]/50 hover:bg-[#c70007] transition-colors flex items-center gap-1.5"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <CreditCard className="w-3.5 h-3.5" />
                Buy Now
              </motion.button>
            </div>
          </div>

          {/* Product Tags */}
          <div className="flex flex-wrap gap-2">
            {item.product_condition && (
              <span className="inline-flex items-center px-2 py-1 bg-[#c70007]/10 rounded-md text-xs text-gray-300">
                <Package className="w-3 h-3 mr-1 text-[#c70007]" />
                {item.product_condition}
              </span>
            )}
            {item.product_sub_condition && (
              <span className="inline-flex items-center px-2 py-1 bg-[#c70007]/10 rounded-md text-xs text-gray-300">
                <Star className="w-3 h-3 mr-1 text-[#c70007]" />
                {item.product_sub_condition}
              </span>
            )}
            {item.category_category_name && (
              <span className="inline-flex items-center px-2 py-1 bg-[#c70007]/10 rounded-md text-xs text-gray-300">
                <Tag className="w-3 h-3 mr-1 text-[#c70007]" />
                {item.category_category_name}
              </span>
            )}
            {item.brand_brand_name && (
              <span className="inline-flex items-center px-2 py-1 bg-gray-800/30 border border-white/20 rounded-md text-xs text-gray-300">
                <Tag className="w-3 h-3 mr-1" />
                {item.brand_brand_name}
              </span>
            )}
          </div>

          {/* Descriptions */}
          {item.product_short_description && (
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-1">Overview</h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                {item.product_short_description}
              </p>
            </div>
          )}

          {item.product_long_description && (
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-1">Description</h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                {item.product_long_description}
              </p>
            </div>
          )}

          {/* Specifications Section */}
          {hasSpecifications() && (
            <div className="border-t border-[#c70007]/20 pt-4">
              <button
                onClick={() => setShowAllSpecs(!showAllSpecs)}
                className="flex items-center gap-2 text-[#c70007] hover:text-[#c70007]/80 transition-colors mb-3"
              >
                <FileText className="w-4 h-4" />
                <span className="font-medium">
                  {showAllSpecs ? 'Hide Specifications' : 'Show All Specifications'}
                </span>
                {showAllSpecs ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              <AnimatePresence>
                {showAllSpecs && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-4">
                      {/* Case Specifications */}
                      {(getField('product_model') || getField('motherboard') || getField('material') || getField('case_size')) && (
                        <div>
                          <h5 className="text-sm font-medium text-[#c70007] mb-2 flex items-center">
                            <span className="w-1.5 h-1.5 bg-[#c70007] rounded-full mr-2"></span>
                            Case Specifications
                          </h5>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {getField('product_model') && (
                              <div className="text-gray-400">Model: <span className="text-white ml-1">{getField('product_model')}</span></div>
                            )}
                            {getField('motherboard') && (
                              <div className="text-gray-400">Motherboard: <span className="text-white ml-1">{getField('motherboard')}</span></div>
                            )}
                            {getField('material') && (
                              <div className="text-gray-400">Material: <span className="text-white ml-1">{getField('material')}</span></div>
                            )}
                            {getField('case_size') && (
                              <div className="text-gray-400">Case Size: <span className="text-white ml-1">{getField('case_size')}</span></div>
                            )}
                            {getField('front_ports') && (
                              <div className="text-gray-400 col-span-2">Front Ports: <span className="text-white ml-1">{getField('front_ports')}</span></div>
                            )}
                            {getField('gpu_length') && (
                              <div className="text-gray-400">GPU Length: <span className="text-white ml-1">{getField('gpu_length')}</span></div>
                            )}
                            {getField('cpu_height') && (
                              <div className="text-gray-400">CPU Height: <span className="text-white ml-1">{getField('cpu_height')}</span></div>
                            )}
                            {getField('hdd_support') && (
                              <div className="text-gray-400">HDD Support: <span className="text-white ml-1">{getField('hdd_support')}</span></div>
                            )}
                            {getField('ssd_support') && (
                              <div className="text-gray-400">SSD Support: <span className="text-white ml-1">{getField('ssd_support')}</span></div>
                            )}
                            {getField('expansion_slots') && (
                              <div className="text-gray-400">Expansion Slots: <span className="text-white ml-1">{getField('expansion_slots')}</span></div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Pump Specifications */}
                      {(getField('pump_parameter') || getField('pump_bearing') || getField('pump_speed') || getField('tdp')) && (
                        <div>
                          <h5 className="text-sm font-medium text-[#c70007] mb-2 flex items-center">
                            <span className="w-1.5 h-1.5 bg-[#c70007] rounded-full mr-2"></span>
                            Pump Specifications
                          </h5>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {getField('pump_parameter') && (
                              <div className="text-gray-400 col-span-2">Parameter: <span className="text-white ml-1">{getField('pump_parameter')}</span></div>
                            )}
                            {getField('pump_bearing') && (
                              <div className="text-gray-400">Bearing: <span className="text-white ml-1">{getField('pump_bearing')}</span></div>
                            )}
                            {getField('pump_speed') && (
                              <div className="text-gray-400">Speed: <span className="text-white ml-1">{getField('pump_speed')}</span></div>
                            )}
                            {getField('tdp') && (
                              <div className="text-gray-400">TDP: <span className="text-white ml-1">{getField('tdp')}</span></div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Fan Specifications */}
                      {(getField('fan_size') || getField('fan_speed') || getField('fan_airflow') || getField('fan_noise')) && (
                        <div>
                          <h5 className="text-sm font-medium text-[#c70007] mb-2 flex items-center">
                            <span className="w-1.5 h-1.5 bg-[#c70007] rounded-full mr-2"></span>
                            Fan Specifications
                          </h5>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {getField('fan_size') && (
                              <div className="text-gray-400">Size: <span className="text-white ml-1">{getField('fan_size')}</span></div>
                            )}
                            {getField('fan_speed') && (
                              <div className="text-gray-400">Speed: <span className="text-white ml-1">{getField('fan_speed')}</span></div>
                            )}
                            {getField('fan_airflow') && (
                              <div className="text-gray-400">Airflow: <span className="text-white ml-1">{getField('fan_airflow')}</span></div>
                            )}
                            {getField('fan_noise') && (
                              <div className="text-gray-400">Noise: <span className="text-white ml-1">{getField('fan_noise')}</span></div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Keyboard Specifications */}
                      {(getField('axis') || getField('number_of_keys') || getField('weight') || getField('lighting_style')) && (
                        <div>
                          <h5 className="text-sm font-medium text-[#c70007] mb-2 flex items-center">
                            <span className="w-1.5 h-1.5 bg-[#c70007] rounded-full mr-2"></span>
                            Keyboard Specifications
                          </h5>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {getField('axis') && (
                              <div className="text-gray-400">Axis: <span className="text-white ml-1">{getField('axis')}</span></div>
                            )}
                            {getField('number_of_keys') && (
                              <div className="text-gray-400">Keys: <span className="text-white ml-1">{getField('number_of_keys')}</span></div>
                            )}
                            {getField('weight') && (
                              <div className="text-gray-400">Weight: <span className="text-white ml-1">{getField('weight')}</span></div>
                            )}
                            {getField('lighting_style') && (
                              <div className="text-gray-400">Lighting: <span className="text-white ml-1">{getField('lighting_style')}</span></div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Mouse Specifications */}
                      {(getField('dpi') || getField('return_rate') || getField('engine_solution')) && (
                        <div>
                          <h5 className="text-sm font-medium text-[#c70007] mb-2 flex items-center">
                            <span className="w-1.5 h-1.5 bg-[#c70007] rounded-full mr-2"></span>
                            Mouse Specifications
                          </h5>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {getField('dpi') && (
                              <div className="text-gray-400">DPI: <span className="text-white ml-1">{getField('dpi')}</span></div>
                            )}
                            {getField('return_rate') && (
                              <div className="text-gray-400">Return Rate: <span className="text-white ml-1">{getField('return_rate')}</span></div>
                            )}
                            {getField('engine_solution') && (
                              <div className="text-gray-400 col-span-2">Engine: <span className="text-white ml-1">{getField('engine_solution')}</span></div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Packaging */}
                      {(getField('package') || getField('packing') || getField('moq_customization')) && (
                        <div>
                          <h5 className="text-sm font-medium text-[#c70007] mb-2 flex items-center">
                            <span className="w-1.5 h-1.5 bg-[#c70007] rounded-full mr-2"></span>
                            Packaging
                          </h5>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {getField('package') && (
                              <div className="text-gray-400">Package: <span className="text-white ml-1">{getField('package')}</span></div>
                            )}
                            {getField('packing') && (
                              <div className="text-gray-400">Packing: <span className="text-white ml-1">{getField('packing')}</span></div>
                            )}
                            {getField('moq_customization') && (
                              <div className="text-gray-400 col-span-2">MOQ: <span className="text-white ml-1">{getField('moq_customization')}</span></div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Quantity and Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[#c70007]/20">
            <div className="flex items-center">
              <span className="text-sm text-gray-300 mr-3">Quantity:</span>
              <div className="flex items-center">
                <motion.button
                  className="w-8 h-8 flex items-center justify-center bg-[#1c1816] rounded-l-lg text-white hover:bg-[#c70007]/20 transition-colors"
                  onClick={() => updateQuantity(item.product_product_id, item.quantity - 1)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={item.quantity <= 1}
                >
                  <Minus className="w-3 h-3" />
                </motion.button>
                <div className="w-12 h-8 flex items-center justify-center bg-[#1c1816] text-white font-medium">
                  {item.quantity}
                </div>
                <motion.button
                  className="w-8 h-8 flex items-center justify-center bg-[#1c1816] rounded-r-lg text-white hover:bg-[#c70007]/20 transition-colors"
                  onClick={() => updateQuantity(item.product_product_id, item.quantity + 1)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-3 h-3" />
                </motion.button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-lg font-bold text-white">
                Total: ${((item.sale_price ? Number.parseFloat(item.sale_price) : Number.parseFloat(item.product_price) || 0) * item.quantity).toFixed(2)}
              </div>
              <motion.button
                onClick={() => removeFromCart(item.product_product_id)}
                className="p-2 rounded-full bg-[#1c1816] hover:bg-[#c70007]/20 text-[#c70007] hover:text-white transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {/* Quick Info Icons */}
          <div className="grid grid-cols-3 gap-3 pt-4">
            <div className="flex items-center gap-2 p-2 bg-gray-800/30 rounded-lg">
              <Truck className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-300">Free Shipping</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-800/30 rounded-lg">
              <RotateCcw className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-300">30-Day Returns</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-800/30 rounded-lg">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-300">1-Year Warranty</span>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {showImageModal && productImages.length > 0 && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowImageModal(false)}
          >
            <motion.div
              className="relative max-w-4xl max-h-[90vh] overflow-auto"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
                onClick={() => setShowImageModal(false)}
              >
                <X className="w-6 h-6" />
              </button>
              
              {productImages.length > 1 && (
                <>
                  <button
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
                    onClick={goToPreviousImage}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
                    onClick={goToNextImage}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm z-10">
                    {selectedImageIndex + 1} / {productImages.length}
                  </div>
                </>
              )}
              
              <img
                src={productImages[selectedImageIndex] || "/placeholder.svg"}
                alt={`${item.product_name} - Image ${selectedImageIndex + 1}`}
                className="w-full h-auto rounded-lg"
                onError={(e) => {
                  e.target.src = "/placeholder.svg";
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Video Modal */}
      <AnimatePresence>
        {showFullscreenVideo && item?.video_url && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFullscreenVideo(false)}
          >
            <motion.div
              className="relative w-full max-w-6xl aspect-video"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute -top-10 right-0 p-2 rounded-full hover:bg-white/20 text-white transition-colors z-10"
                onClick={() => setShowFullscreenVideo(false)}
              >
                <X className="w-8 h-8" />
              </button>
              
              <video
                controls
                autoPlay
                className="w-full h-full rounded-lg"
                style={{backgroundColor: '#0a0a0a'}}
              >
                <source src={item.video_url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}