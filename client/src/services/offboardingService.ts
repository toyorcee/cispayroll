import api from "./api";
import { toast } from "react-toastify";
// import { OffboardingType, OffboardingData } from "../types/offboarding";

const BASE_URL = `/api`;

// Helper function for consistent logging
// const logOffboardingAction = (action: string, data: any) => {
//   console.log(`[OFFBOARDING] ${action}:`, data);
// };

export interface OffboardingTask {
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

export interface OffboardingEmployee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: {
    id: string;
    name: string;
  };
  position: string;
  exitDate: Date;
  offboardingStatus: string;
  progress: number;
  tasks: OffboardingTask[];
  supervisor: {
    id: string;
    name: string;
  };
  reason: string;
  type: string;
}

export const offboardingService = {
  // Get all offboarding employees
  getOffboardingEmployees: async (): Promise<OffboardingEmployee[]> => {
    try {
      const response = await api.get(
        `${BASE_URL}/super-admin/offboarding-employees`
      );
      return response.data.data || [];
    } catch (error: any) {
      console.error("Failed to fetch offboarding employees:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch offboarding employees"
      );
      throw error;
    }
  },

  // Get offboarding employee by ID
  getOffboardingEmployeeById: async (
    employeeId: string
  ): Promise<OffboardingEmployee> => {
    try {
      const response = await api.get(
        `${BASE_URL}/super-admin/offboarding-employees/${employeeId}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Failed to fetch offboarding employee:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch offboarding employee"
      );
      throw error;
    }
  },

  // Initiate offboarding process
  initiateOffboarding: async (
    employeeId: string,
    data: {
      reason: string;
      type: string;
      exitDate: Date;
      notes?: string;
    }
  ): Promise<OffboardingEmployee> => {
    try {
      const response = await api.post(
        `${BASE_URL}/super-admin/offboarding-employees/${employeeId}/initiate`,
        data
      );
      toast.success("Offboarding process initiated successfully");
      return response.data.data;
    } catch (error: any) {
      console.error("Failed to initiate offboarding:", error);
      toast.error(
        error.response?.data?.message || "Failed to initiate offboarding"
      );
      throw error;
    }
  },

  // Update offboarding task
  updateOffboardingTask: async (
    employeeId: string,
    taskId: string,
    updates: Partial<OffboardingTask>
  ): Promise<OffboardingTask> => {
    try {
      const response = await api.patch(
        `${BASE_URL}/super-admin/offboarding-employees/${employeeId}/tasks/${taskId}`,
        updates
      );
      toast.success("Offboarding task updated successfully");
      return response.data.data;
    } catch (error: any) {
      console.error("Failed to update offboarding task:", error);
      toast.error(
        error.response?.data?.message || "Failed to update offboarding task"
      );
      throw error;
    }
  },

  // Complete offboarding task
  completeOffboardingTask: async (
    employeeId: string,
    taskId: string,
    notes?: string
  ): Promise<OffboardingTask> => {
    try {
      const response = await api.post(
        `${BASE_URL}/super-admin/offboarding-employees/${employeeId}/tasks/${taskId}/complete`,
        { notes }
      );
      toast.success("Offboarding task completed successfully");
      return response.data.data;
    } catch (error: any) {
      console.error("Failed to complete offboarding task:", error);
      toast.error(
        error.response?.data?.message || "Failed to complete offboarding task"
      );
      throw error;
    }
  },

  // Add custom offboarding task
  addOffboardingTask: async (
    employeeId: string,
    taskData: Omit<
      OffboardingTask,
      "id" | "completed" | "completedAt" | "completedBy"
    >
  ): Promise<OffboardingTask> => {
    try {
      const response = await api.post(
        `${BASE_URL}/super-admin/offboarding-employees/${employeeId}/tasks`,
        taskData
      );
      toast.success("Offboarding task added successfully");
      return response.data.data;
    } catch (error: any) {
      console.error("Failed to add offboarding task:", error);
      toast.error(
        error.response?.data?.message || "Failed to add offboarding task"
      );
      throw error;
    }
  },

  // Delete offboarding task
  deleteOffboardingTask: async (
    employeeId: string,
    taskId: string
  ): Promise<void> => {
    try {
      await api.delete(
        `${BASE_URL}/super-admin/offboarding-employees/${employeeId}/tasks/${taskId}`
      );
      toast.success("Offboarding task deleted successfully");
    } catch (error: any) {
      console.error("Failed to delete offboarding task:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete offboarding task"
      );
      throw error;
    }
  },

  // Complete offboarding process
  completeOffboarding: async (
    employeeId: string
  ): Promise<OffboardingEmployee> => {
    try {
      const response = await api.post(
        `${BASE_URL}/super-admin/offboarding-employees/${employeeId}/complete`
      );
      toast.success("Offboarding process completed successfully");
      return response.data.data;
    } catch (error: any) {
      console.error("Failed to complete offboarding process:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to complete offboarding process"
      );
      throw error;
    }
  },

  // Cancel offboarding process
  cancelOffboarding: async (
    employeeId: string
  ): Promise<OffboardingEmployee> => {
    try {
      const response = await api.post(
        `${BASE_URL}/super-admin/offboarding-employees/${employeeId}/cancel`
      );
      toast.success("Offboarding process cancelled successfully");
      return response.data.data;
    } catch (error: any) {
      console.error("Failed to cancel offboarding process:", error);
      toast.error(
        error.response?.data?.message || "Failed to cancel offboarding process"
      );
      throw error;
    }
  },

  // Get offboarding statistics
  getOffboardingStats: async () => {
    try {
      const response = await api.get(
        `${BASE_URL}/super-admin/offboarding-stats`
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Failed to fetch offboarding stats:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to fetch offboarding statistics"
      );
      throw error;
    }
  },

  // Admin-specific operations
  adminService: {
    getDepartmentOffboardingEmployees: async (): Promise<
      OffboardingEmployee[]
    > => {
      try {
        const response = await api.get(
          `${BASE_URL}/admin/offboarding-employees`
        );
        return response.data.data || [];
      } catch (error: any) {
        console.error(
          "Failed to fetch department offboarding employees:",
          error
        );
        toast.error(
          error.response?.data?.message ||
            "Failed to fetch offboarding employees"
        );
        throw error;
      }
    },

    initiateDepartmentOffboarding: async (
      employeeId: string,
      data: {
        reason: string;
        type: string;
        exitDate: Date;
        notes?: string;
      }
    ): Promise<OffboardingEmployee> => {
      try {
        const response = await api.post(
          `${BASE_URL}/admin/offboarding-employees/${employeeId}/initiate`,
          data
        );
        toast.success("Offboarding process initiated successfully");
        return response.data.data;
      } catch (error: any) {
        console.error("Failed to initiate department offboarding:", error);
        toast.error(
          error.response?.data?.message || "Failed to initiate offboarding"
        );
        throw error;
      }
    },

    updateDepartmentOffboardingTask: async (
      employeeId: string,
      taskId: string,
      updates: Partial<OffboardingTask>
    ): Promise<OffboardingTask> => {
      try {
        const response = await api.patch(
          `${BASE_URL}/admin/offboarding-employees/${employeeId}/tasks/${taskId}`,
          updates
        );
        toast.success("Offboarding task updated successfully");
        return response.data.data;
      } catch (error: any) {
        console.error("Failed to update department offboarding task:", error);
        toast.error(
          error.response?.data?.message || "Failed to update offboarding task"
        );
        throw error;
      }
    },

    completeDepartmentOffboardingTask: async (
      employeeId: string,
      taskId: string,
      notes?: string
    ): Promise<OffboardingTask> => {
      try {
        const response = await api.post(
          `${BASE_URL}/admin/offboarding-employees/${employeeId}/tasks/${taskId}/complete`,
          { notes }
        );
        toast.success("Offboarding task completed successfully");
        return response.data.data;
      } catch (error: any) {
        console.error("Failed to complete department offboarding task:", error);
        toast.error(
          error.response?.data?.message || "Failed to complete offboarding task"
        );
        throw error;
      }
    },
  },

  getFinalSettlementReport: async (employeeId: string) => {
    try {
      console.log(
        "Requesting final settlement report for employee:",
        employeeId
      );

      const response = await api.get(
        `${BASE_URL}/offboarding/final-settlement-report/${employeeId}`,
        {
          responseType: "blob",
        }
      );

      console.log("Final settlement report response received:", {
        status: response.status,
        contentType: response.headers["content-type"],
        contentLength: response.headers["content-length"],
      });

      // Create a blob from the PDF data
      const blob = new Blob([response.data], { type: "application/pdf" });
      console.log("Created PDF blob:", {
        size: blob.size,
        type: blob.type,
      });

      return blob;
    } catch (error: any) {
      console.error("Error getting final settlement report:", error);
      throw error;
    }
  },

  emailFinalSettlementReport: async (employeeId: string) => {
    try {
      const response = await api.post(
        `${BASE_URL}/offboarding/email-final-settlement-report/${employeeId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error emailing final settlement report:", error);
      throw error;
    }
  },
};
