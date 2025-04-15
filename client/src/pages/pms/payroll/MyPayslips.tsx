import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { employeeService } from "../../../services/employeeService";
import { format } from "date-fns";
import {
  FiDownload,
  FiEye,
  FiCalendar,
  FiPrinter,
  FiRefreshCw,
} from "react-icons/fi";
import { generatePayslipPDF } from "../../../utils/pdfGenerator";
import { Payslip } from "../../../types/payroll";

export default function MyPayslipsPage() {
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [loading, setLoading] = useState({
    download: false,
    print: false,
    refresh: false,
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [totalPayslips, setTotalPayslips] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  const totalPages = Math.ceil(totalPayslips / limit);

  const fetchPayslips = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await employeeService.getOwnPayslips({ page, limit });
      console.log("API Response:", response);
      console.log("Response data:", response.data);
      console.log("Payslips:", response.data.payslips);
      console.log("Pagination:", response.data.pagination);

      setPayslips(response.data.payslips || []);
      setTotalPayslips(response.data.pagination?.total || 0);
      setHasAttemptedFetch(true);
    } catch (err) {
      console.error("Error fetching payslips:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to load payslips")
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch selected payslip
  const fetchSelectedPayslip = async (payslipId: string) => {
    try {
      const response = await employeeService.getOwnPayslipById(payslipId);
      setSelectedPayslip(response);
    } catch (err) {
      console.error("Error fetching payslip details:", err);
      toast.error("Failed to load payslip details");
    }
  };

  const handleViewPayslip = (payslip: Payslip) => {
    setSelectedPayslip(payslip);
  };

  const handleDownloadPayslip = async (payslip: Payslip) => {
    try {
      setLoading((prev) => ({ ...prev, download: true }));
      await generatePayslipPDF(payslip);
      toast.success("Payslip downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download payslip. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, download: false }));
    }
  };

  const handlePrintPayslip = (payslip: Payslip) => {
    setLoading((prev) => ({ ...prev, print: true }));
    setSelectedPayslip(payslip);

    setTimeout(() => {
      window.print();
      setLoading((prev) => ({ ...prev, print: false }));
    }, 500);
  };

  const handleRefreshPayslips = async () => {
    try {
      setLoading((prev) => ({ ...prev, refresh: true }));
      await fetchPayslips();
      toast.success("Payslips refreshed successfully!");
    } catch (error) {
      console.error("Error refreshing payslips:", error);
      toast.error("Failed to refresh payslips. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, refresh: false }));
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // Don't automatically fetch when page changes
  };

  // Fetch payslips when component mounts
  useEffect(() => {
    fetchPayslips();
  }, []);

  // Only fetch when page changes if we've already attempted a fetch
  useEffect(() => {
    if (hasAttemptedFetch) {
      fetchPayslips();
    }
  }, [page, hasAttemptedFetch]);

  if (error && hasAttemptedFetch) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-4">{error.message}</p>
          <button
            onClick={handleRefreshPayslips}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Payslips</h1>
          <button
            onClick={handleRefreshPayslips}
            disabled={loading.refresh}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            <FiRefreshCw
              className={`${loading.refresh ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {!hasAttemptedFetch ? (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">
              Welcome to Your Payslips
            </h2>
            <p className="text-gray-600 mb-6">
              Click the refresh button above to load your payslips.
            </p>
            <button
              onClick={handleRefreshPayslips}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
            >
              Load My Payslips
            </button>
          </div>
        ) : isLoading ? (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
            <p className="text-gray-600">Loading your payslips...</p>
          </div>
        ) : payslips.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">No Payslips Found</h2>
            <p className="text-gray-600">
              You don't have any payslips available at the moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Payslips List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Payslip History</h2>
                <div className="space-y-4">
                  {payslips.map((payslip: Payslip) => (
                    <div
                      key={payslip._id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">
                            {format(
                              new Date(payslip.period?.startDate || new Date()),
                              "MMMM yyyy"
                            )}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Status:{" "}
                            <span
                              className={`font-medium ${
                                payslip.status === "APPROVED"
                                  ? "text-green-600"
                                  : "text-yellow-600"
                              }`}
                            >
                              {payslip.status}
                            </span>
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewPayslip(payslip)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                            title="View Payslip"
                          >
                            <FiEye />
                          </button>
                          <button
                            onClick={() => handleDownloadPayslip(payslip)}
                            disabled={loading.download}
                            className="p-2 text-green-500 hover:bg-green-50 rounded"
                            title="Download Payslip"
                          >
                            <FiDownload />
                          </button>
                          <button
                            onClick={() => handlePrintPayslip(payslip)}
                            disabled={loading.print}
                            className="p-2 text-purple-500 hover:bg-purple-50 rounded"
                            title="Print Payslip"
                          >
                            <FiPrinter />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Showing {payslips.length} of {totalPayslips} results
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page >= totalPages}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Payslip Details */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Payslip Details</h2>
                {selectedPayslip ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-700">
                        Employee Details
                      </h3>
                      <p className="text-gray-600">
                        {selectedPayslip.employee.name} (
                        {selectedPayslip.employee.employeeId})
                      </p>
                      <p className="text-gray-600">
                        {selectedPayslip.employee.department} -{" "}
                        {selectedPayslip.employee.salaryGrade}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-700">Period</h3>
                      <div className="flex items-center text-gray-600">
                        <FiCalendar className="mr-2" />
                        <span>
                          {selectedPayslip.period?.startDate
                            ? format(
                                new Date(selectedPayslip.period.startDate),
                                "MMM d, yyyy"
                              )
                            : "N/A"}{" "}
                          -{" "}
                          {selectedPayslip.period?.endDate
                            ? format(
                                new Date(selectedPayslip.period.endDate),
                                "MMM d, yyyy"
                              )
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-700">Earnings</h3>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Basic Salary</span>
                          <span className="font-medium">
                            ₦
                            {selectedPayslip.earnings?.basicSalary?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Allowances</span>
                          <span className="font-medium">
                            ₦
                            {selectedPayslip.earnings?.allowances?.totalAllowances?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Bonuses</span>
                          <span className="font-medium">
                            ₦
                            {selectedPayslip.earnings?.bonuses?.totalBonuses?.toLocaleString() ||
                              "0"}
                          </span>
                        </div>
                        <div className="border-t pt-1 flex justify-between font-medium">
                          <span>Total Earnings</span>
                          <span>
                            ₦
                            {selectedPayslip.earnings?.totalEarnings?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-700">Deductions</h3>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tax</span>
                          <span className="font-medium">
                            ₦
                            {selectedPayslip.deductions?.tax?.amount?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Pension</span>
                          <span className="font-medium">
                            ₦
                            {selectedPayslip.deductions?.pension?.amount?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">NHF</span>
                          <span className="font-medium">
                            ₦
                            {selectedPayslip.deductions?.nhf?.amount?.toLocaleString()}
                          </span>
                        </div>
                        <div className="border-t pt-1 flex justify-between font-medium">
                          <span>Total Deductions</span>
                          <span>
                            ₦
                            {selectedPayslip.deductions?.totalDeductions?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Net Pay</span>
                        <span className="text-green-600">
                          ₦{selectedPayslip.totals?.netPay?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <p>Select a payslip to view details</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
