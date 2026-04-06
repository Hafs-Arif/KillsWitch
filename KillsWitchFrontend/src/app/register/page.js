"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiLoader,
  FiCheck,
} from "react-icons/fi";
import { FaGoogle } from "react-icons/fa";
import { notify, ModernNotificationContainer } from "../components/ModernNotification";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../component/HomeComponents/Navbar.jsx";
import Footer from "../component/HomeComponents/Footer.jsx";
import { API } from "../api/api.js";

const RegisterPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const checkForToken = async () => {
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");

        if (token) {
          // Clean up the URL first
          window.history.replaceState({}, document.title, window.location.pathname);
          
          try {
            // The backend has already set cookies, so we just need to verify the user is authenticated
            const profile = await API.auth.getProfile();
            
            if (profile && profile.user) {
              notify.success("Successfully signed in with Google!");
              setTimeout(() => {
                router.push("/");
              }, 1500);
            } else {
              notify.error("Authentication failed. Please try again.");
            }
          } catch (error) {
            console.error("Authentication verification failed:", error);
            notify.error("Authentication failed. Please try again.");
          }
        }
      }
    };

    checkForToken();
  }, [router]);

  const handleGoogleSignIn = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    window.location.href = `${apiUrl}/auth/google`;
  };

const formatPhoneNumber = (value) => {
  // Sirf numbers rakhlo, formatting mat karo
  return value.replace(/\D/g, '');

};

const handleChange = (e) => {
  const { name, value } = e.target;
  if (name === 'phone') {
    const formattedPhone = formatPhoneNumber(value); // <-- Yahan bhi change karo
    setFormData((prev) => ({ ...prev, [name]: formattedPhone }));
  } else {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (password.length > 12) {
      return "Password must not exceed 12 characters";
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return "Password must contain at least one special character";
    }
    return null;
  };

const validatePhoneNumber = (phone) => {
  // Sirf check karo ke kuch to likha hai
  if (!phone || phone.trim() === '') {
    return "Phone number is required";
  }
  
  // Remove all non-numeric characters for length check
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Basic length check - minimum 7 digits, maximum 15 digits (international standard)
  if (cleanPhone.length < 7) {
    return "Phone number is too short";
  }
  if (cleanPhone.length > 15) {
    return "Phone number is too long";
  }
  
  // Agar sab theek hai to null return karo (matlab koi error nahi)
  return null;
};
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (!formData.phone.trim()) {
  newErrors.phone = "Phone number is required";
} else {
  const phoneError = validatePhoneNumber(formData.phone);
  if (phoneError) {
    newErrors.phone = phoneError;
  }
}

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      newErrors.password = passwordError;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      Object.values(errors).forEach((error) => {
        notify.error(error);
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Clean phone number for backend (remove formatting)
      const cleanPhone = formData.phone.replace(/\D/g, '');
      
      const userData = {
        name: formData.name, 
        email: formData.email,
        phoneno: cleanPhone,
        password: formData.password,
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      notify.success("Registration successful! Redirecting to login...");

      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error) {
      console.error("Registration error:", error);
      notify.error(error.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordChecks = {
    length: formData.password.length >= 8 && formData.password.length <= 12,
    special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Navbar />
      <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <ModernNotificationContainer />
        <motion.div
          className="w-full max-w-md sm:max-w-lg bg-[#1c1816] rounded-2xl shadow-2xl border border-[#c70007]/50 p-6 sm:p-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">Create Your Account</h2>
            <p className="text-gray-300 text-sm sm:text-base">
              Join us to explore premium products and exclusive offers
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="text-[#c70007] w-5 h-5" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3 py-3 rounded-lg bg-[#1c1816] text-white placeholder-gray-400 border-2 ${
                    errors.name ? "border-[#c70007]" : "border-[#c70007]/30"
                  } focus:outline-none focus:ring-2 focus:ring-[#c70007] focus:border-[#c70007] transition-all duration-300 shadow-sm`}
                  placeholder="Full Name"
                />
              </div>
              {errors.name && (
                <p className="text-[#c70007] text-sm mt-1 flex items-center gap-1">
                  <FiAlertCircle className="w-4 h-4" />
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="text-[#c70007] w-5 h-5" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3 py-3 rounded-lg bg-[#1c1816] text-white placeholder-gray-400 border-2 ${
                    errors.email ? "border-[#c70007]" : "border-[#c70007]/30"
                  } focus:outline-none focus:ring-2 focus:ring-[#c70007] focus:border-[#c70007] transition-all duration-300 shadow-sm`}
                  placeholder="Email Address"
                />
              </div>
              {errors.email && (
                <p className="text-[#c70007] text-sm mt-1 flex items-center gap-1">
                  <FiAlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiPhone className="text-[#c70007] w-5 h-5" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3 py-3 rounded-lg bg-[#1c1816] text-white placeholder-gray-400 border-2 ${
                    errors.phone ? "border-[#c70007]" : "border-[#c70007]/30"
                  } focus:outline-none focus:ring-2 focus:ring-[#c70007] focus:border-[#c70007] transition-all duration-300 shadow-sm`}
                  placeholder="(555) 123-4567"
                  maxLength="20" 
                />
              </div>
              {errors.phone && (
                <p className="text-[#c70007] text-sm mt-1 flex items-center gap-1">
                  <FiAlertCircle className="w-4 h-4" />
                  {errors.phone}
                </p>
              )}
              {!errors.phone && (
                <p className="text-gray-400 text-xs mt-1">
                  US phone numbers only. Format: (555) 123-4567
                </p>
              )}
            </div>

            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-[#c70007] w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={(e) => {
                    if (e.target.value.length <= 12) {
                      handleChange(e);
                    } else {
                      notify.error("Password cannot exceed 12 characters");
                    }
                  }}
                  className={`w-full pl-10 pr-10 py-3 rounded-lg bg-[#1c1816] text-white placeholder-gray-400 border-2 ${
                    errors.password ? "border-[#c70007]" : "border-[#c70007]/30"
                  } focus:outline-none focus:ring-2 focus:ring-[#c70007] focus:border-[#c70007] transition-all duration-300 shadow-sm`}
                  placeholder="Password"
                  maxLength={12}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FiEyeOff className="text-[#c70007] hover:text-[#c70007]/80 w-5 h-5 transition-colors" />
                  ) : (
                    <FiEye className="text-[#c70007] hover:text-[#c70007]/80 w-5 h-5 transition-colors" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-[#c70007] text-sm mt-1 flex items-center gap-1">
                  <FiAlertCircle className="w-4 h-4" />
                  {errors.password}
                </p>
              )}
            </div>

            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-[#c70007] w-5 h-5" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    if (e.target.value.length <= 12) {
                      handleChange(e);
                    } else {
                      notify.error("Password cannot exceed 12 characters");
                    }
                  }}
                  className={`w-full pl-10 pr-10 py-3 rounded-lg bg-[#1c1816] text-white placeholder-gray-400 border-2 ${
                    errors.confirmPassword ? "border-[#c70007]" : "border-[#c70007]/30"
                  } focus:outline-none focus:ring-2 focus:ring-[#c70007] focus:border-[#c70007] transition-all duration-300 shadow-sm`}
                  placeholder="Confirm Password"
                  maxLength={12}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <FiEyeOff className="text-[#c70007] hover:text-[#c70007]/80 w-5 h-5 transition-colors" />
                  ) : (
                    <FiEye className="text-[#c70007] hover:text-[#c70007]/80 w-5 h-5 transition-colors" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-[#c70007] text-sm mt-1 flex items-center gap-1">
                  <FiAlertCircle className="w-4 h-4" />
                  {errors.confirmPassword}
                </p>
              )}
              <div className="mt-3 bg-[#1c1816] rounded-lg p-4 border border-[#c70007]/20 shadow-sm">
                <p className="text-gray-300 text-sm font-medium mb-2">Password Requirements:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    {passwordChecks.length ? (
                      <FiCheck className="text-[#c70007] w-4 h-4" />
                    ) : (
                      <div className="w-4 h-4 border border-[#c70007]/50 rounded-full"></div>
                    )}
                    <span className={passwordChecks.length ? "text-[#c70007]" : "text-gray-300"}>
                      8-12 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {passwordChecks.special ? (
                      <FiCheck className="text-[#c70007] w-4 h-4" />
                    ) : (
                      <div className="w-4 h-4 border border-[#c70007]/50 rounded-full"></div>
                    )}
                    <span className={passwordChecks.special ? "text-[#c70007]" : "text-gray-300"}>
                      At least one special character
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <motion.button
              type="submit"
              className={`w-full py-3 px-4 bg-[#c70007] hover:bg-[#c70007]/90 text-white font-semibold rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-[#c70007] transition-all duration-300 ${
                isSubmitting ? "opacity-75 cursor-not-allowed" : ""
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <FiLoader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Creating Account...
                </span>
              ) : (
                "Get Started Now"
              )}
            </motion.button>

            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-[#c70007]/20"></div>
              <span className="flex-shrink mx-4 text-gray-300 text-sm">or</span>
              <div className="flex-grow border-t border-[#c70007]/20"></div>
            </div>

            <motion.button
              type="button"
              className="w-full flex items-center justify-center py-3 px-4 bg-[#1c1816] hover:bg-[#c70007]/20 border border-[#c70007]/50 rounded-lg shadow-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#c70007] transition-all duration-300"
              onClick={handleGoogleSignIn}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FaGoogle className="text-[#c70007] mr-3 w-5 h-5" />
              Continue with Google
            </motion.button>

            <div className="text-center mt-6">
              <p className="text-gray-300 text-sm">
                Already a member?{" "}
                <Link
                  href="/login"
                  className="text-[#c70007] font-semibold hover:text-[#c70007]/80 transition-colors duration-300"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default RegisterPage;