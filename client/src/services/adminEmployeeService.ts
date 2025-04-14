import axios from "axios";
import { toast } from "react-toastify";
import { Employee } from "../types/employee";
import { UserRole } from "../types/auth";

// Use the same BASE_URL pattern as adminPayrollService
const BASE_URL = "http://localhost:5000/api/admin";
const SUPER_ADMIN_BASE_URL = "http://localhost:5000/api/super-admin";

// Helper function to determine if user is Super Admin
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
      // Use different endpoint for Super Admin
      const endpoint = isSuperAdmin(data.userRole)
        ? `${SUPER_ADMIN_BASE_URL}/active-employees?department=${data.departmentId}`
        : `${BASE_URL}/employees/department/${data.departmentId}`;

      console.log("Making request to:", endpoint); // Debug log
      const response = await axios.get(endpoint, {
        withCredentials: true,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch employees");
      }

      // Transform the response for Super Admin to match the expected format
      if (isSuperAdmin(data.userRole)) {
        return {
          success: true,
          data: response.data.data.filter(
            (emp: any) => emp.department?._id === data.departmentId
          ),
          pagination: {
            total: response.data.data.length,
            page: 1,
            pages: 1,
          },
        };
      }

      return response.data;
    } catch (error: any) {
      console.error("Error in getDepartmentEmployees:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch department employees"
      );
      throw error;
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
      toast.error(
        error.response?.data?.message || "Failed to fetch employee details"
      );
      throw error;
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
      toast.error(
        error.response?.data?.message || "Failed to fetch active employees"
      );
      throw error;
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

      toast.success("Employee updated successfully");
      return response.data.data;
    } catch (error: any) {
      console.error("Error updating employee:", error);
      toast.error(error.response?.data?.message || "Failed to update employee");
      throw error;
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
      toast.error(
        error.response?.data?.message || "Failed to fetch payroll history"
      );
      throw error;
    }
  },

  // Process payroll for multiple selected employees
  processMultipleEmployeesPayroll: async (data: {
    employeeIds: string[];
    month: number;
    year: number;
    frequency: string;
  }): Promise<any> => {
    try {
      const response = await axios.post(
        `${BASE_URL}/payroll/process-multiple`,
        data
      );

      if (response.data.success) {
        toast.success("Payroll processed successfully");
      } else {
        toast.error(response.data.message || "Failed to process payroll");
      }

      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to process payroll");
      throw error;
    }
  },
};
