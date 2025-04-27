import axios from "axios";
import { toast } from "react-toastify";

// Define types for user dashboard data
export interface UserDashboardStats {
  departmentSize: number;
  activeColleagues: number;
  departmentName: string;
  teamMembers: number;
  recentActivities: number;
  unreadNotifications: number;
  pendingApprovals: number;
  activeEmployees: number;
}

// Define types for user profile data
export interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employeeId: string;
  department: {
    _id: string;
    name: string;
    code: string;
  };
  position: string;
  joinDate: string;
  profileImage: string;
  status: string;
  role: string;
}

// Define types for leave requests
export interface LeaveRequest {
  _id: string;
  startDate: string;
  endDate: string;
  type: string;
  reason: string;
  status: string;
  approvedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Define types for allowances
export interface Allowance {
  _id: string;
  type: string;
  amount: number;
  frequency: string;
  startDate: string;
  endDate?: string;
  status: string;
  isActive: boolean;
  salaryGrade?: {
    _id: string;
    level: string;
    basicSalary: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Define types for deductions
export interface Deduction {
  _id: string;
  type: string;
  amount: number;
  frequency: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  department?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Define types for grouped deductions
export interface GroupedDeductions {
  statutory: Deduction[];
  voluntary: Deduction[];
}

// Add interface for processing statistics
export interface ProcessingStats {
  totalProcessed: number;
  pendingProcessing: number;
  failedProcessing: number;
  lastProcessedDate: string;
  recentActivityCount?: number;
}

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/regular-user`;

const userService = {
  /**
   * Get dashboard statistics for regular users
   */
  getUserDashboardStats: async (): Promise<UserDashboardStats> => {
    try {
      const response = await axios.get(`${BASE_URL}/dashboard/stats`, {
        withCredentials: true,
      });
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching user dashboard stats:", error);
      throw error;
    }
  },

  /**
   * Get user-specific department statistics
   */
  getUserDepartmentStats: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/department/stats`, {
        withCredentials: true,
      });
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching user department stats:", error);
      throw error;
    }
  },

  /**
   * Get user-specific team statistics
   */
  getUserTeamStats: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/team/stats`, {
        withCredentials: true,
      });
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching user team stats:", error);
      throw error;
    }
  },

  /**
   * Get user's own profile
   */
  getOwnProfile: async (): Promise<UserProfile> => {
    try {
      const response = await axios.get(`${BASE_URL}/profile`, {
        withCredentials: true,
      });
      return response.data.user;
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      toast.error(error.response?.data?.message || "Failed to fetch profile");
      throw error;
    }
  },

  /**
   * Update user's own profile
   */
  updateOwnProfile: async (
    profileData: Partial<UserProfile>
  ): Promise<UserProfile> => {
    try {
      const response = await axios.put(`${BASE_URL}/profile`, profileData, {
        withCredentials: true,
      });
      toast.success("Profile updated successfully");
      return response.data.user;
    } catch (error: any) {
      console.error("Error updating user profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
      throw error;
    }
  },

  /**
   * Get user's own leave requests
   */
  getOwnLeaveRequests: async (): Promise<{
    leaveRequests: LeaveRequest[];
    count: number;
  }> => {
    try {
      const response = await axios.get(`${BASE_URL}/leave`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error: any) {
      console.error("Error fetching leave requests:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch leave requests"
      );
      throw error;
    }
  },

  /**
   * Create a new leave request
   */
  createLeaveRequest: async (
    leaveData: Partial<LeaveRequest>
  ): Promise<LeaveRequest> => {
    try {
      const response = await axios.post(`${BASE_URL}/leave`, leaveData, {
        withCredentials: true,
      });
      toast.success("Leave request created successfully");
      return response.data.leaveRequest;
    } catch (error: any) {
      console.error("Error creating leave request:", error);
      toast.error(
        error.response?.data?.message || "Failed to create leave request"
      );
      throw error;
    }
  },

  /**
   * Cancel a leave request
   */
  cancelLeaveRequest: async (leaveId: string): Promise<LeaveRequest> => {
    try {
      const response = await axios.patch(
        `${BASE_URL}/leave/${leaveId}/cancel`,
        {},
        {
          withCredentials: true,
        }
      );
      toast.success("Leave request cancelled successfully");
      return response.data.leaveRequest;
    } catch (error: any) {
      console.error("Error cancelling leave request:", error);
      toast.error(
        error.response?.data?.message || "Failed to cancel leave request"
      );
      throw error;
    }
  },

  /**
   * Get user's allowances
   */
  getMyAllowances: async (): Promise<Allowance[]> => {
    try {
      const response = await axios.get(`${BASE_URL}/allowances`, {
        withCredentials: true,
      });
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching allowances:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch allowances"
      );
      throw error;
    }
  },

  /**
   * Request a new allowance
   */
  requestAllowance: async (
    allowanceData: Partial<Allowance>
  ): Promise<Allowance> => {
    try {
      const response = await axios.post(
        `${BASE_URL}/allowances/request`,
        allowanceData,
        {
          withCredentials: true,
        }
      );
      toast.success("Allowance request submitted successfully");
      return response.data.data;
    } catch (error: any) {
      console.error("Error requesting allowance:", error);
      toast.error(
        error.response?.data?.message || "Failed to request allowance"
      );
      throw error;
    }
  },

  /**
   * Get allowance history
   */
  getAllowanceHistory: async (): Promise<Allowance[]> => {
    try {
      const response = await axios.get(`${BASE_URL}/allowances/history`, {
        withCredentials: true,
      });
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching allowance history:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch allowance history"
      );
      throw error;
    }
  },

  /**
   * Get user's deductions
   */
  getMyDeductions: async (): Promise<GroupedDeductions> => {
    try {
      const response = await axios.get(`${BASE_URL}/deductions`, {
        withCredentials: true,
      });
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching deductions:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch deductions"
      );
      throw error;
    }
  },

  /**
   * Get deduction details
   */
  getDeductionDetails: async (deductionId: string): Promise<Deduction> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/deductions/${deductionId}`,
        {
          withCredentials: true,
        }
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching deduction details:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch deduction details"
      );
      throw error;
    }
  },

  /**
   * Get processing statistics for regular users
   */
  getUserProcessingStats: async (): Promise<ProcessingStats> => {
    try {
      const response = await axios.get(`${BASE_URL}/processing-statistics`, {
        withCredentials: true,
      });
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching user processing stats:", error);
      throw error;
    }
  },
};

export default userService;
