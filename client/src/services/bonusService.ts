import axios from "axios";
import { toast } from "react-toastify";
import type { IBonus, BonusType, IBonusFilters } from "../types/payroll";

const BASE_URL = "/api";

interface BonusFilters {
  employee?: string;
  department?: string;
  status?: string;
  type?: BonusType;
}

interface CreateBonusData {
  employee: string;
  type: BonusType;
  amount: number;
  description?: string;
  department?: string;
  paymentDate: Date;
}

export const bonusService = {
  createBonus: async (data: Partial<IBonus>): Promise<{ data: IBonus }> => {
    try {
      const response = await axios.post(
        `${BASE_URL}/super-admin/bonuses`,
        data
      );
      return response.data;
    } catch (error: any) {
      console.error("❌ Error creating bonus:", error);
      toast.error(error.response?.data?.message || "Failed to create bonus");
      throw error;
    }
  },

  getAllBonuses: async (
    filters?: IBonusFilters
  ): Promise<{ data: IBonus[] }> => {
    try {
      const response = await axios.get(`${BASE_URL}/super-admin/bonuses`, {
        params: filters,
      });
      return response.data;
    } catch (error: any) {
      console.error("❌ Error fetching bonuses:", error);
      toast.error(error.response?.data?.message || "Failed to fetch bonuses");
      throw error;
    }
  },

  updateBonus: async (
    id: string,
    data: Partial<CreateBonusData>
  ): Promise<{ data: IBonus }> => {
    try {
      const response = await axios.patch(
        `${BASE_URL}/super-admin/bonuses/${id}`,
        data
      );
      return response.data;
    } catch (error: any) {
      console.error("❌ Error updating bonus:", error);
      toast.error(error.response?.data?.message || "Failed to update bonus");
      throw error;
    }
  },

  approveBonus: async (
    id: string,
    approved: boolean
  ): Promise<{ data: IBonus }> => {
    try {
      const response = await axios.patch(
        `${BASE_URL}/super-admin/bonuses/${id}/approve`,
        { approved }
      );
      return response.data;
    } catch (error: any) {
      console.error("❌ Error approving bonus:", error);
      toast.error(error.response?.data?.message || "Failed to approve bonus");
      throw error;
    }
  },

  deleteBonus: async (id: string) => {
    try {
      const response = await axios.delete(
        `${BASE_URL}/super-admin/bonuses/${id}`
      );
      return response.data;
    } catch (error: any) {
      console.error("❌ Error deleting bonus:", error);
      toast.error(error.response?.data?.message || "Failed to delete bonus");
      throw error;
    }
  },
};
