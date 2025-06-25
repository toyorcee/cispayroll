import api from "./api";
import { toast } from "react-toastify";
import {
  Deduction,
  DeductionResponse,
  UserDeductionPreferences,
  CalculationMethod,
} from "../types/deduction";

const BASE_URL = `/api`;

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

export const deductionService = {
  getAllDeductions: async (): Promise<DeductionResponse> => {
    try {
      const response = await api.get<{ data: DeductionResponse }>(
        `${BASE_URL}/super-admin/deductions`
      );

      if (!response.data || !response.data.data) {
        console.error("Invalid response structure:", response);
        return { statutory: [], voluntary: [] };
      }

      return response.data.data;
    } catch (error: any) {
      console.error("Failed to fetch deductions:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch deductions"
      );
      throw error; // Throw error so component can handle loading states
    }
  },

  setupStatutoryDeductions: async (): Promise<void> => {
    try {
      await api.post(`${BASE_URL}/super-admin/deductions/statutory`);
      toast.success("Statutory deductions set up successfully");
    } catch (error: any) {
      console.error("Failed to setup statutory deductions:", error);
      toast.error(
        error.response?.data?.message || "Failed to setup statutory deductions"
      );
      throw error;
    }
  },

  createCustomStatutoryDeduction: async (data: any) => {
    try {
      const response = await api.post(
        `${BASE_URL}/super-admin/deductions/statutory/custom`,
        data
      );
      toast.success("Custom statutory deduction created successfully");
      return response.data;
    } catch (error: any) {
      console.error("Failed to create custom statutory deduction:", error);
      toast.error(
        error.response?.data?.message || "Failed to create deduction"
      );
      throw error;
    }
  },

  createVoluntaryDeduction: async (data: CreateVoluntaryDeductionInput) => {
    try {
      const response = await api.post(
        `${BASE_URL}/super-admin/deductions/voluntary`,
        data
      );
      toast.success("Voluntary deduction created successfully");
      return response.data;
    } catch (error: any) {
      console.error("Failed to create voluntary deduction:", error);
      toast.error(
        error.response?.data?.message || "Failed to create deduction"
      );
      throw error;
    }
  },

  updateDeduction: async (id: string, data: UpdateDeductionInput) => {
    try {
      const response = await api.put(
        `${BASE_URL}/super-admin/deductions/${id}`,
        data
      );
      toast.success("Deduction updated successfully");
      return response.data;
    } catch (error: any) {
      console.error("Failed to update deduction:", error);
      toast.error(
        error.response?.data?.message || "Failed to update deduction"
      );
      throw error;
    }
  },

  toggleDeductionStatus: async (
    id: string
  ): Promise<{ deduction: Deduction }> => {
    try {
      const response = await api.patch(
        `${BASE_URL}/super-admin/deductions/${id}/toggle`
      );
      toast.success(response.data.message);
      return response.data.data;
    } catch (error: any) {
      console.error("Failed to toggle deduction status:", error);
      toast.error(error.response?.data?.message || "Failed to toggle status");
      throw error;
    }
  },

  deleteDeduction: async (id: string) => {
    try {
      await api.delete(`${BASE_URL}/super-admin/deductions/${id}`);
      toast.success("Deduction deleted successfully");
    } catch (error: any) {
      console.error("Failed to delete deduction:", error);
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

  // ===== Admin-specific Operations =====
  adminService: {
    // Get all deductions for admin's department
    getAllDeductions: async (): Promise<DeductionResponse> => {
      try {
        const response = await api.get<{
          success: boolean;
          data: DeductionResponse;
        }>(`${BASE_URL}/admin/deductions`);

        if (!response.data || !response.data.data) {
          console.error("Invalid response structure:", response);
          return { statutory: [], voluntary: [] };
        }

        return response.data.data;
      } catch (error: any) {
        console.error("Failed to fetch deductions:", error);
        toast.error(
          error.response?.data?.message || "Failed to fetch deductions"
        );
        throw error;
      }
    },

    // Create department-specific deduction
    createDepartmentDeduction: async (data: CreateVoluntaryDeductionInput) => {
      try {
        const response = await api.post(
          `${BASE_URL}/admin/deductions/department`,
          data
        );
        toast.success("Department-specific deduction created successfully");
        return response.data;
      } catch (error: any) {
        console.error("Failed to create department-specific deduction:", error);
        toast.error(
          error.response?.data?.message || "Failed to create deduction"
        );
        throw error;
      }
    },

    // Assign deduction to employee
    assignDeductionToEmployee: async (
      deductionId: string,
      employeeId: string,
      preferences: UserDeductionPreferences
    ) => {
      try {
        const response = await api.post(
          `${BASE_URL}/admin/deductions/${deductionId}/assign`,
          {
            employeeId,
            preferences,
          }
        );
        toast.success("Deduction assigned to employee successfully");
        return response.data;
      } catch (error: any) {
        console.error("Failed to assign deduction to employee:", error);
        toast.error(
          error.response?.data?.message || "Failed to assign deduction"
        );
        throw error;
      }
    },

    // Remove deduction from employee
    removeDeductionFromEmployee: async (
      deductionId: string,
      employeeId: string
    ) => {
      try {
        const response = await api.delete(
          `${BASE_URL}/admin/deductions/${deductionId}/assign/${employeeId}`
        );
        toast.success("Deduction removed from employee successfully");
        return response.data;
      } catch (error: any) {
        console.error("Failed to remove deduction from employee:", error);
        toast.error(
          error.response?.data?.message || "Failed to remove deduction"
        );
        throw error;
      }
    },

    // Update employee deduction preferences
    updateEmployeeDeductionPreferences: async (
      deductionId: string,
      employeeId: string,
      preferences: UserDeductionPreferences
    ) => {
      try {
        const response = await api.put(
          `${BASE_URL}/admin/deductions/${deductionId}/assign/${employeeId}`,
          { preferences }
        );
        toast.success("Employee deduction preferences updated successfully");
        return response.data;
      } catch (error: any) {
        console.error(
          "Failed to update employee deduction preferences:",
          error
        );
        toast.error(
          error.response?.data?.message || "Failed to update preferences"
        );
        throw error;
      }
    },

    // Get employee deductions
    getEmployeeDeductions: async (employeeId: string) => {
      try {
        const response = await api.get(
          `${BASE_URL}/admin/employees/${employeeId}/deductions`
        );
        return response.data.data;
      } catch (error: any) {
        console.error("Failed to fetch employee deductions:", error);
        toast.error(
          error.response?.data?.message || "Failed to fetch employee deductions"
        );
        throw error;
      }
    },

    // Get department deduction statistics
    getDepartmentDeductionStats: async () => {
      try {
        const response = await api.get(`${BASE_URL}/admin/deductions/stats`);
        return response.data.data;
      } catch (error: any) {
        console.error("Failed to fetch department deduction stats:", error);
        toast.error(
          error.response?.data?.message ||
            "Failed to fetch deduction statistics"
        );
        throw error;
      }
    },
  },

  // ===== User-specific Operations =====
  userService: {
    // Get user's own deductions
    getMyDeductions: async () => {
      try {
        const response = await api.get(`${BASE_URL}/regular-user/deductions`);
        return response.data.data;
      } catch (error: any) {
        console.error("Failed to fetch user deductions:", error);
        toast.error(
          error.response?.data?.message || "Failed to fetch deductions"
        );
        throw error;
      }
    },

    // Update user's deduction preferences
    updateDeductionPreferences: async (
      deductionId: string,
      preferences: UserDeductionPreferences
    ) => {
      try {
        const response = await api.put(
          `${BASE_URL}/regular-user/deductions/${deductionId}/preferences`,
          { preferences }
        );
        toast.success("Deduction preferences updated successfully");
        return response.data;
      } catch (error: any) {
        console.error("Failed to update deduction preferences:", error);
        toast.error(
          error.response?.data?.message || "Failed to update preferences"
        );
        throw error;
      }
    },

    // Opt out of deduction
    optOutOfDeduction: async (deductionId: string, reason: string) => {
      try {
        const response = await api.post(
          `${BASE_URL}/regular-user/deductions/${deductionId}/opt-out`,
          { reason }
        );
        toast.success("Successfully opted out of deduction");
        return response.data;
      } catch (error: any) {
        console.error("Failed to opt out of deduction:", error);
        toast.error(
          error.response?.data?.message || "Failed to opt out of deduction"
        );
        throw error;
      }
    },

    // Get deduction details
    getDeductionDetails: async (deductionId: string) => {
      try {
        const response = await api.get(
          `${BASE_URL}/regular-user/deductions/${deductionId}`
        );
        return response.data.data;
      } catch (error: any) {
        console.error("Failed to fetch deduction details:", error);
        toast.error(
          error.response?.data?.message || "Failed to fetch deduction details"
        );
        throw error;
      }
    },
  },
};
