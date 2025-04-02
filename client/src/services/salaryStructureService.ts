import axios from "axios";
import { toast } from "react-toastify";
import {
  ISalaryGrade,
  ISalaryComponent,
  ISalaryComponentInput,
  CreateSalaryGradeDTO,
  // ComponentType, // Add this import
} from "../types/salary";

const BASE_URL = "https://payrollapi.digitalentshub.net/api";

// Set default axios config
axios.defaults.withCredentials = true;

interface UpdateSalaryGradeInput {
  level?: string;
  basicSalary?: number;
  description?: string;
  department?: string;
  components?: ISalaryComponentInput[];
}

export const salaryStructureService = {
  getAllSalaryGrades: async (): Promise<ISalaryGrade[]> => {
    try {
      const response = await axios.get<{ data: ISalaryGrade[] }>(
        `${BASE_URL}/super-admin/salary-grades`
      );

      // Just return the data directly from backend
      return response.data.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(
          error.response.data?.message || "Failed to fetch salary grades"
        );
      } else {
        toast.error("Failed to fetch salary grades");
      }
      throw error;
    }
  },

  createSalaryGrade: async (
    data: CreateSalaryGradeDTO
  ): Promise<ISalaryGrade> => {
    try {
      const formattedData = {
        level: data.level,
        basicSalary: Number(data.basicSalary),
        description: data.description || "",
        department: data.department,
        components: data.components.map((comp) => ({
          name: comp.name.trim(),
          type: comp.type,
          calculationMethod: comp.calculationMethod,
          value: Number(comp.value),
          isActive: comp.isActive,
        })),
      };

      console.log("📤 Sending formatted data:", formattedData);

      const response = await axios.post<{ data: ISalaryGrade }>(
        `${BASE_URL}/super-admin/salary-grades`,
        formattedData
      );

      return response.data.data;
    } catch (error: unknown) {
      console.error("❌ Request failed:", error);
      throw error;
    }
  },

  updateSalaryGrade: async (
    id: string,
    data: UpdateSalaryGradeInput
  ): Promise<ISalaryGrade> => {
    try {
      console.log("📤 Updating salary grade:", { id, data });
      const response = await axios.patch<{ data: ISalaryGrade }>(
        `${BASE_URL}/super-admin/salary-grades/${id}`,
        data
      );
      return response.data.data;
    } catch (error: unknown) {
      console.error("❌ Update failed:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(
          error.response.data?.message || "Failed to update salary grade"
        );
      } else {
        toast.error("Failed to update salary grade");
      }
      throw error;
    }
  },

  addSalaryComponent: async (
    gradeId: string,
    component: ISalaryComponentInput
  ): Promise<ISalaryGrade> => {
    try {
      const response = await axios.post<{ data: ISalaryGrade }>(
        `${BASE_URL}/super-admin/salary-grades/${gradeId}/components`,
        component
      );
      return response.data.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(
          error.response.data?.message || "Failed to add salary component"
        );
      } else {
        toast.error("Failed to add salary component");
      }
      throw error;
    }
  },

  updateSalaryComponent: async (
    gradeId: string,
    componentId: string,
    updates: Partial<ISalaryComponent>
  ) => {
    try {
      const response = await axios.patch(
        `${BASE_URL}/super-admin/salary-grades/${gradeId}/components/${componentId}`,
        updates
      );
      toast.success("Component updated successfully");
      return response.data.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(
          error.response.data?.message || "Failed to update component"
        );
      } else {
        toast.error("Failed to update component");
      }
      throw error;
    }
  },

  getSalaryGrade: async (id: string): Promise<ISalaryGrade> => {
    try {
      const response = await axios.get<{ data: ISalaryGrade }>(
        `${BASE_URL}/super-admin/salary-grades/${id}`
      );
      return response.data.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(
          error.response.data?.message || "Failed to fetch salary grade"
        );
      } else {
        toast.error("Failed to fetch salary grade");
      }
      throw error;
    }
  },

  deleteSalaryGrade: async (id: string): Promise<void> => {
    try {
      await axios.delete(`${BASE_URL}/super-admin/salary-grades/${id}`);
      toast.success("Salary grade deleted successfully");
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(
          error.response.data?.message || "Failed to delete salary grade"
        );
      } else {
        toast.error("Failed to delete salary grade");
      }
      throw error;
    }
  },
};
