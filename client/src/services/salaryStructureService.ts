import axios from "axios";
import { toast } from "react-toastify";
import {
  ISalaryGrade,
  ISalaryComponent,
  ISalaryComponentInput,
  CreateSalaryGradeDTO,
} from "../types/salary";

const BASE_URL = "http://localhost:5000/api";

// Set default axios config
axios.defaults.withCredentials = true;

// Create a type for the create salary grade input
interface CreateSalaryGradeInput {
  level: string;
  basicSalary: number;
  description: string;
  components: ISalaryComponentInput[];
}

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
      return response.data.data;
    } catch (error: any) {
      console.error("Failed to fetch salary grades:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch salary grades"
      );
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
    } catch (error: any) {
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
    } catch (error: any) {
      console.error("❌ Update failed:", error);
      toast.error(
        error.response?.data?.message || "Failed to update salary grade"
      );
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
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to add salary component"
      );
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
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to update component"
      );
      throw error;
    }
  },

  calculateTotalSalary: (grade: ISalaryGrade) => {
    console.log("📊 Calculating total for grade:", grade);
    const basicSalary = grade.basicSalary;
    let totalAllowances = 0;

    grade.components.forEach((component) => {
      console.log("💰 Processing component:", component);
      if (component.isActive) {
        const value =
          component.type === "fixed"
            ? component.value
            : (basicSalary * component.value) / 100;

        console.log(`${component.name}: ${value}`);
        totalAllowances += value;
      }
    });

    const result = {
      basicSalary,
      totalAllowances,
      grossSalary: basicSalary + totalAllowances,
    };
    console.log("🧮 Calculation result:", result);
    return result;
  },

  getSalaryGrade: async (id: string): Promise<ISalaryGrade> => {
    try {
      const response = await axios.get<{ data: ISalaryGrade }>(
        `${BASE_URL}/super-admin/salary-grades/${id}`
      );
      return response.data.data;
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to fetch salary grade"
      );
      throw error;
    }
  },

  deleteSalaryGrade: async (id: string): Promise<void> => {
    try {
      await axios.delete(`${BASE_URL}/super-admin/salary-grades/${id}`);
      toast.success("Salary grade deleted successfully");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to delete salary grade"
      );
      throw error;
    }
  },
};