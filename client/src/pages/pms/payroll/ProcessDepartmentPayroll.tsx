import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaMoneyBill,
  FaSpinner,
  FaExclamationTriangle,
  FaFileAlt,
  FaCheck,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaPaperPlane,
  FaPlus,
} from "react-icons/fa";
import {
  adminPayrollService,
  type AdminPayroll,
  type AdminPayrollPeriod,
  type AdminPayrollStats,
  type AdminPayrollResponse,
} from "../../../services/adminPayrollService";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
} from "@mui/material";
import { PayrollData, PayrollStatus } from "../../../types/payroll";
import PayrollDetailsModal from "../../../components/payroll/processpayroll/admin/PayrollDetailsModal";
import SingleEmployeeProcessModal from "../../../components/payroll/processpayroll/admin/SingleEmployeeProcessModal";
import { SuccessAnimation } from "../../../components/payroll/processpayroll/admin/SuccessAnimation";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  PAID: "bg-purple-100 text-purple-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  PENDING: "Pending Review",
  PROCESSING: "Processing",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

const formatCurrency = (amount: number | undefined) => {
  if (!amount) return "₦0.00";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);
};

interface SummaryCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
}

const SummaryCard = ({ icon, title, value }: SummaryCardProps) => (
  <div className="bg-white overflow-hidden shadow rounded-lg transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-lg cursor-pointer">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0">{icon}</div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="text-lg font-medium text-gray-900">{value}</dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
);

const ProcessDepartmentPayroll = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollData | null>(
    null
  );
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [selectedPayrollId, setSelectedPayrollId] = useState<string | null>(
    null
  );
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: "all",
  });
  const [showSingleProcessModal, setShowSingleProcessModal] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [processingType, setProcessingType] = useState<
    "single" | "multiple" | "department"
  >("single");
  const [processingResults, setProcessingResults] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [payrollProcessed, setPayrollProcessed] = useState(false);

  useEffect(() => {
    if (payrollProcessed) {
      queryClient.invalidateQueries({ queryKey: ["adminPayrolls"] });
      queryClient.invalidateQueries({ queryKey: ["departmentPayrollStats"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setPayrollProcessed(false);
    }
  }, [payrollProcessed, queryClient]);

  const handlePayrollSuccess = () => {
    setPayrollProcessed(true);
  };

  console.log("Component rendering");

  const {
    data: payrollsData,
    isLoading,
    error,
  } = useQuery<AdminPayrollResponse>({
    queryKey: ["adminPayrolls"],
    queryFn: async () => {
      const response = await adminPayrollService.getDepartmentPayrolls();
      return response;
    },
  });

  console.log("Current state:", { isLoading, error, data: payrollsData });

  const { data: payrollPeriods, isLoading: isPeriodsLoading } = useQuery({
    queryKey: ["departmentPayrollPeriods"],
    queryFn: () => adminPayrollService.getPayrollPeriods(),
  });

  const { data: payrollStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["departmentPayrollStats"],
    queryFn: () => {
      return adminPayrollService.getPayrollStats().then((stats) => {
        console.log("Payroll Stats:", stats);
        return stats;
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: (payrollId: string) =>
      adminPayrollService.submitPayroll(payrollId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPayrolls"] });
      toast.success("Payroll submitted for approval");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit payroll");
    },
  });

  const handleSubmit = (payrollId: string) => {
    if (
      window.confirm(
        "Are you sure you want to submit this payroll for approval?"
      )
    ) {
      submitMutation.mutate(payrollId);
    }
  };

  const handleViewDetails = (payroll: PayrollData) => {
    setSelectedPayroll(payroll);
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleSinglePayrollSubmit = async (data: {
    employeeIds: string[];
    month: number;
    year: number;
    frequency: string;
    salaryGrade?: string;
  }) => {
    setIsProcessing(true);
    setShowSuccessAnimation(true);
    setProcessingType(data.employeeIds.length === 1 ? "single" : "multiple");

    try {
      if (data.employeeIds.length === 1) {
        // Process single employee
        const result = await adminPayrollService.processSingleEmployeePayroll({
          employeeId: data.employeeIds[0],
          month: data.month,
          year: data.year,
          frequency: data.frequency,
          salaryGrade: data.salaryGrade,
        });
        setProcessingResults({ total: 1, processed: 1, skipped: 0, failed: 0 });

        // Wait for animation to complete (4 seconds)
        await new Promise((resolve) => setTimeout(resolve, 4000));

        toast.success("Payroll processed successfully");
        setPayrollProcessed(true);
        setShowSingleProcessModal(false);
      } else {
        // Process multiple employees
        const result =
          await adminPayrollService.processMultipleEmployeesPayroll({
            employeeIds: data.employeeIds,
            month: data.month,
            year: data.year,
            frequency: data.frequency,
          });
        setProcessingResults(result);

        // Wait for animation to complete (4 seconds)
        await new Promise((resolve) => setTimeout(resolve, 4000));

        // Show appropriate toast based on results
        if (result.processed > 0) {
          toast.success(`Successfully processed ${result.processed} payrolls`);
        } else {
          toast.warning("No payrolls were processed");
        }

        setPayrollProcessed(true);
        setShowSingleProcessModal(false);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to process payroll");
    } finally {
      setIsProcessing(false);
      // Hide animation after 5 seconds
      setTimeout(() => {
        setShowSuccessAnimation(false);
      }, 5000);
    }
  };

  const handleProcessDepartmentPayroll = async (data: {
    month: number;
    year: number;
    frequency: string;
  }) => {
    setIsProcessing(true);
    setShowSuccessAnimation(true);
    setProcessingType("department");

    try {
      const result = await adminPayrollService.processDepartmentPayroll({
        month: data.month,
        year: data.year,
        frequency: data.frequency,
      });
      setProcessingResults(result);

      // Show appropriate toast based on results
      if (Array.isArray(result) && result.length > 0) {
        toast.success(
          `Successfully processed ${result.length} department payrolls`
        );
      } else {
        toast.warning("No department payrolls were processed");
      }

      // Invalidate and refetch the payrolls query to refresh the table
      queryClient.invalidateQueries({ queryKey: ["adminPayrolls"] });
      queryClient.invalidateQueries({ queryKey: ["departmentPayrollStats"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to process department payroll");
    } finally {
      setIsProcessing(false);
      // Hide animation after 3 seconds
      setTimeout(() => {
        setShowSuccessAnimation(false);
      }, 3000);
    }
  };

  const isLoadingCombined = isPeriodsLoading || isStatsLoading || isLoading;

  const payrolls = payrollsData?.data?.payrolls ?? [];

  const PayrollTable = () => (
    <div className="space-y-4 mt-5">
      <TableContainer component={Paper} className="rounded-lg shadow">
        <Table>
          <TableHead className="bg-green-600">
            <TableRow>
              <TableCell className="!text-white font-semibold">
                Employee
              </TableCell>
              <TableCell className="!text-white font-semibold">
                Department
              </TableCell>
              <TableCell className="!text-white font-semibold">
                Basic Salary
              </TableCell>
              <TableCell className="!text-white font-semibold">
                Allowances
              </TableCell>
              <TableCell className="!text-white font-semibold">
                Deductions
              </TableCell>
              <TableCell className="!text-white font-semibold">
                Net Pay
              </TableCell>
              <TableCell className="!text-white font-semibold">
                Status
              </TableCell>
              <TableCell className="!text-white font-semibold">
                Period
              </TableCell>
              <TableCell className="!text-white font-semibold" align="center">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payrolls.length > 0 ? (
              payrolls.map((payroll) => (
                <TableRow
                  key={payroll._id}
                  className="hover:bg-green-50 transition-colors duration-150"
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">
                        {payroll.employee.fullName}
                      </span>
                      <span className="text-sm text-gray-500">
                        {payroll.employee.employeeId}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                      {payroll.department.name}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    ₦{payroll.totals.basicSalary.toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium">
                    ₦{payroll.totals.totalAllowances.toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium">
                    ₦{payroll.totals.totalDeductions.toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium text-green-600">
                    ₦{payroll.totals.netPay.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        payroll.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : payroll.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : payroll.status === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {payroll.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>
                        {new Date(payroll.periodStart).toLocaleDateString()}
                      </span>
                      <span>
                        {new Date(payroll.periodEnd).toLocaleDateString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell align="center">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleViewDetails(payroll)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors duration-150"
                        title="View Details"
                      >
                        <FaEye className="w-4 h-4" />
                      </button>

                      {payroll.status === "DRAFT" && (
                        <button
                          onClick={() => handleSubmit(payroll._id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors duration-150"
                          title="Submit for Approval"
                        >
                          <FaPaperPlane className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No payrolls found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {payrollsData?.data?.pagination && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6 rounded-b-lg">
          <div className="flex justify-between flex-1 sm:hidden">
            <button
              onClick={() => handlePageChange(filters.page - 1)}
              disabled={filters.page === 1}
              className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(filters.page + 1)}
              disabled={filters.page === payrollsData?.data?.pagination?.pages}
              className="relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>

          <div>
            <p className="text-sm text-gray-700">
              Showing{" "}
              <span className="font-medium">
                {(filters.page - 1) * filters.limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(
                  filters.page * filters.limit,
                  payrollsData?.data?.pagination?.total
                )}
              </span>{" "}
              of{" "}
              <span className="font-medium">
                {payrollsData?.data?.pagination?.total}
              </span>{" "}
              results
            </p>
          </div>

          <nav
            className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
            aria-label="Pagination"
          >
            <button
              onClick={() => handlePageChange(filters.page - 1)}
              disabled={filters.page === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Previous</span>
              <FaChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            {[...Array(payrollsData?.data?.pagination?.pages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => handlePageChange(i + 1)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  filters.page === i + 1
                    ? "z-10 bg-green-50 border-green-500 text-green-600"
                    : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(filters.page + 1)}
              disabled={filters.page === payrollsData?.data?.pagination?.pages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Next</span>
              <FaChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      )}
    </div>
  );

  if (isLoadingCombined) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    console.error("Query error:", error);
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        Error loading payrolls
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Department Payrolls
        </h1>
        <p className="text-gray-600 mt-1">
          Manage and process payrolls for your department
        </p>
      </div>

      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowSingleProcessModal(true)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
        >
          <FaPlus className="mr-2" />
          Process Payroll
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={<FaMoneyBill className="h-6 w-6 text-green-600" />}
          title={`Total Payroll Amount (${
            payrollStats?.PAID || 0
          } paid payrolls)`}
          value={formatCurrency(payrollStats?.totalAmount)}
        />

        <SummaryCard
          icon={<FaFileAlt className="h-6 w-6 text-yellow-600" />}
          title="Pending Payrolls"
          value={payrollStats?.PENDING?.toString() || "0"}
        />

        <SummaryCard
          icon={<FaCheck className="h-6 w-6 text-green-600" />}
          title="Approved Payrolls"
          value={payrollStats?.APPROVED?.toString() || "0"}
        />

        <SummaryCard
          icon={<FaTimes className="h-6 w-6 text-red-600" />}
          title="Rejected Payrolls"
          value={payrollStats?.REJECTED?.toString() || "0"}
        />

        <SummaryCard
          icon={<FaMoneyBill className="h-6 w-6 text-purple-600" />}
          title="Paid Payrolls"
          value={payrollStats?.PAID?.toString() || "0"}
        />

        <SummaryCard
          icon={<FaFileAlt className="h-6 w-6 text-blue-600" />}
          title="Total Payrolls"
          value={payrollStats?.total?.toString() || "0"}
        />
      </div>

      <PayrollTable />

      {/* Payroll Details Modal */}
      {selectedPayroll && (
        <PayrollDetailsModal
          payroll={selectedPayroll}
          onClose={() => setSelectedPayroll(null)}
        />
      )}

      {/* Single Employee Process Modal */}
      <SingleEmployeeProcessModal
        isOpen={showSingleProcessModal}
        onClose={() => setShowSingleProcessModal(false)}
        onSubmit={handleSinglePayrollSubmit}
        onSuccess={handlePayrollSuccess}
      />

      {/* Success Animation */}
      {showSuccessAnimation && (
        <SuccessAnimation
          type={processingType}
          results={processingResults}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
};

export default ProcessDepartmentPayroll;
