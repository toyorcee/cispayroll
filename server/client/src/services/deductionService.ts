import axios from "axios";
import { toast } from "react-toastify";
import { Deduction, CalculationMethod } from "../types/deduction";

const BASE_URL = "http://localhost:5000/api";

// Set default axios config
axios.defaults.withCredentials = true;

// Input types
interface CreateVoluntaryDeductionInput {
  name: string;
  description?: string;
  calculationMethod: CalculationMethod;
  value: number;
  effectiveDate?: Date;
}

interface UpdateDeductionInput {
  name?: string;
  description?: string;
  calculationMethod?: CalculationMethod;
  value?: number;
  effectiveDate?: Date;
}

interface DeductionsResponse {
  statutory: Deduction[];
  voluntary: Deduction[];
}

export const deductionService = {
  getAllDeductions: async (): Promise<DeductionsResponse> => {
    try {
      const response = await axios.get<{ data: DeductionsResponse }>(
        `${BASE_URL}/super-admin/deductions`
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Failed to fetch deductions:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch deductions"
      );
      throw error;
    }
  },

  setupStatutoryDeductions: async (): Promise<void> => {
    try {
      await axios.post(`${BASE_URL}/super-admin/deductions/statutory/setup`);
      toast.success("Statutory deductions set up successfully");
    } catch (error: any) {
      console.error("Failed to setup statutory deductions:", error);
      toast.error(
        error.response?.data?.message || "Failed to setup statutory deductions"
      );
      throw error;
    }
  },

  createVoluntaryDeduction: async (
    data: CreateVoluntaryDeductionInput
  ): Promise<Deduction> => {
    try {
      console.log("📤 Creating voluntary deduction:", data);
      const response = await axios.post<{ data: Deduction }>(
        `${BASE_URL}/super-admin/deductions/voluntary`,
        data
      );
      toast.success("Voluntary deduction created successfully");
      return response.data.data;
    } catch (error: any) {
      console.error("❌ Failed to create voluntary deduction:", error);
      toast.error(
        error.response?.data?.message || "Failed to create voluntary deduction"
      );
      throw error;
    }
  },

  updateDeduction: async (
    id: string,
    data: UpdateDeductionInput
  ): Promise<Deduction> => {
    try {
      console.log("📤 Updating deduction:", { id, data });
      const response = await axios.patch<{ data: Deduction }>(
        `${BASE_URL}/super-admin/deductions/${id}`,
        data
      );
      toast.success("Deduction updated successfully");
      return response.data.data;
    } catch (error: any) {
      console.error("❌ Update failed:", error);
      toast.error(
        error.response?.data?.message || "Failed to update deduction"
      );
      throw error;
    }
  },

  toggleDeductionStatus: async (id: string): Promise<Deduction> => {
    try {
      const response = await axios.patch<{ data: Deduction }>(
        `${BASE_URL}/super-admin/deductions/${id}/toggle`
      );
      toast.success("Deduction status updated successfully");
      return response.data.data;
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to toggle deduction status"
      );
      throw error;
    }
  },

  deleteDeduction: async (id: string): Promise<void> => {
    try {
      await axios.delete(`${BASE_URL}/super-admin/deductions/${id}`);
      toast.success("Deduction deleted successfully");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to delete deduction"
      );
      throw error;
    }
  },

  // Helper function to calculate deduction amount
  calculateDeductionAmount: (amount: number, deduction: Deduction): number => {
    if (deduction.calculationMethod === CalculationMethod.FIXED) {
      return deduction.value;
    } else if (deduction.calculationMethod === CalculationMethod.PERCENTAGE) {
      return (amount * deduction.value) / 100;
    }
    return 0;
  },
};
