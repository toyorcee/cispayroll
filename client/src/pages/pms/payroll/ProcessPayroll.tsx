import { useState } from "react";
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
  FaPaperPlane,
  FaEdit,
  FaHistory,
  FaFileInvoiceDollar,
} from "react-icons/fa";
import {
  PayrollStatus,
  type PayrollPeriod,
  type PayrollStats,
  type PayrollData,
  type Payslip,
  type PayrollFilters,
} from "../../../types/payroll";
import { departmentService } from "../../../services/departmentService";
import { type Department } from "../../../types/department";
import { type ChartDataset } from "../../../types/chart";
import { payrollService } from "../../../services/payrollService";
import TableSkeleton from "../../../components/skeletons/TableSkeleton";
import { toast } from "react-toastify";
import PayslipDetail from "../../../components/payroll/processpayroll/PayslipDetail";
import { BarChart, LineChart, PieChart } from "../../../components/charts";
import PayrollHistoryModal from "../../../components/payroll/processpayroll/PayrollHistoryModal";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
} from "@mui/material";
import { RunPayrollModal } from "../../../components/payroll/processpayroll/RunPayrollModal";

const statusColors: Record<PayrollStatus, string> = {
  [PayrollStatus.DRAFT]: "bg-gray-100 text-gray-800",
  [PayrollStatus.PENDING]: "bg-yellow-100 text-yellow-800",
  [PayrollStatus.PROCESSING]: "bg-blue-100 text-blue-800",
  [PayrollStatus.APPROVED]: "bg-green-100 text-green-800",
  [PayrollStatus.REJECTED]: "bg-red-100 text-red-800",
  [PayrollStatus.PAID]: "bg-purple-100 text-purple-800",
  [PayrollStatus.CANCELLED]: "bg-gray-100 text-gray-800",
  [PayrollStatus.FAILED]: "bg-red-100 text-red-800",
  [PayrollStatus.ARCHIVED]: "bg-gray-100 text-gray-800",
  [PayrollStatus.COMPLETED]: "bg-green-100 text-green-800",
  [PayrollStatus.PENDING_PAYMENT]: "bg-orange-100 text-orange-800",
};

const statusLabels: Record<PayrollStatus, string> = {
  [PayrollStatus.DRAFT]: "Draft",
  [PayrollStatus.PENDING]: "Pending Review",
  [PayrollStatus.PROCESSING]: "Processing",
  [PayrollStatus.APPROVED]: "Approved",
  [PayrollStatus.REJECTED]: "Rejected",
  [PayrollStatus.PAID]: "Paid",
  [PayrollStatus.CANCELLED]: "Cancelled",
  [PayrollStatus.FAILED]: "Failed",
  [PayrollStatus.ARCHIVED]: "Archived",
  [PayrollStatus.COMPLETED]: "Completed",
  [PayrollStatus.PENDING_PAYMENT]: "Pending Payment",
};

const formatCurrency = (amount: number | undefined) => {
  if (!amount) return "₦0.00";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);
};

interface EmployeePayrollChartsProps {
  employeeData: {
    employeeId: string;
    payrollHistory: PayrollData[];
  };
}

const EmployeePayrollCharts: React.FC<EmployeePayrollChartsProps> = ({
  employeeData,
}) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
    {/* Salary Progression Chart */}
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Salary Progression</h3>
      <LineChart
        data={{
          labels: employeeData.payrollHistory.map(
            (p) =>
              `${new Date(p.year, p.month - 1).toLocaleString("default", {
                month: "short",
              })}/${p.year}`
          ),
          datasets: [
            {
              label: "Net Salary",
              data: employeeData.payrollHistory.map((p) => p.totals.netPay),
              borderColor: "rgb(34 197 94)",
              backgroundColor: "rgba(34, 197, 94, 0.1)",
              tension: 0.4,
            } satisfies ChartDataset,
          ],
        }}
      />
    </div>

    {/* Earnings Breakdown */}
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Current Earnings Breakdown</h3>
      <PieChart
        data={{
          labels: ["Basic Salary", "Allowances", "Deductions"],
          datasets: [
            {
              data: [
                employeeData.payrollHistory[0].totals.basicSalary,
                employeeData.payrollHistory[0].totals.totalAllowances,
                employeeData.payrollHistory[0].totals.totalDeductions,
              ],
              backgroundColor: [
                "rgba(34, 197, 94, 0.8)",
                "rgba(59, 130, 246, 0.8)",
                "rgba(239, 68, 68, 0.8)",
              ],
              borderColor: ["white", "white", "white"],
              borderWidth: 2,
            },
          ],
        }}
      />
    </div>
  </div>
);

interface Statistics {
  totalPayrolls: number;
  processingPayrolls: number;
  completedPayrolls: number;
  failedPayrolls: number;
  approvedPayrolls: number;
  paidPayrolls: number;
  pendingPaymentPayrolls: number;
  processingRate: number;
  completionRate: number;
  failureRate: number;
  approvalRate: number;
  paymentRate: number;
  pendingPaymentRate: number;
  totalAmountApproved: number;
  totalAmountPaid: number;
  totalAmountPending: number;
  totalAmountProcessing: number;
  totalAmountPendingPayment: number;
}

export default function ProcessPayroll() {
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedEmployeeData, setSelectedEmployeeData] = useState<{
    employeeId: string;
    payrollHistory: PayrollData[];
  } | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedEmployeeHistory, setSelectedEmployeeHistory] = useState(null);
  const [showRunPayrollModal, setShowRunPayrollModal] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [selectedPayrollId, setSelectedPayrollId] = useState<string | null>(
    null
  );
  const [selectedPayrollForEdit, setSelectedPayrollForEdit] =
    useState<PayrollData | null>(null);

  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<PayrollFilters>({
    status: "all",
    department: "all",
    frequency: "all",
    dateRange: "last12",
    page: 1,
    limit: 5,
  });

  const approveMutation = useMutation({
    mutationFn: (data: { payrollId: string; remarks?: string }) =>
      payrollService.approvePayroll(data.payrollId, data.remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrollPeriods"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (data: { payrollId: string; remarks: string }) =>
      payrollService.rejectPayroll(data.payrollId, data.remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrollPeriods"] });
      toast.success("Payroll rejected successfully");
    },
  });

  const processPaymentMutation = useMutation({
    mutationFn: (payrollId: string) =>
      payrollService.initiatePayment(payrollId),
    onSuccess: (data) => {
      queryClient.setQueryData(["payrolls", filters], (oldData: any) => {
        if (!oldData?.data?.payrolls) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            payrolls: oldData.data.payrolls.map((payroll: PayrollData) =>
              payroll._id === data.payrollId
                ? { ...payroll, status: "PENDING_PAYMENT" }
                : payroll
            ),
          },
        };
      });
      queryClient.invalidateQueries({ queryKey: ["payrollStatistics"] });
      toast.success("Payment initiated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to initiate payment");
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: (payrollId: string) => payrollService.markAsPaid(payrollId),
    onSuccess: (_, payrollId) => {
      queryClient.setQueryData(["payrolls", filters], (oldData: any) => {
        if (!oldData?.data?.payrolls) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            payrolls: oldData.data.payrolls.map((payroll: PayrollData) =>
              payroll._id === payrollId
                ? { ...payroll, status: PayrollStatus.PAID }
                : payroll
            ),
          },
        };
      });

      queryClient.invalidateQueries({ queryKey: ["payrolls", filters] });
      queryClient.invalidateQueries({ queryKey: ["payrollStatistics"] });
      toast.success("Payment marked as completed successfully");
    },
    onError: (error: any) => {
      queryClient.invalidateQueries({ queryKey: ["payrolls", filters] });
      toast.error(error.message || "Failed to mark payment as completed");
    },
  });

  const markAsFailedMutation = useMutation({
    mutationFn: (payrollId: string) => payrollService.markAsFailed(payrollId),
    onSuccess: (_, payrollId) => {
      queryClient.setQueryData(["payrolls", filters], (oldData: any) => {
        if (!oldData?.data?.payrolls) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            payrolls: oldData.data.payrolls.map((payroll: PayrollData) =>
              payroll._id === payrollId
                ? { ...payroll, status: PayrollStatus.FAILED }
                : payroll
            ),
          },
        };
      });

      queryClient.invalidateQueries({ queryKey: ["payrolls", filters] });
      queryClient.invalidateQueries({ queryKey: ["payrollStatistics"] });
      toast.success("Payment marked as failed successfully");
    },
    onError: (error: any) => {
      queryClient.invalidateQueries({ queryKey: ["payrolls", filters] });
      toast.error(error.message || "Failed to mark payment as failed");
    },
  });

  const { data: payrollsData, isLoading: isPayrollsLoading } = useQuery({
    queryKey: ["payrolls", filters],
    queryFn: () => payrollService.getAllPayrolls(filters),
  });

  const { isLoading: isPeriodsLoading } = useQuery<PayrollPeriod[]>({
    queryKey: ["payrollPeriods"],
    queryFn: () => payrollService.getPayrollPeriods(),
  });

  const { isLoading: isStatsLoading } = useQuery<PayrollStats>({
    queryKey: ["payrollStats"],
    queryFn: () => payrollService.getPayrollStats(),
  });

  const { data: statistics } = useQuery<Statistics>({
    queryKey: ["payrollStatistics"],
    queryFn: () => payrollService.getProcessingStatistics(),
  });

  const handleFilterChange = (
    key: keyof PayrollFilters,
    value: string | number
  ) => {
    setFilters((prev: PayrollFilters) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleViewPayslip = async (payrollId: string) => {
    try {
      const payslipData = await payrollService.viewPayslip(payrollId);
      setSelectedPayslip(payslipData);
      setShowPayslipModal(true);
    } catch (error) {
      console.error("Failed to fetch payslip:", error);
      toast.error("Failed to fetch payslip details");
    }
  };

  const handleViewEmployeeHistory = async (employeeId: string) => {
    try {
      const history = await payrollService.getEmployeePayrollHistory(
        employeeId
      );
      setSelectedEmployeeHistory(history);
      setShowHistoryModal(true);
    } catch (error) {
      console.error("Failed to fetch employee history:", error);
      toast.error("Failed to fetch employee history");
    }
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

  const isLoading = isPeriodsLoading || isStatsLoading;

  const PayrollTable = () => (
    <div className="space-y-4">
      <TableContainer component={Paper} className="rounded-lg shadow">
        <Table>
          <TableHead className="bg-blue-50">
            <TableRow>
              <TableCell className="text-lg font-extrabold text-blue-700 py-5 uppercase tracking-wider">
                Employee Name
              </TableCell>
              <TableCell className="text-lg font-extrabold text-blue-700 py-5 uppercase tracking-wider">
                Salary Grade
              </TableCell>
              <TableCell className="text-lg font-extrabold text-blue-700 py-5 uppercase tracking-wider">
                Net Salary
              </TableCell>
              <TableCell className="text-lg font-extrabold text-blue-700 py-5 uppercase tracking-wider">
                Status
              </TableCell>
              <TableCell className="text-lg font-extrabold text-blue-700 py-5 uppercase tracking-wider">
                Date
              </TableCell>
              <TableCell
                className="text-lg font-extrabold text-blue-700 py-5 uppercase tracking-wider"
                align="center"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(payrollsData?.data?.payrolls ?? []).length > 0 ? (
              payrollsData?.data?.payrolls?.map((payroll: PayrollData) => (
                <TableRow key={payroll._id} className="hover:bg-gray-50">
                  <TableCell>
                    {payroll.employee?.fullName ?? "Unassigned"}
                  </TableCell>
                  <TableCell>{payroll.salaryGrade.level}</TableCell>
                  <TableCell>{formatCurrency(payroll.totals.netPay)}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-sm font-medium ${
                        statusColors[payroll.status]
                      }`}
                    >
                      {statusLabels[payroll.status]}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(payroll.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() =>
                          handleViewEmployeeHistory(payroll.employee?._id ?? "")
                        }
                        className="text-blue-600 hover:text-blue-800"
                        title="View History"
                        disabled={!payroll.employee}
                      >
                        <FaHistory />
                      </button>
                      {payroll.status === PayrollStatus.DRAFT && (
                        <>
                          <button
                            onClick={() => handleSubmitForApproval(payroll._id)}
                            className="text-yellow-600 hover:text-yellow-800"
                            title="Submit for Approval"
                          >
                            <FaPaperPlane />
                          </button>
                          <button
                            onClick={() => handleEditDraft(payroll._id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit Draft"
                          >
                            <FaEdit />
                          </button>
                        </>
                      )}
                      {payroll.status === PayrollStatus.PENDING && (
                        <>
                          <button
                            onClick={() => handleApproveClick(payroll._id)}
                            className="text-green-600 hover:text-green-800"
                            title="Approve Payroll"
                          >
                            <FaCheck />
                          </button>
                          <button
                            onClick={() => handleRejectClick(payroll._id)}
                            className="text-red-600 hover:text-red-800"
                            title="Reject Payroll"
                          >
                            <FaTimes />
                          </button>
                        </>
                      )}
                      {payroll.status === PayrollStatus.PAID && (
                        <button
                          onClick={() => handleViewPayslip(payroll._id)}
                          className="text-green-600 hover:text-green-800"
                          title="View Payslip"
                        >
                          <FaFileInvoiceDollar />
                        </button>
                      )}
                      {payroll.status === PayrollStatus.PROCESSING && (
                        <button
                          onClick={() => handleProcessPayment(payroll._id)}
                          className="flex items-center justify-center p-2 text-green-600 hover:text-white bg-green-50 hover:bg-green-600 rounded-full transition-all duration-200"
                          title="Initiate Payment"
                        >
                          <FaMoneyBill size={20} />
                        </button>
                      )}
                      {payroll.status === PayrollStatus.PENDING_PAYMENT && (
                        <>
                          <button
                            onClick={() => handleMarkAsPaid(payroll._id)}
                            className="flex items-center justify-center p-2 text-green-600 hover:text-white bg-green-50 hover:bg-green-600 rounded-full transition-all duration-200"
                            title="Mark as Paid"
                          >
                            <FaCheck size={20} />
                          </button>
                          <button
                            onClick={() => handleMarkAsFailed(payroll._id)}
                            className="flex items-center justify-center p-2 text-red-600 hover:text-white bg-red-50 hover:bg-red-600 rounded-full transition-all duration-200"
                            title="Mark as Failed"
                          >
                            <FaTimes size={20} />
                          </button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
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

  const {
    data: departments = [] as Department[],
    isLoading: isDepartmentsLoading,
  } = departmentService.useGetDepartments();

  const FiltersSection = () => (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Date Range
          </label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300"
            value={filters.dateRange}
            onChange={(e) => handleFilterChange("dateRange", e.target.value)}
          >
            <option value="last3">Last 3 Months</option>
            <option value="last6">Last 6 Months</option>
            <option value="last12">Last 12 Months</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Department
          </label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300"
            value={filters.department}
            onChange={(e) => handleFilterChange("department", e.target.value)}
            disabled={isDepartmentsLoading}
          >
            <option value="all">All Departments</option>
            {departments.map((dept: Department) => (
              <option key={dept._id} value={dept._id}>
                {dept.name}
              </option>
            ))}
          </select>
          {isDepartmentsLoading && (
            <p className="text-sm text-gray-500 mt-1">Loading departments...</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Frequency
          </label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300"
            value={filters.frequency}
            onChange={(e) => handleFilterChange("frequency", e.target.value)}
          >
            <option value="all">All Frequencies</option>
            <option value="weekly">Weekly</option>
            <option value="bi-weekly">Bi-Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="all">All Statuses</option>
            <option value={PayrollStatus.DRAFT}>Draft</option>
            <option value={PayrollStatus.PENDING}>Pending Review</option>
            <option value={PayrollStatus.PROCESSING}>Processing</option>
            <option value={PayrollStatus.APPROVED}>Approved</option>
            <option value={PayrollStatus.REJECTED}>Rejected</option>
            <option value={PayrollStatus.PAID}>Paid</option>
            <option value={PayrollStatus.CANCELLED}>Cancelled</option>
          </select>
        </div>
      </div>
    </div>
  );

  const handleApproveClick = (payrollId: string) => {
    queryClient.setQueryData(["payrolls", filters], (oldData: any) => {
      if (!oldData?.data?.payrolls) return oldData;
      return {
        ...oldData,
        data: {
          ...oldData.data,
          payrolls: oldData.data.payrolls.map((payroll: PayrollData) =>
            payroll._id === payrollId
              ? { ...payroll, status: PayrollStatus.APPROVED }
              : payroll
          ),
        },
      };
    });

    setSelectedPayrollId(payrollId);
    setShowApproveConfirm(true);
  };

  const handleRejectClick = (payrollId: string) => {
    setSelectedPayrollId(payrollId);
    setShowRejectConfirm(true);
  };

  const handleConfirmApprove = () => {
    if (selectedPayrollId) {
      approveMutation.mutate({ payrollId: selectedPayrollId });
      setShowApproveConfirm(false);
      setSelectedPayrollId(null);
    }
  };

  const handleConfirmReject = () => {
    if (selectedPayrollId) {
      queryClient.setQueryData(["payrolls", filters], (oldData: any) => {
        if (!oldData?.data?.payrolls) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            payrolls: oldData.data.payrolls.map((payroll: PayrollData) =>
              payroll._id === selectedPayrollId
                ? { ...payroll, status: PayrollStatus.REJECTED }
                : payroll
            ),
          },
        };
      });

      rejectMutation.mutate({
        payrollId: selectedPayrollId,
        remarks: "Rejected by admin",
      });

      setShowRejectConfirm(false);
      setSelectedPayrollId(null);
    }
  };

  const handleSubmitForApproval = async (payrollId: string) => {
    try {
      queryClient.setQueryData(["payrolls", filters], (oldData: any) => {
        if (!oldData?.data?.payrolls) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            payrolls: oldData.data.payrolls.map((payroll: PayrollData) =>
              payroll._id === payrollId
                ? { ...payroll, status: PayrollStatus.PENDING }
                : payroll
            ),
          },
        };
      });

      // Submit the payroll
      await payrollService.submitPayroll(payrollId);

      // Invalidate statistics after submitting payroll
      queryClient.invalidateQueries({ queryKey: ["payrollStatistics"] });

      // Show success toast
      toast.success("Payroll submitted for approval successfully");
    } catch (error) {
      // Revert the optimistic update on error
      queryClient.invalidateQueries({ queryKey: ["payrolls", filters] });
      console.error("Failed to submit payroll for approval:", error);
      toast.error("Failed to submit payroll for approval");
    }
  };

  const handleEditDraft = async (payrollId: string) => {
    try {
      const payrollData = await payrollService.getPayrollById(payrollId);
      setSelectedPayrollForEdit(payrollData);
      setShowRunPayrollModal(true);
    } catch (error) {
      console.error("Failed to fetch payroll data:", error);
      toast.error("Failed to open payroll for editing");
    }
  };

  const handleProcessPayment = async (payrollId: string) => {
    try {
      await processPaymentMutation.mutateAsync(payrollId);
    } catch (error) {
      console.error("Failed to process payment:", error);
    }
  };

  const handleMarkAsPaid = (payrollId: string) => {
    markAsPaidMutation.mutate(payrollId);
  };

  const handleMarkAsFailed = (payrollId: string) => {
    markAsFailedMutation.mutate(payrollId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">
          Process Payroll
        </h1>
        <button
          onClick={() => setShowRunPayrollModal(true)}
          className="inline-flex items-center px-4 py-2 !bg-green-600 !text-white rounded-lg hover:bg-green-700 
                   transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg
                   animate-bounce-slow cursor-pointer focus:outline-none focus:ring-0"
        >
          {isLoading ? (
            <FaSpinner className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <FaMoneyBill className="h-5 w-5 mr-2" />
          )}
          Run New Payroll
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          icon={<FaMoneyBill className="h-6 w-6 text-green-600" />}
          title="Total Amount Paid"
          value={formatCurrency(statistics?.totalAmountPaid)}
        />

        <SummaryCard
          icon={<FaFileAlt className="h-6 w-6 text-yellow-600" />}
          title="Processing Payrolls"
          value={statistics?.processingPayrolls?.toString() || "0"}
        />

        <SummaryCard
          icon={<FaExclamationTriangle className="h-6 w-6 text-orange-600" />}
          title="Pending Payment"
          value={statistics?.pendingPaymentPayrolls?.toString() || "0"}
        />
      </div>

      <FiltersSection />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            Payroll Status Distribution
          </h3>
          <PieChart
            data={{
              labels: [
                "Paid",
                "Processing",
                "Pending Payment",
                "Failed",
                "Approved",
              ],
              datasets: [
                {
                  data: [
                    statistics?.paidPayrolls || 0,
                    statistics?.processingPayrolls || 0,
                    statistics?.pendingPaymentPayrolls || 0,
                    statistics?.failedPayrolls || 0,
                    statistics?.approvedPayrolls || 0,
                  ],
                  backgroundColor: [
                    "#42A5F5", // Blue for Paid
                    "#FFA726", // Orange for Processing
                    "#7E57C2", // Purple for Pending Payment
                    "#EF5350", // Red for Failed
                    "#66BB6A", // Green for Approved
                  ],
                  borderColor: ["white", "white", "white", "white", "white"],
                  borderWidth: 2,
                },
              ],
            }}
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Amount Distribution</h3>
          <BarChart
            data={{
              labels: ["Paid", "Pending Payment", "Processing", "Approved"],
              datasets: [
                {
                  label: "Amount",
                  data: [
                    statistics?.totalAmountPaid || 0,
                    statistics?.totalAmountPendingPayment || 0,
                    statistics?.totalAmountProcessing || 0,
                    statistics?.totalAmountApproved || 0,
                  ],
                  backgroundColor: [
                    "#42A5F5", // Blue for Paid
                    "#7E57C2", // Purple for Pending Payment
                    "#FFA726", // Orange for Processing
                    "#66BB6A", // Green for Approved
                  ],
                  borderColor: ["white", "white", "white", "white"],
                  borderWidth: 2,
                },
              ],
            }}
          />
        </div>
      </div>

      {isPayrollsLoading ? <TableSkeleton /> : <PayrollTable />}

      {showPayslipModal && selectedPayslip && (
        <PayslipDetail
          payslip={selectedPayslip}
          onClose={() => {
            setShowPayslipModal(false);
            setSelectedPayslip(null);
          }}
          setPayslip={(value) => {
            if (typeof value === "function") {
              setSelectedPayslip(value);
            } else {
              setSelectedPayslip(value);
            }
          }}
        />
      )}

      {selectedEmployeeData && (
        <div className="relative bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              Employee Payroll Analysis - {selectedEmployeeData.employeeId}
            </h2>
            <button
              onClick={() => setSelectedEmployeeData(null)}
              className="inline-flex items-center px-4 py-2 text-sm text-gray-600 
                         hover:text-gray-800 bg-gray-100 rounded-md 
                         hover:bg-gray-200 transition-colors"
            >
              <span className="mr-2">←</span> Back to Overview
            </button>
          </div>
          <EmployeePayrollCharts employeeData={selectedEmployeeData} />
        </div>
      )}

      <PayrollHistoryModal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setSelectedEmployeeHistory(null);
        }}
        data={selectedEmployeeHistory}
      />

      <RunPayrollModal
        isOpen={showRunPayrollModal}
        onClose={() => {
          setShowRunPayrollModal(false);
          setSelectedPayrollForEdit(null);
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["payrollPeriods"] });
          queryClient.invalidateQueries({ queryKey: ["payrollStats"] });
          queryClient.invalidateQueries({ queryKey: ["payrollStatistics"] });
        }}
        editData={selectedPayrollForEdit}
      />

      <AnimatePresence>
        {showApproveConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-500/75 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-100 rounded-full">
                    <FaCheck className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Confirm Approval
                  </h3>
                </div>
                <p className="text-gray-600 mb-8 text-base leading-relaxed">
                  Are you sure you want to approve this payroll? This action
                  cannot be undone.
                </p>
                <div className="flex justify-end gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowApproveConfirm(false);
                      setSelectedPayrollId(null);
                    }}
                    className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConfirmApprove}
                    className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-lg shadow-green-500/25"
                  >
                    Confirm Approve
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRejectConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-500/75 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-red-100 rounded-full">
                    <FaTimes className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Confirm Rejection
                  </h3>
                </div>
                <p className="text-gray-600 mb-8 text-base leading-relaxed">
                  Are you sure you want to reject this payroll? This action
                  cannot be undone.
                </p>
                <div className="flex justify-end gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowRejectConfirm(false);
                      setSelectedPayrollId(null);
                    }}
                    className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConfirmReject}
                    className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-lg shadow-red-500/25"
                  >
                    Confirm Reject
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
