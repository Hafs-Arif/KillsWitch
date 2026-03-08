"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, ArrowLeft, ShoppingBag, DollarSign, Package, CheckCircle2, User } from "lucide-react";
import Link from "next/link";
import Navbar from "../../component/HomeComponents/Navbar";
import Footer from "../../component/HomeComponents/Footer";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function formatCurrency(v) {
  if (v == null || v === "") return "—";
  return `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState({
    completedOrders: null,
    totalOrders: null,
    revenue: null,
    totalProducts: null,
    totalCategories: null, 
    totalBrands: null,
    totalUsers: null,
    orderStatusBreakdown: {},
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch from backend analytics endpoint
      const res = await fetch(`${BASE_URL}/analytics/dashboard`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setAnalytics({
            completedOrders: result.data.completedOrders,
            totalOrders: result.data.totalOrders,
            revenue: result.data.revenue,
            totalProducts: result.data.totalProducts,
            totalCategories: result.data.totalCategories,
            totalBrands: result.data.totalBrands,
            totalUsers: result.data.totalUsers,
            orderStatusBreakdown: result.data.orderStatusBreakdown,
          });
          setLoading(false);
          return;
        }
      }

      // If response not ok, show error
      const errorText = await res.text();
      setError(`Backend returned: ${res.status} ${res.statusText}`);
    } catch (err) {
      console.error("Analytics fetch error:", err);
      setError(`Failed to load analytics: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="flex flex-col min-h-screen text-white" style={{ backgroundColor: "#000" }}>
      <Navbar />
      
      <div className="flex-1 p-4 sm:p-8">
        <div className="max-w-[1200px] mx-auto">
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
            <h1 className="text-3xl md:text-4xl font-bold">Analytics Dashboard</h1>
            <div>
              <motion.button
                onClick={fetchAnalytics}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-500/30"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={loading}
                style={{ backgroundColor: "#1c1816" }}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Refreshing..." : "Refresh"}
              </motion.button>
            </div>
          </div>

          {error && (
            <motion.div
              className="mb-6 p-4 rounded-lg border border-red-500/30"
              style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-red-400">{error}</p>
            </motion.div>
          )}

          {/* Main Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <motion.div
              className="p-6 rounded-lg border border-gray-500/30"
              style={{ backgroundColor: "#1c1816" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Completed Orders</p>
                  <p className="text-3xl font-bold">{analytics.completedOrders ?? "—"}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: "rgba(34, 197, 94, 0.2)" }}>
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-6 rounded-lg border border-gray-500/30"
              style={{ backgroundColor: "#1c1816" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Total Orders</p>
                  <p className="text-3xl font-bold">{analytics.totalOrders ?? "—"}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: "rgba(59, 130, 246, 0.2)" }}>
                  <ShoppingBag className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-6 rounded-lg border border-gray-500/30"
              style={{ backgroundColor: "#1c1816" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold">{formatCurrency(analytics.revenue)}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: "rgba(34, 197, 94, 0.2)" }}>
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-6 rounded-lg border border-gray-500/30"
              style={{ backgroundColor: "#1c1816" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Total Products</p>
                  <p className="text-3xl font-bold">{analytics.totalProducts ?? "—"}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: "rgba(168, 85, 247, 0.2)" }}>
                  <Package className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Inventory & Users Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <motion.div
              className="p-6 rounded-lg border border-gray-500/30"
              style={{ backgroundColor: "#1c1816" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Total Categories</p>
                  <p className="text-3xl font-bold">{analytics.totalCategories ?? "—"}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: "rgba(251, 146, 60, 0.2)" }}>
                  <ShoppingBag className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-6 rounded-lg border border-gray-500/30"
              style={{ backgroundColor: "#1c1816" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Total Brands</p>
                  <p className="text-3xl font-bold">{analytics.totalBrands ?? "—"}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: "rgba(236, 72, 153, 0.2)" }}>
                  <ShoppingBag className="w-6 h-6 text-pink-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-6 rounded-lg border border-gray-500/30"
              style={{ backgroundColor: "#1c1816" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Total Users</p>
                  <p className="text-3xl font-bold">{analytics.totalUsers ?? "—"}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: "rgba(139, 92, 246, 0.2)" }}>
                  <User className="w-6 h-6 text-indigo-400" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Order Status Breakdown */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Order Status Breakdown</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {/**
               * dynamically render each status returned by the backend
               * analytics.orderStatusBreakdown is expected to be an object
               * where keys are status strings (e.g. "PENDING", "PROCESSING").
               */}
              {analytics.orderStatusBreakdown &&
                Object.entries(analytics.orderStatusBreakdown).map(
                  ([status, count], idx) => {
                    const colors = {
                      PENDING: "text-yellow-400",
                      PROCESSING: "text-blue-400",
                      SHIPPED: "text-purple-400",
                      COMPLETED: "text-green-400",
                      CANCELLED: "text-red-400",
                      CONFIRM: "text-green-400",
                      COD_PENDING: "text-yellow-400",
                      COD_CONFIRMED: "text-green-400",
                      DELIVERED: "text-green-400",
                    };
                    const emojis = {
                      PENDING: "⏳",
                      PROCESSING: "⚙️",
                      SHIPPED: "🚚",
                      COMPLETED: "✅",
                      CANCELLED: "❌",
                      CONFIRM: "✅",
                      COD_PENDING: "💰",
                      COD_CONFIRMED: "💵",
                      DELIVERED: "📦",
                    };

                    const colorClass = colors[status] || "text-gray-400";
                    const emoji = emojis[status] || "";
                    const percentage = analytics.totalOrders
                      ? `${Math.round((count / analytics.totalOrders) * 100)}%`
                      : "0%";

                    return (
                      <motion.div
                        key={status}
                        className="p-4 rounded-lg border border-gray-500/30"
                        style={{ backgroundColor: "#1c1816" }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + idx * 0.1 }}
                      >
                        <p className={`text-sm mb-2 font-semibold ${colorClass}`}>
                          {emoji} {status.replace(/_/g, " ")}
                        </p>
                        <p className="text-2xl font-bold">{count}</p>
                        <p className="text-xs text-gray-500 mt-1">{percentage}</p>
                      </motion.div>
                    );
                  }
                )}
            </div>
          </section>

          {/* Quick Insights */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Quick Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                className="p-6 rounded-lg border border-gray-500/30"
                style={{ backgroundColor: "#1c1816" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
              >
                <p className="text-sm text-gray-400 mb-2">Average Order Value</p>
                <p className="text-2xl font-bold">
                  {analytics.totalOrders && analytics.revenue
                    ? formatCurrency(analytics.revenue / analytics.totalOrders)
                    : "—"}
                </p>
              </motion.div>

              <motion.div
                className="p-6 rounded-lg border border-gray-500/30"
                style={{ backgroundColor: "#1c1816" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
              >
                <p className="text-sm text-gray-400 mb-2">Order Completion Rate</p>
                <p className="text-2xl font-bold">
                  {analytics.totalOrders && analytics.completedOrders
                    ? `${Math.round((analytics.completedOrders / analytics.totalOrders) * 100)}%`
                    : "—"}
                </p>
              </motion.div>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
