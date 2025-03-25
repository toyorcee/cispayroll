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
import { UserRole } from "../types/auth";
import { api, handleApiResponse, handleApiError } from "../config/api";

interface AdminResponse {
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
}

// Define specific error types for employee operations
interface EmployeeError extends Error {
  code?: string;
  status?: number;
}

export const employeeService = {
  // Get employees with filtering and pagination
  getEmployees: async (params: {
    page: number;
    limit: number;
  }): Promise<EmployeeResponse> => {
    try {
      const response = await api.get("/super-admin/users", { params });
      return handleApiResponse(response);
    } catch (error) {
      const err = handleApiError(error) as EmployeeError;
      if (err.status === 403) {
        throw new Error("You don't have permission to view employees");
      }
      throw err;
    }
  },

  // Get employees for specific department
  getDepartmentEmployees: async (
    departmentId: string,
    filters: EmployeeFilters
  ): Promise<DepartmentEmployeeResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append("status", filters.status);
      queryParams.append("page", filters.page.toString());
      queryParams.append("limit", filters.limit.toString());

      const url = `/super-admin/departments/${departmentId}/employees?${queryParams}`;
      const response = await api.get(url);
      return handleApiResponse(response);
    } catch (error) {
      const err = handleApiError(error) as EmployeeError;
      if (err.status === 404) {
        throw new Error("Department not found");
      }
      if (err.status === 403) {
        throw new Error(
          "You don't have permission to view department employees"
        );
      }
      throw err;
    }
  },

  // Create new employee
  createEmployee: async (
    employeeData: CreateEmployeeData
  ): Promise<Employee> => {
    try {
      const formattedData = {
        ...employeeData,
        dateJoined: new Date(employeeData.dateJoined).toISOString(),
      };

      const response = await api.post("/employees/create", formattedData);
      return handleApiResponse(response);
    } catch (error) {
      const err = handleApiError(error) as EmployeeError;
      if (err.status === 400) {
        throw new Error("Invalid employee data provided");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to create employees");
      }
      if (err.status === 409) {
        throw new Error("Employee with this email already exists");
      }
      throw err;
    }
  },

  // Update employee
  updateEmployee: async (id: string, employeeData: Partial<Employee>) => {
    try {
      const response = await api.put(`/employees/${id}`, employeeData);
      return handleApiResponse(response);
    } catch (error) {
      const err = handleApiError(error) as EmployeeError;
      if (err.status === 404) {
        throw new Error("Employee not found");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to update employees");
      }
      if (err.status === 400) {
        throw new Error("Invalid employee update data provided");
      }
      throw err;
    }
  },

  // Delete employee
  deleteEmployee: async (id: string) => {
    try {
      const response = await api.delete(`/employees/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      const err = handleApiError(error) as EmployeeError;
      if (err.status === 404) {
        throw new Error("Employee not found");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to delete employees");
      }
      if (err.status === 400) {
        throw new Error("Cannot delete employee: may be in active use");
      }
      throw err;
    }
  },

  // Transfer employee to different department
  transferEmployee: async (id: string, newDepartmentId: string) => {
    try {
      const response = await api.post(`/employees/${id}/transfer`, {
        departmentId: newDepartmentId,
      });
      return handleApiResponse(response);
    } catch (error) {
      const err = handleApiError(error) as EmployeeError;
      if (err.status === 404) {
        throw new Error("Employee or department not found");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to transfer employees");
      }
      if (err.status === 400) {
        throw new Error("Cannot transfer employee at this time");
      }
      throw err;
    }
  },

  // Department Management
  getDepartments: async (): Promise<DepartmentBasic[]> => {
    try {
      const response = await api.get("/super-admin/departments");
      const data = handleApiResponse<DepartmentBasic[]>(response);
      return data.map((dept) => ({
        ...dept,
        id: dept._id,
      }));
    } catch (error) {
      const err = handleApiError(error) as EmployeeError;
      if (err.status === 403) {
        throw new Error("You don't have permission to view departments");
      }
      throw err;
    }
  },

  createDepartment: async (data: DepartmentFormData): Promise<Department> => {
    try {
      const response = await api.post("/super-admin/departments", data);
      const departmentData = handleApiResponse<Department>(response);
      return {
        ...departmentData,
        id: departmentData._id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      const err = handleApiError(error) as EmployeeError;
      if (err.status === 400) {
        throw new Error("Invalid department data provided");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to create departments");
      }
      if (err.status === 409) {
        throw new Error("Department with this name already exists");
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
      const err = handleApiError(error) as EmployeeError;
      if (err.status === 404) {
        throw new Error("Department not found");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to update departments");
      }
      if (err.status === 400) {
        throw new Error("Invalid department update data provided");
      }
      throw err;
    }
  },

  deleteDepartment: async (id: string): Promise<void> => {
    try {
      await api.delete(`/super-admin/departments/${id}`);
    } catch (error) {
      const err = handleApiError(error) as EmployeeError;
      if (err.status === 404) {
        throw new Error("Department not found");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to delete departments");
      }
      if (err.status === 400) {
        throw new Error("Cannot delete department: may have active employees");
      }
      throw err;
    }
  },

  // Onboarding Management
  getOnboardingEmployees: async (): Promise<OnboardingEmployee[]> => {
    try {
      const response = await api.get("/super-admin/onboarding-employees");
      return handleApiResponse(response);
    } catch (error) {
      const err = handleApiError(error) as EmployeeError;
      if (err.status === 403) {
        throw new Error(
          "You don't have permission to view onboarding employees"
        );
      }
      throw err;
    }
  },

  getEmployeeById: async (id: string): Promise<Partial<Employee>> => {
    try {
      const response = await api.get(`/employees/${id}`);
      const employee = handleApiResponse<Employee>(response);

      // Ensure dates are properly formatted
      if (employee.dateJoined) {
        employee.dateJoined = new Date(employee.dateJoined).toISOString();
      }
      if (employee.startDate) {
        employee.startDate = new Date(employee.startDate).toISOString();
      }

      return employee;
    } catch (error) {
      const err = handleApiError(error) as EmployeeError;
      if (err.status === 404) {
        throw new Error("Employee not found");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to view employee details");
      }
      throw err;
    }
  },

  getOnboardingStats: async (): Promise<OnboardingStats> => {
    try {
      const response = await api.get("/super-admin/onboarding-stats");
      return handleApiResponse(response);
    } catch (error) {
      const err = handleApiError(error) as EmployeeError;
      if (err.status === 403) {
        throw new Error(
          "You don't have permission to view onboarding statistics"
        );
      }
      throw err;
    }
  },

  // Offboarding Management
  getOffboardingEmployees: async () => {
    try {
      const response = await api.get("/super-admin/offboarding-employees");
      return handleApiResponse(response);
    } catch (error) {
      const err = handleApiError(error) as EmployeeError;
      if (err.status === 403) {
        throw new Error(
          "You don't have permission to view offboarding employees"
        );
      }
      throw err;
    }
  },

  initiateOffboarding: async (employeeId: string) => {
    try {
      const response = await api.post(
        `/super-admin/employees/${employeeId}/offboard`,
        {}
      );
      return handleApiResponse(response);
    } catch (error) {
      const err = handleApiError(error) as EmployeeError;
      if (err.status === 404) {
        throw new Error("Employee not found");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to initiate offboarding");
      }
      if (err.status === 400) {
        throw new Error(
          "Cannot initiate offboarding: employee may be ineligible"
        );
      }
      throw err;
    }
  },

  updateOffboardingStatus: async (
    employeeId: string,
    updates: Partial<OffboardingDetails>
  ) => {
    try {
      const response = await api.patch(
        `/super-admin/employees/${employeeId}/offboarding`,
        updates
      );
      return handleApiResponse(response);
    } catch (error) {
      const err = handleApiError(error) as EmployeeError;
      if (err.status === 404) {
        throw new Error("Employee not found in offboarding process");
      }
      if (err.status === 403) {
        throw new Error(
          "You don't have permission to update offboarding status"
        );
      }
      if (err.status === 400) {
        throw new Error("Invalid offboarding update data provided");
      }
      throw err;
    }
  },

  archiveEmployee: async (employeeId: string) => {
    try {
      const response = await api.post(
        `/super-admin/employees/${employeeId}/archive`,
        {}
      );
      return handleApiResponse(response);
    } catch (error) {
      const err = handleApiError(error) as EmployeeError;
      if (err.status === 404) {
        throw new Error("Employee not found");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to archive employees");
      }
      if (err.status === 400) {
        throw new Error("Cannot archive employee: may be in active use");
      }
      throw err;
    }
  },

  removeFromPayroll: async (employeeId: string) => {
    try {
      const response = await api.post(
        `/super-admin/employees/${employeeId}/remove-payroll`
      );
      return handleApiResponse(response);
    } catch (error) {
      const err = handleApiError(error) as EmployeeError;
      if (err.status === 404) {
        throw new Error("Employee not found");
      }
      if (err.status === 403) {
        throw new Error(
          "You don't have permission to remove employees from payroll"
        );
      }
      if (err.status === 400) {
        throw new Error(
          "Cannot remove employee from payroll: may have pending transactions"
        );
      }
      throw err;
    }
  },

  generateFinalDocuments: async (employeeId: string) => {
    try {
      const response = await api.post(
        `/super-admin/employees/${employeeId}/generate-documents`
      );
      return handleApiResponse(response);
    } catch (error) {
      const err = handleApiError(error) as EmployeeError;
      if (err.status === 404) {
        throw new Error("Employee not found");
      }
      if (err.status === 403) {
        throw new Error(
          "You don't have permission to generate final documents"
        );
      }
      if (err.status === 400) {
        throw new Error(
          "Cannot generate documents: offboarding process incomplete"
        );
      }
      throw err;
    }
  },

  revertToOnboarding: async (employeeId: string) => {
    try {
      const response = await api.post(
        `/super-admin/employees/${employeeId}/revert-onboarding`,
        {}
      );
      return handleApiResponse(response);
    } catch (error) {
      const err = handleApiError(error) as EmployeeError;
      if (err.status === 404) {
        throw new Error("Employee not found");
      }
      if (err.status === 403) {
        throw new Error(
          "You don't have permission to revert onboarding status"
        );
      }
      if (err.status === 400) {
        throw new Error("Cannot revert to onboarding: invalid current status");
      }
      throw err;
    }
  },

  // Leave Management
  getAllLeaveRequests: async () => {
    try {
      const response = await api.get("/super-admin/leaves");
      return handleApiResponse(response);
    } catch (error) {
      const err = handleApiError(error) as EmployeeError;
      if (err.status === 403) {
        throw new Error("You don't have permission to view leave requests");
      }
      throw err;
    }
  },

  updateLeaveStatus: async (
    leaveId: string,
    status: string,
    notes?: string
  ) => {
    try {
      const response = await api.patch(
        `/super-admin/leaves/${leaveId}/status`,
        { status, notes }
      );
      return handleApiResponse(response);
    } catch (error) {
      const err = handleApiError(error) as EmployeeError;
      if (err.status === 404) {
        throw new Error("Leave request not found");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to update leave status");
      }
      if (err.status === 400) {
        throw new Error("Invalid leave status update");
      }
      throw err;
    }
  },

  getLeaveStatistics: async () => {
    try {
      const response = await api.get("/super-admin/leaves/statistics");
      return handleApiResponse(response);
    } catch (error) {
      const err = handleApiError(error) as EmployeeError;
      if (err.status === 403) {
        throw new Error("You don't have permission to view leave statistics");
      }
      throw err;
    }
  },

  // Payroll Processing
  getAllPayrollPeriods: async () => {
    try {
      const response = await api.get("/super-admin/payroll/periods");
      return handleApiResponse(response);
    } catch (error) {
      const err = handleApiError(error) as EmployeeError;
      if (err.status === 403) {
        throw new Error("You don't have permission to view payroll periods");
      }
      throw err;
    }
  },

  processPayroll: async (data: any) => {
    try {
      const response = await api.post("/super-admin/payroll/process", data);
      return handleApiResponse(response);
    } catch (error) {
      const err = handleApiError(error) as EmployeeError;
      if (err.status === 403) {
        throw new Error("You don't have permission to process payroll");
      }
      if (err.status === 400) {
        throw new Error("Invalid payroll processing data");
      }
      if (err.status === 409) {
        throw new Error("Payroll for this period has already been processed");
      }
      throw err;
    }
  },

  // Allowance Management
  getAllowances: async () => {
    try {
      const response = await api.get("/super-admin/payroll/allowances");
      return handleApiResponse(response);
    } catch (error) {
      const err = handleApiError(error) as EmployeeError;
      if (err.status === 403) {
        throw new Error("You don't have permission to view allowances");
      }
      throw err;
    }
  },

  updateAllowance: async (id: string, data: any) => {
    try {
      const response = await api.patch(
        `/super-admin/payroll/allowances/${id}`,
        data
      );
      return handleApiResponse(response);
    } catch (error) {
      const err = handleApiError(error) as EmployeeError;
      if (err.status === 404) {
        throw new Error("Allowance not found");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to update allowances");
      }
      if (err.status === 400) {
        throw new Error("Invalid allowance update data");
      }
      throw err;
    }
  },

  // Bonus Management
  getBonuses: async () => {
    try {
      const response = await api.get("/super-admin/payroll/bonuses");
      return handleApiResponse(response);
    } catch (error) {
      const err = handleApiError(error) as EmployeeError;
      if (err.status === 403) {
        throw new Error("You don't have permission to view bonuses");
      }
      throw err;
    }
  },

  createBonus: async (data: any) => {
    try {
      const response = await api.post("/super-admin/payroll/bonuses", data);
      return handleApiResponse(response);
    } catch (error) {
      const err = handleApiError(error) as EmployeeError;
      if (err.status === 403) {
        throw new Error("You don't have permission to create bonuses");
      }
      if (err.status === 400) {
        throw new Error("Invalid bonus data provided");
      }
      throw err;
    }
  },

  // Payroll Statistics
  getPayrollStats: async () => {
    try {
      const response = await api.get("/super-admin/payroll/statistics");
      return handleApiResponse(response);
    } catch (error) {
      const err = handleApiError(error) as EmployeeError;
      if (err.status === 403) {
        throw new Error("You don't have permission to view payroll statistics");
      }
      throw err;
    }
  },

  getAdmins: async (): Promise<AdminResponse[]> => {
    try {
      const response = await api.get("/super-admin/admins");
      return handleApiResponse(response);
    } catch (error) {
      const err = handleApiError(error) as EmployeeError;
      if (err.status === 403) {
        throw new Error("You don't have permission to view administrators");
      }
      throw err;
    }
  },

  updateOnboardingStage: async (employeeId: string, stage: string) => {
    try {
      const response = await api.put(
        `/employees/${employeeId}/onboarding-stage`,
        { stage }
      );
      return handleApiResponse(response);
    } catch (error) {
      const err = handleApiError(error) as EmployeeError;
      if (err.status === 404) {
        throw new Error("Employee not found");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to update onboarding stage");
      }
      if (err.status === 400) {
        throw new Error("Invalid stage or cannot update to this stage");
      }
      if (err.status === 409) {
        throw new Error("Cannot update stage: previous tasks are incomplete");
      }
      throw err;
    }
  },
};
