import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { FaExclamationTriangle, FaPlus, FaSpinner } from "react-icons/fa";
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

interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
  message: string;
}

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
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectingPayrollId, setRejectingPayrollId] = useState<string | null>(
    null
  );
  const [rejectDialogData, setRejectDialogData] = useState<{
    reason: string;
  }>({
    reason: "",
  });

  // Add state for approve dialog
  const [, setShowApproveDialog] = useState(false);
  const [approvingPayrollId, setApprovingPayrollId] = useState<string | null>(
    null
  );
  const [approveDialogData, setApproveDialogData] = useState<{
    remarks: string;
  }>({
    remarks: "",
  });

  // Add state for processing payment
  // const [processingPayrollId, setProcessingPayrollId] = useState<string | null>(
  //   null
  // );

  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

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
    // Special case: If payroll is created by HR and it's Department Head level
    if (level === "DEPARTMENT_HEAD") {
      const hrSubmission = history.find(
        (h) =>
          h.level === "HR_MANAGER" &&
          h.status === "PENDING" &&
          h.action === "SUBMIT"
      );
      if (hrSubmission) {
        return false; // Department Head is never pending if HR submitted
      }
    }
    if (currentLevel === level) return true;
    if (!history.some((h) => h.level === level)) return true;
    return false;
  };

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

  const handleSinglePayrollSubmit = async (data: {
    employeeIds: string[];
    month: number;
    year: number;
    frequency: string;
    salaryGrade?: string;
    departmentId: string;
  }) => {
    console.log("Processing payroll submission");
    setIsProcessing(true);

    try {
      if (data.employeeIds.length === 1) {
        // Process single employee
        console.log("Processing single employee payroll");
        await adminPayrollService.processSingleEmployeePayroll({
          employeeId: data.employeeIds[0],
          departmentId: data.departmentId,
          month: data.month,
          year: data.year,
          frequency: data.frequency,
          salaryGrade: data.salaryGrade,
          userRole: user?.role,
        });

        // Show toast after processing is complete
        toast.success("Payroll processed successfully");

        setPayrollProcessed(true);
        console.log("Closing modal after successful processing");
        setShowSingleProcessModal(false);
      } else {
        console.log("Processing multiple employees payroll");
        const multipleResult =
          await adminPayrollService.processMultipleEmployeesPayroll({
            employeeIds: data.employeeIds,
            departmentId: data.departmentId,
            month: data.month,
            year: data.year,
            frequency: data.frequency,
            userRole: user?.role,
          });

        // Show detailed processing results
        if (multipleResult.processed > 0) {
          toast.success(
            `Successfully processed ${multipleResult.processed} out of ${multipleResult.total} payrolls`
          );

          if (multipleResult.skipped > 0) {
            toast.info(
              `${multipleResult.skipped} payrolls were skipped (already exist)`
            );
          }

          if (multipleResult.failed > 0) {
            toast.error(`${multipleResult.failed} payrolls failed to process`);
            // Log detailed errors for debugging
            console.error("Payroll processing errors:", multipleResult.errors);
          }
        } else {
          toast.warning("No payrolls were processed");
        }

        setPayrollProcessed(true);
        console.log("Closing modal after successful processing");
        setShowSingleProcessModal(false);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to process payroll");
    } finally {
      setIsProcessing(false);
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

  const handleProcessPayment = (payroll: Payroll) => {
    try {
      processPaymentMutation.mutate(payroll._id);
    } catch (error) {
      console.error("Error processing payment:", error);
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

      let response;

      try {
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

        // Only show success toast for Finance Director approval
        if (payroll.approvalFlow?.currentLevel === "FINANCE_DIRECTOR") {
          toast.success("Payroll approved successfully");
        }
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || "Failed to approve payroll"
        );
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve payroll");
    } finally {
      setIsApproving(false);
      setShowApproveDialog(false);
    }
  };

  const handleViewDetailsWithPermission = (payroll: Payroll) => {
    if (canViewPayroll) {
      handleViewDetails(payroll);
    }
  };

  const handleApproveWithPermission = (payroll: Payroll) => {
    if (canApprovePayroll) {
      handleApprove(payroll);
    }
  };

  const handleRejectWithPermission = (payroll: Payroll) => {
    if (canApprovePayroll) {
      setSelectedPayrollId(payroll._id);
      setRejectionDialogOpen(true);
    }
  };

  const handleSubmitForApprovalWithPermission = (payroll: Payroll) => {
    if (canProcessPayroll) {
      handleSubmitForApproval(payroll);
    }
  };

  const handleProcessPaymentWithPermission = (payroll: Payroll) => {
    if (canProcessPayroll) {
      handleProcessPayment(payroll);
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
      handleResubmit(payroll);
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

  const [singleProcessData, setSingleProcessData] = useState<{
    employeeIds: string[];
    month: number;
    year: number;
    frequency: string;
    departmentId: string;
  } | null>(null);

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
  const convertedPayrolls: Payroll[] = payrollsData.map(
    (payroll: PayrollData) => {
      // Create the base payroll object
      const convertedPayroll: Payroll = {
        _id: payroll._id,
        employee: {
          _id: payroll.employee._id,
          firstName: payroll.employee.firstName,
          lastName: payroll.employee.lastName,
          email: payroll.employee.employeeId,
        },
        month: payroll.month,
        year: payroll.year,
        status: payroll.status,
        frequency: "monthly", // Default to monthly since it's not in PayrollData
        totalEarnings: payroll.earnings.totalEarnings || 0,
        totalDeductions: payroll.deductions.totalDeductions || 0,
        netPay: payroll.totals.netPay || 0,
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
    }
  );

  return (
    <Box sx={{ width: "100%" }}>
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

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <h1 className="text-2xl font-semibold text-gray-900">
          Process Department Payroll
        </h1>
        {(canProcessPayroll || canProcessHRPayroll) && (
          <Button
            variant="contained"
            color="primary"
            startIcon={
              isProcessing ? <FaSpinner className="animate-spin" /> : <FaPlus />
            }
            onClick={() => {
              setShowSingleProcessModal(true);
            }}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "Create Payroll"}
          </Button>
        )}
      </Box>
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
        >
          <Tab label="Payroll List" />
          <Tab label="Dashboard" />
        </Tabs>
      </Box>

      {activeTab === 0 ? (
        <>
          <PayrollTable
            payrolls={convertedPayrolls}
            onApprove={handleApproveWithPermission}
            onReject={handleRejectWithPermission}
            onView={handleViewDetailsWithPermission}
            onViewApprovalJourney={handleViewApprovalJourney}
            onSubmitForApproval={handleSubmitForApprovalWithPermission}
            onProcessPayment={handleProcessPaymentWithPermission}
            onResubmit={handleResubmitWithPermission}
            selectedPayrolls={selectedPayrollIds}
            onSelectionChange={handleSelectPayroll}
            loading={isPayrollsLoading || isProcessing}
            error={payrollsError}
            currentUserRole={user?.role}
            user={user}
          />
        </>
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
                    status:
                      payrollsData.find((p) => p._id === approvingPayrollId)
                        ?.approvalFlow?.currentLevel === "DEPARTMENT_HEAD"
                        ? "pending"
                        : "completed",
                  },
                  {
                    level: "HR Manager",
                    status:
                      payrollsData.find((p) => p._id === approvingPayrollId)
                        ?.approvalFlow?.currentLevel === "HR_MANAGER"
                        ? "pending"
                        : payrollsData.find((p) => p._id === approvingPayrollId)
                            ?.approvalFlow?.currentLevel === "DEPARTMENT_HEAD"
                        ? "pending"
                        : "completed",
                  },
                  {
                    level: "Finance Director",
                    status:
                      payrollsData.find((p) => p._id === approvingPayrollId)
                        ?.approvalFlow?.currentLevel === "FINANCE_DIRECTOR"
                        ? "pending"
                        : payrollsData.find((p) => p._id === approvingPayrollId)
                            ?.approvalFlow?.currentLevel ===
                            "DEPARTMENT_HEAD" ||
                          payrollsData.find((p) => p._id === approvingPayrollId)
                            ?.approvalFlow?.currentLevel === "HR_MANAGER"
                        ? "pending"
                        : "completed",
                  },
                  {
                    level: "Super Admin",
                    status:
                      payrollsData.find((p) => p._id === approvingPayrollId)
                        ?.approvalFlow?.currentLevel === "SUPER_ADMIN"
                        ? "pending"
                        : payrollsData.find((p) => p._id === approvingPayrollId)
                            ?.approvalFlow?.currentLevel ===
                            "DEPARTMENT_HEAD" ||
                          payrollsData.find((p) => p._id === approvingPayrollId)
                            ?.approvalFlow?.currentLevel === "HR_MANAGER" ||
                          payrollsData.find((p) => p._id === approvingPayrollId)
                            ?.approvalFlow?.currentLevel === "FINANCE_DIRECTOR"
                        ? "pending"
                        : "completed",
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
          <Button onClick={() => setRejectionDialogOpen(false)}>Cancel</Button>
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
                          selectedPayrollForJourney.approvalFlow?.history || [],
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
                          selectedPayrollForJourney.approvalFlow?.history || [],
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
                          selectedPayrollForJourney.approvalFlow?.history || [],
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
                          selectedPayrollForJourney.approvalFlow?.history || [],
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
    </Box>
  );
};

export default ProcessDepartmentPayroll;
