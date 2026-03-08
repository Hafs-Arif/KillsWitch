"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiHome, FiInfo, FiTag, FiMail, FiHardDrive, FiShoppingBag,
  FiSearch, FiUser, FiChevronDown, FiLogIn, FiLogOut,
  FiMenu, FiX, FiShoppingCart, FiGrid, FiSettings,
  FiMinus, FiPlus, FiEdit, FiMapPin, FiPhone, FiMail as FiMailIcon
} from "react-icons/fi";
import { API, cartAPI } from "../../api/api";
import { notify } from "../../components/ModernNotification";
import { motion, AnimatePresence } from "framer-motion";
import { fetchAllProducts } from "../../api/api";
import logo from '/public/images/logo.png';
import Image from "next/image";

// Function to get cart items count from localStorage only (safer approach)
const getCartItemsCount = () => {
  if (typeof window !== 'undefined') {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    return cart.length;
  }
  return 0;
};

// Async function to get cart count with backend support (for future use)
const getCartItemsCountAsync = async () => {
  if (typeof window !== 'undefined') {
    // Always use localStorage for now to avoid authentication issues
    // TODO: Implement proper session-based authentication detection
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    return cart.length;
  }
  return 0;
};

// Synchronous version for immediate updates
const getLocalCartCount = () => {
  if (typeof window !== 'undefined') {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    return cart.length;
  }
  return 0;
};

// Account Settings Modal Component
const AccountSettingsModal = ({ isOpen, onClose, user, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  const [isLoading, setIsLoading] = useState(false);

  // when the modal opens we want to refresh data from the server
  useEffect(() => {
    if (isOpen) {
      API.auth.getProfile()
        .then(resp => {
          if (resp && resp.user) {
            setFormData({
              name: resp.user.name || '',
              email: resp.user.email || '',
              phone: resp.user.phoneno || ''
            });
          }
        })
        .catch(err => {
          console.warn('Failed to load profile for modal', err);
        });
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // API call to update user profile (name/email/phone only)
      const payload = { name: formData.name, email: formData.email, phone: formData.phone };
      const response = await API.auth.updateProfile(payload);
      if (response.success) {
        notify.success('Profile updated successfully');
        onUpdate(payload);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      notify.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#1c1816] border border-[#c70007]/30 rounded-lg shadow-xl z-50"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Account Settings</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Personal Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">Personal Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#c70007]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#c70007]"
                        required
                      />
                    </div>
                                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+1 234 567 8900"
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#c70007]"
                      />
                    </div>
                  </div>
                </div>


                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#c70007] hover:bg-[#a50005] transition-colors py-2 px-4 rounded-lg text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Updating...' : 'Save Changes'}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const Navbar = () => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [showCartPreview, setShowCartPreview] = useState(false);
  const [cartPreviewItems, setCartPreviewItems] = useState([]);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [user, setUser] = useState({
    name: "Guest",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    role: "",
    isLoggedIn: false,
  });

  // dropdown state for profile/name button
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef(null);
  
  const searchRef = useRef(null);
  const menuRef = useRef(null);
  const searchDebounceRef = useRef(null);

  // Navigation items
  const navItems = [
    { name: "Home", icon: <FiHome />, href: "/" },
    { name: "About", icon: <FiInfo />, href: "/AboutUs" },
    { name: "Products", icon: <FiTag />, href: "/products" },
    { name: "Components", icon: <FiHardDrive />, href: "/ITSectorPage" },
    { name: "Contact", icon: <FiMail />, href: "/ContactUs" },
    { name: "Orders", icon: <FiShoppingBag />, href: "/orders" },
  ];

  const serviceItems = [
    { name: "Admin Portal", href: "/Admin", adminOnly: true },
    { name: "Get Quote", href: "/GetAQuote" },
    { name: "Track Order", href: "/trackorder" },
  ];

  // helper: fetch authenticated or local cart count
  const updateCartCount = async () => {
    try {
      const profile = await API.auth.getProfile();
      if (profile && profile.user) {
        const result = await cartAPI.getCart();
        const count = result?.data?.items ? result.data.items.length : 0;
        setCartCount(count);
      } else {
        setCartCount(getLocalCartCount());
      }
    } catch (err) {
      console.warn('Cart count fetch failed, falling back to localStorage', err);
      setCartCount(getLocalCartCount());
    }
  };

  const updateCartCountSync = () => {
    const localCount = getLocalCartCount();
    setCartCount(localCount);
  };

  // Handle scroll for transparency effect and update cart count
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("storage", updateCartCountSync);
    window.addEventListener("focus", updateCartCount);
    updateCartCount();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("storage", updateCartCountSync);
      window.removeEventListener("focus", updateCartCount);
    };
  }, []);

  // Authentication check - using cookie-based session
  const setUserFromProfile = (profile) => {
    const fullNameFromUser = [profile.user?.firstName, profile.user?.lastName].filter(Boolean).join(" ");
    const fullNameFromRoot = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
    const emailValue = profile.user?.email || profile.email || "";
    const emailName = emailValue ? (emailValue.split("@")[0]) : "";
    const displayName = profile.user?.name
      || fullNameFromUser
      || profile.name
      || fullNameFromRoot
      || emailName
      || "Guest";

    setUser({
      name: displayName,
      email: emailValue,
      phone: profile.user?.phoneno || profile.phoneno || "",
      address: profile.address || profile.user?.address || "",
      city: profile.city || profile.user?.city || "",
      state: profile.state || profile.user?.state || "",
      zipCode: profile.zipCode || profile.user?.zipCode || "",
      role: profile.user?.role || profile.role || "",
      isLoggedIn: true,
    });

    // refresh cart count/preview for authenticated user
    updateCartCount();
    if (showCartPreview && typeof fetchCartPreview === 'function') {
      fetchCartPreview();
    }
  };

  const checkAuth = async () => {
    try {
      const profile = await API.auth.getProfile();
      if (profile) {
        setUserFromProfile(profile);
      }
    } catch (error) {
      // User not logged in or session expired
      setUser({
        name: "Guest",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        role: "",
        isLoggedIn: false,
      });
    }
  };

  useEffect(() => {
    checkAuth();
    
    // Listen for auth changes from other components; event may include profile data
    const handleAuthChange = (e) => {
      if (e?.detail) {
        setUserFromProfile(e.detail);
      } else {
        checkAuth();
      }
    };
    
    window.addEventListener('auth-changed', handleAuthChange);
    
    return () => {
      window.removeEventListener('auth-changed', handleAuthChange);
    };
  }, []);

  // Logout handler
  const handleLogout = async () => {
    try {
      await API.auth.logout();
      // Cookie-based session only; avoid token localStorage
      setUser({ 
        name: "Guest", 
        email: "", 
        phone: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        role: "", 
        isLoggedIn: false 
      });
      notify.success("Logged out successfully");
      setCartCount(0);
      setCartPreviewItems([]);
      // broadcast change so other parts can reset if needed
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-changed'));
      }
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      notify.error("Error logging out");
    }
    setIsMenuOpen(false);
  };

  // Handle user/admin navigation
  const handleUserNavigation = () => {
    if (user.role === 'admin') {
      router.push('/Admin');
    } else {
      router.push('/orders');
    }
    setIsMenuOpen(false);
  };

  // Handle profile update from modal
  const handleProfileUpdate = (updatedData) => {
    setUser(prev => ({
      ...prev,
      ...updatedData
    }));
  };

  // Cart preview helpers
  const fetchCartPreview = async () => {
    try {
      const profile = await API.auth.getProfile();
      if (profile && profile.user) {
        const result = await cartAPI.getCart();
        if (result.success && result.data.items) {
          setCartPreviewItems(result.data.items);
        } else {
          setCartPreviewItems([]);
        }
      } else {
        // guest localstorage
        const local = JSON.parse(localStorage.getItem('cart') || '[]');
        setCartPreviewItems(local);
      }
    } catch (err) {
      console.warn('Failed to load cart preview', err);
      const local = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartPreviewItems(local);
    }
  };

  const changePreviewQuantity = async (item, delta) => {
    const newQty = (item.quantity || 1) + delta;
    if (newQty < 1) return;
    if (item.id && item.cartId) {
      // backend item
      try {
        await cartAPI.updateCartItem(item.id, { quantity: newQty });
        await fetchCartPreview();
        updateCartCount();
      } catch (err) {
        console.error('Error updating preview quantity', err);
      }
    } else {
      // guest localstorage
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const idx = cart.findIndex(ci => (ci.product_product_id || ci.product_id || ci.id) === (item.product_product_id || item.product_id || item.id));
      if (idx >= 0) {
        cart[idx].quantity = newQty;
        localStorage.setItem('cart', JSON.stringify(cart));
        setCartPreviewItems(cart);
        updateCartCount();
      }
    }
  };

  // simplified: navigate to cart page instead of toggling preview
  const goToCart = () => {
    router.push('/cart');
  };

  // Search functionality
  const searchProducts = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    try {
      const products = await fetchAllProducts();
      const normalizedQuery = query.toLowerCase().trim();

      const matches = products.filter((product) => {
        const brand = product.brand_brand_name?.toLowerCase() || "";
        const partNumber = product.product_part_number?.toLowerCase() || "";
        const productName = product.product_name?.toLowerCase() || "";
        return brand.includes(normalizedQuery) || 
               partNumber.includes(normalizedQuery) || 
               productName.includes(normalizedQuery);
      });

      const suggestions = matches.slice(0, 5).map(product => ({
        type: "product",
        value: product.product_part_number || product.product_name,
        brand: product.brand_brand_name,
        id: product.product_product_id,
      }));

      setSearchSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
      setIsMenuOpen(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    router.push(`/products?brandName=${encodeURIComponent(suggestion.brand)}&partNumber=${encodeURIComponent(suggestion.value)}`);
    setSearchQuery(suggestion.value);
    setShowSuggestions(false);
    setIsMenuOpen(false);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
      // cart preview removed — clicks outside no longer need to close it
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Main Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-black/80 backdrop-blur-md border-b border-[#c70007]/30' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <Image
                src={logo}
                alt="Logo"
                width={50}
                height={50}
                className="border border-[#c70007] rounded-lg hover:scale-105 transition-transform duration-300"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-white hover:text-[#c70007] transition-colors duration-200 font-medium"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Desktop Search */}
            <div className="hidden md:block relative" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="relative">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSearchQuery(val);
                      if (searchDebounceRef.current) {
                        clearTimeout(searchDebounceRef.current);
                      }
                      searchDebounceRef.current = setTimeout(() => {
                        searchProducts(val);
                      }, 300);
                    }}
                    onFocus={() => searchQuery.trim().length >= 2 && setShowSuggestions(true)}
                    className="w-64 px-4 py-2 pl-10 bg-gray-900/80 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c70007] focus:border-transparent"
                  />
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                </div>
              </form>

              {/* Search Suggestions */}
              <AnimatePresence>
                {showSuggestions && searchSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 border border-gray-700 rounded-lg shadow-xl backdrop-blur-sm"
                  >
                    {searchSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left px-4 py-3 text-white hover:bg-[#c70007]/20 transition-colors border-b border-gray-700 last:border-b-0"
                      >
                        <div className="font-medium">{suggestion.value}</div>
                        <div className="text-sm text-gray-400">{suggestion.brand}</div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Desktop User Menu */}
            <div className="hidden lg:flex items-center space-x-6">
              {/* Cart Icon with Counter and preview dropdown */}
              <div className="relative">
                <button
                  onClick={() => router.push('/cart')}
                  className="relative"
                >
                  <FiShoppingCart className="h-6 w-6 text-white hover:text-[#c70007] transition-colors" />
                  {cartCount > 0 && (
                    <div className="absolute -top-2 -right-2 bg-[#c70007] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold group-hover:scale-110 transition-transform">
                      {cartCount}
                    </div>
                  )}
                </button>
                {/* cart preview removed — clicking routes to /cart */}
              </div>

              {/* User Menu */}
              {user.isLoggedIn ? (
                <div ref={profileRef} className="relative">
                  <button
                    onClick={() => setProfileMenuOpen((p) => !p)}
                    className="flex items-center space-x-2 hover:bg-white/5 px-3 py-2 rounded-lg transition-colors"
                  >
                    <div
                      className="w-8 h-8 bg-gradient-to-r from-[#c70007] to-[#a50005] rounded-full flex items-center justify-center text-white font-semibold text-sm"
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white font-medium">{user.name}</span>
                    <FiChevronDown className={`text-white w-4 h-4 transition-transform duration-200 ${profileMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {profileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-3 w-56 bg-[#1c1816] border border-[#c70007]/30 rounded-lg shadow-lg z-20 overflow-hidden"
                      >
                        {/* User Info Header */}
                        <div className="px-4 py-3 bg-gradient-to-r from-[#c70007]/20 to-transparent border-b border-gray-800">
                          <p className="text-white font-medium truncate">{user.name}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                          <button
                            onClick={() => {
                              setProfileMenuOpen(false);
                              setShowAccountModal(true);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#c70007]/20 transition-colors flex items-center space-x-2"
                          >
                            <FiEdit className="h-4 w-4" />
                            <span>Account Settings</span>
                          </button>

                          {user.role === 'admin' && (
                            <button
                              onClick={() => {
                                handleUserNavigation();
                                setProfileMenuOpen(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#c70007]/20 transition-colors flex items-center space-x-2"
                            >
                              <FiSettings className="h-4 w-4" />
                              <span>Dashboard</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              handleLogout();
                              setProfileMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#c70007]/20 transition-colors flex items-center space-x-2 border-t border-gray-800 mt-2"
                          >
                            <FiLogOut className="h-4 w-4" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center space-x-1 text-white hover:text-[#c70007] transition-colors"
                >
                  <FiLogIn className="h-4 w-4" />
                  <span>Login</span>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-white hover:text-[#c70007] transition-colors"
            >
              {isMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Mobile Menu Panel */}
            <motion.div
              ref={menuRef}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 right-0 h-full w-80 bg-black/95 backdrop-blur-lg border-l border-[#c70007]/30 z-50 lg:hidden"
            >
              <div className="flex flex-col h-full">
                {/* Mobile Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                  <h2 className="text-xl font-bold text-white">Menu</h2>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 text-gray-400 hover:text-[#c70007] transition-colors"
                  >
                    <FiX className="h-6 w-6" />
                  </button>
                </div>

                {/* Mobile Search */}
                <div className="p-4 border-b border-gray-800">
                  <form onSubmit={handleSearchSubmit} className="relative">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSearchQuery(val);
                          if (searchDebounceRef.current) {
                            clearTimeout(searchDebounceRef.current);
                          }
                          searchDebounceRef.current = setTimeout(() => {
                            searchProducts(val);
                          }, 300);
                        }}
                        className="w-full px-4 py-3 pl-10 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c70007]"
                      />
                      <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    </div>
                  </form>
                </div>

                {/* Navigation Items */}
                <div className="flex-1 overflow-y-auto py-4">
                  <div className="space-y-1 px-4">
                    {navItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center space-x-3 text-white hover:text-[#c70007] hover:bg-[#c70007]/10 transition-all duration-200 py-3 px-4 rounded-lg"
                      >
                        {item.icon}
                        <span>{item.name}</span>
                      </Link>
                    ))}

                    {/* Services Section */}
                    <div className="pt-4 mt-4 border-t border-gray-800">
                      <h3 className="text-gray-400 font-semibold text-sm uppercase tracking-wider px-4 mb-3">
                        Services
                      </h3>
                      {serviceItems
                        .filter(item => !item.adminOnly || user.role === "admin")
                        .map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center text-white hover:text-[#c70007] hover:bg-[#c70007]/10 transition-all duration-200 py-3 px-4 rounded-lg"
                          >
                            <FiGrid className="mr-3 h-4 w-4" />
                            {item.name}
                          </Link>
                        ))}
                    </div>
                  </div>
                </div>

                {/* User Section */}
                <div className="p-4 border-t border-gray-800">
                  {/* Cart Link */}
                  <Link
                    href="/cart"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 text-white hover:text-[#c70007] hover:bg-[#c70007]/10 transition-all duration-200 py-3 px-4 rounded-lg relative"
                  >
                    <FiShoppingCart className="h-5 w-5" />
                    <span>Cart</span>
                    {cartCount > 0 && (
                      <div className="absolute left-6 top-1 bg-[#c70007] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                        {cartCount}
                      </div>
                    )}
                  </Link>

                  {/* User Info/Login/Logout */}
                  {user.isLoggedIn ? (
                    <div className="space-y-3 mt-3">
                      <div className="p-3 bg-gray-900/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-[#c70007] to-[#a50005] rounded-full flex items-center justify-center text-white font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-medium truncate">{user.name}</div>
                            <div className="text-gray-400 text-xs truncate">{user.email}</div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => { 
                          setShowAccountModal(true); 
                          setIsMenuOpen(false); 
                        }}
                        className="w-full flex items-center justify-center space-x-2 bg-gray-800 hover:bg-gray-700 transition-colors py-2 px-4 rounded-lg text-white"
                      >
                        <FiEdit className="h-4 w-4" />
                        <span>Account Settings</span>
                      </button>

                      {user.role === 'admin' && (
                        <button
                          onClick={() => { 
                            handleUserNavigation(); 
                            setIsMenuOpen(false); 
                          }}
                          className="w-full flex items-center justify-center space-x-2 bg-gray-800 hover:bg-gray-700 transition-colors py-2 px-4 rounded-lg text-white"
                        >
                          <FiSettings className="h-4 w-4" />
                          <span>Dashboard</span>
                        </button>
                      )}

                      <button
                        onClick={() => { 
                          handleLogout(); 
                          setIsMenuOpen(false); 
                        }}
                        className="w-full flex items-center justify-center space-x-2 bg-[#c70007] hover:bg-[#a50005] transition-colors py-2 px-4 rounded-lg text-white"
                      >
                        <FiLogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full flex items-center justify-center space-x-2 bg-[#c70007] hover:bg-[#a50005] transition-colors py-2 px-4 rounded-lg text-white"
                    >
                      <FiLogIn className="h-4 w-4" />
                      <span>Login</span>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Account Settings Modal */}
      <AccountSettingsModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        user={user}
        onUpdate={handleProfileUpdate}
      />

      {/* Spacer */}
      <div className="h-16" />
    </>
  );
};

export default Navbar;