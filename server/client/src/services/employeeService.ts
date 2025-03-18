import axios from "axios";
import {
  Employee,
  EmployeeFilters,
  CreateEmployeeData,
  OnboardingEmployee,
  OffboardingDetails,
  DepartmentBasic,
} from "../types/employee";
import { employees } from "../data/employees";
import { OnboardingStats } from "../types/chart";
import { toast } from "react-hot-toast";

const BASE_URL = "http://localhost:5000/api";

// Set default axios config to always include credentials
axios.defaults.withCredentials = true;

interface EmployeeResponse {
  data: Employee[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface DepartmentWithCount extends DepartmentBasic {
  employeeCount: number;
}

export const employeeService = {
  // Get employees with filtering and pagination
  getEmployees: async (filters: EmployeeFilters): Promise<EmployeeResponse> => {
    const { page = 1, limit = 10, search, department, status } = filters;

    let filteredEmployees = [...employees];

    if (status) {
      filteredEmployees = filteredEmployees.filter(
        (emp) => emp.status === status
      );
    }

    if (department) {
      filteredEmployees = filteredEmployees.filter(
        (emp) => emp.department.toLowerCase() === department.toLowerCase()
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredEmployees = filteredEmployees.filter(
        (emp) =>
          emp.firstName.toLowerCase().includes(searchLower) ||
          emp.lastName.toLowerCase().includes(searchLower) ||
          emp.email.toLowerCase().includes(searchLower) ||
          emp.department.toLowerCase().includes(searchLower) ||
          emp.position.toLowerCase().includes(searchLower)
      );
    }

    const total = filteredEmployees.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

    return {
      data: paginatedEmployees,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  // Get employees for specific department
  getDepartmentEmployees: async (
    departmentId: string,
    filters: EmployeeFilters
  ) => {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append("status", filters.status);
    if (filters.search) queryParams.append("search", filters.search);
    queryParams.append("page", filters.page.toString());
    queryParams.append("limit", filters.limit.toString());

    const response = await axios.get(
      `${BASE_URL}/employees/department/${departmentId}?${queryParams}`
    );
    return response.data;
  },

  // Create new employee
  async createEmployee(employeeData: CreateEmployeeData): Promise<Employee> {
    try {
      // Format the date without type checking
      const formattedData = {
        ...employeeData,
        dateJoined: new Date(employeeData.dateJoined).toISOString(),
      };

      const response = await axios.post(
        `${BASE_URL}/employees/create`,
        formattedData
      );
      return response.data;
    } catch (error) {
      console.error("Error creating employee:", error);
      throw error;
    }
  },

  // Update employee
  updateEmployee: async (id: string, employeeData: Partial<Employee>) => {
    const response = await axios.put(
      `${BASE_URL}/employees/${id}`,
      employeeData
    );
    return response.data;
  },

  // Delete employee
  deleteEmployee: async (id: string) => {
    const response = await axios.delete(`${BASE_URL}/employees/${id}`);
    return response.data;
  },

  // Transfer employee to different department
  transferEmployee: async (id: string, newDepartmentId: string) => {
    const response = await axios.post(`${BASE_URL}/employees/${id}/transfer`, {
      departmentId: newDepartmentId,
    });
    return response.data;
  },

  getDepartments: async (): Promise<DepartmentBasic[]> => {
    try {
      console.log("🔄 Fetching departments from API...");
      const response = await axios.get<{ data: DepartmentBasic[] }>(
        `${BASE_URL}/super-admin/departments`
      );
      console.log("✅ Departments fetched:", response.data);
      return response.data.data;
    } catch (error: any) {
      console.error("❌ Failed to fetch departments:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch departments"
      );
      throw error;
    }
  },

  createDepartment: async (data: { name: string; description?: string }) => {
    const response = await axios.post(`${BASE_URL}/departments`, data);
    return response.data;
  },

  updateDepartment: async (
    id: string,
    data: { name: string; description?: string }
  ) => {
    const response = await axios.put(`${BASE_URL}/departments/${id}`, data);
    return response.data;
  },

  deleteDepartment: async (id: string) => {
    const response = await axios.delete(`${BASE_URL}/departments/${id}`);
    return response.data;
  },

  async getOnboardingEmployees(): Promise<OnboardingEmployee[]> {
    try {
      console.log("🔍 Fetching onboarding employees...");
      const response = await axios.get(
        `${BASE_URL}/super-admin/onboarding-employees`,
        { withCredentials: true }
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to fetch onboarding employees"
        );
      }

      console.log("📥 Received employees:", response.data);
      return response.data.data;
    } catch (error) {
      console.error("❌ Error fetching onboarding employees:", error);
      throw error;
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
    } catch (error: any) {
      console.error(
        "❌ Failed to initiate offboarding:",
        error.response?.data || error.message
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

  processPayroll: async (data: any) => {
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

  updateAllowance: async (id: string, data: any) => {
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

  createBonus: async (data: any) => {
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
};
