import axios from "axios";
import { toast } from "react-toastify";
import type { ISalaryComponent, IAllowanceFilters } from "../types/payroll";

const BASE_URL = "/api";

interface CreateAllowanceRequest {
  name: string;
  type: "allowance" | "deduction";
  value: number;
  calculationMethod: "fixed" | "percentage";
  amount?: number;
  isActive?: boolean;
}

export const allowanceService = {
  createAllowance: async (
    data: Partial<CreateAllowanceRequest>
  ): Promise<{ data: ISalaryComponent }> => {
    try {
      const response = await axios.post(
        `${BASE_URL}/super-admin/allowances`,
        data
      );
      return response.data;
    } catch (error: any) {
      console.error("❌ Error creating allowance:", error);
      toast.error(
        error.response?.data?.message || "Failed to create allowance"
      );
      throw error;
    }
  },

  getAllAllowances: async (
    filters?: IAllowanceFilters
  ): Promise<{ data: ISalaryComponent[] }> => {
    try {
      const response = await axios.get(`${BASE_URL}/super-admin/allowances`, {
        params: filters,
      });
      return response.data;
    } catch (error: any) {
      console.error("❌ Error fetching allowances:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch allowances"
      );
      throw error;
    }
  },

  updateAllowance: async (
    id: string,
    data: Partial<CreateAllowanceRequest>
  ): Promise<{ data: ISalaryComponent }> => {
    try {
      const response = await axios.patch(
        `${BASE_URL}/super-admin/allowances/${id}`,
        data
      );
      return response.data;
    } catch (error: any) {
      console.error("❌ Error updating allowance:", error);
      toast.error(
        error.response?.data?.message || "Failed to update allowance"
      );
      throw error;
    }
  },

  toggleAllowanceStatus: async (
    id: string
  ): Promise<{ data: ISalaryComponent }> => {
    try {
      const response = await axios.patch(
        `${BASE_URL}/super-admin/allowances/${id}/toggle`
      );
      return response.data;
    } catch (error: any) {
      console.error("❌ Error toggling allowance:", error);
      toast.error(
        error.response?.data?.message || "Failed to toggle allowance"
      );
      throw error;
    }
  },

  deleteAllowance: async (id: string) => {
    try {
      const response = await axios.delete(
        `${BASE_URL}/super-admin/allowances/${id}`
      );
      return response.data;
    } catch (error: any) {
      console.error("❌ Error deleting allowance:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete allowance"
      );
      throw error;
    }
  },
};
