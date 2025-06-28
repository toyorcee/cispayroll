import api from "./api";
import { isAxiosError } from "axios";
import { toast } from "react-toastify";
import type { IBonus, BonusType } from "../types/payroll";

const BASE_URL = `/api`;

interface CreateBonusData {
  employee: string;
  type: BonusType;
  amount: number;
  description?: string;
  department?: string;
  paymentDate: Date;
}

interface CreatePersonalBonusData {
  amount: number;
  reason: string;
  paymentDate: Date;
  type: string;
}

interface BonusFilters {
  page?: number;
  limit?: number;
  employee?: string;
  departmentId?: string;
  status?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}

export interface BonusResponse {
  _id: string;
  employee: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    fullName: string;
    id: string;
    profileImageUrl: string;
  };
  type: string;
  amount: number;
  reason: string;
  paymentDate: string;
  approvalStatus: string;
  approvedBy?: {
    _id: string;
    fullName: string;
    id: string;
    profileImageUrl: string;
  };
  approvedAt?: string;
  department?: {
    _id: string;
    name: string;
  };
  taxable: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface MyBonusResponse {
  success: boolean;
  data: {
    bonuses: BonusResponse[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
    monthlyStats: {
      requested: number;
      remaining: number;
      limit: number;
    };
  };
  message: string;
}

export const bonusService = {
  createBonus: async (data: Partial<IBonus>): Promise<{ data: IBonus }> => {
    try {
      const response = await api.post(`${BASE_URL}/bonus/personal`, data);
      return response.data;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        const errorMessage = isAxiosError(error)
          ? error.response?.data?.message || "Failed to create bonus"
          : "An unexpected error occurred";
        toast.error(errorMessage);
      } else {
        toast.error("An unexpected error occurred");
      }
      throw error;
    }
  },

  createPersonalBonus: async (
    data: CreatePersonalBonusData
  ): Promise<{ data: IBonus; message: string }> => {
    try {
      const response = await api.post(`${BASE_URL}/bonus/personal`, data);
      return response.data;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message ||
          "Failed to create personal bonus request";
        toast.error(errorMessage);
      } else {
        toast.error("An unexpected error occurred");
      }
      throw error;
    }
  },

  getMyBonuses: async (
    page: number = 1,
    limit: number = 10
  ): Promise<MyBonusResponse> => {
    try {
      const response = await api.get(`${BASE_URL}/bonus/my`, {
        params: { page, limit },
      });
      return response.data;
    } catch (error: any) {
      console.error("Error fetching personal bonuses:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch personal bonuses"
      );
      throw error;
    }
  },

  cancelPersonalBonus: async (bonusId: string): Promise<any> => {
    try {
      const response = await api.put(
        `${BASE_URL}/bonus/personal/${bonusId}/cancel`
      );
      return response.data;
    } catch (error: any) {
      console.error("Error cancelling bonus:", error);
      toast.error(
        error.response?.data?.message || "Failed to cancel bonus request"
      );
      throw error;
    }
  },

  getBonusById: async (id: string): Promise<{ data: IBonus }> => {
    try {
      const response = await api.get(`${BASE_URL}/bonus/requests/${id}`);
      return response.data;
    } catch (error: unknown) {
      console.error("❌ Error fetching bonus:", error);
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to fetch bonus");
      } else {
        toast.error("An unexpected error occurred");
      }
      throw error;
    }
  },

  getAllBonuses: async ({
    page = 1,
    limit = 10,
    employee,
    departmentId,
    status,
    type,
    startDate,
    endDate,
  }: BonusFilters = {}): Promise<{
    data: { bonuses: IBonus[]; pagination: any };
  }> => {
    const params: any = { page, limit };
    if (employee) params.employee = employee;
    if (departmentId) params.departmentId = departmentId;
    if (status) params.status = status;
    if (type) params.type = type;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    try {
      const response = await api.get(`${BASE_URL}/bonus/requests`, {
        params,
      });
      return response.data;
    } catch (error: unknown) {
      console.error("❌ Error fetching bonuses:", error);
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to fetch bonuses");
      } else {
        toast.error("An unexpected error occurred");
      }
      throw error;
    }
  },

  updateBonus: async (
    id: string,
    data: Partial<CreateBonusData>
  ): Promise<{ data: IBonus }> => {
    try {
      const response = await api.patch(
        `${BASE_URL}/bonus/requests/${id}`,
        data
      );
      return response.data;
    } catch (error: unknown) {
      console.error("❌ Error updating bonus:", error);
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to update bonus");
      } else {
        toast.error("An unexpected error occurred");
      }
      throw error;
    }
  },

  approveBonus: async (
    id: string
    // approved: boolean
  ): Promise<{ data: IBonus }> => {
    try {
      const response = await api.put(
        `${BASE_URL}/bonus/requests/${id}/approve`
      );
      return response.data;
    } catch (error: unknown) {
      console.error("❌ Error approving bonus:", error);
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to approve bonus");
      } else {
        toast.error("An unexpected error occurred");
      }
      throw error;
    }
  },

  rejectBonus: async (
    id: string,
    rejectionReason: string
  ): Promise<{ data: IBonus }> => {
    try {
      const response = await api.put(
        `${BASE_URL}/bonus/requests/${id}/reject`,
        { rejectionReason }
      );
      return response.data;
    } catch (error: unknown) {
      console.error("❌ Error rejecting bonus:", error);
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to reject bonus");
      } else {
        toast.error("An unexpected error occurred");
      }
      throw error;
    }
  },

  deleteBonus: async (id: string) => {
    try {
      const response = await api.delete(`${BASE_URL}/bonus/requests/${id}`);
      return response.data;
    } catch (error: unknown) {
      console.error("❌ Error deleting bonus:", error);
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to delete bonus");
      } else {
        toast.error("An unexpected error occurred");
      }
      throw error;
    }
  },

  createDepartmentEmployeeBonus: async (data: {
    employeeId: string;
    amount: number;
    reason: string;
    paymentDate: string;
    type: string;
  }) => {
    try {
      const response = await api.post(
        `${BASE_URL}/bonus/department/employee`,
        data
      );
      return response.data;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Failed to create department employee bonus"
        );
      } else {
        toast.error("An unexpected error occurred");
      }
      throw error;
    }
  },

  createDepartmentWideBonus: async (data: {
    amount: number;
    reason: string;
    paymentDate: string;
    type: string;
    departmentId: string;
  }) => {
    try {
      const response = await api.post(`${BASE_URL}/bonus/department/all`, data);
      return response.data;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Failed to create department-wide bonus"
        );
      } else {
        toast.error("An unexpected error occurred");
      }
      throw error;
    }
  },

  approveBonusRequest: async (bonusId: string) => {
    const response = await api.put(
      `${BASE_URL}/bonus/requests/${bonusId}/approve`
    );
    return response.data;
  },

  rejectBonusRequest: async (bonusId: string, comment: string) => {
    const response = await api.put(
      `${BASE_URL}/bonus/requests/${bonusId}/reject`,
      { comment }
    );
    return response.data;
  },
};

export default bonusService;
