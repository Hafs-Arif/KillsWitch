"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw, Mail, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import Navbar from "../../component/HomeComponents/Navbar";
import Footer from "../../component/HomeComponents/Footer";
import RouteGuard from "../../components/RouteGuard";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function NewsletterSubscribersPage() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchSubscribers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/newsletter/subscribers`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.data) {
        setSubscribers(data.data);
      } else {
        setError(data.error || 'Failed to load subscribers');
      }
    } catch (err) {
      console.error("Error fetching subscribers:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handleDeleteSubscriber = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subscriber?')) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`${BASE_URL}/newsletter/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        setSubscribers(subscribers.filter(sub => sub.id !== id));
        setSuccess('Subscriber deleted successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to delete subscriber');
      }
    } catch (err) {
      console.error("Error deleting subscriber:", err);
      setError('Error deleting subscriber');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <RouteGuard allowedRoles={["admin"]} redirectTo="/login">
      <div className="flex flex-col min-h-screen text-white" style={{ backgroundColor: "#000000" }}>
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
              <h1 className="text-3xl md:text-4xl font-bold">Newsletter Subscribers</h1>
              <motion.button
                onClick={fetchSubscribers}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-500/30 hover:border-[#c70007]/50 transition-colors"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={loading}
                style={{ backgroundColor: "#1c1816" }}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Refreshing..." : "Refresh"}
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

            {/* Statistics */}
            <motion.div
              className="mb-8 p-6 rounded-lg border border-gray-500/30"
              style={{ backgroundColor: "#1c1816" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: "rgba(34, 197, 94, 0.2)" }}>
                  <Mail className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Subscribers</p>
                  <p className="text-3xl font-bold text-white">{subscribers.length}</p>
                </div>
              </div>
            </motion.div>

            {/* Table */}
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
                    style={{ borderTopColor: "#c70007", borderBottomColor: "#c70007" }}
                  ></div>
                </div>
              ) : subscribers.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Mail className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No newsletter subscribers found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-500/30">
                        <th className="px-6 py-4 text-left text-sm font-semibold">#</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Subscribed Date</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscribers.map((subscriber, index) => (
                        <tr
                          key={subscriber.id}
                          className="border-b border-gray-500/20 hover:bg-gray-900/50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm text-gray-400">{index + 1}</td>
                          <td className="px-6 py-4 text-sm text-white">{subscriber.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {new Date(subscriber.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <motion.button
                              onClick={() => handleDeleteSubscriber(subscriber.id)}
                              disabled={deletingId === subscriber.id}
                              className="p-2 rounded-lg transition-colors disabled:opacity-50"
                              style={{
                                backgroundColor: "rgba(239, 68, 68, 0.2)",
                                color: "#ef4444"
                              }}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              title="Delete subscriber"
                            >
                              {deletingId === subscriber.id ? (
                                <div className="animate-spin w-4 h-4 border-2 border-red-400 rounded-full border-t-transparent" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </motion.button>
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
