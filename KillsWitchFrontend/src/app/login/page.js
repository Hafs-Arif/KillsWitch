"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowLeft,
  FiAlertCircle,
  FiLoader,
} from "react-icons/fi";
import { FaGoogle } from "react-icons/fa";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API } from "../api/api";
import Navbar from "../component/HomeComponents/Navbar";
import Footer from "../component/HomeComponents/Footer";

const getRedirectPath = (role, next) => next || (role === "admin" ? "/Admin" : "/");
const getRedirectMessage = (role) => (role === "admin" ? "Welcome Admin!" : "Login successful!");
const getUserRoleFromToken = (token) => {
  try {
    if (!token) return "user";
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || "user";
  } catch {
    return "user";
  }
};

const LoginPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(0);
  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [resendingOtp, setResendingOtp] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    setIsClient(true);

    const checkForToken = async () => {
      if (typeof window !== "undefined") {
        const token = API.auth.handleGoogleCallback();

        if (token) {
          try {
            // The backend has already set cookies, so we just need to verify the user is authenticated
            const profile = await API.auth.getProfile();

            if (profile && profile.user) {
              const userRole = profile.user.role || "user";
              const redirectTo = getRedirectPath(userRole);
              // Merge guest cart from backend after successful Google login
              try {
                const { mergeGuestCart } = await import('../utils/cartSync');
                await mergeGuestCart();
              } catch (err) {
                console.error('Error merging guest cart after Google login:', err);
              }

              setMessage({ type: "success", text: "Successfully signed in with Google!" });
              setTimeout(() => {
                router.push(redirectTo);
              }, 1500);
            } else {
              setMessage({ type: "error", text: "Authentication failed. Please try again." });
            }
          } catch (error) {
            console.error("Authentication verification failed:", error);
            setMessage({ type: "error", text: "Authentication failed. Please try again." });
          }
        }
      }
    };

    checkForToken();
  }, [router]);

  const handleGoogleSignIn = () => {
    API.auth.googleAuth();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (forgotPasswordStep > 0) {
      setForgotPasswordData((prev) => ({ ...prev, [name]: value }));
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

  const validateForm = () => {
    const newErrors = {};

    if (forgotPasswordStep === 0) {
      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Email is invalid";
      }
      if (!formData.password) {
        newErrors.password = "Password is required";
      }
    } else if (forgotPasswordStep === 1) {
      if (!forgotPasswordData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotPasswordData.email)) {
        newErrors.email = "Email is invalid";
      }
    } else if (forgotPasswordStep === 2) {
      if (!forgotPasswordData.otp.trim()) {
        newErrors.otp = "OTP is required";
      } else if (!/^\d{5}$/.test(forgotPasswordData.otp)) {
        newErrors.otp = "OTP must be 5 digits";
      }
    } else if (forgotPasswordStep === 3) {
      if (!forgotPasswordData.newPassword) {
        newErrors.newPassword = "Password is required";
      } else if (forgotPasswordData.newPassword.length < 8) {
        newErrors.newPassword = "Password must be at least 8 characters";
      } else if (forgotPasswordData.newPassword.length > 12) {
        newErrors.newPassword = "Password must be at most 12 characters";
      } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(forgotPasswordData.newPassword)) {
        newErrors.newPassword = "Password must contain at least 1 special character";
      }
      if (forgotPasswordData.newPassword !== forgotPasswordData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setMessage({ type: "error", text: "Please fix the highlighted errors and try again." });
      return;
    }

    setIsSubmitting(true);

    try {
      if (forgotPasswordStep === 0) {
        const loginResponse = await API.auth.login({
          email: formData.email,
          password: formData.password,
        });

        let userRole = null;
        if (loginResponse.user && loginResponse.user.role) {
          userRole = loginResponse.user.role;
        } else if (loginResponse.accessToken) {
          userRole = getUserRoleFromToken(loginResponse.accessToken);
        }

        const urlParams = new URLSearchParams(window.location.search);
        const nextUrl = urlParams.get("next");

        const redirectTo = getRedirectPath(userRole, nextUrl);
        const redirectMsg = getRedirectMessage(userRole);

        setMessage({ type: "success", text: redirectMsg });
        setFormData({ email: "", password: "" });
        // Merge guest cart from backend after successful login
        try {
          const { mergeGuestCart } = await import('../utils/cartSync');
          const mergeResult = await mergeGuestCart();
        } catch (err) {
          console.error('Error merging guest cart after login:', err);
        }

        // notify other components that auth state changed (navbar, etc.)
        if (typeof window !== 'undefined') {
          // include profile data so listeners can update immediately without refetching
          window.dispatchEvent(new CustomEvent('auth-changed', { detail: loginResponse }));
        }

        setTimeout(() => router.push(redirectTo), 1500);
      } else if (forgotPasswordStep === 1) {
        await API.auth.forgotPassword(forgotPasswordData.email);
        setMessage({ type: "success", text: "OTP sent to your email." });
        setForgotPasswordStep(2);
      } else if (forgotPasswordStep === 2) {
        await API.auth.verifyOtp(forgotPasswordData.email, forgotPasswordData.otp);
        setMessage({ type: "success", text: "OTP verified!" });
        setForgotPasswordStep(3);
      } else if (forgotPasswordStep === 3) {
        await API.auth.resetPassword(
          forgotPasswordData.email,
          forgotPasswordData.newPassword
        );
        setMessage({
          type: "success",
          text: "Password reset successfully! Please login with your new password.",
        });
        setForgotPasswordStep(0);
        setForgotPasswordData({ email: "", otp: "", newPassword: "", confirmPassword: "" });
      }
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Something went wrong. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      if (!forgotPasswordData.email) {
        setMessage({ type: "error", text: "Please enter your email first." });
        setForgotPasswordStep(1);
        return;
      }
      setResendingOtp(true);
      await API.auth.forgotPassword(forgotPasswordData.email);
      setMessage({ type: "success", text: "OTP resent to your email." });
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Failed to resend OTP. Please try again." });
    } finally {
      setResendingOtp(false);
    }
  };

  const renderFormContent = () => {
    switch (forgotPasswordStep) {
      case 1:
        return (
          <>
            <div className="mb-6">
              <button
                onClick={() => setForgotPasswordStep(0)}
                className="flex items-center text-[#c70007] hover:text-[#c70007]/80 mb-4 transition-colors text-sm sm:text-base"
              >
                <FiArrowLeft className="mr-2 w-5 h-5" />
                Back to login
              </button>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Reset Password</h2>
              <p className="text-gray-300 text-sm sm:text-base mb-3">
                Enter your email to receive a verification code. You'll get a 5-digit OTP valid for 10 minutes.
              </p>
              {message.text && (
                <div
                  className={`${
                    message.type === "error"
                      ? "bg-[#c70007]/20 text-[#c70007] border-[#c70007]/50"
                      : "bg-[#c70007]/10 text-white border-[#c70007]/30"
                  } border rounded-lg p-3 text-sm sm:text-base mb-4 shadow-sm`}
                >
                  {message.text}
                </div>
              )}
            </div>

            <div className="mb-5">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="text-[#c70007] w-5 h-5" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={forgotPasswordData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3 py-3 rounded-lg bg-[#1c1816] text-white placeholder-gray-400 border-2 ${
                    errors.email ? "border-[#c70007]" : "border-[#c70007]/30"
                  } focus:outline-none focus:ring-2 focus:ring-[#c70007] focus:border-[#c70007] transition-all duration-300 shadow-sm`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="text-[#c70007] text-sm mt-1 flex items-center gap-1">
                  <FiAlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
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
              {isSubmitting ? "Sending..." : "Send OTP"}
            </motion.button>
          </>
        );

      case 2:
        return (
          <>
            <div className="mb-6">
              <button
                onClick={() => setForgotPasswordStep(1)}
                className="flex items-center text-[#c70007] hover:text-[#c70007]/80 mb-4 transition-colors text-sm sm:text-base"
              >
                <FiArrowLeft className="mr-2 w-5 h-5" />
                Back
              </button>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Verify OTP</h2>
              <p className="text-gray-300 text-sm sm:text-base mb-3">
                Enter the 5-digit code sent to {forgotPasswordData.email}. It expires in 10 minutes.
              </p>
              {message.text && (
                <div
                  className={`${
                    message.type === "error"
                      ? "bg-[#c70007]/20 text-[#c70007] border-[#c70007]/50"
                      : "bg-[#c70007]/10 text-white border-[#c70007]/30"
                  } border rounded-lg p-3 text-sm sm:text-base mb-4 shadow-sm`}
                >
                  {message.text}
                </div>
              )}
            </div>

            <div className="mb-5">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-[#c70007] w-5 h-5" />
                </div>
                <input
                  type="text"
                  name="otp"
                  value={forgotPasswordData.otp}
                  onChange={handleChange}
                  maxLength={5}
                  className={`w-full pl-10 pr-3 py-3 rounded-lg bg-[#1c1816] text-white placeholder-gray-400 border-2 ${
                    errors.otp ? "border-[#c70007]" : "border-[#c70007]/30"
                  } focus:outline-none focus:ring-2 focus:ring-[#c70007] focus:border-[#c70007] transition-all duration-300 shadow-sm`}
                  placeholder="Enter 5-digit OTP"
                />
              </div>
              {errors.otp && (
                <p className="text-[#c70007] text-sm mt-1 flex items-center gap-1">
                  <FiAlertCircle className="w-4 h-4" />
                  {errors.otp}
                </p>
              )}
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
              {isSubmitting ? "Verifying..." : "Verify OTP"}
            </motion.button>
            <div className="mt-4 text-center">
              <motion.button
                type="button"
                onClick={handleResendOtp}
                className="text-sm text-[#c70007] hover:text-[#c70007]/80 transition-colors disabled:opacity-60"
                disabled={resendingOtp}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {resendingOtp ? "Resending..." : "Resend code"}
              </motion.button>
            </div>
          </>
        );

      case 3:
        return (
          <>
            <div className="mb-6">
              <button
                onClick={() => setForgotPasswordStep(2)}
                className="flex items-center text-[#c70007] hover:text-[#c70007]/80 mb-4 transition-colors text-sm sm:text-base"
              >
                <FiArrowLeft className="mr-2 w-5 h-5" />
                Back
              </button>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Set New Password</h2>
              <p className="text-gray-300 text-sm sm:text-base mb-3">
                Create a new password (8-12 characters with 1 special character)
              </p>
              {message.text && (
                <div
                  className={`${
                    message.type === "error"
                      ? "bg-[#c70007]/20 text-[#c70007] border-[#c70007]/50"
                      : "bg-[#c70007]/10 text-white border-[#c70007]/30"
                  } border rounded-lg p-3 text-sm sm:text-base mb-4 shadow-sm`}
                >
                  {message.text}
                </div>
              )}
            </div>

            <div className="mb-5">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-[#c70007] w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="newPassword"
                  value={forgotPasswordData.newPassword}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-10 py-3 rounded-lg bg-[#1c1816] text-white placeholder-gray-400 border-2 ${
                    errors.newPassword ? "border-[#c70007]" : "border-[#c70007]/30"
                  } focus:outline-none focus:ring-2 focus:ring-[#c70007] focus:border-[#c70007] transition-all duration-300 shadow-sm`}
                  placeholder="New Password"
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
              {errors.newPassword && (
                <p className="text-[#c70007] text-sm mt-1 flex items-center gap-1">
                  <FiAlertCircle className="w-4 h-4" />
                  {errors.newPassword}
                </p>
              )}
            </div>

            <div className="mb-5">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-[#c70007] w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={forgotPasswordData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-10 py-3 rounded-lg bg-[#1c1816] text-white placeholder-gray-400 border-2 ${
                    errors.confirmPassword ? "border-[#c70007]" : "border-[#c70007]/30"
                  } focus:outline-none focus:ring-2 focus:ring-[#c70007] focus:border-[#c70007] transition-all duration-300 shadow-sm`}
                  placeholder="Confirm New Password"
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
              {errors.confirmPassword && (
                <p className="text-[#c70007] text-sm mt-1 flex items-center gap-1">
                  <FiAlertCircle className="w-4 h-4" />
                  {errors.confirmPassword}
                </p>
              )}
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
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </motion.button>
          </>
        );

      default:
        return (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">Welcome Back!</h2>
              <p className="text-gray-300 text-sm sm:text-base">Sign in to access your account</p>
            </div>
            {message.text && (
              <div
                className={`${
                  message.type === "error"
                    ? "bg-[#c70007]/20 text-[#c70007] border-[#c70007]/50"
                    : "bg-[#c70007]/10 text-white border-[#c70007]/30"
                } border rounded-lg p-3 text-sm sm:text-base mb-4 shadow-sm`}
              >
                {message.text}
              </div>
            )}

            <div className="mb-5">
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

            <div className="mb-5">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-[#c70007] w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-10 py-3 rounded-lg bg-[#1c1816] text-white placeholder-gray-400 border-2 ${
                    errors.password ? "border-[#c70007]" : "border-[#c70007]/30"
                  } focus:outline-none focus:ring-2 focus:ring-[#c70007] focus:border-[#c70007] transition-all duration-300 shadow-sm`}
                  placeholder="Password"
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

            <div className="text-right mb-4">
              <button
                type="button"
                onClick={() => setForgotPasswordStep(1)}
                className="text-sm text-[#c70007] hover:text-[#c70007]/80 transition-colors duration-300"
              >
                Forgot Password?
              </button>
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
                  Signing In...
                </span>
              ) : (
                "Sign In"
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
                Don't have an account?{" "}
                <Link
                  href="/register"
                  className="text-[#c70007] font-semibold hover:text-[#c70007]/80 transition-colors duration-300"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Navbar />
      <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <motion.div
          className="w-full max-w-md sm:max-w-lg bg-[#1c1816] rounded-2xl shadow-2xl border border-[#c70007]/50 p-6 sm:p-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <form onSubmit={handleSubmit}>{renderFormContent()}</form>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default LoginPage;