import axios from "axios";
import { toast } from "react-toastify";
import type {
  IPayroll,
  PayrollPeriod,
  PayrollCalculationRequest,
  IPayrollCalculationResult,
} from "../types/payroll";

const BASE_URL = "/api";

interface CreatePayrollData {
  employee: string;
  month: number;
  year: number;
  salaryGrade: string;
}

export const payrollService = {
  createPayroll: async (
    data: PayrollCalculationRequest
  ): Promise<IPayrollCalculationResult> => {
    try {
      const response = await axios.post(
        `${BASE_URL}/super-admin/payroll`,
        data
      );
      return response.data;
    } catch (error: any) {
      console.error("❌ Error creating payroll:", error);
      toast.error(error.response?.data?.message || "Failed to create payroll");
      throw error;
    }
  },

  deletePayroll: async (id: string) => {
    try {
      const response = await axios.delete(
        `${BASE_URL}/super-admin/payroll/${id}`
      );
      return response.data;
    } catch (error: any) {
      console.error("❌ Error deleting payroll:", error);
      toast.error(error.response?.data?.message || "Failed to delete payroll");
      throw error;
    }
  },

  getPayrollPeriods: async (): Promise<PayrollPeriod[]> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/super-admin/payroll/periods`
      );
      return response.data.data;
    } catch (error: any) {
      console.error("❌ Error fetching payroll periods:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch payroll periods"
      );
      throw error;
    }
  },
};
