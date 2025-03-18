import axios from "axios";

// Use environment variable if available, fallback to localhost
const BASE_URL = "http://localhost:5000/api/super-admin";

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  location: string;
  email?: string;
  phone?: string;
  headOfDepartment?: string;
  status: "active" | "inactive";
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
      console.log("📥 Raw API response:", {
        fullResponse: response,
        data: response.data,
        departments: response.data?.data,
      });

      // Check if we have valid data before mapping
      if (!response.data?.data || !Array.isArray(response.data.data)) {
        console.error("Invalid departments data:", response.data);
        return [];
      }

      // Ensure we're returning string IDs
      const departments = response.data.data
        .map((dept: any) => {
          console.log("Processing department:", dept);
          if (!dept?._id) {
            console.error("Department missing _id:", dept);
            return null;
          }
          return {
            _id: dept._id.toString(),
            name: dept.name || "Unknown",
          };
        })
        .filter(Boolean); // Remove any null values

      console.log("✅ Processed departments:", departments);
      return departments;
    } catch (error) {
      console.error("❌ Error fetching departments:", error);
      throw error;
    }
  },

  // Add other department-related methods
};
