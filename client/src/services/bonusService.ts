import type { IBonus, BonusType, IBonusFilters } from "../types/payroll";
import { api, handleApiResponse, handleApiError } from "../config/api";

interface CreateBonusData {
  employee: string;
  type: BonusType;
  amount: number;
  description?: string;
  department?: string;
  paymentDate: Date;
}

interface BonusResponse {
  data: IBonus;
}

interface BonusesResponse {
  data: IBonus[];
}

// Define specific error types for bonus operations
interface BonusError extends Error {
  code?: string;
  status?: number;
}

export const bonusService = {
  createBonus: async (data: Partial<IBonus>): Promise<IBonus> => {
    try {
      const response = await api.post("/super-admin/bonuses", data);
      return handleApiResponse<IBonus>(response);
    } catch (error) {
      const err = handleApiError(error) as BonusError;
      if (err.status === 400) {
        throw new Error("Invalid bonus data provided");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to create bonuses");
      }
      if (err.status === 404) {
        throw new Error("Employee or department not found");
      }
      if (err.status === 409) {
        throw new Error(
          "Bonus already exists for this employee in this period"
        );
      }
      throw err;
    }
  },

  getAllBonuses: async (filters?: IBonusFilters): Promise<IBonus[]> => {
    try {
      const response = await api.get("/super-admin/bonuses", {
        params: filters,
      });
      return handleApiResponse<IBonus[]>(response);
    } catch (error) {
      const err = handleApiError(error) as BonusError;
      if (err.status === 403) {
        throw new Error("You don't have permission to view bonuses");
      }
      if (err.status === 400) {
        throw new Error("Invalid filter parameters provided");
      }
      throw err;
    }
  },

  updateBonus: async (
    id: string,
    data: Partial<CreateBonusData>
  ): Promise<IBonus> => {
    try {
      const response = await api.patch(`/super-admin/bonuses/${id}`, data);
      return handleApiResponse<IBonus>(response);
    } catch (error) {
      const err = handleApiError(error) as BonusError;
      if (err.status === 404) {
        throw new Error("Bonus not found");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to update bonuses");
      }
      if (err.status === 400) {
        throw new Error("Invalid bonus update data provided");
      }
      if (err.status === 409) {
        throw new Error("Cannot update bonus: already approved or paid");
      }
      throw err;
    }
  },

  approveBonus: async (id: string, approved: boolean): Promise<IBonus> => {
    try {
      const response = await api.patch(`/super-admin/bonuses/${id}/approve`, {
        approved,
      });
      return handleApiResponse<IBonus>(response);
    } catch (error) {
      const err = handleApiError(error) as BonusError;
      if (err.status === 404) {
        throw new Error("Bonus not found");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to approve bonuses");
      }
      if (err.status === 400) {
        throw new Error("Invalid approval status provided");
      }
      if (err.status === 409) {
        throw new Error("Cannot approve bonus: already approved or paid");
      }
      throw err;
    }
  },

  deleteBonus: async (id: string): Promise<void> => {
    try {
      await api.delete(`/super-admin/bonuses/${id}`);
    } catch (error) {
      const err = handleApiError(error) as BonusError;
      if (err.status === 404) {
        throw new Error("Bonus not found");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to delete bonuses");
      }
      if (err.status === 400) {
        throw new Error("Cannot delete bonus: already approved or paid");
      }
      throw err;
    }
  },
};
