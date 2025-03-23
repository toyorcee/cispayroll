import axios from "axios";
import { toast } from "react-toastify";
import type {
  IPayroll,
  PayrollPeriod,
  PayrollCalculationRequest,
  IPayrollCalculationResult,
  ISalaryGrade,
} from "../types/payroll";

const BASE_URL = "/api/super-admin";

export const payrollService = {
  // Calculate Payroll
  calculatePayroll: async (
    data: PayrollCalculationRequest
  ): Promise<IPayrollCalculationResult> => {
    try {
      console.log("🧮 Calculating payroll with data:", data);
      const response = await axios.post(`${BASE_URL}/payroll`, data);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to calculate payroll");
      }

      console.log("✅ Payroll calculation result:", response.data);
      return response.data.data;
    } catch (error: any) {
      console.error("❌ Error calculating payroll:", error);
      toast.error(
        error.response?.data?.message || "Failed to calculate payroll"
      );
      throw error;
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
    } catch (error: any) {
      console.error("❌ Error fetching salary grades:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch salary grades"
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
    } catch (error: any) {
      console.error("❌ Error fetching salary grade:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch salary grade"
      );
      throw error;
    }
  },

  // Get Payroll Periods
  getPayrollPeriods: async (): Promise<PayrollPeriod[]> => {
    try {
      console.log("🔄 Fetching payroll periods...");
      const response = await axios.get(`${BASE_URL}/payroll/periods`);

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to fetch payroll periods"
        );
      }

      return response.data.data;
    } catch (error: any) {
      console.error("❌ Error fetching payroll periods:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch payroll periods"
      );
      throw error;
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
    } catch (error: any) {
      console.error("❌ Error processing payroll:", error);
      toast.error(error.response?.data?.message || "Failed to process payroll");
      throw error;
    }
  },

  // Delete Payroll
  deletePayroll: async (id: string): Promise<void> => {
    try {
      console.log("🗑️ Deleting payroll:", id);
      const response = await axios.delete(`${BASE_URL}/payroll/${id}`);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to delete payroll");
      }

      toast.success("Payroll deleted successfully");
    } catch (error: any) {
      console.error("❌ Error deleting payroll:", error);
      toast.error(error.response?.data?.message || "Failed to delete payroll");
      throw error;
    }
  },

  // Get Payroll Statistics
  getPayrollStats: async () => {
    try {
      console.log("📊 Fetching payroll statistics...");
      const response = await axios.get(`${BASE_URL}/payroll/stats`);

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to fetch payroll statistics"
        );
      }

      return response.data.data;
    } catch (error: any) {
      console.error("❌ Error fetching payroll statistics:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch payroll statistics"
      );
      throw error;
    }
  },
};
