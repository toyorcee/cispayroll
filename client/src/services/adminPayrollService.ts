import axios from "axios";
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
  PENDING: number;
  APPROVED: number;
  REJECTED: number;
  total: number;
  totalAmount: number;
  PAID: number;
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
const BASE_URL = "http://localhost:5000/api/admin";
const SUPER_ADMIN_BASE_URL = "http://localhost:5000/api/super-admin";

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

      console.log("Making request to:", endpoint); // Debug log
      const response = await axios.get(endpoint, {
        params,
        withCredentials: true, // Important! This ensures cookies are sent
      });

      console.log("Response:", response.data); // Debug log

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
  getPayrollStats: async (userRole?: string): Promise<AdminPayrollStats> => {
    try {
      // Use different endpoint for Super Admin
      const endpoint = isSuperAdmin(userRole)
        ? `${SUPER_ADMIN_BASE_URL}/payroll/stats`
        : `${BASE_URL}/payroll/stats`;

      console.log("Making request to:", endpoint); // Debug log
      const response = await axios.get(endpoint, { withCredentials: true });

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to fetch payroll statistics"
        );
      }

      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching payroll statistics:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch payroll statistics"
      );
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

      console.log("Making request to:", endpoint);
      const response = await axios.get(endpoint, { withCredentials: true });

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to fetch payroll periods"
        );
      }

      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching payroll periods:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch payroll periods"
      );
      throw error;
    }
  },

  // Get a single payroll by ID
  getPayrollById: async (
    payrollId: string,
    userRole?: string
  ): Promise<PayrollData> => {
    try {
      // Use different endpoint for Super Admin
      const endpoint = isSuperAdmin(userRole)
        ? `${SUPER_ADMIN_BASE_URL}/payroll/${payrollId}`
        : `${BASE_URL}/payroll/${payrollId}`;

      console.log("Making request to:", endpoint);
      const response = await axios.get(endpoint, { withCredentials: true });

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch payroll");
      }

      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching payroll:", error);
      toast.error(error.response?.data?.message || "Failed to fetch payroll");
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

      console.log("Making request to:", endpoint); // Debug log
      const response = await axios.patch(
        endpoint,
        { remarks },
        { withCredentials: true }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to submit payroll");
      }

      // toast.success("Payroll submitted successfully");
      return response.data.data;
    } catch (error: any) {
      console.error("Error submitting payroll:", error);
      toast.error(error.response?.data?.message || "Failed to submit payroll");
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

      console.log("Making request to:", endpoint); // Debug log
      const response = await axios.post(
        endpoint,
        {},
        { withCredentials: true }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to approve payroll");
      }

      toast.success("Payroll approved successfully");
      return response.data.data;
    } catch (error: any) {
      console.error("Error approving payroll:", error);
      toast.error(error.response?.data?.message || "Failed to approve payroll");
      throw error;
    }
  },

  // Reject payroll
  rejectPayroll: async ({
    payrollId,
    remarks,
    userRole,
  }: {
    payrollId: string;
    remarks: string;
    userRole?: string;
  }): Promise<PayrollData> => {
    try {
      // Use different endpoint for Super Admin
      const endpoint = isSuperAdmin(userRole)
        ? `${SUPER_ADMIN_BASE_URL}/payroll/${payrollId}/reject`
        : `${BASE_URL}/payroll/${payrollId}/reject`;

      console.log("Making request to:", endpoint); // Debug log
      const response = await axios.patch(
        endpoint,
        { remarks },
        { withCredentials: true }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to reject payroll");
      }

      return response.data.data;
    } catch (error: any) {
      console.error("Error rejecting payroll:", error);
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

      console.log("Making request to:", endpoint); // Debug log
      const response = await axios.patch(
        endpoint,
        {},
        { withCredentials: true }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to process payment");
      }

      toast.success("Payment processed successfully");
      return response.data.data;
    } catch (error: any) {
      console.error("Error processing payment:", error);
      toast.error(error.response?.data?.message || "Failed to process payment");
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

      console.log("Making request to:", endpoint); // Debug log
      const response = await axios.get(endpoint, { withCredentials: true });

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to fetch employee payroll history"
        );
      }

      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching employee payroll history:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to fetch employee payroll history"
      );
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
  }): Promise<PayrollData> => {
    try {
      const endpoint = isSuperAdmin(data.userRole)
        ? `${SUPER_ADMIN_BASE_URL}/payroll/process-single-employee`
        : `${BASE_URL}/payroll/process-single`;

      const response = await axios.post(
        endpoint,
        {
          employeeId: data.employeeId,
          departmentId: data.departmentId,
          month: data.month,
          year: data.year,
          frequency: data.frequency,
          salaryGrade: data.salaryGrade,
        },
        {
          withCredentials: true,
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to process payroll");
      }

      // toast.success("Payroll processed successfully");
      return response.data.data;
    } catch (error: any) {
      console.error("Error in processSingleEmployeePayroll:", error);
      if (error.response?.data?.message?.includes("duplicate")) {
        toast.error(
          "A payroll for this employee already exists for this period"
        );
      } else {
        toast.error(
          error.response?.data?.message || "Failed to process payroll"
        );
      }
      throw error;
    }
  },

  // Process department payroll
  processDepartmentPayroll: async (
    data: {
      month: number;
      year: number;
      frequency: string;
    },
    userRole?: string
  ): Promise<any> => {
    try {
      // Use different endpoint for Super Admin
      const endpoint = isSuperAdmin(userRole)
        ? `${SUPER_ADMIN_BASE_URL}/payroll/process-department`
        : `${BASE_URL}/payroll/process-department`;

      console.log("Making request to:", endpoint); // Debug log
      const response = await axios.post(endpoint, data, {
        withCredentials: true,
      });

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

      console.log("Making request to:", endpoint);
      const response = await axios.post(endpoint, data, {
        withCredentials: true,
      });

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

      console.log("Making request to:", endpoint); // Debug log
      const response = await axios.post(endpoint, data, {
        withCredentials: true,
      });

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

      console.log("Making request to:", endpoint); // Debug log
      const response = await axios.post(endpoint, data, {
        withCredentials: true,
      });

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

      console.log("Making request to:", endpoint); // Debug log
      const response = await axios.post(endpoint, data, {
        withCredentials: true,
      });

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
  }): Promise<any> => {
    try {
      // Use different endpoint for Super Admin
      const endpoint = isSuperAdmin(data.userRole)
        ? `${SUPER_ADMIN_BASE_URL}/payroll/process-multiple`
        : `${BASE_URL}/payroll/process-multiple`;

      console.log("Making request to:", endpoint); // Debug log
      const response = await axios.post(endpoint, data, {
        withCredentials: true,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to process payroll");
      }

      // Remove toast from here - will be handled in the component
      return response.data.data;
    } catch (error: any) {
      console.error("Error processing multiple employees payroll:", error);
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

      console.log("Making request to:", endpoint); // Debug log
      const response = await axios.post(
        endpoint,
        {},
        { withCredentials: true }
      );

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

      console.log("Making request to:", url);
      console.log("User role:", userRole);
      console.log("Is super admin:", isSuperAdmin(userRole));

      const response = await axios.get(url, { withCredentials: true });
      console.log("API response:", response.data);

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
