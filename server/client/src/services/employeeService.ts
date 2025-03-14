import axios from "axios";
import { Employee, EmployeeFilters } from "../types/employee";
import { departments } from "../data/departments";
import { employees } from "../data/employees";

const BASE_URL = "http://localhost:5000/api";

// Export the interface
export interface DepartmentBasic {
  id: string;
  name: string;
  code: string;
  employeeCount?: number;
}

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
  createEmployee: async (employeeData: Partial<Employee>): Promise<any> => {
    try {
      const response = await axios.post(
        `${BASE_URL}/employees/create`,
        employeeData
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
      // If using fake data:
      const departmentCounts = employees.reduce((acc, emp) => {
        acc[emp.department] = (acc[emp.department] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return departments.map((dept) => ({
        id: dept.id,
        name: dept.name,
        code: dept.code,
        employeeCount: departmentCounts[dept.name] || dept.employeeCount || 0,
      }));

      // If using real API:
      // const response = await this.api.get('/departments');
      // return response.data;
    } catch (error) {
      console.error("Error fetching departments:", error);
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
};
