import axios from "axios";
import { toast } from "react-toastify";
import {
  ISalaryGrade,
  ISalaryComponent,
  ISalaryComponentInput,
  CreateSalaryGradeDTO,
} from "../types/salary";
import { UserRole } from "../types/auth";

const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

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
  getAllSalaryGrades: async (
    userRole: UserRole = UserRole.USER
  ): Promise<ISalaryGrade[]> => {
    try {
      const endpoint =
        userRole === UserRole.SUPER_ADMIN
          ? `${BASE_URL}/super-admin/salary-grades`
          : `${BASE_URL}/admin/salary-grades`;

      const response = await axios.get(endpoint);
      console.log("API response for salary grades:", response.data);

      // Handle both response structures
      const salaryGrades = response.data.data || response.data.salaryGrades;

      if (!Array.isArray(salaryGrades)) {
        console.error("Invalid salary grades response:", response.data);
        throw new Error("Invalid salary grades response format");
      }

      return salaryGrades;
    } catch (error: unknown) {
      console.error("Salary grades fetch error:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Error response:", error.response.data);
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
