import axios from "axios";
import { toast } from "react-toastify";
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

const BASE_URL = "/api/super-admin";

export interface PayrollCounts {
  PENDING: number;
  APPROVED: number;
  REJECTED: number;
  total: number;
}

interface PayrollFilters {
  dateRange?: string;
  department?: string;
  frequency?: string;
  status?: string;
  month?: number;
  year?: number;
}

interface ApprovalResponse {
  success: boolean;
  message: string;
  data: IPayroll;
}

export const payrollService = {
  calculatePayroll: async (
    data: PayrollCalculationRequest
  ): Promise<IPayrollCalculationResult> => {
    try {
      console.log("=== 🧮 CALCULATING PAYROLL ===");
      console.log("📝 Request Data:", data);
  
      const response = await axios.post(`${BASE_URL}/payroll`, data);
  
      if (!response.data) {
        throw new Error("No data received from server");
      }
  
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to calculate payroll");
      }
  
      console.log("✅ Calculation successful:", response.data.data);
      return response.data.data;
    } catch (error: unknown) {
      console.error("=== ❌ PAYROLL SERVICE ERROR ===");
      console.error("Original Request: ", data);
  
      if (axios.isAxiosError(error) && error.response) {
        // Server responded with error
        console.error("Server Error:", error.response.data);
        throw new Error(error.response.data.message || "Server error occurred");
      } else if (axios.isAxiosError(error) && error.request) {
        // Request made but no response
        console.error("No response received");
        throw new Error("No response from server");
      } else if (error instanceof Error) {
        // Other errors
        console.error("Error:", error.message);
        throw error;
      } else {
        throw new Error("An unknown error occurred");
      }
    }
  },

  // Get Salary Grades
  getSalaryGrades: async (): Promise<ISalaryGrade[]> => {
    try {
      console.log("🔄 Fetching salary grades...");
      const response = await axios.get(`${BASE_URL}/salary-grades`);

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to fetch salary grades"
        );
      }

      console.log("✅ Salary grades fetched:", response.data);
      return response.data.data;
    } catch (error: unknown) {
      console.error("❌ Error fetching salary grades:", error);
      toast.error(
        (error as unknown as { response?: { data?: { message?: string } } })
          ?.response?.data?.message || "Failed to fetch salary grades"
      );
      throw error;
    }
  },

  // Get Single Salary Grade
  getSalaryGrade: async (id: string): Promise<ISalaryGrade> => {
    try {
      console.log("🔄 Fetching salary grade:", id);
      const response = await axios.get(`${BASE_URL}/salary-grades/${id}`);

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to fetch salary grade"
        );
      }

      return response.data.data;
    } catch (error: unknown) {
      console.error("❌ Error fetching salary grade:", error);
      toast.error(
        ((error as { response?: { data?: { message?: string } } })?.response?.data?.message) || "Failed to fetch salary grade"
      );
      throw error;
    }
  },

  // Get Payroll Periods with proper error handling
  getPayrollPeriods: async (): Promise<PayrollPeriod[]> => {
    try {
      console.log("🔄 Fetching payroll periods...");
      const response = await axios.get(`${BASE_URL}/payroll/periods`);

      if (!response.data.success) {
        throw new Error("Failed to fetch payroll periods");
      }

      // Extract the data array from the response
      const periodsData = response.data.data;
      console.log("Payroll periods response:", periodsData);
      return periodsData;
    } catch (error) {
      console.error("Error fetching payroll periods:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to fetch payroll periods"
      );
    }
  },

  // Process Payroll
  processPayroll: async (
    data: PayrollCalculationRequest
  ): Promise<IPayroll> => {
    try {
      console.log("🔄 Processing payroll...", data);
      const response = await axios.post(`${BASE_URL}/payroll/process`, data);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to process payroll");
      }

      console.log("✅ Payroll processed:", response.data);
      return response.data.data;
    } catch (error: unknown) {
      console.error("❌ Error processing payroll:", error);
      if ((error as { response?: { data?: { message?: string } } })?.response?.data?.message) {
        toast.error((error as { response: { data: { message: string } } }).response.data.message);
      } else {
        toast.error("Failed to process payroll");
      }
      throw error;
    }
  },

  // Delete payroll
  deletePayroll: async (payrollId: string) => {
    try {
      const response = await axios.delete(`${BASE_URL}/payroll/${payrollId}`);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to delete payroll");
      }

      toast.success("Payroll deleted successfully");
      return response.data;
    } catch (error: unknown) {
      console.error("❌ Error deleting payroll:", error);
      if ((error as { response?: { data?: { message?: string } } })?.response?.data?.message) {
        toast.error(
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to delete payroll"
        );
      } else {
        toast.error("Failed to delete payroll");
      }
      throw error;
    }
  },

  // Get Payroll Statistics with proper error handling
  getPayrollStats: async (): Promise<PayrollStats> => {
    try {
      console.log("📊 Fetching payroll statistics...");
      const response = await axios.get(`${BASE_URL}/payroll/stats`);

      if (!response.data.success) {
        throw new Error("Failed to fetch payroll stats");
      }

      // Extract the data from the response
      const statsData = response.data.data;
      console.log("Payroll stats response:", statsData);
      return statsData;
    } catch (error) {
      console.error("Error fetching payroll stats:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to fetch payroll stats"
      );
    }
  },

  // Get Individual Payroll by ID
  getPayrollById: async (id: string): Promise<PayrollData> => {
    try {
      console.log("🔄 Fetching payroll details:", id);
      const response = await axios.get(`${BASE_URL}/payroll/${id}`);

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to fetch payroll details"
        );
      }

      console.log("✅ Payroll details fetched:", response.data.data);
      return response.data.data;
    } catch (error: unknown) {
      console.error("❌ Error fetching payroll details:", error);
      toast.error(
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to fetch payroll details"
      );
      throw error;
    }
  },

  // Create new payroll
  createPayroll: async (
    data: PayrollCalculationRequest
  ): Promise<IPayrollCalculationResult> => {
    try {
      console.log("=== 🚀 PAYROLL SERVICE START ===");
      console.log("📝 Request Data:", {
        employee: data.employee,
        month: data.month,
        year: data.year,
        salaryGrade: data.salaryGrade,
      });

      const response = await axios.post(`${BASE_URL}/payroll`, data);

      if (!response.data) {
        console.error("❌ No data in response");
        throw new Error("No data received from server");
      }

      if (!response.data.success) {
        console.error("❌ Server reported failure:", response.data.message);
        throw new Error(response.data.message || "Failed to create payroll");
      }

      // toast.success("Payroll created successfully");
      return response.data.data;
    } catch (error: unknown) {
      console.error("=== ❌ PAYROLL SERVICE ERROR ===");
      console.error("Original Request:", data);

      if ((error as { response?: { data?: { message?: string } } }).response) {
        console.error("Server Error Response:", {
          status: (error as { response?: { status?: number } }).response?.status,
          data: (error as { response: { data: { message?: string; [key: string]: unknown } } }).response.data,
        });
      } else if ((error as { request?: unknown }).request) {
        if ((error as { request?: unknown }).request) {
          console.error("No Response Received:", (error as { request: unknown }).request);
        }
      } else {
        console.error("Error Details:", error);
      }

      const errorMessage =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to create payroll";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      console.log("=== 🏁 PAYROLL SERVICE END ===");
    }
  },

  // Get Employee Payroll History
  getEmployeePayrollHistory: async (employeeId: string) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/payroll/employee/${employeeId}/history`
      );
      if (!response.data.success) {
        throw new Error("Failed to fetch employee payroll history");
      }
      console.log("response history", response);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching employee payroll history:", error);
      throw error;
    }
  },

  // Get Payroll Period Details
  getPeriodPayroll: async (
    month: number,
    year: number
  ): Promise<PeriodPayrollResponse> => {
    try {
      console.log(`🔄 Fetching payroll data for period: ${month}/${year}`);
      const response = await axios.get(
        `${BASE_URL}/payroll/period/${month}/${year}`
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to fetch period payroll data"
        );
      }

      console.log("✅ Period payroll data fetched:", response.data.data);
      return response.data.data;
    } catch (error: unknown) {
      console.error("❌ Error fetching period payroll data:", error);
      toast.error(
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to fetch period payroll data"
      );
      throw error;
    }
  },

  // View Payslip
  viewPayslip: async (payrollId: string) => {
    try {
      console.log("🔍 Fetching payslip details:", payrollId);
      const response = await axios.get(`${BASE_URL}/payroll/${payrollId}/view`);

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to fetch payslip details"
        );
      }

      console.log("✅ Payslip details fetched:", response.data.data);
      return response.data.data;
    } catch (error: unknown) {
      console.error("❌ Error fetching payslip details:", error);
      toast.error(
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to fetch payslip details"
      );
      throw error;
    }
  },

  getPendingPayrolls: async () => {
    const response = await axios.get("/api/super-admin/payroll/pending");
    return response.data;
  },

  getAllPayrolls: async (filters?: PayrollFilters) => {
    console.log("🔍 Applying filters:", filters);
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") {
          params.append(key, value.toString());
        }
      });
    }

    const url = `/api/super-admin/payroll${
      params.toString() ? `?${params}` : ""
    }`;
    console.log("🔍 Request URL:", url);

    const response = await axios.get(url);
    console.log("📊 Payrolls response:", response.data);
    return response.data;
  },

  approvePayroll: async (
    payrollId: string,
    remarks?: string
  ): Promise<ApprovalResponse> => {
    try {
      console.log("Approving payroll:", { payrollId, remarks });

      const response = await axios.patch(
        `${BASE_URL}/payroll/${payrollId}/approve`,
        { remarks },
        { headers: { "Content-Type": "application/json" } }
      );

      const data = response.data.data;
      console.log("Approve response:", data);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to approve payroll");
      }

      return data;
    } catch (error) {
      console.error("Approve payroll error:", error);
      throw error;
    }
  },

  rejectPayroll: async (
    payrollId: string,
    remarks: string
  ): Promise<ApprovalResponse> => {
    const response = await axios.patch(
      `${BASE_URL}/payroll/${payrollId}/reject`,
      { remarks },
      { headers: { "Content-Type": "application/json" } }
    );
  
    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to reject payroll");
    }
  
    return response.data.data;
  },

  getPayrollCounts: async (
    filters?: PayrollFilters
  ): Promise<PayrollCounts> => {
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
  },
};

export interface PayrollCounts {
  PENDING: number;
  APPROVED: number;
  REJECTED: number;
  total: number;
}
