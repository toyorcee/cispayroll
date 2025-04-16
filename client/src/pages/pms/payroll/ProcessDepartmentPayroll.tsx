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
import { Box, Tab, Tabs, Button } from "@mui/material";
import ApprovalTimeline from "../../../components/payroll/processpayroll/admin/ApprovalTimeline";
import PayrollDashboard from "../../../components/payroll/processpayroll/PayrollDashboard";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
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
    remarks: string;
  }>({
    remarks: "",
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
  const [, setIsRejecting] = useState(false);

  // Add statistics query
  const { data: processingStats } = useQuery({
    queryKey: ["payrollProcessingStats"],
    queryFn: () => adminPayrollService.getProcessingStatistics(user?.role),
    enabled: !!user?.role,
  });

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
    setIsProcessing(true);

    try {
      if (data.employeeIds.length === 1) {
        // Process single employee
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
        // toast.success("Payroll processed successfully");

        setPayrollProcessed(true);
        setShowSingleProcessModal(false);
      } else {
        const multipleResult =
          await adminPayrollService.processMultipleEmployeesPayroll({
            employeeIds: data.employeeIds,
            departmentId: data.departmentId,
            month: data.month,
            year: data.year,
            frequency: data.frequency,
            userRole: user?.role,
          });

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

  // Add handler functions
  const handleReject = (payroll: Payroll) => {
    setRejectingPayrollId(payroll._id);
    setRejectDialogData({ remarks: "" });
    setShowRejectDialog(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectingPayrollId) return;

    try {
      setIsRejecting(true);

      // Get the payroll to determine the current approval level
      const payroll = payrolls?.data?.payrolls.find(
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

        // Refresh the payrolls data
        queryClient.invalidateQueries({ queryKey: ["adminPayrolls"] });
        queryClient.invalidateQueries({ queryKey: ["departmentPayrollStats"] });

        setShowApproveDialog(false);
        setApprovingPayrollId(null);
        setApproveDialogData({ remarks: "" });

        // Use the backend's success message
        toast.success(response.message);

        // If there's a next approver, show additional information
        if (response.data?.nextApprover && response.data.nextApprover.name) {
          toast.info(
            `Next approver: ${response.data.nextApprover.name} (${response.data.nextApprover.position})`
          );
        }
      } catch (error) {
        const apiError = error as ApiError;
        if (apiError.response?.status === 403) {
          toast.error("You don't have permission to approve at this level");
        } else if (apiError.response?.status === 400) {
          toast.error(
            apiError.response.data?.message || "Invalid approval request"
          );
        } else {
          throw error;
        }
      }
    } catch (error) {
      const apiError = error as ApiError;
      console.error("Error approving payroll:", apiError);
      const errorMessage =
        apiError.response?.data?.message || "Failed to approve payroll";
      toast.error(errorMessage);
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
      handleApprove(payroll);
    }
  };

  const handleRejectWithPermission = (payroll: Payroll) => {
    if (canApprovePayroll) {
      handleReject(payroll);
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

  const isLoadingCombined =
    isPeriodsLoading || isStatsLoading || isPayrollsLoading;

  const payrollsData = payrolls?.data?.payrolls ?? [];

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
    }
  );

  return (
    <Box sx={{ width: "100%" }}>
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
            onClick={() => setShowSingleProcessModal(true)}
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
            onSubmitForApproval={handleSubmitForApprovalWithPermission}
            onProcessPayment={handleProcessPaymentWithPermission}
            selectedPayrolls={selectedPayrollIds}
            onSelectionChange={handleSelectPayroll}
            loading={isPayrollsLoading || isProcessing}
            error={payrollsError}
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
                  { level: "Department Head", status: "completed" },
                  {
                    level: "HR Manager",
                    status:
                      payrollsData.find((p) => p._id === approvingPayrollId)
                        ?.approvalFlow?.currentLevel === "HR_MANAGER"
                        ? "pending"
                        : "completed",
                  },
                  {
                    level: "Finance Director",
                    status:
                      payrollsData.find((p) => p._id === approvingPayrollId)
                        ?.approvalFlow?.currentLevel === "FINANCE_DIRECTOR"
                        ? "pending"
                        : "completed",
                  },
                  {
                    level: "Super Admin",
                    status:
                      payrollsData.find((p) => p._id === approvingPayrollId)
                        ?.approvalFlow?.currentLevel === "SUPER_ADMIN"
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
                onChange={(event) =>
                  setRejectDialogData((prev) => ({
                    ...prev,
                    remarks: event.target.value,
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
    </Box>
  );
};

export default ProcessDepartmentPayroll;
