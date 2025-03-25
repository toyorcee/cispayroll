import {
  Deduction,
  DeductionsResponse,
  CalculationMethod,
} from "../types/deduction";
import { api, handleApiResponse, handleApiError } from "../config/api";

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

interface ToggleDeductionResponse {
  deduction: Deduction;
  allDeductions: {
    statutory: Deduction[];
    voluntary: Deduction[];
  };
}

// Define specific error types for deduction operations
interface DeductionError extends Error {
  code?: string;
  status?: number;
}

export const deductionService = {
  getAllDeductions: async (): Promise<DeductionsResponse["data"]> => {
    try {
      const response = await api.get("/super-admin/deductions");
      return handleApiResponse(response);
    } catch (error) {
      const err = handleApiError(error) as DeductionError;
      if (err.status === 403) {
        throw new Error("You don't have permission to view deductions");
      }
      throw err;
    }
  },

  setupStatutoryDeductions: async (): Promise<void> => {
    try {
      await api.post("/super-admin/deductions/statutory/setup");
    } catch (error) {
      const err = handleApiError(error) as DeductionError;
      if (err.status === 403) {
        throw new Error(
          "You don't have permission to setup statutory deductions"
        );
      }
      if (err.status === 409) {
        throw new Error("Statutory deductions have already been setup");
      }
      if (err.status === 400) {
        throw new Error("Invalid statutory deduction configuration");
      }
      throw err;
    }
  },

  createDeduction: async (
    data: CreateVoluntaryDeductionInput
  ): Promise<Deduction> => {
    try {
      const response = await api.post(
        "/super-admin/deductions/voluntary",
        data
      );
      return handleApiResponse(response);
    } catch (error) {
      const err = handleApiError(error) as DeductionError;
      if (err.status === 400) {
        throw new Error("Invalid deduction data provided");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to create deductions");
      }
      if (err.status === 409) {
        throw new Error("Deduction with this name already exists");
      }
      throw err;
    }
  },

  updateDeduction: async (
    id: string,
    data: UpdateDeductionInput
  ): Promise<Deduction> => {
    try {
      const response = await api.patch(`/super-admin/deductions/${id}`, data);
      return handleApiResponse(response);
    } catch (error) {
      const err = handleApiError(error) as DeductionError;
      if (err.status === 404) {
        throw new Error("Deduction not found");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to update deductions");
      }
      if (err.status === 400) {
        throw new Error("Invalid deduction update data provided");
      }
      if (err.status === 409) {
        throw new Error("Deduction with this name already exists");
      }
      throw err;
    }
  },

  toggleDeductionStatus: async (
    id: string
  ): Promise<ToggleDeductionResponse> => {
    try {
      const response = await api.patch(`/super-admin/deductions/${id}/toggle`);
      return handleApiResponse(response);
    } catch (error) {
      const err = handleApiError(error) as DeductionError;
      if (err.status === 404) {
        throw new Error("Deduction not found");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to toggle deduction status");
      }
      if (err.status === 400) {
        throw new Error(
          "Cannot toggle deduction status: may be in use or is a statutory deduction"
        );
      }
      throw err;
    }
  },

  deleteDeduction: async (id: string): Promise<void> => {
    try {
      await api.delete(`/super-admin/deductions/${id}`);
    } catch (error) {
      const err = handleApiError(error) as DeductionError;
      if (err.status === 404) {
        throw new Error("Deduction not found");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to delete deductions");
      }
      if (err.status === 400) {
        throw new Error(
          "Cannot delete deduction: may be in use or is a statutory deduction"
        );
      }
      throw err;
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
