"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AdminChat from "../component/socketsComponents/AdminChat";
import Navbar from "../component/HomeComponents/Navbar";
import Footer from "../component/HomeComponents/Footer";
import RouteGuard from "../components/RouteGuard";
import { 
  MessageSquare, 
  Users, 
  Activity, 
  Shield, 
  Zap,
  Bell,
  Settings,
  BarChart3,
  Clock,
  Wifi,
  WifiOff
} from "lucide-react";

export default function AdminChatPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeConversations: 0,
    unreadMessages: 0,
    onlineAdmins: 0
  });

  const [isOnline, setIsOnline] = useState(true);

  // Simulate real-time stats updates
  useEffect(() => {
    const updateStats = () => {
      setStats(prev => ({
        totalUsers: Math.floor(Math.random() * 50) + 20,
        activeConversations: Math.floor(Math.random() * 15) + 5,
        unreadMessages: Math.floor(Math.random() * 25) + 3,
        onlineAdmins: Math.floor(Math.random() * 3) + 1
      }));
    };

    updateStats();
    const interval = setInterval(updateStats, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <RouteGuard allowedRoles={['admin']}>
      <div className="flex flex-col min-h-screen text-white" style={{backgroundColor: '#000000'}}>
        <Navbar />
        
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(199,0,7,0.08),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(199,0,7,0.04),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(199,0,7,0.04),transparent_50%)]" />
            
            {/* Floating geometric elements */}
            <div className="absolute inset-0 opacity-5">
              <motion.div
                className="absolute top-1/4 left-1/6 w-32 h-32 border border-[#c70007]/20 rotate-45 rounded-lg"
                animate={{ rotate: [45, 405] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute top-3/4 right-1/4 w-24 h-24 border border-[#c70007]/15 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="p-3 rounded-xl flex items-center justify-center" style={{backgroundColor: '#c70007'}}>
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white">
                  Admin Chat Center
                </h1>
              </div>
              
              <div className="h-1 w-24 mx-auto mb-6" style={{background: 'linear-gradient(to right, #c70007, #ff4444, #c70007)'}}></div>
              
              <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
                Real-time communication hub for managing customer conversations with advanced notification system and persistent message storage
              </p>

              {/* Connection Status */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex items-center justify-center gap-2 mb-8"
              >
                {isOnline ? (
                  <>
                    <Wifi className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-medium">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-5 h-5 text-red-400" />
                    <span className="text-red-400 font-medium">Offline</span>
                  </>
                )}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Stats Dashboard */}
        <section className="relative py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              {/* Total Users */}
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative overflow-hidden rounded-2xl border border-gray-500/30 p-6" 
                style={{backgroundColor: '#1c1816'}}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Total Users</p>
                    <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{backgroundColor: '#c70007'}}>
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
                <motion.div
                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-[#c70007] to-[#ff4444]"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1, delay: 0.6 }}
                />
              </motion.div>

              {/* Active Conversations */}
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative overflow-hidden rounded-2xl border border-gray-500/30 p-6" 
                style={{backgroundColor: '#1c1816'}}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Active Conversations</p>
                    <p className="text-3xl font-bold text-white">{stats.activeConversations}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{backgroundColor: '#c70007'}}>
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                </div>
                <motion.div
                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-[#c70007] to-[#ff4444]"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1, delay: 0.8 }}
                />
              </motion.div>

              {/* Unread Messages */}
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative overflow-hidden rounded-2xl border border-gray-500/30 p-6" 
                style={{backgroundColor: '#1c1816'}}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Unread Messages</p>
                    <p className="text-3xl font-bold text-white">{stats.unreadMessages}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{backgroundColor: '#c70007'}}>
                    <Bell className="w-6 h-6 text-white" />
                  </div>
                </div>
                <motion.div
                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-[#c70007] to-[#ff4444]"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1, delay: 1.0 }}
                />
              </motion.div>

              {/* Online Admins */}
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative overflow-hidden rounded-2xl border border-gray-500/30 p-6" 
                style={{backgroundColor: '#1c1816'}}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Online Admins</p>
                    <p className="text-3xl font-bold text-white">{stats.onlineAdmins}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{backgroundColor: '#c70007'}}>
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                </div>
                <motion.div
                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-[#c70007] to-[#ff4444]"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1, delay: 1.2 }}
                />
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Chat Interface */}
        <section className="relative flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="relative"
            >
              <AdminChat />
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </RouteGuard>
  );
}


