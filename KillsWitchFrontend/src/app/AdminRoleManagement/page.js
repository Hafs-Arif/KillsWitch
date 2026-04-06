"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { notify } from "../components/ModernNotification";
import {
  Shield,
  Mail,
  User,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Users,
  Crown,
  RefreshCw,
} from "lucide-react";

import { BASE_URL } from "../api/api";
import Navbar from "../component/HomeComponents/Navbar";
import Footer from "../component/HomeComponents/Footer";
import RouteGuard from "../components/RouteGuard";

export default function AdminRoleManagement() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    newRole: "admin", // Default role
  });
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState({
    header: true,
    form: true,
  });
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({
    type: "",
    message: "",
  });
  const [adminCount, setAdminCount] = useState(0);
  const [adminUsers, setAdminUsers] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);

  // Fetch admin users count and list
  const fetchAdminUsers = async () => {
    try {
      setLoadingAdmins(true);
      const response = await fetch(`${BASE_URL}/chat/admins`, {
        method: "GET",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch admin users: ${response.status}`);
      }

      const admins = await response.json();
      setAdminUsers(admins);
      setAdminCount(admins.length);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      notify.error("Failed to load admin users");
    } finally {
      setLoadingAdmins(false);
    }
  };

  // Load admin users on component mount
  useEffect(() => {
    fetchAdminUsers();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Basic validation
      if (!formData.email) {
        throw new Error("Email is required");
      }

      // Prepare request body exactly as specified
      const requestBody = {
        email: formData.email,
        newRole: formData.newRole,
      };


      // Get base URL from environment or use a default
      // Using process.env.NEXT_PUBLIC_API_BASE_URL with fallback

      // Make API call to update role
      const response = await fetch(`${BASE_URL}/auth/update-role`, {
        method: "PUT",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Server responded with status: ${response.status}`
        );
      }

      const data = await response.json();

      // Show success modal
      setModalContent({
        type: "success",
        message: `Successfully updated role for ${formData.email} to ${formData.newRole}`,
      });
      setShowModal(true);

      // Reset form
      setFormData({
        email: "",
        newRole: "admin",
      });

      // Refresh admin users list
      await fetchAdminUsers();

      // Optionally show toast notification
      notify.success("Role updated successfully");
    } catch (error) {
      console.error("Error updating role:", error);

      // Show error modal
      setModalContent({
        type: "error",
        message: `Failed to update role: ${error.message}`,
      });
      setShowModal(true);

      // Optionally show toast notification
      notify.error(error.message || "Failed to update role");
    } finally {
      setLoading(false);
    }
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <RouteGuard allowedRoles={["admin"]} redirectTo="/login">
      <Navbar />

      <div className="min-h-screen py-20 px-4 sm:px-6 text-white" style={{backgroundColor: '#000000'}}>
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
            className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl" style={{backgroundColor: '#c70007', opacity: '0.2'}}
            animate={{
              x: [0, 30, 0],
              y: [0, -30, 0],
            }}
            transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl" style={{backgroundColor: '#c70007', opacity: '0.2'}}
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
              animate={isVisible.header ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Admin Role Management
              </h1>
              <div className="h-1 w-24 mx-auto mb-6" style={{background: 'linear-gradient(to right, #c70007, #ff4444, #c70007)'}}></div>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-6">
                Assign administrator privileges to users by email address
              </p>
              
              {/* Admin Count Display */}
              <motion.div
                className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-gray-500/30 backdrop-blur-xl" 
                style={{backgroundColor: '#1c1816'}}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5" style={{color: '#c70007'}} />
                  <span className="text-white font-semibold">Current Admins:</span>
                </div>
                {loadingAdmins ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2" style={{borderColor: '#c70007'}}></div>
                    <span className="text-gray-400 text-sm">Loading...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold" style={{color: '#c70007'}}>{adminCount}</span>
                    <Users className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </motion.div>
            </motion.div>
          </section>

          {/* Main content - Role assignment form */}
          <section id="role-form" className="relative">
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible.form ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {/* Form card design */}
              <div className="border border-gray-500/30 rounded-3xl overflow-hidden shadow-2xl relative max-w-2xl mx-auto" style={{backgroundColor: '#1c1816'}}>
                {/* Animated background elements */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                  <motion.div
                    className="absolute top-10 left-10 w-40 h-40 rounded-full blur-xl" style={{backgroundColor: '#c70007', opacity: '0.3'}}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                  />
                  <motion.div
                    className="absolute bottom-10 right-10 w-40 h-40 rounded-full blur-xl" style={{backgroundColor: '#c70007', opacity: '0.3'}}
                    animate={{
                      scale: [1.2, 1, 1.2],
                      opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                  />
                </div>

                {/* Form header */}
                <div className="relative z-10 p-8 md:p-12 border-b border-gray-500/30">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl flex items-center justify-center" style={{backgroundColor: '#c70007'}}>
                        <Shield className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          Assign Admin Role
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">
                          Grant administrative privileges to users
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form content */}
                <div className="relative z-10 p-8 md:p-12">
                  <form onSubmit={handleSubmit}>
                    {/* Email input */}
                    <div className="mb-8">
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        User Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-500" />
                        </div>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="user@example.com"
                          className="w-full border border-gray-500/30 text-white rounded-xl pl-10 pr-5 py-4 outline-none transition-all duration-300" style={{backgroundColor: '#1c1816', '--tw-ring-color': '#c70007'}} onFocus={(e) => e.target.style.borderColor = '#c70007'} onBlur={(e) => e.target.style.borderColor = ''}
                          required
                        />
                        <motion.div
                          className="absolute bottom-0 left-0 h-0.5 w-0" style={{background: 'linear-gradient(to right, #c70007, #ff4444, #c70007)'}}
                          whileHover={{ width: "100%" }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Enter the email address of the user to assign admin role
                      </p>
                    </div>

                    {/* Role selection */}
                    <div className="mb-8">
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Role to Assign
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                        <select
                          name="newRole"
                          value={formData.newRole}
                          onChange={handleChange}
                          className="w-full border border-gray-500/30 text-white rounded-xl pl-10 pr-5 py-4 outline-none transition-all duration-300 appearance-none" style={{backgroundColor: '#1c1816', '--tw-ring-color': '#c70007'}} onFocus={(e) => e.target.style.borderColor = '#c70007'} onBlur={(e) => e.target.style.borderColor = ''}
                        >
                          <option value="admin" className="bg-gray-900">
                            Admin
                          </option>
                          <option value="user" className="bg-gray-900">
                            User
                          </option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <ArrowRight className="h-4 w-4 text-gray-500" />
                        </div>
                        <motion.div
                          className="absolute bottom-0 left-0 h-0.5 w-0" style={{background: 'linear-gradient(to right, #c70007, #ff4444, #c70007)'}}
                          whileHover={{ width: "100%" }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Select whether to make the account an admin or demote back to a normal user
                      </p>
                    </div>

                    {/* API URL display */}
                    {/* <div className="mb-8 p-4 bg-gray-800/50 rounded-xl">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">API Configuration</h4>
                      <div className="flex flex-col gap-2 text-xs">
                        <div className="flex items-start gap-2">
                          <span className="text-purple-400 font-mono">Endpoint:</span>
                          <span className="text-gray-400 font-mono break-all">/auth/update-role</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-purple-400 font-mono">Request Body:</span>
                          <pre className="text-gray-400 font-mono bg-gray-900/50 p-2 rounded overflow-x-auto">
                            {`{
  "email": "user@example.com",
  "newRole": "admin"
}`}
                          </pre>
                        </div>
                      </div>
                    </div> */}

                    {/* Submit button */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4 border-t border-gray-500/30">
                      <div className="text-sm text-gray-400 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        <span>Only administrators can perform this action</span>
                      </div>

                      <motion.button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-4 border border-gray-500/30 rounded-xl text-white hover:opacity-80 transition-colors flex items-center justify-center gap-2 overflow-hidden relative" style={{backgroundColor: '#c70007'}}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="relative z-10">
                          {loading ? "Processing..." : "Assign Role"}
                        </span>
                        {!loading && (
                          <motion.div
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            <ArrowRight className="w-5 h-5" />
                          </motion.div>
                        )}
                        <motion.div
                          className="absolute bottom-0 left-0 h-full w-0" style={{backgroundColor: '#c70007', opacity: '0.3'}}
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

          {/* Current Admin Users List */}
          <section id="admin-list" className="relative mt-16">
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="border border-gray-500/30 rounded-3xl overflow-hidden shadow-2xl relative max-w-4xl mx-auto" style={{backgroundColor: '#1c1816'}}>
                {/* Header */}
                <div className="relative z-10 p-8 md:p-12 border-b border-gray-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl flex items-center justify-center" style={{backgroundColor: '#c70007'}}>
                        <Users className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          Current Admin Users
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">
                          List of users with administrative privileges
                        </p>
                      </div>
                    </div>
                    <motion.button
                      onClick={fetchAdminUsers}
                      disabled={loadingAdmins}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-500/30 text-white hover:opacity-80 transition-all duration-300 disabled:opacity-50" 
                      style={{backgroundColor: '#1c1816'}}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <RefreshCw 
                        className={`w-4 h-4 ${loadingAdmins ? 'animate-spin' : ''}`}
                      />
                      <span className="text-sm">Refresh</span>
                    </motion.button>
                  </div>
                </div>

                {/* Admin Users List */}
                <div className="relative z-10 p-8 md:p-12">
                  {loadingAdmins ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2" style={{borderColor: '#c70007'}}></div>
                        <span className="text-gray-400">Loading admin users...</span>
                      </div>
                    </div>
                  ) : adminUsers.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">No admin users found</p>
                      <p className="text-gray-500 text-sm mt-2">Assign admin roles to get started</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {adminUsers.map((admin, index) => (
                        <motion.div
                          key={admin.id}
                          className="flex items-center gap-4 p-4 rounded-xl border border-gray-500/20 hover:border-gray-500/40 transition-all duration-300" 
                          style={{backgroundColor: '#1c1816'}}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{backgroundColor: '#c70007'}}>
                              <Crown className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-semibold truncate">
                              {admin.name || 'Unknown User'}
                            </h3>
                            <p className="text-gray-400 text-sm truncate">
                              {admin.email}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" style={{backgroundColor: '#c70007', color: 'white'}}>
                                Admin
                              </span>
                              <button
                                className="ml-4 text-xs text-red-400 hover:text-red-600 underline"
                                onClick={async () => {
                                  try {
                                    setLoading(true);
                                    const resp = await fetch(`${BASE_URL}/auth/update-role`, {
                                      method: 'PUT',
                                      credentials: 'include',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ email: admin.email, newRole: 'user' }),
                                    });
                                    if (!resp.ok) throw new Error('Failed to demote');
                                    notify.success(`${admin.email} demoted to user`);
                                    await fetchAdminUsers();
                                  } catch (err) {
                                    console.error(err);
                                    notify.error('Unable to demote admin');
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
                              >
                                Remove admin
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </section>

          {/* Information cards */}
          <section id="info-cards" className="relative mt-16">
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {/* Admin privileges card */}
              <motion.div
                className="border border-gray-500/30 rounded-2xl p-6 relative overflow-hidden" style={{backgroundColor: '#1c1816'}}
                whileHover={{ y: -5 }}
              >
                <div className="absolute top-0 right-0 w-24 h-24">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full opacity-5"
                  >
                    <motion.path
                      d="M0,0 L100,0 L100,100"
                      fill="none"
                      stroke="white"
                      strokeWidth="1"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "reverse",
                      }}
                    />
                  </svg>
                </div>

                <div className="p-3 rounded-xl w-12 h-12 flex items-center justify-center mb-4" style={{backgroundColor: '#c70007'}}>
                  <Shield className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-xl font-bold text-white mb-2">
                  Admin Privileges
                </h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span style={{color: '#c70007'}}>•</span>
                    <span>Access to user management dashboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{color: '#c70007'}}>•</span>
                    <span>Ability to modify product listings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{color: '#c70007'}}>•</span>
                    <span>Order processing and management</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{color: '#c70007'}}>•</span>
                    <span>Access to analytics and reporting</span>
                  </li>
                </ul>
              </motion.div>

              {/* Security notice card */}
              <motion.div
                className="border border-gray-500/30 rounded-2xl p-6 relative overflow-hidden" style={{backgroundColor: '#1c1816'}}
                whileHover={{ y: -5 }}
              >
                <div className="absolute top-0 right-0 w-24 h-24">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full opacity-5"
                  >
                    <motion.path
                      d="M0,0 L100,0 L100,100"
                      fill="none"
                      stroke="white"
                      strokeWidth="1"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "reverse",
                      }}
                    />
                  </svg>
                </div>

                <div className="p-3 rounded-xl w-12 h-12 flex items-center justify-center mb-4" style={{backgroundColor: '#c70007'}}>
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-xl font-bold text-white mb-2">
                  Security Notice
                </h3>
                <p className="text-gray-300 mb-4">
                  Only assign admin roles to trusted individuals. All admin
                  actions are logged and monitored for security purposes.
                </p>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm text-gray-400">
                    For security concerns or to report unauthorized access,
                    please contact the security team immediately.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </section>
        </div>
      </div>

      {/* Modal for success/error messages */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={closeModal}
        >
          <motion.div
            className="relative w-full max-w-md border border-gray-500/30 rounded-2xl overflow-hidden" style={{backgroundColor: '#1c1816'}}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-xl" style={{backgroundColor: modalContent.type === "success" ? '#c70007' : '#c70007', opacity: '0.3'}}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY }}
              />
              <motion.div
                className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full blur-xl" style={{backgroundColor: modalContent.type === "success" ? '#c70007' : '#c70007', opacity: '0.3'}}
                animate={{
                  scale: [1.2, 1, 1.2],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY }}
              />
            </div>

            {/* Modal header */}
            <div className="relative flex items-center justify-between p-6 border-b border-gray-500/30">
              <h3 className="text-xl font-bold text-white">
                {modalContent.type === "success" ? "Success" : "Error"}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 rounded-full hover:opacity-80 transition-colors" style={{backgroundColor: '#1c1816'}}
              >
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="relative p-6 flex items-start gap-4">
              <div
                className="p-2 rounded-full" style={{backgroundColor: modalContent.type === "success" ? '#c70007' : '#c70007', opacity: '0.2'}}
              >
                {modalContent.type === "success" ? (
                  <CheckCircle className="w-6 h-6" style={{color: '#c70007'}} />
                ) : (
                  <AlertCircle className="w-6 h-6" style={{color: '#c70007'}} />
                )}
              </div>
              <p className="text-gray-300">{modalContent.message}</p>
            </div>

            {/* Modal footer */}
            <div className="relative p-6 pt-0">
              <motion.button
                onClick={closeModal}
                className="w-full border border-gray-500/30 rounded-full text-white hover:opacity-80 transition-colors py-3 px-4 flex items-center justify-center space-x-2" style={{backgroundColor: '#c70007'}}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Close</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
    </RouteGuard>
  );
}
