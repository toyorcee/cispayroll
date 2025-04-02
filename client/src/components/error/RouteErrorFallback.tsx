import { useNavigate, useRouteError } from "react-router-dom";
import { motion } from "framer-motion";
import { ErrorFallback } from "./ErrorFallback";

export function RouteErrorFallback() {
  const error = useRouteError();
  const navigate = useNavigate();

  // Handle specific error types
  if (error instanceof Error) {
    return <ErrorFallback error={error} />;
  }

  // Handle unknown error types
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
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={() => navigate("/pms/dashboard")}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Return to Dashboard
        </button>
      </div>
    </motion.div>
  );
}
