import axios from "axios";
import { toast } from "react-toastify";
import type {
  Allowance,
  CreateAllowanceRequest,
  AllowancesListResponse,
} from "../types/allowance";

const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
axios.defaults.withCredentials = true;

export const allowanceService = {
  createAllowance: async (
    data: CreateAllowanceRequest,
    userRole: string
  ): Promise<{ data: Allowance }> => {
    try {
      const endpoint =
        userRole === "ADMIN"
          ? `${BASE_URL}/admin/allowances/request`
          : `${BASE_URL}/regular-user/allowances/request`;

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
          ? `${BASE_URL}/admin/allowances`
          : `${BASE_URL}/regular-user/allowances`;

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
          ? `${BASE_URL}/admin/allowances/${id}`
          : `${BASE_URL}/regular-user/allowances/${id}`;

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
          ? `${BASE_URL}/admin/allowances/${id}`
          : `${BASE_URL}/regular-user/allowances/${id}`;

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
          ? `${BASE_URL}/admin/allowances/${id}/approve`
          : `${BASE_URL}/regular-user/allowances/${id}/approve`;

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
          ? `${BASE_URL}/admin/allowances/${id}/reject`
          : `${BASE_URL}/regular-user/allowances/${id}/reject`;

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
          ? `${BASE_URL}/admin/allowances/history`
          : `${BASE_URL}/regular-user/allowances/history`;

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
      const response = await axios.get(`${BASE_URL}/admin/allowances`, {
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
    try {
      console.log("Making API call to create department allowance:", data);
      const response = await axios.post(
        `${BASE_URL}/allowances/department/all`,
        data,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Department allowance response:", response);
      return response.data;
    } catch (error: any) {
      console.error("❌ Error creating department allowance:", error);
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
      const response = await axios.put(
        `${BASE_URL}/admin/allowances/${id}`,
        data,
        {
          withCredentials: true,
        }
      );
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
        `${BASE_URL}/admin/allowances/${id}/toggle-status`,
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
        `${BASE_URL}/admin/allowances/${id}/approve`,
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
        `${BASE_URL}/admin/allowances/${id}/reject`,
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
      const response = await axios.post(
        `${BASE_URL}/admin/allowances/request`,
        data,
        {
          withCredentials: true,
        }
      );
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
    try {
      console.log("Making API call to create employee allowance:", data);
      const response = await axios.post(
        `${BASE_URL}/allowances/department/employee`,
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

  getAllowanceRequests: async (params?: {
    page?: number;
    limit?: number;
    employee?: string;
    departmentId?: string;
    status?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    includeInactive?: boolean;
  }): Promise<AllowancesListResponse> => {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.employee) queryParams.append("employee", params.employee);
    if (params?.departmentId)
      queryParams.append("departmentId", params.departmentId);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.type) queryParams.append("type", params.type);
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    if (params?.includeInactive)
      queryParams.append("includeInactive", params.includeInactive.toString());

    const response = await axios.get(
      `${BASE_URL}/allowances/requests?${queryParams.toString()}`
    );

    // Transform the response to match AllowancesListResponse
    return {
      success: true,
      message: "Allowances fetched successfully",
      data: response.data.data,
    };
  },
};
