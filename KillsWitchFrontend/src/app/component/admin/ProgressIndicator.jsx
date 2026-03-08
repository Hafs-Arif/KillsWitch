"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Clock, AlertCircle, Upload, Database, Zap, Minimize2, Maximize2, X } from "lucide-react";

export default function ProgressIndicator({ 
  isVisible, 
  currentStep, 
  totalSteps = 5, 
  message = "Processing...", 
  error = null,
  success = false,
  onCancel = null,
  onDismiss = null
}) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const steps = [
    { id: 1, label: "Validating", icon: CheckCircle, color: "text-green-400" },
    { id: 2, label: "Processing Images", icon: Upload, color: "text-blue-400" },
    { id: 3, label: "Uploading", icon: Zap, color: "text-yellow-400" },
    { id: 4, label: "Saving to Database", icon: Database, color: "text-purple-400" },
    { id: 5, label: "Finalizing", icon: CheckCircle, color: "text-green-400" }
  ];

  if (!isVisible || isDismissed) return null;

  return (
    <motion.div
      className="fixed bottom-4 right-4 z-50"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
    >
      <motion.div 
        className="backdrop-blur-sm border border-gray-500/30 rounded-xl shadow-2xl overflow-hidden" style={{backgroundColor: '#1c1816'}}
        animate={{ 
          width: isMinimized ? "200px" : "300px",
          height: isMinimized ? "60px" : "auto"
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div className={`${isMinimized ? 'p-2' : 'p-4'} transition-all duration-300`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h4 className={`text-white font-semibold flex items-center ${isMinimized ? 'text-sm' : ''}`}>
            {error ? (
              <>
                <AlertCircle className={`${isMinimized ? 'w-4 h-4' : 'w-5 h-5'} mr-2 text-red-400`} />
                {isMinimized ? "Error" : "Error Occurred"}
              </>
            ) : success ? (
              <>
                <CheckCircle className={`${isMinimized ? 'w-4 h-4' : 'w-5 h-5'} mr-2 text-green-400`} />
                {isMinimized ? "Done!" : "Success!"}
              </>
            ) : (
              <>
                <Clock className={`${isMinimized ? 'w-4 h-4' : 'w-5 h-5'} mr-2 text-blue-400 animate-spin`} />
                {isMinimized ? "Working..." : "Processing..."}
              </>
            )}
          </h4>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">
              {error ? "Failed" : success ? "Complete" : `${currentStep}/${totalSteps}`}
            </span>
            {/* Minimize/Maximize Button */}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title={isMinimized ? "Expand" : "Minimize"}
            >
              {isMinimized ? (
                <Maximize2 className="w-3 h-3 text-gray-400 hover:text-white" />
              ) : (
                <Minimize2 className="w-3 h-3 text-gray-400 hover:text-white" />
              )}
            </button>
            {/* Cancel Button (only show during processing) */}
            {!success && !error && onCancel && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to cancel this operation?')) {
                    onCancel();
                    setIsDismissed(true);
                  }
                }}
                className="p-1 hover:bg-red-600 rounded transition-colors"
                title="Cancel Operation"
              >
                <X className="w-3 h-3 text-gray-400 hover:text-red-400" />
              </button>
            )}
            {/* Dismiss Button (only show when success or error) */}
            {(success || error) && (
              <button
                onClick={() => {
                  setIsDismissed(true);
                  if (onDismiss) onDismiss();
                }}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
                title="Dismiss"
              >
                <X className="w-3 h-3 text-gray-400 hover:text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {!error && !success && !isMinimized && (
          <div className="mb-3">
            <div className="w-full rounded-full h-2" style={{backgroundColor: '#1c1816'}}>
              <motion.div
                className="h-2 rounded-full" style={{background: 'linear-gradient(to right, #c70007, #ff4444)'}}
                initial={{ width: 0 }}
                animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        )}
        
        {/* Minimized Progress Bar */}
        {!error && !success && isMinimized && (
          <div className="mb-2">
            <div className="w-full rounded-full h-1" style={{backgroundColor: '#1c1816'}}>
              <motion.div
                className="h-1 rounded-full" style={{background: 'linear-gradient(to right, #c70007, #ff4444)'}}
                initial={{ width: 0 }}
                animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            {onCancel && (
              <div className="text-center mt-1">
                <button
                  onClick={() => {
                    if (window.confirm('Cancel operation?')) {
                      onCancel();
                      setIsDismissed(true);
                    }
                  }}
                  className="text-xs text-red-400 hover:text-red-300 underline"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {/* Message */}
        {!isMinimized && (
          <p className={`text-sm mb-3 ${
            error ? "text-red-300" : success ? "text-green-300" : "text-gray-300"
          }`}>
            {error || message}
          </p>
        )}

        {/* Steps */}
        {!error && !isMinimized && (
          <div className="space-y-2">
            {steps.map((step) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              const isPending = currentStep < step.id;

              return (
                <motion.div
                  key={step.id}
                  className={`flex items-center text-xs ${
                    isCompleted
                      ? "text-green-400"
                      : isCurrent
                      ? step.color
                      : "text-gray-500"
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: step.id * 0.1 }}
                >
                  <div className={`w-4 h-4 mr-2 flex items-center justify-center ${
                    isCompleted
                      ? "text-green-400"
                      : isCurrent
                      ? step.color + " animate-pulse"
                      : "text-gray-500"
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : isCurrent ? (
                      <Icon className="w-4 h-4" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-current opacity-50" />
                    )}
                  </div>
                  <span className={isCompleted ? "line-through" : ""}>
                    {step.label}
                  </span>
                  {isCurrent && (
                    <motion.div
                      className="ml-2 w-1 h-1 bg-current rounded-full"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Cancel Action (during processing) */}
        {!success && !error && !isMinimized && onCancel && (
          <motion.div
            className="mt-3 pt-3 border-t border-gray-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to cancel this operation? Any progress will be lost.')) {
                  onCancel();
                  setIsDismissed(true);
                }
              }}
              className="w-full px-3 py-2 hover:opacity-80 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm" style={{backgroundColor: '#c70007'}}
            >
              <X className="w-4 h-4" />
              Cancel Operation
            </button>
          </motion.div>
        )}

        {/* Success/Error Actions */}
        {(success || error) && !isMinimized && (
          <motion.div
            className="mt-3 pt-3 border-t border-gray-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {success && (
              <div className="text-xs text-green-300">
                ✨ Product has been {currentStep === totalSteps ? "added" : "updated"} successfully!
              </div>
            )}
            {error && (
              <div className="text-xs text-red-300">
                ❌ Please check the details and try again.
              </div>
            )}
          </motion.div>
        )}
        </div>
      </motion.div>
    </motion.div>
  );
}
