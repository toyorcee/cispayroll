import axios from "axios";
import { QueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { Department, DepartmentFormData } from "../types/department";
import { AdminResponse } from "./employeeService";
import { toast } from "react-toastify";

const BASE_URL = "http://localhost:5000/api";

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
  getAllDepartments: async (): Promise<Department[]> => {
    const response = await axios.get(`${BASE_URL}/departments`);
    return response.data.data;
  },

  createDepartment: async (data: DepartmentFormData): Promise<Department> => {
    try {
      const response = await axios.post(`${BASE_URL}/departments`, data, {
        withCredentials: true,
      });
      toast.success("Department created successfully!");
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || "Failed to create department"
        );
      }
      throw error;
    }
  },

  /**
   * Gets a department by ID
   * @param id Department ID
   * @returns Promise<Department>
   */
  getDepartmentById: async (id: string): Promise<Department> => {
    const response = await axios.get(`${BASE_URL}/departments/${id}`);
    return response.data.data;
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
      const response = await axios.put(`${BASE_URL}/departments/${id}`, data, {
        withCredentials: true,
      });
      toast.success("Department updated successfully!");
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || "Failed to update department"
        );
      }
      throw error;
    }
  },

  deleteDepartment: async (id: string): Promise<void> => {
    try {
      await axios.delete(`${BASE_URL}/departments/${id}`);
      toast.success("Department deleted successfully!");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || "Failed to delete department"
        );
      }
      throw error;
    }
  },

  useGetDepartments: () => {
    return useQuery<Department[]>({
      queryKey: DEPARTMENTS_QUERY_KEY,
      queryFn: departmentService.getAllDepartments,
    });
  },

  getDepartmentChartStats: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/departments/stats/charts`, {
        withCredentials: true,
      });
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
      const response = await axios.get(
        `${BASE_URL}/departments/stats/admin/${departmentId}`,
        {
          withCredentials: true,
        }
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  getUserStats: async (userId: string) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/departments/stats/user/${userId}`,
        {
          withCredentials: true,
        }
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
        const response = await axios.get(`${BASE_URL}/super-admin/admins`);
        return response.data.admins;
      },
    });
  },

  getChartStats: async (): Promise<ChartStats> => {
    try {
      const response = await axios.get<{ data: ChartStats }>(
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
      const response = await axios.get(
        `${BASE_URL}/admin/department/stats/charts`,
        {
          withCredentials: true,
        }
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
};
