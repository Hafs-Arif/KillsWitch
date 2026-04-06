"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  CheckCircle,
  Search,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import Navbar from "../../component/HomeComponents/Navbar";
import Footer from "../../component/HomeComponents/Footer";
import RouteGuard from "../../components/RouteGuard";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function CouponCodesPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    min_purchase_amount: "",
    max_uses: "",
    expires_at: "",
    is_active: true,
  });

  // Fetch all coupons
  const fetchCoupons = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/coupons`, {
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.data) {
        setCoupons(data.data);
      } else {
        setError(data.error || "Failed to load coupons");
      }
    } catch (err) {
      console.error("Error fetching coupons:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: "",
      min_purchase_amount: "",
      max_uses: "",
      expires_at: "",
      is_active: true,
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.code.trim()) {
      setError("Coupon code is required");
      return;
    }

    if (!formData.discount_value || formData.discount_value <= 0) {
      setError("Discount value must be greater than 0");
      return;
    }

    setFormLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `${BASE_URL}/coupons/${editingId}`
        : `${BASE_URL}/coupons`;

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to ${editingId ? "update" : "create"} coupon`);
      }

      const data = await res.json();
      
      if (editingId) {
        setCoupons(coupons.map(c => c.id === editingId ? data.data : c));
        setSuccess("Coupon updated successfully!");
      } else {
        setCoupons([...coupons, data.data]);
        setSuccess("Coupon created successfully!");
      }

      resetForm();
      setShowForm(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error submitting coupon:", err);
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (coupon) => {
    setFormData({
      code: coupon.code,
      description: coupon.description || "",
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_purchase_amount: coupon.min_purchase_amount || "",
      max_uses: coupon.max_uses || "",
      expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : "",
      is_active: coupon.is_active,
    });
    setEditingId(coupon.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`${BASE_URL}/coupons/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        setCoupons(coupons.filter((c) => c.id !== id));
        setSuccess("Coupon deleted successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to delete coupon");
      }
    } catch (err) {
      console.error("Error deleting coupon:", err);
      setError("Error deleting coupon");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredCoupons = coupons.filter((coupon) =>
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <RouteGuard allowedRoles={["admin"]} redirectTo="/login">
      <div
        className="flex flex-col min-h-screen text-white"
        style={{ backgroundColor: "#000000" }}
      >
        <Navbar />

        <div className="flex-1 p-4 sm:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <Link href="/Admin">
                  <motion.button
                    className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ArrowLeft className="w-5 h-5" /> Back to Admin
                  </motion.button>
                </Link>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">Coupon Codes</h1>
              <motion.button
                onClick={() => {
                  resetForm();
                  setShowForm(!showForm);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-500/30 hover:border-[#c70007]/50 transition-colors"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{ backgroundColor: "#1c1816" }}
              >
                <Plus className="w-4 h-4" />
                {showForm ? "Cancel" : "Add Coupon"}
              </motion.button>
            </div>

            {/* Status Messages */}
            {error && (
              <motion.div
                className="mb-6 p-4 rounded-lg border border-red-500/30 flex items-center gap-2"
                style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-400">{error}</p>
              </motion.div>
            )}

            {success && (
              <motion.div
                className="mb-6 p-4 rounded-lg border border-green-500/30 flex items-center gap-2"
                style={{ backgroundColor: "rgba(34, 197, 94, 0.1)" }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <CheckCircle className="w-5 h-5 text-green-400" />
                <p className="text-green-400">{success}</p>
              </motion.div>
            )}

            {/* Form */}
            {showForm && (
              <motion.div
                className="mb-8 p-6 rounded-lg border border-gray-500/30"
                style={{ backgroundColor: "#1c1816" }}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-xl font-bold mb-6">
                  {editingId ? "Edit Coupon" : "Create New Coupon"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Coupon Code */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Coupon Code *
                      </label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) =>
                          setFormData({ ...formData, code: e.target.value.toUpperCase() })
                        }
                        placeholder="e.g., SAVE20"
                        className="block w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1"
                        style={{
                          backgroundColor: "#1a1512",
                          "--tw-ring-color": "#c70007",
                        }}
                        disabled={editingId ? true : false}
                      />
                    </div>

                    {/* Discount Type */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Discount Type
                      </label>
                      <select
                        value={formData.discount_type}
                        onChange={(e) =>
                          setFormData({ ...formData, discount_type: e.target.value })
                        }
                        className="block w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white focus:outline-none focus:ring-1"
                        style={{
                          backgroundColor: "#1a1512",
                          "--tw-ring-color": "#c70007",
                        }}
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount ($)</option>
                      </select>
                    </div>

                    {/* Discount Value */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Discount Value *
                      </label>
                      <input
                        type="number"
                        value={formData.discount_value}
                        onChange={(e) =>
                          setFormData({ ...formData, discount_value: e.target.value })
                        }
                        placeholder={
                          formData.discount_type === "percentage"
                            ? "e.g., 20"
                            : "e.g., 50.00"
                        }
                        step="0.01"
                        className="block w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1"
                        style={{
                          backgroundColor: "#1a1512",
                          "--tw-ring-color": "#c70007",
                        }}
                      />
                    </div>

                    {/* Min Purchase Amount */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Min Purchase Amount ($)
                      </label>
                      <input
                        type="number"
                        value={formData.min_purchase_amount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            min_purchase_amount: e.target.value,
                          })
                        }
                        placeholder="e.g., 100"
                        step="0.01"
                        className="block w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1"
                        style={{
                          backgroundColor: "#1a1512",
                          "--tw-ring-color": "#c70007",
                        }}
                      />
                    </div>

                    {/* Max Uses */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Max Uses (Leave empty for unlimited)
                      </label>
                      <input
                        type="number"
                        value={formData.max_uses}
                        onChange={(e) =>
                          setFormData({ ...formData, max_uses: e.target.value })
                        }
                        placeholder="e.g., 100"
                        className="block w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1"
                        style={{
                          backgroundColor: "#1a1512",
                          "--tw-ring-color": "#c70007",
                        }}
                      />
                    </div>

                    {/* Expires At */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Expiration Date
                      </label>
                      <input
                        type="date"
                        value={formData.expires_at}
                        onChange={(e) =>
                          setFormData({ ...formData, expires_at: e.target.value })
                        }
                        className="block w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white focus:outline-none focus:ring-1"
                        style={{
                          backgroundColor: "#1a1512",
                          "--tw-ring-color": "#c70007",
                        }}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="e.g., Summer sale discount"
                      rows="3"
                      className="block w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1"
                      style={{
                        backgroundColor: "#1a1512",
                        "--tw-ring-color": "#c70007",
                      }}
                    />
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({ ...formData, is_active: e.target.checked })
                      }
                      className="w-4 h-4 rounded"
                      style={{ accentColor: "#c70007" }}
                    />
                    <label htmlFor="is_active" className="text-sm font-medium">
                      Active
                    </label>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-4 pt-4">
                    <motion.button
                      type="submit"
                      disabled={formLoading}
                      className="flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors"
                      style={{
                        backgroundColor: formLoading ? "#666" : "#c70007",
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {formLoading
                        ? "Saving..."
                        : editingId
                        ? "Update Coupon"
                        : "Create Coupon"}
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => {
                        resetForm();
                        setShowForm(false);
                      }}
                      disabled={formLoading}
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-500/30 text-white font-medium hover:opacity-80 transition-colors"
                      style={{ backgroundColor: "#1c1816" }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Search */}
            <div className="mb-6 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search coupons by code or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1"
                style={{ backgroundColor: "#1c1816", "--tw-ring-color": "#c70007" }}
              />
            </div>

            {/* Statistics */}
            <motion.div
              className="mb-8 p-6 rounded-lg border border-gray-500/30"
              style={{ backgroundColor: "#1c1816" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Total Coupons</p>
                  <p className="text-3xl font-bold text-white">{coupons.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Active Coupons</p>
                  <p className="text-3xl font-bold text-green-400">
                    {coupons.filter((c) => c.is_active).length}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Coupons Table */}
            <motion.div
              className="rounded-lg border border-gray-500/30 overflow-hidden"
              style={{ backgroundColor: "#1c1816" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div
                    className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
                    style={{
                      borderTopColor: "#c70007",
                      borderBottomColor: "#c70007",
                    }}
                  ></div>
                </div>
              ) : filteredCoupons.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <p>
                    {searchTerm
                      ? "No coupons match your search"
                      : "No coupon codes yet. Create one to get started!"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-500/30">
                        <th className="px-6 py-4 text-left text-sm font-semibold">
                          Code
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">
                          Discount
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">
                          Description
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">
                          Min Purchase
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">
                          Uses
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">
                          Expires
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCoupons.map((coupon) => (
                        <tr
                          key={coupon.id}
                          className="border-b border-gray-500/20 hover:bg-gray-900/50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm text-white font-medium">
                            <div className="flex items-center gap-2">
                              {coupon.code}
                              <motion.button
                                onClick={() => handleCopyCode(coupon.code)}
                                className="p-1 rounded text-gray-400 hover:text-white transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                title="Copy code"
                              >
                                {copiedId === coupon.code ? (
                                  <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </motion.button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-green-400">
                            {coupon.discount_type === "percentage"
                              ? `${coupon.discount_value}%`
                              : `$${coupon.discount_value}`}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-300">
                            {coupon.description || "—"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-300">
                            {coupon.min_purchase_amount ? `$${coupon.min_purchase_amount}` : "—"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-300">
                            {coupon.max_uses ? `${coupon.uses_count || 0}/${coupon.max_uses}` : "∞"}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                coupon.is_active
                                  ? "text-green-400 border border-green-500/30"
                                  : "text-red-400 border border-red-500/30"
                              }`}
                              style={{
                                backgroundColor:
                                  coupon.is_active
                                    ? "rgba(34, 197, 94, 0.2)"
                                    : "rgba(239, 68, 68, 0.2)",
                              }}
                            >
                              {coupon.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {coupon.expires_at
                              ? new Date(coupon.expires_at).toLocaleDateString()
                              : "No expiry"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <motion.button
                                onClick={() => handleEdit(coupon)}
                                className="p-2 rounded-lg transition-colors"
                                style={{
                                  backgroundColor: "rgba(59, 130, 246, 0.2)",
                                  color: "#3b82f6",
                                }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                title="Edit coupon"
                              >
                                <Edit2 className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                onClick={() => handleDelete(coupon.id)}
                                disabled={deletingId === coupon.id}
                                className="p-2 rounded-lg transition-colors disabled:opacity-50"
                                style={{
                                  backgroundColor: "rgba(239, 68, 68, 0.2)",
                                  color: "#ef4444",
                                }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                title="Delete coupon"
                              >
                                {deletingId === coupon.id ? (
                                  <div className="animate-spin w-4 h-4 border-2 border-red-400 rounded-full border-t-transparent" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </motion.button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        <Footer />
      </div>
    </RouteGuard>
  );
}
