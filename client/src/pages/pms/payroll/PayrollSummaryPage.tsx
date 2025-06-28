import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaFilter,
  FaDownload,
  FaEye,
  FaUsers,
  FaDollarSign,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaUserCheck,
  FaUserTimes,
  FaUserMinus,
  FaFileAlt,
  FaCrown,
  FaShieldAlt,
  FaArrowLeft,
  FaArrowRight,
  FaTimes,
  FaPrint,
  FaFilePdf,
} from "react-icons/fa";
import { useAuth } from "../../../context/AuthContext";
import PayrollSummaryService, {
  PayrollSummaryFilters,
  PayrollSummary,
} from "../../../services/payrollSummaryService";
import { generatePayrollSummaryPDF } from "../../../utils/payrollSummaryPdf";

interface BatchDetailModalProps {
  summary: PayrollSummary | null;
  isOpen: boolean;
  onClose: () => void;
}

const BatchDetailModal: React.FC<BatchDetailModalProps> = ({
  summary,
  isOpen,
  onClose,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user, isSuperAdmin } = useAuth();

  if (!summary) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatProcessingTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <FaCheckCircle className="w-4 h-4 text-green-500" />;
      case "skipped":
        return <FaExclamationTriangle className="w-4 h-4 text-yellow-500" />;
      case "failed":
        return <FaTimesCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FaClock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-600 bg-green-50 border-green-200";
      case "skipped":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "failed":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  // Helper function to get employee ID string
  const getEmployeeId = (
    employeeId:
      | string
      | {
          _id: string;
          employeeId: string;
          firstName: string;
          lastName: string;
          email: string;
          fullName: string;
        }
  ) => {
    return typeof employeeId === "string" ? employeeId : employeeId.employeeId;
  };

  // Helper function to get department name
  const getDepartmentName = (
    department: string | { _id: string; name: string; code: string }
  ) => {
    return typeof department === "string" ? department : department.name;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-2xl font-bold">Batch Details</h1>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring" }}
                      className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
                        isSuperAdmin()
                          ? "bg-purple-500/30 text-purple-100"
                          : "bg-blue-500/30 text-blue-100"
                      }`}
                    >
                      {isSuperAdmin() ? (
                        <>
                          <FaCrown className="w-3 h-3" />
                          <span>Super Admin</span>
                        </>
                      ) : (
                        <>
                          <FaShieldAlt className="w-3 h-3" />
                          <span>Admin</span>
                        </>
                      )}
                    </motion.div>
                  </div>
                  <p className="text-blue-100 mt-1">
                    {summary.month}/{summary.year} • {summary.frequency}
                    {!isSuperAdmin() && user?.department && (
                      <span className="ml-2 text-blue-200">
                        •{" "}
                        {typeof user.department === "object"
                          ? user.department.name
                          : user.department}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
                  >
                    <FaPrint className="w-4 h-4" />
                    <span>Print</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Batch Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700">
                        Processed
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {summary.processed}
                      </p>
                    </div>
                    <FaUserCheck className="w-8 h-8 text-green-500" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-700">
                        Skipped
                      </p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {summary.skipped}
                      </p>
                    </div>
                    <FaUserMinus className="w-8 h-8 text-yellow-500" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-700">Failed</p>
                      <p className="text-2xl font-bold text-red-600">
                        {summary.failed}
                      </p>
                    </div>
                    <FaUserTimes className="w-8 h-8 text-red-500" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">
                        Total Amount
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(summary.totalNetPay)}
                      </p>
                    </div>
                    <FaDollarSign className="w-8 h-8 text-blue-500" />
                  </div>
                </motion.div>
              </div>

              {/* Processing Time */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="mb-8 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FaClock className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">
                      Processing Time
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-gray-800">
                    {formatProcessingTime(summary.processingTime)}
                  </span>
                </div>
              </motion.div>

              {/* Employee Details */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaUsers className="w-5 h-5 mr-2" />
                  Employee Details
                </h3>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Employee
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Department
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Net Pay
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {summary.employeeDetails.map((employee, index) => (
                          <motion.tr
                            key={employee._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {employee.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {getEmployeeId(employee.employeeId)}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(employee.status)}
                                <span
                                  className={`text-sm font-medium px-2 py-1 rounded-full border ${getStatusColor(
                                    employee.status
                                  )}`}
                                >
                                  {employee.status.toUpperCase()}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {getDepartmentName(employee.department)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(employee.netPay)}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Errors and Warnings */}
              {(summary.errors.length > 0 || summary.warnings.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {summary.errors.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <FaTimesCircle className="w-5 h-5 mr-2 text-red-500" />
                        Errors ({summary.errors.length})
                      </h3>
                      <div className="space-y-3">
                        {summary.errors.map((error, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-red-50 border border-red-200 rounded-lg p-4"
                          >
                            <div className="flex items-start space-x-3">
                              <FaTimesCircle className="w-5 h-5 text-red-500 mt-0.5" />
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-red-800">
                                  {error.type}
                                </h4>
                                <p className="text-sm text-red-700 mt-1">
                                  {error.message}
                                </p>
                                <p className="text-xs text-red-500 mt-1">
                                  Code: {error.code}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {summary.warnings.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <FaExclamationTriangle className="w-5 h-5 mr-2 text-yellow-500" />
                        Warnings ({summary.warnings.length})
                      </h3>
                      <div className="space-y-3">
                        {summary.warnings.map((warning, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
                          >
                            <div className="flex items-start space-x-3">
                              <FaExclamationTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-yellow-800">
                                  {warning.type}
                                </h4>
                                <p className="text-sm text-yellow-700 mt-1">
                                  {warning.message}
                                </p>
                                <p className="text-xs text-yellow-500 mt-1">
                                  Code: {warning.code}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const PayrollSummaryPage: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<PayrollSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSummary, setSelectedSummary] = useState<PayrollSummary | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState<PayrollSummaryFilters>({
    month: undefined,
    year: undefined,
    frequency: "",
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatBatchId = (batchId: string) => {
    const parts = batchId.split("_");
    if (parts.length >= 2) {
      return (
        <div className="text-xs">
          <div className="font-mono text-gray-900">{parts[0]}</div>
          <div className="font-mono text-gray-500">{parts[1]}</div>
        </div>
      );
    }
    return <span className="font-mono text-xs text-gray-900">{batchId}</span>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const loadSummaries = async () => {
    try {
      setLoading(true);
      console.log("🔍 Loading payroll summaries with filters:", filters);

      const response = await PayrollSummaryService.getAllSummaries(filters);
      console.log("✅ Payroll summaries loaded:", response);
      console.log(
        "📊 Response data structure:",
        JSON.stringify(response.data, null, 2)
      );
      console.log(
        "📊 First summary structure:",
        response.data[0] ? JSON.stringify(response.data[0], null, 2) : "No data"
      );

      setSummaries(response.data);
      setPagination({
        page: response.pagination.currentPage,
        limit: response.pagination.itemsPerPage,
        total: response.pagination.totalItems,
      });
      setError(null);
    } catch (err: any) {
      console.error("❌ Error loading summaries:", err);
      setError(err.message || "Failed to load payroll summaries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummaries();
  }, [filters]);

  const handleRowClick = async (summary: PayrollSummary) => {
    try {
      console.log("🔍 Loading batch details for:", summary.batchId);
      console.log(
        "📊 Summary object structure:",
        JSON.stringify(summary, null, 2)
      );

      const detailedSummary = await PayrollSummaryService.getSummaryByBatchId(
        summary.batchId
      );
      console.log("✅ Batch details loaded:", detailedSummary);
      console.log(
        "📊 Detailed summary structure:",
        JSON.stringify(detailedSummary, null, 2)
      );

      setSelectedSummary(detailedSummary);
      setIsModalOpen(true);
    } catch (err: any) {
      console.error("❌ Error loading batch details:", err);
      setError(err.message || "Failed to load batch details");
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]:
        key === "month" || key === "year"
          ? value
            ? parseInt(value)
            : undefined
          : value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const exportToCSV = () => {
    if (summaries.length === 0) return;

    const headers = [
      "Batch ID",
      "Month/Year",
      "Frequency",
      "Processed",
      "Skipped",
      "Failed",
      "Total Amount",
      "Processing Time",
      "Created At",
    ];

    const data = summaries.map((summary) => [
      summary.batchId,
      `${summary.month}/${summary.year}`,
      summary.frequency,
      summary.processed,
      summary.skipped,
      summary.failed,
      formatCurrency(summary.totalNetPay),
      `${summary.processingTime}ms`,
      formatDate(summary.createdAt),
    ]);

    const csvContent = [headers, ...data]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-summaries-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading && summaries.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading payroll summaries...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                <FaFileAlt className="w-8 h-8 mr-3 text-blue-600" />
                Payroll Processing Summary
              </h1>
              <p className="text-gray-600">
                View and manage payroll processing summaries and batch details
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={exportToCSV}
                className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <FaDownload className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() =>
                  generatePayrollSummaryPDF(
                    summaries,
                    filters,
                    user?.role || "User"
                  )
                }
                className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <FaFilePdf className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">
                    Total Batches
                  </p>
                  <p className="text-3xl font-bold">{summaries.length}</p>
                </div>
                <FaFileAlt className="w-8 h-8 text-blue-200" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">
                    Total Processed
                  </p>
                  <p className="text-3xl font-bold">
                    {summaries.reduce((sum, s) => sum + s.processed, 0)}
                  </p>
                </div>
                <FaUserCheck className="w-8 h-8 text-green-200" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">
                    Total Amount
                  </p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(
                      summaries.reduce((sum, s) => sum + s.totalNetPay, 0)
                    )}
                  </p>
                </div>
                <FaDollarSign className="w-8 h-8 text-purple-200" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">
                    Avg Processing Time
                  </p>
                  <p className="text-3xl font-bold">
                    {summaries.length > 0
                      ? `${(
                          summaries.reduce(
                            (sum, s) => sum + s.processingTime,
                            0
                          ) /
                          summaries.length /
                          1000
                        ).toFixed(1)}s`
                      : "0s"}
                  </p>
                </div>
                <FaClock className="w-8 h-8 text-orange-200" />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FaFilter className="w-5 h-5 mr-2 text-blue-600" />
              Filters
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Month
              </label>
              <select
                value={filters.month || ""}
                onChange={(e) => handleFilterChange("month", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Months</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>
                    {new Date(2024, month - 1).toLocaleDateString("en-US", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <select
                value={filters.year || ""}
                onChange={(e) => handleFilterChange("year", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Years</option>
                {Array.from(
                  { length: 5 },
                  (_, i) => new Date().getFullYear() - i
                ).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frequency
              </label>
              <select
                value={filters.frequency || ""}
                onChange={(e) =>
                  handleFilterChange("frequency", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Frequencies</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() =>
                  setFilters({
                    month: undefined,
                    year: undefined,
                    frequency: "",
                    page: 1,
                    limit: 20,
                  })
                }
                className="w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center space-x-3">
              <FaTimesCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Frequency
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Processed
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Processing Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {summaries.map((summary, index) => (
                  <motion.tr
                    key={summary._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer transition-all duration-200"
                    onClick={() => handleRowClick(summary)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatBatchId(summary.batchId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {summary.month}/{summary.year}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {typeof summary.frequency === "string"
                          ? summary.frequency
                          : "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <span className="font-medium text-green-600">
                          {typeof summary.processed === "number"
                            ? summary.processed
                            : 0}
                        </span>
                        {summary.skipped > 0 && (
                          <span className="text-yellow-600 ml-1">
                            +{summary.skipped} skipped
                          </span>
                        )}
                        {summary.failed > 0 && (
                          <span className="text-red-600 ml-1">
                            +{summary.failed} failed
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(
                        typeof summary.totalNetPay === "number"
                          ? summary.totalNetPay
                          : 0
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {typeof summary.processingTime === "number"
                        ? summary.processingTime < 1000
                          ? `${summary.processingTime}ms`
                          : `${(summary.processingTime / 1000).toFixed(1)}s`
                        : "0ms"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {typeof summary.createdAt === "string"
                        ? formatDate(summary.createdAt)
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(summary);
                          }}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {summaries.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-blue-100 rounded-full flex items-center justify-center mb-4">
                <FaFileAlt className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No payroll summaries found
              </h3>
              <p className="text-gray-500">
                {Object.values(filters).some(
                  (f) => f !== "" && f !== 1 && f !== 20 && f !== undefined
                )
                  ? "Try adjusting your filters to find more results."
                  : "No payroll summaries are available at the moment."}
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-8 flex items-center justify-between bg-white rounded-xl shadow-lg p-4"
          >
            <div className="text-sm text-gray-700">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FaArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              <span className="px-3 py-2 text-sm font-medium text-gray-700">
                Page {pagination.page} of{" "}
                {Math.ceil(pagination.total / pagination.limit)}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={
                  pagination.page >=
                  Math.ceil(pagination.total / pagination.limit)
                }
                className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>Next</span>
                <FaArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Batch Detail Modal */}
      <BatchDetailModal
        summary={selectedSummary}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSummary(null);
        }}
      />
    </div>
  );
};

export default PayrollSummaryPage;
