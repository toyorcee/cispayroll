import axios from "axios";
import { Employee } from "../types/employee";
import { UserRole } from "../types/auth";

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/admin`;
const SUPER_ADMIN_BASE_URL = `${import.meta.env.VITE_API_URL}/api/super-admin`;
axios.defaults.withCredentials = true;

const isSuperAdmin = (userRole?: string): boolean => {
  return userRole === UserRole.SUPER_ADMIN;
};

export interface DepartmentEmployeeResponse {
  success: boolean;
  data: Employee[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

export const adminEmployeeService = {
  // Get all employees in admin's department
  getDepartmentEmployees: async (data: {
    departmentId: string;
    userRole?: string;
  }): Promise<DepartmentEmployeeResponse> => {
    try {
      if (!data.departmentId) {
        throw new Error("Department ID is required");
      }

      // Use different endpoint for Super Admin
      const endpoint = isSuperAdmin(data.userRole)
        ? `${SUPER_ADMIN_BASE_URL}/departments/${data.departmentId}/employees`
        : `${BASE_URL}/departments/${data.departmentId}/employees`;

      console.log("🚀 Making request to endpoint:", endpoint);
      console.log("🔍 Request data:", data);

      const response = await axios.get(endpoint, {
        withCredentials: true,
      });

      console.log("✅ Response received:", response.data);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch employees");
      }

      return response.data;
    } catch (error: any) {
      console.error("❌ Error in getDepartmentEmployees:", {
        error,
        status: error.response?.status,
        message: error.response?.data?.message,
        endpoint: error.config?.url,
      });
      throw (
        error.response?.data?.message || "Failed to fetch department employees"
      );
    }
  },

  // Get single employee by ID
  getEmployeeById: async (employeeId: string): Promise<Employee> => {
    try {
      const response = await axios.get(`${BASE_URL}/employees/${employeeId}`, {
        withCredentials: true,
      });

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to fetch employee details"
        );
      }

      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching employee details:", error);
      throw error.response?.data?.message || "Failed to fetch employee details";
    }
  },

  // Get active employees (for payroll processing)
  getActiveEmployees: async (): Promise<Employee[]> => {
    try {
      const response = await axios.get(`${BASE_URL}/employees/active`, {
        withCredentials: true,
      });

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to fetch active employees"
        );
      }

      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching active employees:", error);
      throw error.response?.data?.message || "Failed to fetch active employees";
    }
  },

  // Update employee details
  updateEmployee: async (
    employeeId: string,
    data: Partial<Employee>
  ): Promise<Employee> => {
    try {
      const response = await axios.put(
        `${BASE_URL}/employees/${employeeId}`,
        data,
        { withCredentials: true }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to update employee");
      }

      return response.data.data;
    } catch (error: any) {
      console.error("Error updating employee:", error);
      throw error.response?.data?.message || "Failed to update employee";
    }
  },

  // Get employee payroll history
  getEmployeePayrollHistory: async (employeeId: string) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/employees/${employeeId}/payroll-history`,
        { withCredentials: true }
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to fetch payroll history"
        );
      }

      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching employee payroll history:", error);
      throw error.response?.data?.message || "Failed to fetch payroll history";
    }
  },
};
