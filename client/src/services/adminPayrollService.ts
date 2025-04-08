import axios from "axios";
import { toast } from "react-toastify";
import { PayrollData, PayrollResponse } from "../types/payroll";

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

// Admin payroll service
export const adminPayrollService = {
  // Get all payrolls for admin's department
  getDepartmentPayrolls: async (params?: {
    page?: number;
    limit?: number;
    month?: number;
    year?: number;
    status?: string;
  }): Promise<AdminPayrollResponse> => {
    try {
      console.log("Making request to:", `${BASE_URL}/payroll`); // Debug log
      const response = await axios.get(`${BASE_URL}/payroll`, {
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
  getPayrollStats: async (): Promise<AdminPayrollStats> => {
    try {
      const response = await axios.get(`${BASE_URL}/payroll/stats`);

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
  getPayrollPeriods: async (): Promise<AdminPayrollPeriod[]> => {
    try {
      const response = await axios.get(`${BASE_URL}/payroll/periods`);

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
  getPayrollById: async (payrollId: string): Promise<AdminPayroll> => {
    try {
      const response = await axios.get(`${BASE_URL}/payroll/${payrollId}`);

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to fetch payroll details"
        );
      }

      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching payroll details:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch payroll details"
      );
      throw error;
    }
  },

  // Submit payroll for approval
  submitPayroll: async (
    payrollId: string,
    remarks?: string
  ): Promise<AdminPayroll> => {
    try {
      const response = await axios.patch(
        `${BASE_URL}/payroll/${payrollId}/submit`,
        { remarks }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to submit payroll");
      }

      toast.success("Payroll submitted successfully");
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
    remarks?: string
  ): Promise<AdminPayroll> => {
    try {
      const response = await axios.patch(
        `${BASE_URL}/payroll/${payrollId}/approve`,
        { remarks }
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
  rejectPayroll: async (
    payrollId: string,
    remarks: string
  ): Promise<AdminPayroll> => {
    try {
      const response = await axios.patch(
        `${BASE_URL}/payroll/${payrollId}/reject`,
        { remarks }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to reject payroll");
      }

      toast.success("Payroll rejected successfully");
      return response.data.data;
    } catch (error: any) {
      console.error("Error rejecting payroll:", error);
      toast.error(error.response?.data?.message || "Failed to reject payroll");
      throw error;
    }
  },

  // Process payment
  processPayment: async (payrollId: string): Promise<AdminPayroll> => {
    try {
      const response = await axios.patch(
        `${BASE_URL}/payroll/${payrollId}/process`
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
    employeeId: string
  ): Promise<AdminPayroll[]> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/payroll/employee/${employeeId}/history`
      );

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
    month: number;
    year: number;
    frequency: string;
    salaryGrade?: string;
  }): Promise<PayrollData> => {
    try {
      const response = await axios.post(
        `${BASE_URL}/payroll/process-single`,
        data,
        { withCredentials: true }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to process payroll");
      }

      // Remove toast from here - will be handled in the component
      return response.data.data;
    } catch (error: any) {
      console.error("Error in processSingleEmployeePayroll:", error);

      // Check for duplicate payroll error
      if (error.response?.data?.message?.includes("already exists")) {
        throw new Error(
          "A payroll record already exists for this employee and period"
        );
      }

      // Check for calculation error
      if (
        error.response?.data?.message?.includes("Failed to calculate payroll")
      ) {
        throw new Error(error.response.data.message);
      }

      // Handle other errors
      throw new Error(
        error.response?.data?.message || "Failed to process payroll"
      );
    }
  },

  // Process department payroll
  processDepartmentPayroll: async (data: {
    month: number;
    year: number;
    frequency: string;
  }): Promise<PayrollData[]> => {
    try {
      const response = await axios.post(
        `${BASE_URL}/payroll/process-department`,
        data,
        { withCredentials: true }
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to process department payroll"
        );
      }

      toast.success("Department payroll processed successfully");
      return response.data.data;
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to process department payroll"
      );
      throw error;
    }
  },

  // Submit department payrolls
  submitDepartmentPayrolls: async (data: {
    month: number;
    year: number;
    remarks?: string;
  }): Promise<PayrollData[]> => {
    try {
      const response = await axios.post(
        `${BASE_URL}/payroll/submit-department`,
        data,
        { withCredentials: true }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to submit payrolls");
      }

      toast.success("Department payrolls submitted successfully");
      return response.data.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit payrolls");
      throw error;
    }
  },

  // Bulk approve department payrolls
  approveDepartmentPayrolls: async (data: {
    month: number;
    year: number;
    remarks?: string;
  }): Promise<PayrollData[]> => {
    try {
      const response = await axios.post(
        `${BASE_URL}/payroll/approve-department`,
        data,
        { withCredentials: true }
      );

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
  rejectDepartmentPayrolls: async (data: {
    month: number;
    year: number;
    remarks: string;
  }): Promise<PayrollData[]> => {
    try {
      const response = await axios.post(
        `${BASE_URL}/payroll/reject-department`,
        data,
        { withCredentials: true }
      );

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
  }): Promise<any> => {
    try {
      const response = await axios.post(
        `${BASE_URL}/payroll/process-multiple`,
        data,
        { withCredentials: true }
      );

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
};
