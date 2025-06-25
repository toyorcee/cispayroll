import api from "./api";
import { toast } from "react-toastify";

const BASE_URL = `/api`;

export interface OnboardingTask {
  id: string;
  name: string;
  description: string;
  category: string;
  deadline: Date;
  completed: boolean;
  completedAt?: Date;
  completedBy?: {
    id: string;
    name: string;
  };
  notes?: string;
}

export interface OnboardingEmployee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: {
    id: string;
    name: string;
  };
  position: string;
  startDate: Date;
  onboardingStatus: string;
  progress: number;
  tasks: OnboardingTask[];
  supervisor: {
    id: string;
    name: string;
  };
}

export const onboardingService = {
  // Get all onboarding employees
  getOnboardingEmployees: async (): Promise<OnboardingEmployee[]> => {
    try {
      const response = await api.get(
        `${BASE_URL}/super-admin/onboarding-employees`
      );
      return response.data.data || [];
    } catch (error: any) {
      console.error("Failed to fetch onboarding employees:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch onboarding employees"
      );
      throw error;
    }
  },

  // Get onboarding employee by ID
  getOnboardingEmployeeById: async (
    employeeId: string
  ): Promise<OnboardingEmployee> => {
    try {
      const response = await api.get(
        `${BASE_URL}/super-admin/onboarding-employees/${employeeId}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Failed to fetch onboarding employee:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch onboarding employee"
      );
      throw error;
    }
  },

  // Update onboarding task
  updateOnboardingTask: async (
    employeeId: string,
    taskId: string,
    updates: Partial<OnboardingTask>
  ): Promise<OnboardingTask> => {
    try {
      const response = await api.patch(
        `${BASE_URL}/super-admin/onboarding-employees/${employeeId}/tasks/${taskId}`,
        updates
      );
      toast.success("Onboarding task updated successfully");
      return response.data.data;
    } catch (error: any) {
      console.error("Failed to update onboarding task:", error);
      toast.error(
        error.response?.data?.message || "Failed to update onboarding task"
      );
      throw error;
    }
  },

  // Complete onboarding task
  completeOnboardingTask: async (
    employeeId: string,
    taskId: string,
    notes?: string
  ): Promise<OnboardingTask> => {
    try {
      const response = await api.post(
        `${BASE_URL}/super-admin/onboarding-employees/${employeeId}/tasks/${taskId}/complete`,
        { notes }
      );
      toast.success("Onboarding task completed successfully");
      return response.data.data;
    } catch (error: any) {
      console.error("Failed to complete onboarding task:", error);
      toast.error(
        error.response?.data?.message || "Failed to complete onboarding task"
      );
      throw error;
    }
  },

  // Add custom onboarding task
  addOnboardingTask: async (
    employeeId: string,
    taskData: Omit<
      OnboardingTask,
      "id" | "completed" | "completedAt" | "completedBy"
    >
  ): Promise<OnboardingTask> => {
    try {
      const response = await api.post(
        `${BASE_URL}/super-admin/onboarding-employees/${employeeId}/tasks`,
        taskData
      );
      toast.success("Onboarding task added successfully");
      return response.data.data;
    } catch (error: any) {
      console.error("Failed to add onboarding task:", error);
      toast.error(
        error.response?.data?.message || "Failed to add onboarding task"
      );
      throw error;
    }
  },

  // Delete onboarding task
  deleteOnboardingTask: async (
    employeeId: string,
    taskId: string
  ): Promise<void> => {
    try {
      await api.delete(
        `${BASE_URL}/super-admin/onboarding-employees/${employeeId}/tasks/${taskId}`
      );
      toast.success("Onboarding task deleted successfully");
    } catch (error: any) {
      console.error("Failed to delete onboarding task:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete onboarding task"
      );
      throw error;
    }
  },

  // Complete onboarding process
  completeOnboarding: async (
    employeeId: string
  ): Promise<OnboardingEmployee> => {
    try {
      const response = await api.post(
        `${BASE_URL}/super-admin/onboarding-employees/${employeeId}/complete`
      );
      toast.success("Onboarding process completed successfully");
      return response.data.data;
    } catch (error: any) {
      console.error("Failed to complete onboarding process:", error);
      toast.error(
        error.response?.data?.message || "Failed to complete onboarding process"
      );
      throw error;
    }
  },

  // Get onboarding statistics
  getOnboardingStats: async () => {
    try {
      const response = await api.get(
        `${BASE_URL}/super-admin/onboarding-stats`
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Failed to fetch onboarding stats:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch onboarding statistics"
      );
      throw error;
    }
  },

  // Admin-specific operations
  adminService: {
    getDepartmentOnboardingEmployees: async (): Promise<
      OnboardingEmployee[]
    > => {
      try {
        const response = await api.get(
          `${BASE_URL}/admin/onboarding-employees`
        );
        return response.data.data || [];
      } catch (error: any) {
        console.error(
          "Failed to fetch department onboarding employees:",
          error
        );
        toast.error(
          error.response?.data?.message ||
            "Failed to fetch onboarding employees"
        );
        throw error;
      }
    },

    updateDepartmentOnboardingTask: async (
      employeeId: string,
      taskId: string,
      updates: Partial<OnboardingTask>
    ): Promise<OnboardingTask> => {
      try {
        const response = await api.patch(
          `${BASE_URL}/admin/onboarding-employees/${employeeId}/tasks/${taskId}`,
          updates
        );
        toast.success("Onboarding task updated successfully");
        return response.data.data;
      } catch (error: any) {
        console.error("Failed to update department onboarding task:", error);
        toast.error(
          error.response?.data?.message || "Failed to update onboarding task"
        );
        throw error;
      }
    },

    completeDepartmentOnboardingTask: async (
      employeeId: string,
      taskId: string,
      notes?: string
    ): Promise<OnboardingTask> => {
      try {
        const response = await api.post(
          `${BASE_URL}/admin/onboarding-employees/${employeeId}/tasks/${taskId}/complete`,
          { notes }
        );
        toast.success("Onboarding task completed successfully");
        return response.data.data;
      } catch (error: any) {
        console.error("Failed to complete department onboarding task:", error);
        toast.error(
          error.response?.data?.message || "Failed to complete onboarding task"
        );
        throw error;
      }
    },
  },
};
