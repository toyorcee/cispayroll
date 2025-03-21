import axios from "axios";

// Use environment variable if available, fallback to localhost
const BASE_URL = "/api/super-admin";

export interface Department {
  _id: string;
  id: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface DepartmentFormData {
  id?: string;
  name: string;
  code: string;
  description?: string;
  location?: string;
  headOfDepartment: string;
  status: "active" | "inactive";
}

export const departmentService = {
  createDepartment: async (data: DepartmentFormData) => {
    try {
      const response = await axios.post(`${BASE_URL}/departments`, data, {
        withCredentials: true,
      });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  getAllDepartments: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/departments`, {
        withCredentials: true,
      });
      return response.data.data.departments;
    } catch (error) {
      throw error;
    }
  },

  updateDepartment: async (id: string, data: DepartmentFormData) => {
    try {
      const response = await axios.put(`${BASE_URL}/departments/${id}`, data, {
        withCredentials: true,
      });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  deleteDepartment: async (id: string) => {
    try {
      const response = await axios.delete(`${BASE_URL}/departments/${id}`, {
        withCredentials: true,
      });
      return response.data.success;
    } catch (error) {
      throw error;
    }
  },
};
