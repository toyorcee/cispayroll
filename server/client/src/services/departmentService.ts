import axios from "axios";

// Use environment variable if available, fallback to localhost
const BASE_URL = "http://localhost:5000/api/super-admin";

export interface Department {
  _id: string;
  id: string;
  name: string;
  code: string;
  headOfDepartment?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  employeeCount: number;
}

export const departmentService = {
  createDepartment: async (data: Partial<Department>, token: string) => {
    try {
      const response = await axios.post(`${BASE_URL}/departments`, data, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error("Error creating department:", error);
      throw error;
    }
  },

  getAllDepartments: async () => {
    try {
      console.log("🔍 Fetching departments...");
      const response = await axios.get("/api/super-admin/departments", {
        withCredentials: true,
      });

      // The response now includes departments and totalCounts in data.data
      if (!response.data?.data?.departments) {
        console.error("Invalid departments data:", response.data);
        return [];
      }

      // Map the response to include both _id and id for compatibility
      const departments = response.data.data.departments.map((dept: any) => ({
        _id: dept._id,
        id: dept._id,
        name: dept.name,
        code: dept.code,
        headOfDepartment: dept.headOfDepartment,
        employeeCount: dept.employeeCounts.total, // Update this to use the new structure
      }));

      console.log("✅ Processed departments:", departments);
      return departments;
    } catch (error) {
      console.error("❌ Error fetching departments:", error);
      throw error;
    }
  },

  // Add other department-related methods
};
