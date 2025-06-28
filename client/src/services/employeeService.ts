import api from "./api";
import { isAxiosError } from "axios";
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
import { ISalaryGrade } from "../types/salary";

// Add ApiResponse type definition
interface ApiResponse<T> {
  success: boolean;
  message: string;
  employee?: T;
  data?: T;
  error?: {
    message: string;
    details?: string;
  };
  emailError?: {
    message: string;
    details: string;
  };
}

const BASE_URL = `/api`;
const SUPER_ADMIN_BASE_URL = `${BASE_URL}/super-admin`;

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
    const response = await api.get(`${SUPER_ADMIN_BASE_URL}/users`, {
      params,
    });
    return response.data;
  },

  //total users
  getTotalUsers: async (): Promise<number> => {
    const response = await api.get(`${SUPER_ADMIN_BASE_URL}/users`);
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
      const response = await api.get(url);

      return {
        employees: response.data.data || [],
        total: response.data.total || 0,
        page: response.data.page || 1,
        limit: response.data.limit || 10,
        totalPages: response.data.totalPages || 1,
      };
    } catch (error: unknown) {
      console.error("Error in getDepartmentEmployees:", error);
      if (isAxiosError(error)) {
        console.error("Error details:", {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
      }
      throw error;
    }
  },

  // Create new employee
  async createEmployee(employeeData: CreateEmployeeData): Promise<Employee> {
    try {
      const response = await api.post<ApiResponse<Employee>>(
        `${BASE_URL}/employee/create`,
        employeeData
      );

      if (!response.data.success || !response.data.employee) {
        throw new Error(response.data.message || "Failed to create employee");
      }

      return response.data.employee;
    } catch (error: any) {
      console.error("Error creating employee:", error);

      // Extract error message from response if available
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        error.message ||
        "Failed to create employee";

      // If there's an email error but employee was created
      if (error.response?.data?.emailError) {
        throw new Error(
          `${errorMessage} (Email Error: ${error.response.data.emailError.details})`
        );
      }

      throw new Error(errorMessage);
    }
  },

  // Update employee
  updateEmployee: async (id: string, data: Partial<Employee>) => {
    try {
      const response = await api.put(
        `${SUPER_ADMIN_BASE_URL}/users/${id}`,
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
    const response = await api.delete(`${SUPER_ADMIN_BASE_URL}/users/${id}`);
    return response.data;
  },

  // Transfer employee to different department
  transferEmployee: async (id: string, newDepartmentId: string) => {
    const response = await api.post(
      `${SUPER_ADMIN_BASE_URL}/employees/${id}/transfer`,
      { departmentId: newDepartmentId }
    );
    return response.data;
  },

  createDepartment: async (data: DepartmentFormData): Promise<Department> => {
    try {
      const response = await api.post(
        `${SUPER_ADMIN_BASE_URL}/departments`,
        data,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error creating department:", error);
      throw error;
    }
  },

  updateDepartment: async (
    id: string,
    data: DepartmentFormData
  ): Promise<Department> => {
    try {
      const response = await api.put(
        `${SUPER_ADMIN_BASE_URL}/departments/${id}`,
        data,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Failed to update department:", error);
      throw error;
    }
  },

  deleteDepartment: async (id: string): Promise<void> => {
    try {
      await api.delete(`${SUPER_ADMIN_BASE_URL}/departments/${id}`);
    } catch (error) {
      console.error("Failed to delete department:", error);
      throw error;
    }
  },

  getOnboardingEmployees: async (): Promise<OnboardingEmployee[]> => {
    try {
      const response = await api.get<{
        success: boolean;
        data: OnboardingEmployee[];
      }>(`${SUPER_ADMIN_BASE_URL}/onboarding-employees`);

      return response.data.data || [];
    } catch (error: unknown) {
      console.error("Error fetching onboarding employees:", error);
      if (isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || "Failed to fetch employees"
        );
      }
      throw error;
    }
  },

  async getEmployeeById(id: string): Promise<EmployeeDetails> {
    try {
      const response = await api.get(`${SUPER_ADMIN_BASE_URL}/users/${id}`);

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
    const response = await api.get(`${SUPER_ADMIN_BASE_URL}/onboarding-stats`);
    return response.data.data;
  },

  getOffboardingEmployees: async () => {
    try {
      const response = await api.get(
        `${SUPER_ADMIN_BASE_URL}/offboarding-employees`
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
      const response = await api.patch(
        `${SUPER_ADMIN_BASE_URL}/employees/${employeeId}/offboarding`,
        updates
      );
      return response.data;
    } catch (error) {
      console.error("Error updating offboarding status:", error);
      throw error;
    }
  },

  async archiveEmployee(employeeId: string) {
    try {
      const response = await api.post(
        `${SUPER_ADMIN_BASE_URL}/employees/${employeeId}/archive`,
        {}
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
      const response = await api.post(
        `${SUPER_ADMIN_BASE_URL}/employees/${employeeId}/remove-payroll`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to remove from payroll:", error);
      throw error;
    }
  },

  async generateFinalDocuments(employeeId: string) {
    try {
      const response = await api.post(
        `${SUPER_ADMIN_BASE_URL}/employees/${employeeId}/generate-documents`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to generate documents:", error);
      throw error;
    }
  },

  async revertToOnboarding(employeeId: string) {
    try {
      const response = await api.post(
        `${SUPER_ADMIN_BASE_URL}/employees/${employeeId}/revert-onboarding`,
        {}
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
      const response = await api.get(`${SUPER_ADMIN_BASE_URL}/leaves`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      throw error;
    }
  },

  async updateLeaveStatus(leaveId: string, status: string, notes?: string) {
    try {
      const response = await api.patch(
        `${SUPER_ADMIN_BASE_URL}/leaves/${leaveId}/status`,
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
      const response = await api.get(
        `${SUPER_ADMIN_BASE_URL}/leaves/statistics`
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching leave statistics:", error);
      throw error;
    }
  },

  // Payroll Processing
  getAllPayrollPeriods: async () => {
    const response = await api.get(`${SUPER_ADMIN_BASE_URL}/payroll/periods`);
    return response.data;
  },

  processPayroll: async (data: {
    employeeId: string;
    amount: number;
    period: string;
  }) => {
    const response = await api.post(
      `${SUPER_ADMIN_BASE_URL}/payroll/process`,
      data
    );
    return response.data;
  },

  // Allowance Management
  getAllowances: async () => {
    const response = await api.get(
      `${SUPER_ADMIN_BASE_URL}/payroll/allowances`
    );
    return response.data;
  },

  updateAllowance: async (
    id: string,
    data: { name: string; amount: number; description?: string }
  ) => {
    const response = await api.patch(
      `${SUPER_ADMIN_BASE_URL}/payroll/allowances/${id}`,
      data
    );
    return response.data;
  },

  // Bonus Management
  getBonuses: async () => {
    const response = await api.get(`${SUPER_ADMIN_BASE_URL}/payroll/bonuses`);
    return response.data;
  },

  createBonus: async (data: {
    name: string;
    amount: number;
    description?: string;
  }) => {
    const response = await api.post(
      `${SUPER_ADMIN_BASE_URL}/payroll/bonuses`,
      data
    );
    return response.data;
  },

  // Payroll Statistics
  getPayrollStats: async () => {
    const response = await api.get(
      `${SUPER_ADMIN_BASE_URL}/payroll/statistics`
    );
    return response.data;
  },

  useGetAdmins: () => {
    const { user } = useAuth();
    return useQuery<AdminResponse[]>({
      queryKey: ["admins"],
      queryFn: async () => {
        if (user?.role !== UserRole.SUPER_ADMIN) {
          return []; // Return empty array for non-super admins
        }
        const response = await api.get(`${SUPER_ADMIN_BASE_URL}/admins`);
        return response.data.admins || [];
      },
      enabled: user?.role === UserRole.SUPER_ADMIN,
    });
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const response = await api.get(`${BASE_URL}/employee/dashboard/stats`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
  },

  updateOnboardingStage: async (employeeId: string, stage: string) => {
    const response = await api.put(
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

      const response = await api.get(`${BASE_URL}/super-admin/users`, {
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
      const response = await api.get(
        `${BASE_URL}/super-admin/departments/${departmentId}`
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching department:", error);
      throw error;
    }
  },

  /**
   * Gets Heads of Departments by filtering admins
   * @returns Promise<HODResponse[]>
   */
  getHeadsOfDepartments: async (): Promise<HODResponse[]> => {
    try {
      const response = await api.get(`${BASE_URL}/super-admin/admins`);
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
    return useQuery<ISalaryGrade[]>({
      queryKey: ["salaryGrades"],
      queryFn: async () => {
        try {
          const result = await salaryStructureService.getAllSalaryGrades();
          return result || [];
        } catch (error) {
          console.error("Error fetching salary grades:", error);
          return [];
        }
      },
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
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

        const response = await api.get(`${BASE_URL}/admin/employees`, {
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
        const response = await api.get(url);

        return {
          employees: response.data.data || [],
          total: response.data.total || 0,
          page: response.data.page || 1,
          limit: response.data.limit || 10,
          totalPages: response.data.totalPages || 1,
        };
      } catch (error: unknown) {
        console.error(
          "❌ Admin Service: Error in getDepartmentEmployees:",
          error
        );
        if (isAxiosError(error)) {
          console.error("Error details:", {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
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
        const response = await api.post(`${BASE_URL}/admin/employees`, {
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
        const response = await api.put(
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
        const response = await api.delete(`${BASE_URL}/admin/employees/${id}`);
        return response.data;
      } catch (error) {
        console.error("Error deleting employee:", error);
        throw error;
      }
    },

    // Get employee by ID
    getEmployeeById: async (id: string): Promise<EmployeeDetails> => {
      try {
        const response = await api.get(`${BASE_URL}/admin/employees/${id}`);

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
        const response = await api.get(
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
      const response = await api.get(`${BASE_URL}/employee/profile`);

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

      const response = await api.post(
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
      const response = await api.get(`${BASE_URL}/employee/payslips`, {
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
      const response = await api.get(
        `${BASE_URL}/employee/payslips/${payslipId}`
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
      const response = await api.get(
        `${BASE_URL}/employee/payslips/view/${payrollId}`
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
