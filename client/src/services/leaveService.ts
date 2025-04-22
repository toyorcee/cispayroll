import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { LeaveStatus } from "../types/employee";
import { useAuth } from "../context/AuthContext";

const BASE_URL = "http://localhost:5000/api";

export interface LeaveRequest {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    department: string;
  };
  type: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: LeaveStatus;
  approvedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  approvalDate?: Date;
  approvalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLeaveRequest {
  type: string;
  startDate: Date;
  endDate: Date;
  reason: string;
}

export interface LeaveStatistics {
  pending: { count: number; totalDays: number };
  approved: { count: number; totalDays: number };
  rejected: { count: number; totalDays: number };
  cancelled: { count: number; totalDays: number };
}

export const leaveService = {
  // Get user's own leaves
  getMyLeaves: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/leaves/my-leaves`);
      return response.data.leaves;
    } catch (error) {
      console.error("Error fetching leaves:", error);
      throw error;
    }
  },

  // Get team leaves (for admins and super admins)
  getTeamLeaves: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/leaves/team-leaves`);
      return response.data.leaves;
    } catch (error) {
      console.error("Error fetching team leaves:", error);
      throw error;
    }
  },

  // Request a new leave
  requestLeave: async (leaveData: CreateLeaveRequest) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/leaves/request`,
        leaveData
      );
      return response.data.leave;
    } catch (error) {
      console.error("Error requesting leave:", error);
      throw error;
    }
  },

  // Cancel a leave request
  cancelLeave: async (leaveId: string) => {
    try {
      const response = await axios.delete(
        `${BASE_URL}/leaves/my-leaves/${leaveId}/cancel`
      );
      return response.data.leave;
    } catch (error) {
      console.error("Error cancelling leave:", error);
      throw error;
    }
  },

  // Delete a leave request
  deleteLeave: async (leaveId: string) => {
    try {
      const response = await axios.delete(
        `${BASE_URL}/leaves/my-leaves/${leaveId}`
      );
      return response.data.leave;
    } catch (error) {
      console.error("Error deleting leave:", error);
      throw error;
    }
  },

  // Approve a leave request (admin and super admin)
  approveLeave: async (params: { id: string; notes?: string }) => {
    try {
      const response = await axios.patch(
        `${BASE_URL}/leaves/team-leaves/${params.id}/approve`,
        {
          notes: params.notes,
        }
      );
      return response.data.leave;
    } catch (error) {
      console.error("Error approving leave:", error);
      throw error;
    }
  },

  // Reject a leave request (admin and super admin)
  rejectLeave: async (params: { id: string; notes?: string }) => {
    try {
      const response = await axios.patch(
        `${BASE_URL}/leaves/team-leaves/${params.id}/reject`,
        {
          comment: params.notes,
        }
      );
      return response.data.leave;
    } catch (error) {
      console.error("Error rejecting leave:", error);
      throw error;
    }
  },

  // Get leave statistics
  getLeaveStatistics: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/leaves/statistics`);
      return response.data.statistics;
    } catch (error) {
      console.error("Error fetching leave statistics:", error);
      throw error;
    }
  },

  // React Query hooks
  useGetMyLeaves: () => {
    const { user } = useAuth();
    return useQuery({
      queryKey: ["leaves", "my-leaves", user?._id],
      queryFn: leaveService.getMyLeaves,
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: !!user?._id, // Only run query if we have a user ID
    });
  },

  useGetTeamLeaves: () => {
    return useQuery({
      queryKey: ["leaves", "team-leaves"],
      queryFn: leaveService.getTeamLeaves,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  },

  useGetLeaveStatistics: () => {
    return useQuery({
      queryKey: ["leaves", "statistics"],
      queryFn: leaveService.getLeaveStatistics,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  },

  useRequestLeave: () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    return useMutation({
      mutationFn: leaveService.requestLeave,
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["leaves", "my-leaves", user?._id],
        });
        queryClient.invalidateQueries({ queryKey: ["leaves", "team-leaves"] });
        toast.success("Leave request submitted successfully");
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.message || "Failed to submit leave request"
        );
      },
    });
  },

  useCancelLeave: () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    return useMutation({
      mutationFn: leaveService.cancelLeave,
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["leaves", "my-leaves", user?._id],
        });
        queryClient.invalidateQueries({ queryKey: ["leaves", "team-leaves"] });
        toast.success("Leave request cancelled successfully");
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.message || "Failed to cancel leave request"
        );
      },
    });
  },

  useDeleteLeave: () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    return useMutation({
      mutationFn: leaveService.deleteLeave,
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["leaves", "my-leaves", user?._id],
        });
        queryClient.invalidateQueries({ queryKey: ["leaves", "team-leaves"] });
        toast.success("Leave request deleted successfully");
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.message || "Failed to delete leave request"
        );
      },
    });
  },

  useApproveLeave: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (params: { id: string; notes?: string }) =>
        leaveService.approveLeave(params),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["leaves"] });
        toast.success("Leave request approved successfully");
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.message || "Failed to approve leave request"
        );
      },
    });
  },

  useRejectLeave: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (params: { id: string; notes?: string }) =>
        leaveService.rejectLeave(params),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["leaves"] });
        toast.success("Leave request rejected successfully");
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.message || "Failed to reject leave request"
        );
      },
    });
  },
};
