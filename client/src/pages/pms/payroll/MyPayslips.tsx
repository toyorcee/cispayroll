import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

export default function MyPayslipsPage() {
  const [loading, setLoading] = useState(false);

  const handleViewPayslip = async () => {
    setLoading(true);
    try {
      // Example API call to fetch payslip data
      const response = await axios.get("/api/payslips");
      console.log("Payslip data:", response.data);
      toast.success("Payslip fetched successfully!");
    } catch (error) {
      console.error("Error fetching payslip:", error);
      toast.error("Failed to fetch payslip. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-100"
    >
      {/* Dashboard Section */}
      <div className="bg-green-600 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold">My Payslips</h1>
          <p className="mt-2 text-lg">
            Next Payslip: <span className="font-semibold">April 30, 2025</span>
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center py-10">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center space-y-4 w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-800">View Payslip</h2>
          <p className="text-gray-600">
            Click the button below to view your latest payslip.
          </p>
          <button
            onClick={handleViewPayslip}
            disabled={loading}
            className={`w-full px-4 py-2 text-white font-medium rounded-lg ${
              loading
                ? "bg-green-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            } focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2`}
          >
            {loading ? "Loading..." : "View Payslip"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}