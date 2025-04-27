import axios from "axios";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Employee,
  EmployeeFilters,
  CreateEmployeeData,
  OnboardingEmployee,
  OffboardingDetails,
  EmployeeResponse,
  DepartmentEmployeeResponse,
  EmployeeDetails,
} from "../types/employee";
import { Department, DepartmentFormData } from "../types/department";
import { OnboardingStats } from "../types/chart";
import { toast } from "react-toastify";
import { UserRole } from "../types/auth";
// import { api } from "./api";
import { DashboardStats } from "../data/dashboardData";
import { salaryStructureService } from "./salaryStructureService";
import { mapEmployeeToDetails } from "../utils/mappers";
import { useAuth } from "../context/AuthContext";

const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

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
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append("status", filters.status);
      queryParams.append("page", (filters.page || 1).toString());
      queryParams.append("limit", (filters.limit || 10).toString());

      const url = `${BASE_URL}/departments/${departmentId}/employees?${queryParams}`;
      const response = await axios.get(url);

      return {
        employees: response.data.data || [],
        total: response.data.total || 0,
        page: response.data.page || 1,
        limit: response.data.limit || 10,
        totalPages: response.data.totalPages || 1,
      };
    } catch (error) {
      console.error("Error in getDepartmentEmployees:", error);
      throw error;
    }
  },

  // Create new employee
  async createEmployee(employeeData: CreateEmployeeData): Promise<Employee> {
    try {
      const response = await axios.post(`${BASE_URL}/employee/create`, {
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
      const response = await axios.get<{
        success: boolean;
        data: OnboardingEmployee[];
      }>(`${BASE_URL}/super-admin/onboarding-employees`);

      return response.data.data || [];
    } catch (error: unknown) {
      console.error("Error fetching onboarding employees:", error);
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || "Failed to fetch employees"
        );
      } else {
        toast.error("Failed to fetch employees");
      }
      return [];
    }
  },

  async getEmployeeById(id: string): Promise<EmployeeDetails> {
    try {
      const response = await axios.get(`${BASE_URL}/super-admin/users/${id}`);

      if (!response.data || (!response.data.employee && !response.data.user)) {
        console.error("Invalid response format:", response.data);
        throw new Error("Invalid response format from server");
      }

      const employee = response.data.employee || response.data.user;

      const employeeCopy = { ...employee };

      if (employeeCopy.dateJoined) {
        employeeCopy.dateJoined = new Date(
          employeeCopy.dateJoined
        ).toISOString();
      }
      if (employeeCopy.startDate) {
        employeeCopy.startDate = new Date(employeeCopy.startDate).toISOString();
      }

      return mapEmployeeToDetails(employeeCopy);
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

  getOffboardingEmployees: async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/super-admin/offboarding-employees`,
        { withCredentials: true }
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to fetch offboarding employees"
        );
      }

      return response.data.data;
    } catch (error) {
      console.error("Error in getOffboardingEmployees:", error);
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
      const response = await axios.get(`${BASE_URL}/employee/dashboard/stats`);
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

  getAllEmployees: async (filters?: EmployeeFilters) => {
    try {
      console.log(
        "🔍 Super Admin Service: Fetching employees from:",
        `${BASE_URL}/super-admin/users`
      );
      const defaultFilters = {
        page: 1,
        limit: 10,
        ...filters,
      };

      const response = await axios.get(`${BASE_URL}/super-admin/users`, {
        params: defaultFilters,
      });
      console.log("✅ Super Admin Service: Employees response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Super Admin Service: Error fetching employees:", error);
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
  getDepartmentById: async (departmentId: string): Promise<Department> => {
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

  // ===== Admin-specific Operations =====
  /**
   * Admin-specific service methods for employee operations
   * These methods use the /admin endpoints instead of /super-admin
   */
  adminService: {
    // Get all employees with filtering and pagination
    getAllEmployees: async (filters?: EmployeeFilters) => {
      try {
        console.log(
          "🔍 Admin Service: Fetching employees from:",
          `${BASE_URL}/admin/employees`
        );
        const defaultFilters = {
          page: 1,
          limit: 10,
          ...filters,
        };

        const response = await axios.get(`${BASE_URL}/admin/employees`, {
          params: defaultFilters,
        });
        console.log("✅ Admin Service: Employees response:", response.data);
        return response.data;
      } catch (error) {
        console.error("❌ Admin Service: Error fetching employees:", error);
        throw error;
      }
    },

    // Get employees for specific department
    getDepartmentEmployees: async (
      departmentId: string,
      filters: EmployeeFilters
    ): Promise<DepartmentEmployeeResponse> => {
      try {
        console.log("🔄 Admin Service: Starting getDepartmentEmployees", {
          departmentId,
          filters,
        });

        const queryParams = new URLSearchParams();
        if (filters.status) queryParams.append("status", filters.status);
        queryParams.append("page", (filters.page || 1).toString());
        queryParams.append("limit", (filters.limit || 10).toString());

        const url = `${BASE_URL}/admin/departments/${departmentId}/employees?${queryParams}`;
        const response = await axios.get(url);

        return {
          employees: response.data.data || [],
          total: response.data.total || 0,
          page: response.data.page || 1,
          limit: response.data.limit || 10,
          totalPages: response.data.totalPages || 1,
        };
      } catch (error) {
        console.error(
          "❌ Admin Service: Error in getDepartmentEmployees:",
          error
        );
        if (axios.isAxiosError(error)) {
          console.error("Error details:", {
            status: error.response?.status,
            data: error.response?.data,
            url: error.config?.url,
          });
        }
        throw error;
      }
    },

    // React Query hook for admin employees
    useGetEmployees: (filters?: EmployeeFilters) => {
      return useQuery({
        queryKey: ["admin", "employees", filters],
        queryFn: () => employeeService.adminService.getAllEmployees(filters),
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    },

    // Create new employee
    createEmployee: async (
      employeeData: CreateEmployeeData
    ): Promise<Employee> => {
      try {
        console.log("Admin service creating employee with data:", employeeData);

        // Ensure we're sending the exact structure expected by the API
        const response = await axios.post(`${BASE_URL}/admin/employees`, {
          firstName: employeeData.firstName,
          lastName: employeeData.lastName,
          email: employeeData.email,
          phone: employeeData.phone,
          position: employeeData.position,
          gradeLevel: employeeData.gradeLevel,
          workLocation: employeeData.workLocation,
          dateJoined: employeeData.dateJoined,
        });

        console.log("Admin service create employee response:", response.data);
        return response.data.employee;
      } catch (error) {
        console.error("Error creating employee via admin service:", error);
        throw error;
      }
    },

    // Update employee
    updateEmployee: async (id: string, data: Partial<Employee>) => {
      try {
        const response = await axios.put(
          `${BASE_URL}/admin/employees/${id}`,
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
      try {
        const response = await axios.delete(
          `${BASE_URL}/admin/employees/${id}`
        );
        return response.data;
      } catch (error) {
        console.error("Error deleting employee:", error);
        throw error;
      }
    },

    // Get employee by ID
    getEmployeeById: async (id: string): Promise<EmployeeDetails> => {
      try {
        const response = await axios.get(`${BASE_URL}/admin/employees/${id}`);

        // Check if the response has the expected structure
        if (!response.data || !response.data.data) {
          console.error(
            "Invalid response format from admin endpoint:",
            response.data
          );
          throw new Error("Invalid response format from server");
        }

        const employee = response.data.data;

        // Create a copy of the employee object to avoid modifying the original
        const employeeCopy = { ...employee };

        if (employeeCopy.dateJoined) {
          employeeCopy.dateJoined = new Date(
            employeeCopy.dateJoined
          ).toISOString();
        }
        if (employeeCopy.startDate) {
          employeeCopy.startDate = new Date(
            employeeCopy.startDate
          ).toISOString();
        }

        return mapEmployeeToDetails(employeeCopy);
      } catch (error) {
        console.error(`Error fetching employee ${id}:`, error);
        throw error;
      }
    },

    // Get user by ID
    getUserById: async (userId: string) => {
      console.log(
        `LOG: Attempting fetch via adminService.getUserById for [${userId}]`
      );
      try {
        const response = await axios.get(
          `${BASE_URL}/super-admin/users/${userId}`
        );
        if (!response.data.success || !response.data.user) {
          throw new Error(
            response.data.message || `Admin: Failed to fetch user ${userId}`
          );
        }
        console.log(
          `LOG: Successfully fetched via adminService.getUserById for [${userId}]`
        );
        return response.data.user;
      } catch (error) {
        console.error(
          `LOG ERROR in adminService.getUserById for [${userId}]:`,
          error
        );
        throw error;
      }
    },

    // Renamed to be more specific
    useGetUserByIdForAdmin: (userId: string | undefined) => {
      console.log(`LOG: useGetUserByIdForAdmin called for [${userId}]`);
      return useQuery({
        queryKey: ["admin", "user", userId],
        queryFn: () => {
          if (!userId) throw new Error("User ID is required");
          return employeeService.adminService.getUserById(userId);
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
      });
    },
  },

  // --- Profile Management ---
  getUserProfile: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/employee/profile`);

      if (!response.data.success || !response.data.user) {
        throw new Error("Failed to fetch user profile data");
      }

      return response.data.user;
    } catch (error) {
      console.error("Error in getUserProfile:", error);
      throw error;
    }
  },

  // --- Hook for fetching user profiles ---
  useGetUserProfile: () => {
    const { user: authUser, loading: authLoading } = useAuth();

    return useQuery({
      queryKey: ["userProfile"],
      queryFn: () => employeeService.getUserProfile(),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      enabled: !authLoading && !!authUser,
    });
  },

  // --- Profile Image Upload ---
  updateProfileImage: async (file: File): Promise<{ profileImage: string }> => {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await axios.post(
        `${BASE_URL}/employee/profile/image`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to update profile image"
        );
      }

      return { profileImage: response.data.profileImage };
    } catch (error) {
      console.error("Error in updateProfileImage:", error);
      throw error;
    }
  },

  // --- Hook for profile image upload ---
  useUpdateProfileImage: () => {
    const queryClient = useQueryClient();
    const { refreshUser } = useAuth();

    return useMutation({
      mutationFn: (file: File) => employeeService.updateProfileImage(file),
      onSuccess: async () => {
        // Invalidate profile queries to refetch with new image
        await queryClient.invalidateQueries({ queryKey: ["userProfile"] });
        // Refresh the user data in the auth context
        await refreshUser();
      },
    });
  },

  // --- Payslip Management ---
  getOwnPayslips: async (params?: { page?: number; limit?: number }) => {
    try {
      const response = await axios.get(`${BASE_URL}/employees/payslips`, {
        params: {
          page: params?.page || 1,
          limit: params?.limit || 10,
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch payslips");
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching payslips:", error);
      throw error;
    }
  },

  getOwnPayslipById: async (payslipId: string) => {
    try {
      console.log("🔍 Fetching payslip by ID:", payslipId);
      const response = await axios.get(
        `${BASE_URL}/employees/payslips/${payslipId}`
      );
      return response.data.data;
    } catch (error) {
      console.error("❌ Error fetching payslip:", error);
      throw error;
    }
  },

  viewPayslip: async (payrollId: string) => {
    try {
      console.log("🔍 Viewing payslip for payroll:", payrollId);
      const response = await axios.get(
        `${BASE_URL}/employees/payslips/view/${payrollId}`
      );
      return response.data.data;
    } catch (error) {
      console.error("❌ Error viewing payslip:", error);
      throw error;
    }
  },

  // React Query hooks for payslip management
  useGetOwnPayslips: (options?: {
    enabled?: boolean;
    page?: number;
    limit?: number;
  }) => {
    return useQuery({
      queryKey: ["payslips", "own", options?.page, options?.limit],
      queryFn: () =>
        employeeService.getOwnPayslips({
          page: options?.page,
          limit: options?.limit,
        }),
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: options?.enabled === true, // Only enable if explicitly set to true
      refetchOnMount: false, // Disable refetching on mount
      refetchOnWindowFocus: false, // Disable refetching on window focus
    });
  },

  useGetOwnPayslipById: (
    payslipId: string,
    options?: { enabled?: boolean }
  ) => {
    return useQuery({
      queryKey: ["payslip", payslipId],
      queryFn: () => employeeService.getOwnPayslipById(payslipId),
      enabled: options?.enabled !== undefined ? options.enabled : !!payslipId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  },

  useViewPayslip: (payrollId: string) => {
    return useQuery({
      queryKey: ["payslip", "view", payrollId],
      queryFn: () => employeeService.viewPayslip(payrollId),
      enabled: !!payrollId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  },
};
