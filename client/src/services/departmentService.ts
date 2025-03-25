import { QueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { api, handleApiResponse, handleApiError } from "../config/api";

// Use environment variable if available, fallback to localhost
const BASE_URL = "/api/super-admin";

export interface Department {
  _id: string;
  id: string;
  name: string;
  code: string;
  description?: string;
  location?: string;
  headOfDepartment: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  status: "active" | "inactive";
  employeeCounts: {
    total: number;
    admins: number;
    regularUsers: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface DepartmentFormData {
  id?: string;
  name: string;
  code: string;
  description?: string;
  location?: string;
  headOfDepartment: string;
  status: "active" | "inactive";
}

// Define specific error types for department operations
interface DepartmentError extends Error {
  code?: string;
  status?: number;
}

export const DEPARTMENTS_QUERY_KEY = ["departments"] as const;

export const prefetchDepartments = async (queryClient: QueryClient) => {
  await queryClient.prefetchQuery({
    queryKey: DEPARTMENTS_QUERY_KEY,
    queryFn: async () => {
      const departments = await departmentService.getAllDepartments();
      return departments;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const departmentService = {
  createDepartment: async (data: DepartmentFormData): Promise<Department> => {
    try {
      const response = await api.post("/super-admin/departments", data);
      const departmentData = handleApiResponse<Department>(response);
      return {
        ...departmentData,
        id: departmentData._id,
        createdAt: new Date(departmentData.createdAt),
        updatedAt: new Date(departmentData.updatedAt),
      };
    } catch (error) {
      const err = handleApiError(error) as DepartmentError;
      if (err.status === 400) {
        throw new Error("Invalid department data provided");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to create departments");
      }
      if (err.status === 409) {
        throw new Error("Department with this name or code already exists");
      }
      throw err;
    }
  },

  getAllDepartments: async (): Promise<Department[]> => {
    try {
      const response = await api.get("/super-admin/departments");
      const data = handleApiResponse<{ departments: Department[] }>(response);
      return data.departments.map((dept) => ({
        ...dept,
        id: dept._id,
        createdAt: new Date(dept.createdAt),
        updatedAt: new Date(dept.updatedAt),
      }));
    } catch (error) {
      const err = handleApiError(error) as DepartmentError;
      if (err.status === 403) {
        throw new Error("You don't have permission to view departments");
      }
      throw err;
    }
  },

  updateDepartment: async (
    id: string,
    data: DepartmentFormData
  ): Promise<Department> => {
    try {
      const response = await api.put(`/super-admin/departments/${id}`, data);
      const departmentData = handleApiResponse<Department>(response);
      return {
        ...departmentData,
        id: departmentData._id,
        createdAt: new Date(departmentData.createdAt),
        updatedAt: new Date(departmentData.updatedAt),
      };
    } catch (error) {
      const err = handleApiError(error) as DepartmentError;
      if (err.status === 404) {
        throw new Error("Department not found");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to update departments");
      }
      if (err.status === 400) {
        throw new Error("Invalid department update data provided");
      }
      if (err.status === 409) {
        throw new Error("Department with this name or code already exists");
      }
      throw err;
    }
  },

  deleteDepartment: async (id: string): Promise<boolean> => {
    try {
      const response = await api.delete(`/super-admin/departments/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      const err = handleApiError(error) as DepartmentError;
      if (err.status === 404) {
        throw new Error("Department not found");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to delete departments");
      }
      if (err.status === 400) {
        throw new Error(
          "Cannot delete department: may have active employees or is a system department"
        );
      }
      throw err;
    }
  },

  useGetDepartments: () => {
    return useQuery<Department[]>({
      queryKey: DEPARTMENTS_QUERY_KEY,
      queryFn: departmentService.getAllDepartments,
    });
  },
};
