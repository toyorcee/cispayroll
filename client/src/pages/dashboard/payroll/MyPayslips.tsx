import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { PaySlip } from "../../../components/payroll/processpayroll/PaySlip";
import { viewPayslip } from "../../../services/payrollService";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import { Payslip, PayslipDetails } from "../../../types/payroll"; // Import appropriate types

export default function MyPayslipsPage() {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState<Payslip[]>([]); // Define type for payslips
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipDetails | null>(null); // Define type for selectedPayslip
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's payslips
  useEffect(() => {
    const fetchPayslips = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${user.id}/payslips`);
        const data: Payslip[] = await response.json(); // Ensure the response is typed
        setPayslips(data);
      } catch (err) {
        const errorMessage = (err as Error).message || "Failed to load payslips";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchPayslips();
  }, [user.id]);

  // Handle viewing a payslip
  const handleViewPayslip = async (payslipId: string) => {
    try {
      const payslip: PayslipDetails = await viewPayslip(payslipId); // Ensure the response is typed
      setSelectedPayslip(payslip);
    } catch (err) {
      const errorMessage = (err as Error).message || "Failed to load payslip details";
      toast.error(errorMessage);
    }
  };

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-red-50 p-6 rounded-lg shadow-lg border border-red-200"
      >
        <h2 className="text-red-800 text-lg font-semibold">
          Error Loading Payslips
        </h2>
        <p className="text-red-600 mt-2">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
        >
          Retry
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 w-full"
    >
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h4 className="text-2xl font-semibold text-gray-800">My Payslips</h4>
        <p className="mt-1 text-sm text-gray-600">
          View and download your payment history
        </p>
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : payslips.length === 0 ? (
        <EmptyState
          title="No payslips found"
          description="You don't have any payslips yet"
          icon={<DocumentTextIcon className="h-12 w-12 text-gray-400" />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {payslips.map((payslip) => (
            <motion.div
              key={payslip._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-4 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">
                    {new Date(payslip.year, payslip.month - 1).toLocaleString(
                      "default",
                      { month: "long", year: "numeric" }
                    )}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Status: {payslip.status}
                  </p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ${payslip.totals.netPay.toLocaleString()}
                </span>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleViewPayslip(payslip._id)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  View Payslip
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Payslip Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">Payslip Details</h3>
                <button
                  onClick={() => setSelectedPayslip(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <PaySlip data={selectedPayslip} onPrint={() => window.print()} />
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}