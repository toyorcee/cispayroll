import axios from "axios";
import { toast } from "react-toastify";
import {
  Deduction,
  DeductionResponse,
  UserDeductionPreferences,
  DeductionPreference,
  CalculationMethod,
} from "../types/deduction";

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

export const deductionService = {
  getAllDeductions: async (): Promise<DeductionResponse> => {
    try {
      const response = await axios.get<{ data: DeductionResponse }>(
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
      await axios.post(`${BASE_URL}/super-admin/deductions/statutory`);
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
      const response = await axios.post(
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
      const response = await axios.post(
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
      const response = await axios.put(
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
      const response = await axios.patch(
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
      await axios.delete(`${BASE_URL}/super-admin/deductions/${id}`);
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
        const response = await axios.get<{
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
        const response = await axios.post(
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
      employeeId: string
    ) => {
      try {
        const response = await axios.post(
          `${BASE_URL}/admin/deductions/${deductionId}/assign/${employeeId}`
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
        const response = await axios.delete(
          `${BASE_URL}/admin/deductions/${deductionId}/employees/${employeeId}`
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

    // Get employee's deductions
    getEmployeeDeductions: async (employeeId: string) => {
      try {
        const response = await axios.get(
          `${BASE_URL}/admin/employees/${employeeId}/deductions`
        );
        return response.data;
      } catch (error: any) {
        console.error("Failed to fetch employee deductions:", error);
        toast.error(
          error.response?.data?.message || "Failed to fetch employee deductions"
        );
        throw error;
      }
    },

    // Assign deduction to multiple employees
    assignDeductionToMultipleEmployees: async (
      deductionId: string,
      employeeIds: string[]
    ) => {
      try {
        const response = await axios.post(
          `${BASE_URL}/admin/deductions/${deductionId}/assign-batch`,
          { employeeIds }
        );
        toast.success("Deduction assigned to employees successfully");
        return response.data;
      } catch (error: any) {
        console.error("Failed to assign deduction to employees:", error);
        toast.error(
          error.response?.data?.message || "Failed to assign deduction"
        );
        throw error;
      }
    },

    // Remove deduction from multiple employees
    removeDeductionFromMultipleEmployees: async (
      deductionId: string,
      employeeIds: string[]
    ) => {
      try {
        const response = await axios.delete(
          `${BASE_URL}/admin/deductions/${deductionId}/remove-batch`,
          { data: { employeeIds } }
        );
        toast.success("Deduction removed from employees successfully");
        return response.data;
      } catch (error: any) {
        console.error("Failed to remove deduction from employees:", error);
        toast.error(
          error.response?.data?.message || "Failed to remove deduction"
        );
        throw error;
      }
    },

    // Create statutory deduction
    createStatutoryDeduction: async (
      data: Partial<Deduction>
    ): Promise<Deduction> => {
      try {
        const response = await axios.post(`${BASE_URL}/admin/statutory`, data);
        toast.success("Successfully created statutory deduction");
        return response.data;
      } catch (error) {
        console.error("Error creating statutory deduction:", error);
        toast.error("Failed to create statutory deduction");
        throw error;
      }
    },

    // Create voluntary deduction
    createVoluntaryDeduction: async (
      data: Partial<Deduction>
    ): Promise<Deduction> => {
      try {
        const response = await axios.post(`${BASE_URL}/admin/voluntary`, data);
        toast.success("Successfully created voluntary deduction");
        return response.data;
      } catch (error) {
        console.error("Error creating voluntary deduction:", error);
        toast.error("Failed to create voluntary deduction");
        throw error;
      }
    },

    // Update deduction
    updateDeduction: async (
      id: string,
      data: Partial<Deduction>
    ): Promise<Deduction> => {
      try {
        const response = await axios.put(`${BASE_URL}/admin/${id}`, data);
        toast.success("Successfully updated deduction");
        return response.data;
      } catch (error) {
        console.error("Error updating deduction:", error);
        toast.error("Failed to update deduction");
        throw error;
      }
    },

    // Toggle deduction status
    toggleDeductionStatus: async (id: string): Promise<Deduction> => {
      try {
        const response = await axios.patch(`${BASE_URL}/admin/${id}/toggle`);
        toast.success("Successfully toggled deduction status");
        return response.data;
      } catch (error) {
        console.error("Error toggling deduction status:", error);
        toast.error("Failed to toggle deduction status");
        throw error;
      }
    },

    // Delete deduction
    deleteDeduction: async (id: string): Promise<void> => {
      try {
        await axios.delete(`${BASE_URL}/admin/${id}`);
        toast.success("Successfully deleted deduction");
      } catch (error) {
        console.error("Error deleting deduction:", error);
        toast.error("Failed to delete deduction");
        throw error;
      }
    },
  },

  // ===== User Deduction Preferences =====
  getUserDeductionPreferences: async (
    userId?: string
  ): Promise<UserDeductionPreferences> => {
    try {
      const url = userId
        ? `${BASE_URL}/preferences/${userId}`
        : `${BASE_URL}/preferences`;

      const response = await axios.get(url);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching user deduction preferences:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch deduction preferences"
      );
      throw error;
    }
  },

  addVoluntaryDeduction: async (
    deductionId: string,
    data: {
      startDate: Date;
      endDate?: Date;
      amount?: number;
      percentage?: number;
      notes?: string;
    },
    userId?: string
  ): Promise<UserDeductionPreferences> => {
    try {
      const url = userId
        ? `${BASE_URL}/preferences/voluntary/${userId}`
        : `${BASE_URL}/preferences/voluntary`;

      const response = await axios.post(url, {
        deduction: deductionId,
        ...data,
      });

      toast.success("Successfully opted in to deduction");
      return response.data;
    } catch (error: any) {
      console.error("Error adding voluntary deduction:", error);
      toast.error("Failed to opt in to deduction");
      throw error;
    }
  },

  removeVoluntaryDeduction: async (
    deductionId: string,
    userId?: string
  ): Promise<UserDeductionPreferences> => {
    try {
      const url = userId
        ? `${BASE_URL}/preferences/voluntary/${userId}/${deductionId}`
        : `${BASE_URL}/preferences/voluntary/${deductionId}`;

      const response = await axios.delete(url);

      toast.success("Successfully opted out of deduction");
      return response.data;
    } catch (error: any) {
      console.error("Error removing voluntary deduction:", error);
      toast.error("Failed to opt out of deduction");
      throw error;
    }
  },
};
