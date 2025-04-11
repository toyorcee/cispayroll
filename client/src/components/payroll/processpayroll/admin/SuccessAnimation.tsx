import React from "react";
import { motion } from "framer-motion";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
} from "react-icons/fa";

interface SuccessAnimationProps {
  type: "success" | "error" | "warning";
  message: string;
  results?: {
    total: number;
    processed: number;
    skipped: number;
    failed: number;
    errors?: Array<{
      employeeId: string;
      employeeName: string;
      reason: string;
      details: string;
    }>;
  };
  onClose: () => void;
}

const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  type,
  message,
  results,
  onClose,
}) => {
  const getIcon = () => {
    switch (type) {
      case "success":
        return <FaCheckCircle className="w-16 h-16 text-green-500" />;
      case "error":
        return <FaTimesCircle className="w-16 h-16 text-red-500" />;
      case "warning":
        return <FaExclamationTriangle className="w-16 h-16 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "bg-green-50";
      case "error":
        return "bg-red-50";
      case "warning":
        return "bg-yellow-50";
      default:
        return "bg-gray-50";
    }
  };

  const getTextColor = () => {
    switch (type) {
      case "success":
        return "text-green-800";
      case "error":
        return "text-red-800";
      case "warning":
        return "text-yellow-800";
      default:
        return "text-gray-800";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className={`fixed inset-0 flex items-center justify-center z-50 ${getBackgroundColor()}`}
    >
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {getIcon()}
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`mt-4 text-2xl font-bold ${getTextColor()}`}
          >
            {message}
          </motion.h2>

          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6 w-full"
            >
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600">Processed</p>
                  <p className="text-2xl font-bold text-green-700">
                    {results.processed}
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-600">Skipped</p>
                  <p className="text-2xl font-bold text-yellow-700">
                    {results.skipped}
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-600">Failed</p>
                  <p className="text-2xl font-bold text-red-700">
                    {results.failed}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-700">
                    {results.total}
                  </p>
                </div>
              </div>

              {results.errors && results.errors.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Error Details
                  </h3>
                  <div className="max-h-60 overflow-y-auto">
                    {results.errors.map((error, index) => (
                      <div
                        key={index}
                        className="bg-red-50 p-4 rounded-lg mb-2"
                      >
                        <p className="font-medium text-red-800">
                          {error.employeeName}
                        </p>
                        <p className="text-sm text-red-600">{error.reason}</p>
                        <p className="text-xs text-red-500 mt-1">
                          {error.details}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            onClick={onClose}
            className={`mt-6 px-6 py-2 rounded-md ${getTextColor()} bg-white border-2 border-current hover:bg-opacity-10 hover:bg-current transition-colors`}
          >
            Close
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default SuccessAnimation;
