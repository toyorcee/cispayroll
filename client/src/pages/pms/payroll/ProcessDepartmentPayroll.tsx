import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  FaExclamationTriangle,
  FaPlus,
  FaSpinner,
  FaLeaf,
  FaInfoCircle,
  FaCalendarAlt,
  FaHandHoldingUsd,
  FaMinusCircle,
  FaPlusCircle,
  FaUserShield,
  FaUsers,
  FaShieldAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaMoneyBillWave,
  FaTimes,
  FaDownload,
} from "react-icons/fa";
import { adminPayrollService } from "../../../services/adminPayrollService";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";
import { Permission } from "../../../types/auth";
import { PayrollData } from "../../../types/payroll";
import PayrollDetailsModal from "../../../components/payroll/processpayroll/admin/PayrollDetailsModal";
import SingleEmployeeProcessModal from "../../../components/payroll/processpayroll/admin/SingleEmployeeProcessModal";
import PayrollTable, {
  Payroll,
} from "../../../components/payroll/processpayroll/admin/PayrollTable";
import approvalService from "../../../services/approvalService";
import {
  Box,
  Tab,
  Tabs,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Typography,
} from "@mui/material";
import ApprovalTimeline from "../../../components/payroll/processpayroll/admin/ApprovalTimeline";
import PayrollDashboard from "../../../components/payroll/processpayroll/PayrollDashboard";
import TableSkeleton from "../../../components/skeletons/TableSkeleton";
import { motion, AnimatePresence } from "framer-motion";

const MAIN_GREEN = "#27ae60";
const LIGHT_GREEN_BG = "#f6fcf7";
const LIGHT_GREEN_ACCENT = "#eafaf1";

// Beautiful Info Section for Department Payroll Page
const DepartmentPayrollInfoSection = () => (
  <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4 mb-8 shadow-sm">
    <div className="flex items-center mb-3">
      <FaInfoCircle className="text-green-600 text-lg mr-2" />
      <h3 className="text-base font-semibold text-gray-800">
        Department Payroll Processing Info
      </h3>
    </div>
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-3">
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
            <FaCalendarAlt className="text-green-600 text-xs" />
          </div>
          <div>
            <h4 className="font-medium text-gray-800 text-sm mb-1">
              Payroll Period
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Processes payroll for <strong>all active employees</strong> in the
              department for the selected period.
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
            <FaUserShield className="text-purple-600 text-xs" />
          </div>
          <div>
            <h4 className="font-medium text-gray-800 text-sm mb-1">
              Approval Workflow
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              <strong>Super Admin payrolls</strong> are{" "}
              <span className="text-green-700 font-semibold">
                automatically approved
              </span>
              .<br />
              Payrolls created by others require approval from{" "}
              <strong>Department Head</strong>, <strong>HR Manager</strong>, and{" "}
              <strong>Finance Director</strong>.
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <h4 className="font-medium text-gray-800 text-sm mb-2">
          What's Included:
        </h4>
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
            <FaPlusCircle className="text-blue-600 text-xs" />
          </div>
          <div>
            <h5 className="font-medium text-gray-700 text-xs mb-1">
              Allowances
            </h5>
            <p className="text-xs text-gray-600 leading-relaxed">
              Personal and department allowances with valid dates.
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 w-4 h-4 bg-yellow-100 rounded-full flex items-center justify-center">
            <FaHandHoldingUsd className="text-yellow-600 text-xs" />
          </div>
          <div>
            <h5 className="font-medium text-gray-700 text-xs mb-1">Bonuses</h5>
            <p className="text-xs text-gray-600 leading-relaxed">
              Approved bonuses with payment dates in the period.
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">
            <FaMinusCircle className="text-red-600 text-xs" />
          </div>
          <div>
            <h5 className="font-medium text-gray-700 text-xs mb-1">
              Deductions
            </h5>
            <p className="text-xs text-gray-600 leading-relaxed">
              Active voluntary and statutory deductions.
            </p>
          </div>
        </div>
      </div>
    </div>
    <div className="mt-4 pt-3 border-t border-green-200">
      <div className="flex items-center mb-2">
        <FaLeaf className="text-green-600 text-xs mr-1" />
        <span className="text-xs font-medium text-gray-700">Quick Tips</span>
      </div>
      <div className="grid grid-cols-1 gap-1 text-xs text-gray-600">
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
          <span>Only processes employees with assigned grade levels</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
          <span>Skips employees with existing payrolls for the period</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
          <span>Shows detailed results after processing</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
          <span>Super Admin payrolls are instantly approved</span>
        </div>
      </div>
    </div>
  </div>
);

const ProcessDepartmentPayroll = () => {
  const { user, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [isResubmitting, setIsResubmitting] = useState(false);

  // Improve type safety for department checking
  const isHRDepartment = (
    department: { _id: string; name: string; code: string } | string | undefined
  ): boolean => {
    if (!department) return false;

    const getDepartmentName = (dept: typeof department): string => {
      if (typeof dept === "string") return dept;
      return dept.name;
    };

    const deptName = getDepartmentName(department).toLowerCase();
    return ["hr", "human resources"].some((term) => deptName.includes(term));
  };

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

  // Check if user has permission to process payroll
  const canProcessPayroll = hasPermission(Permission.CREATE_PAYROLL);
  const canApprovePayroll = hasPermission(Permission.EDIT_PAYROLL);
  const canViewPayroll =
    hasPermission(Permission.VIEW_ALL_PAYROLL) ||
    hasPermission(Permission.VIEW_DEPARTMENT_PAYROLL);

  const isInHRDepartment = user ? isHRDepartment(user.department) : false;
  const canProcessHRPayroll =
    (isInHRDepartment || isHRPosition) &&
    hasPermission(Permission.CREATE_PAYROLL);

  const [activeTab, setActiveTab] = useState(0);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollData | null>(
    null
  );
  const [showSingleProcessModal, setShowSingleProcessModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [payrollProcessed, setPayrollProcessed] = useState(false);
  const [selectedPayrollIds, setSelectedPayrollIds] = useState<string[]>([]);
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
  // const [showRejectDialog, setShowRejectDialog] = useState(false);
  // const [rejectingPayrollId, setRejectingPayrollId] = useState<string | null>(
  //   null
  // );
  // const [rejectDialogData, setRejectDialogData] = useState<{
  //   reason: string;
  // }>({
  //   reason: "",
  // });

  // Add state for approve dialog
  const [_showApproveDialog, setShowApproveDialog] = useState(false);
  const [approvingPayrollId, setApprovingPayrollId] = useState<string | null>(
    null
  );
  const [approveDialogData, setApproveDialogData] = useState<{
    remarks: string;
  }>({
    remarks: "",
  });

  const [isApproving, setIsApproving] = useState(false);
  // const [isRejecting, setIsRejecting] = useState(false);

  // Add confirmation dialog states
  const [showApproveConfirmDialog, setShowApproveConfirmDialog] =
    useState(false);
  const [showRejectConfirmDialog, setShowRejectConfirmDialog] = useState(false);
  const [showSubmitConfirmDialog, setShowSubmitConfirmDialog] = useState(false);
  const [showResubmitConfirmDialog, setShowResubmitConfirmDialog] =
    useState(false);
  const [showCreatePayrollConfirm, setShowCreatePayrollConfirm] =
    useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: "approve" | "reject" | "submit" | "resubmit";
    payroll: Payroll | null;
  }>({ type: "approve", payroll: null });

  // Add state for processing summary
  const [processingSummary, setProcessingSummary] = useState<any | null>(null);
  const [showSummaryCard, setShowSummaryCard] = useState(false);
  const [_summaryType, setSummaryType] = useState<
    "processing" | "approval" | "rejection" | "submission" | "general"
  >("processing");

  // Add statistics query
  const { data: processingStats } = useQuery({
    queryKey: ["payrollProcessingStats"],
    queryFn: () => adminPayrollService.getProcessingStatistics(user?.role),
    enabled: !!user?.role,
  });

  const [showApprovalJourney, setShowApprovalJourney] = useState(false);
  const [selectedPayrollForJourney, setSelectedPayrollForJourney] =
    useState<Payroll | null>(null);

  // Add helper function to check if a level has been approved
  const isLevelApproved = (
    history: Array<{
      level: string;
      status: string;
      action?: string;
      timestamp?: string;
      remarks?: string;
    }>,
    level: string
  ): boolean => {
    // Special case: If payroll is created by HR and it's Department Head level
    if (level === "DEPARTMENT_HEAD") {
      // Check if there's a submission by HR
      const hrSubmission = history.find(
        (h) =>
          h.level === "HR_MANAGER" &&
          h.status === "PENDING" &&
          h.action === "SUBMIT"
      );
      if (hrSubmission) {
        return true; // Department Head is considered approved if HR submitted
      }
    }
    return history.some((h) => h.level === level && h.status === "APPROVED");
  };

  // Add helper function to check if a level is pending
  const isLevelPending = (
    history: Array<{
      level: string;
      status: string;
      action?: string;
      timestamp?: string;
      remarks?: string;
    }>,
    currentLevel: string,
    level: string
  ): boolean => {
    if (level === "DEPARTMENT_HEAD") {
      const hrSubmission = history.find(
        (h) =>
          h.level === "HR_MANAGER" &&
          h.status === "PENDING" &&
          h.action === "SUBMIT"
      );
      if (hrSubmission) {
        return false;
      }
    }
    if (currentLevel === level) return true;
    if (!history.some((h) => h.level === level)) return true;
    return false;
  };

  // Add this helper function near the other helper functions
  const isHRManagerCreated = (
    history: Array<{
      level: string;
      status: string;
      action?: string;
      timestamp?: string;
      remarks?: string;
    }>
  ): boolean => {
    return history.some(
      (h) =>
        h.level === "HR_MANAGER" &&
        h.status === "PENDING" &&
        h.action === "SUBMIT"
    );
  };

  useEffect(() => {
    if (payrollProcessed) {
      queryClient.invalidateQueries({ queryKey: ["adminPayrolls"] });
      queryClient.invalidateQueries({ queryKey: ["departmentPayrollStats"] });
      setPayrollProcessed(false);
    }
  }, [payrollProcessed, queryClient]);

  const {
    data: payrolls,
    isLoading: isPayrollsLoading,
    error: payrollsError,
  } = useQuery({
    queryKey: ["departmentPayrolls"],
    queryFn: () => adminPayrollService.getDepartmentPayrolls(user?.role),
  });

  const { isLoading: isPeriodsLoading } = useQuery({
    queryKey: ["departmentPayrollPeriods"],
    queryFn: () => adminPayrollService.getPayrollPeriods(user?.role),
  });

  const { isLoading: isStatsLoading } = useQuery({
    queryKey: ["departmentPayrollStats"],
    queryFn: () => {
      return adminPayrollService.getPayrollStats(user?.role).then((stats) => {
        return stats;
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: (data: { payrollId: string; remarks?: string }) =>
      adminPayrollService.submitPayroll(
        data.payrollId,
        user?.role,
        data.remarks
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPayrolls"] });
      queryClient.invalidateQueries({ queryKey: ["departmentPayrollStats"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit payroll");
    },
  });

  const handleViewDetails = (payroll: Payroll) => {
    const payrollData = payrolls?.data?.payrolls.find(
      (p: PayrollData) => p._id === payroll._id
    );
    if (payrollData) {
      setSelectedPayroll(payrollData);
    }
  };

  const handleSelectPayroll = (selectedIds: string[]) => {
    setSelectedPayrollIds(selectedIds);
  };

  const handleConfirmSubmit = async () => {
    try {
      if (submitDialogData.type === "single" && submitDialogData.payrollId) {
        await submitMutation.mutateAsync({
          payrollId: submitDialogData.payrollId,
          remarks: submitDialogData.remarks,
        });

        // Invalidate all relevant queries
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["adminPayrolls"] }),
          queryClient.invalidateQueries({
            queryKey: ["departmentPayrollStats"],
          }),
          queryClient.invalidateQueries({ queryKey: ["departmentPayrolls"] }),
          queryClient.invalidateQueries({
            queryKey: ["payrollProcessingStats"],
          }),
          queryClient.invalidateQueries({ queryKey: ["notifications"] }),
        ]);

        // Force immediate refetch
        await queryClient.refetchQueries({
          queryKey: ["departmentPayrolls"],
          type: "active",
        });

        toast.success("Payroll submitted for approval");
      } else if (submitDialogData.type === "bulk") {
        const result = await adminPayrollService.submitBulkPayrolls({
          payrollIds: selectedPayrollIds,
          remarks: submitDialogData.remarks,
        });

        // Invalidate all relevant queries
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["adminPayrolls"] }),
          queryClient.invalidateQueries({
            queryKey: ["departmentPayrollStats"],
          }),
          queryClient.invalidateQueries({ queryKey: ["departmentPayrolls"] }),
          queryClient.invalidateQueries({
            queryKey: ["payrollProcessingStats"],
          }),
          queryClient.invalidateQueries({ queryKey: ["notifications"] }),
        ]);

        // Force immediate refetch
        await queryClient.refetchQueries({
          queryKey: ["departmentPayrolls"],
          type: "active",
        });

        toast.success(`${result.length} payrolls submitted successfully`);
        setSelectedPayrollIds([]);
      }
      setShowSubmitDialog(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit payroll(s)");
    }
  };

  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [selectedPayrollId, setSelectedPayrollId] = useState<string | null>(
    null
  );

  const handleReject = async (payrollId: string) => {
    try {
      await adminPayrollService.rejectPayroll({
        payrollId,
        reason: rejectionReason,
        userRole: user?.role,
      });
      setRejectionReason("");
      setRejectionDialogOpen(false);

      // Invalidate and refetch payrolls data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["adminPayrolls"] }),
        queryClient.invalidateQueries({ queryKey: ["departmentPayrollStats"] }),
        queryClient.invalidateQueries({ queryKey: ["departmentPayrolls"] }),
        queryClient.invalidateQueries({ queryKey: ["payrollProcessingStats"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      ]);

      // Force immediate refetch
      await queryClient.refetchQueries({
        queryKey: ["departmentPayrolls"],
        type: "active",
      });

      toast.success("Payroll rejected successfully");
    } catch (error) {
      console.error("Error rejecting payroll:", error);
      toast.error("Failed to reject payroll");
    }
  };

  const handleSubmitForApproval = (payroll: Payroll) => {
    setSubmitDialogData({
      type: "single",
      payrollId: payroll._id,
      remarks: "",
    });
    setShowSubmitDialog(true);
  };

  const handleApprove = (payroll: Payroll) => {
    setApprovingPayrollId(payroll._id);
    setApproveDialogData({ remarks: "" });
    setShowApproveDialog(true);
  };

  const handleConfirmApprove = async () => {
    if (!approvingPayrollId) return;

    try {
      setIsApproving(true);

      const payroll = payrolls?.data?.payrolls.find(
        (p) => p._id === approvingPayrollId
      );

      if (!payroll) {
        toast.error("Payroll not found");
        return;
      }

      try {
        switch (payroll.approvalFlow?.currentLevel) {
          case "DEPARTMENT_HEAD":
            await approvalService.approveAsDepartmentHead(
              approvingPayrollId,
              approveDialogData.remarks
            );
            break;
          case "HR_MANAGER":
            await approvalService.approveAsHRManager(
              approvingPayrollId,
              approveDialogData.remarks
            );
            break;
          case "FINANCE_DIRECTOR":
            await approvalService.approveAsFinanceDirector(
              approvingPayrollId,
              approveDialogData.remarks
            );
            break;
          case "SUPER_ADMIN":
            await approvalService.approveAsSuperAdmin(
              approvingPayrollId,
              approveDialogData.remarks
            );
            break;
          default:
            toast.error("Invalid approval level");
            return;
        }

        // Invalidate all relevant queries
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["adminPayrolls"] }),
          queryClient.invalidateQueries({
            queryKey: ["departmentPayrollStats"],
          }),
          queryClient.invalidateQueries({ queryKey: ["departmentPayrolls"] }),
          queryClient.invalidateQueries({
            queryKey: ["payrollProcessingStats"],
          }),
          queryClient.invalidateQueries({ queryKey: ["notifications"] }),
        ]);

        // Force immediate refetch of the main payroll data
        await queryClient.refetchQueries({
          queryKey: ["departmentPayrolls"],
          type: "active",
        });

        // Show success toast and close modal immediately after success
        toast.success("Payroll approved successfully");
        setApprovingPayrollId(null);
        setApproveDialogData({ remarks: "" });
        setShowApproveDialog(false);
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || "Failed to approve payroll"
        );
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve payroll");
    } finally {
      setIsApproving(false);
    }
  };

  const handleViewDetailsWithPermission = (payroll: Payroll) => {
    if (canViewPayroll) {
      handleViewDetails(payroll);
    }
  };

  const handleApproveWithPermission = (payroll: Payroll) => {
    if (canApprovePayroll) {
      setPendingAction({ type: "approve", payroll });
      setShowApproveConfirmDialog(true);
    }
  };

  const handleRejectWithPermission = (payroll: Payroll) => {
    if (canApprovePayroll) {
      setPendingAction({ type: "reject", payroll });
      setShowRejectConfirmDialog(true);
    }
  };

  const handleSubmitForApprovalWithPermission = (payroll: Payroll) => {
    if (canProcessPayroll) {
      setPendingAction({ type: "submit", payroll });
      setShowSubmitConfirmDialog(true);
    }
  };

  const handleViewApprovalJourney = (payroll: Payroll) => {
    setSelectedPayrollForJourney(payroll);
    setShowApprovalJourney(true);
  };

  const handleResubmit = async (payroll: Payroll): Promise<void> => {
    console.log("🔄 Starting resubmission process for payroll:", {
      id: payroll._id,
      employee: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
      status: payroll.status,
      month: payroll.month,
      year: payroll.year,
    });

    setIsResubmitting(true);
    try {
      // Directly resubmit the payroll
      await adminPayrollService.resubmitPayroll(payroll._id, user?.role);

      // Invalidate queries to refresh the data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["adminPayrolls"] }),
        queryClient.invalidateQueries({ queryKey: ["departmentPayrollStats"] }),
        queryClient.invalidateQueries({ queryKey: ["departmentPayrolls"] }),
        queryClient.invalidateQueries({ queryKey: ["payrollProcessingStats"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      ]);

      toast.success("Payroll resubmitted successfully");
    } catch (error: any) {
      console.error("❌ Error resubmitting payroll:", error);
      toast.error(error.message || "Failed to resubmit payroll");
    } finally {
      setIsResubmitting(false);
    }
  };

  const handleResubmitWithPermission = (payroll: Payroll) => {
    console.log("🔒 Checking permission for resubmission", {
      userRole: user?.role,
      canProcessPayroll,
      payrollId: payroll._id,
    });

    if (canProcessPayroll) {
      console.log("✅ Permission granted, proceeding with resubmission");
      setPendingAction({ type: "resubmit", payroll });
      setShowResubmitConfirmDialog(true);
    } else {
      console.log("❌ Permission denied for resubmission", {
        userRole: user?.role,
        requiredPermission: "PROCESS_PAYROLL",
      });
      toast.error("You don't have permission to resubmit payrolls");
    }
  };

  const isLoadingCombined =
    isPeriodsLoading || isStatsLoading || isPayrollsLoading;

  const payrollsData = payrolls?.data?.payrolls ?? [];

  // Log the full payrolls response for debugging
  console.log("Full payrollsData:", payrollsData);

  // const [_, setSingleProcessData] = useState<{
  //   employeeIds: string[];
  //   month: number;
  //   year: number;
  //   frequency: string;
  //   departmentId: string;
  // } | null>(null);

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPreliminaryConfirm, setShowPreliminaryConfirm] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [processAllData, setProcessAllData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    frequency: "monthly",
  });

  // Encouraging messages for processing animation
  const encouragingMessages = [
    {
      text: "🎉 Thank you for your patience! We're working hard to process everything perfectly.",
      icon: "🌟",
      color: "#10b981",
    },
    {
      text: "⚡ We're almost there! Your payroll processing is in the final stages.",
      icon: "🚀",
      color: "#3b82f6",
    },
    {
      text: "💪 Great job! We're calculating salaries, allowances, and deductions with precision.",
      icon: "🎯",
      color: "#8b5cf6",
    },
    {
      text: "✨ You're doing amazing! We're ensuring every detail is perfect for your team.",
      icon: "💎",
      color: "#f59e0b",
    },
    {
      text: "🎊 Almost done! We're finalizing the payroll data for all your employees.",
      icon: "🏆",
      color: "#ef4444",
    },
    {
      text: "🌟 You're incredible! We're processing payroll faster than ever before.",
      icon: "⚡",
      color: "#06b6d4",
    },
    {
      text: "🎯 Excellent! We're double-checking every calculation for accuracy.",
      icon: "🔍",
      color: "#84cc16",
    },
    {
      text: "💫 You're a star! We're wrapping up the payroll processing beautifully.",
      icon: "✨",
      color: "#ec4899",
    },
  ];

  // Rotate messages every 5 seconds
  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        setCurrentMessageIndex(
          (prev) => (prev + 1) % encouragingMessages.length
        );
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isProcessing, encouragingMessages.length]);

  const handleProcessAllPayrolls = async () => {
    try {
      setIsProcessing(true);
      const response = await adminPayrollService.processAllEmployeesPayroll({
        month: processAllData.month,
        year: processAllData.year,
        frequency: processAllData.frequency.toLowerCase(),
        userRole: user?.role,
      });

      if (response.success) {
        toast.success(`Successfully processed ${response.processed} payrolls`);
      } else {
        toast.warning("No payrolls were processed");
      }

      // Handle summary data if available - with delay for check animation
      if (response.summary) {
        setTimeout(() => {
          setProcessingSummary(response.summary);
          setSummaryType("processing");
          setShowSummaryCard(true);
        }, 3500); // 3.5 second delay to allow check animation to complete
      }
    } catch (error: any) {
      console.error("Error processing all payrolls:", error);
      toast.error(
        error.response?.data?.message || "Failed to process all payrolls"
      );
    } finally {
      // Always invalidate queries to ensure UI is up to date
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["payrolls"] }),
        queryClient.invalidateQueries({ queryKey: ["departmentPayrolls"] }),
        queryClient.invalidateQueries({
          queryKey: ["departmentPayrollStats"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["payrollProcessingStats"],
        }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      ]);

      setIsProcessing(false);
      setShowConfirmDialog(false);
    }
  };

  if (isLoadingCombined) {
    return (
      <div className="p-4">
        <TableSkeleton />
      </div>
    );
  }

  if (payrollsError) {
    return (
      <div className="p-4 text-center">
        <div className="bg-red-50 p-4 rounded-lg">
          <FaExclamationTriangle className="mx-auto text-4xl text-red-600 mb-2" />
          <p className="text-red-600 font-medium">Failed to load payrolls</p>
          <p className="text-red-500 text-sm mt-1">
            {payrollsError instanceof Error
              ? payrollsError.message
              : "An unexpected error occurred"}
          </p>
        </div>
      </div>
    );
  }

  // Convert PayrollData to Payroll for the PayrollTable component
  const convertedPayrolls: Payroll[] = payrollsData
    .filter((payroll: PayrollData) => payroll && payroll.employee) // Filter out payrolls with null employee
    .map((payroll: PayrollData) => {
      // Create the base payroll object
      const convertedPayroll: Payroll = {
        _id: payroll._id,
        employee: {
          _id: payroll.employee?._id || "",
          firstName: payroll.employee?.firstName || "Unknown",
          lastName: payroll.employee?.lastName || "Employee",
          email: payroll.employee?.employeeId || "",
        },
        month: payroll.month,
        year: payroll.year,
        status: payroll.status,
        frequency: "monthly", // Default to monthly since it's not in PayrollData
        totalEarnings: payroll.earnings?.totalEarnings || 0,
        totalDeductions: payroll.deductions?.totalDeductions || 0,
        netPay: payroll.totals?.netPay || 0,
        createdAt: payroll.createdAt,
        updatedAt: payroll.updatedAt,
      };

      // Add approvalFlow if it exists, ensuring proper type conversion
      if (payroll.approvalFlow) {
        convertedPayroll.approvalFlow = {
          currentLevel: payroll.approvalFlow.currentLevel || "PENDING", // Provide a default value
          history:
            payroll.approvalFlow.history?.map((h) => ({
              level: h.level,
              status: h.status,
              timestamp: h.timestamp,
              remarks: h.remarks,
            })) || [],
        };
      }

      return convertedPayroll;
    });

  // CSV Export Function
  const exportPayrollsToCSV = () => {
    // Decide which payrolls to export
    const payrollsToExport =
      selectedPayrollIds.length > 0
        ? convertedPayrolls.filter((p) => selectedPayrollIds.includes(p._id))
        : convertedPayrolls;

    if (payrollsToExport.length === 0) {
      toast.warning("No payrolls to export");
      return;
    }

    // PMS Header for CSV
    const pmsHeader = [
      "PMS - Payroll Management System",
      "",
      "Department Payroll Export Report",
      `Generated on: ${new Date().toLocaleString()}`,
      `Generated by: ${user?.firstName} ${user?.lastName} (${user?.role})`,
      `Total Records: ${payrollsToExport.length}`,
      `Export Type: ${
        selectedPayrollIds.length > 0 ? "Selected Payrolls" : "All Payrolls"
      }`,
      "",
    ];

    const headers = [
      "Employee Name",
      "Employee Email/ID",
      "Month",
      "Year",
      "Status",
      "Net Pay (₦)",
      "Total Earnings (₦)",
      "Total Deductions (₦)",
      "Frequency",
      "Created At",
    ];

    const data = payrollsToExport.map((payroll) => [
      `${payroll.employee.firstName} ${payroll.employee.lastName}`,
      payroll.employee.email,
      payroll.month,
      payroll.year,
      payroll.status,
      payroll.netPay?.toLocaleString() || "0",
      payroll.totalEarnings?.toLocaleString() || "0",
      payroll.totalDeductions?.toLocaleString() || "0",
      payroll.frequency || "monthly",
      payroll.createdAt ? new Date(payroll.createdAt).toLocaleString() : "",
    ]);

    // Combine PMS header, data headers, and data
    const csvContent = [
      ...pmsHeader.map((row) => `"${row}"`),
      headers.map((header) => `"${header}"`).join(","),
      ...data.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PMS-Department-Payrolls-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    // Show success toast
    const exportCount = payrollsToExport.length;
    const exportType = selectedPayrollIds.length > 0 ? "selected" : "all";
    toast.success(
      `Successfully exported ${exportCount} ${exportType} payroll(s) to CSV`
    );
  };

  return (
    <>
      <DepartmentPayrollInfoSection />
      <Box
        sx={{
          width: "100%",
          background: LIGHT_GREEN_BG,
          minHeight: "100vh",
          borderRadius: 3,
          boxShadow: "0 2px 12px 0 rgba(39, 174, 96, 0.07)",
          p: { xs: 1, md: 4 },
        }}
      >
        {isResubmitting && (
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
            }}
          >
            <Box
              sx={{
                backgroundColor: "white",
                padding: 3,
                borderRadius: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <CircularProgress size={60} />
              <Typography variant="h6" sx={{ color: "text.primary" }}>
                Resubmitting Payroll
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Please wait while we process your request...
              </Typography>
            </Box>
          </Box>
        )}

        {/* Enhanced Processing Animation */}
        {isProcessing && (
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
            }}
          >
            <Box
              sx={{
                backgroundColor: "white",
                padding: 4,
                borderRadius: 3,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                maxWidth: 500,
                width: "90%",
                boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              }}
            >
              {/* Animated Icon */}
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  background: `linear-gradient(135deg, ${MAIN_GREEN} 0%, #219150 100%)`,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: "pulse 2s infinite",
                  "@keyframes pulse": {
                    "0%": {
                      transform: "scale(1)",
                      boxShadow: "0 0 0 0 rgba(39, 174, 96, 0.7)",
                    },
                    "70%": {
                      transform: "scale(1.05)",
                      boxShadow: "0 0 0 20px rgba(39, 174, 96, 0)",
                    },
                    "100%": {
                      transform: "scale(1)",
                      boxShadow: "0 0 0 0 rgba(39, 174, 96, 0)",
                    },
                  },
                }}
              >
                <FaSpinner
                  className="animate-spin"
                  style={{ fontSize: 40, color: "white" }}
                />
              </Box>

              <Typography
                variant="h5"
                sx={{
                  color: MAIN_GREEN,
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                Processing All Payrolls
              </Typography>

              {/* Enhanced Encouraging Messages with Framer Motion */}
              <Box
                sx={{
                  minHeight: 80,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentMessageIndex}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    style={{ textAlign: "center", width: "100%" }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        color: encouragingMessages[currentMessageIndex].color,
                        fontWeight: 700,
                        textAlign: "center",
                        mb: 1,
                        fontSize: "1.1rem",
                      }}
                    >
                      {encouragingMessages[currentMessageIndex].icon}{" "}
                      {encouragingMessages[currentMessageIndex].text}
                    </Typography>
                  </motion.div>
                </AnimatePresence>
              </Box>

              <Typography
                variant="body1"
                sx={{
                  color: "#666",
                  textAlign: "center",
                  mb: 2,
                }}
              >
                Please be patient while we process payroll for all active
                employees...
              </Typography>

              {/* Progress Bar */}
              <Box
                sx={{
                  width: "100%",
                  height: 8,
                  backgroundColor: "#e0e0e0",
                  borderRadius: 4,
                  overflow: "hidden",
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    background: `linear-gradient(90deg, ${MAIN_GREEN} 0%, #219150 100%)`,
                    borderRadius: 4,
                    animation: "progress 3s ease-in-out infinite",
                    "@keyframes progress": {
                      "0%": { transform: "translateX(-100%)" },
                      "50%": { transform: "translateX(0%)" },
                      "100%": { transform: "translateX(100%)" },
                    },
                  }}
                />
              </Box>

              {/* Status Steps */}
              <Box sx={{ width: "100%" }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: MAIN_GREEN,
                    fontWeight: 600,
                    textAlign: "center",
                    mb: 1,
                  }}
                >
                  Current Status:
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                  {["Calculating", "Processing", "Finalizing"].map(
                    (step, index) => (
                      <Box
                        key={step}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          animation: `fadeInUp 0.5s ease-out ${
                            index * 0.3
                          }s both`,
                          "@keyframes fadeInUp": {
                            "0%": { opacity: 0, transform: "translateY(20px)" },
                            "100%": { opacity: 1, transform: "translateY(0)" },
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: MAIN_GREEN,
                            animation: "bounce 1s infinite",
                            animationDelay: `${index * 0.2}s`,
                            "@keyframes bounce": {
                              "0%, 20%, 50%, 80%, 100%": {
                                transform: "translateY(0)",
                              },
                              "40%": { transform: "translateY(-10px)" },
                              "60%": { transform: "translateY(-5px)" },
                            },
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#666",
                            fontWeight: 500,
                          }}
                        >
                          {step}
                        </Typography>
                      </Box>
                    )
                  )}
                </Box>
              </Box>

              <Typography
                variant="caption"
                sx={{
                  color: "#999",
                  textAlign: "center",
                  fontStyle: "italic",
                }}
              >
                This may take a few moments depending on the number of employees
              </Typography>
            </Box>
          </Box>
        )}

        {/* Preliminary Confirmation Modal */}
        <Dialog
          open={showPreliminaryConfirm}
          onClose={() => setShowPreliminaryConfirm(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            style: {
              background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
              borderRadius: 18,
              boxShadow: "0 8px 32px 0 rgba(245, 158, 11, 0.3)",
              border: "2px solid #f59e0b",
              padding: 0,
            },
          }}
        >
          <DialogTitle
            sx={{
              color: "#92400e",
              fontWeight: 700,
              fontSize: 24,
              borderBottom: "3px solid #f59e0b",
              background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              textAlign: "center",
              py: 3,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  background: "#f59e0b",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mr: 2,
                }}
              >
                <FaExclamationTriangle
                  style={{ color: "#fff", fontSize: 24 }}
                />
              </Box>
              Confirm Action
            </Box>
          </DialogTitle>

          <DialogContent sx={{ p: 4, background: "#fff" }}>
            <Box sx={{ textAlign: "center", mb: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  color: "#92400e",
                  fontWeight: 700,
                  mb: 2,
                }}
              >
                Are you sure you want to process ALL payrolls?
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: "#92400e",
                  mb: 3,
                  lineHeight: 1.6,
                }}
              >
                This action will process payroll for{" "}
                <strong>ALL active employees</strong> across all departments.
              </Typography>

              <Box
                sx={{
                  background: "rgba(245, 158, 11, 0.1)",
                  border: "1px solid #f59e0b",
                  borderRadius: 2,
                  p: 3,
                  mb: 3,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "#92400e",
                    fontWeight: 600,
                    mb: 2,
                  }}
                >
                  ⚠️ Important Information:
                </Typography>
                <Box sx={{ textAlign: "left", space: 1 }}>
                  <Typography variant="body2" sx={{ color: "#92400e", mb: 1 }}>
                    • This will affect <strong>all active employees</strong> in
                    the system
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#92400e", mb: 1 }}>
                    • Processing time depends on the number of employees
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#92400e", mb: 1 }}>
                    • You'll be able to set the period and frequency in the next
                    step
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#92400e" }}>
                    • This action cannot be undone once started
                  </Typography>
                </Box>
              </Box>
            </Box>
          </DialogContent>

          <DialogActions
            sx={{
              background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
              p: 3,
              borderBottomLeftRadius: 18,
              borderBottomRightRadius: 18,
            }}
          >
            <Button
              onClick={() => setShowPreliminaryConfirm(false)}
              sx={{
                color: "#92400e",
                fontWeight: 600,
                borderRadius: 2,
                px: 4,
                py: 1.5,
                background: "#fff",
                border: "2px solid #f59e0b",
                "&:hover": {
                  background: "rgba(245, 158, 11, 0.1)",
                  border: "2px solid #d97706",
                },
                cursor: "pointer",
                minWidth: 120,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowPreliminaryConfirm(false);
                setShowConfirmDialog(true);
              }}
              variant="contained"
              sx={{
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                color: "#fff",
                fontWeight: 700,
                borderRadius: 2,
                px: 4,
                py: 1.5,
                boxShadow: "0 4px 12px 0 rgba(245, 158, 11, 0.3)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
                  boxShadow: "0 6px 16px 0 rgba(245, 158, 11, 0.4)",
                },
                cursor: "pointer",
                minWidth: 120,
              }}
              autoFocus
            >
              Continue
            </Button>
          </DialogActions>
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog
          open={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-description"
          PaperProps={{
            style: {
              background: MAIN_GREEN,
              borderRadius: 18,
              boxShadow: "0 4px 24px 0 rgba(39, 174, 96, 0.10)",
              border: `2px solid ${LIGHT_GREEN_ACCENT}`,
              padding: 0,
            },
          }}
        >
          <DialogTitle
            id="confirm-dialog-title"
            sx={{
              color: "#fff",
              fontWeight: 700,
              fontSize: 22,
              borderBottom: `3px solid #fff`,
              background: MAIN_GREEN,
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              boxShadow: "0 1px 6px 0 rgba(39, 174, 96, 0.04)",
              letterSpacing: 0.5,
            }}
          >
            Process All Payrolls
          </DialogTitle>
          <DialogContent
            sx={{
              background: "#fff",
              p: 4,
              borderBottomLeftRadius: 18,
              borderBottomRightRadius: 18,
            }}
          >
            <Box
              sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}
            >
              {/* Action Confirmation Section */}
              <Box
                sx={{
                  background:
                    "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                  border: "2px solid #f59e0b",
                  borderRadius: 3,
                  p: 3,
                  mb: 2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      background: "#f59e0b",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mr: 2,
                    }}
                  >
                    <FaExclamationTriangle
                      style={{ color: "#fff", fontSize: 20 }}
                    />
                  </Box>
                  <Typography
                    sx={{
                      color: "#92400e",
                      fontWeight: 700,
                      fontSize: 18,
                    }}
                  >
                    Confirm Action
                  </Typography>
                </Box>

                <Typography
                  sx={{
                    color: "#92400e",
                    fontWeight: 600,
                    mb: 2,
                    fontSize: 16,
                  }}
                >
                  You are about to process payroll for ALL active employees
                </Typography>

                <Box sx={{ space: 2 }}>
                  <Typography
                    sx={{
                      color: "#92400e",
                      fontSize: 14,
                      mb: 1,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <FaUsers style={{ marginRight: 8, fontSize: 14 }} />
                    <strong>Scope:</strong> All active employees across all
                    departments
                  </Typography>
                  <Typography
                    sx={{
                      color: "#92400e",
                      fontSize: 14,
                      mb: 1,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <FaCalendarAlt style={{ marginRight: 8, fontSize: 14 }} />
                    <strong>Period:</strong>{" "}
                    {new Date(0, processAllData.month - 1).toLocaleString(
                      "default",
                      { month: "long" }
                    )}{" "}
                    {processAllData.year} ({processAllData.frequency})
                  </Typography>
                  <Typography
                    sx={{
                      color: "#92400e",
                      fontSize: 14,
                      mb: 1,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <FaShieldAlt style={{ marginRight: 8, fontSize: 14 }} />
                    <strong>Status:</strong>{" "}
                    {user?.role === "SUPER_ADMIN"
                      ? "Automatically approved"
                      : "Requires approval workflow"}
                  </Typography>
                  <Typography
                    sx={{
                      color: "#92400e",
                      fontSize: 14,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <FaInfoCircle style={{ marginRight: 8, fontSize: 14 }} />
                    <strong>Impact:</strong> This action cannot be undone once
                    processed
                  </Typography>
                </Box>
              </Box>

              <Typography
                id="confirm-dialog-description"
                sx={{ color: MAIN_GREEN, fontWeight: 500, mb: 2 }}
              >
                Select the payroll period and frequency for processing all
                employees.
              </Typography>

              {/* Process All Info Section */}
              <DepartmentPayrollInfoSection />

              {/* Beautified Card Section for Inputs */}
              <Box
                sx={{
                  background:
                    "linear-gradient(90deg, #f6fcf7 60%, #eafaf1 100%)",
                  border: `1.5px solid ${LIGHT_GREEN_ACCENT}`,
                  borderRadius: 3,
                  boxShadow: "0 2px 8px 0 rgba(39, 174, 96, 0.06)",
                  p: 3,
                  mt: 2,
                  mb: 1,
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
                  gap: 3,
                  alignItems: "center",
                }}
              >
                {/* Month */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      mb: 1,
                      color: MAIN_GREEN,
                      fontWeight: 600,
                      letterSpacing: 0.2,
                    }}
                  >
                    Month
                  </Typography>
                  <select
                    className="w-full px-4 py-2 border border-green-200 rounded-xl shadow-sm focus:ring-2 focus:ring-green-400 focus:border-green-400 bg-white text-gray-800 font-semibold transition-all"
                    value={processAllData.month}
                    onChange={(e) =>
                      setProcessAllData((prev) => ({
                        ...prev,
                        month: Number(e.target.value),
                      }))
                    }
                    style={{ cursor: "pointer" }}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(0, i).toLocaleString("default", {
                          month: "long",
                        })}
                      </option>
                    ))}
                  </select>
                </Box>
                {/* Year */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      mb: 1,
                      color: MAIN_GREEN,
                      fontWeight: 600,
                      letterSpacing: 0.2,
                    }}
                  >
                    Year
                  </Typography>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-green-200 rounded-xl shadow-sm focus:ring-2 focus:ring-green-400 focus:border-green-400 bg-white text-gray-800 font-semibold transition-all"
                    value={processAllData.year}
                    onChange={(e) =>
                      setProcessAllData((prev) => ({
                        ...prev,
                        year: Number(e.target.value),
                      }))
                    }
                    min={2000}
                    max={2100}
                    style={{ cursor: "pointer" }}
                  />
                </Box>
                {/* Frequency */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      mb: 1,
                      color: MAIN_GREEN,
                      fontWeight: 600,
                      letterSpacing: 0.2,
                    }}
                  >
                    Frequency
                  </Typography>
                  <select
                    className="w-full px-4 py-2 border border-green-200 rounded-xl shadow-sm focus:ring-2 focus:ring-green-400 focus:border-green-400 bg-white text-gray-800 font-semibold transition-all"
                    value={processAllData.frequency}
                    onChange={(e) =>
                      setProcessAllData((prev) => ({
                        ...prev,
                        frequency: e.target.value,
                      }))
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                  </select>
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions
            sx={{
              background: LIGHT_GREEN_BG,
              p: 3,
              borderBottomLeftRadius: 18,
              borderBottomRightRadius: 18,
            }}
          >
            <Button
              onClick={() => setShowConfirmDialog(false)}
              sx={{
                color: MAIN_GREEN,
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
                background: "#fff",
                border: `1px solid ${MAIN_GREEN}`,
                "&:hover": { background: LIGHT_GREEN_ACCENT },
                cursor: "pointer",
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleProcessAllPayrolls();
                setShowConfirmDialog(false);
              }}
              variant="contained"
              sx={{
                background: MAIN_GREEN,
                color: "#fff",
                fontWeight: 700,
                borderRadius: 2,
                px: 4,
                boxShadow: "0 2px 8px 0 rgba(39, 174, 96, 0.10)",
                "&:hover": { background: "#219150" },
                cursor: "pointer",
              }}
              disabled={isProcessing}
              autoFocus
            >
              {isProcessing ? (
                <span className="flex items-center">
                  <FaSpinner className="animate-spin mr-2" />
                  Processing...
                </span>
              ) : (
                "Process All"
              )}
            </Button>
          </DialogActions>
        </Dialog>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "stretch", sm: "center" },
            mb: 3,
            borderBottom: `3px solid ${MAIN_GREEN}`,
            pb: 2,
            background: "#fff",
            borderRadius: 2,
            boxShadow: "0 1px 6px 0 rgba(39, 174, 96, 0.04)",
          }}
        >
          <h1
            className="text-2xl font-bold"
            style={{ color: MAIN_GREEN, letterSpacing: 0.5 }}
          >
            Process Department Payroll
          </h1>
        </Box>
        {/* Responsive Action Buttons */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            mb: 3,
            alignItems: { xs: "stretch", sm: "center" },
          }}
        >
          {(canProcessPayroll || canProcessHRPayroll) && (
            <Button
              variant="contained"
              sx={{
                background: MAIN_GREEN,
                borderRadius: 2,
                fontWeight: 600,
                px: 3,
                boxShadow: "0 2px 8px 0 rgba(39, 174, 96, 0.10)",
                "&:hover": { background: "#219150" },
                width: { xs: "100%", sm: "auto" },
              }}
              startIcon={
                isProcessing ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaPlus />
                )
              }
              onClick={() => {
                setShowCreatePayrollConfirm(true);
              }}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Create Payroll"}
            </Button>
          )}

          {/* Export CSV Button */}
          <Button
            variant="outlined"
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              px: 3,
              color: MAIN_GREEN,
              border: `1.5px solid ${MAIN_GREEN}`,
              "&:hover": {
                background: LIGHT_GREEN_ACCENT,
                border: `1.5px solid #219150`,
              },
              width: { xs: "100%", sm: "auto" },
            }}
            startIcon={<FaDownload />}
            onClick={exportPayrollsToCSV}
            disabled={convertedPayrolls.length === 0 || isProcessing}
          >
            Export CSV{" "}
            {selectedPayrollIds.length > 0
              ? `(${selectedPayrollIds.length} Selected)`
              : "(All)"}
          </Button>

          {user?.role === "SUPER_ADMIN" && (
            <Button
              variant="contained"
              sx={{
                background: "#8e44ad",
                borderRadius: 2,
                fontWeight: 600,
                px: 3,
                boxShadow: "0 2px 8px 0 rgba(142, 68, 173, 0.10)",
                "&:hover": { background: "#6c3483" },
                width: { xs: "100%", sm: "auto" },
              }}
              startIcon={
                isProcessing ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaPlus />
                )
              }
              onClick={() => setShowPreliminaryConfirm(true)}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Process All"}
            </Button>
          )}
        </Box>
        <Box
          sx={{
            borderBottom: 1,
            borderColor: LIGHT_GREEN_ACCENT,
            mb: 3,
            background: "#fff",
            borderRadius: 2,
            boxShadow: "0 1px 6px 0 rgba(39, 174, 96, 0.04)",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            TabIndicatorProps={{
              style: { background: MAIN_GREEN, height: 4, borderRadius: 2 },
            }}
            sx={{
              ".MuiTab-root": {
                fontWeight: 600,
                color: MAIN_GREEN,
                "&.Mui-selected": {
                  color: MAIN_GREEN,
                  background: LIGHT_GREEN_ACCENT,
                  borderRadius: 2,
                },
                "&:hover": {
                  background: LIGHT_GREEN_ACCENT,
                },
              },
            }}
          >
            <Tab label="Payroll List" />
            <Tab label="Dashboard" />
          </Tabs>
        </Box>

        {activeTab === 0 ? (
          convertedPayrolls.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "40vh",
                background: LIGHT_GREEN_ACCENT,
                borderRadius: 2,
                boxShadow: "0 1px 6px 0 rgba(39, 174, 96, 0.04)",
                p: 6,
              }}
            >
              <FaLeaf
                size={48}
                color={MAIN_GREEN}
                style={{ marginBottom: 16 }}
              />
              <Typography
                variant="h6"
                sx={{ color: MAIN_GREEN, fontWeight: 700 }}
              >
                No payrolls found
              </Typography>
              <Typography variant="body2" sx={{ color: "#555", mt: 1 }}>
                Start by creating a new payroll for your department.
              </Typography>
            </Box>
          ) : (
            <PayrollTable
              payrolls={convertedPayrolls}
              onApprove={handleApproveWithPermission}
              onReject={handleRejectWithPermission}
              onView={handleViewDetailsWithPermission}
              onViewApprovalJourney={handleViewApprovalJourney}
              onSubmitForApproval={handleSubmitForApprovalWithPermission}
              onResubmit={handleResubmitWithPermission}
              selectedPayrolls={selectedPayrollIds}
              onSelectionChange={handleSelectPayroll}
              loading={isPayrollsLoading || isProcessing}
              error={payrollsError}
              currentUserRole={user?.role}
              user={user}
            />
          )
        ) : (
          <PayrollDashboard
            payrolls={convertedPayrolls}
            processingStats={processingStats}
          />
        )}

        {/* Approval Dialog */}
        <Dialog
          open={Boolean(approvingPayrollId)}
          onClose={() => setApprovingPayrollId(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Approve Payroll</DialogTitle>
          <DialogContent>
            {approvingPayrollId && (
              <Box sx={{ mt: 2 }}>
                <ApprovalTimeline
                  steps={[
                    {
                      level: "Department Head",
                      status: isHRManagerCreated(
                        payrollsData.find((p) => p._id === approvingPayrollId)
                          ?.approvalFlow?.history || []
                      )
                        ? "completed"
                        : isLevelApproved(
                            payrollsData.find(
                              (p) => p._id === approvingPayrollId
                            )?.approvalFlow?.history || [],
                            "DEPARTMENT_HEAD"
                          )
                        ? "completed"
                        : "pending",
                    },
                    {
                      level: "HR Manager",
                      status: isLevelApproved(
                        payrollsData.find((p) => p._id === approvingPayrollId)
                          ?.approvalFlow?.history || [],
                        "HR_MANAGER"
                      )
                        ? "completed"
                        : "pending",
                    },
                    {
                      level: "Finance Director",
                      status: isLevelApproved(
                        payrollsData.find((p) => p._id === approvingPayrollId)
                          ?.approvalFlow?.history || [],
                        "FINANCE_DIRECTOR"
                      )
                        ? "completed"
                        : "pending",
                    },
                    {
                      level: "Super Admin",
                      status: isLevelApproved(
                        payrollsData.find((p) => p._id === approvingPayrollId)
                          ?.approvalFlow?.history || [],
                        "SUPER_ADMIN"
                      )
                        ? "completed"
                        : "pending",
                    },
                  ]}
                  currentLevel={
                    payrollsData.find((p) => p._id === approvingPayrollId)
                      ?.approvalFlow?.currentLevel || ""
                  }
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setApprovingPayrollId(null)}>Cancel</Button>
            <Button
              onClick={handleConfirmApprove}
              variant="contained"
              color="primary"
              disabled={isApproving}
            >
              {isApproving ? "Approving..." : "Approve"}
            </Button>
          </DialogActions>
        </Dialog>

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
          onClose={() => {
            setShowSingleProcessModal(false);
          }}
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
                  onChange={(event) =>
                    setSubmitDialogData((prev) => ({
                      ...prev,
                      remarks: event.target.value,
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
        <Dialog
          open={rejectionDialogOpen}
          onClose={() => setRejectionDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Reject Payroll</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Reason for Rejection"
              type="text"
              fullWidth
              multiline
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason for rejecting this payroll"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRejectionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleReject(selectedPayrollId || "")}
              variant="contained"
              color="error"
              disabled={!rejectionReason.trim()}
            >
              Reject
            </Button>
          </DialogActions>
        </Dialog>

        {/* Approval Journey Dialog */}
        <Dialog
          open={showApprovalJourney}
          onClose={() => setShowApprovalJourney(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Approval Journey</DialogTitle>
          <DialogContent>
            {selectedPayrollForJourney && (
              <Box sx={{ mt: 2 }}>
                <ApprovalTimeline
                  steps={[
                    {
                      level: "Department Head",
                      status: isLevelPending(
                        selectedPayrollForJourney.approvalFlow?.history || [],
                        selectedPayrollForJourney.approvalFlow?.currentLevel ||
                          "",
                        "DEPARTMENT_HEAD"
                      )
                        ? "pending"
                        : isLevelApproved(
                            selectedPayrollForJourney.approvalFlow?.history ||
                              [],
                            "DEPARTMENT_HEAD"
                          )
                        ? "completed"
                        : "pending",
                      date: selectedPayrollForJourney.approvalFlow?.history?.find(
                        (h) => h.level === "DEPARTMENT_HEAD"
                      )?.timestamp,
                      comment:
                        selectedPayrollForJourney.approvalFlow?.history?.find(
                          (h) => h.level === "DEPARTMENT_HEAD"
                        )?.remarks,
                    },
                    {
                      level: "HR Manager",
                      status: isLevelPending(
                        selectedPayrollForJourney.approvalFlow?.history || [],
                        selectedPayrollForJourney.approvalFlow?.currentLevel ||
                          "",
                        "HR_MANAGER"
                      )
                        ? "pending"
                        : isLevelApproved(
                            selectedPayrollForJourney.approvalFlow?.history ||
                              [],
                            "HR_MANAGER"
                          )
                        ? "completed"
                        : "pending",
                      date: selectedPayrollForJourney.approvalFlow?.history?.find(
                        (h) => h.level === "HR_MANAGER"
                      )?.timestamp,
                      comment:
                        selectedPayrollForJourney.approvalFlow?.history?.find(
                          (h) => h.level === "HR_MANAGER"
                        )?.remarks,
                    },
                    {
                      level: "Finance Director",
                      status: isLevelPending(
                        selectedPayrollForJourney.approvalFlow?.history || [],
                        selectedPayrollForJourney.approvalFlow?.currentLevel ||
                          "",
                        "FINANCE_DIRECTOR"
                      )
                        ? "pending"
                        : isLevelApproved(
                            selectedPayrollForJourney.approvalFlow?.history ||
                              [],
                            "FINANCE_DIRECTOR"
                          )
                        ? "completed"
                        : "pending",
                      date: selectedPayrollForJourney.approvalFlow?.history?.find(
                        (h) => h.level === "FINANCE_DIRECTOR"
                      )?.timestamp,
                      comment:
                        selectedPayrollForJourney.approvalFlow?.history?.find(
                          (h) => h.level === "FINANCE_DIRECTOR"
                        )?.remarks,
                    },
                    {
                      level: "Super Admin",
                      status: isLevelPending(
                        selectedPayrollForJourney.approvalFlow?.history || [],
                        selectedPayrollForJourney.approvalFlow?.currentLevel ||
                          "",
                        "SUPER_ADMIN"
                      )
                        ? "pending"
                        : isLevelApproved(
                            selectedPayrollForJourney.approvalFlow?.history ||
                              [],
                            "SUPER_ADMIN"
                          )
                        ? "completed"
                        : "pending",
                      date: selectedPayrollForJourney.approvalFlow?.history?.find(
                        (h) => h.level === "SUPER_ADMIN"
                      )?.timestamp,
                      comment:
                        selectedPayrollForJourney.approvalFlow?.history?.find(
                          (h) => h.level === "SUPER_ADMIN"
                        )?.remarks,
                    },
                  ]}
                  currentLevel={
                    selectedPayrollForJourney.approvalFlow?.currentLevel || ""
                  }
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowApprovalJourney(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Approve Confirmation Dialog */}
        <AnimatePresence>
          {showApproveConfirmDialog && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center sm:items-center p-4">
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{
                  type: "spring",
                  damping: 25,
                  stiffness: 300,
                  duration: 0.3,
                }}
                className="bg-white rounded-t-xl sm:rounded-xl shadow-2xl w-full max-w-md mx-auto"
              >
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Confirm Approval
                  </h3>
                  <button
                    onClick={() => setShowApproveConfirmDialog(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FaTimes size={20} />
                  </button>
                </div>

                <div className="p-6">
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <FaCheckCircle className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-base text-gray-800 font-medium">
                        Are you sure you want to approve this payroll?
                      </p>
                    </div>
                  </div>

                  {pendingAction.payroll && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <FaUsers className="mr-2 text-gray-400" />
                        <span>
                          <strong>Employee:</strong>{" "}
                          {pendingAction.payroll.employee.firstName}{" "}
                          {pendingAction.payroll.employee.lastName}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FaCalendarAlt className="mr-2 text-gray-400" />
                        <span>
                          <strong>Period:</strong> {pendingAction.payroll.month}
                          /{pendingAction.payroll.year}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FaMoneyBillWave className="mr-2 text-gray-400" />
                        <span>
                          <strong>Net Pay:</strong> ₦
                          {pendingAction.payroll.netPay?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 p-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowApproveConfirmDialog(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowApproveConfirmDialog(false);
                      if (pendingAction.payroll) {
                        handleApprove(pendingAction.payroll);
                      }
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                  >
                    Yes, Approve
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Reject Confirmation Dialog */}
        <AnimatePresence>
          {showRejectConfirmDialog && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center sm:items-center p-4">
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{
                  type: "spring",
                  damping: 25,
                  stiffness: 300,
                  duration: 0.3,
                }}
                className="bg-white rounded-t-xl sm:rounded-xl shadow-2xl w-full max-w-md mx-auto"
              >
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Confirm Rejection
                  </h3>
                  <button
                    onClick={() => setShowRejectConfirmDialog(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FaTimes size={20} />
                  </button>
                </div>

                <div className="p-6">
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <FaTimesCircle className="text-red-600" />
                    </div>
                    <div>
                      <p className="text-base text-gray-800 font-medium">
                        Are you sure you want to reject this payroll?
                      </p>
                    </div>
                  </div>

                  {pendingAction.payroll && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <FaUsers className="mr-2 text-gray-400" />
                        <span>
                          <strong>Employee:</strong>{" "}
                          {pendingAction.payroll.employee.firstName}{" "}
                          {pendingAction.payroll.employee.lastName}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FaCalendarAlt className="mr-2 text-gray-400" />
                        <span>
                          <strong>Period:</strong> {pendingAction.payroll.month}
                          /{pendingAction.payroll.year}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Rejection *
                    </label>
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      rows={3}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Please provide a reason for rejecting this payroll..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 p-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowRejectConfirmDialog(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!rejectionReason.trim()) {
                        toast.error("Please provide a reason for rejection");
                        return;
                      }
                      setShowRejectConfirmDialog(false);
                      if (pendingAction.payroll) {
                        setSelectedPayrollId(pendingAction.payroll._id);
                        setRejectionDialogOpen(true);
                      }
                    }}
                    disabled={!rejectionReason.trim()}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Yes, Reject
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Submit Confirmation Dialog */}
        <AnimatePresence>
          {showSubmitConfirmDialog && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center sm:items-center p-4">
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{
                  type: "spring",
                  damping: 25,
                  stiffness: 300,
                  duration: 0.3,
                }}
                className="bg-white rounded-t-xl sm:rounded-xl shadow-2xl w-full max-w-md mx-auto"
              >
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Confirm Submission
                  </h3>
                  <button
                    onClick={() => setShowSubmitConfirmDialog(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FaTimes size={20} />
                  </button>
                </div>

                <div className="p-6">
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <FaHandHoldingUsd className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-base text-gray-800 font-medium">
                        Are you sure you want to submit this payroll for
                        approval?
                      </p>
                    </div>
                  </div>

                  {pendingAction.payroll && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <FaUsers className="mr-2 text-gray-400" />
                        <span>
                          <strong>Employee:</strong>{" "}
                          {pendingAction.payroll.employee.firstName}{" "}
                          {pendingAction.payroll.employee.lastName}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FaCalendarAlt className="mr-2 text-gray-400" />
                        <span>
                          <strong>Period:</strong> {pendingAction.payroll.month}
                          /{pendingAction.payroll.year}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FaShieldAlt className="mr-2 text-gray-400" />
                        <span>
                          <strong>Status:</strong> Will require approval
                          workflow
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 p-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowSubmitConfirmDialog(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowSubmitConfirmDialog(false);
                      if (pendingAction.payroll) {
                        handleSubmitForApproval(pendingAction.payroll);
                      }
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Yes, Submit
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Resubmit Confirmation Dialog */}
        <AnimatePresence>
          {showResubmitConfirmDialog && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center sm:items-center p-4">
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{
                  type: "spring",
                  damping: 25,
                  stiffness: 300,
                  duration: 0.3,
                }}
                className="bg-white rounded-t-xl sm:rounded-xl shadow-2xl w-full max-w-md mx-auto"
              >
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Confirm Resubmission
                  </h3>
                  <button
                    onClick={() => setShowResubmitConfirmDialog(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FaTimes size={20} />
                  </button>
                </div>

                <div className="p-6">
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <FaHandHoldingUsd className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-base text-gray-800 font-medium">
                        Are you sure you want to resubmit this rejected payroll?
                      </p>
                    </div>
                  </div>

                  {pendingAction.payroll && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <FaUsers className="mr-2 text-gray-400" />
                        <span>
                          <strong>Employee:</strong>{" "}
                          {pendingAction.payroll.employee.firstName}{" "}
                          {pendingAction.payroll.employee.lastName}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FaCalendarAlt className="mr-2 text-gray-400" />
                        <span>
                          <strong>Period:</strong> {pendingAction.payroll.month}
                          /{pendingAction.payroll.year}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FaInfoCircle className="mr-2 text-gray-400" />
                        <span>
                          <strong>Status:</strong> Will restart approval
                          workflow
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 p-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowResubmitConfirmDialog(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowResubmitConfirmDialog(false);
                      if (pendingAction.payroll) {
                        handleResubmit(pendingAction.payroll);
                      }
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                  >
                    Yes, Resubmit
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Create Payroll Confirmation Dialog */}
        <AnimatePresence>
          {showCreatePayrollConfirm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center sm:items-center p-4">
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{
                  type: "spring",
                  damping: 25,
                  stiffness: 300,
                  duration: 0.3,
                }}
                className="bg-white rounded-t-xl sm:rounded-xl shadow-2xl w-full max-w-md mx-auto"
              >
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Create New Payroll
                  </h3>
                  <button
                    onClick={() => setShowCreatePayrollConfirm(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FaTimes size={20} />
                  </button>
                </div>

                <div className="p-6">
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <FaPlus className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-base text-gray-800 font-medium">
                        Ready to create a new payroll?
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        You'll be able to select employees and configure payroll
                        settings.
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <FaUsers className="mr-2 text-gray-400" />
                      <span>
                        <strong>Scope:</strong> Select specific employees
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <FaCalendarAlt className="mr-2 text-gray-400" />
                      <span>
                        <strong>Period:</strong> Choose month, year, and
                        frequency
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <FaShieldAlt className="mr-2 text-gray-400" />
                      <span>
                        <strong>Process:</strong> Calculate allowances, bonuses,
                        and deductions
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <FaInfoCircle className="mr-2 text-gray-400" />
                      <span>
                        <strong>Workflow:</strong> Requires approval after
                        creation
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 p-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowCreatePayrollConfirm(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowCreatePayrollConfirm(false);
                      setShowSingleProcessModal(true);
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Processing Summary Card */}
        <AnimatePresence>
          {showSummaryCard && processingSummary && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{
                  type: "spring",
                  damping: 25,
                  stiffness: 300,
                  duration: 0.3,
                }}
                className="w-full max-w-4xl mx-auto"
              >
                <div className="bg-white rounded-lg p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Processing Summary
                    </h3>
                    <button
                      onClick={() => {
                        setShowSummaryCard(false);
                        setProcessingSummary(null);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FaTimes size={20} />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {processingSummary.processed || 0}
                        </div>
                        <div className="text-sm text-green-700">Processed</div>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                          {processingSummary.skipped || 0}
                        </div>
                        <div className="text-sm text-yellow-700">Skipped</div>
                      </div>
                    </div>
                    {processingSummary.errors &&
                      processingSummary.errors.length > 0 && (
                        <div className="bg-red-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-red-700 mb-2">
                            Errors
                          </h4>
                          <div className="space-y-1">
                            {processingSummary.errors.map(
                              (error: any, index: number) => (
                                <div
                                  key={index}
                                  className="text-sm text-red-600"
                                >
                                  {error.message}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Box>
    </>
  );
};

export default ProcessDepartmentPayroll;
