import api from "./api";
import { QueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { Department, DepartmentFormData } from "../types/department";
import { AdminResponse } from "./employeeService";
import { toast } from "react-toastify";
import axios from "axios";

const BASE_URL = `/api`;

export interface DepartmentResponse {
  _id: string;
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
}

export interface DepartmentChartStats {
  departmentDistribution: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
    }[];
  };
  pieChart: {
    labels: string[];
    datasets: [
      {
        data: number[];
      }
    ];
  };
}

export interface AdminDepartmentStats {
  departmentStats: {
    labels: string[];
    datasets: [
      {
        label: string;
        data: number[];
        backgroundColor: string[];
        borderColor: string[];
        borderWidth: number;
      }
    ];
  };
  monthlyGrowth: {
    labels: string[];
    datasets: [
      {
        label: string;
        data: number[];
        borderColor: string;
        backgroundColor: string;
        tension: number;
      }
    ];
  };
}

export interface AdminUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department?: {
    _id: string;
    name: string;
    code: string;
  };
}

export interface ChartStats {
  departmentDistribution: {
    labels: string[];
    datasets: Array<{
      data: number[];
      label?: string;
    }>;
  };
}

export interface AdminDepartmentChartStats {
  departmentStats: {
    labels: string[];
    datasets: [
      {
        label: string;
        data: number[];
        backgroundColor: string[];
        borderColor: string[];
        borderWidth: number;
      }
    ];
  };
  roleDistribution: {
    labels: string[];
    datasets: [
      {
        label: string;
        data: number[];
        backgroundColor: string[];
        borderColor: string[];
        borderWidth: number;
      }
    ];
  };
  monthlyGrowth: {
    labels: string[];
    datasets: [
      {
        label: string;
        data: number[];
        borderColor: string;
        backgroundColor: string;
        tension: number;
      }
    ];
  };
}

export const DEPARTMENTS_QUERY_KEY = ["departments"] as const;

export const prefetchDepartments = async (queryClient: QueryClient) => {
  await queryClient.prefetchQuery({
    queryKey: DEPARTMENTS_QUERY_KEY,
    queryFn: async () => {
      const departments = await departmentService.getAllDepartments();
      return departments;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

/**
 * Service methods for department-related operations
 * Note: Department updates use the /departments endpoint directly
 * This is the current working implementation - do not change without testing
 */
export const departmentService = {
  getAllDepartments: async (
    userRole?: string,
    userPermissions?: string[]
  ): Promise<Department[]> => {
    try {
      // Check if user has super admin role or VIEW_ALL_DEPARTMENTS permission
      const isSuperAdmin = userRole === "SUPER_ADMIN";
      const hasPermission = userPermissions?.includes("VIEW_ALL_DEPARTMENTS");

      // Use super-admin endpoint only if user is super admin or has the permission
      const endpoint =
        isSuperAdmin || hasPermission
          ? `${BASE_URL}/super-admin/departments`
          : `${BASE_URL}/departments`;

      const response = await api.get(endpoint);
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching departments:", error);
      // Don't show toast for permission errors to avoid spam
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        console.warn(
          "Permission denied for departments - this is expected for regular users"
        );
        return [];
      }
      // If regular user endpoint doesn't exist (404), try super-admin endpoint as fallback
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.warn(
          "Regular user departments endpoint not found, trying super-admin endpoint"
        );
        try {
          const fallbackResponse = await api.get(
            `${BASE_URL}/super-admin/departments`
          );
          return fallbackResponse.data.data || [];
        } catch (fallbackError) {
          console.error("Fallback endpoint also failed:", fallbackError);
          return [];
        }
      }
      toast.error("Failed to fetch departments");
      throw error;
    }
  },

  // Role-aware version for AuthContext
  getAllDepartmentsForUser: async (
    userRole?: string,
    userPermissions?: string[]
  ): Promise<Department[]> => {
    try {
      const isSuperAdmin = userRole === "SUPER_ADMIN";
      const hasPermission = userPermissions?.includes("VIEW_ALL_DEPARTMENTS");

      // Use super-admin endpoint only if user is super admin or has the permission
      const endpoint =
        isSuperAdmin || hasPermission
          ? `${BASE_URL}/super-admin/departments`
          : `${BASE_URL}/departments`;

      const response = await api.get(endpoint);
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching departments:", error);
      // Don't show toast for permission errors to avoid spam
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        console.warn(
          "Permission denied for departments - this is expected for regular users"
        );
        return [];
      }
      throw error;
    }
  },

  createDepartment: async (data: DepartmentFormData): Promise<Department> => {
    try {
      const response = await api.post(
        `${BASE_URL}/super-admin/departments`,
        data
      );
      toast.success("Department created successfully");
      return response.data.data;
    } catch (error) {
      console.error("Error creating department:", error);
      toast.error("Failed to create department");
      throw error;
    }
  },

  /**
   * Gets a department by ID
   * @param id Department ID
   * @returns Promise<Department>
   */
  getDepartmentById: async (id: string): Promise<Department> => {
    try {
      const response = await api.get(
        `${BASE_URL}/super-admin/departments/${id}`
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching department:", error);
      toast.error("Failed to fetch department");
      throw error;
    }
  },

  /**
   * Updates a department
   * @param id Department ID
   * @param data Department data to update
   * @returns Promise<Department>
   */
  updateDepartment: async (
    id: string,
    data: DepartmentFormData
  ): Promise<Department> => {
    try {
      const response = await api.put(
        `${BASE_URL}/super-admin/departments/${id}`,
        data
      );
      toast.success("Department updated successfully");
      return response.data.data;
    } catch (error) {
      console.error("Error updating department:", error);
      toast.error("Failed to update department");
      throw error;
    }
  },

  deleteDepartment: async (id: string): Promise<void> => {
    try {
      await api.delete(`${BASE_URL}/super-admin/departments/${id}`);
      toast.success("Department deleted successfully");
    } catch (error) {
      console.error("Error deleting department:", error);
      toast.error("Failed to delete department");
      throw error;
    }
  },

  useGetDepartments: () => {
    return useQuery<Department[]>({
      queryKey: DEPARTMENTS_QUERY_KEY,
      queryFn: () => departmentService.getAllDepartments(),
    });
  },

  // Role-aware version for components that have access to user context
  useGetDepartmentsWithRole: (
    userRole?: string,
    userPermissions?: string[]
  ) => {
    return useQuery<Department[]>({
      queryKey: [...DEPARTMENTS_QUERY_KEY, userRole, userPermissions],
      queryFn: () =>
        departmentService.getAllDepartments(userRole, userPermissions),
      enabled: !!userRole,
    });
  },

  getDepartmentChartStats: async () => {
    try {
      const response = await api.get(`${BASE_URL}/departments/stats/charts`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching department chart stats:", error);
      throw error;
    }
  },

  useGetDepartmentChartStats: () => {
    return useQuery<DepartmentChartStats>({
      queryKey: ["departmentChartStats"],
      queryFn: () => departmentService.getDepartmentChartStats(),
    });
  },

  getAdminDepartmentStats: async (departmentId: string) => {
    try {
      const response = await api.get(
        `${BASE_URL}/departments/stats/admin/${departmentId}`
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  getUserStats: async (userId: string) => {
    try {
      const response = await api.get(
        `${BASE_URL}/departments/stats/user/${userId}`
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  useGetRoleSpecificStats: (role: string, id: string) => {
    return useQuery({
      queryKey: ["roleStats", role, id],
      queryFn: () => {
        if (role === "admin") {
          return departmentService.getAdminDepartmentStats(id);
        } else if (role === "user") {
          return departmentService.getUserStats(id);
        }
        return departmentService.getDepartmentChartStats();
      },
    });
  },

  useGetAdminDepartmentStats: (departmentId: string) => {
    return useQuery<AdminDepartmentStats>({
      queryKey: ["adminDepartmentStats", departmentId],
      queryFn: () => departmentService.getAdminDepartmentStats(departmentId),
      enabled: !!departmentId,
    });
  },

  useGetDepartmentAdmins: () => {
    return useQuery<AdminResponse[]>({
      queryKey: ["departmentAdmins"],
      queryFn: async () => {
        const response = await api.get(`${BASE_URL}/super-admin/admins`);
        return response.data.admins;
      },
    });
  },

  getChartStats: async (): Promise<ChartStats> => {
    try {
      const response = await api.get<{ data: ChartStats }>(
        `${BASE_URL}/departments/chart-stats`
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Failed to fetch chart stats:", error);
      throw error;
    }
  },

  getAdminDepartmentChartStats: async () => {
    try {
      const response = await api.get(
        `${BASE_URL}/admin/department/stats/charts`
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching admin department chart stats:", error);
      throw error;
    }
  },

  useGetAdminDepartmentChartStats: () => {
    return useQuery<AdminDepartmentChartStats>({
      queryKey: ["adminDepartmentChartStats"],
      queryFn: () => departmentService.getAdminDepartmentChartStats(),
    });
  },

  getDepartmentEmployees: async (departmentId: string, filters?: any) => {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== "all") {
            params.append(key, value.toString());
          }
        });
      }

      const response = await api.get(
        `${BASE_URL}/departments/${departmentId}/employees?${params}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching department employees:", error);
      toast.error("Failed to fetch department employees");
      throw error;
    }
  },

  getDepartmentStats: async (departmentId: string) => {
    try {
      const response = await api.get(
        `${BASE_URL}/departments/${departmentId}/stats`
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching department stats:", error);
      toast.error("Failed to fetch department statistics");
      throw error;
    }
  },

  getAdminDepartments: async (): Promise<Department[]> => {
    try {
      const response = await api.get(`${BASE_URL}/admin/departments`);
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching admin departments:", error);
      toast.error("Failed to fetch departments");
      throw error;
    }
  },

  createAdminDepartment: async (
    data: DepartmentFormData
  ): Promise<Department> => {
    try {
      const response = await api.post(`${BASE_URL}/admin/departments`, data);
      toast.success("Department created successfully");
      return response.data.data;
    } catch (error) {
      console.error("Error creating admin department:", error);
      toast.error("Failed to create department");
      throw error;
    }
  },

  updateAdminDepartment: async (
    id: string,
    data: DepartmentFormData
  ): Promise<Department> => {
    try {
      const response = await api.put(
        `${BASE_URL}/admin/departments/${id}`,
        data
      );
      toast.success("Department updated successfully");
      return response.data.data;
    } catch (error) {
      console.error("Error updating admin department:", error);
      toast.error("Failed to update department");
      throw error;
    }
  },

  deleteAdminDepartment: async (id: string): Promise<void> => {
    try {
      await api.delete(`${BASE_URL}/admin/departments/${id}`);
      toast.success("Department deleted successfully");
    } catch (error) {
      console.error("Error deleting admin department:", error);
      toast.error("Failed to delete department");
      throw error;
    }
  },

  getAdminDepartmentById: async (id: string): Promise<Department> => {
    try {
      const response = await api.get(`${BASE_URL}/admin/departments/${id}`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching admin department:", error);
      toast.error("Failed to fetch department");
      throw error;
    }
  },
};
