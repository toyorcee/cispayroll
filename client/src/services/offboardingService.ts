import api from "./api";
import { toast } from "react-toastify";
// import { OffboardingType, OffboardingData } from "../types/offboarding";

const BASE_URL = `/api/offboarding`;

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
      console.log(
        "[offboardingService.getOffboardingEmployees] GET /offboarding/employees"
      );
      const response = await api.get(`${BASE_URL}/employees`);
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
      console.log(
        `[offboardingService.getOffboardingEmployeeById] GET /offboarding/details/${employeeId}`
      );
      const response = await api.get(`${BASE_URL}/details/${employeeId}`);
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
      targetExitDate: Date;
      notes?: string;
    }
  ): Promise<OffboardingEmployee> => {
    try {
      console.log(
        `[offboardingService.initiateOffboarding] POST /offboarding/initiate/${employeeId} | Data:`,
        data
      );
      const response = await api.post(
        `${BASE_URL}/initiate/${employeeId}`,
        data
      );
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
      console.log(
        `[offboardingService.updateOffboardingTask] PATCH /offboarding/tasks/${employeeId}/${taskId} | Updates:`,
        updates
      );
      const response = await api.patch(
        `${BASE_URL}/tasks/${employeeId}/${taskId}`,
        updates
      );
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
    taskName: string,
    completed: boolean,
    notes?: string
  ): Promise<OffboardingTask> => {
    try {
      console.log(
        `[offboardingService.completeOffboardingTask] POST /offboarding/complete-task/${employeeId}/${taskName} | Completed: ${completed}, Notes:`,
        notes
      );
      const response = await api.post(
        `${BASE_URL}/complete-task/${employeeId}/${taskName}`,
        { completed, notes }
      );
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
      console.log(
        `[offboardingService.addOffboardingTask] POST /offboarding/tasks/${employeeId} | TaskData:`,
        taskData
      );
      const response = await api.post(
        `${BASE_URL}/tasks/${employeeId}`,
        taskData
      );
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
      console.log(
        `[offboardingService.deleteOffboardingTask] DELETE /offboarding/tasks/${employeeId}/${taskId}`
      );
      await api.delete(`${BASE_URL}/tasks/${employeeId}/${taskId}`);
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
      console.log(
        `[offboardingService.completeOffboarding] POST /offboarding/complete/${employeeId}`
      );
      const response = await api.post(`${BASE_URL}/complete/${employeeId}`);
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
      console.log(
        `[offboardingService.cancelOffboarding] POST /offboarding/cancel/${employeeId}`
      );
      const response = await api.post(`${BASE_URL}/cancel/${employeeId}`);
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
      console.log(
        "[offboardingService.getOffboardingStats] GET /offboarding/stats"
      );
      const response = await api.get(`${BASE_URL}/stats`);
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

  getFinalSettlementReport: async (employeeId: string) => {
    try {
      console.log(
        `[offboardingService.getFinalSettlementReport] GET /offboarding/final-settlement-report/${employeeId}`
      );
      const response = await api.get(
        `${BASE_URL}/final-settlement-report/${employeeId}`,
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
      console.log(
        `[offboardingService.emailFinalSettlementReport] POST /offboarding/email-final-settlement-report/${employeeId}`
      );
      const response = await api.post(
        `${BASE_URL}/email-final-settlement-report/${employeeId}`,
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

  // Bulk email final settlement reports to multiple or all offboarding employees
  emailFinalSettlementReportBulk: async (employeeIds?: string[]) => {
    try {
      console.log(
        `[offboardingService.emailFinalSettlementReportBulk] POST /offboarding/email-final-settlement-report | EmployeeIds:`,
        employeeIds
      );
      const response = await api.post(
        `${BASE_URL}/email-final-settlement-report`,
        { employeeIds },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error bulk emailing final settlement reports:", error);
      throw error;
    }
  },

  // Bulk generate final settlement reports for multiple employees
  getFinalSettlementReportBulk: async (employeeIds?: string[]) => {
    try {
      console.log(
        `[offboardingService.getFinalSettlementReportBulk] POST /offboarding/final-settlement-report | EmployeeIds:`,
        employeeIds
      );
      const response = await api.post(
        `${BASE_URL}/final-settlement-report`,
        { employeeIds },
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const blob = new Blob([response.data], { type: "application/zip" });
      return blob;
    } catch (error: any) {
      console.error("Error bulk generating final settlement reports:", error);
      throw error;
    }
  },

  // Bulk get final settlement details for CSV export
  getFinalSettlementDetailsBulk: async (employeeIds?: string[]) => {
    try {
      console.log(
        `[offboardingService.getFinalSettlementDetailsBulk] POST /offboarding/final-settlement-details | EmployeeIds:`,
        employeeIds
      );
      const response = await api.post(
        `${BASE_URL}/final-settlement-details`,
        { employeeIds },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      return response.data.settlementDetails;
    } catch (error: any) {
      console.error("Error bulk fetching final settlement details:", error);
      throw error;
    }
  },

  getFinalSettlementDetails: async (employeeId: string) => {
    try {
      console.log(
        `[offboardingService.getFinalSettlementDetails] GET /offboarding/final-settlement-details/${employeeId}`
      );
      const response = await api.get(
        `${BASE_URL}/final-settlement-details/${employeeId}`
      );
      return response.data.settlementDetails;
    } catch (error: any) {
      console.error("Failed to fetch final settlement details:", error);
      throw error;
    }
  },
};
