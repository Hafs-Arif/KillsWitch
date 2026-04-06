"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, CheckCircle, AlertCircle } from "lucide-react"

const Modal = ({ isOpen, onClose, type, message }) => {
  // Close modal with escape key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape" && isOpen) {
        onClose()
      }
    }

    window.addEventListener("keydown", handleEscKey)
    return () => window.removeEventListener("keydown", handleEscKey)
  }, [isOpen, onClose])

  // Theme variables
  const theme = {
    primary: "#c70007", // KillSwitch red for success
    error: "#c70007", // KillSwitch red for error
    background: "#000000", // Black background
    surface: "#1c1816", // Dark brown/gray surface
    textPrimary: "rgb(255, 255, 255)", // White text
    textSecondary: "rgb(156, 163, 175)", // Gray text
    border: "rgba(199, 0, 7, 0.3)", // Red border with opacity
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-md rounded-2xl overflow-hidden"
            style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-xl"
                style={{ backgroundColor: type === "success" ? `${theme.primary}30` : `${theme.error}30` }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY }}
              />
              <motion.div
                className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full blur-xl"
                style={{ backgroundColor: type === "success" ? `${theme.primary}30` : `${theme.error}30` }}
                animate={{
                  scale: [1.2, 1, 1.2],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY }}
              />
            </div>

            {/* Modal header */}
            <div className="relative flex items-center justify-between p-6 border-b" style={{ borderColor: theme.border }}>
              <h3 className="text-xl font-semibold" style={{ color: theme.textPrimary }}>
                {type === "success" ? "Success" : type === "error" ? "Error" : "Notification"}
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:opacity-80 transition-colors"
                style={{ backgroundColor: "#1c1816" }}
              >
                <X className="w-5 h-5" style={{ color: theme.textSecondary }} />
              </button>
            </div>

            {/* Modal body */}
            <div className="relative p-6 flex items-start gap-4">
              <div
                className="p-2 rounded-full"
                style={{ backgroundColor: type === "success" ? `${theme.primary}20` : `${theme.error}20` }}
              >
                {type === "success" ? (
                  <CheckCircle className="w-6 h-6" style={{ color: theme.primary }} />
                ) : (
                  <AlertCircle className="w-6 h-6" style={{ color: theme.error }} />
                )}
              </div>
              <p style={{ color: theme.textSecondary }}>{message}</p>
            </div>

            {/* Modal footer */}
            <div className="relative p-6 pt-0">
              <motion.button
                onClick={onClose}
                className="w-full rounded-full py-3 px-4 flex items-center justify-center space-x-2 transition-colors"
                style={{
                  backgroundColor: "#c70007",
                  border: `1px solid ${theme.border}`,
                  color: theme.textPrimary,
                }}
                whileHover={{ scale: 1.02, opacity: 0.8 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Close</span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Modal