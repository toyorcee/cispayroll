import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  FaExclamationTriangle,
  FaCheck,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaHistory,
  FaFileInvoiceDollar,
  FaRocket,
  FaCreditCard,
  FaDownload,
  FaFilePdf,
  FaPrint,
  FaEnvelope,
  FaFileCsv,
  FaClock,
} from "react-icons/fa";
import {
  PayrollStatus,
  type PayrollData,
  type Payslip,
  type PayrollFilters,
} from "../../../types/payroll";
import { departmentService } from "../../../services/departmentService";
import { type Department } from "../../../types/department";
import { type ChartDataset } from "../../../types/chart";
import { payrollService } from "../../../services/payrollService";
import { adminPayrollService } from "../../../services/adminPayrollService";
import payrollReportService from "../../../services/payrollReportService";
import { useAuth } from "../../../context/AuthContext";
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
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";

// Constants for styling
const MAIN_GREEN = "#22c55e";
const LIGHT_GREEN_ACCENT = "#16a34a";
const MAIN_PURPLE = "#8b5cf6";
const LIGHT_PURPLE_ACCENT = "#7c3aed";
const MAIN_BLUE = "#3b82f6";

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

function getEmployeeName(employee: any) {
  if (!employee) return "Unknown Employee";
  if (employee.fullName) return employee.fullName;
  if (employee.firstName && employee.lastName)
    return `${employee.firstName} ${employee.lastName}`;
  return "Unknown Employee";
}

export default function ProcessPayment() {
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedEmployeeData, setSelectedEmployeeData] = useState<{
    employeeId: string;
    payrollHistory: PayrollData[];
  } | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedEmployeeHistory, setSelectedEmployeeHistory] = useState(null);
  const [selectedPayrolls, setSelectedPayrolls] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [filteredPayrolls, setFilteredPayrolls] = useState<PayrollData[]>([]);
  const [isSelectingByStatus, setIsSelectingByStatus] = useState<{
    [key in PayrollStatus]?: boolean;
  }>({});
  const [isPayslipLoading, setIsPayslipLoading] = useState(false);
  const [loadingPayslipId, setLoadingPayslipId] = useState<string | null>(null);

  // Confirmation dialog state
  const [showPaymentConfirmDialog, setShowPaymentConfirmDialog] =
    useState(false);
  const [selectedPaymentPayroll, setSelectedPaymentPayroll] =
    useState<PayrollData | null>(null);
  const [paymentAction, setPaymentAction] = useState<"initiate" | "process">(
    "initiate"
  );

  // Batch confirmation dialog state
  const [showBatchConfirmDialog, setShowBatchConfirmDialog] = useState(false);
  const [batchPayrollIds, setBatchPayrollIds] = useState<string[]>([]);
  const [batchPayrollCount, setBatchPayrollCount] = useState(0);
  const [batchAction, setBatchAction] = useState<
    "initiate" | "markPaid" | "markFailed" | "sendPayslips"
  >("initiate");

  // Single action confirmation dialog state
  const [showSingleConfirmDialog, setShowSingleConfirmDialog] = useState(false);
  const [singleAction, setSingleAction] = useState<"markPaid" | "markFailed">(
    "markPaid"
  );
  const [singlePayrollId, setSinglePayrollId] = useState<string>("");
  const [singlePayrollData, setSinglePayrollData] =
    useState<PayrollData | null>(null);

  // Report download and email state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({
    recipientEmail: "",
    subject: "",
    message: "",
    format: "pdf" as "pdf" | "csv",
  });
  const [reportLoading, setReportLoading] = useState(false);

  // Batch result modal state
  const [batchResult, setBatchResult] = useState<null | {
    successes: Array<{ payrollId: string; employee: string; amount?: number }>;
    failures: Array<{
      payrollId: string;
      employee: string;
      error: string;
      amount?: number;
    }>;
  }>(null);

  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [filters, setFilters] = useState<PayrollFilters>({
    status: "all",
    department: "all",
    frequency: "all",
    dateRange: "last12",
    page: 1,
    limit: 5,
  });

  const processPaymentMutation = useMutation({
    mutationFn: (payrollId: string) => {
      // Use Super Admin endpoint for payment initiation
      return adminPayrollService.initiatePayment(payrollId, user?.role);
    },
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: ["payrolls", filters] });
      queryClient.invalidateQueries({ queryKey: ["payrollStatistics"] });
      toast.success("Payment initiation completed");
      resetSelectionStates();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to initiate payment");
    },
  });

  const batchProcessPaymentMutation = useMutation({
    mutationFn: (payrollIds: string[]) => {
      // Use Super Admin endpoint for batch payment initiation
      return adminPayrollService.initiatePaymentsMultiple(
        payrollIds,
        user?.role
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["payrolls", filters] });
      queryClient.invalidateQueries({ queryKey: ["payrollStatistics"] });

      console.log("🟢 Frontend received response:", data);

      // Transform backend response to frontend format
      const allPayrolls = payrollsData?.data?.payrolls || [];

      // Map successful payrolls
      const successes = (data.payrolls || []).map((payroll: any) => {
        const originalPayroll = allPayrolls.find(
          (p: PayrollData) => p._id === payroll.payrollId
        );
        return {
          payrollId: payroll.payrollId,
          employee: originalPayroll?.employee?.fullName || "Unknown Employee",
          amount: originalPayroll?.totals?.netPay,
        };
      });

      // Map failed payrolls
      const failures = (data.errors || []).map((error: any) => {
        const originalPayroll = allPayrolls.find(
          (p: PayrollData) => p._id === error.payrollId
        );
        return {
          payrollId: error.payrollId,
          employee: originalPayroll?.employee?.fullName || "Unknown Employee",
          error: error.error,
          amount: originalPayroll?.totals?.netPay,
        };
      });

      // Show batch result modal
      setBatchResult({
        successes,
        failures,
      });

      resetSelectionStates();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to initiate batch payment");
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: (payrollId: string) => payrollService.markAsPaid(payrollId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrolls", filters] });
      queryClient.invalidateQueries({ queryKey: ["payrollStatistics"] });
      toast.success("Payment marked as completed successfully");
      resetSelectionStates();
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
      resetSelectionStates();
    },
    onError: (error: any) => {
      queryClient.invalidateQueries({ queryKey: ["payrolls", filters] });
      toast.error(error.message || "Failed to mark payment as failed");
    },
  });

  const batchMarkAsPaidMutation = useMutation({
    mutationFn: (payrollIds: string[]) => {
      return payrollService.markPaymentsPaidBatch(payrollIds);
    },
    onSuccess: (data) => {
      console.log("✅ Success response:", data);
      if (!data || !data.payrolls) {
        console.error("❌ Invalid response data:", data);
        toast.error("Invalid response from server");
        return;
      }

      const updatedIds = data.payrolls.map(
        (p: { payrollId: string }) => p.payrollId
      );
      console.log("✅ Updated payroll IDs:", updatedIds);

      // Update the local cache
      queryClient.setQueryData(["payrolls", filters], (oldData: any) => {
        if (!oldData?.data?.payrolls) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            payrolls: oldData.data.payrolls.map((payroll: PayrollData) =>
              updatedIds.includes(payroll._id)
                ? { ...payroll, status: PayrollStatus.PAID }
                : payroll
            ),
          },
        };
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["payrolls", filters] });
      queryClient.invalidateQueries({ queryKey: ["payrollStatistics"] });

      // Show success message
      toast.success(
        updatedIds.length === 1
          ? "Payment marked as completed successfully"
          : `Successfully marked ${updatedIds.length} payments as completed`
      );

      // Reset selection states
      resetSelectionStates();
    },
    onError: (error: any) => {
      console.error("❌ Batch mark as paid error:", error);
      console.error("❌ Error response:", error.response?.data);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to mark batch as paid";
      toast.error(errorMessage);
    },
  });

  const batchMarkAsFailedMutation = useMutation({
    mutationFn: (payrollIds: string[]) =>
      payrollService.markPaymentsFailedBatch(payrollIds),
    onSuccess: (data) => {
      const updatedIds = Array.isArray(data.payrolls)
        ? data.payrolls.map((p: { payrollId: string }) => p.payrollId)
        : [];
      queryClient.setQueryData(["payrolls", filters], (oldData: any) => {
        if (!oldData?.data?.payrolls) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            payrolls: oldData.data.payrolls.map((payroll: PayrollData) =>
              updatedIds.includes(payroll._id)
                ? { ...payroll, status: PayrollStatus.FAILED }
                : payroll
            ),
          },
        };
      });
      queryClient.invalidateQueries({ queryKey: ["payrolls", filters] });
      queryClient.invalidateQueries({ queryKey: ["payrollStatistics"] });
      toast.success("Batch payments marked as failed successfully");
      resetSelectionStates();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to mark batch as failed");
    },
  });

  const sendMultiplePayslipsMutation = useMutation({
    mutationFn: (payrollIds: string[]) =>
      payrollService.sendMultiplePayslipsEmail(payrollIds),
    onSuccess: (data) => {
      console.log("✅ Send payslips response:", data);
      toast.success(data.message || "Payslips sent successfully");
      resetSelectionStates();
    },
    onError: (error: any) => {
      console.error("❌ Error sending payslips:", error);
      toast.error(error.message || "Failed to send payslips");
    },
  });

  const { data: payrollsData, isLoading: isPayrollsLoading } = useQuery({
    queryKey: ["payrolls", filters],
    queryFn: () => payrollService.getAllPayrolls(filters),
  });

  const { data: statistics } = useQuery<Statistics>({
    queryKey: ["payrollStatistics"],
    queryFn: () => payrollService.getProcessingStatistics(),
  });

  useEffect(() => {
    console.log("All payrolls:", payrollsData?.data?.payrolls); // Log all fetched payrolls
    console.log("Current filters:", filters);

    const filtered =
      payrollsData?.data?.payrolls?.filter((payroll) => {
        const matchesStatus =
          !filters.status || payroll.status === filters.status;
        const matchesSearch =
          !filters.search ||
          payroll.employee.fullName
            ?.toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          payroll.employee.employeeId
            ?.toLowerCase()
            .includes(filters.search.toLowerCase());

        return matchesStatus && matchesSearch;
      }) ?? [];

    console.log("Filtered result:", filtered);
    setFilteredPayrolls(filtered);
  }, [payrollsData?.data?.payrolls, filters]);

  const handleFilterChange = (filter: PayrollFilters) => {
    setFilters(filter);
    setSelectedPayrolls([]);
    setSelectAll(false);
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    // Reset selectAll state when changing pages, but keep selectedPayrolls
    setSelectAll(false);
  };

  const handleViewPayslip = async (payrollId: string) => {
    setIsPayslipLoading(true);
    setLoadingPayslipId(payrollId);
    try {
      const payslipData = await payrollService.viewPayslip(payrollId);
      setSelectedPayslip(payslipData);
      setShowPayslipModal(true);
    } catch (error) {
      console.error("Failed to fetch payslip:", error);
      toast.error("Failed to fetch payslip details");
    } finally {
      setIsPayslipLoading(false);
      setLoadingPayslipId(null);
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

  const PayrollTable = () => (
    <div className="space-y-4">
      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <>
          <Typography variant="h6">Payroll List</Typography>
        </>
      </Box>
      <TableContainer component={Paper} className="rounded-lg shadow">
        <Table>
          <TableHead className="bg-blue-50">
            <TableRow>
              <TableCell className="text-lg font-extrabold text-blue-700 py-5 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell className="text-lg font-extrabold text-blue-700 py-5 uppercase tracking-wider">
                Employee Name
              </TableCell>
              <TableCell className="text-lg font-extrabold text-blue-700 py-5 uppercase tracking-wider">
                Department
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
              payrollsData?.data?.payrolls?.map((payroll: PayrollData) => {
                // Log the employee field for debugging
                console.log("Payroll employee field:", payroll.employee);
                return (
                  <TableRow
                    key={payroll._id}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      selectedPayrolls.includes(payroll._id) ? "bg-blue-50" : ""
                    }`}
                    onClick={() => handleSelectPayroll(payroll._id)}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedPayrolls.includes(payroll._id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectPayroll(payroll._id);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {payroll.employee?.fullName ||
                        (payroll.employee?.firstName &&
                        payroll.employee?.lastName
                          ? `${payroll.employee.firstName} ${payroll.employee.lastName}`
                          : "Unassigned")}
                    </TableCell>
                    <TableCell>
                      {payroll.department?.name ?? "Unassigned"}
                    </TableCell>
                    <TableCell>{payroll.salaryGrade.level}</TableCell>
                    <TableCell>
                      {formatCurrency(payroll.totals.netPay)}
                    </TableCell>
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewEmployeeHistory(
                              payroll.employee?._id ?? ""
                            );
                          }}
                          className="text-blue-600 hover:text-blue-800"
                          title="View History"
                          disabled={!payroll.employee}
                        >
                          <FaHistory />
                        </button>
                        {payroll.status === PayrollStatus.PAID && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewPayslip(payroll._id);
                            }}
                            className="text-green-600 hover:text-green-800 relative flex items-center justify-center cursor-pointer"
                            title="View Payslip"
                            disabled={loadingPayslipId === payroll._id}
                          >
                            {loadingPayslipId === payroll._id ? (
                              <svg
                                className="animate-spin h-5 w-5 text-green-600"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                  fill="none"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8v8z"
                                />
                              </svg>
                            ) : (
                              <FaFileInvoiceDollar />
                            )}
                          </button>
                        )}
                        {payroll.status === PayrollStatus.APPROVED && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInitiatePayment(payroll);
                            }}
                            className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                            disabled={
                              processPaymentMutation.isPending &&
                              processPaymentMutation.variables === payroll._id
                            }
                          >
                            {processPaymentMutation.isPending &&
                            processPaymentMutation.variables === payroll._id ? (
                              <span className="flex items-center">
                                <svg
                                  className="animate-spin h-4 w-4 mr-2"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                  />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v8z"
                                  />
                                </svg>
                                Initiating...
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <FaRocket className="mr-1" />
                                Initiate Payment
                              </span>
                            )}
                          </button>
                        )}
                        {payroll.status === PayrollStatus.PENDING_PAYMENT && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsPaid(payroll._id);
                              }}
                              className="flex items-center justify-center p-2 text-green-600 hover:text-white bg-green-50 hover:bg-green-600 rounded-full transition-all duration-200"
                              title="Mark as Paid"
                            >
                              <FaCheck size={20} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsFailed(payroll._id);
                              }}
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
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
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

  const getSelectedStatuses = () => {
    const allPayrolls = payrollsData?.data?.payrolls || [];
    const selected = allPayrolls.filter((p) =>
      selectedPayrolls.includes(p._id)
    );
    const statuses = new Set(selected.map((p) => p.status));
    return { statuses };
  };

  const FiltersSection = () => {
    const { statuses } = getSelectedStatuses();
    const onlyApproved =
      statuses.size === 1 && statuses.has(PayrollStatus.APPROVED);
    const onlyPendingPayment =
      statuses.size === 1 && statuses.has(PayrollStatus.PENDING_PAYMENT);
    const mixed = statuses.size > 1;

    return (
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Payroll Filters & Actions
        </h2>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Department
            </label>
            <select
              className="border rounded-md px-3 py-2 w-full"
              value={filters.department}
              onChange={(e) =>
                handleFilterChange({ ...filters, department: e.target.value })
              }
              disabled={isDepartmentsLoading}
            >
              <option value="all">All Departments</option>
              {departments?.map((dept: Department) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
            {isDepartmentsLoading && (
              <p className="text-sm text-gray-500 mt-1">
                Loading departments...
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Frequency
            </label>
            <select
              className="border rounded-md px-3 py-2 w-full"
              value={filters.frequency}
              onChange={(e) =>
                handleFilterChange({ ...filters, frequency: e.target.value })
              }
            >
              <option value="all">All Frequencies</option>
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              className="border rounded-md px-3 py-2 w-full"
              value={filters.status}
              onChange={(e) =>
                handleFilterChange({ ...filters, status: e.target.value })
              }
            >
              <option value="all">All Statuses</option>
              {Object.values(PayrollStatus).map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by name or ID..."
              className="border rounded-md px-3 py-2 w-full"
              value={filters.search || ""}
              onChange={(e) =>
                handleFilterChange({ ...filters, search: e.target.value })
              }
            />
          </div>
        </div>

        {/* Selection Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <button
            onClick={() => handleSelectByStatus(PayrollStatus.APPROVED)}
            className="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 text-sm font-medium transition-colors duration-200 flex items-center gap-2"
          >
            <FaCheck className="h-3 w-3" />
            {isSelectingByStatus[PayrollStatus.APPROVED] ?? true
              ? "Select All Approved"
              : "Deselect All Approved"}
          </button>
          <button
            onClick={() => handleSelectByStatus(PayrollStatus.PENDING_PAYMENT)}
            className="px-4 py-2 bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 text-sm font-medium transition-colors duration-200 flex items-center gap-2"
          >
            <FaClock className="h-3 w-3" />
            {isSelectingByStatus[PayrollStatus.PENDING_PAYMENT] ?? true
              ? "Select All Pending Payment"
              : "Deselect All Pending Payment"}
          </button>
          <span className="text-sm font-medium text-gray-600 ml-2">
            Selected: {selectedPayrolls.length} of{" "}
            {payrollsData?.data?.payrolls.length ?? 0}
          </span>
        </div>

        {/* Action Bar - Always Visible, Beautiful UI/UX */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FaRocket className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Batch Actions
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedPayrolls.length} payroll(s) selected
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Ready to process</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Initiate Payment Button */}
            <button
              onClick={handleBatchProcessPayment}
              className={`group relative overflow-hidden bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg p-4 hover:from-purple-700 hover:to-purple-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                !onlyApproved || selectedPayrolls.length === 0
                  ? "opacity-60 cursor-not-allowed"
                  : ""
              }`}
              disabled={
                !onlyApproved ||
                selectedPayrolls.length === 0 ||
                batchProcessPaymentMutation.status === "pending" ||
                processPaymentMutation.status === "pending"
              }
              title={
                selectedPayrolls.length === 0
                  ? "Select at least one APPROVED payroll"
                  : !onlyApproved
                  ? "All selected payrolls must be APPROVED"
                  : ""
              }
            >
              <div className="flex items-center gap-3">
                {batchProcessPaymentMutation.status === "pending" ||
                processPaymentMutation.status === "pending" ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                ) : (
                  <FaRocket className="h-5 w-5 group-hover:animate-bounce" />
                )}
                <div className="text-left">
                  <div className="font-semibold text-sm">
                    {batchProcessPaymentMutation.status === "pending" ||
                    processPaymentMutation.status === "pending"
                      ? "Processing..."
                      : "Initiate Payment"}
                  </div>
                  <div className="text-xs opacity-90">
                    Approved → Pending Payment
                  </div>
                </div>
              </div>
              {selectedPayrolls.length === 0 && (
                <span className="mt-2 text-xs text-purple-100 bg-purple-700 bg-opacity-70 rounded px-2 py-1">
                  Select at least one APPROVED payroll
                </span>
              )}
              {selectedPayrolls.length > 0 && !onlyApproved && (
                <span className="mt-2 text-xs text-purple-100 bg-purple-700 bg-opacity-70 rounded px-2 py-1">
                  All selected payrolls must be APPROVED
                </span>
              )}
            </button>

            {/* Mark as Paid Button */}
            <button
              onClick={handleBatchMarkAsPaid}
              className={`group relative overflow-hidden bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg p-4 hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                !onlyPendingPayment || selectedPayrolls.length === 0
                  ? "opacity-60 cursor-not-allowed"
                  : ""
              }`}
              disabled={
                !onlyPendingPayment ||
                selectedPayrolls.length === 0 ||
                batchMarkAsPaidMutation.isPending
              }
              title={
                selectedPayrolls.length === 0
                  ? "Select at least one PENDING PAYMENT payroll"
                  : !onlyPendingPayment
                  ? "All selected payrolls must be PENDING PAYMENT"
                  : ""
              }
            >
              <div className="flex items-center gap-3">
                {batchMarkAsPaidMutation.isPending ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                ) : (
                  <FaCheck className="h-5 w-5 group-hover:animate-pulse" />
                )}
                <div className="text-left">
                  <div className="font-semibold text-sm">
                    {batchMarkAsPaidMutation.isPending
                      ? "Processing..."
                      : "Mark as Paid"}
                  </div>
                  <div className="text-xs opacity-90">
                    Pending Payment → Paid
                  </div>
                </div>
              </div>
              {selectedPayrolls.length === 0 && (
                <span className="mt-2 text-xs text-green-100 bg-green-700 bg-opacity-70 rounded px-2 py-1">
                  Select at least one PENDING PAYMENT payroll
                </span>
              )}
              {selectedPayrolls.length > 0 && !onlyPendingPayment && (
                <span className="mt-2 text-xs text-green-100 bg-green-700 bg-opacity-70 rounded px-2 py-1">
                  All selected payrolls must be PENDING PAYMENT
                </span>
              )}
            </button>

            {/* Mark as Failed Button */}
            <button
              onClick={handleBatchMarkAsFailed}
              className={`group relative overflow-hidden bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg p-4 hover:from-red-700 hover:to-red-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                !onlyPendingPayment || selectedPayrolls.length === 0
                  ? "opacity-60 cursor-not-allowed"
                  : ""
              }`}
              disabled={
                !onlyPendingPayment ||
                selectedPayrolls.length === 0 ||
                batchMarkAsFailedMutation.isPending
              }
              title={
                selectedPayrolls.length === 0
                  ? "Select at least one PENDING PAYMENT payroll"
                  : !onlyPendingPayment
                  ? "All selected payrolls must be PENDING PAYMENT"
                  : ""
              }
            >
              <div className="flex items-center gap-3">
                {batchMarkAsFailedMutation.isPending ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                ) : (
                  <FaTimes className="h-5 w-5 group-hover:animate-pulse" />
                )}
                <div className="text-left">
                  <div className="font-semibold text-sm">
                    {batchMarkAsFailedMutation.isPending
                      ? "Processing..."
                      : "Mark as Failed"}
                  </div>
                  <div className="text-xs opacity-90">
                    Pending Payment → Failed
                  </div>
                </div>
              </div>
              {selectedPayrolls.length === 0 && (
                <span className="mt-2 text-xs text-red-100 bg-red-700 bg-opacity-70 rounded px-2 py-1">
                  Select at least one PENDING PAYMENT payroll
                </span>
              )}
              {selectedPayrolls.length > 0 && !onlyPendingPayment && (
                <span className="mt-2 text-xs text-red-100 bg-red-700 bg-opacity-70 rounded px-2 py-1">
                  All selected payrolls must be PENDING PAYMENT
                </span>
              )}
            </button>

            {/* Send Payslips Button - Always Visible */}
            <button
              onClick={handleSendPayslips}
              className={`group relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-4 hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex flex-col items-start ${
                selectedPayrolls.length === 0 ||
                !selectedPayrolls.some((id) => {
                  const payroll = payrollsData?.data?.payrolls?.find(
                    (p: PayrollData) => p._id === id
                  );
                  return payroll?.status === PayrollStatus.PAID;
                })
                  ? "opacity-60 cursor-not-allowed"
                  : ""
              }`}
              disabled={
                selectedPayrolls.length === 0 ||
                !selectedPayrolls.some((id) => {
                  const payroll = payrollsData?.data?.payrolls?.find(
                    (p: PayrollData) => p._id === id
                  );
                  return payroll?.status === PayrollStatus.PAID;
                }) ||
                sendMultiplePayslipsMutation.isPending
              }
              title={
                selectedPayrolls.length === 0
                  ? "Select at least one PAID payroll"
                  : !selectedPayrolls.some((id) => {
                      const payroll = payrollsData?.data?.payrolls?.find(
                        (p: PayrollData) => p._id === id
                      );
                      return payroll?.status === PayrollStatus.PAID;
                    })
                  ? "At least one selected payroll must be PAID"
                  : ""
              }
            >
              <div className="flex items-center gap-3">
                {sendMultiplePayslipsMutation.isPending ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                ) : (
                  <FaEnvelope className="h-5 w-5 group-hover:animate-bounce" />
                )}
                <div className="text-left">
                  <div className="font-semibold text-sm">
                    {sendMultiplePayslipsMutation.isPending
                      ? "Sending..."
                      : "Send Payslips"}
                  </div>
                  <div className="text-xs opacity-90">
                    Email payslips to employees
                  </div>
                </div>
              </div>
              {selectedPayrolls.length === 0 && (
                <span className="mt-2 text-xs text-blue-100 bg-blue-700 bg-opacity-70 rounded px-2 py-1">
                  Select at least one PAID payroll
                </span>
              )}
              {selectedPayrolls.length > 0 &&
                !selectedPayrolls.some((id) => {
                  const payroll = payrollsData?.data?.payrolls?.find(
                    (p: PayrollData) => p._id === id
                  );
                  return payroll?.status === PayrollStatus.PAID;
                }) && (
                  <span className="mt-2 text-xs text-blue-100 bg-blue-700 bg-opacity-70 rounded px-2 py-1">
                    At least one selected payroll must be PAID
                  </span>
                )}
            </button>
          </div>

          {/* Mixed Status Warning */}
          {mixed && selectedPayrolls.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <FaExclamationTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800 font-medium">
                  Please select payrolls with the same status for batch actions
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleBatchProcessPayment = async () => {
    // Get the actual payroll objects for the selected IDs
    const allPayrolls = payrollsData?.data?.payrolls || [];
    const validStatuses = [PayrollStatus.APPROVED]; // Only APPROVED status for Super Admin
    const validPayrolls = allPayrolls.filter(
      (p) =>
        selectedPayrolls.includes(p._id) && validStatuses.includes(p.status)
    );
    const validIds = validPayrolls.map((p) => p._id);

    if (validIds.length === 0) {
      toast.error("No selected payrolls are eligible for payment initiation.");
      return;
    }

    if (validIds.length === 1) {
      console.log("🔵 Initiating single payment for:", validIds[0]);
      const payroll = validPayrolls[0];
      handleInitiatePayment(payroll);
      return;
    }

    if (validIds.length > 1) {
      console.log("🟢 Showing batch confirmation for:", validIds);
      showBatchConfirmation("initiate", validIds);
    }
  };

  const handleMarkAsPaid = async (payrollId: string) => {
    if (!payrollId) {
      console.error("Invalid payroll ID:", payrollId);
      toast.error("Invalid payroll ID");
      return;
    }

    showSingleConfirmation("markPaid", payrollId);
  };

  const handleMarkAsFailed = (payrollId: string) => {
    if (!payrollId) {
      console.error("Invalid payroll ID:", payrollId);
      toast.error("Invalid payroll ID");
      return;
    }

    showSingleConfirmation("markFailed", payrollId);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedPayrolls([]);
    } else {
      setSelectedPayrolls(filteredPayrolls.map((p) => p._id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectPayroll = (payrollId: string) => {
    setSelectedPayrolls((prev) =>
      prev.includes(payrollId)
        ? prev.filter((id) => id !== payrollId)
        : [...prev, payrollId]
    );
  };

  const handleSelectByStatus = (status: PayrollStatus) => {
    const isSelecting = isSelectingByStatus[status] ?? true;
    const allPayrolls = payrollsData?.data?.payrolls || [];
    const payrollsToToggle = allPayrolls
      .filter((p) => p.status === status)
      .map((p) => p._id);

    setSelectedPayrolls((prev) => {
      const currentSelection = new Set(prev);

      if (isSelecting) {
        payrollsToToggle.forEach((id) => currentSelection.add(id));
      } else {
        payrollsToToggle.forEach((id) => currentSelection.delete(id));
      }

      return Array.from(currentSelection);
    });

    setIsSelectingByStatus((prev) => ({
      ...prev,
      [status]: !isSelecting,
    }));
  };

  const handleBatchMarkAsPaid = async () => {
    const allPayrolls = payrollsData?.data?.payrolls || [];

    const validPayrolls = allPayrolls.filter(
      (p) =>
        selectedPayrolls.includes(p._id) &&
        p.status === PayrollStatus.PENDING_PAYMENT
    );

    const validIds = validPayrolls.map((p) => p._id);

    if (validIds.length === 0) {
      toast.error("No selected payrolls are eligible to be marked as paid.");
      return;
    }

    if (validIds.length === 1) {
      try {
        await markAsPaidMutation.mutateAsync(validIds[0]);
      } catch (error: any) {
        console.error("❌ Failed to mark as paid:", error);
        toast.error(error.message || "Failed to mark payroll as paid");
      }
      return;
    }

    showBatchConfirmation("markPaid", validIds);
  };

  const handleBatchMarkAsFailed = async () => {
    const allPayrolls = payrollsData?.data?.payrolls || [];
    const validPayrolls = allPayrolls.filter(
      (p) =>
        selectedPayrolls.includes(p._id) &&
        p.status === PayrollStatus.PENDING_PAYMENT
    );
    const validIds = validPayrolls.map((p) => p._id);

    if (validIds.length === 0) {
      toast.error("No selected payrolls are eligible to be marked as failed.");
      return;
    }

    if (validIds.length === 1) {
      try {
        await markAsFailedMutation.mutateAsync(validIds[0]);
      } catch (error: any) {
        console.error("Failed to mark as failed:", error);
        toast.error(error.message || "Failed to mark payroll as failed");
      }
      return;
    }

    showBatchConfirmation("markFailed", validIds);
  };

  const handleSendPayslips = async () => {
    const allPayrolls = payrollsData?.data?.payrolls || [];
    const validPayrolls = allPayrolls.filter(
      (p) => selectedPayrolls.includes(p._id) && p.status === PayrollStatus.PAID
    );
    const validIds = validPayrolls.map((p) => p._id);

    if (validIds.length === 0) {
      toast.error(
        "No selected payrolls are eligible to send payslips. Only PAID payrolls can have payslips sent."
      );
      return;
    }

    showBatchConfirmation("sendPayslips", validIds);
  };

  const resetSelectionStates = () => {
    setSelectedPayrolls([]);
    setSelectAll(false);
    setIsSelectingByStatus({});
  };

  // Reusable batch confirmation function
  const showBatchConfirmation = (
    action: "initiate" | "markPaid" | "markFailed" | "sendPayslips",
    payrollIds: string[]
  ) => {
    setBatchAction(action);
    setBatchPayrollIds(payrollIds);
    setBatchPayrollCount(payrollIds.length);
    setShowBatchConfirmDialog(true);
  };

  // Handle batch confirmation action
  const handleBatchConfirmation = async () => {
    try {
      switch (batchAction) {
        case "initiate":
          await batchProcessPaymentMutation.mutateAsync(batchPayrollIds);
          break;
        case "markPaid":
          await batchMarkAsPaidMutation.mutateAsync(batchPayrollIds);
          break;
        case "markFailed":
          await batchMarkAsFailedMutation.mutateAsync(batchPayrollIds);
          break;
        case "sendPayslips":
          await sendMultiplePayslipsMutation.mutateAsync(batchPayrollIds);
          break;
      }
      setShowBatchConfirmDialog(false);
      setBatchPayrollIds([]);
      setBatchPayrollCount(0);
    } catch (error) {
      console.error("Failed to process batch action:", error);
    }
  };

  // Show single action confirmation
  const showSingleConfirmation = (
    action: "markPaid" | "markFailed",
    payrollId: string
  ) => {
    const allPayrolls = payrollsData?.data?.payrolls || [];
    const payroll = allPayrolls.find((p: PayrollData) => p._id === payrollId);

    setSingleAction(action);
    setSinglePayrollId(payrollId);
    setSinglePayrollData(payroll || null);
    setShowSingleConfirmDialog(true);
  };

  // Handle single action confirmation
  const handleSingleConfirmation = async () => {
    try {
      switch (singleAction) {
        case "markPaid":
          await markAsPaidMutation.mutateAsync(singlePayrollId);
          break;
        case "markFailed":
          await markAsFailedMutation.mutateAsync(singlePayrollId);
          break;
      }
      setShowSingleConfirmDialog(false);
      setSinglePayrollId("");
      setSinglePayrollData(null);
    } catch (error) {
      console.error("Failed to process single action:", error);
    }
  };

  // CSV download function
  const downloadCSV = (
    failures: Array<{
      payrollId: string;
      employee: string;
      error: string;
      amount?: number;
    }>
  ) => {
    const header = "Payroll ID,Employee,Amount,Error\n";
    const rows = failures
      .map(
        (f) =>
          `"${f.payrollId}","${f.employee}","${
            f.amount ? formatCurrency(f.amount) : "N/A"
          }","${f.error.replace(/"/g, '""')}"`
      )
      .join("\n");
    const csv = header + rows;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `batch_payment_errors_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // PDF generation function
  const generatePDF = (data: typeof batchResult) => {
    if (!data) return;

    // Create PDF content
    const pdfContent = `
      <html>
        <head>
          <title>Batch Payment Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { margin-bottom: 30px; }
            .summary-card { 
              display: inline-block; 
              padding: 15px; 
              margin: 10px; 
              border-radius: 8px; 
              text-align: center;
              min-width: 120px;
            }
            .success { background-color: #f0fdf4; border: 2px solid #bbf7d0; }
            .failure { background-color: #fef2f2; border: 2px solid #fecaca; }
            .section { margin-bottom: 25px; }
            .section h3 { color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
            .item { 
              padding: 8px; 
              margin: 5px 0; 
              border-radius: 4px; 
              border-left: 4px solid;
            }
            .success-item { background-color: #f0fdf4; border-left-color: #16a34a; }
            .failure-item { background-color: #fef2f2; border-left-color: #dc2626; }
            .error-text { color: #dc2626; font-style: italic; font-size: 12px; margin-top: 4px; }
            .amount { font-weight: bold; }
            .timestamp { color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Batch Payment Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>

          <div class="summary">
            <h2>Summary</h2>
            <div class="summary-card success">
              <div style="font-size: 24px; font-weight: bold; color: #16a34a;">${
                data.successes.length
              }</div>
              <div style="color: #166534;">Successful</div>
            </div>
            <div class="summary-card failure">
              <div style="font-size: 24px; font-weight: bold; color: #dc2626;">${
                data.failures.length
              }</div>
              <div style="color: #991b1b;">Failed</div>
            </div>
          </div>

          ${
            data.successes.length > 0
              ? `
            <div class="section">
              <h3>✅ Successful Payments (${data.successes.length})</h3>
              ${data.successes
                .map(
                  (success) => `
                <div class="item success-item">
                  <strong>${success.employee}</strong>
                  <div class="amount">${
                    success.amount ? formatCurrency(success.amount) : "N/A"
                  }</div>
                  <div style="font-size: 12px; color: #6b7280;">ID: ${
                    success.payrollId
                  }</div>
                </div>
              `
                )
                .join("")}
            </div>
          `
              : ""
          }

          ${
            data.failures.length > 0
              ? `
            <div class="section">
              <h3>❌ Failed Payments (${data.failures.length})</h3>
              ${data.failures
                .map(
                  (failure) => `
                <div class="item failure-item">
                  <strong>${failure.employee}</strong>
                  <div class="amount">${
                    failure.amount ? formatCurrency(failure.amount) : "N/A"
                  }</div>
                  <div class="error-text">Error: ${failure.error}</div>
                  <div style="font-size: 12px; color: #6b7280;">ID: ${
                    failure.payrollId
                  }</div>
                </div>
              `
                )
                .join("")}
            </div>
          `
              : ""
          }

          <div class="timestamp">
            Report generated by CIS Payroll System<br>
            ${new Date().toLocaleString()}
          </div>
        </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([pdfContent], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `batch_payment_report_${
      new Date().toISOString().split("T")[0]
    }.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Print function
  const printReport = (data: typeof batchResult) => {
    if (!data) return;

    // Create print content
    const printContent = `
      <html>
        <head>
          <title>Batch Payment Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { margin-bottom: 30px; }
            .summary-card { 
              display: inline-block; 
              padding: 15px; 
              margin: 10px; 
              border-radius: 8px; 
              text-align: center;
              min-width: 120px;
            }
            .success { background-color: #f0fdf4; border: 2px solid #bbf7d0; }
            .failure { background-color: #fef2f2; border: 2px solid #fecaca; }
            .section { margin-bottom: 25px; }
            .section h3 { color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
            .item { 
              padding: 8px; 
              margin: 5px 0; 
              border-radius: 4px; 
              border-left: 4px solid;
            }
            .success-item { background-color: #f0fdf4; border-left-color: #16a34a; }
            .failure-item { background-color: #fef2f2; border-left-color: #dc2626; }
            .error-text { color: #dc2626; font-style: italic; font-size: 12px; margin-top: 4px; }
            .amount { font-weight: bold; }
            .timestamp { color: #6b7280; font-size: 12px; margin-top: 20px; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Batch Payment Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>

          <div class="summary">
            <h2>Summary</h2>
            <div class="summary-card success">
              <div style="font-size: 24px; font-weight: bold; color: #16a34a;">${
                data.successes.length
              }</div>
              <div style="color: #166534;">Successful</div>
            </div>
            <div class="summary-card failure">
              <div style="font-size: 24px; font-weight: bold; color: #dc2626;">${
                data.failures.length
              }</div>
              <div style="color: #991b1b;">Failed</div>
            </div>
          </div>

          ${
            data.successes.length > 0
              ? `
            <div class="section">
              <h3>✅ Successful Payments (${data.successes.length})</h3>
              ${data.successes
                .map(
                  (success) => `
                <div class="item success-item">
                  <strong>${success.employee}</strong>
                  <div class="amount">${
                    success.amount ? formatCurrency(success.amount) : "N/A"
                  }</div>
                  <div style="font-size: 12px; color: #6b7280;">ID: ${
                    success.payrollId
                  }</div>
                </div>
              `
                )
                .join("")}
            </div>
          `
              : ""
          }

          ${
            data.failures.length > 0
              ? `
            <div class="section">
              <h3>❌ Failed Payments (${data.failures.length})</h3>
              ${data.failures
                .map(
                  (failure) => `
                <div class="item failure-item">
                  <strong>${failure.employee}</strong>
                  <div class="amount">${
                    failure.amount ? formatCurrency(failure.amount) : "N/A"
                  }</div>
                  <div class="error-text">Error: ${failure.error}</div>
                  <div style="font-size: 12px; color: #6b7280;">ID: ${
                    failure.payrollId
                  }</div>
                </div>
              `
                )
                .join("")}
            </div>
          `
              : ""
          }

          <div class="timestamp">
            Report generated by CIS Payroll System<br>
            ${new Date().toLocaleString()}
          </div>
        </body>
      </html>
    `;

    // Open print window
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Payroll Report Generation - Single Clean Function
  const [reportPeriod, setReportPeriod] = useState<
    | "current-month"
    | "last-month"
    | "last-2-months"
    | "last-3-months"
    | "last-6-months"
    | "last-year"
  >("current-month");
  const [reportAction, setReportAction] = useState<
    "download-csv" | "download-pdf" | "email"
  >("download-csv");
  const [emailRecipient, setEmailRecipient] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [emailFormat, _setEmailFormat] = useState<"csv" | "pdf">("pdf");

  // Email attachment format selection state
  const [emailFormats, setEmailFormats] = useState<{
    pdf: boolean;
    csv: boolean;
  }>({ pdf: true, csv: false });

  const handleReportAction = async () => {
    if (reportAction === "email" && !emailRecipient) {
      toast.error("Please enter recipient email for email action");
      return;
    }

    setReportLoading(true);
    try {
      const params = {
        period: reportPeriod,
        department:
          filters.department === "all" ? undefined : filters.department,
        status: filters.status === "all" ? undefined : filters.status,
      };

      if (reportAction === "download-csv") {
        const blob = await payrollReportService.downloadCSV(params);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `payroll_report_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        toast.success("Payroll report CSV downloaded successfully!");
      } else if (reportAction === "download-pdf") {
        const blob = await payrollReportService.downloadPDF(params);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `payroll_report_${
          new Date().toISOString().split("T")[0]
        }.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        toast.success("Payroll report PDF downloaded successfully!");
      } else if (reportAction === "email") {
        const selectedFormats = [];
        if (emailFormats.pdf) selectedFormats.push("pdf");
        if (emailFormats.csv) selectedFormats.push("csv");
        if (selectedFormats.length === 0) {
          toast.error(
            "Please select at least one attachment format (PDF or CSV)"
          );
          setReportLoading(false);
          return;
        }
        const result = await payrollReportService.sendReportEmail({
          ...params,
          recipientEmail: emailRecipient,
          formats: selectedFormats.join(","),
        });
        toast.success(
          result.message || "Payroll report sent via email successfully!"
        );
        setEmailRecipient("");
      }
    } catch (error: any) {
      toast.error(
        error.message || `Failed to ${reportAction.replace("-", " ")}`
      );
    } finally {
      setReportLoading(false);
    }
  };

  // Handle payment initiation with confirmation
  const handleInitiatePayment = (payroll: PayrollData) => {
    setSelectedPaymentPayroll(payroll);
    setPaymentAction("initiate");
    setShowPaymentConfirmDialog(true);
  };

  // Confirm payment action
  const confirmPaymentAction = async () => {
    if (!selectedPaymentPayroll) return;

    try {
      if (paymentAction === "initiate") {
        await processPaymentMutation.mutateAsync(selectedPaymentPayroll._id);
      } else {
        await markAsPaidMutation.mutateAsync(selectedPaymentPayroll._id);
      }
      setShowPaymentConfirmDialog(false);
      setSelectedPaymentPayroll(null);
    } catch (error) {
      console.error("Payment action failed:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">
          Process Payment
        </h1>
      </div>

      {/* Document Actions Section - Clean Dropdown Design */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 shadow-lg border border-blue-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              📄 Payroll Reports
            </h2>
            <p className="text-gray-600 text-sm">
              Generate payroll reports for any period. Download as CSV/PDF or
              send via email with your preferred format.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-center">
            {/* Period Selection */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Report Period</InputLabel>
              <Select
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value as any)}
                label="Report Period"
                sx={{
                  borderRadius: 2,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#e5e7eb",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#3b82f6",
                  },
                }}
              >
                <MenuItem value="current-month">Current Month</MenuItem>
                <MenuItem value="last-month">Last Month</MenuItem>
                <MenuItem value="last-2-months">Last 2 Months</MenuItem>
                <MenuItem value="last-3-months">Last 3 Months</MenuItem>
                <MenuItem value="last-6-months">Last 6 Months</MenuItem>
                <MenuItem value="last-year">Last Year</MenuItem>
              </Select>
            </FormControl>

            {/* Action Selection */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Action</InputLabel>
              <Select
                value={reportAction}
                onChange={(e) => setReportAction(e.target.value as any)}
                label="Action"
                sx={{
                  borderRadius: 2,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#e5e7eb",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#3b82f6",
                  },
                }}
              >
                <MenuItem value="download-csv">Download CSV</MenuItem>
                <MenuItem value="download-pdf">Download PDF</MenuItem>
                <MenuItem value="email">Send Email</MenuItem>
              </Select>
            </FormControl>

            {/* Email Input - Only show when email action is selected */}
            {reportAction === "email" && (
              <>
                <TextField
                  size="small"
                  placeholder="Recipient Email"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  sx={{
                    minWidth: 200,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "& fieldset": {
                        borderColor: "#e5e7eb",
                      },
                      "&:hover fieldset": {
                        borderColor: "#3b82f6",
                      },
                    },
                  }}
                />
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={emailFormats.pdf}
                      onChange={() =>
                        setEmailFormats((prev) => ({ ...prev, pdf: !prev.pdf }))
                      }
                    />
                    Attach PDF
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={emailFormats.csv}
                      onChange={() =>
                        setEmailFormats((prev) => ({ ...prev, csv: !prev.csv }))
                      }
                    />
                    Attach CSV
                  </label>
                </div>
                <div className="text-xs text-gray-500 mt-1 col-span-full">
                  💡 The report will be sent as{" "}
                  {emailFormats.pdf && emailFormats.csv
                    ? "PDF and CSV"
                    : emailFormats.pdf
                    ? "PDF"
                    : "CSV"}{" "}
                  attachment{emailFormats.pdf && emailFormats.csv ? "s" : ""} to
                  the specified email address.
                </div>
              </>
            )}

            {/* Execute Button */}
            <Button
              variant="contained"
              startIcon={
                reportLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : reportAction === "download-csv" ? (
                  <FaFileCsv />
                ) : reportAction === "download-pdf" ? (
                  <FaFilePdf />
                ) : (
                  <FaEnvelope />
                )
              }
              onClick={handleReportAction}
              disabled={
                reportLoading || (reportAction === "email" && !emailRecipient)
              }
              sx={{
                borderRadius: 3,
                textTransform: "none",
                fontWeight: "bold",
                px: 3,
                py: 1.5,
                background:
                  reportAction === "download-csv"
                    ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                    : reportAction === "download-pdf"
                    ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                    : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                boxShadow:
                  reportAction === "download-csv"
                    ? "0 4px 15px rgba(16, 185, 129, 0.4)"
                    : reportAction === "download-pdf"
                    ? "0 4px 15px rgba(239, 68, 68, 0.4)"
                    : "0 4px 15px rgba(59, 130, 246, 0.4)",
                "&:hover": {
                  background:
                    reportAction === "download-csv"
                      ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
                      : reportAction === "download-pdf"
                      ? "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)"
                      : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  boxShadow:
                    reportAction === "download-csv"
                      ? "0 6px 20px rgba(16, 185, 129, 0.6)"
                      : reportAction === "download-pdf"
                      ? "0 6px 20px rgba(239, 68, 68, 0.6)"
                      : "0 6px 20px rgba(59, 130, 246, 0.6)",
                  transform: "translateY(-2px)",
                },
                "&:disabled": {
                  background: "#9ca3af",
                  transform: "none",
                },
                transition: "all 0.3s ease",
              }}
            >
              <span className="hidden sm:inline">
                {reportLoading
                  ? "Processing..."
                  : reportAction === "download-csv"
                  ? "Download CSV"
                  : reportAction === "download-pdf"
                  ? "Download PDF"
                  : `Send ${emailFormat.toUpperCase()} Email`}
              </span>
              <span className="sm:hidden">
                {reportLoading
                  ? "..."
                  : reportAction === "download-csv"
                  ? "CSV"
                  : reportAction === "download-pdf"
                  ? "PDF"
                  : `${emailFormat.toUpperCase()}`}
              </span>
            </Button>
          </div>
        </div>
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

      {/* Payment Confirmation Dialog */}
      <Dialog
        open={showPaymentConfirmDialog}
        onClose={() => {
          if (
            !processPaymentMutation.isPending &&
            !markAsPaidMutation.isPending
          ) {
            setShowPaymentConfirmDialog(false);
            setSelectedPaymentPayroll(null);
          }
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            background: paymentAction === "initiate" ? MAIN_PURPLE : MAIN_GREEN,
            borderRadius: 18,
            boxShadow: "0 4px 24px 0 rgba(0, 0, 0, 0.15)",
            border: `2px solid ${
              paymentAction === "initiate"
                ? LIGHT_PURPLE_ACCENT
                : LIGHT_GREEN_ACCENT
            }`,
            padding: 0,
          },
        }}
      >
        <DialogContent sx={{ p: 0, position: "relative", overflow: "hidden" }}>
          {/* Geometric Background */}
          <div
            style={{
              position: "absolute",
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              background:
                paymentAction === "initiate"
                  ? "rgba(139, 92, 246, 0.1)"
                  : "rgba(34, 197, 94, 0.1)",
              clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
              transform: "rotate(45deg)",
            }}
          />

          <div style={{ position: "relative", zIndex: 1, padding: "32px" }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background:
                    paymentAction === "initiate"
                      ? "rgba(139, 92, 246, 0.2)"
                      : "rgba(34, 197, 94, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  border: `3px solid ${
                    paymentAction === "initiate"
                      ? LIGHT_PURPLE_ACCENT
                      : LIGHT_GREEN_ACCENT
                  }`,
                }}
              >
                {paymentAction === "initiate" ? (
                  <FaRocket size={32} color="white" />
                ) : (
                  <FaCreditCard size={32} color="white" />
                )}
              </div>

              <Typography
                variant="h5"
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  marginBottom: "8px",
                }}
              >
                {paymentAction === "initiate"
                  ? "Initiate Payment"
                  : "Process Payment"}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: "rgba(255, 255, 255, 0.8)",
                  fontSize: "14px",
                }}
              >
                {paymentAction === "initiate"
                  ? "This will move the payroll to Pending Payment status"
                  : "This will mark the payment as completed"}
              </Typography>
            </div>

            {/* Employee Details */}
            {selectedPaymentPayroll && (
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  borderRadius: 12,
                  padding: "20px",
                  marginBottom: "24px",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      color: "white",
                      fontWeight: "600",
                    }}
                  >
                    {getEmployeeName(selectedPaymentPayroll.employee)}
                  </Typography>
                  <span
                    style={{
                      background: "rgba(255, 255, 255, 0.2)",
                      color: "white",
                      padding: "4px 12px",
                      borderRadius: 20,
                      fontSize: "12px",
                      fontWeight: "500",
                    }}
                  >
                    {selectedPaymentPayroll.department?.name || "Unknown Dept"}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: "rgba(255, 255, 255, 0.8)",
                    }}
                  >
                    Current Status:
                  </Typography>
                  <span
                    style={{
                      background: "rgba(255, 255, 255, 0.2)",
                      color: "white",
                      padding: "4px 12px",
                      borderRadius: 20,
                      fontSize: "12px",
                      fontWeight: "500",
                    }}
                  >
                    {statusLabels[selectedPaymentPayroll.status]}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: "rgba(255, 255, 255, 0.8)",
                    }}
                  >
                    Net Salary:
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: "white",
                      fontWeight: "bold",
                    }}
                  >
                    {formatCurrency(selectedPaymentPayroll.totals.netPay)}
                  </Typography>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px" }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  if (
                    !processPaymentMutation.isPending &&
                    !markAsPaidMutation.isPending
                  ) {
                    setShowPaymentConfirmDialog(false);
                    setSelectedPaymentPayroll(null);
                  }
                }}
                disabled={
                  processPaymentMutation.isPending ||
                  markAsPaidMutation.isPending
                }
                sx={{
                  color: "white",
                  borderColor: "rgba(255, 255, 255, 0.3)",
                  "&:hover": {
                    borderColor: "white",
                    background: "rgba(255, 255, 255, 0.1)",
                  },
                  py: 1.5,
                  borderRadius: 2,
                }}
              >
                Cancel
              </Button>

              <Button
                fullWidth
                variant="contained"
                onClick={confirmPaymentAction}
                disabled={
                  processPaymentMutation.isPending ||
                  markAsPaidMutation.isPending
                }
                sx={{
                  background: "white",
                  color:
                    paymentAction === "initiate" ? MAIN_PURPLE : MAIN_GREEN,
                  "&:hover": {
                    background: "rgba(255, 255, 255, 0.9)",
                  },
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: "bold",
                }}
                startIcon={
                  processPaymentMutation.isPending ||
                  markAsPaidMutation.isPending ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : paymentAction === "initiate" ? (
                    <FaRocket />
                  ) : (
                    <FaCreditCard />
                  )
                }
              >
                {processPaymentMutation.isPending ||
                markAsPaidMutation.isPending
                  ? "Processing..."
                  : paymentAction === "initiate"
                  ? "Initiate Payment"
                  : "Process Payment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Batch Confirmation Dialog */}
      <Dialog
        open={showBatchConfirmDialog}
        onClose={() => {
          if (
            !batchProcessPaymentMutation.isPending &&
            !batchMarkAsPaidMutation.isPending &&
            !batchMarkAsFailedMutation.isPending
          ) {
            setShowBatchConfirmDialog(false);
            setBatchPayrollIds([]);
            setBatchPayrollCount(0);
          }
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            background:
              batchAction === "initiate"
                ? MAIN_PURPLE
                : batchAction === "markPaid"
                ? MAIN_GREEN
                : "#dc2626",
            borderRadius: 18,
            boxShadow: "0 4px 24px 0 rgba(0, 0, 0, 0.15)",
            border: `2px solid ${
              batchAction === "initiate"
                ? LIGHT_PURPLE_ACCENT
                : batchAction === "markPaid"
                ? LIGHT_GREEN_ACCENT
                : "#b91c1c"
            }`,
            padding: 0,
          },
        }}
      >
        <DialogContent sx={{ p: 0, position: "relative", overflow: "hidden" }}>
          {/* Geometric Background */}
          <div
            style={{
              position: "absolute",
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              background:
                batchAction === "initiate"
                  ? "rgba(139, 92, 246, 0.1)"
                  : batchAction === "markPaid"
                  ? "rgba(34, 197, 94, 0.1)"
                  : "rgba(220, 38, 38, 0.1)",
              clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
              transform: "rotate(45deg)",
            }}
          />

          <div style={{ position: "relative", zIndex: 1, padding: "32px" }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background:
                    batchAction === "initiate"
                      ? "rgba(139, 92, 246, 0.2)"
                      : batchAction === "markPaid"
                      ? "rgba(34, 197, 94, 0.2)"
                      : "rgba(220, 38, 38, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  border: `3px solid ${
                    batchAction === "initiate"
                      ? LIGHT_PURPLE_ACCENT
                      : batchAction === "markPaid"
                      ? LIGHT_GREEN_ACCENT
                      : "#b91c1c"
                  }`,
                }}
              >
                {batchAction === "initiate" ? (
                  <FaRocket size={32} color="white" />
                ) : batchAction === "markPaid" ? (
                  <FaCheck size={32} color="white" />
                ) : batchAction === "markFailed" ? (
                  <FaTimes size={32} color="white" />
                ) : (
                  <FaEnvelope size={32} color="white" />
                )}
              </div>

              <Typography
                variant="h5"
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  marginBottom: "8px",
                }}
              >
                {batchAction === "initiate"
                  ? "Batch Payment Initiation"
                  : batchAction === "markPaid"
                  ? "Batch Mark as Paid"
                  : batchAction === "markFailed"
                  ? "Batch Mark as Failed"
                  : "Batch Payslip Email"}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: "rgba(255, 255, 255, 0.8)",
                  fontSize: "14px",
                }}
              >
                {batchAction === "initiate"
                  ? "This will initiate payment for multiple payrolls at once"
                  : batchAction === "markPaid"
                  ? "This will mark multiple payments as completed"
                  : batchAction === "markFailed"
                  ? "This will mark multiple payments as failed"
                  : "This will send payslips to multiple employees at once"}
              </Typography>
            </div>

            {/* Batch Details */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: 12,
                padding: "20px",
                marginBottom: "24px",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: "white",
                    fontWeight: "600",
                  }}
                >
                  {batchAction === "sendPayslips"
                    ? "Payslips to Send"
                    : "Payrolls to Process"}
                </Typography>
                <span
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontSize: "12px",
                    fontWeight: "500",
                  }}
                >
                  {batchPayrollCount} Selected
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255, 255, 255, 0.8)",
                  }}
                >
                  Action:
                </Typography>
                <span
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontSize: "12px",
                    fontWeight: "500",
                  }}
                >
                  {batchAction === "initiate"
                    ? "Initiate Payment"
                    : batchAction === "markPaid"
                    ? "Mark as Paid"
                    : batchAction === "markFailed"
                    ? "Mark as Failed"
                    : "Send Payslips"}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255, 255, 255, 0.8)",
                  }}
                >
                  Status Change:
                </Typography>
                <span
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontSize: "12px",
                    fontWeight: "500",
                  }}
                >
                  {batchAction === "initiate"
                    ? "Approved → Pending Payment"
                    : batchAction === "markPaid"
                    ? "Pending Payment → Paid"
                    : batchAction === "markFailed"
                    ? "Pending Payment → Failed"
                    : "Pending Payment → Paid"}
                </span>
              </div>
            </div>

            {/* Warning */}
            <div
              style={{
                background: "rgba(255, 193, 7, 0.1)",
                border: "1px solid rgba(255, 193, 7, 0.3)",
                borderRadius: 8,
                padding: "12px",
                marginBottom: "24px",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "rgba(255, 255, 255, 0.9)",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FaExclamationTriangle size={14} />
                {batchAction === "initiate"
                  ? `This action will move ${batchPayrollCount} payroll${
                      batchPayrollCount === 1 ? "" : "s"
                    } to Pending Payment status.`
                  : batchAction === "markPaid"
                  ? `This action will mark ${batchPayrollCount} payment${
                      batchPayrollCount === 1 ? "" : "s"
                    } as completed.`
                  : batchAction === "markFailed"
                  ? `This action will mark ${batchPayrollCount} payment${
                      batchPayrollCount === 1 ? "" : "s"
                    } as failed.`
                  : `This action will send payslips to ${batchPayrollCount} employee${
                      batchPayrollCount === 1 ? "" : "s"
                    }.`}
                You can review the results after processing.
              </Typography>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px" }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  if (
                    !batchProcessPaymentMutation.isPending &&
                    !batchMarkAsPaidMutation.isPending &&
                    !batchMarkAsFailedMutation.isPending
                  ) {
                    setShowBatchConfirmDialog(false);
                    setBatchPayrollIds([]);
                    setBatchPayrollCount(0);
                  }
                }}
                disabled={
                  batchProcessPaymentMutation.isPending ||
                  batchMarkAsPaidMutation.isPending ||
                  batchMarkAsFailedMutation.isPending
                }
                sx={{
                  color: "white",
                  borderColor: "rgba(255, 255, 255, 0.3)",
                  "&:hover": {
                    borderColor: "white",
                    background: "rgba(255, 255, 255, 0.1)",
                  },
                  py: 1.5,
                  borderRadius: 2,
                }}
              >
                Cancel
              </Button>

              <Button
                fullWidth
                variant="contained"
                onClick={handleBatchConfirmation}
                disabled={
                  batchProcessPaymentMutation.isPending ||
                  batchMarkAsPaidMutation.isPending ||
                  batchMarkAsFailedMutation.isPending ||
                  (batchAction === "sendPayslips" &&
                    sendMultiplePayslipsMutation.isPending)
                }
                sx={{
                  background: "white",
                  color:
                    batchAction === "initiate"
                      ? MAIN_PURPLE
                      : batchAction === "markPaid"
                      ? MAIN_GREEN
                      : batchAction === "markFailed"
                      ? "#dc2626"
                      : MAIN_BLUE,
                  "&:hover": {
                    background: "rgba(255, 255, 255, 0.9)",
                  },
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: "bold",
                }}
                startIcon={
                  batchProcessPaymentMutation.isPending ||
                  batchMarkAsPaidMutation.isPending ||
                  batchMarkAsFailedMutation.isPending ||
                  (batchAction === "sendPayslips" &&
                    sendMultiplePayslipsMutation.isPending) ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : batchAction === "initiate" ? (
                    <FaRocket />
                  ) : batchAction === "markPaid" ? (
                    <FaCheck />
                  ) : batchAction === "markFailed" ? (
                    <FaTimes />
                  ) : (
                    <FaEnvelope />
                  )
                }
              >
                {batchProcessPaymentMutation.isPending ||
                batchMarkAsPaidMutation.isPending ||
                batchMarkAsFailedMutation.isPending ||
                (batchAction === "sendPayslips" &&
                  sendMultiplePayslipsMutation.isPending)
                  ? batchAction === "sendPayslips"
                    ? "Sending..."
                    : "Processing..."
                  : batchAction === "initiate"
                  ? `Initiate ${batchPayrollCount} Payment${
                      batchPayrollCount === 1 ? "" : "s"
                    }`
                  : batchAction === "markPaid"
                  ? `Mark ${batchPayrollCount} as Paid`
                  : batchAction === "markFailed"
                  ? `Mark ${batchPayrollCount} as Failed`
                  : `Send Payslips to ${batchPayrollCount} Employee${
                      batchPayrollCount === 1 ? "" : "s"
                    }`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Batch Result Modal */}
      <Dialog
        open={!!batchResult}
        onClose={() => setBatchResult(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          style: {
            borderRadius: 16,
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
          },
        }}
      >
        <DialogTitle
          sx={{
            background: batchResult?.failures?.length ? "#fef2f2" : "#f0fdf4",
            color: batchResult?.failures?.length ? "#dc2626" : "#16a34a",
            borderBottom: `2px solid ${
              batchResult?.failures?.length ? "#fecaca" : "#bbf7d0"
            }`,
            fontWeight: "bold",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {batchResult?.failures?.length ? (
              <FaExclamationTriangle size={24} />
            ) : (
              <FaCheck size={24} />
            )}
            Batch Payment Result
          </div>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          {/* Summary Section */}
          <div
            style={{
              marginBottom: "18px",
              fontWeight: 500,
              fontSize: 16,
              color: "#374151",
            }}
          >
            You attempted to initiate payment for{" "}
            <b>
              {(batchResult?.successes?.length ?? 0) +
                (batchResult?.failures?.length ?? 0)}
            </b>{" "}
            payroll
            {(batchResult?.successes?.length ?? 0) +
              (batchResult?.failures?.length ?? 0) ===
            1
              ? ""
              : "s"}
            .<br />
            <span style={{ color: "#16a34a" }}>
              {batchResult?.successes?.length ?? 0} succeeded
            </span>
            ,{" "}
            <span style={{ color: "#dc2626" }}>
              {batchResult?.failures?.length ?? 0} failed
            </span>
            .
          </div>

          {/* Summary Cards */}
          <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
            <div
              style={{
                flex: 1,
                background: "#f0fdf4",
                border: "2px solid #bbf7d0",
                borderRadius: 12,
                padding: "16px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#16a34a",
                }}
              >
                {batchResult?.successes?.length || 0}
              </div>
              <div style={{ fontSize: "14px", color: "#166534" }}>
                Successful
              </div>
            </div>

            <div
              style={{
                flex: 1,
                background: batchResult?.failures?.length
                  ? "#fef2f2"
                  : "#f8fafc",
                border: `2px solid ${
                  batchResult?.failures?.length ? "#fecaca" : "#e2e8f0"
                }`,
                borderRadius: 12,
                padding: "16px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: batchResult?.failures?.length ? "#dc2626" : "#64748b",
                }}
              >
                {batchResult?.failures?.length || 0}
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: batchResult?.failures?.length ? "#991b1b" : "#475569",
                }}
              >
                Failed
              </div>
            </div>
          </div>

          {/* Success Details */}
          {batchResult?.successes && batchResult.successes.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <Typography
                variant="h6"
                sx={{ color: "#16a34a", marginBottom: "12px" }}
              >
                ✅ Successful Payments
              </Typography>
              <div
                style={{
                  background: "#f0fdf4",
                  borderRadius: 8,
                  padding: "12px",
                  maxHeight: "200px",
                  overflowY: "auto",
                }}
              >
                {batchResult?.successes?.slice(0, 5).map((success, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom:
                        index <
                        (batchResult?.successes?.slice(0, 5)?.length ?? 0) - 1
                          ? "1px solid #bbf7d0"
                          : "none",
                    }}
                  >
                    <span style={{ color: "#166534", fontWeight: "500" }}>
                      {success.employee}
                    </span>
                    <span style={{ color: "#166534", fontSize: "14px" }}>
                      {success.amount ? formatCurrency(success.amount) : "N/A"}
                    </span>
                  </div>
                ))}
                {(batchResult?.successes?.length ?? 0) > 5 && (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#166534",
                      fontSize: "14px",
                      padding: "8px 0",
                      fontStyle: "italic",
                    }}
                  >
                    ...and {(batchResult?.successes?.length ?? 0) - 5} more
                    successful payments
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Failure Details */}
          {batchResult?.failures && batchResult.failures.length > 0 && (
            <div>
              <Typography
                variant="h6"
                sx={{ color: "#dc2626", marginBottom: "12px" }}
              >
                ❌ Failed Payments
              </Typography>
              <div
                style={{
                  background: "#fef2f2",
                  borderRadius: 8,
                  padding: "12px",
                  maxHeight: "200px",
                  overflowY: "auto",
                  marginBottom: "16px",
                }}
              >
                {batchResult?.failures?.slice(0, 5).map((failure, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "8px 0",
                      borderBottom:
                        index <
                        (batchResult?.failures?.slice(0, 5)?.length ?? 0) - 1
                          ? "1px solid #fecaca"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "4px",
                      }}
                    >
                      <span style={{ color: "#991b1b", fontWeight: "500" }}>
                        {failure.employee}
                      </span>
                      <span style={{ color: "#991b1b", fontSize: "14px" }}>
                        {failure.amount
                          ? formatCurrency(failure.amount)
                          : "N/A"}
                      </span>
                    </div>
                    <div
                      style={{
                        color: "#dc2626",
                        fontSize: "13px",
                        fontStyle: "italic",
                      }}
                    >
                      Error: {failure.error}
                    </div>
                  </div>
                ))}
                {(batchResult?.failures?.length ?? 0) > 5 && (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#991b1b",
                      fontSize: "14px",
                      padding: "8px 0",
                      fontStyle: "italic",
                    }}
                  >
                    ...and {(batchResult?.failures?.length ?? 0) - 5} more
                    failed payments
                  </div>
                )}
              </div>

              {/* CSV Download Button */}
              <Button
                variant="contained"
                color="error"
                startIcon={<FaDownload />}
                onClick={() => batchResult && downloadCSV(batchResult.failures)}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: "bold",
                  boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)",
                  "&:hover": {
                    boxShadow: "0 6px 16px rgba(220, 38, 38, 0.4)",
                  },
                }}
              >
                Download Error Report (CSV)
              </Button>
            </div>
          )}

          {/* Document Actions Section - Always show if there are any results */}
          {((batchResult?.successes?.length ?? 0) > 0 ||
            (batchResult?.failures?.length ?? 0) > 0) && (
            <div
              style={{
                marginTop: "24px",
                padding: "20px",
                background: "#f8fafc",
                borderRadius: 12,
                border: "2px solid #e2e8f0",
              }}
            >
              <Typography
                variant="h6"
                sx={{ color: "#374151", marginBottom: "16px" }}
              >
                📄 Document Actions
              </Typography>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {/* PDF Report Button */}
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<FaFilePdf />}
                  onClick={() => batchResult && generatePDF(batchResult)}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: "bold",
                    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                    "&:hover": {
                      boxShadow: "0 6px 16px rgba(59, 130, 246, 0.4)",
                    },
                  }}
                >
                  Generate PDF Report
                </Button>

                {/* Print Report Button */}
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<FaPrint />}
                  onClick={() => batchResult && printReport(batchResult)}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: "bold",
                    borderColor: "#3b82f6",
                    color: "#3b82f6",
                    "&:hover": {
                      borderColor: "#2563eb",
                      backgroundColor: "rgba(59, 130, 246, 0.04)",
                    },
                  }}
                >
                  Print Report
                </Button>

                {/* Success CSV Button - Only show if there are successes */}
                {(batchResult?.successes?.length ?? 0) > 0 && (
                  <Button
                    variant="outlined"
                    color="success"
                    startIcon={<FaDownload />}
                    onClick={() => {
                      if (!batchResult?.successes) return;
                      const successData = batchResult.successes.map(
                        (success) => ({
                          payrollId: success.payrollId,
                          employee: success.employee,
                          amount: success.amount,
                          status: "SUCCESS",
                        })
                      );
                      const header = "Payroll ID,Employee,Amount,Status\n";
                      const rows = successData
                        .map(
                          (s) =>
                            `"${s.payrollId}","${s.employee}","${
                              s.amount ? formatCurrency(s.amount) : "N/A"
                            }","${s.status}"`
                        )
                        .join("\n");
                      const csv = header + rows;
                      const blob = new Blob([csv], {
                        type: "text/csv;charset=utf-8;",
                      });
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = `batch_payment_successes_${
                        new Date().toISOString().split("T")[0]
                      }.csv`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                    }}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: "bold",
                      borderColor: "#16a34a",
                      color: "#16a34a",
                      "&:hover": {
                        borderColor: "#15803d",
                        backgroundColor: "rgba(22, 163, 74, 0.04)",
                      },
                    }}
                  >
                    Download Success Report (CSV)
                  </Button>
                )}
              </div>

              <Typography
                variant="body2"
                sx={{
                  color: "#6b7280",
                  marginTop: "12px",
                  fontSize: "12px",
                  fontStyle: "italic",
                }}
              >
                💡 Tip: Use PDF for formal reports, CSV for data analysis, and
                Print for physical copies.
              </Typography>
            </div>
          )}
        </DialogContent>

        <DialogActions
          sx={{ padding: "16px 24px", borderTop: "1px solid #e5e7eb" }}
        >
          <Button
            onClick={() => setBatchResult(null)}
            variant="outlined"
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {showPayslipModal &&
        (isPayslipLoading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <svg
              className="animate-spin h-8 w-8 text-green-600 mr-2"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            <span className="text-lg text-gray-700">Loading payslip...</span>
          </div>
        ) : (
          selectedPayslip && (
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
          )
        ))}

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

      {/* Email Modal */}
      <Dialog
        open={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            color: "white",
            fontWeight: "bold",
          }}
        >
          📧 Send Payroll Report via Email
        </DialogTitle>
        <DialogContent sx={{ padding: "24px" }}>
          <div className="space-y-4">
            <TextField
              fullWidth
              label="Recipient Email"
              type="email"
              value={emailData.recipientEmail}
              onChange={(e) =>
                setEmailData({ ...emailData, recipientEmail: e.target.value })
              }
              placeholder="Enter email address"
              required
            />

            <TextField
              fullWidth
              label="Subject (Optional)"
              value={emailData.subject}
              onChange={(e) =>
                setEmailData({ ...emailData, subject: e.target.value })
              }
              placeholder="Payroll Report - January 2024"
            />

            <TextField
              fullWidth
              label="Message (Optional)"
              multiline
              rows={3}
              value={emailData.message}
              onChange={(e) =>
                setEmailData({ ...emailData, message: e.target.value })
              }
              placeholder="Please find attached the payroll report..."
            />

            <FormControl fullWidth>
              <InputLabel>Format</InputLabel>
              <Select
                value={emailData.format}
                onChange={(e) =>
                  setEmailData({
                    ...emailData,
                    format: e.target.value as "pdf" | "csv",
                  })
                }
                label="Format"
              >
                <MenuItem value="pdf">PDF</MenuItem>
                <MenuItem value="csv">CSV</MenuItem>
              </Select>
            </FormControl>
          </div>
        </DialogContent>
        <DialogActions
          sx={{ padding: "16px 24px", borderTop: "1px solid #e5e7eb" }}
        >
          <Button
            onClick={() => setShowEmailModal(false)}
            variant="outlined"
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleReportAction()}
            variant="contained"
            disabled={reportLoading || !emailData.recipientEmail}
            startIcon={
              reportLoading ? <CircularProgress size={16} /> : <FaEnvelope />
            }
            sx={{
              borderRadius: 2,
              textTransform: "none",
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              },
              "&:disabled": {
                background: "#9ca3af",
              },
            }}
          >
            {reportLoading ? "Sending..." : "Send Email"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Single Action Confirmation Dialog */}
      <Dialog
        open={showSingleConfirmDialog}
        onClose={() => {
          if (
            !markAsPaidMutation.isPending &&
            !markAsFailedMutation.isPending
          ) {
            setShowSingleConfirmDialog(false);
            setSinglePayrollId("");
            setSinglePayrollData(null);
          }
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            background: singleAction === "markPaid" ? MAIN_GREEN : "#dc2626",
            borderRadius: 18,
            boxShadow: "0 4px 24px 0 rgba(0, 0, 0, 0.15)",
            border: `2px solid ${
              singleAction === "markPaid" ? LIGHT_GREEN_ACCENT : "#b91c1c"
            }`,
            padding: 0,
          },
        }}
      >
        <DialogContent sx={{ p: 0, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "relative", zIndex: 1, padding: "32px" }}>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background:
                    singleAction === "markPaid"
                      ? "rgba(34, 197, 94, 0.2)"
                      : "rgba(220, 38, 38, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  border: `3px solid ${
                    singleAction === "markPaid" ? LIGHT_GREEN_ACCENT : "#b91c1c"
                  }`,
                }}
              >
                {singleAction === "markPaid" ? (
                  <FaCheck size={32} color="white" />
                ) : (
                  <FaTimes size={32} color="white" />
                )}
              </div>

              <Typography
                variant="h5"
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  marginBottom: "8px",
                }}
              >
                {singleAction === "markPaid"
                  ? "Mark as Paid"
                  : "Mark as Failed"}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: "rgba(255, 255, 255, 0.8)",
                  fontSize: "14px",
                }}
              >
                {singleAction === "markPaid"
                  ? "This will mark the payment as completed"
                  : "This will mark the payment as failed"}
              </Typography>
            </div>

            {singlePayrollData && (
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  borderRadius: 12,
                  padding: "20px",
                  marginBottom: "24px",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ color: "white", fontWeight: "600" }}
                  >
                    {getEmployeeName(singlePayrollData.employee)}
                  </Typography>
                  <span
                    style={{
                      background: "rgba(255, 255, 255, 0.2)",
                      color: "white",
                      padding: "4px 12px",
                      borderRadius: 20,
                      fontSize: "12px",
                      fontWeight: "500",
                    }}
                  >
                    {singlePayrollData.department?.name || "Unknown Dept"}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255, 255, 255, 0.8)" }}
                  >
                    Current Status:
                  </Typography>
                  <span
                    style={{
                      background: "rgba(255, 255, 255, 0.2)",
                      color: "white",
                      padding: "4px 12px",
                      borderRadius: 20,
                      fontSize: "12px",
                      fontWeight: "500",
                    }}
                  >
                    {statusLabels[singlePayrollData.status]}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255, 255, 255, 0.8)" }}
                  >
                    Net Salary:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "white", fontWeight: "600" }}
                  >
                    {formatCurrency(singlePayrollData.totals?.netPay)}
                  </Typography>
                </div>
              </div>
            )}

            <div
              style={{
                background: "rgba(255, 193, 7, 0.1)",
                border: "1px solid rgba(255, 193, 7, 0.3)",
                borderRadius: 8,
                padding: "12px",
                marginBottom: "24px",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "rgba(255, 255, 255, 0.9)",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FaExclamationTriangle size={14} />
                {singleAction === "markPaid"
                  ? "This action will mark the payment as completed and move it to Paid status."
                  : "This action will mark the payment as failed and move it to Failed status."}
                This action cannot be undone.
              </Typography>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  if (
                    !markAsPaidMutation.isPending &&
                    !markAsFailedMutation.isPending
                  ) {
                    setShowSingleConfirmDialog(false);
                    setSinglePayrollId("");
                    setSinglePayrollData(null);
                  }
                }}
                disabled={
                  markAsPaidMutation.isPending || markAsFailedMutation.isPending
                }
                sx={{
                  color: "white",
                  borderColor: "rgba(255, 255, 255, 0.3)",
                  "&:hover": {
                    borderColor: "white",
                    background: "rgba(255, 255, 255, 0.1)",
                  },
                  py: 1.5,
                  borderRadius: 2,
                }}
              >
                Cancel
              </Button>

              <Button
                fullWidth
                variant="contained"
                onClick={handleSingleConfirmation}
                disabled={
                  markAsPaidMutation.isPending || markAsFailedMutation.isPending
                }
                sx={{
                  background: "white",
                  color: singleAction === "markPaid" ? MAIN_GREEN : "#dc2626",
                  "&:hover": {
                    background: "rgba(255, 255, 255, 0.9)",
                  },
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: "bold",
                }}
                startIcon={
                  markAsPaidMutation.isPending ||
                  markAsFailedMutation.isPending ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : singleAction === "markPaid" ? (
                    <FaCheck />
                  ) : (
                    <FaTimes />
                  )
                }
              >
                {markAsPaidMutation.isPending || markAsFailedMutation.isPending
                  ? "Processing..."
                  : singleAction === "markPaid"
                  ? "Mark as Paid"
                  : "Mark as Failed"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
