import axios from "axios";
import { toast } from "react-toastify";
import type {
  Allowance,
  CreateAllowanceRequest,
  AllowanceType,
} from "../types/allowance";

const BASE_URL = "/api/allowances";
axios.defaults.withCredentials = true;

export const allowanceService = {
  createAllowance: async (
    data: CreateAllowanceRequest,
    userRole: string
  ): Promise<{ data: Allowance }> => {
    try {
      const endpoint =
        userRole === "ADMIN"
          ? `/api/admin/allowances/request`
          : `/api/regular-user/allowances/request`;

      console.log("🔵 Using endpoint:", endpoint);
      console.log("📝 Request data:", data);

      const response = await axios.post(endpoint, data, {
        withCredentials: true,
      });
      return response.data;
    } catch (error: any) {
      console.error("❌ Error creating allowance:", error);
      toast.error(
        error.response?.data?.message || "Failed to create allowance"
      );
      throw error;
    }
  },

  getAllAllowances: async (
    userRole: string
  ): Promise<{ data: Allowance[] }> => {
    try {
      const endpoint =
        userRole === "ADMIN"
          ? `/api/admin/allowances`
          : `/api/regular-user/allowances`;

      const response = await axios.get(endpoint, {
        withCredentials: true,
      });
      return response.data;
    } catch (error: any) {
      console.error("❌ Error fetching allowances:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch allowances"
      );
      throw error;
    }
  },

  getAllowanceById: async (
    id: string,
    userRole: string
  ): Promise<{ data: Allowance }> => {
    try {
      const endpoint =
        userRole === "ADMIN"
          ? `/api/admin/allowances/${id}`
          : `/api/regular-user/allowances/${id}`;

      const response = await axios.get(endpoint, {
        withCredentials: true,
      });
      return response.data;
    } catch (error: any) {
      console.error("❌ Error fetching allowance:", error);
      toast.error(error.response?.data?.message || "Failed to fetch allowance");
      throw error;
    }
  },

  updateAllowance: async (
    id: string,
    data: Partial<CreateAllowanceRequest>,
    userRole: string
  ): Promise<{ data: Allowance }> => {
    try {
      const endpoint =
        userRole === "ADMIN"
          ? `/api/admin/allowances/${id}`
          : `/api/regular-user/allowances/${id}`;

      const response = await axios.put(endpoint, data, {
        withCredentials: true,
      });
      toast.success("Allowance updated successfully");
      return response.data;
    } catch (error: any) {
      console.error("❌ Error updating allowance:", error);
      toast.error(
        error.response?.data?.message || "Failed to update allowance"
      );
      throw error;
    }
  },

  approveAllowance: async (
    id: string,
    userRole: string
  ): Promise<{ data: Allowance }> => {
    try {
      const endpoint =
        userRole === "ADMIN"
          ? `/api/admin/allowances/${id}/approve`
          : `/api/regular-user/allowances/${id}/approve`;

      const response = await axios.patch(
        endpoint,
        {},
        { withCredentials: true }
      );
      toast.success("Allowance approved successfully");
      return response.data;
    } catch (error: any) {
      console.error("❌ Error approving allowance:", error);
      toast.error(
        error.response?.data?.message || "Failed to approve allowance"
      );
      throw error;
    }
  },

  rejectAllowance: async (
    id: string,
    reason: string,
    userRole: string
  ): Promise<{ data: Allowance }> => {
    try {
      const endpoint =
        userRole === "ADMIN"
          ? `/api/admin/allowances/${id}/reject`
          : `/api/regular-user/allowances/${id}/reject`;

      const response = await axios.patch(
        endpoint,
        { reason },
        { withCredentials: true }
      );
      toast.success("Allowance rejected successfully");
      return response.data;
    } catch (error: any) {
      console.error("❌ Error rejecting allowance:", error);
      toast.error(
        error.response?.data?.message || "Failed to reject allowance"
      );
      throw error;
    }
  },

  getAllowanceHistory: async (
    userRole: string
  ): Promise<{ data: Allowance[] }> => {
    try {
      const endpoint =
        userRole === "ADMIN"
          ? `/api/admin/allowances/history`
          : `/api/regular-user/allowances/history`;

      const response = await axios.get(endpoint, {
        withCredentials: true,
      });
      return response.data;
    } catch (error: any) {
      console.error("❌ Error fetching allowance history:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch allowance history"
      );
      throw error;
    }
  },

  getDepartmentAllowances: async (): Promise<{ data: Allowance[] }> => {
    try {
      const response = await axios.get(`/api/admin/allowances`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error: any) {
      console.error("❌ Error fetching department allowances:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch department allowances"
      );
      throw error;
    }
  },

  createDepartmentAllowance: async (data: {
    departmentId: string;
    amount: string;
    reason: string;
    paymentDate: string;
    type: string;
  }): Promise<{ data: Allowance[]; message: string }> => {
    console.log("🔵 [AllowanceService] Creating department allowance:", {
      data,
      timestamp: new Date().toISOString(),
    });
    try {
      const response = await axios.post(
        `/api/allowances/department/all`,
        data,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log("✅ [AllowanceService] Department allowance created:", {
        response: response.data,
        timestamp: new Date().toISOString(),
      });
      return response.data;
    } catch (error: any) {
      console.error(
        "❌ [AllowanceService] Error creating department allowance:",
        {
          error,
          data,
          timestamp: new Date().toISOString(),
        }
      );
      console.error("Full error details:", {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });
      toast.error(
        error.response?.data?.message || "Failed to create department allowance"
      );
      throw error;
    }
  },

  updateDepartmentAllowance: async (
    id: string,
    data: Partial<CreateAllowanceRequest>
  ): Promise<{ data: Allowance }> => {
    try {
      const response = await axios.put(`/api/admin/allowances/${id}`, data, {
        withCredentials: true,
      });
      toast.success("Department allowance updated successfully");
      return response.data;
    } catch (error: any) {
      console.error("❌ Error updating department allowance:", error);
      toast.error(
        error.response?.data?.message || "Failed to update department allowance"
      );
      throw error;
    }
  },

  toggleAllowanceStatus: async (id: string): Promise<{ data: Allowance }> => {
    try {
      const response = await axios.patch(
        `/api/admin/allowances/${id}/toggle-status`,
        {},
        { withCredentials: true }
      );
      toast.success("Allowance status toggled successfully");
      return response.data;
    } catch (error: any) {
      console.error("❌ Error toggling allowance status:", error);
      toast.error(
        error.response?.data?.message || "Failed to toggle allowance status"
      );
      throw error;
    }
  },

  approveDepartmentAllowance: async (
    id: string
  ): Promise<{ data: Allowance }> => {
    try {
      const response = await axios.patch(
        `/api/admin/allowances/${id}/approve`,
        {},
        { withCredentials: true }
      );
      toast.success("Department allowance approved successfully");
      return response.data;
    } catch (error: any) {
      console.error("❌ Error approving department allowance:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to approve department allowance"
      );
      throw error;
    }
  },

  rejectDepartmentAllowance: async (
    id: string,
    reason: string
  ): Promise<{ data: Allowance }> => {
    try {
      const response = await axios.patch(
        `/api/admin/allowances/${id}/reject`,
        { reason },
        { withCredentials: true }
      );
      toast.success("Department allowance rejected successfully");
      return response.data;
    } catch (error: any) {
      console.error("❌ Error rejecting department allowance:", error);
      toast.error(
        error.response?.data?.message || "Failed to reject department allowance"
      );
      throw error;
    }
  },

  requestAdminAllowance: async (
    data: CreateAllowanceRequest
  ): Promise<{ data: Allowance }> => {
    try {
      const response = await axios.post(`/api/admin/allowances/request`, data, {
        withCredentials: true,
      });
      return response.data;
    } catch (error: any) {
      console.error("❌ Error requesting admin allowance:", error);
      toast.error(
        error.response?.data?.message || "Failed to request allowance"
      );
      throw error;
    }
  },

  createDepartmentEmployeeAllowance: async (data: {
    employeeId: string;
    amount: string;
    reason: string;
    paymentDate: string;
    type: string;
  }): Promise<{ data: Allowance; message: string }> => {
    console.log("🔵 [AllowanceService] Creating employee allowance:", {
      data,
      timestamp: new Date().toISOString(),
    });
    try {
      const response = await axios.post(
        `/api/allowances/department/employee`,
        data,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Employee allowance response:", response);
      return response.data;
    } catch (error: any) {
      console.error("❌ Error creating employee allowance:", error);
      console.error("Full error details:", {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });
      toast.error(
        error.response?.data?.message || "Failed to create employee allowance"
      );
      throw error;
    }
  },

  getAllowanceRequests: async (params: {
    page?: number;
    limit?: number;
    employee?: string;
    departmentId?: string;
    status?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    includeInactive?: boolean;
  }) => {
    const response = await axios.get(`${BASE_URL}/requests`, { params });
    return response.data;
  },

  createPersonalAllowance: async (data: {
    type: AllowanceType;
    amount: number;
    description: string;
  }) => {
    const response = await axios.post(`${BASE_URL}/personal`, data);
    return response.data;
  },

  getPersonalAllowances: async (params: { page?: number; limit?: number }) => {
    const response = await axios.get("/api/allowances/personal-requests", {
      params,
    });
    return response.data;
  },
};
