"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Package,
  DollarSign,
  User,
  Phone,
  Mail,
  MessageSquare,
  Send,
  ChevronDown,
  Tag,
  ShoppingCart,
  Clock,
} from "lucide-react";

import Modal from "../component/GeneralComponents/Modal";
import Navbar from "../component/HomeComponents/Navbar";
import Footer from "../component/HomeComponents/Footer";
import Link from "next/link";
import UserChat from "../component/socketsComponents/UserChat";
import { BASE_URL, fetchAllProducts } from "../api/api";

export default function GetAQuote() {
  const [productCodes, setProductCodes] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productError, setProductError] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [filteredCodes, setFilteredCodes] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [condition, setCondition] = useState("New");
  const [quantity, setQuantity] = useState("");
  const [target_price, settarget_price] = useState("");
  const [name, setName] = useState("");
  const [phoneno, setphoneno] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("Select");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [isVisible, setIsVisible] = useState({});

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({
    type: "",
    message: "",
  });

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

  // Fetch product codes from API
  useEffect(() => {
    const fetchProductCodes = async () => {
      try {
        setIsLoadingProducts(true);
        setProductError(null);
        
        const products = await fetchAllProducts();
        
        if (Array.isArray(products) && products.length > 0) {
          // Extract unique product codes from the products
          const codes = new Set();
          
          products.forEach(product => {
            // Try different possible fields for product codes/part numbers
            if (product.product_part_number) {
              codes.add(product.product_part_number);
            }
            if (product.product_code) {
              codes.add(product.product_code);
            }
            if (product.product_name) {
              codes.add(product.product_name);
            }
          });
          
          // Convert Set to Array and add "Other" option
          const uniqueCodes = Array.from(codes).sort();
          uniqueCodes.push("Other");
          
          setProductCodes(uniqueCodes);
          setFilteredCodes(uniqueCodes);
        } else {
          console.warn("No products found, using fallback codes");
          // Fallback to some basic codes if API fails
          const fallbackCodes = [
            "Cisco-ISR4331-V/K9",
            "Cisco-ISR4451-X/K9", 
            "Dell-PowerEdge-R740",
            "HP-ProLiant-DL380",
            "Lenovo-ThinkSystem-SR650",
            "Other"
          ];
          setProductCodes(fallbackCodes);
          setFilteredCodes(fallbackCodes);
        }
      } catch (error) {
        console.error("Error fetching product codes:", error);
        setProductError("Failed to load product codes");
        
        // Use fallback codes on error
        const fallbackCodes = [
          "Cisco-ISR4331-V/K9",
          "Cisco-ISR4451-X/K9",
          "Dell-PowerEdge-R740", 
          "HP-ProLiant-DL380",
          "Lenovo-ThinkSystem-SR650",
          "Other"
        ];
        setProductCodes(fallbackCodes);
        setFilteredCodes(fallbackCodes);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProductCodes();
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setFilteredCodes(
      productCodes.filter((code) =>
        code.toLowerCase().includes(value.toLowerCase())
      )
    );
    setShowDropdown(true);
  };

  const handleSelect = (code) => {
    setInputValue(code);
    setShowDropdown(false);
    setActiveField(null);
  };

  const validateForm = () => {
    if (!inputValue) {
      setModalContent({
        type: "error",
        message: "Please enter a product code",
      });
      setShowModal(true);
      return false;
    }

    if (status === "Select") {
      setModalContent({
        type: "error",
        message: "Please select a product status",
      });
      setShowModal(true);
      return false;
    }

    if (!quantity) {
      setModalContent({
        type: "error",
        message: "Please enter a quantity",
      });
      setShowModal(true);
      return false;
    }

    if (!name) {
      setModalContent({
        type: "error",
        message: "Please enter your name",
      });
      setShowModal(true);
      return false;
    }

    if (!email) {
      setModalContent({
        type: "error",
        message: "Please enter your email",
      });
      setShowModal(true);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Format the data exactly as required by the API
      const data = {
        productcode: inputValue,
        status: "Done", 
        condition,
        quantity: Number.parseInt(quantity) || 2,
        target_price: Number.parseInt(target_price) || 20, 
        email,
        name,
        phoneno,
        message,
        recipient_email: "contact@killswitch.us",
      };

      const apiUrl = `${BASE_URL}/quotes`;
      // Make the API call directly
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error response:", errorText);
        throw new Error("Failed to submit quote request");
      }

      const result = await response.json();

      setModalContent({
        type: "success",
        message:
          "Your quote request has been submitted successfully! Our team will get back to you shortly.",
      });
      setShowModal(true);

      // reset data after sending
      setInputValue("");
      setFilteredCodes(productCodes);
      setShowDropdown(false);
      setStatus("Select");
      setCondition("New");
      setQuantity("");
      settarget_price("");
      setName("");
      setphoneno("");
      setEmail("");
      setMessage("");
    } catch (error) {
      console.error("Error submitting form:", error);
      setModalContent({
        type: "error",
        message:
          "An error occurred while submitting your request. Please try again later.",
      });
      setShowModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <>
      <Navbar />

      {/* Custom Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        type={modalContent.type}
        message={modalContent.message}
      />

      <div className="min-h-screen py-20 px-4 sm:px-6 bg-none text-white">
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
            className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gray-700/20 blur-3xl"
            animate={{
              x: [0, 30, 0],
              y: [0, -30, 0],
            }}
            transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-gray-700/20 blur-3xl"
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
            <motion.div
              className="text-center relative z-10"
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible["header"] ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Request a Quote
              </h1>
              <div className="h-1 w-24 bg-gradient-to-r from-gray-700 via-gray-300 to-gray-700 mx-auto mb-6"></div>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Get competitive pricing on our extensive range of hardware
                solutions
              </p>
            </motion.div>
          </section>

          {/* Main content */}
          <section id="quote-form" className="relative">
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible["quote-form"] ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <div className="bg-none border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                {/* Form header */}
                <div className="relative p-8 md:p-12 border-b border-white/10">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-2">
                        Product Quote Request
                      </h2>
                      <p className="text-gray-400">
                        Fill out the form below to receive a customized quote
                      </p>
                    </div>

                    {/* Quote process steps */}
                    <div className="hidden md:flex items-center space-x-2">
                      <motion.div
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 text-white"
                        whileHover={{ scale: 1.1 }}
                      >
                        <span className="text-sm font-bold">1</span>
                      </motion.div>
                      <div className="w-8 h-0.5 bg-white/20"></div>
                      <motion.div
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white/70"
                        whileHover={{ scale: 1.1 }}
                      >
                        <span className="text-sm font-bold">2</span>
                      </motion.div>
                      <div className="w-8 h-0.5 bg-white/10"></div>
                      <motion.div
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white/70"
                        whileHover={{ scale: 1.1 }}
                      >
                        <span className="text-sm font-bold">3</span>
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* Form content */}
                <div className="p-8 md:p-12">
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Product Information Section */}
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="h-px flex-grow bg-white/10"></div>
                        <h3 className="text-lg font-medium text-white flex items-center">
                          <Package className="mr-2 h-5 w-5" /> Product
                          Information
                        </h3>
                        <div className="h-px flex-grow bg-white/10"></div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Product Code */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Product Code* {isLoadingProducts && <span className="text-xs text-gray-500">(Loading products...)</span>}
                          </label>
                          {productError && (
                            <div className="mb-2 text-xs text-red-400 bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2">
                              {productError} - Using fallback product codes
                            </div>
                          )}
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <Search className="h-5 w-5 text-gray-500" />
                            </div>
                            <input
                              type="text"
                              className={`w-full bg-none border border-white/10 text-white rounded-xl pl-12 pr-5 py-4 outline-none focus:border-white/30 transition-all duration-300 ${isLoadingProducts ? 'opacity-50' : ''}`}
                              placeholder={isLoadingProducts ? "Loading product codes..." : "Search or enter product code"}
                              value={inputValue}
                              onChange={handleInputChange}
                              onFocus={() => {
                                setActiveField("product");
                                setShowDropdown(true);
                              }}
                              onBlur={() => {
                                setActiveField(null);
                                // Delay closing dropdown to allow click events to fire
                                setTimeout(() => setShowDropdown(false), 150);
                              }}
                              disabled={isLoadingProducts}
                            />
                            <motion.div
                              className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-gray-700 via-gray-300 to-gray-700 w-0"
                              animate={{
                                width:
                                  activeField === "product" ? "100%" : "0%",
                              }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                          {showDropdown && !isLoadingProducts && (
                            <motion.ul
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute left-0 right-0 mt-1 bg-gray-900 border border-white/10 rounded-xl shadow-lg max-h-60 overflow-y-auto z-10"
                            >
                              {filteredCodes.length > 0 ? (
                                filteredCodes.map((code, index) => (
                                  <motion.li
                                    key={index}
                                    className="px-4 py-3 hover:bg-white/10 cursor-pointer text-gray-300 hover:text-white transition-colors"
                                    whileHover={{ x: 5 }}
                                    onMouseDown={(e) => {
                                      e.preventDefault(); // Prevent blur event
                                      handleSelect(code);
                                    }}
                                    onClick={() => handleSelect(code)}
                                  >
                                    {code}
                                  </motion.li>
                                ))
                              ) : (
                                <li className="px-4 py-3 text-gray-500 text-sm">
                                  No matching product codes found
                                </li>
                              )}
                            </motion.ul>
                          )}
                          {showDropdown && isLoadingProducts && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="absolute left-0 right-0 mt-1 bg-gray-900 border border-white/10 rounded-xl shadow-lg p-4 z-10"
                            >
                              <div className="flex items-center justify-center text-gray-400 text-sm">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Loading product codes...
                              </div>
                            </motion.div>
                          )}
                        </div>

                        {/* Status - Note: We're keeping the UI but hardcoding the value in the API call */}
                        <div
                          className="relative"
                          onFocus={() => setActiveField("status")}
                          onBlur={() => setActiveField(null)}
                        >
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Product Status*
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <Tag className="h-5 w-5 text-gray-500" />
                            </div>
                            <select
                              className="w-full bg-none border border-white/10 text-white rounded-xl pl-12 pr-10 py-4 outline-none focus:border-white/30 transition-all duration-300 appearance-none"
                              value={status}
                              onChange={(e) => setStatus(e.target.value)}
                            >
                              <option value="Select" className="bg-gray-900">
                                Select status
                              </option>
                              <option
                                value="Not Available"
                                className="bg-gray-900"
                              >
                                Not-Available on Website
                              </option>
                              <option value="Available" className="bg-gray-900">
                                Available on Website
                              </option>
                              <option value="Done" className="bg-gray-900">
                                Done
                              </option>
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                              <ChevronDown className="h-5 w-5 text-gray-500" />
                            </div>
                            <motion.div
                              className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-gray-700 via-gray-300 to-gray-700 w-0"
                              animate={{
                                width: activeField === "status" ? "100%" : "0%",
                              }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </div>

                        {/* Condition */}
                        <div
                          className="relative"
                          onFocus={() => setActiveField("condition")}
                          onBlur={() => setActiveField(null)}
                        >
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Product Condition
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <Package className="h-5 w-5 text-gray-500" />
                            </div>
                            <select
                              className="w-full bg-none border border-white/10 text-white rounded-xl pl-12 pr-10 py-4 outline-none focus:border-white/30 transition-all duration-300 appearance-none"
                              value={condition}
                              onChange={(e) => setCondition(e.target.value)}
                            >
                              <option className="bg-gray-900">New</option>
                              <option className="bg-gray-900">Used</option>
                              <option className="bg-gray-900">OEM</option>
                              <option className="bg-gray-900">NOB</option>
                              <option className="bg-gray-900">
                                Refurbrished
                              </option>
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                              <ChevronDown className="h-5 w-5 text-gray-500" />
                            </div>
                            <motion.div
                              className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-gray-700 via-gray-300 to-gray-700 w-0"
                              animate={{
                                width:
                                  activeField === "condition" ? "100%" : "0%",
                              }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </div>

                        {/* Quantity */}
                        <div
                          className="relative"
                          onFocus={() => setActiveField("quantity")}
                          onBlur={() => setActiveField(null)}
                        >
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Quantity*
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <ShoppingCart className="h-5 w-5 text-gray-500" />
                            </div>
                            <input
                              type="number"
                              className="w-full bg-none border border-white/10 text-white rounded-xl pl-12 pr-5 py-4 outline-none focus:border-white/30 transition-all duration-300"
                              placeholder="Enter quantity"
                              value={quantity}
                              onChange={(e) => setQuantity(e.target.value)}
                              min="1"
                            />
                            <motion.div
                              className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-gray-700 via-gray-300 to-gray-700 w-0"
                              animate={{
                                width:
                                  activeField === "quantity" ? "100%" : "0%",
                              }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </div>

                        {/* Target Price */}
                        <div
                          className="relative"
                          onFocus={() => setActiveField("price")}
                          onBlur={() => setActiveField(null)}
                        >
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Target Price (Optional)
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <DollarSign className="h-5 w-5 text-gray-500" />
                            </div>
                            <input
                              type="text"
                              className="w-full bg-none border border-white/10 text-white rounded-xl pl-12 pr-5 py-4 outline-none focus:border-white/30 transition-all duration-300"
                              placeholder="Your target price"
                              value={target_price}
                              onChange={(e) => settarget_price(e.target.value)}
                            />
                            <motion.div
                              className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-gray-700 via-gray-300 to-gray-700 w-0"
                              animate={{
                                width: activeField === "price" ? "100%" : "0%",
                              }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information Section */}
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="h-px flex-grow bg-white/10"></div>
                        <h3 className="text-lg font-medium text-white flex items-center">
                          <User className="mr-2 h-5 w-5" /> Contact Information
                        </h3>
                        <div className="h-px flex-grow bg-white/10"></div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div
                          className="relative"
                          onFocus={() => setActiveField("name")}
                          onBlur={() => setActiveField(null)}
                        >
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Full Name*
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <User className="h-5 w-5 text-gray-500" />
                            </div>
                            <input
                              type="text"
                              className="w-full bg-none border border-white/10 text-white rounded-xl pl-12 pr-5 py-4 outline-none focus:border-white/30 transition-all duration-300"
                              placeholder="Enter your full name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                            />
                            <motion.div
                              className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-gray-700 via-gray-300 to-gray-700 w-0"
                              animate={{
                                width: activeField === "name" ? "100%" : "0%",
                              }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </div>

                        {/* Phone */}
                        <div
                          className="relative"
                          onFocus={() => setActiveField("phone")}
                          onBlur={() => setActiveField(null)}
                        >
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Phone Number (Optional)
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <Phone className="h-5 w-5 text-gray-500" />
                            </div>
                            <input
                              type="tel"
                              className="w-full bg-none border border-white/10 text-white rounded-xl pl-12 pr-5 py-4 outline-none focus:border-white/30 transition-all duration-300"
                              placeholder="Enter your phone number"
                              value={phoneno}
                              onChange={(e) => setphoneno(e.target.value)}
                            />
                            <motion.div
                              className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-gray-700 via-gray-300 to-gray-700 w-0"
                              animate={{
                                width: activeField === "phone" ? "100%" : "0%",
                              }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </div>

                        {/* Email */}
                        <div
                          className="relative md:col-span-2"
                          onFocus={() => setActiveField("email")}
                          onBlur={() => setActiveField(null)}
                        >
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Email Address*
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <Mail className="h-5 w-5 text-gray-500" />
                            </div>
                            <input
                              type="email"
                              className="w-full bg-none border border-white/10 text-white rounded-xl pl-12 pr-5 py-4 outline-none focus:border-white/30 transition-all duration-300"
                              placeholder="Enter your email address"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                            />
                            <motion.div
                              className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-gray-700 via-gray-300 to-gray-700 w-0"
                              animate={{
                                width: activeField === "email" ? "100%" : "0%",
                              }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="h-px flex-grow bg-white/10"></div>
                        <h3 className="text-lg font-medium text-white flex items-center">
                          <MessageSquare className="mr-2 h-5 w-5" /> Additional
                          Information
                        </h3>
                        <div className="h-px flex-grow bg-white/10"></div>
                      </div>

                      <div
                        className="relative"
                        onFocus={() => setActiveField("message")}
                        onBlur={() => setActiveField(null)}
                      >
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Message (Optional)
                        </label>
                        <div className="relative">
                          <div className="absolute top-4 left-4 flex items-start pointer-events-none">
                            <MessageSquare className="h-5 w-5 text-gray-500" />
                          </div>
                          <textarea
                            className="w-full bg-none border border-white/10 text-white rounded-xl pl-12 pr-5 py-4 outline-none focus:border-white/30 transition-all duration-300 min-h-[120px] resize-none"
                            placeholder="Any specific requirements or questions?"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                          ></textarea>
                          <motion.div
                            className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-gray-700 via-gray-300 to-gray-700 w-0"
                            animate={{
                              width: activeField === "message" ? "100%" : "0%",
                            }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Submit section */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4 border-t border-white/10">
                      <div className="text-sm text-gray-400 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          We typically respond within 24 business hours
                        </span>
                      </div>

                      <motion.button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-4 bg-none border border-white/20 rounded-xl text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2 overflow-hidden relative w-full md:w-auto"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="relative z-10">
                          {isSubmitting ? "Submitting..." : "Request Quote"}
                        </span>
                        {!isSubmitting && (
                          <motion.div
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            <Send className="w-5 h-5" />
                          </motion.div>
                        )}
                        <motion.div
                          className="absolute bottom-0 left-0 h-full bg-white/10 w-0"
                          whileHover={{ width: "100%" }}
                          transition={{ duration: 0.3 }}
                        />
                      </motion.button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </section>

          {/* Why Choose Us Section */}
          <section id="benefits" className="relative mt-20">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible["benefits"] ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold text-white mb-4">
                Why Request a Quote With Us
              </h2>
              <div className="h-0.5 w-24 bg-gradient-to-r from-gray-700 via-gray-300 to-gray-700 mx-auto mb-6"></div>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Experience the benefits of our streamlined quote process and
                competitive pricing
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "Competitive Pricing",
                  description:
                    "We leverage our industry relationships to offer you the most competitive prices on all hardware.",
                  icon: <DollarSign className="w-6 h-6" />,
                },
                {
                  title: "Fast Response Time",
                  description:
                    "Our dedicated team ensures you receive your custom quote within 24 business hours.",
                  icon: <Clock className="w-6 h-6" />,
                },
                {
                  title: "Expert Consultation",
                  description:
                    "Our product specialists can help you identify the right hardware solutions for your specific needs.",
                  icon: <User className="w-6 h-6" />,
                },
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  className="bg-none border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isVisible["benefits"] ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="p-3 bg-white/5 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-400">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* FAQ Section */}
          <section id="faq" className="relative mt-20">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible["faq"] ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold text-white mb-4">
                Frequently Asked Questions
              </h2>
              <div className="h-0.5 w-24 bg-gradient-to-r from-gray-700 via-gray-300 to-gray-700 mx-auto mb-6"></div>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Find answers to common questions about our quote process
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  question: " How long will it take to get a quote?",
                  answer:
                    "We typically process quote requests within 24 business hours. For complex or high-volume requests, it may take up to 48 hours.",
                },
                {
                  question:
                    "What details should I share to receive an accurate quote?",
                  answer:
                    "The most important details are the product code, quantity, and condition. Additional information about your timeline and specific requirements can help us provide a more tailored quote.",
                },
                {
                  question:
                    "Can I request quotes for multiple products at once?",
                  answer:
                    "Yes, you can list multiple products in the message field. For large quantities or varied product lists, our team may reach out for additional details.",
                },
                {
                  question: "Are there minimum order quantities for quotes?",
                  answer:
                    "While we can provide quotes for any quantity, certain products may have minimum order quantities set by manufacturers. We'll advise you of any such requirements in our response.",
                },
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  className="bg-none border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isVisible["faq"] ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-gray-400">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section id="cta" className="relative mt-20">
            <motion.div
              className="bg-none border border-white/10 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible["cta"] ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              whileHover={{ scale: 1.01 }}
            >
              {/* Animated background elements */}
              <div className="absolute inset-0 z-0">
                <motion.div
                  className="absolute top-0 left-1/4 w-40 h-40 rounded-full bg-gray-700/20 blur-xl"
                  animate={{
                    y: [0, 20, 0],
                    opacity: [0.2, 0.3, 0.2],
                  }}
                  transition={{
                    duration: 10,
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                />
                <motion.div
                  className="absolute bottom-0 right-1/4 w-40 h-40 rounded-full bg-gray-700/20 blur-xl"
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.2, 0.3, 0.2],
                  }}
                  transition={{
                    duration: 10,
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                />
              </div>

              <div className="relative z-10 max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Need Help Finding the Right Hardware?
                </h2>
                <p className="text-gray-300 mb-8">
                  Our team of experts is ready to assist you in finding the
                  perfect hardware solutions for your business needs. Contact us
                  for personalized assistance.
                </p>
                <motion.button
                  className="px-8 py-4 bg-none border border-white/20 rounded-full text-white hover:bg-white/10 transition-colors flex items-center space-x-2 mx-auto"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link href="/ContactUs">
                    {" "}
                    <span>Contact Our Team</span>{" "}
                  </Link>
                  <Send className="w-5 h-5 ml-2" />
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
}
