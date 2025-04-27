import axios from "axios";
import { toast } from "react-toastify";
import type {
  IPayroll,
  PayrollPeriod,
  PayrollCalculationRequest,
  IPayrollCalculationResult,
  PayrollData,
  PayrollStats,
  PeriodPayrollResponse,
  PayrollResponse,
} from "../types/payroll";
import { salaryStructureService } from "./salaryStructureService";

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/super-admin`;

interface PayrollFilters {
  dateRange?: string;
  department?: string;
  frequency?: string;
  status?: string;
  month?: number;
  year?: number;
  employee?: string;
  page?: number;
  limit?: number;
}

export interface PayrollCounts {
  PENDING: number;
  APPROVED: number;
  REJECTED: number;
  total: number;
}

interface ApprovalResponse {
  success: boolean;
  message: string;
  data: IPayroll;
}

export const payrollService = {
  createPayroll: async (
    data: PayrollCalculationRequest
  ): Promise<IPayrollCalculationResult> => {
    try {
      console.log("=== 🚀 Creating Payroll ===");
      const response = await axios.post(`${BASE_URL}/payroll`, data);

      if (!response.data.success) {
        throw new Error("Failed to create payroll");
      }

      return response.data.data;
    } catch (error: unknown) {
      console.error("❌ Error creating payroll:", error);
      throw new Error("Failed to create payroll");
    }
  },

  updatePayroll: async (
    payrollId: string,
    data: {
      month: number;
      year: number;
      employee: string;
      salaryGrade: string;
    }
  ): Promise<IPayroll> => {
    try {
      console.log("=== 🔄 Updating Payroll ===");
      const response = await axios.patch(
        `${BASE_URL}/payroll/${payrollId}`,
        data
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to update payroll");
      }

      return response.data.data;
    } catch (error: unknown) {
      console.error("❌ Error updating payroll:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to update payroll";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  deletePayroll: async (payrollId: string): Promise<void> => {
    try {
      const response = await axios.delete(`${BASE_URL}/payroll/${payrollId}`);
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to delete payroll");
      }
      toast.success("Payroll deleted successfully");
    } catch (error: unknown) {
      console.error("❌ Error deleting payroll:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to delete payroll";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Payroll Status Management
  submitPayroll: async (payrollId: string): Promise<IPayroll> => {
    try {
      const response = await axios.patch(
        `${BASE_URL}/payroll/${payrollId}/submit`
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to submit payroll for approval"
        );
      }

      return response.data.data;
    } catch (error) {
      console.error("❌ Error submitting payroll for approval:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to submit payroll for approval";
      throw new Error(errorMessage);
    }
  },

  approvePayroll: async (
    payrollId: string,
    remarks?: string
  ): Promise<ApprovalResponse> => {
    const response = await axios.patch(
      `https://payrollapi.digitalentshub.net/api/approvals/super-admin/${payrollId}/approve`,
      { remarks },
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data;
  },

  rejectPayroll: async (
    payrollId: string,
    remarks: string
  ): Promise<ApprovalResponse> => {
    try {
      const response = await axios.patch(
        `${BASE_URL}/payroll/${payrollId}/reject`,
        { remarks },
        { headers: { "Content-Type": "application/json" } }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to reject payroll");
      }

      toast.success("Payroll rejected successfully");
      return response.data;
    } catch (error) {
      console.error("❌ Error rejecting payroll:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to reject payroll";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  updatePayrollStatus: async (
    payrollId: string,
    status: string,
    remarks?: string
  ): Promise<IPayroll> => {
    try {
      const response = await axios.patch(
        `${BASE_URL}/payroll/${payrollId}/status`,
        { status, remarks },
        { headers: { "Content-Type": "application/json" } }
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to update payroll status"
        );
      }

      toast.success(`Payroll status updated to ${status}`);
      return response.data.data;
    } catch (error) {
      console.error("❌ Error updating payroll status:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to update payroll status";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Payroll Queries
  getAllPayrolls: async (
    filters?: PayrollFilters
  ): Promise<PayrollResponse> => {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== "all") {
            params.append(key, value.toString());
          }
        });
      }

      const response = await axios.get(`${BASE_URL}/payroll?${params}`);
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch payrolls");
      }

      return response.data;
    } catch (error) {
      console.error("❌ Error fetching payrolls:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to fetch payrolls";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  getPayrollById: async (payrollId: string): Promise<PayrollData> => {
    try {
      const response = await axios.get(`${BASE_URL}/payroll/${payrollId}`);
      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to fetch payroll details"
        );
      }
      return response.data.data;
    } catch (error) {
      console.error("❌ Error fetching payroll details:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to fetch payroll details";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Period Management
  getPayrollPeriods: async (): Promise<PayrollPeriod[]> => {
    try {
      const response = await axios.get(`${BASE_URL}/payroll/periods`);
      if (!response.data.success) {
        throw new Error("Failed to fetch payroll periods");
      }
      return response.data.data;
    } catch (error) {
      console.error("❌ Error fetching payroll periods:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to fetch payroll periods";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  getPeriodPayroll: async (
    month: number,
    year: number
  ): Promise<PeriodPayrollResponse> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/payroll/period/${month}/${year}`
      );
      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to fetch period payroll data"
        );
      }
      return response.data.data;
    } catch (error) {
      console.error("❌ Error fetching period payroll data:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to fetch period payroll data";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Statistics and Counts
  getPayrollStats: async (): Promise<PayrollStats> => {
    try {
      const response = await axios.get(`${BASE_URL}/payroll/stats`);
      if (!response.data.success) {
        throw new Error("Failed to fetch payroll stats");
      }
      return response.data.data;
    } catch (error) {
      console.error("❌ Error fetching payroll stats:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to fetch payroll stats";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  getPayrollCounts: async (
    filters?: PayrollFilters
  ): Promise<PayrollCounts> => {
    try {
      const queryString = filters
        ? `?${new URLSearchParams(filters as Record<string, string>)}`
        : "";
      const response = await axios.get(
        `${BASE_URL}/payroll/counts${queryString}`
      );
      if (!response.data.success) {
        throw new Error("Failed to fetch payroll counts");
      }
      return response.data.data;
    } catch (error) {
      console.error("❌ Error fetching payroll counts:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to fetch payroll counts";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Employee Payroll History
  getEmployeePayrollHistory: async (employeeId: string) => {
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
    } catch (error) {
      console.error("❌ Error fetching employee payroll history:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to fetch employee payroll history";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Payslip Management
  viewPayslip: async (payrollId: string) => {
    try {
      const response = await axios.get(`${BASE_URL}/payroll/${payrollId}/view`);
      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to fetch payslip details"
        );
      }
      return response.data.data;
    } catch (error) {
      console.error("❌ Error fetching payslip details:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to fetch payslip details";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Add new method for payment processing
  processPayment: async (payrollId: string) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/payroll/${payrollId}/process-payment`
      );
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to process payment");
      }
      toast.success("Payment processing initiated successfully");
      return response.data.data;
    } catch (error) {
      console.error("❌ Error processing payment:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to process payment";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  initiatePayment: async (payrollId: string) => {
    try {
      const response = await axios.patch(
        `${BASE_URL}/payroll/${payrollId}/initiate-payment`
      );
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to initiate payment");
      }
      return response.data.data;
    } catch (error) {
      console.error("❌ Error initiating payment:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to initiate payment";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Pending Payrolls
  getPendingPayrolls: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/payroll/pending`);
      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to fetch pending payrolls"
        );
      }
      return response.data.data;
    } catch (error) {
      console.error("❌ Error fetching pending payrolls:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to fetch pending payrolls";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Filtered Payrolls
  getFilteredPayrolls: async (filters: PayrollFilters) => {
    try {
      console.log("🔍 Fetching filtered payrolls with filters:", filters);
      const params = new URLSearchParams();

      // Add filters to params if they exist
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });

      const response = await axios.get(
        `${BASE_URL}/payroll/filtered?${params}`
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to fetch filtered payrolls"
        );
      }

      return {
        data: response.data.data,
        count: response.data.count,
      };
    } catch (error) {
      console.error("❌ Error fetching filtered payrolls:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to fetch filtered payrolls";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  getSalaryGrades: async () => {
    return salaryStructureService.getAllSalaryGrades();
  },

  // Add new method for sending payslip email
  sendPayslipEmail: async (payslipId: string): Promise<boolean> => {
    try {
      const response = await axios.post(
        `${BASE_URL}/payroll/${payslipId}/email`,
        {},
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        toast.success("Payslip sent successfully");
        return true;
      } else {
        throw new Error(response.data.message || "Failed to send payslip");
      }
    } catch (error) {
      console.error("❌ Error sending payslip:", error);
      toast.error("Failed to send payslip");
      return false;
    }
  },

  async getProcessingStatistics() {
    try {
      const response = await axios.get(
        `${BASE_URL}/payroll/processing-statistics`
      );
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(
        response.data.message || "Failed to get processing statistics"
      );
    } catch (error) {
      console.error("Error getting processing statistics:", error);
      throw error;
    }
  },

  markAsPaid: async (payrollId: string) => {
    try {
      const response = await axios.patch(
        `${BASE_URL}/payroll/${payrollId}/mark-paid`
      );
      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to mark payment as completed"
        );
      }
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to mark payment as completed"
      );
    }
  },

  markAsFailed: async (payrollId: string) => {
    try {
      const response = await axios.patch(
        `${BASE_URL}/payroll/${payrollId}/mark-failed`
      );
      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to mark payment as failed"
        );
      }
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to mark payment as failed"
      );
    }
  },

  markPaymentsPaidBatch: async (data: { payrollIds: string[] }) => {
    const response = await axios.post(
      `${BASE_URL}/payroll/mark-paid-batch`,
      data
    );
    return response.data;
  },
};
