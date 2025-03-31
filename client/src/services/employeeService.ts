import axios from "axios";
import { QueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import {
  Employee,
  EmployeeFilters,
  CreateEmployeeData,
  OnboardingEmployee,
  OffboardingDetails,
  DepartmentBasic,
  EmployeeResponse,
  DepartmentEmployeeResponse,
} from "../types/employee";
import { Department, DepartmentFormData } from "../types/department";
import { OnboardingStats } from "../types/chart";
import { toast } from "react-toastify";
import { UserRole } from "../types/auth";
// import { api } from "./api";
import { DashboardStats } from "../data/dashboardData";
import { salaryStructureService } from "./salaryStructureService";

const BASE_URL = "http://localhost:5000/api";

// Set default axios config to always include credentials
axios.defaults.withCredentials = true;

export interface AdminResponse {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status:
    | "active"
    | "inactive"
    | "pending"
    | "suspended"
    | "terminated"
    | "offboarding";
  permissions: string[];
  department?: {
    _id: string;
    name: string;
    code: string;
  };
  position?: string;
}

interface HODResponse {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: {
    _id: string;
    name: string;
    code: string;
  };
  position: string;
}

export const EMPLOYEES_QUERY_KEY = ["employees"] as const;

/**
 * Service methods for employee-related operations
 * Note: HODs are fetched from /super-admin/admins and filtered client-side
 * This is the current working implementation - do not change without testing
 */
export const employeeService = {
  // Get employees with filtering and pagination
  getEmployees: async (params: {
    page: number;
    limit: number;
  }): Promise<EmployeeResponse> => {
    const response = await axios.get(`${BASE_URL}/super-admin/users`, {
      params,
    });
    return response.data;
  },

  //total users
  getTotalUsers: async (): Promise<number> => {
    const response = await axios.get(`${BASE_URL}/super-admin/users`);
    return response.data.length;
  },

  // Get employees for specific department
  getDepartmentEmployees: async (
    departmentId: string,
    filters: EmployeeFilters
  ): Promise<DepartmentEmployeeResponse> => {
    try {
      console.log("🔄 Service: Starting getDepartmentEmployees", {
        departmentId,
        filters,
      });

      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append("status", filters.status);
      queryParams.append("page", (filters.page || 1).toString());
      queryParams.append("limit", (filters.limit || 10).toString());

      const url = `${BASE_URL}/super-admin/departments/${departmentId}/employees?${queryParams}`;
      const response = await axios.get(url);

      return response.data.data;
    } catch (error) {
      console.error("❌ Service: Error in getDepartmentEmployees:", error);
      throw error;
    }
  },

  // Create new employee
  async createEmployee(employeeData: CreateEmployeeData): Promise<Employee> {
    try {
      // Ensure we're sending the exact structure expected by the API
      const response = await axios.post(`${BASE_URL}/employees/create`, {
        firstName: employeeData.firstName,
        lastName: employeeData.lastName,
        email: employeeData.email,
        phone: employeeData.phone,
        role: employeeData.role,
        position: employeeData.position,
        gradeLevel: employeeData.gradeLevel,
        workLocation: employeeData.workLocation,
        dateJoined: employeeData.dateJoined,
        department: employeeData.department,
      });
      return response.data;
    } catch (error) {
      console.error("Error creating employee:", error);
      throw error;
    }
  },

  // Update employee
  updateEmployee: async (id: string, data: Partial<Employee>) => {
    try {
      const response = await axios.put(
        `${BASE_URL}/super-admin/users/${id}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error("Error updating employee:", error);
      throw error;
    }
  },

  // Delete employee
  deleteEmployee: async (id: string) => {
    const response = await axios.delete(`${BASE_URL}/super-admin/users/${id}`);
    return response.data;
  },

  // Transfer employee to different department
  transferEmployee: async (id: string, newDepartmentId: string) => {
    const response = await axios.post(
      `${BASE_URL}/super-admin/employees/${id}/transfer`,
      { departmentId: newDepartmentId }
    );
    return response.data;
  },

  createDepartment: async (data: DepartmentFormData): Promise<Department> => {
    try {
      const response = await axios.post(
        `${BASE_URL}/super-admin/departments`,
        data,
        { withCredentials: true }
      );
      return {
        ...response.data.data,
        id: response.data.data._id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error("Failed to create department:", error);
      throw error;
    }
  },

  updateDepartment: async (
    id: string,
    data: DepartmentFormData
  ): Promise<Department> => {
    try {
      const response = await axios.put(
        `${BASE_URL}/super-admin/departments/${id}`,
        data,
        { withCredentials: true }
      );
      return {
        ...response.data.data,
        id: response.data.data._id,
        createdAt: new Date(response.data.data.createdAt),
        updatedAt: new Date(response.data.data.updatedAt),
      };
    } catch (error) {
      console.error("Failed to update department:", error);
      throw error;
    }
  },

  deleteDepartment: async (id: string): Promise<void> => {
    try {
      await axios.delete(`${BASE_URL}/super-admin/departments/${id}`, {
        withCredentials: true,
      });
    } catch (error) {
      console.error("Failed to delete department:", error);
      throw error;
    }
  },

  getOnboardingEmployees: async (): Promise<OnboardingEmployee[]> => {
    try {
      console.log("📤 Fetching onboarding employees");
      const response = await axios.get<{
        success: boolean;
        data: OnboardingEmployee[];
      }>(`${BASE_URL}/super-admin/onboarding-employees`);

      console.log("📥 Onboarding employees response:", response.data);

      // Return the data array from the response
      return response.data.data || [];
    } catch (error: unknown) {
      console.error("❌ Error fetching onboarding employees:", error);
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || "Failed to fetch employees"
        );
      } else {
        toast.error("Failed to fetch employees");
      }
      return []; // Return empty array on error
    }
  },

  async getEmployeeById(id: string): Promise<Partial<Employee>> {
    try {
      const response = await axios.get(`${BASE_URL}/employees/${id}`);
      const emp = response.data;

      // Ensure dates are properly formatted
      try {
        if (emp.dateJoined) {
          emp.dateJoined = new Date(emp.dateJoined).toISOString();
        }
        if (emp.startDate) {
          emp.startDate = new Date(emp.startDate).toISOString();
        }
      } catch {
        // If date parsing fails, use current date
        const currentDate = new Date().toISOString();
        emp.dateJoined = emp.dateJoined || currentDate;
        emp.startDate = emp.startDate || currentDate;
      }

      return emp;
    } catch (error) {
      console.error(`Error fetching employee ${id}:`, error);
      throw error;
    }
  },

  async getOnboardingStats(): Promise<OnboardingStats> {
    const response = await axios.get(
      `${BASE_URL}/super-admin/onboarding-stats`
    );
    return response.data.data;
  },

  async getOffboardingEmployees() {
    try {
      console.log("🔍 Calling getOffboardingEmployees API...");
      const response = await axios.get(
        `${BASE_URL}/super-admin/offboarding-employees`,
        { withCredentials: true }
      );
      console.log("📥 API Response:", response);

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to fetch offboarding employees"
        );
      }

      return response.data.data;
    } catch (error) {
      console.error("❌ Error in getOffboardingEmployees:", error);
      throw error;
    }
  },

  async initiateOffboarding(employeeId: string) {
    try {
      console.log("🔄 Initiating offboarding for:", employeeId);
      const response = await axios.post(
        `${BASE_URL}/super-admin/employees/${employeeId}/offboard`,
        {},
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to initiate offboarding"
        );
      }

      console.log("✅ Offboarding response:", response.data);
      return response.data;
    } catch (error: unknown) {
      console.error(
        "❌ Failed to initiate offboarding:",
        axios.isAxiosError(error)
          ? error.response?.data || error.message
          : String(error)
      );
      throw error;
    }
  },

  async updateOffboardingStatus(
    employeeId: string,
    updates: Partial<OffboardingDetails>
  ) {
    try {
      const response = await axios.patch(
        `${BASE_URL}/super-admin/employees/${employeeId}/offboarding`,
        updates,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating offboarding status:", error);
      throw error;
    }
  },

  async archiveEmployee(employeeId: string) {
    try {
      const response = await axios.post(
        `${BASE_URL}/super-admin/employees/${employeeId}/archive`,
        {},
        { withCredentials: true }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to archive employee");
      }

      return response.data.data;
    } catch (error) {
      console.error("Failed to archive employee:", error);
      throw error;
    }
  },

  async removeFromPayroll(employeeId: string) {
    try {
      const response = await axios.post(
        `${BASE_URL}/super-admin/employees/${employeeId}/remove-payroll`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to remove from payroll:", error);
      throw error;
    }
  },

  async generateFinalDocuments(employeeId: string) {
    try {
      const response = await axios.post(
        `${BASE_URL}/super-admin/employees/${employeeId}/generate-documents`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to generate documents:", error);
      throw error;
    }
  },

  async revertToOnboarding(employeeId: string) {
    try {
      const response = await axios.post(
        `${BASE_URL}/super-admin/employees/${employeeId}/revert-onboarding`,
        {},
        { withCredentials: true }
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to revert employee status"
        );
      }

      return response.data.data;
    } catch (error) {
      console.error("Failed to revert employee status:", error);
      throw error;
    }
  },

  async getAllLeaveRequests() {
    try {
      const response = await axios.get(`${BASE_URL}/super-admin/leaves`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      throw error;
    }
  },

  async updateLeaveStatus(leaveId: string, status: string, notes?: string) {
    try {
      const response = await axios.patch(
        `${BASE_URL}/super-admin/leaves/${leaveId}/status`,
        { status, notes }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating leave status:", error);
      throw error;
    }
  },

  async getLeaveStatistics() {
    try {
      const response = await axios.get(
        `${BASE_URL}/super-admin/leaves/statistics`
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching leave statistics:", error);
      throw error;
    }
  },

  // Payroll Processing
  getAllPayrollPeriods: async () => {
    const response = await axios.get(`${BASE_URL}/super-admin/payroll/periods`);
    return response.data;
  },

  processPayroll: async (data: {
    employeeId: string;
    amount: number;
    period: string;
  }) => {
    const response = await axios.post(
      `${BASE_URL}/super-admin/payroll/process`,
      data
    );
    return response.data;
  },

  // Allowance Management
  getAllowances: async () => {
    const response = await axios.get(
      `${BASE_URL}/super-admin/payroll/allowances`
    );
    return response.data;
  },

  updateAllowance: async (
    id: string,
    data: { name: string; amount: number; description?: string }
  ) => {
    const response = await axios.patch(
      `${BASE_URL}/super-admin/payroll/allowances/${id}`,
      data
    );
    return response.data;
  },

  // Bonus Management
  getBonuses: async () => {
    const response = await axios.get(`${BASE_URL}/super-admin/payroll/bonuses`);
    return response.data;
  },

  createBonus: async (data: {
    name: string;
    amount: number;
    description?: string;
  }) => {
    const response = await axios.post(
      `${BASE_URL}/super-admin/payroll/bonuses`,
      data
    );
    return response.data;
  },

  // Payroll Statistics
  getPayrollStats: async () => {
    const response = await axios.get(
      `${BASE_URL}/super-admin/payroll/statistics`
    );
    return response.data;
  },

  getAdmins: async (): Promise<AdminResponse[]> => {
    const response = await axios.get(`${BASE_URL}/super-admin/admins`);
    return response.data.data;
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const response = await axios.get(`${BASE_URL}/employees/dashboard/stats`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
  },

  updateOnboardingStage: async (employeeId: string, stage: string) => {
    const response = await axios.put(
      `${BASE_URL}/employees/${employeeId}/onboarding-stage`,
      { stage }
    );
    return response.data;
  },

  // async getPayrollTrends() {
  //   const response = await api.get("/api/dashboard/payroll-trends");
  //   return response.data;
  // },

  // async getDepartmentDistribution() {
  //   const response = await api.get("/api/dashboard/department-distribution");
  //   return response.data;
  // },

  // async getDepartmentPieData() {
  //   const response = await api.get("/api/dashboard/department-pie");
  //   return response.data;
  // },

  getAllEmployees: async (filters?: EmployeeFilters) => {
    try {
      console.log("Fetching employees from:", `${BASE_URL}/super-admin/users`);
      const defaultFilters = {
        page: 1,
        limit: 10,
        ...filters,
      };

      const response = await axios.get(`${BASE_URL}/super-admin/users`, {
        params: defaultFilters,
      });
      console.log("Employees response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching employees:", error);
      throw error;
    }
  },

  useGetEmployees: (filters?: EmployeeFilters) => {
    return useQuery({
      queryKey: [...EMPLOYEES_QUERY_KEY, filters],
      queryFn: () => employeeService.getAllEmployees(filters),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  },

  // Add a function to get department by ID
  getDepartmentById: async (departmentId: string): Promise<DepartmentBasic> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/super-admin/departments/${departmentId}`
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching department:", error);
      throw error;
    }
  },

  useGetAdmins: () => {
    return useQuery<AdminResponse[]>({
      queryKey: ["admins"],
      queryFn: async () => {
        const response = await axios.get(`${BASE_URL}/super-admin/admins`);
        // Make sure we always return an array, even if empty
        return response.data.admins || [];
      },
    });
  },

  /**
   * Gets Heads of Departments by filtering admins
   * @returns Promise<HODResponse[]>
   */
  getHeadsOfDepartments: async (): Promise<HODResponse[]> => {
    try {
      const response = await axios.get(`${BASE_URL}/super-admin/admins`);
      return response.data.admins.filter((admin: HODResponse) =>
        admin.position?.toLowerCase().includes("head of")
      );
    } catch (error) {
      console.error("Error fetching HODs:", error);
      throw error;
    }
  },

  useGetHODs: () => {
    return useQuery<HODResponse[]>({
      queryKey: ["hods"],
      queryFn: employeeService.getHeadsOfDepartments,
    });
  },

  useGetSalaryGrades: () => {
    return useQuery({
      queryKey: ["salaryGrades"],
      queryFn: salaryStructureService.getAllSalaryGrades,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
    });
  },
};
