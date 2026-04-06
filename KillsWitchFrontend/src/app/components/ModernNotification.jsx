"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCheck, FiX, FiInfo, FiAlertTriangle } from "react-icons/fi";

// Notification store
let notifications = [];
let listeners = [];

const addNotification = (notification) => {
  const id = Date.now() + Math.random();
  const newNotification = { 
    id, 
    ...notification, 
    timestamp: Date.now() 
  };
  
  notifications = [newNotification, ...notifications];
  listeners.forEach(listener => listener([...notifications]));
  
  // Auto remove after duration
  setTimeout(() => {
    removeNotification(id);
  }, notification.duration || 4000);
  
  return id;
};

const removeNotification = (id) => {
  notifications = notifications.filter(n => n.id !== id);
  listeners.forEach(listener => listener([...notifications]));
};

const subscribe = (listener) => {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
};

// Modern notification API
export const notify = {
  success: (message, options = {}) => addNotification({
    type: 'success',
    message,
    ...options
  }),
  error: (message, options = {}) => addNotification({
    type: 'error',
    message,
    ...options
  }),
  info: (message, options = {}) => addNotification({
    type: 'info',
    message,
    ...options
  }),
  warning: (message, options = {}) => addNotification({
    type: 'warning',
    message,
    ...options
  })
};

// Notification component
const NotificationItem = ({ notification, onRemove }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <FiCheck className="w-4 h-4" />;
      case 'error':
        return <FiX className="w-4 h-4" />;
      case 'warning':
        return <FiAlertTriangle className="w-4 h-4" />;
      default:
        return <FiInfo className="w-4 h-4" />;
    }
  };

  const getStyles = () => {
    switch (notification.type) {
      case 'success':
        return {
          bg: 'bg-[#1c1816] border-[#c70007]/30',
          border: 'border-[#c70007]/50',
          icon: 'text-[#c70007]',
          text: 'text-white',
          accent: 'bg-[#c70007]/10'
        };
      case 'error':
        return {
          bg: 'bg-[#1c1816] border-red-500/30',
          border: 'border-red-500/50',
          icon: 'text-red-400',
          text: 'text-white',
          accent: 'bg-red-500/10'
        };
      case 'warning':
        return {
          bg: 'bg-[#1c1816] border-amber-500/30',
          border: 'border-amber-500/50',
          icon: 'text-amber-400',
          text: 'text-white',
          accent: 'bg-amber-500/10'
        };
      default:
        return {
          bg: 'bg-[#1c1816] border-blue-500/30',
          border: 'border-blue-500/50',
          icon: 'text-blue-400',
          text: 'text-white',
          accent: 'bg-blue-500/10'
        };
    }
  };

  const styles = getStyles();

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`
        relative flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm
        ${styles.bg} ${styles.border}
        shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 
        transition-all duration-300 max-w-sm w-full
        before:absolute before:inset-0 before:rounded-lg before:${styles.accent} before:opacity-50
      `}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 ${styles.icon}`}>
        {getIcon()}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-relaxed ${styles.text}`}>
          {notification.message}
        </p>
      </div>
      
      {/* Close button */}
      <button
        onClick={() => onRemove(notification.id)}
        className={`
          flex-shrink-0 p-1 rounded-md transition-colors duration-150
          ${styles.icon} hover:bg-[#c70007]/20 hover:text-white
        `}
      >
        <FiX className="w-3 h-3" />
      </button>
    </motion.div>
  );
};

// Main notification container
export const ModernNotificationContainer = () => {
  const [notificationList, setNotificationList] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribe(setNotificationList);
    return unsubscribe;
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3">
      <AnimatePresence mode="popLayout">
        {notificationList.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRemove={removeNotification}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ModernNotificationContainer;
