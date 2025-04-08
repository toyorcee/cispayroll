import axios from "axios";
import { toast } from "react-toastify";
import { Employee } from "../types/employee";

// Use the same BASE_URL pattern as adminPayrollService
const BASE_URL = "http://localhost:5000/api/admin";

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
  getDepartmentEmployees: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<DepartmentEmployeeResponse> => {
    try {
      const response = await axios.get(`${BASE_URL}/employees`, {
        params,
        withCredentials: true,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch employees");
      }

      return response.data;
    } catch (error: any) {
      console.error("Error fetching department employees:", error);
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
