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
  FaCheckSquare,
  FaSquare,
  FaClock,
  FaUserClock,
  FaHourglassHalf,
} from "react-icons/fa";
import {
  adminPayrollService,
  type AdminPayrollResponse,
  type AdminPayrollPeriod,
  type AdminPayrollStats,
} from "../../../services/adminPayrollService";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";
import { UserRole, Permission } from "../../../types/auth";
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
import { Department as DepartmentType } from "../../../types/department";
import { User } from "../../../types/user";
// import { format } from "date-fns";

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
  PENDING: "Pending Approval",
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

interface Department {
  _id: string;
  name: string;
  code: string;
}

const ProcessDepartmentPayroll = () => {
  const { user, hasPermission, hasRole } = useAuth();
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
  const [processingType, setProcessingType] = useState<
    "single" | "multiple" | "department"
  >("single");
  const [processingResults, setProcessingResults] = useState<
    | {
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
      }
    | undefined
  >(undefined);
  const [isProcessing, setIsProcessing] = useState(false);
  const [payrollProcessed, setPayrollProcessed] = useState(false);
  const [selectedPayrollIds, setSelectedPayrollIds] = useState<string[]>([]);
  const [showBulkSubmitModal, setShowBulkSubmitModal] = useState(false);
  const [bulkSubmitRemarks, setBulkSubmitRemarks] = useState("");
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitDialogData, setSubmitDialogData] = useState<{
    type: "single" | "bulk";
    payrollId?: string;
    remarks: string;
  }>({
    type: "single",
    remarks: "",
  });

  // Add state for details and reject dialog
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectingPayrollId, setRejectingPayrollId] = useState<string | null>(
    null
  );
  const [rejectDialogData, setRejectDialogData] = useState<{
    remarks: string;
  }>({
    remarks: "",
  });

  // Add state for approve dialog
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [approvingPayrollId, setApprovingPayrollId] = useState<string | null>(
    null
  );
  const [approveDialogData, setApproveDialogData] = useState<{
    remarks: string;
  }>({
    remarks: "",
  });

  // Add state for processing payment
  const [processingPayrollId, setProcessingPayrollId] = useState<string | null>(
    null
  );

  const [isApproving, setIsApproving] = useState(false);

  // Check if user has permission to process payroll
  const canProcessPayroll = hasPermission(Permission.CREATE_PAYROLL);
  const canApprovePayroll = hasPermission(Permission.EDIT_PAYROLL);
  const canViewPayroll =
    hasPermission(Permission.VIEW_ALL_PAYROLL) ||
    hasPermission(Permission.VIEW_DEPARTMENT_PAYROLL);

  const currentUserId = user?._id;

  useEffect(() => {
    if (payrollProcessed) {
      queryClient.invalidateQueries({ queryKey: ["adminPayrolls"] });
      queryClient.invalidateQueries({ queryKey: ["departmentPayrollStats"] });
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
    queryFn: () => adminPayrollService.getDepartmentPayrolls(),
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
      queryClient.invalidateQueries({ queryKey: ["departmentPayrollStats"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit payroll");
    },
  });

  const handleSubmit = (payrollId: string) => {
    console.log("🔄 Initiating payroll submission:", {
      payrollId,
      timestamp: new Date().toISOString(),
      user: user?._id,
    });
    setSubmitDialogData({
      type: "single",
      payrollId,
      remarks: "",
    });
    setShowSubmitDialog(true);
  };

  const handleViewDetails = (payroll: PayrollData) => {
    console.log("handleViewDetails called with payroll:", payroll._id);
    console.log("Current modal states before changes:");
    console.log("- showDetailsModal:", showDetailsModal);
    console.log("- showRejectDialog:", showRejectDialog);

    // Close all other modals first
    setShowRejectDialog(false);

    // Then set the selected payroll and show details modal
    setSelectedPayroll(payroll);
    setShowDetailsModal(true);

    console.log("Modal states after changes:");
    console.log("- showDetailsModal set to true");
    console.log("- showRejectDialog set to false");
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
    console.log("🔄 handleSinglePayrollSubmit called with data:", data);
    console.log("Current state before processing:");
    console.log("- isProcessing:", isProcessing);
    console.log("- processingType:", processingType);

    setIsProcessing(true);
    setProcessingType(data.employeeIds.length === 1 ? "single" : "multiple");
    console.log(
      "🔄 State updated: isProcessing=true, processingType=" +
        (data.employeeIds.length === 1 ? "single" : "multiple")
    );

    try {
      if (data.employeeIds.length === 1) {
        // Process single employee
        console.log("📝 Starting single employee payroll processing");
        const singleResult =
          await adminPayrollService.processSingleEmployeePayroll({
            employeeId: data.employeeIds[0],
            month: data.month,
            year: data.year,
            frequency: data.frequency,
            salaryGrade: data.salaryGrade,
          });
        console.log(
          "✅ Single employee payroll processing completed with result:",
          singleResult
        );

        // Use the result to set processing results
        setProcessingResults({
          total: 1,
          processed: singleResult.status === "APPROVED" ? 1 : 0,
          skipped: singleResult.status === "DRAFT" ? 1 : 0,
          failed: singleResult.status === "REJECTED" ? 1 : 0,
          errors:
            singleResult.status === "REJECTED"
              ? [
                  {
                    employeeId: singleResult.employee.employeeId,
                    employeeName: singleResult.employee.fullName,
                    reason: "Payroll was rejected",
                    details:
                      singleResult.approvalFlow?.remarks ||
                      "No remarks provided",
                  },
                ]
              : undefined,
        });
        console.log(
          "🔄 State updated: processingResults set for single employee"
        );

        // Show toast after processing is complete
        console.log("🔄 Showing success toast");
        toast.success("Payroll processed successfully");

        setPayrollProcessed(true);
        setShowSingleProcessModal(false);
        console.log(
          "🔄 State updated: payrollProcessed=true, showSingleProcessModal=false"
        );
      } else {
        console.log("📝 Starting multiple employees payroll processing");
        const multipleResult =
          await adminPayrollService.processMultipleEmployeesPayroll({
            employeeIds: data.employeeIds,
            month: data.month,
            year: data.year,
            frequency: data.frequency,
          });
        console.log(
          "✅ Multiple employees payroll processing completed with result:",
          multipleResult
        );

        setProcessingResults(multipleResult);
        console.log(
          "🔄 State updated: processingResults set for multiple employees"
        );

        if (multipleResult.processed > 0) {
          console.log("✅ Showing success toast");
          toast.success(
            `Successfully processed ${multipleResult.processed} payrolls`
          );
        } else {
          console.log("⚠️ Showing warning toast");
          toast.warning("No payrolls were processed");
        }

        setPayrollProcessed(true);
        setShowSingleProcessModal(false);
        console.log(
          "🔄 State updated: payrollProcessed=true, showSingleProcessModal=false"
        );
      }
    } catch (error: any) {
      console.error("❌ Error during payroll processing:", error);
      setProcessingResults({
        total: 0,
        processed: 0,
        skipped: 0,
        failed: 1,
        errors: [
          {
            employeeId: "department",
            employeeName: "Department Payroll",
            reason: "Failed to process department payroll",
            details:
              error.response?.data?.message ||
              error.message ||
              "An unexpected error occurred",
          },
        ],
      });
      console.log("🔄 State updated: processingResults set with error");

      toast.error(error.message || "Failed to process payroll");
    } finally {
      console.log("🔄 Setting isProcessing to false");
      setIsProcessing(false);
    }
  };

  const handleSelectPayroll = (payrollId: string) => {
    setSelectedPayrollIds((prev) => {
      if (prev.includes(payrollId)) {
        return prev.filter((id) => id !== payrollId);
      } else {
        return [...prev, payrollId];
      }
    });
  };

  const handleSelectAll = () => {
    if (!payrollsData?.data?.payrolls) return;

    const draftPayrolls = payrollsData.data.payrolls
      .filter((p: PayrollData) => p.status === PayrollStatus.DRAFT)
      .map((p: PayrollData) => p._id);

    if (selectedPayrollIds.length === draftPayrolls.length) {
      setSelectedPayrollIds([]);
    } else {
      setSelectedPayrollIds(draftPayrolls);
    }
  };

  const handleBulkSubmit = async () => {
    if (selectedPayrollIds.length === 0) {
      toast.warning("Please select at least one payroll to submit");
      return;
    }

    setSubmitDialogData({
      type: "bulk",
      remarks: "",
    });
    setShowSubmitDialog(true);
  };

  const handleConfirmSubmit = async () => {
    console.log("🔄 Starting payroll submission process:", {
      type: submitDialogData.type,
      payrollId: submitDialogData.payrollId,
      selectedPayrollIds,
      timestamp: new Date().toISOString(),
      user: user?._id,
    });

    try {
      if (submitDialogData.type === "single" && submitDialogData.payrollId) {
        console.log(
          "📝 Submitting single payroll:",
          submitDialogData.payrollId
        );
        await submitMutation.mutateAsync(submitDialogData.payrollId);
        console.log("✅ Single payroll submission completed");
        toast.success("Payroll submitted for approval");
      } else if (submitDialogData.type === "bulk") {
        console.log("📝 Submitting bulk payrolls:", selectedPayrollIds);
        const result = await adminPayrollService.submitBulkPayrolls({
          payrollIds: selectedPayrollIds,
          remarks: submitDialogData.remarks,
        });
        console.log("✅ Bulk submission completed:", result);
        toast.success(`${result.length} payrolls submitted successfully`);
        setSelectedPayrollIds([]);
      }
      setShowSubmitDialog(false);
    } catch (error: any) {
      console.error("❌ Submission error:", {
        error: error.message,
        type: submitDialogData.type,
        payrollId: submitDialogData.payrollId,
        timestamp: new Date().toISOString(),
      });
      toast.error(error.message || "Failed to submit payroll(s)");
    }
  };

  const handleProcessDepartmentPayroll = async (data: {
    month: number;
    year: number;
    frequency: string;
  }) => {
    console.log("🔄 handleProcessDepartmentPayroll called with data:", data);
    console.log("Current state before processing:");
    console.log("- isProcessing:", isProcessing);
    console.log("- processingType:", processingType);

    setIsProcessing(true);
    setProcessingType("department");
    console.log(
      "🔄 State updated: isProcessing=true, processingType=department"
    );

    try {
      console.log("📝 Starting department payroll processing");
      const departmentResult =
        await adminPayrollService.processDepartmentPayroll({
          month: data.month,
          year: data.year,
          frequency: data.frequency,
        });
      console.log(
        "✅ Department payroll processing completed with result:",
        departmentResult
      );

      // Transform the departmentResult into the expected format
      const processedResults = {
        total: departmentResult.length,
        processed: departmentResult.filter(
          (p: PayrollData) => p.status === "APPROVED"
        ).length,
        skipped: departmentResult.filter(
          (p: PayrollData) => p.status === "DRAFT"
        ).length,
        failed: departmentResult.filter(
          (p: PayrollData) => p.status === "REJECTED"
        ).length,
        errors: departmentResult
          .filter((p: PayrollData) => p.status === "REJECTED")
          .map((p: PayrollData) => ({
            employeeId: p.employee.employeeId,
            employeeName: p.employee.fullName,
            reason: "Payroll was rejected",
            details: p.approvalFlow.remarks || "No remarks provided",
          })),
      };
      console.log("🔄 Transformed results:", processedResults);

      setProcessingResults(processedResults);
      console.log("🔄 State updated: processingResults set");

      if (processedResults.processed > 0) {
        console.log("✅ Showing success toast");
        toast.success(
          `Successfully processed ${processedResults.processed} department payrolls`
        );
      } else {
        console.log("⚠️ Showing warning toast");
        toast.warning("No department payrolls were processed");
      }

      console.log("🔄 Invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["adminPayrolls"] });
      queryClient.invalidateQueries({ queryKey: ["departmentPayrollStats"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (error: any) {
      console.error("❌ Error during department payroll processing:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "An unexpected error occurred";

      setProcessingResults({
        total: 0,
        processed: 0,
        skipped: 0,
        failed: 1,
        errors: [
          {
            employeeId: "department",
            employeeName: "Department Payroll",
            reason: "Failed to process department payroll",
            details: errorMessage,
          },
        ],
      });
      console.log("🔄 State updated: processingResults set with error");

      toast.error(errorMessage);
    } finally {
      console.log("🔄 Setting isProcessing to false");
      setIsProcessing(false);
    }
  };

  // Add mutation hooks for reject and process payment
  const rejectMutation = useMutation({
    mutationFn: ({
      payrollId,
      remarks,
    }: {
      payrollId: string;
      remarks: string;
    }) => adminPayrollService.rejectPayroll(payrollId, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPayrolls"] });
      queryClient.invalidateQueries({ queryKey: ["departmentPayrollStats"] });
      toast.success("Payroll rejected successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to reject payroll");
    },
  });

  const processPaymentMutation = useMutation({
    mutationFn: (payrollId: string) =>
      adminPayrollService.processPayment(payrollId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPayrolls"] });
      queryClient.invalidateQueries({ queryKey: ["departmentPayrollStats"] });
      toast.success("Payment processed successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to process payment");
    },
  });

  // Add approve mutation
  const approveMutation = useMutation({
    mutationFn: ({
      payrollId,
      remarks,
    }: {
      payrollId: string;
      remarks: string;
    }) => adminPayrollService.approvePayroll(payrollId, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPayrolls"] });
      queryClient.invalidateQueries({ queryKey: ["departmentPayrollStats"] });
      toast.success("Payroll approved successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to approve payroll");
    },
  });

  // Add handler functions
  const handleReject = (payrollId: string) => {
    // Close all other modals first
    setShowDetailsModal(false);
    // Then show reject dialog
    setShowRejectDialog(true);
    setSelectedPayrollId(payrollId);
    setRejectingPayrollId(payrollId);
    setRejectDialogData({ remarks: "" });
  };

  const handleConfirmReject = async () => {
    if (!selectedPayrollId) return;

    try {
      await rejectMutation.mutateAsync({
        payrollId: selectedPayrollId,
        remarks: rejectDialogData.remarks,
      });
      setShowRejectDialog(false);
      setSelectedPayrollId(null);
      setRejectingPayrollId(null);
      setRejectDialogData({ remarks: "" });
    } catch (error) {
      console.error("Error rejecting payroll:", error);
      setRejectingPayrollId(null);
    }
  };

  const handleProcessPayment = async (payrollId: string) => {
    setProcessingPayrollId(payrollId);
    try {
      await processPaymentMutation.mutateAsync(payrollId);
      setProcessingPayrollId(null);
    } catch (error) {
      console.error("Error processing payment:", error);
      setProcessingPayrollId(null);
    }
  };

  const handleApprove = (payrollId: string) => {
    setApprovingPayrollId(payrollId);
    setApproveDialogData({ remarks: "" });
    setShowApproveDialog(true);
  };

  const handleConfirmApprove = async () => {
    if (!approvingPayrollId) return;

    try {
      setIsApproving(true);
      await approveMutation.mutateAsync({
        payrollId: approvingPayrollId,
        remarks: approveDialogData.remarks || "Approved by Department Head",
      });
      setShowApproveDialog(false);
      setApprovingPayrollId(null);
      setApproveDialogData({ remarks: "" });
    } catch (error) {
      console.error("Error approving payroll:", error);
    } finally {
      setIsApproving(false);
    }
  };

  const isLoadingCombined = isPeriodsLoading || isStatsLoading || isLoading;

  const payrolls = payrollsData?.data?.payrolls ?? [];

  const getStatusIcon = (
    status: PayrollStatus,
    approvalFlow?: PayrollData["approvalFlow"]
  ) => {
    // Check if current user is Department Head and payroll is at Department Head level
    const isDepartmentHead =
      user?.position &&
      [
        "Head of Department",
        "Department Head",
        "Head",
        "Director",
        "Manager",
      ].some((pos) => user.position.toLowerCase().includes(pos.toLowerCase()));

    if (
      status === PayrollStatus.PENDING &&
      approvalFlow?.currentLevel === "DEPARTMENT_HEAD" &&
      isDepartmentHead
    ) {
      return <FaCheck className="text-green-500" />;
    }

    switch (status) {
      case PayrollStatus.DRAFT:
        return <FaFileAlt className="text-gray-500" />;
      case PayrollStatus.PENDING:
        return <FaClock className="text-yellow-500" />;
      case PayrollStatus.APPROVED:
        return <FaCheck className="text-green-500" />;
      case PayrollStatus.REJECTED:
        return <FaTimes className="text-red-500" />;
      case PayrollStatus.PAID:
        return <FaMoneyBill className="text-blue-500" />;
      default:
        return <FaFileAlt className="text-gray-500" />;
    }
  };

  // Helper function to check if department is HR
  const isHRDepartment = (
    department: string | { _id: string; name: string; code: string } | undefined
  ): boolean => {
    if (!department) return false;

    // If department is a string (ID)
    if (typeof department === "string") {
      const deptLower = department.toLowerCase();
      return (
        deptLower === "hr" ||
        deptLower === "human resources" ||
        deptLower.includes("hr") ||
        deptLower.includes("human resources")
      );
    }

    // If department is an object
    const deptNameLower = department.name.toLowerCase();
    return (
      deptNameLower === "hr" ||
      deptNameLower === "human resources" ||
      deptNameLower.includes("hr") ||
      deptNameLower.includes("human resources")
    );
  };

  // Special case for HR department
  const isHR = user ? isHRDepartment(user.department) : false;

  // Check if user has an HR-related position
  const hasHRPosition = (position: string): boolean => {
    if (!position) return false;
    const positionLower = position.toLowerCase();
    return [
      "head of human resources",
      "hr manager",
      "hr head",
      "human resources manager",
      "hr director",
      "head of hr",
      "hr",
      "human resources",
    ].some((pos) => positionLower.includes(pos));
  };

  // Check if user has HR position
  const isHRPosition = user ? hasHRPosition(user.position) : false;

  console.log("User department and position check:", {
    department: user?.department,
    position: user?.position,
    isHR,
    isHRPosition,
  });

  // Get status text based on approval flow
  const getStatusText = (
    status: string,
    approvalFlow?: { currentLevel?: string }
  ) => {
    if (status === PayrollStatus.PENDING && approvalFlow?.currentLevel) {
      const approvalOrder = [
        "DEPARTMENT_HEAD",
        "HR_MANAGER",
        "FINANCE_DIRECTOR",
        "SUPER_ADMIN",
        "COMPLETED",
      ];
      const currentIndex = approvalOrder.indexOf(approvalFlow.currentLevel);
      const nextLevel = approvalOrder[currentIndex + 1];

      // Special case for HR department
      if (isHR && approvalFlow.currentLevel === "DEPARTMENT_HEAD") {
        return "Pending HR Manager approval";
      }

      return `Pending ${approvalFlow.currentLevel
        .replace(/_/g, " ")
        .toLowerCase()} approval`;
    }
    return statusLabels[status] || status;
  };

  // Function to determine if approval buttons should be shown
  const showApprovalButtons = (
    currentLevel: string,
    userPosition: string,
    payrollStatus: string
  ): boolean => {
    // Don't show approve button if payroll is not pending
    if (payrollStatus !== "PENDING") {
      return false;
    }

    const userPositionLower = userPosition.toLowerCase();

    console.log("showApprovalButtons called with:", {
      currentLevel,
      userPosition,
      userPositionLower,
      isHR,
      isHRPosition,
      payrollStatus,
    });

    // For HR department users
    if (isHR && isHRPosition) {
      // HR users can approve at HR_MANAGER level
      if (currentLevel === "HR_MANAGER") {
        return true;
      }
      return false; // HR users can only approve at HR_MANAGER level
    }

    // For non-HR department users
    const canApprove =
      (currentLevel === "DEPARTMENT_HEAD" &&
        ["head", "director", "manager"].some((pos) =>
          userPositionLower.includes(pos)
        )) ||
      (currentLevel === "HR_MANAGER" &&
        userPositionLower.includes("hr manager")) ||
      (currentLevel === "FINANCE_DIRECTOR" &&
        [
          "head of finance",
          "finance director",
          "finance head",
          "finance manager",
        ].some((pos) => userPositionLower.includes(pos.toLowerCase()))) ||
      (currentLevel === "SUPER_ADMIN" && userPositionLower.includes("admin"));

    console.log("Non-HR user:", {
      currentLevel,
      canApprove,
      userPositionLower,
    });

    return canApprove;
  };

  // Function to determine if rejection buttons should be shown
  const showRejectionButtons = (
    currentLevel: string,
    userPosition: string,
    payrollStatus: string
  ): boolean => {
    // Don't show reject button if payroll is not pending
    if (payrollStatus !== "PENDING") {
      return false;
    }

    const userPositionLower = userPosition.toLowerCase();

    console.log("showRejectionButtons called with:", {
      currentLevel,
      userPosition,
      userPositionLower,
      isHR,
      isHRPosition,
      payrollStatus,
    });

    // For HR department users, they can reject at any level if they have the permission
    if (isHR) {
      // Check if the user has an HR-related position
      const hrPositions = [
        "head of human resources",
        "hr manager",
        "hr head",
        "human resources manager",
        "hr director",
        "head of hr",
        "hr",
        "human resources",
      ];

      // Check if any of the HR positions are included in the user's position
      const canReject = hrPositions.some((pos) =>
        userPositionLower.includes(pos)
      );
      console.log("HR user can reject:", {
        hrPositions,
        canReject,
      });
      return canReject;
    }

    // For non-HR department users, they can reject if they have the permission
    const canReject = ["head", "director", "manager", "admin"].some((pos) =>
      userPositionLower.includes(pos)
    );

    console.log("Non-HR user can reject:", {
      canReject,
    });

    return canReject;
  };

  // Add debug effect for payroll approval checks
  useEffect(() => {
    payrolls.forEach((payroll) => {
      if (payroll.status === "PENDING") {
        console.log("Payroll approval check:", {
          currentLevel: payroll.approvalFlow?.currentLevel,
          userPosition: user?.position,
          payrollStatus: payroll.status,
          isHR,
          isHRPosition,
          showApprovalResult: showApprovalButtons(
            payroll.approvalFlow?.currentLevel || "",
            user?.position || "",
            payroll.status
          ),
          showHRApproval:
            isHR &&
            isHRPosition &&
            payroll.approvalFlow?.currentLevel === "HR_MANAGER",
        });
      }
    });
  }, [payrolls, user?.position, isHR, isHRPosition]);

  const PayrollTable = () => (
    <div className="space-y-2 mt-3">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <button
            onClick={handleSelectAll}
            className="flex items-center text-sm text-gray-600 hover:text-green-600 cursor-pointer"
          >
            {selectedPayrollIds.length ===
              payrollsData?.data?.payrolls?.filter(
                (p: PayrollData) => p.status === PayrollStatus.DRAFT
              ).length &&
            payrollsData?.data?.payrolls?.filter(
              (p: PayrollData) => p.status === PayrollStatus.DRAFT
            ).length > 0 ? (
              <FaCheckSquare className="mr-1 text-green-600" />
            ) : (
              <FaSquare className="mr-1" />
            )}
            Select All Draft Payrolls
          </button>
        </div>
        {selectedPayrollIds.length > 1 && (
          <button
            onClick={handleBulkSubmit}
            className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer"
          >
            <FaPaperPlane className="mr-1" />
            Submit Selected ({selectedPayrollIds.length})
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <TableContainer component={Paper} className="rounded-lg shadow">
          <Table size="small" className="min-w-full">
            <TableHead className="bg-green-600">
              <TableRow>
                <TableCell className="!text-white font-semibold !py-2 w-10">
                  Select
                </TableCell>
                <TableCell className="!text-white font-semibold !py-2">
                  Employee
                </TableCell>
                <TableCell className="!text-white font-semibold !py-2">
                  Department
                </TableCell>
                <TableCell className="!text-white font-semibold !py-2">
                  Basic Salary
                </TableCell>
                <TableCell className="!text-white font-semibold !py-2">
                  Allowances
                </TableCell>
                <TableCell className="!text-white font-semibold !py-2">
                  Deductions
                </TableCell>
                <TableCell className="!text-white font-semibold !py-2">
                  Net Pay
                </TableCell>
                <TableCell className="!text-white font-semibold !py-2">
                  Status
                </TableCell>
                <TableCell className="!text-white font-semibold !py-2">
                  Period
                </TableCell>
                {canViewPayroll && (
                  <TableCell
                    className="!text-white font-semibold !py-2"
                    align="center"
                    width="120px"
                  >
                    Actions
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {payrollsData?.data?.payrolls &&
              payrollsData.data.payrolls.length > 0 ? (
                payrollsData.data.payrolls.map((payroll: PayrollData) => (
                  <TableRow
                    key={payroll._id}
                    className="hover:bg-green-50 transition-colors duration-150"
                    onClick={() => handleViewDetails(payroll)}
                  >
                    <TableCell className="!py-2">
                      {payroll.status === "DRAFT" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPayroll(payroll._id);
                          }}
                          className="text-green-600 hover:text-green-800 cursor-pointer"
                        >
                          {selectedPayrollIds.includes(payroll._id) ? (
                            <FaCheckSquare />
                          ) : (
                            <FaSquare />
                          )}
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="!py-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {payroll.employee.fullName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {payroll.employee.employeeId}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="!py-2">
                      <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                        {payroll.department.name}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium !py-2">
                      ₦{payroll.totals.basicSalary.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium !py-2">
                      ₦{payroll.totals.totalAllowances.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium !py-2">
                      ₦{payroll.totals.totalDeductions.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium text-green-600 !py-2">
                      ₦{payroll.totals.netPay.toLocaleString()}
                    </TableCell>
                    <TableCell className="!py-2">
                      <div className="flex items-center">
                        {getStatusIcon(payroll.status, payroll.approvalFlow)}
                        <span className="ml-2 text-sm text-gray-900">
                          {getStatusText(payroll.status, payroll.approvalFlow)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="!py-2">
                      <div className="flex flex-col text-xs">
                        <span>
                          {new Date(payroll.periodStart).toLocaleDateString()}
                        </span>
                        <span>
                          {new Date(payroll.periodEnd).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    {canViewPayroll && (
                      <TableCell align="center" className="!py-2">
                        <div
                          className="flex space-x-2 justify-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(payroll);
                            }}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-full transition-colors duration-150 cursor-pointer"
                            title="View Details"
                          >
                            <FaEye className="w-3.5 h-3.5" />
                          </button>

                          {payroll.status === "DRAFT" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSubmit(payroll._id);
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-150 cursor-pointer"
                              title="Submit for Approval"
                            >
                              <FaPaperPlane className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {payroll.status === "PENDING" && (
                            <>
                              {(showApprovalButtons(
                                payroll.approvalFlow?.currentLevel || "",
                                user?.position || "",
                                payroll.status
                              ) ||
                                (isHR &&
                                  isHRPosition &&
                                  payroll.approvalFlow?.currentLevel ===
                                    "HR_MANAGER")) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApprove(payroll._id);
                                  }}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-full transition-colors duration-150 cursor-pointer"
                                  title={
                                    payroll.approvalFlow?.currentLevel ===
                                    "DEPARTMENT_HEAD"
                                      ? "Approve as HOD"
                                      : payroll.approvalFlow?.currentLevel ===
                                        "HR_MANAGER"
                                      ? "Approve as HR Manager"
                                      : "Approve"
                                  }
                                  disabled={
                                    approveMutation.isPending &&
                                    approvingPayrollId === payroll._id
                                  }
                                >
                                  {approveMutation.isPending &&
                                  approvingPayrollId === payroll._id ? (
                                    <FaSpinner className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <FaCheck className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}

                              {(showRejectionButtons(
                                payroll.approvalFlow?.currentLevel || "",
                                user?.position || "",
                                payroll.status
                              ) ||
                                (isHR && isHRPosition)) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReject(payroll._id);
                                  }}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors duration-150 cursor-pointer"
                                  title="Reject"
                                  disabled={
                                    rejectMutation.isPending &&
                                    rejectingPayrollId === payroll._id
                                  }
                                >
                                  {rejectMutation.isPending &&
                                  rejectingPayrollId === payroll._id ? (
                                    <FaSpinner className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <FaTimes className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </>
                          )}

                          {payroll.status === "APPROVED" &&
                            canProcessPayroll && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleProcessPayment(payroll._id);
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-150 cursor-pointer"
                                title="Process Payment"
                                disabled={
                                  processPaymentMutation.isPending &&
                                  processingPayrollId === payroll._id
                                }
                              >
                                {processPaymentMutation.isPending &&
                                processingPayrollId === payroll._id ? (
                                  <FaSpinner className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <FaMoneyBill className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} align="center" className="!py-4">
                    No payrolls found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

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
                  payrollsData.data.pagination.total
                )}
              </span>{" "}
              of{" "}
              <span className="font-medium">
                {payrollsData.data.pagination.total}
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

      {canProcessPayroll && (
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowSingleProcessModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
          >
            <FaPlus className="mr-2" />
            Process Payroll
          </button>
        </div>
      )}

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

      {/* Submit Payroll Dialog */}
      {showSubmitDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {submitDialogData.type === "single"
                ? "Submit Payroll"
                : "Submit Selected Payrolls"}
            </h3>
            <p className="mb-4">
              {submitDialogData.type === "single"
                ? "Are you sure you want to submit this payroll for approval?"
                : `You are about to submit ${selectedPayrollIds.length} payroll(s) for approval.`}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks (Optional)
              </label>
              <textarea
                className="w-full p-2 border rounded-md"
                rows={3}
                value={submitDialogData.remarks}
                onChange={(e) =>
                  setSubmitDialogData((prev) => ({
                    ...prev,
                    remarks: e.target.value,
                  }))
                }
                placeholder="Add any remarks for the submission..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowSubmitDialog(false)}
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={submitMutation.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {submitMutation.isPending ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Reject Payroll</h3>
            <p className="mb-4">
              Are you sure you want to reject this payroll?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rejection Reason (Required)
              </label>
              <textarea
                className="w-full p-2 border rounded-md"
                rows={3}
                value={rejectDialogData.remarks}
                onChange={(e) =>
                  setRejectDialogData((prev) => ({
                    ...prev,
                    remarks: e.target.value,
                  }))
                }
                placeholder="Please provide a reason for rejection..."
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowRejectDialog(false);
                  setSelectedPayrollId(null);
                  setRejectingPayrollId(null);
                  setRejectDialogData({ remarks: "" });
                }}
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={
                  rejectMutation.isPending || !rejectDialogData.remarks.trim()
                }
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {rejectMutation.isPending ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <span>Reject</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Dialog */}
      {showApproveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Approve Payroll</h3>
            <p className="mb-4">
              {(typeof user?.department === "object" &&
                user?.department?.name === "Human Resources") ||
              (typeof user?.department === "object" &&
                user?.department?.name === "HR") ||
              (typeof user?.department === "string" &&
                (user?.department === "Human Resources" ||
                  user?.department === "HR"))
                ? "Are you sure you want to approve this payroll as HR Manager?"
                : "Are you sure you want to approve this payroll as Department Head?"}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks (Optional)
              </label>
              <textarea
                className="w-full p-2 border rounded-md"
                rows={3}
                value={approveDialogData.remarks}
                onChange={(e) =>
                  setApproveDialogData((prev) => ({
                    ...prev,
                    remarks: e.target.value,
                  }))
                }
                placeholder="Add any remarks for the approval..."
                disabled={isApproving}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowApproveDialog(false);
                  setApprovingPayrollId(null);
                  setApproveDialogData({ remarks: "" });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                disabled={isApproving}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApprove}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
                disabled={isApproving}
              >
                {isApproving ? (
                  <>
                    <FaSpinner className="mr-2 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <FaCheck className="mr-2" />
                    Approve
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessDepartmentPayroll;
