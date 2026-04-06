"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Elements } from "@stripe/react-stripe-js";
import getStripe from "../utils/stripe";
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CreditCard,
  ShieldCheck,
  Check,
  X,
  MapPin,
  Building,
  Truck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  ShoppingCart,
  Package,
  Star,
  Banknote,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../component/HomeComponents/Navbar";
import Footer from "../component/HomeComponents/Footer";
import { notify, ModernNotificationContainer } from "../components/ModernNotification";
import StripeCheckoutForm from "../components/StripeCheckoutForm";
import { API, BASE_URL, cartAPI } from "../api/api";

// Address Form Popup Component (Updated - Fixed address selection)
const AddressFormPopup = ({
  isOpen,
  onClose,
  addressType,
  formData,
  setFormData,
  setSameShippingBilling,
  sameShippingBilling,
  savedAddresses = [],
  onAddNewClick,
}) => {
  if (!isOpen) return null;

  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // Filter saved addresses by type (shipping/billing)
  const relevantAddresses = savedAddresses.filter(addr => 
    addressType === "shipping" ? addr.type === "shipping" : addr.type === "billing"
  );

  const handleSelectSavedAddress = (address) => {
    setSelectedAddressId(address.id);
    
    const newFormData = { ...formData };
    
    // Map the address fields correctly to form fields
    // Backend address object has fields like: name, company, phone, address, city, state, country
    // Form expects: shippingName, shippingCompany, etc.
    
    // Update form data with selected address
    newFormData[`${addressType}Name`] = address.name || "";
    newFormData[`${addressType}Company`] = address.company || "";
    newFormData[`${addressType}Phone`] = address.phone || "";
    newFormData[`${addressType}Address`] = address.address || "";
    newFormData[`${addressType}City`] = address.city || "";
    newFormData[`${addressType}State`] = address.state || "";
    newFormData[`${addressType}Country`] = address.country || "";
    
    // Also update email if present
    if (address.email) {
      newFormData.email = address.email;
    }
    
    // If it's shipping address and same shipping billing is checked, also update billing
    if (addressType === "shipping" && sameShippingBilling) {
      newFormData.billingName = address.name || "";
      newFormData.billingCompany = address.company || "";
      newFormData.billingPhone = address.phone || "";
      newFormData.billingAddress = address.address || "";
      newFormData.billingCity = address.city || "";
      newFormData.billingState = address.state || "";
      newFormData.billingCountry = address.country || "";
    }
    
    setFormData(newFormData);
    
    // Show success notification
    notify.success(`${addressType === "shipping" ? "Shipping" : "Billing"} address selected`);
    
    // Close the popup
    setTimeout(() => {
      onClose();
    }, 500);
  };

  // Check if an address is selected in the form data
  const isAddressSelected = (address) => {
    const formAddressField = `${addressType}Address`;
    const formCityField = `${addressType}City`;
    const formStateField = `${addressType}State`;
    const formCountryField = `${addressType}Country`;
    
    return (
      formData[formAddressField] === address.address &&
      formData[formCityField] === address.city &&
      formData[formStateField] === address.state &&
      formData[formCountryField] === address.country
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        className="bg-[#1c1816] border border-[#c70007]/30 p-6 rounded-xl shadow-lg w-full max-w-md"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold bg-gradient-to-r from-white to-[#c70007] bg-clip-text text-transparent flex items-center">
            {addressType === "shipping" ? (
              <Truck className="w-5 h-5 mr-2 text-[#c70007]" />
            ) : (
              <MapPin className="w-5 h-5 mr-2 text-[#c70007]" />
            )}
            Select {addressType === "shipping" ? "Shipping" : "Billing"} Address
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Saved Addresses Section */}
        {relevantAddresses.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-[#c70007]">Saved Addresses</p>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {relevantAddresses.map((address) => {
                const isSelected = isAddressSelected(address);
                
                return (
                  <motion.div
                    key={address.id}
                    onClick={() => handleSelectSavedAddress(address)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-[#c70007] bg-[#c70007]/20"
                        : "border-[#c70007]/20 hover:border-[#c70007]/50 hover:bg-[#c70007]/5"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-white font-medium flex items-center">
                          <User className="w-4 h-4 mr-2 text-[#c70007]" />
                          {address.name}
                        </p>
                        {address.company && (
                          <p className="text-sm text-gray-400 ml-6">{address.company}</p>
                        )}
                        <p className="text-sm text-gray-300 mt-1 ml-6">{address.address}</p>
                        <p className="text-sm text-gray-300 ml-6">
                          {address.city}, {address.state}, {address.country}
                        </p>
                        {address.phone && (
                          <p className="text-sm text-gray-400 mt-1 ml-6 flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {address.phone}
                          </p>
                        )}
                        {address.email && (
                          <p className="text-sm text-gray-400 mt-1 ml-6 flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {address.email}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <div className="bg-[#c70007] rounded-full p-1">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No saved addresses found</p>
            <p className="text-sm mt-2">Click below to add a new address</p>
          </div>
        )}

        {/* Add New Address Button */}
        <div className="mt-6">
          <motion.button
            type="button"
            onClick={() => {
              onClose();
              if (onAddNewClick) {
                onAddNewClick(addressType);
              }
            }}
            className="w-full py-3 bg-gradient-to-r from-[#c70007] to-[#c70007]/70 text-white rounded-lg hover:from-[#e60008] hover:to-[#e60008]/70 transition-all shadow-lg shadow-[#c70007]/20 flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-5 h-5" />
            Add New {addressType === "shipping" ? "Shipping" : "Billing"} Address
          </motion.button>
        </div>

        {addressType === "shipping" && (
          <div className="flex items-center mt-4 p-3 bg-[#c70007]/20 rounded-lg">
            <input
              type="checkbox"
              id="same-as-shipping-popup"
              checked={sameShippingBilling}
              onChange={(e) => setSameShippingBilling(e.target.checked)}
              className="mr-2 h-4 w-4 accent-[#c70007]"
            />
            <label htmlFor="same-as-shipping-popup" className="text-white text-sm">
              My billing address is the same as my shipping address
            </label>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <motion.button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-all"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Cancel
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

// New Address Form Modal Component
const NewAddressFormModal = ({
  isOpen,
  onClose,
  addressType,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    email: "",
  });

  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Save to database
      const savedAddress = await API.addresses.saveAddress({
        type: addressType,
        ...formData,
      });
      
      // Call onSave with the new address
      onSave(addressType, formData);
      
      // Show success message
      notify.success(`${addressType === "shipping" ? "Shipping" : "Billing"} address saved successfully`);
      
      // Close the modal
      onClose();
      
      // Reset form
      setFormData({
        name: "",
        company: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        country: "",
        email: "",
      });
      
    } catch (error) {
      console.error('Error saving address:', error);
      notify.error('Failed to save address. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60]">
      <motion.div
        className="bg-[#1c1816] border border-[#c70007]/30 p-6 rounded-xl shadow-lg w-full max-w-md"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold bg-gradient-to-r from-white to-[#c70007] bg-clip-text text-transparent flex items-center">
            {addressType === "shipping" ? (
              <Truck className="w-5 h-5 mr-2 text-[#c70007]" />
            ) : (
              <MapPin className="w-5 h-5 mr-2 text-[#c70007]" />
            )}
            Add New {addressType === "shipping" ? "Shipping" : "Billing"} Address
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-[#c70007]" />
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Full Name *"
                className="bg-[#1c1816] border border-[#c70007]/30 p-3 pl-10 w-full rounded-lg text-white focus:border-[#c70007] focus:ring-1 focus:ring-[#c70007] transition-all"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building className="h-5 w-5 text-[#c70007]" />
              </div>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                placeholder="Company (Optional)"
                className="bg-[#1c1816] border border-[#c70007]/30 p-3 pl-10 w-full rounded-lg text-white focus:border-[#c70007] focus:ring-1 focus:ring-[#c70007] transition-all"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-[#c70007]" />
              </div>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Phone Number *"
                className="bg-[#1c1816] border border-[#c70007]/30 p-3 pl-10 w-full rounded-lg text-white focus:border-[#c70007] focus:ring-1 focus:ring-[#c70007] transition-all"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-[#c70007]" />
              </div>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Address *"
                className="bg-[#1c1816] border border-[#c70007]/30 p-3 pl-10 w-full rounded-lg text-white focus:border-[#c70007] focus:ring-1 focus:ring-[#c70007] transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="City *"
                  className="bg-[#1c1816] border border-[#c70007]/30 p-3 w-full rounded-lg text-white focus:border-[#c70007] focus:ring-1 focus:ring-[#c70007] transition-all"
                  required
                />
              </div>
              <div className="relative">
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="State/Province *"
                  className="bg-[#1c1816] border border-[#c70007]/30 p-3 w-full rounded-lg text-white focus:border-[#c70007] focus:ring-1 focus:ring-[#c70007] transition-all"
                  required
                />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Globe className="h-5 w-5 text-[#c70007]" />
              </div>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                placeholder="Country *"
                className="bg-[#1c1816] border border-[#c70007]/30 p-3 pl-10 w-full rounded-lg text-white focus:border-[#c70007] focus:ring-1 focus:ring-[#c70007] transition-all"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-[#c70007]" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email Address *"
                className="bg-[#1c1816] border border-[#c70007]/30 p-3 pl-10 w-full rounded-lg text-white focus:border-[#c70007] focus:ring-1 focus:ring-[#c70007] transition-all"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
            <motion.button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-all"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              disabled={saving}
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              className="px-5 py-2.5 bg-[#c70007] text-white rounded-lg hover:bg-[#e60008] transition-all shadow-lg shadow-[#c70007]/20 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: saving ? 1 : 1.03 }}
              whileTap={{ scale: saving ? 1 : 0.97 }}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Address"}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Password validation component
const PasswordValidation = ({ password }) => {
  const validations = [
    {
      id: "min-length",
      label: "Minimum 8 characters",
      isValid: password.length >= 8,
    },
    {
      id: "max-length",
      label: "Maximum 12 characters",
      isValid: password.length <= 12,
    },
    {
      id: "special-char",
      label: "At least one special character",
      isValid: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/.test(password),
    },
  ];

  return (
    <div className="mt-2 space-y-1.5">
      {validations.map((validation) => (
        <div key={validation.id} className="flex items-center">
          {validation.isValid ? (
            <Check className="w-4 h-4 text-green-400 mr-2" />
          ) : (
            <X className="w-4 h-4 text-[#c70007] mr-2" />
          )}
          <span
            className={`text-xs ${
              validation.isValid ? "text-green-400" : "text-gray-400"
            }`}
          >
            {validation.label}
          </span>
        </div>
      ))}
    </div>
  );
};

// Stripe Elements Options
const stripeOptions = {
  mode: "payment",
  amount: 1000, // Will be updated dynamically
  currency: "usd",
  appearance: {
  theme: "night",
  variables: {
  colorPrimary: "#c70007",
  colorBackground: "#1c1816",
  colorText: "#ffffff",
  colorDanger: "#ef4444",
  fontFamily: "Inter, system-ui, sans-serif",
  spacingUnit: "4px",
  borderRadius: "8px",
  },
  },
  };

// Custom Globe icon (not imported)
const Globe = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
  );
};

export default function PaymentPage() {
  const router = useRouter();
  const [createAccount, setCreateAccount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);

  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);

  // Add state for new address modal
  const [newAddressModal, setNewAddressModal] = useState({
    isOpen: false,
    type: 'shipping'
  });

  // Consolidated state object for address management
  const [addressState, setAddressState] = useState({
    shippingAddressPopup: false,
    billingAddressPopup: false,
    sameShippingBilling: false,
    hasShippingAddress: false,
    hasBillingAddress: false,
    shippingAddressChecked: false,
    billingAddressChecked: false,
  });

  const [isVisible, setIsVisible] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [activeSection, setActiveSection] = useState("account");
  const [expandedItem, setExpandedItem] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [sameShippingBillingPreference, setSameShippingBillingPreference] = useState(false);

  // Initialize form data state
  const [formData, setFormData] = useState(() => {
    const defaultData = {
      email: "",
      password: "",
      phoneNumber: "",
      name: "", // <-- backend expects "name"
      amount: "0.00",
      payment_name: "",
      payment_method: "card", // Add payment method selection
      cardNumber: "",
      cardExpiry: "",
      cardCVC: "",
      shippingName: "",
      shippingCompany: "",
      shippingPhone: "",
      shippingAddress: "",
      shippingCity: "",
      shippingState: "",
      shippingCountry: "",
      billingName: "",
      billingCompany: "",
      billingPhone: "",
      billingAddress: "",
      billingCity: "",
      billingState: "",
      billingCountry: "",
      orderDetails: {
        isFullCart: false,
        items: [],
        subtotal: "0.00",
        shipping: "0.00",
        tax: "0.00",
        discount: "0.00",
        couponCode: "",
        total: "0.00",
      },
    };
    return defaultData;
  });

  // Function to save shipping/billing preference to backend
  const saveSameShippingBillingPreference = async (preference) => {
    if (!isLoggedIn || !profile) return;
    try {
      await API.auth.updateProfile({
        sameShippingBillingDefault: preference,
      });
    } catch (error) {
      console.error('Error saving preference:', error);
    }
  };

  // Initialize Stripe and check if user is logged in
  useEffect(() => {
    setStripePromise(getStripe());

    if (typeof window !== "undefined") {
      // Check authentication using cookie-based session
      API.auth.getProfile()
        .then((result) => {
          setIsLoggedIn(true);
          setProfile(result.user);
          // Set initial same shipping billing preference from profile
          setAddressState((prev) => ({
            ...prev,
            sameShippingBilling: result.user?.sameShippingBillingDefault || false,
          }));
          setActiveSection("shipping");
        })
        .catch(() => {
          setIsLoggedIn(false);
          setProfile(null);
        });
    }
  }, [router]);

  // Load checkout data from localStorage
  useEffect(() => {
    const loadCheckoutData = () => {
      try {
        const data = localStorage.getItem("checkoutData");
        if (data) {
          const parsedData = JSON.parse(data);
          setCheckoutData(parsedData);
        }
      } catch (error) {
        console.error("Error loading checkout data:", error);
      }
    };

    if (typeof window !== "undefined") {
      loadCheckoutData();
    }
  }, []);

  // Fetch user addresses when logged in
  useEffect(() => {
    if (isLoggedIn) {
      const fetchAddresses = async () => {
        try {
          const result = await API.addresses.getAddresses();
          if (result && result.addresses) {
            setSavedAddresses(result.addresses);
            
            // Check if user has saved addresses
            const hasShipping = result.addresses.some(addr => addr.type === "shipping");
            const hasBilling = result.addresses.some(addr => addr.type === "billing");
            
            setAddressState(prev => ({
              ...prev,
              hasShippingAddress: hasShipping,
              hasBillingAddress: hasBilling
            }));
          }
        } catch (error) {
          console.error('Error fetching addresses:', error);
        }
      };
      fetchAddresses();
    }
  }, [isLoggedIn]);

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

  // Update form data when checkout data changes
  useEffect(() => {
    if (checkoutData) {
      const items = checkoutData.items.map((item) => {
        const regularPrice = Number.parseFloat(item.product_price) || 0;
        const salePrice = item.sale_price ? Number.parseFloat(item.sale_price) : null;
        const effectivePrice = salePrice && salePrice > 0 ? salePrice : regularPrice;
        return {
          id: item.product_product_id,
          name: item.product_name || item.product_part_number,
          price: regularPrice,
          sale_price: salePrice,
          effective_price: effectivePrice,
          quantity: item.quantity || 1,
          image: item.product_image || "/placeholder.svg?height=100&width=100",
          condition: item.product_condition || "N/A",
          sub_condition: item.product_sub_condition || "N/A",
        };
      });

      // Calculate subtotal using effective (sale) prices
      const subtotal = items.reduce((sum, item) => sum + (item.effective_price * item.quantity), 0);
      const shipping = 0;
      const taxRate = 0.2;
      const tax = subtotal * taxRate;
      const total = subtotal + shipping + tax;

      setFormData((prev) => ({
        ...prev,
        amount: total.toFixed(2),
        orderDetails: {
          isFullCart: checkoutData.checkoutType === "full",
          items,
          subtotal: subtotal.toFixed(2),
          shipping: shipping.toFixed(2),
          tax: tax.toFixed(2),
          discount: (0).toFixed(2),
          couponCode: "",
          total: total.toFixed(2),
        },
      }));
    }
  }, [checkoutData]);

  // Update billing address when shipping address changes and sameShippingBilling is true
  useEffect(() => {
    if (addressState.sameShippingBilling && addressState.hasShippingAddress) {
      const newFormData = { ...formData };

      // Copy shipping fields to billing fields
      newFormData.billingName = formData.shippingName;
      newFormData.billingCompany = formData.shippingCompany;
      newFormData.billingPhone = formData.shippingPhone;
      newFormData.billingAddress = formData.shippingAddress;
      newFormData.billingCity = formData.shippingCity;
      newFormData.billingState = formData.shippingState;
      newFormData.billingCountry = formData.shippingCountry;

      setFormData(newFormData);
      setAddressState((prev) => ({
        ...prev,
        hasBillingAddress: true,
      }));
    }
  }, [addressState.sameShippingBilling, addressState.hasShippingAddress]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "cardExpiry") {
      if (value.length === 2 && formData.cardExpiry.length === 1) {
        setFormData({
          ...formData,
          [name]: value + "/",
        });
        return;
      }
    }

    if (name === "cardNumber") {
      const numericValue = value.replace(/\D/g, "");
      if (numericValue.length <= 16) {
        setFormData({
          ...formData,
          [name]: numericValue,
        });
      }
      return;
    }

    if (name === "cardCVC") {
      const numericValue = value.replace(/\D/g, "");
      if (numericValue.length <= 3) {
        setFormData({
          ...formData,
          [name]: numericValue,
        });
      }
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const removeCartItem = async (itemId, itemName) => {
    const updatedItems = formData.orderDetails.items.filter(
      (item) => item.id !== itemId
    );

    const taxRate = 0.2;
    const newSubtotal = updatedItems.reduce(
      (total, item) => total + (item.effective_price || item.price) * (item.quantity || 1),
      0
    );
    const shipping = 0;

    let discountAmt = 0;
    if (formData.orderDetails.couponCode) {
      try {
        const res = await fetch(
          `${BASE_URL}/coupons/validate?code=${formData.orderDetails.couponCode}&subtotal=${newSubtotal}`,
          { credentials: 'include' }
        );
        const data = await res.json();
        if (data.success && data.valid) {
          discountAmt = data.discount || 0;
        } else {
          // coupon became invalid, clear it
          setCouponApplied(false);
          setCouponCode('');
        }
      } catch (err) {
        console.error('Error revalidating coupon:', err);
      }
    }

    const newTax = +(Math.max(0, newSubtotal - discountAmt) * taxRate).toFixed(
      2
    );
    const newTotal = +(newSubtotal - discountAmt + shipping + newTax).toFixed(
      2
    );

    const updatedFormData = {
      ...formData,
      orderDetails: {
        ...formData.orderDetails,
        items: updatedItems,
        subtotal: newSubtotal.toFixed(2),
        discount: discountAmt.toFixed(2),
        tax: newTax.toFixed(2),
        total: newTotal.toFixed(2),
      },
    };

    setFormData(updatedFormData);
    notify.success(`${itemName} removed from cart`);
  };

  // Update item quantity
  const updateItemQuantity = async (itemId, action) => {
    const updatedItems = formData.orderDetails.items.map((item) => {
      if (item.id === itemId) {
        const newQuantity =
          action === "increase"
            ? (item.quantity || 1) + 1
            : Math.max(1, (item.quantity || 1) - 1);

        return {
          ...item,
          quantity: newQuantity,
        };
      }
      return item;
    });

    const taxRate = 0.2;
    const shipping = 0;
    const newSubtotal = updatedItems.reduce(
      (t, it) => t + (it.effective_price || it.price) * (it.quantity || 1),
      0
    );

    let discountAmt = 0;
    if (formData.orderDetails.couponCode) {
      try {
        const res = await fetch(
          `${BASE_URL}/coupons/validate?code=${formData.orderDetails.couponCode}&subtotal=${newSubtotal}`,
          { credentials: 'include' }
        );
        const data = await res.json();
        if (data.success && data.valid) {
          discountAmt = data.discount || 0;
        } else {
          setCouponApplied(false);
          setCouponCode('');
        }
      } catch (err) {
        console.error('Error revalidating coupon:', err);
      }
    }

    const newTax = +(Math.max(0, newSubtotal - discountAmt) * taxRate).toFixed(
      2
    );
    const newTotal = +(newSubtotal - discountAmt + shipping + newTax).toFixed(
      2
    );

    const updatedFormData = {
      ...formData,
      orderDetails: {
        ...formData.orderDetails,
        items: updatedItems,
        subtotal: newSubtotal.toFixed(2),
        discount: discountAmt.toFixed(2),
        tax: newTax.toFixed(2),
        total: newTotal.toFixed(2),
      },
    };

    setFormData(updatedFormData);

    const updatedItem = updatedItems.find((item) => item.id === itemId);
    if (action === "increase") {
      notify.info(
        `Increased ${updatedItem.name} quantity to ${updatedItem.quantity}`
      );
    } else {
      notify.info(
        `Decreased ${updatedItem.name} quantity to ${updatedItem.quantity}`
      );
    }
  };

  // Calculate order total for display
  const subtotal = Number.parseFloat(formData.orderDetails.subtotal) || 0;
  const shipping = Number.parseFloat(formData.orderDetails.shipping) || 0;
  const tax = Number.parseFloat(formData.orderDetails.tax) || 0;
  const discount = Number.parseFloat(formData.orderDetails.discount) || 0;
  const orderTotal = subtotal + shipping + tax - discount;
  const formattedOrderTotal = `${orderTotal.toFixed(2)}`;

  // Toggle item expansion in order summary
  const toggleItemExpansion = (itemId) => {
    if (expandedItem === itemId) {
      setExpandedItem(null);
    } else {
      setExpandedItem(itemId);
    }
  };

  // Handle COD order processing
  const handleCODOrder = async () => {
    try {
      setLoading(true);
      
      // Validate required fields
      if (!formData.shippingName || !formData.shippingAddress || !formData.shippingPhone) {
        notify.error("Please complete shipping information first");
        setActiveSection("shipping");
        return;
      }
      
      if (!formData.billingName || !formData.billingAddress || !formData.billingPhone) {
        notify.error("Please complete billing information first");
        setActiveSection("shipping");
        return;
      }
      
      // Check order total limit for COD
      const total = parseFloat(formattedOrderTotal);
      if (total > 2000) {
        notify.error("COD orders are limited to $2,000 maximum. Please use card payment for larger orders.");
        return;
      }
      
      // Prepare order data for COD
      const orderData = {
        ...formData,
        payment_method: "cod",
        cardNumber: "",
        cardExpiry: "",
        cardCVC: "",
        payment_name: "Cash on Delivery",
        name: formData.name || formData.shippingName || formData.billingName || "Customer"
      };
      
      
      // Submit order to backend
      const response = await fetch(`${BASE_URL}/orders/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("COD Order Error Response:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          console.error("Failed to parse error response as JSON:", e);
        }
        
        if (errorData.error && errorData.error.includes('Not enough stock')) {
          const stockMessage = errorData.message || `Insufficient stock for one or more items in your order.`;
          throw new Error(stockMessage);
        }
        
        throw new Error(errorData.message || errorData.error || errorText || `Failed to place COD order (${response.status})`);
      }
      
      const result = await response.json();
      
      // Store order confirmation data
      const orderConfirmationData = {
        orderId: result.orderId,
        trackingNumber: result.trackingNumber,
        email: result.email,
        phoneNumber: result.phoneNumber,
        name: result.Name || result.name,
        amount: result.amount,
        paymentMethod: "Cash on Delivery (COD)",
        orderStatus: "COD_PENDING",
        shippingName: result.shippingDetails?.shippingName || formData.shippingName,
        shippingPhone: result.shippingDetails?.shippingPhone || formData.shippingPhone,
        shippingAddress: result.shippingDetails?.shippingAddress || formData.shippingAddress,
        shippingCity: result.shippingDetails?.shippingCity || formData.shippingCity,
        shippingState: result.shippingDetails?.shippingState || formData.shippingState,
        shippingCountry: result.shippingDetails?.shippingCountry || formData.shippingCountry,
        shippingDetails: result.shippingDetails,
        billingDetails: result.billingDetails,
        orderDetails: result.orderDetails,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('orderConfirmation', JSON.stringify(orderConfirmationData));
      
      // Clear checkout data
      localStorage.removeItem("checkoutData");
      
      // Clear cart
      try {
        try {
          await cartAPI.clearCart();
        } catch (err) {
          console.warn('⚠️ Error clearing cart from database:', err);
        }
        
        localStorage.removeItem('cart');
        localStorage.removeItem('checkoutData');
        
        sessionStorage.clear();
        
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('storage'));
        }
      } catch (error) {
        console.error('⚠️ Error clearing cart:', error);
      }
      
      notify.success("COD order placed successfully! You will pay when the order is delivered.");
      
      setTimeout(() => {
        router.push("/order-confirmation");
      }, 2000);
      
    } catch (error) {
      console.error("COD order error:", error);
      
      if (error.message.includes('stock') || error.message.includes('Stock')) {
        notify.error(`${error.message} - Please check product availability and try again.`);
      } else if (error.message.includes('shipping') || error.message.includes('billing')) {
        notify.error(`${error.message} - Please complete all required information.`);
      } else {
        notify.error(error.message || "Failed to place COD order. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = async () => {
    const code = (couponCode || "").trim().toUpperCase();
    if (!code) {
      notify.error("Enter a coupon code");
      return;
    }
    try {
      const subtotal = Number.parseFloat(formData.orderDetails.subtotal) || 0;
      const res = await fetch(
        `${BASE_URL}/coupons/validate?code=${code}&subtotal=${subtotal}`,
        {
          credentials: "include",
        }
      );
      const data = await res.json();
      if (!data.success || !data.valid) {
        notify.error("Invalid or expired coupon");
        return;
      }
      const discountAmt = data.discount || 0;
      const taxRate = 0.2;
      const shippingCost = Number.parseFloat(formData.orderDetails.shipping) || 0;
      const newTax = +
        (Math.max(0, subtotal - discountAmt) * taxRate).toFixed(2);
      const newTotal = +(
        subtotal - discountAmt + shippingCost + newTax
      ).toFixed(2);

      setFormData((prev) => ({
        ...prev,
        orderDetails: {
          ...prev.orderDetails,
          discount: discountAmt.toFixed(2),
          couponCode: code,
          tax: newTax.toFixed(2),
          total: newTotal.toFixed(2),
        },
      }));
      setCouponApplied(true);
      const couponDisplayName = data.coupon?.discount_type === 'percentage' 
        ? `${data.coupon.discount_value}% off` 
        : `-$${discountAmt}`;
      notify.success(`Coupon applied: ${couponDisplayName}`);
    } catch (err) {
      console.error("Error applying coupon:", err);
      notify.error("Failed to validate coupon");
    }
  };

  const removeCoupon = () => {
    const taxRate = 0.2;
    const baseSubtotal = Number.parseFloat(formData.orderDetails.subtotal) || 0;
    const shippingCost = Number.parseFloat(formData.orderDetails.shipping) || 0;
    const newTax = +(baseSubtotal * taxRate).toFixed(2);
    const newTotal = +(baseSubtotal + shippingCost + newTax).toFixed(2);

    setFormData((prev) => ({
      ...prev,
      orderDetails: {
        ...prev.orderDetails,
        discount: "0.00",
        couponCode: "",
        tax: newTax.toFixed(2),
        total: newTotal.toFixed(2),
      },
    }));
    setCouponApplied(false);
    setCouponCode("");
    notify.info("Coupon removed");
  };

  // Handler for opening new address modal
  const handleAddNewAddress = (type) => {
    setNewAddressModal({
      isOpen: true,
      type: type
    });
  };

  // Handler for saving new address
  const handleSaveNewAddress = async (type, addressData) => {
    // Update form data with new address
    const newFormData = { ...formData };
    
    // Map address data to form fields
    newFormData[`${type}Name`] = addressData.name || "";
    newFormData[`${type}Company`] = addressData.company || "";
    newFormData[`${type}Phone`] = addressData.phone || "";
    newFormData[`${type}Address`] = addressData.address || "";
    newFormData[`${type}City`] = addressData.city || "";
    newFormData[`${type}State`] = addressData.state || "";
    newFormData[`${type}Country`] = addressData.country || "";
    
    if (addressData.email) {
      newFormData.email = addressData.email;
    }

    // If it's shipping and same shipping billing is checked, also update billing
    if (type === "shipping" && addressState.sameShippingBilling) {
      newFormData.billingName = addressData.name || "";
      newFormData.billingCompany = addressData.company || "";
      newFormData.billingPhone = addressData.phone || "";
      newFormData.billingAddress = addressData.address || "";
      newFormData.billingCity = addressData.city || "";
      newFormData.billingState = addressData.state || "";
      newFormData.billingCountry = addressData.country || "";
    }

    setFormData(newFormData);
    
    // Update address state
    setAddressState(prev => ({
      ...prev,
      [`has${type === 'shipping' ? 'Shipping' : 'Billing'}Address`]: true
    }));

    // Refresh addresses list
    if (isLoggedIn) {
      try {
        const result = await API.addresses.getAddresses();
        if (result && result.addresses) {
          setSavedAddresses(result.addresses);
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
      }
    }
  };

  // Address popup handlers
  const openShippingAddressPopup = () => {
    setAddressState((prev) => ({ ...prev, shippingAddressPopup: true }));
  };
  const closeShippingAddressPopup = () => {
    setAddressState((prev) => ({ ...prev, shippingAddressPopup: false }));
  };
  const openBillingAddressPopup = () => {
    setAddressState((prev) => ({ ...prev, billingAddressPopup: true }));
  };
  const closeBillingAddressPopup = () => {
    setAddressState((prev) => ({ ...prev, billingAddressPopup: false }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#1c1816] text-white">
      <Navbar />
      <ModernNotificationContainer />

      <div className="flex-1 relative">
        {/* Animated background elements */}
        <div className="fixed inset-0 z-[-1] overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#1c1816] via-[#c70007]/10 to-[#1c1816]"></div>

          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#c70007]/10 blur-3xl"
            animate={{
              x: [0, 30, 0],
              y: [0, -30, 0],
            }}
            transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[#c70007]/10 blur-3xl"
            animate={{
              x: [0, -40, 0],
              y: [0, 40, 0],
            }}
            transition={{ duration: 25, repeat: Number.POSITIVE_INFINITY }}
          />
        </div>

        <div className="pt-10 pb-16 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <section id="header" className="relative mb-10">
              <motion.div
                className="text-center relative z-10"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              > 
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  <span className="text-white">Complete </span>
                  <span className="text-[#c70007]">Your Purchase</span>
                </h1>
                <div className="h-1 w-24 bg-gradient-to-r from-[#c70007] to-[#c70007]/50 mx-auto mb-6"></div>
                <Link href="/cart">
                  <motion.button
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white hover:bg-white/10 transition-all"
                    whileHover={{
                      scale: 1.05,
                      backgroundColor: "rgba(255,255,255,0.1)",
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Cart
                  </motion.button>
                </Link>
              </motion.div>
            </section>

            {/* Checkout Steps */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center w-full max-w-2xl">
                {!isLoggedIn && (
                  <motion.button
                    className={`flex-1 py-2 px-4 rounded-l-lg flex flex-col items-center ${
                      activeSection === "account"
                        ? "bg-[#c70007] text-white"
                        : "bg-[#1c1816] text-gray-400 hover:bg-[#2a2523]"
                    } transition-all`}
                    onClick={() => setActiveSection("account")}
                    whileHover={
                      activeSection !== "account"
                        ? { backgroundColor: "rgba(199, 0, 7, 0.2)" }
                        : {}
                    }
                  >
                    <span className="text-sm font-medium">1. Account</span>
                  </motion.button>
                )}

                <motion.button
                  className={`flex-1 py-2 px-4 ${
                    isLoggedIn ? "rounded-l-lg" : ""
                  } flex flex-col items-center ${
                    activeSection === "shipping"
                      ? "bg-[#c70007] text-white"
                      : "bg-[#1c1816] text-gray-400 hover:bg-[#2a2523]"
                  } transition-all`}
                  onClick={() => setActiveSection("shipping")}
                  whileHover={
                    activeSection !== "shipping"
                      ? { backgroundColor: "rgba(199, 0, 7, 0.2)" }
                      : {}
                    }
                  >
                  <span className="text-sm font-medium">
                    {isLoggedIn ? "1. Shipping" : "2. Shipping"}
                  </span>
                </motion.button>

                <motion.button
                  className={`flex-1 py-2 px-4 rounded-r-lg flex flex-col items-center ${
                    activeSection === "payment"
                      ? "bg-[#c70007] text-white"
                      : "bg-[#1c1816] text-gray-400 hover:bg-[#2a2523]"
                  } transition-all`}
                  onClick={() => setActiveSection("payment")}
                  whileHover={
                    activeSection !== "payment"
                      ? { backgroundColor: "rgba(199, 0, 7, 0.2)" }
                      : {}
                    }
                  >
                  <span className="text-sm font-medium">
                    {isLoggedIn ? "2. Payment" : "3. Payment"}
                  </span>
                </motion.button>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column - Checkout Forms */}
              <div className="lg:col-span-7 space-y-6">
                <AnimatePresence mode="wait">
                  {/* Account Information Section - Only show if not logged in */}
                  {activeSection === "account" && !isLoggedIn && (
                    <motion.div
                      key="account-section"
                      className="bg-[#1c1816]/50 backdrop-blur-sm border border-[#c70007]/20 p-6 rounded-xl shadow-xl"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-white flex items-center">
                          <User className="w-5 h-5 mr-2 text-[#c70007]" />
                          Account Information
                        </h2>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="create-account"
                            className="mr-2 h-4 w-4 accent-[#c70007]"
                            checked={createAccount}
                            onChange={(e) => setCreateAccount(e.target.checked)}
                          />
                          <label
                            htmlFor="create-account"
                            className="cursor-pointer text-sm hover:text-[#c70007]"
                          >
                            Create Account
                          </label>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-[#c70007]" />
                          </div>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Full Name"
                            className="bg-[#1c1816] border border-[#c70007]/30 p-3 pl-10 w-full rounded-lg text-white focus:border-[#c70007] focus:ring-1 focus:ring-[#c70007] transition-all"
                            required
                          />
                        </div>

                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-[#c70007]" />
                          </div>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="Email Address"
                            className="bg-[#1c1816] border border-[#c70007]/30 p-3 pl-10 w-full rounded-lg text-white focus:border-[#c70007] focus:ring-1 focus:ring-[#c70007] transition-all"
                            required
                          />
                        </div>

                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-[#c70007]" />
                          </div>
                          <input
                            type="tel"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                            placeholder="Phone Number"
                            className="bg-[#1c1816] border border-[#c70007]/30 p-3 pl-10 w-full rounded-lg text-white focus:border-[#c70007] focus:ring-1 focus:ring-[#c70007] transition-all"
                            required
                          />
                        </div>

                        {createAccount && (
                          <div className="space-y-2">
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-[#c70007]" />
                              </div>
                              <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="Password"
                                className="bg-[#1c1816] border border-[#c70007]/30 p-3 pl-10 pr-10 w-full rounded-lg text-white focus:border-[#c70007] focus:ring-1 focus:ring-[#c70007] transition-all"
                                required={createAccount}
                                minLength={8}
                                maxLength={12}
                              />
                              <div
                                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-white transition-colors" />
                                ) : (
                                  <Eye className="h-5 w-5 text-gray-400 hover:text-white transition-colors" />
                                )}
                              </div>
                            </div>

                            <PasswordValidation
                              password={formData.password || ""}
                            />

                            <div className="flex items-center mt-2 p-3 bg-[#c70007]/20 rounded-lg">
                              <Info className="w-4 h-4 text-[#c70007] mr-2 flex-shrink-0" />
                              <p className="text-xs text-gray-300">
                                Creating an account allows you to track your
                                order history and save your information for
                                faster checkout.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-8 flex justify-end">
                        <motion.button
                          type="button"
                          className="px-6 py-2.5 bg-gradient-to-r from-[#c70007] to-[#c70007]/70 text-white rounded-lg shadow-lg shadow-[#c70007]/20 flex items-center gap-2"
                          whileHover={{
                            scale: 1.03,
                            backgroundColor: "#e60008",
                          }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setActiveSection("shipping")}
                        >
                          Continue to Shipping
                          <ChevronRight className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* Shipping Section */}
                  {activeSection === "shipping" && (
                    <motion.div
                      key="shipping-section"
                      className="bg-[#1c1816]/50 backdrop-blur-sm border border-[#c70007]/20 p-6 rounded-xl shadow-xl"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2 className="text-xl font-semibold text-white flex items-center mb-6">
                        <Truck className="w-5 h-5 mr-2 text-[#c70007]" />
                        Shipping & Billing
                      </h2>

                      <div className="space-y-6">
                        {/* Shipping Address */}
                        <div
                          className={`border ${
                            formData.shippingName && formData.shippingAddress
                              ? "border-[#c70007]/30"
                              : "border-white/10"
                          } rounded-lg overflow-hidden transition-all hover:border-[#c70007]/50`}
                        >
                          <div
                            className="flex items-center justify-between p-4 cursor-pointer bg-[#1c1816]/50 hover:bg-[#1c1816]/80 transition-all"
                            onClick={openShippingAddressPopup}
                          >
                            <div className="flex items-center">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                                  formData.shippingName && formData.shippingAddress
                                    ? "bg-[#c70007]"
                                    : "bg-[#2a2523]"
                                }`}
                              >
                                {formData.shippingName && formData.shippingAddress ? (
                                  <Check className="w-4 h-4 text-white" />
                                ) : (
                                  <span className="text-xs text-white">1</span>
                                )}
                              </div>
                              <div>
                                <h3 className="font-medium">
                                  Shipping Address
                                </h3>
                                {!formData.shippingName && (
                                  <p className="text-sm text-gray-400">
                                    Add your shipping details
                                  </p>
                                )}
                              </div>
                            </div>
                            <button className="text-[#c70007] text-sm hover:text-[#e60008]">
                              {formData.shippingName ? "Edit" : "Add"}
                            </button>
                          </div>

                          {formData.shippingName && formData.shippingAddress && (
                            <div className="p-4 bg-[#1c1816]/30 border-t border-white/10">
                              <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-[#c70007] flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-medium">
                                    {formData.shippingName}
                                  </p>
                                  {formData.shippingCompany && (
                                    <p className="text-sm text-gray-300">
                                      {formData.shippingCompany}
                                    </p>
                                  )}
                                  <p className="text-sm text-gray-300">
                                    {formData.shippingAddress}
                                  </p>
                                  <p className="text-sm text-gray-300">
                                    {formData.shippingCity},{" "}
                                    {formData.shippingState},{" "}
                                    {formData.shippingCountry}
                                  </p>
                                  <p className="text-sm text-gray-300">
                                    {formData.shippingPhone}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Billing Address */}
                        <div
                          className={`border ${
                            formData.billingName && formData.billingAddress
                              ? "border-[#c70007]/30"
                              : "border-white/10"
                          } rounded-lg overflow-hidden transition-all hover:border-[#c70007]/50`}
                        >
                          <div
                            className="flex items-center justify-between p-4 cursor-pointer bg-[#1c1816]/50 hover:bg-[#1c1816]/80 transition-all"
                            onClick={openBillingAddressPopup}
                          >
                            <div className="flex items-center">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                                  formData.billingName && formData.billingAddress
                                    ? "bg-[#c70007]"
                                    : "bg-[#2a2523]"
                                }`}
                              >
                                {formData.billingName && formData.billingAddress ? (
                                  <Check className="w-4 h-4 text-white" />
                                ) : (
                                  <span className="text-xs text-white">2</span>
                                )}
                              </div>
                              <div>
                                <h3 className="font-medium">Billing Address</h3>
                                {!formData.billingName && (
                                  <p className="text-sm text-gray-400">
                                    Add your billing details
                                  </p>
                                )}
                              </div>
                            </div>
                            <button className="text-[#c70007] text-sm hover:text-[#e60008]">
                              {formData.billingName && !addressState.sameShippingBilling ? "Edit" : "Add"}
                            </button>
                          </div>

                          {formData.billingName && formData.billingAddress && !addressState.sameShippingBilling && (
                            <div className="p-4 bg-[#1c1816]/30 border-t border-white/10">
                              <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-[#c70007] flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-medium">
                                    {formData.billingName}
                                  </p>
                                  {formData.billingCompany && (
                                    <p className="text-sm text-gray-300">
                                      {formData.billingCompany}
                                    </p>
                                  )}
                                  <p className="text-sm text-gray-300">
                                    {formData.billingAddress}
                                  </p>
                                  <p className="text-sm text-gray-300">
                                    {formData.billingCity},{" "}
                                    {formData.billingState},{" "}
                                    {formData.billingCountry}
                                  </p>
                                  <p className="text-sm text-gray-300">
                                    {formData.billingPhone}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Checkbox for "same as shipping" */}
                        <div className="flex items-center p-4 bg-[#c70007]/20 rounded-lg">
                          <input
                            type="checkbox"
                            id="same-as-shipping"
                            checked={addressState.sameShippingBilling}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              setAddressState((prev) => ({
                                ...prev,
                                sameShippingBilling: isChecked,
                              }));
                              
                              if (isChecked && formData.shippingName) {
                                // Copy shipping to billing
                                const newFormData = { ...formData };
                                newFormData.billingName = formData.shippingName;
                                newFormData.billingCompany = formData.shippingCompany;
                                newFormData.billingPhone = formData.shippingPhone;
                                newFormData.billingAddress = formData.shippingAddress;
                                newFormData.billingCity = formData.shippingCity;
                                newFormData.billingState = formData.shippingState;
                                newFormData.billingCountry = formData.shippingCountry;
                                setFormData(newFormData);
                              }
                              
                              saveSameShippingBillingPreference(isChecked);
                            }}
                            className="mr-3 h-4 w-4 accent-[#c70007]"
                          />
                          <label
                            htmlFor="same-as-shipping"
                            className="text-sm text-gray-300"
                          >
                            My billing address is the same as my shipping
                            address
                          </label>
                        </div>
                      </div>

                      <div className="mt-8 flex justify-between">
                        {!isLoggedIn && (
                          <motion.button
                            type="button"
                            className="px-6 py-2.5 border border-white/20 text-white rounded-lg flex items-center gap-2 hover:bg-white/5 transition-all"
                            whileHover={{
                              scale: 1.03,
                              backgroundColor: "rgba(255,255,255,0.05)",
                            }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setActiveSection("account")}
                          >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                          </motion.button>
                        )}

                        <motion.button
                          type="button"
                          className="px-6 py-2.5 bg-gradient-to-r from-[#c70007] to-[#c70007]/70 text-white rounded-lg shadow-lg shadow-[#c70007]/20 flex items-center gap-2 ml-auto"
                          whileHover={{
                            scale: 1.03,
                            backgroundColor: "#e60008",
                          }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setActiveSection("payment")}
                          disabled={
                            !formData.shippingName ||
                            !formData.shippingAddress ||
                            (!formData.billingName && !addressState.sameShippingBilling)
                          }
                        >
                          Continue to Payment
                          <ChevronRight className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* Payment Section */}
                  {activeSection === "payment" && (
                    <motion.div
                      key="payment-section"
                      className="bg-[#1c1816]/50 backdrop-blur-sm border border-[#c70007]/20 p-6 rounded-xl shadow-xl"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2 className="text-xl font-semibold text-white flex items-center mb-6">
                        <CreditCard className="w-5 h-5 mr-2 text-[#c70007]" />
                        Payment Method
                      </h2>

                      {/* Payment Method Selection */}
                      <div className="mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Credit Card Option */}
                          <motion.div
                            className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                              formData.payment_method === "card"
                                ? "border-[#c70007] bg-[#c70007]/10"
                                : "border-white/20 hover:border-white/40"
                            }`}
                            onClick={() => setFormData({...formData, payment_method: "card"})}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center space-x-3">
                              <CreditCard className="w-6 h-6 text-[#c70007]" />
                              <div>
                                <h3 className="text-white font-medium">Credit/Debit Card</h3>
                                <p className="text-gray-400 text-sm">Pay securely with your card</p>
                              </div>
                            </div>
                          </motion.div>

                          {/* COD Option */}
                          <motion.div
                            className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                              formData.payment_method === "cod"
                                ? "border-[#c70007] bg-[#c70007]/10"
                                : "border-white/20 hover:border-white/40"
                            }`}
                            onClick={() => setFormData({...formData, payment_method: "cod"})}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center space-x-3">
                              <Banknote className="w-6 h-6 text-[#c70007]" />
                              <div>
                                <h3 className="text-white font-medium">Cash on Delivery</h3>
                                <p className="text-gray-400 text-sm">Pay when you receive your order</p>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      </div>

                      {/* Conditional Payment Forms */}
                      {formData.payment_method === "card" && stripePromise && (
                        <Elements
                          stripe={stripePromise}
                          options={{
                            ...stripeOptions,
                            amount: Math.round(
                              parseFloat(formattedOrderTotal) * 100
                            ),
                          }}
                        >
                          <StripeCheckoutForm
                            formData={formData}
                            orderTotal={formattedOrderTotal}
                            loading={loading}
                            setLoading={setLoading}
                            message={message}
                            setMessage={setMessage}
                            router={router}
                          />
                        </Elements>
                      )}

                      {/* COD Confirmation */}
                      {formData.payment_method === "cod" && (
                        <div className="bg-[#c70007]/10 border border-[#c70007]/30 rounded-xl p-6">
                          <div className="flex items-start space-x-3">
                            <Banknote className="w-6 h-6 text-[#c70007] mt-1" />
                            <div>
                              <h3 className="text-white font-medium mb-2">Cash on Delivery Selected</h3>
                              <div className="text-gray-300 text-sm space-y-2">
                                <p>• Payment will be collected when your order is delivered</p>
                                <p>• Please have the exact amount ready: <span className="text-white font-medium">${formattedOrderTotal}</span></p>
                                <p>• Available for local delivery areas only</p>
                                <p>• Order limit: $2,000 maximum</p>
                              </div>
                              
                              <motion.button
                                type="button"
                                className="mt-4 w-full bg-[#c70007] hover:bg-[#a50005] text-white font-medium py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                whileHover={{ scale: loading ? 1 : 1.02 }}
                                whileTap={{ scale: loading ? 1 : 0.98 }}
                                onClick={handleCODOrder}
                                disabled={loading}
                              >
                                {loading ? "Processing..." : "Place COD Order"}
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-8 flex justify-start">
                        <motion.button
                          type="button"
                          className="px-6 py-2.5 border border-white/20 text-white rounded-lg flex items-center gap-2 hover:bg-white/5 transition-all"
                          whileHover={{
                            scale: 1.03,
                            backgroundColor: "rgba(255,255,255,0.05)",
                          }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setActiveSection("shipping")}
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Back to Shipping
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:col-span-5">
                <motion.div
                  className="bg-[#1c1816]/50 backdrop-blur-sm border border-[#c70007]/20 p-6 rounded-xl shadow-xl sticky top-24"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <h2 className="text-xl font-semibold text-white flex items-center mb-6">
                    <ShoppingCart className="w-5 h-5 mr-2 text-[#c70007]" />
                    Order Summary
                  </h2>

                  {/* Order Items */}
                  <div className="max-h-80 overflow-y-auto pr-2 mb-6 custom-scrollbar">
                    {formData.orderDetails.items.length > 0 ? (
                      <div className="space-y-4">
                        {formData.orderDetails.items.map((item, index) => (
                          <motion.div
                            key={item.id || index}
                            className="border border-white/10 rounded-lg overflow-hidden hover:border-[#c70007]/30 transition-all"
                            whileHover={{ scale: 1.01 }}
                          >
                            <div
                              className="flex items-center p-3 cursor-pointer"
                              onClick={() => toggleItemExpansion(item.id)}
                            >
                              <div className="relative w-16 h-16 mr-3 flex-shrink-0 rounded-md overflow-hidden">
                                <img
                                  src={
                                    item.image ||
                                    "/placeholder.svg?height=100&width=100"
                                  }
                                  alt={item.name}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src =
                                      "/placeholder.svg?height=100&width=100";
                                  }}
                                />
                              </div>
                              <div className="flex-grow">
                                <h4 className="font-medium text-sm">
                                  {item.name}
                                </h4>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-xs text-gray-400">
                                    Qty: {item.quantity || 1}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {item.sale_price && item.sale_price > 0 ? (
                                      <div className="flex flex-col items-end">
                                        <span className="font-medium line-through text-gray-500 text-sm">
                                          ${(item.price || 0).toFixed(2)}
                                        </span>
                                        <span className="font-medium text-green-400">
                                          ${(item.sale_price).toFixed(2)}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="font-medium text-[#c70007]">
                                        ${(item.price || 0).toFixed(2)}
                                      </span>
                                    )}
                                    <span className="text-xs text-gray-400 ml-1">
                                      × {item.quantity || 1}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {expandedItem === item.id ? (
                                <ChevronUp className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              )}
                            </div>

                            {expandedItem === item.id && (
                              <div className="p-3 bg-[#1c1816]/50 border-t border-white/10">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <span className="text-xs bg-white/10 px-2 py-0.5 rounded flex items-center">
                                    <Package className="w-3 h-3 mr-1" />
                                    {item.condition || "N/A"}
                                  </span>
                                  {item.sub_condition &&
                                    item.sub_condition !== "N/A" && (
                                      <span className="text-xs bg-white/10 px-2 py-0.5 rounded flex items-center">
                                        <Star className="w-3 h-3 mr-1" />
                                        {item.sub_condition}
                                      </span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <motion.button
                                      onClick={() =>
                                        updateItemQuantity(item.id, "decrease")
                                      }
                                      className="w-6 h-6 flex items-center justify-center bg-white/10 rounded-l-lg text-white hover:bg-white/20 transition-colors"
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                    >
                                      <Minus className="w-3 h-3" />
                                    </motion.button>
                                    <span className="px-3 py-1 bg-white/5 text-sm">
                                      {item.quantity || 1}
                                    </span>
                                    <motion.button
                                      onClick={() =>
                                        updateItemQuantity(item.id, "increase")
                                      }
                                      className="w-6 h-6 flex items-center justify-center bg-white/10 rounded-r-lg text-white hover:bg-white/20 transition-colors"
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                    >
                                      <Plus className="w-3 h-3" />
                                    </motion.button>
                                  </div>

                                  <motion.button
                                    type="button"
                                    onClick={() =>
                                      removeCartItem(item.id, item.name)
                                    }
                                    className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    aria-label="Remove item"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </motion.button>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>Your cart is empty</p>
                      </div>
                    )}
                  </div>

                  {/* Price Summary */}
                  <div className="space-y-2 border-t border-white/10 pt-4">
                    <div className="flex justify-between py-1">
                      <span className="text-gray-400">Subtotal</span>
                      <span>
                        $
                        {Number.parseFloat(
                          formData.orderDetails.subtotal
                        ).toFixed(2)}
                      </span>
                    </div>

                    {Number(formData.orderDetails.discount) > 0 && (
                      <div className="flex justify-between py-1">
                        <span className="text-gray-400">
                          Discount ({formData.orderDetails.couponCode})
                        </span>
                        <span>
                          - $
                          {Number.parseFloat(
                            formData.orderDetails.discount
                          ).toFixed(2)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between py-1">
                      <span className="text-gray-400">Shipping</span>
                      <span>${shipping.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-400">Tax</span>
                      <span>
                        $
                        {Number.parseFloat(formData.orderDetails.tax).toFixed(
                          2
                        )}
                      </span>
                    </div>

                    {/* Coupon Code */}
                    <div className="mb-4">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="Coupon code"
                          className="flex-1 bg-[#1c1816] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[#c70007]"
                          disabled={couponApplied}
                        />
                        {couponApplied ? (
                          <motion.button
                            onClick={removeCoupon}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            Remove
                          </motion.button>
                        ) : (
                          <motion.button
                            onClick={applyCoupon}
                            className="px-4 py-2 bg-[#c70007] hover:bg-[#e60008] rounded-lg text-white"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            Apply
                          </motion.button>
                        )}
                      </div>
                      {couponApplied && (
                        <p className="mt-2 text-sm text-green-400">
                          Applied{" "}
                          <span className="font-semibold">
                            {formData.orderDetails.couponCode}
                          </span>{" "}
                          (−$
                          {Number.parseFloat(
                            formData.orderDetails.discount || 0
                          ).toFixed(2)}
                          )
                        </p>
                      )}
                    </div>

                    <div className="h-px bg-white/10 my-2"></div>
                    <div className="flex justify-between py-1 text-lg font-bold">
                      <span>Total</span>
                      <span className="text-[#c70007]">
                        $
                        {Number.parseFloat(formData.orderDetails.total).toFixed(
                          2
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-[#c70007]/20 rounded-lg">
                    <div className="flex items-start">
                      <ShieldCheck className="w-5 h-5 text-[#c70007] mr-3 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-300">
                        Your payment information is encrypted and secure. We
                        never store your full credit card details.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Address Selection Popup */}
      <AddressFormPopup
        isOpen={addressState.shippingAddressPopup}
        onClose={closeShippingAddressPopup}
        addressType="shipping"
        formData={formData}
        setFormData={setFormData}
        setSameShippingBilling={(value) => {
          setAddressState((prev) => ({
            ...prev,
            sameShippingBilling: value,
          }));
          saveSameShippingBillingPreference(value);
        }}
        sameShippingBilling={addressState.sameShippingBilling}
        savedAddresses={savedAddresses}
        onAddNewClick={handleAddNewAddress}
      />

      <AddressFormPopup
        isOpen={addressState.billingAddressPopup}
        onClose={closeBillingAddressPopup}
        addressType="billing"
        formData={formData}
        setFormData={setFormData}
        setSameShippingBilling={(value) => {
          setAddressState((prev) => ({
            ...prev,
            sameShippingBilling: value,
          }));
          saveSameShippingBillingPreference(value);
        }}
        sameShippingBilling={addressState.sameShippingBilling}
        savedAddresses={savedAddresses}
        onAddNewClick={handleAddNewAddress}
      />

      {/* New Address Form Modal */}
      <NewAddressFormModal
        isOpen={newAddressModal.isOpen}
        onClose={() => setNewAddressModal({ isOpen: false, type: 'shipping' })}
        addressType={newAddressModal.type}
        onSave={handleSaveNewAddress}
      />

      <Footer />
    </div>
  );
}