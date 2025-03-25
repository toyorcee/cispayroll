import type {
  IPayroll,
  PayrollPeriod,
  PayrollCalculationRequest,
  IPayrollCalculationResult,
  ISalaryGrade,
  PayrollData,
  PayrollStats,
  PeriodPayrollResponse,
} from "../types/payroll";
import { api, handleApiResponse, handleApiError } from "../config/api";

// Define specific error types for payroll operations
interface PayrollError extends Error {
  code?: string;
  status?: number;
}

export const payrollService = {
  // Calculate Payroll
  calculatePayroll: async (
    data: PayrollCalculationRequest
  ): Promise<IPayrollCalculationResult> => {
    try {
      const response = await api.post("/super-admin/payroll", data);
      return handleApiResponse<IPayrollCalculationResult>(response);
    } catch (error) {
      const err = handleApiError(error) as PayrollError;
      if (err.status === 400) {
        throw new Error("Invalid payroll calculation data provided");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to calculate payroll");
      }
      throw err;
    }
  },

  // Get Salary Grades
  getSalaryGrades: async (): Promise<ISalaryGrade[]> => {
    try {
      const response = await api.get("/super-admin/salary-grades");
      return handleApiResponse<ISalaryGrade[]>(response);
    } catch (error) {
      const err = handleApiError(error) as PayrollError;
      if (err.status === 403) {
        throw new Error("You don't have permission to view salary grades");
      }
      throw err;
    }
  },

  // Get Single Salary Grade
  getSalaryGrade: async (id: string): Promise<ISalaryGrade> => {
    try {
      const response = await api.get(`/super-admin/salary-grades/${id}`);
      return handleApiResponse<ISalaryGrade>(response);
    } catch (error) {
      const err = handleApiError(error) as PayrollError;
      if (err.status === 404) {
        throw new Error("Salary grade not found");
      }
      if (err.status === 403) {
        throw new Error(
          "You don't have permission to view salary grade details"
        );
      }
      throw err;
    }
  },

  // Get Payroll Periods
  getPayrollPeriods: async (): Promise<PayrollPeriod[]> => {
    try {
      const response = await api.get("/super-admin/payroll/periods");
      return handleApiResponse<PayrollPeriod[]>(response);
    } catch (error) {
      const err = handleApiError(error) as PayrollError;
      if (err.status === 403) {
        throw new Error("You don't have permission to view payroll periods");
      }
      throw err;
    }
  },

  // Process Payroll
  processPayroll: async (
    data: PayrollCalculationRequest
  ): Promise<IPayroll> => {
    try {
      const response = await api.post("/super-admin/payroll/process", data);
      return handleApiResponse<IPayroll>(response);
    } catch (error) {
      const err = handleApiError(error) as PayrollError;
      if (err.status === 400) {
        throw new Error("Invalid payroll processing data provided");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to process payroll");
      }
      if (err.status === 409) {
        throw new Error("Payroll for this period has already been processed");
      }
      throw err;
    }
  },

  // Delete payroll
  deletePayroll: async (payrollId: string): Promise<void> => {
    try {
      await api.delete(`/super-admin/payroll/${payrollId}`);
    } catch (error) {
      const err = handleApiError(error) as PayrollError;
      if (err.status === 404) {
        throw new Error("Payroll not found");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to delete payroll");
      }
      if (err.status === 400) {
        throw new Error("Cannot delete processed payroll");
      }
      throw err;
    }
  },

  // Get Payroll Statistics
  getPayrollStats: async (): Promise<PayrollStats> => {
    try {
      const response = await api.get("/super-admin/payroll/stats");
      return handleApiResponse<PayrollStats>(response);
    } catch (error) {
      const err = handleApiError(error) as PayrollError;
      if (err.status === 403) {
        throw new Error("You don't have permission to view payroll statistics");
      }
      throw err;
    }
  },

  // Get Individual Payroll by ID
  getPayrollById: async (id: string): Promise<PayrollData> => {
    try {
      const response = await api.get(`/super-admin/payroll/${id}`);
      return handleApiResponse<PayrollData>(response);
    } catch (error) {
      const err = handleApiError(error) as PayrollError;
      if (err.status === 404) {
        throw new Error("Payroll not found");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to view payroll details");
      }
      throw err;
    }
  },

  // Create new payroll
  createPayroll: async (
    data: PayrollCalculationRequest
  ): Promise<IPayrollCalculationResult> => {
    try {
      const response = await api.post("/super-admin/payroll", data);
      return handleApiResponse<IPayrollCalculationResult>(response);
    } catch (error) {
      const err = handleApiError(error) as PayrollError;
      if (err.status === 400) {
        throw new Error("Invalid payroll data provided");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to create payroll");
      }
      if (err.status === 409) {
        throw new Error("Payroll for this period already exists");
      }
      throw err;
    }
  },

  // Get Employee Payroll History
  getEmployeePayrollHistory: async (
    employeeId: string
  ): Promise<IPayroll[]> => {
    try {
      const response = await api.get(
        `/super-admin/payroll/employee/${employeeId}/history`
      );
      return handleApiResponse<IPayroll[]>(response);
    } catch (error) {
      const err = handleApiError(error) as PayrollError;
      if (err.status === 404) {
        throw new Error("Employee not found");
      }
      if (err.status === 403) {
        throw new Error(
          "You don't have permission to view employee payroll history"
        );
      }
      throw err;
    }
  },

  // Get Payroll Period Details
  getPeriodPayroll: async (
    month: number,
    year: number
  ): Promise<PeriodPayrollResponse> => {
    try {
      const response = await api.get(
        `/super-admin/payroll/period/${month}/${year}`
      );
      return handleApiResponse<PeriodPayrollResponse>(response);
    } catch (error) {
      const err = handleApiError(error) as PayrollError;
      if (err.status === 404) {
        throw new Error("No payroll data found for this period");
      }
      if (err.status === 403) {
        throw new Error(
          "You don't have permission to view period payroll data"
        );
      }
      throw err;
    }
  },

  // View Payslip
  viewPayslip: async (payrollId: string): Promise<PayrollData> => {
    try {
      const response = await api.get(`/super-admin/payroll/${payrollId}/view`);
      return handleApiResponse<PayrollData>(response);
    } catch (error) {
      const err = handleApiError(error) as PayrollError;
      if (err.status === 404) {
        throw new Error("Payslip not found");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to view payslip");
      }
      throw err;
    }
  },
};
