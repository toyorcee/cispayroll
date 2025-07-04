import api from "./api";
import { toast } from "react-toastify";
import { PayrollData } from "../types/payroll";
import { UserRole } from "../types/auth";

// Define types for the admin payroll data
export interface AdminPayrollPeriod {
  year: number;
  month: number;
  count: number;
  totalAmount: number;
  statuses: string[];
}

export interface AdminPayrollStats {
  stats: Array<{
    _id: string;
    count: number;
    totalNetPay: number;
  }>;
  summary: {
    totalCount: number;
    totalAmount: number;
  };
}

export interface AdminPayrollProcessingStats {
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
  totalApprovedAmount: number;
  totalPaidAmount: number;
  totalPendingAmount: number;
  totalProcessingAmount: number;
  totalPendingPaymentAmount: number;
  recentActivityCount: number;
  totalAmountPaid: number;
  totalAmountApproved: number;
  totalAmountPending: number;
  totalAmountProcessing: number;
  totalAmountPendingPayment: number;

  // Processing Time Statistics
  processingTime?: {
    currentMonth: {
      count: number;
      average: number;
      total: number;
      min: number;
      max: number;
    };
    currentYear: {
      count: number;
      average: number;
      total: number;
      min: number;
      max: number;
    };
    monthlyBreakdown: Array<{
      month: number;
      monthName: string;
      count: number;
      average: number;
      total: number;
    }>;
    efficiencyBreakdown: {
      excellent?: number;
      good?: number;
      average?: number;
      slow?: number;
    };
  };
}

export interface AdminPayroll {
  _id: string;
  employee: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeId: string;
  };
  department: {
    _id: string;
    name: string;
  };
  month: number;
  year: number;
  status: string;
  totals: {
    grossEarnings: number;
    totalDeductions: number;
    netPay: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AdminPayrollResponse {
  success: boolean;
  data: {
    payrolls: PayrollData[];
    pagination: {
      total: number;
      page: number;
      pages: number;
    };
  };
  message?: string;
}

// Base URL for admin API
const BASE_URL = `/api/admin`;
const SUPER_ADMIN_BASE_URL = `/api/super-admin`;
const APPROVAL_BASE_URL = `/api/approvals`;

// Helper function to determine if user is Super Admin
const isSuperAdmin = (userRole?: string): boolean => {
  return userRole === UserRole.SUPER_ADMIN;
};

// Admin payroll service
export const adminPayrollService = {
  // Get all payrolls for admin's department
  getDepartmentPayrolls: async (
    userRole?: string,
    params?: {
      page?: number;
      limit?: number;
      month?: number;
      year?: number;
      status?: string;
    }
  ): Promise<AdminPayrollResponse> => {
    try {
      // Use different endpoint for Super Admin
      const endpoint = isSuperAdmin(userRole)
        ? `${SUPER_ADMIN_BASE_URL}/payroll`
        : `${BASE_URL}/payroll`;

      const response = await api.get(endpoint, {
        params,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch payrolls");
      }

      return response.data;
    } catch (error: any) {
      console.error("Error fetching payrolls:", error);
      throw error;
    }
  },

  // Get payroll statistics for admin's department
  getPayrollStats: async (
    userRole?: string,
    filters?: {
      status?: string;
      department?: string;
      startDate?: string;
      endDate?: string;
      month?: number;
      year?: number;
    }
  ): Promise<AdminPayrollStats> => {
    try {
      // Use different endpoint for Super Admin
      const endpoint = isSuperAdmin(userRole)
        ? `${SUPER_ADMIN_BASE_URL}/payroll/stats`
        : `${BASE_URL}/payroll/stats`;

      // Build query params
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.department) params.append("department", filters.department);
      if (filters?.startDate) params.append("startDate", filters.startDate);
      if (filters?.endDate) params.append("endDate", filters.endDate);
      if (filters?.month) params.append("month", filters.month.toString());
      if (filters?.year) params.append("year", filters.year.toString());

      const queryString = params.toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;

      console.log("🔍 Fetching payroll stats with filters:", { filters, url });

      const response = await api.get(url);

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to fetch payroll statistics"
        );
      }

      console.log("📊 Received payroll stats:", response.data);
      return response.data.data;
    } catch (error) {
      console.error("❌ Error fetching payroll statistics:", error);
      throw error;
    }
  },

  // Get payroll periods for admin's department
  getPayrollPeriods: async (
    userRole?: string
  ): Promise<AdminPayrollPeriod[]> => {
    try {
      // Use different endpoint for Super Admin
      const endpoint = isSuperAdmin(userRole)
        ? `${SUPER_ADMIN_BASE_URL}/payroll/periods`
        : `${BASE_URL}/payroll/periods`;

      const response = await api.get(endpoint);

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to fetch payroll periods"
        );
      }

      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching payroll periods:", error);
      // toast.error(
      //   error.response?.data?.message || "Failed to fetch payroll periods"
      // );
      throw error;
    }
  },

  // Get a single payroll by ID
  getPayrollById: async (payrollId: string): Promise<PayrollData> => {
    try {
      const response = await api.get(`${BASE_URL}/payroll/${payrollId}`);
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to get payroll");
      }
      return response.data.data;
    } catch (error) {
      console.error("[getPayrollById] Error:", error);
      throw error;
    }
  },

  // Submit single payroll for approval
  submitPayroll: async (
    payrollId: string,
    userRole?: string,
    remarks?: string
  ): Promise<PayrollData> => {
    try {
      // Use different endpoint for Super Admin
      const endpoint = isSuperAdmin(userRole)
        ? `${SUPER_ADMIN_BASE_URL}/payroll/${payrollId}/submit`
        : `${BASE_URL}/payroll/${payrollId}/submit`;

      const response = await api.patch(endpoint, { remarks });

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to submit payroll");
      }

      // toast.success("Payroll submitted successfully");
      return response.data.data;
    } catch (error: any) {
      console.error("Error submitting payroll:", error);
      // toast.error(error.response?.data?.message || "Failed to submit payroll");
      throw error;
    }
  },

  // Approve payroll
  approvePayroll: async (
    payrollId: string,
    userRole?: string
  ): Promise<PayrollData> => {
    try {
      // Use different endpoint for Super Admin
      const endpoint = isSuperAdmin(userRole)
        ? `${SUPER_ADMIN_BASE_URL}/payroll/${payrollId}/approve`
        : `${BASE_URL}/payroll/${payrollId}/approve`;

      const response = await api.post(endpoint, {});

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to approve payroll");
      }

      // toast.success("Payroll approved successfully");
      return response.data.data;
    } catch (error: any) {
      console.error("Error approving payroll:", error);
      // toast.error(error.response?.data?.message || "Failed to approve payroll");
      throw error;
    }
  },

  // Reject payroll
  rejectPayroll: async ({
    payrollId,
    reason,
    userRole,
  }: {
    payrollId: string;
    reason: string;
    userRole?: string;
  }): Promise<PayrollData> => {
    try {
      // Use different endpoint for Super Admin
      const endpoint = isSuperAdmin(userRole)
        ? `${APPROVAL_BASE_URL}/super-admin/${payrollId}/reject`
        : `${BASE_URL}/payroll/${payrollId}/reject`;

      const response = await api.patch(endpoint, { reason });

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to reject payroll");
      }

      return response.data.data;
    } catch (error: any) {
      console.error("Error rejecting payroll:", error);
      throw error;
    }
  },

  // Resubmit rejected payroll
  resubmitPayroll: async (payrollId: string, userRole?: string) => {
    try {
      // First get the payroll details to get the salary grade
      const response = await api.get(`${BASE_URL}/payroll/${payrollId}`);
      const payroll = response.data.data;

      if (!payroll) {
        throw new Error("Payroll not found");
      }

      const endpoint = isSuperAdmin(userRole)
        ? `${BASE_URL}/payroll/${payrollId}/resubmit`
        : `${BASE_URL}/payroll/${payrollId}/resubmit`;

      const res = await api.post(endpoint, {
        salaryGrade: payroll.salaryGrade,
      });

      return res.data;
    } catch (error) {
      console.error("❌ Error in resubmitPayroll:", error);
      throw error;
    }
  },

  // Process payment
  processPayment: async (
    payrollId: string,
    userRole?: string
  ): Promise<AdminPayroll> => {
    try {
      // Use different endpoint for Super Admin
      const endpoint = isSuperAdmin(userRole)
        ? `${SUPER_ADMIN_BASE_URL}/payroll/${payrollId}/process-payment`
        : `${BASE_URL}/payroll/${payrollId}/process-payment`;

      const response = await api.patch(endpoint, {});

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to process payment");
      }

      // toast.success("Payment processed successfully");
      return response.data.data;
    } catch (error: any) {
      console.error("Error processing payment:", error);
      // toast.error(error.response?.data?.message || "Failed to process payment");
      throw error;
    }
  },

  // Initiate payment
  initiatePayment: async (
    payrollId: string,
    userRole?: string
  ): Promise<AdminPayroll> => {
    try {
      // Use different endpoint for Super Admin
      const endpoint = isSuperAdmin(userRole)
        ? `${SUPER_ADMIN_BASE_URL}/payroll/${payrollId}/initiate-payment`
        : `${BASE_URL}/payroll/${payrollId}/initiate-payment`;

      const response = await api.post(endpoint, {});

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to initiate payment");
      }

      return response.data.data;
    } catch (error: any) {
      console.error("Error initiating payment:", error);
      throw error;
    }
  },

  // Initiate multiple payments for Super Admin
  initiatePaymentsMultiple: async (
    payrollIds: string[],
    userRole?: string
  ): Promise<{
    payrolls: Array<{ payrollId: string; status: string; payment: any }>;
    errors?: Array<{ payrollId: string; error: string }>;
  }> => {
    try {
      // Use different endpoint for Super Admin
      const endpoint = isSuperAdmin(userRole)
        ? `${SUPER_ADMIN_BASE_URL}/payroll/initiate-payment`
        : `${BASE_URL}/payroll/initiate-payment`;

      const response = await api.post(endpoint, { payrollIds });

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to initiate batch payments"
        );
      }

      return response.data.data;
    } catch (error: any) {
      console.error("Error initiating batch payments:", error);
      throw error;
    }
  },

  // Get employee payroll history
  getEmployeePayrollHistory: async (
    employeeId: string,
    userRole?: string
  ): Promise<AdminPayroll[]> => {
    try {
      // Use different endpoint for Super Admin
      const endpoint = isSuperAdmin(userRole)
        ? `${SUPER_ADMIN_BASE_URL}/payroll/employee/${employeeId}/history`
        : `${BASE_URL}/payroll/employee/${employeeId}/history`;

      const response = await api.get(endpoint);

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to fetch employee payroll history"
        );
      }

      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching employee payroll history:", error);
      // toast.error(
      //   error.response?.data?.message ||
      //     "Failed to fetch employee payroll history"
      // );
      throw error;
    }
  },

  // Process single employee payroll
  processSingleEmployeePayroll: async (data: {
    employeeId: string;
    departmentId: string;
    month: number;
    year: number;
    frequency: string;
    salaryGrade?: string;
    userRole?: string;
  }): Promise<{ data: PayrollData; summary?: any }> => {
    try {
      const endpoint = isSuperAdmin(data.userRole)
        ? `${SUPER_ADMIN_BASE_URL}/payroll/process-single-employee`
        : `${BASE_URL}/payroll/process-single`;

      const response = await api.post(endpoint, {
        employeeId: data.employeeId,
        departmentId: data.departmentId,
        month: data.month,
        year: data.year,
        frequency: data.frequency,
        salaryGrade: data.salaryGrade,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to process payroll");
      }

      return response.data;
    } catch (error: any) {
      console.error("Error in processSingleEmployeePayroll:", error);

      // Extract the actual error message from the response
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to process payroll";

      // Create a custom error with the proper message
      const customError = new Error(errorMessage);
      customError.name = "PayrollProcessingError";

      throw customError;
    }
  },

  // Process department payroll
  processDepartmentPayroll: async (
    data: {
      month: number;
      year: number;
      frequency: string;
      employeeSalaryGrades: { employeeId: string; salaryGradeId: string }[];
    },
    userRole?: string
  ): Promise<any> => {
    try {
      // Use different endpoint for Super Admin
      const endpoint = isSuperAdmin(userRole)
        ? `${SUPER_ADMIN_BASE_URL}/payroll/process-department`
        : `${BASE_URL}/payroll/process-department`;

      const response = await api.post(endpoint, data);

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to process department payroll"
        );
      }

      return response.data.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Submit multiple selected payrolls
  submitBulkPayrolls: async (
    data: {
      payrollIds: string[];
      remarks?: string;
    },
    userRole?: string
  ): Promise<PayrollData[]> => {
    try {
      // Use different endpoint for Super Admin
      const endpoint = isSuperAdmin(userRole)
        ? `${SUPER_ADMIN_BASE_URL}/payroll/submit-bulk`
        : `${BASE_URL}/payroll/submit-bulk`;

      const response = await api.post(endpoint, data);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to submit payrolls");
      }

      toast.success(
        `${response.data.data.submittedCount} payrolls submitted successfully`
      );
      return response.data.data.submittedPayrolls;
    } catch (error: any) {
      console.error("Error submitting bulk payrolls:", error);
      toast.error(error.response?.data?.message || "Failed to submit payrolls");
      throw error;
    }
  },

  // Submit all department payrolls
  submitDepartmentPayrolls: async (
    data: {
      month: number;
      year: number;
      remarks?: string;
    },
    userRole?: string
  ): Promise<PayrollData[]> => {
    try {
      // Use different endpoint for Super Admin
      const endpoint = isSuperAdmin(userRole)
        ? `${SUPER_ADMIN_BASE_URL}/payroll/submit-department`
        : `${BASE_URL}/payroll/submit-department`;

      const response = await api.post(endpoint, data);

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to submit department payrolls"
        );
      }

      toast.success(
        `${response.data.data.submittedCount} payrolls submitted successfully`
      );
      return response.data.data.submittedPayrolls;
    } catch (error: any) {
      console.error("Error submitting department payrolls:", error);
      toast.error(
        error.response?.data?.message || "Failed to submit department payrolls"
      );
      throw error;
    }
  },

  // Bulk approve department payrolls
  approveDepartmentPayrolls: async (
    data: {
      month: number;
      year: number;
      remarks?: string;
    },
    userRole?: string
  ): Promise<PayrollData[]> => {
    try {
      // Use different endpoint for Super Admin
      const endpoint = isSuperAdmin(userRole)
        ? `${SUPER_ADMIN_BASE_URL}/payroll/approve-department`
        : `${BASE_URL}/payroll/approve-department`;

      const response = await api.post(endpoint, data);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to approve payrolls");
      }

      toast.success("Department payrolls approved successfully");
      return response.data.data;
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to approve payrolls"
      );
      throw error;
    }
  },

  // Bulk reject department payrolls
  rejectDepartmentPayrolls: async (
    data: {
      month: number;
      year: number;
      remarks: string;
    },
    userRole?: string
  ): Promise<PayrollData[]> => {
    try {
      // Use different endpoint for Super Admin
      const endpoint = isSuperAdmin(userRole)
        ? `${SUPER_ADMIN_BASE_URL}/payroll/reject-department`
        : `${BASE_URL}/payroll/reject-department`;

      const response = await api.post(endpoint, data);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to reject payrolls");
      }

      toast.success("Department payrolls rejected successfully");
      return response.data.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reject payrolls");
      throw error;
    }
  },

  // Process multiple employees payroll
  processMultipleEmployeesPayroll: async (data: {
    employeeIds: string[];
    month: number;
    year: number;
    frequency: string;
    departmentId: string;
    userRole?: string;
  }): Promise<{
    processed: number;
    skipped: number;
    failed: number;
    total: number;
    errors: any[];
    summary?: any;
  }> => {
    try {
      // Use different endpoint for Super Admin
      const endpoint = isSuperAdmin(data.userRole)
        ? `${SUPER_ADMIN_BASE_URL}/payroll/process-multiple-employees`
        : `${BASE_URL}/payroll/process-multiple`;

      const response = await api.post(endpoint, data);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to process payroll");
      }

      return response.data.data;
    } catch (error: any) {
      console.error("Error processing multiple employees payroll:", error);

      // Extract the actual error message from the response
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to process payroll";

      // Create a custom error with the proper message
      const customError = new Error(errorMessage);
      customError.name = "PayrollProcessingError";

      throw customError;
    }
  },

  // Process payroll for all active employees
  processAllEmployeesPayroll: async (data: {
    month: number;
    year: number;
    frequency: string;
    userRole?: string;
  }): Promise<{ success: boolean; processed: number; summary?: any }> => {
    try {
      // This endpoint is only available for Super Admin
      if (!isSuperAdmin(data.userRole)) {
        throw new Error("Only Super Admin can process all employees payroll");
      }

      const endpoint = `${SUPER_ADMIN_BASE_URL}/payroll/process-all-employees`;

      const response = await api.post(endpoint, data);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to process payroll");
      }

      return response.data.data;
    } catch (error: any) {
      console.error("Error processing all employees payroll:", error);
      throw error;
    }
  },

  processPayroll: async (
    payrollId: string,
    userRole?: string
  ): Promise<PayrollData> => {
    try {
      // Use different endpoint for Super Admin
      const endpoint = isSuperAdmin(userRole)
        ? `${SUPER_ADMIN_BASE_URL}/payroll/${payrollId}/process`
        : `${BASE_URL}/payroll/${payrollId}/process`;

      const response = await api.post(endpoint, {});

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to process payroll");
      }

      // toast.success("Payroll processed successfully");
      return response.data.data;
    } catch (error: any) {
      console.error("Error processing payroll:", error);
      toast.error(error.response?.data?.message || "Failed to process payroll");
      throw error;
    }
  },

  getProcessingStatistics: async (
    userRole?: string,
    timestamp?: number
  ): Promise<AdminPayrollProcessingStats> => {
    try {
      // Use different endpoint for Super Admin
      const endpoint = isSuperAdmin(userRole)
        ? `${SUPER_ADMIN_BASE_URL}/payroll/processing-statistics`
        : `${BASE_URL}/payroll/processing-statistics`;

      // Add timestamp to prevent caching
      const url = timestamp ? `${endpoint}?t=${timestamp}` : endpoint;

      const response = await api.get(url);
      console.log("[getProcessingStatistics] API response:", response.data);
      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to fetch processing statistics"
        );
      }

      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching processing statistics:", error);
      console.error("Error details:", error.response?.data);
      toast.error(
        error.response?.data?.message || "Failed to fetch processing statistics"
      );
      throw error;
    }
  },
};
