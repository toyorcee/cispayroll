import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface ErrorFallbackProps {
  error: Error | null;
}

export function ErrorFallback({ error }: ErrorFallbackProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center bg-gray-50"
    >
      <div className="text-center p-8 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-6">
          {error?.message || "An unexpected error occurred"}
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Return to Dashboard
        </button>
      </div>
    </motion.div>
  );
}
