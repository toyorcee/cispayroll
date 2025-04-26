import axios from "axios";
import { toast } from "react-toastify";
import type { IBonus, BonusType, IBonusFilters } from "../types/payroll";

const BASE_URL = "http://localhost:5000/api";

interface CreateBonusData {
  employee: string;
  type: BonusType;
  amount: number;
  description?: string;
  department?: string;
  paymentDate: Date;
}

interface CreatePersonalBonusData {
  amount: number;
  reason: string;
  paymentDate: Date;
}

export const bonusService = {
  createBonus: async (data: Partial<IBonus>): Promise<{ data: IBonus }> => {
    try {
      const response = await axios.post(`${BASE_URL}/bonus/personal`, data);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errorMessage = axios.isAxiosError(error)
          ? error.response?.data?.message || "Failed to create bonus"
          : "An unexpected error occurred";
        toast.error(errorMessage);
      } else {
        toast.error("An unexpected error occurred");
      }
      throw error;
    }
  },

  createPersonalBonus: async (
    data: CreatePersonalBonusData
  ): Promise<{ data: IBonus }> => {
    try {
      const response = await axios.post(`${BASE_URL}/bonus/personal`, data);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message ||
          "Failed to create personal bonus request";
        toast.error(errorMessage);
      } else {
        toast.error("An unexpected error occurred");
      }
      throw error;
    }
  },

  getMyBonuses: async (): Promise<{
    data: { bonuses: IBonus[]; pagination: any };
  }> => {
    try {
      const response = await axios.get(`${BASE_URL}/bonus/requests`);
      return response.data;
    } catch (error: unknown) {
      console.error("❌ Error fetching personal bonuses:", error);
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || "Failed to fetch your bonus requests"
        );
      } else {
        toast.error("An unexpected error occurred");
      }
      throw error;
    }
  },

  getBonusById: async (id: string): Promise<{ data: IBonus }> => {
    try {
      const response = await axios.get(`${BASE_URL}/bonus/requests/${id}`);
      return response.data;
    } catch (error: unknown) {
      console.error("❌ Error fetching bonus:", error);
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to fetch bonus");
      } else {
        toast.error("An unexpected error occurred");
      }
      throw error;
    }
  },

  getAllBonuses: async (
    filters?: IBonusFilters
  ): Promise<{ data: IBonus[] }> => {
    try {
      const response = await axios.get(`${BASE_URL}/bonus/requests`, {
        params: filters,
      });
      return response.data;
    } catch (error: unknown) {
      console.error("❌ Error fetching bonuses:", error);
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to fetch bonuses");
      } else {
        toast.error("An unexpected error occurred");
      }
      throw error;
    }
  },

  updateBonus: async (
    id: string,
    data: Partial<CreateBonusData>
  ): Promise<{ data: IBonus }> => {
    try {
      const response = await axios.patch(
        `${BASE_URL}/bonus/requests/${id}`,
        data
      );
      return response.data;
    } catch (error: unknown) {
      console.error("❌ Error updating bonus:", error);
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to update bonus");
      } else {
        toast.error("An unexpected error occurred");
      }
      throw error;
    }
  },

  approveBonus: async (
    id: string,
    // approved: boolean
  ): Promise<{ data: IBonus }> => {
    try {
      const response = await axios.put(
        `${BASE_URL}/bonus/requests/${id}/approve`
      );
      return response.data;
    } catch (error: unknown) {
      console.error("❌ Error approving bonus:", error);
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to approve bonus");
      } else {
        toast.error("An unexpected error occurred");
      }
      throw error;
    }
  },

  rejectBonus: async (
    id: string,
    rejectionReason: string
  ): Promise<{ data: IBonus }> => {
    try {
      const response = await axios.put(
        `${BASE_URL}/bonus/requests/${id}/reject`,
        { rejectionReason }
      );
      return response.data;
    } catch (error: unknown) {
      console.error("❌ Error rejecting bonus:", error);
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to reject bonus");
      } else {
        toast.error("An unexpected error occurred");
      }
      throw error;
    }
  },

  deleteBonus: async (id: string) => {
    try {
      const response = await axios.delete(`${BASE_URL}/bonus/requests/${id}`);
      return response.data;
    } catch (error: unknown) {
      console.error("❌ Error deleting bonus:", error);
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to delete bonus");
      } else {
        toast.error("An unexpected error occurred");
      }
      throw error;
    }
  },
};
