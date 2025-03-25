import {
  ISalaryGrade,
  ISalaryComponent,
  ISalaryComponentInput,
} from "../types/salary";
import { api, handleApiResponse, handleApiError } from "../config/api";

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

// Define specific error types for salary structure operations
interface SalaryStructureError extends Error {
  code?: string;
  status?: number;
}

export const salaryStructureService = {
  getAllSalaryGrades: async (): Promise<ISalaryGrade[]> => {
    try {
      const response = await api.get("/super-admin/salary-grades");
      return handleApiResponse<ISalaryGrade[]>(response);
    } catch (error) {
      const err = handleApiError(error) as SalaryStructureError;
      if (err.status === 403) {
        throw new Error("You don't have permission to view salary grades");
      }
      throw err;
    }
  },

  createSalaryGrade: async (data: {
    level: string;
    basicSalary: number;
    description: string;
    department: string | null;
    components: ISalaryComponentInput[];
  }): Promise<ISalaryGrade> => {
    try {
      const formattedData = {
        level: data.level,
        basicSalary: Number(data.basicSalary),
        description: data.description || "",
        department: data.department,
        components: data.components.map((comp) => ({
          name: comp.name.trim(),
          type: comp.type,
          value: Number(comp.value),
          isActive: comp.isActive,
        })),
      };

      const response = await api.post(
        "/super-admin/salary-grades",
        formattedData
      );
      return handleApiResponse<ISalaryGrade>(response);
    } catch (error) {
      const err = handleApiError(error) as SalaryStructureError;
      if (err.status === 400) {
        throw new Error("Invalid salary grade data provided");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to create salary grades");
      }
      throw err;
    }
  },

  updateSalaryGrade: async (
    id: string,
    data: UpdateSalaryGradeInput
  ): Promise<ISalaryGrade> => {
    try {
      const response = await api.patch(
        `/super-admin/salary-grades/${id}`,
        data
      );
      return handleApiResponse<ISalaryGrade>(response);
    } catch (error) {
      const err = handleApiError(error) as SalaryStructureError;
      if (err.status === 404) {
        throw new Error("Salary grade not found");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to update salary grades");
      }
      if (err.status === 400) {
        throw new Error("Invalid update data provided");
      }
      throw err;
    }
  },

  addSalaryComponent: async (
    gradeId: string,
    component: ISalaryComponentInput
  ): Promise<ISalaryGrade> => {
    try {
      const response = await api.post(
        `/super-admin/salary-grades/${gradeId}/components`,
        component
      );
      return handleApiResponse<ISalaryGrade>(response);
    } catch (error) {
      const err = handleApiError(error) as SalaryStructureError;
      if (err.status === 404) {
        throw new Error("Salary grade not found");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to add salary components");
      }
      if (err.status === 400) {
        throw new Error("Invalid component data provided");
      }
      throw err;
    }
  },

  updateSalaryComponent: async (
    gradeId: string,
    componentId: string,
    updates: Partial<ISalaryComponent>
  ): Promise<ISalaryGrade> => {
    try {
      const response = await api.patch(
        `/super-admin/salary-grades/${gradeId}/components/${componentId}`,
        updates
      );
      return handleApiResponse<ISalaryGrade>(response);
    } catch (error) {
      const err = handleApiError(error) as SalaryStructureError;
      if (err.status === 404) {
        throw new Error("Salary grade or component not found");
      }
      if (err.status === 403) {
        throw new Error(
          "You don't have permission to update salary components"
        );
      }
      if (err.status === 400) {
        throw new Error("Invalid component update data provided");
      }
      throw err;
    }
  },

  calculateTotalSalary: (grade: ISalaryGrade) => {
    const basicSalary = grade.basicSalary;
    let totalAllowances = 0;

    grade.components.forEach((component) => {
      if (component.isActive) {
        if (component.type === "fixed") {
          totalAllowances += component.value;
        } else {
          totalAllowances += (basicSalary * component.value) / 100;
        }
      }
    });

    return {
      basicSalary,
      totalAllowances,
      grossSalary: basicSalary + totalAllowances,
    };
  },

  getSalaryGrade: async (id: string): Promise<ISalaryGrade> => {
    try {
      const response = await api.get(`/super-admin/salary-grades/${id}`);
      return handleApiResponse<ISalaryGrade>(response);
    } catch (error) {
      const err = handleApiError(error) as SalaryStructureError;
      if (err.status === 404) {
        throw new Error("Salary grade not found");
      }
      if (err.status === 403) {
        throw new Error(
          "You don't have permission to view salary grade details"
        );
      }
      throw err;
    }
  },

  deleteSalaryGrade: async (id: string): Promise<void> => {
    try {
      await api.delete(`/super-admin/salary-grades/${id}`);
    } catch (error) {
      const err = handleApiError(error) as SalaryStructureError;
      if (err.status === 404) {
        throw new Error("Salary grade not found");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to delete salary grades");
      }
      if (err.status === 400) {
        throw new Error("Cannot delete salary grade that is in use");
      }
      throw err;
    }
  },
};
