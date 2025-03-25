import type { ISalaryComponent, IAllowanceFilters } from "../types/payroll";
import { api, handleApiResponse, handleApiError } from "../config/api";

interface CreateAllowanceRequest {
  name: string;
  type: "allowance" | "deduction";
  value: number;
  calculationMethod: "fixed" | "percentage";
  amount?: number;
  isActive?: boolean;
}

interface AllowanceResponse {
  data: ISalaryComponent;
}

interface AllowancesResponse {
  data: ISalaryComponent[];
}

// Define specific error types for allowance operations
interface AllowanceError extends Error {
  code?: string;
  status?: number;
}

export const allowanceService = {
  createAllowance: async (
    data: Partial<CreateAllowanceRequest>
  ): Promise<ISalaryComponent> => {
    try {
      const response = await api.post("/super-admin/allowances", data);
      return handleApiResponse<ISalaryComponent>(response);
    } catch (error) {
      const err = handleApiError(error) as AllowanceError;
      if (err.status === 400) {
        throw new Error("Invalid allowance data provided");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to create allowances");
      }
      if (err.status === 409) {
        throw new Error("Allowance with this name already exists");
      }
      throw err;
    }
  },

  getAllAllowances: async (
    filters?: IAllowanceFilters
  ): Promise<ISalaryComponent[]> => {
    try {
      const response = await api.get("/super-admin/allowances", {
        params: filters,
      });
      return handleApiResponse<ISalaryComponent[]>(response);
    } catch (error) {
      const err = handleApiError(error) as AllowanceError;
      if (err.status === 403) {
        throw new Error("You don't have permission to view allowances");
      }
      if (err.status === 400) {
        throw new Error("Invalid filter parameters provided");
      }
      throw err;
    }
  },

  updateAllowance: async (
    id: string,
    data: Partial<CreateAllowanceRequest>
  ): Promise<ISalaryComponent> => {
    try {
      const response = await api.patch(`/super-admin/allowances/${id}`, data);
      return handleApiResponse<ISalaryComponent>(response);
    } catch (error) {
      const err = handleApiError(error) as AllowanceError;
      if (err.status === 404) {
        throw new Error("Allowance not found");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to update allowances");
      }
      if (err.status === 400) {
        throw new Error("Invalid allowance update data provided");
      }
      if (err.status === 409) {
        throw new Error("Allowance with this name already exists");
      }
      throw err;
    }
  },

  toggleAllowanceStatus: async (id: string): Promise<ISalaryComponent> => {
    try {
      const response = await api.patch(`/super-admin/allowances/${id}/toggle`);
      return handleApiResponse<ISalaryComponent>(response);
    } catch (error) {
      const err = handleApiError(error) as AllowanceError;
      if (err.status === 404) {
        throw new Error("Allowance not found");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to toggle allowance status");
      }
      if (err.status === 400) {
        throw new Error(
          "Cannot toggle allowance: may be in use or is a system allowance"
        );
      }
      throw err;
    }
  },

  deleteAllowance: async (id: string): Promise<void> => {
    try {
      await api.delete(`/super-admin/allowances/${id}`);
    } catch (error) {
      const err = handleApiError(error) as AllowanceError;
      if (err.status === 404) {
        throw new Error("Allowance not found");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to delete allowances");
      }
      if (err.status === 400) {
        throw new Error(
          "Cannot delete allowance: may be in use or is a system allowance"
        );
      }
      throw err;
    }
  },
};
