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
import { PayrollData, PayrollStatus } from "../../../types/payroll";
import PayrollDetailsModal from "../../../components/payroll/processpayroll/admin/PayrollDetailsModal";
import SingleEmployeeProcessModal from "../../../components/payroll/processpayroll/admin/SingleEmployeeProcessModal";
import { Department as DepartmentType } from "../../../types/department";
import { User } from "../../../types/user";
import PayrollTable, {
  Payroll,
} from "../../../components/payroll/processpayroll/admin/PayrollTable";
import approvalService from "../../../services/approvalService";

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
  const [isRejecting, setIsRejecting] = useState(false);

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

  const {
    data: payrollsData,
    isLoading,
    error,
  } = useQuery<AdminPayrollResponse>({
    queryKey: ["adminPayrolls"],
    queryFn: () => adminPayrollService.getDepartmentPayrolls(),
  });

  const { data: payrollPeriods, isLoading: isPeriodsLoading } = useQuery({
    queryKey: ["departmentPayrollPeriods"],
    queryFn: () => adminPayrollService.getPayrollPeriods(),
  });

  const { data: payrollStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["departmentPayrollStats"],
    queryFn: () => {
      return adminPayrollService.getPayrollStats().then((stats) => {
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
    setSubmitDialogData({
      type: "single",
      payrollId,
      remarks: "",
    });
    setShowSubmitDialog(true);
  };

  const handleViewDetails = (payroll: PayrollData) => {
    // Close all other modals first
    setShowRejectDialog(false);

    // Then set the selected payroll and show details modal
    setSelectedPayroll(payroll);
    setShowDetailsModal(true);
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
    setProcessingType(data.employeeIds.length === 1 ? "single" : "multiple");

    try {
      if (data.employeeIds.length === 1) {
        // Process single employee
        const singleResult =
          await adminPayrollService.processSingleEmployeePayroll({
            employeeId: data.employeeIds[0],
            month: data.month,
            year: data.year,
            frequency: data.frequency,
            salaryGrade: data.salaryGrade,
          });

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

        // Show toast after processing is complete
        toast.success("Payroll processed successfully");

        setPayrollProcessed(true);
        setShowSingleProcessModal(false);
      } else {
        const multipleResult =
          await adminPayrollService.processMultipleEmployeesPayroll({
            employeeIds: data.employeeIds,
            month: data.month,
            year: data.year,
            frequency: data.frequency,
          });

        setProcessingResults(multipleResult);

        if (multipleResult.processed > 0) {
          toast.success(
            `Successfully processed ${multipleResult.processed} payrolls`
          );
        } else {
          toast.warning("No payrolls were processed");
        }

        setPayrollProcessed(true);
        setShowSingleProcessModal(false);
      }
    } catch (error: any) {
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

      toast.error(error.message || "Failed to process payroll");
    } finally {
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
    try {
      if (submitDialogData.type === "single" && submitDialogData.payrollId) {
        await submitMutation.mutateAsync(submitDialogData.payrollId);
        toast.success("Payroll submitted for approval");
      } else if (submitDialogData.type === "bulk") {
        const result = await adminPayrollService.submitBulkPayrolls({
          payrollIds: selectedPayrollIds,
          remarks: submitDialogData.remarks,
        });
        toast.success(`${result.length} payrolls submitted successfully`);
        setSelectedPayrollIds([]);
      }
      setShowSubmitDialog(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit payroll(s)");
    }
  };

  const handleProcessDepartmentPayroll = async (data: {
    month: number;
    year: number;
    frequency: string;
  }) => {
    setIsProcessing(true);
    setProcessingType("department");

    try {
      const departmentResult =
        await adminPayrollService.processDepartmentPayroll({
          month: data.month,
          year: data.year,
          frequency: data.frequency,
        });

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

      setProcessingResults(processedResults);

      if (processedResults.processed > 0) {
        toast.success(
          `Successfully processed ${processedResults.processed} department payrolls`
        );
      } else {
        toast.warning("No department payrolls were processed");
      }

      queryClient.invalidateQueries({ queryKey: ["adminPayrolls"] });
      queryClient.invalidateQueries({ queryKey: ["departmentPayrollStats"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (error: any) {
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

      toast.error(errorMessage);
    } finally {
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
    setRejectingPayrollId(payrollId);
    setRejectDialogData({ remarks: "" });
    setShowRejectDialog(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectingPayrollId) return;

    try {
      setIsRejecting(true);

      // Get the payroll to determine the current approval level
      const payroll = payrollsData?.data?.payrolls.find(
        (p) => p._id === rejectingPayrollId
      );

      if (!payroll) {
        toast.error("Payroll not found");
        return;
      }

      // Determine which rejection method to use based on the current approval level
      let response;

      switch (payroll.approvalFlow?.currentLevel) {
        case "DEPARTMENT_HEAD":
          response = await approvalService.rejectAsDepartmentHead(
            rejectingPayrollId,
            rejectDialogData.remarks || "Rejected by Department Head"
          );
          break;
        case "HR_MANAGER":
          response = await approvalService.rejectAsHRManager(
            rejectingPayrollId,
            rejectDialogData.remarks || "Rejected by HR Manager"
          );
          break;
        case "FINANCE_DIRECTOR":
          response = await approvalService.rejectAsFinanceDirector(
            rejectingPayrollId,
            rejectDialogData.remarks || "Rejected by Finance Director"
          );
          break;
        case "SUPER_ADMIN":
          response = await approvalService.rejectAsSuperAdmin(
            rejectingPayrollId,
            rejectDialogData.remarks || "Rejected by Super Admin"
          );
          break;
        default:
          toast.error("Invalid approval level");
          return;
      }

      // Refresh the payrolls data
      queryClient.invalidateQueries({ queryKey: ["adminPayrolls"] });
      queryClient.invalidateQueries({ queryKey: ["departmentPayrollStats"] });

      setShowRejectDialog(false);
      setRejectingPayrollId(null);
      setRejectDialogData({ remarks: "" });

      // Use the backend's success message
      toast.success(response.message);
    } catch (error: any) {
      console.error("Error rejecting payroll:", error);
      // Use the backend's error message if available
      const errorMessage =
        error.response?.data?.message || "Failed to reject payroll";
      toast.error(errorMessage);
    } finally {
      setIsRejecting(false);
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

  const handleApprove = async (payrollId: string) => {
    setApprovingPayrollId(payrollId);
    setApproveDialogData({ remarks: "" });
    setShowApproveDialog(true);
  };

  const handleConfirmApprove = async () => {
    if (!approvingPayrollId) return;

    try {
      setIsApproving(true);

      // Get the payroll to determine the current approval level
      const payroll = payrollsData?.data?.payrolls.find(
        (p) => p._id === approvingPayrollId
      );

      if (!payroll) {
        toast.error("Payroll not found");
        return;
      }

      // Determine which approval method to use based on the current approval level
      let response;

      switch (payroll.approvalFlow?.currentLevel) {
        case "DEPARTMENT_HEAD":
          response = await approvalService.approveAsDepartmentHead(
            approvingPayrollId,
            approveDialogData.remarks
          );
          break;
        case "HR_MANAGER":
          response = await approvalService.approveAsHRManager(
            approvingPayrollId,
            approveDialogData.remarks
          );
          break;
        case "FINANCE_DIRECTOR":
          response = await approvalService.approveAsFinanceDirector(
            approvingPayrollId,
            approveDialogData.remarks
          );
          break;
        case "SUPER_ADMIN":
          response = await approvalService.approveAsSuperAdmin(
            approvingPayrollId,
            approveDialogData.remarks
          );
          break;
        default:
          toast.error("Invalid approval level");
          return;
      }

      // Refresh the payrolls data
      queryClient.invalidateQueries({ queryKey: ["adminPayrolls"] });
      queryClient.invalidateQueries({ queryKey: ["departmentPayrollStats"] });

      setShowApproveDialog(false);
      setApprovingPayrollId(null);
      setApproveDialogData({ remarks: "" });

      // Use the backend's success message
      toast.success(response.message);

      // If there's a next approver, show additional information
      if (response.data?.nextApprover) {
        toast.info(
          `Next approver: ${response.data.nextApprover.name} (${response.data.nextApprover.position})`
        );
      }
    } catch (error: any) {
      console.error("Error approving payroll:", error);
      // Use the backend's error message if available
      const errorMessage =
        error.response?.data?.message || "Failed to approve payroll";
      toast.error(errorMessage);
    } finally {
      setIsApproving(false);
    }
  };

  const isLoadingCombined = isPeriodsLoading || isStatsLoading || isLoading;

  const payrolls = payrollsData?.data?.payrolls ?? [];

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

  if (isLoadingCombined) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        Error loading payrolls
      </div>
    );
  }

  // Convert PayrollData to Payroll for the PayrollTable component
  const convertedPayrolls: Payroll[] = payrolls.map((payroll: PayrollData) => {
    // Create the base payroll object
    const convertedPayroll: Payroll = {
      _id: payroll._id,
      employee: {
        _id: payroll.employee._id,
        firstName: payroll.employee.firstName,
        lastName: payroll.employee.lastName,
        email: payroll.employee.employeeId, // Use employeeId as email since it's not available
      },
      month: payroll.month,
      year: payroll.year,
      status: payroll.status,
      totalEarnings: payroll.earnings.totalEarnings || 0,
      totalDeductions: payroll.deductions.totalDeductions || 0,
      netPay: payroll.totals.netPay || 0,
      createdAt: payroll.createdAt,
      updatedAt: payroll.updatedAt,
    };

    // Add approvalFlow if it exists
    if (payroll.approvalFlow) {
      convertedPayroll.approvalFlow = {
        currentLevel: payroll.approvalFlow.currentLevel || "",
        history: payroll.approvalFlow.history || [],
      };
    }

    return convertedPayroll;
  });

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
          value={new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
          }).format(payrollStats?.totalAmount || 0)}
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

      <div className="mt-6">
        <PayrollTable
          payrolls={convertedPayrolls}
          loading={isLoading}
          error={error ? String(error) : null}
          selectedPayrolls={selectedPayrollIds}
          onSelectPayroll={handleSelectPayroll}
          onSelectAllPayrolls={handleSelectAll}
          onViewDetails={(payroll) => {
            const payrollData = payrolls.find((p) => p._id === payroll._id);
            if (payrollData) {
              handleViewDetails(payrollData);
            }
          }}
          onSubmitForApproval={(payroll) => handleSubmit(payroll._id)}
          onApprove={(payroll) => handleApprove(payroll._id)}
          onReject={(payroll) => handleReject(payroll._id)}
          onProcessPayment={(payroll) => handleProcessPayment(payroll._id)}
        />
      </div>

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
