import axios from "axios";
import { OffboardingType, OffboardingData } from "../types/offboarding";

const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
axios.defaults.withCredentials = true;

// Helper function for consistent logging
const logOffboardingAction = (action: string, data: any) => {
  console.log(`[OFFBOARDING] ${action}:`, data);
};

export const offboardingService = {
  // Initiate offboarding process
  initiateOffboarding: async (
    userId: string,
    data: {
      type: OffboardingType;
      reason: string;
      targetExitDate: Date;
    }
  ): Promise<OffboardingData> => {
    try {
      logOffboardingAction("Initiating offboarding for user", {
        userId,
        ...data,
      });

      const payload = {
        ...data,
        type: data.type as OffboardingType,
      };

      const response = await axios.post(
        `${BASE_URL}/offboarding/initiate/${userId}`,
        payload,
        { withCredentials: true }
      );

      // Log the response
      logOffboardingAction("Offboarding initiation response", response.data);

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to initiate offboarding"
        );
      }

      return response.data.data;
    } catch (error: any) {
      // Log the error
      logOffboardingAction("Error initiating offboarding", {
        userId,
        error: error.message || error,
        response: error.response?.data,
      });

      console.error("Error initiating offboarding:", error);
      throw error.response?.data?.message || "Failed to initiate offboarding";
    }
  },

  // Complete a specific offboarding task
  completeTask: async (
    userId: string,
    taskName: string,
    completed: boolean,
    notes?: string,
    attachments?: any[]
  ): Promise<OffboardingData> => {
    console.log(
      `Completing task ${taskName} for user ${userId} with status: ${completed}`
    );
    const response = await axios.post(
      `${BASE_URL}/offboarding/complete-task/${userId}/${taskName}`,
      {
        completed,
        notes,
        attachments,
      },
      { withCredentials: true }
    );
    console.log("Task completion response:", response.data);
    return response.data.data;
  },

  // Get offboarding details
  getOffboardingDetails: async (userId: string): Promise<OffboardingData> => {
    try {
      // Log the request
      logOffboardingAction("Fetching offboarding details for user", { userId });

      const response = await axios.get(
        `${BASE_URL}/offboarding/details/${userId}`,
        { withCredentials: true }
      );

      // Log the response
      logOffboardingAction("Offboarding details response", response.data);

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to fetch offboarding details"
        );
      }

      return response.data.data;
    } catch (error: any) {
      // Log the error
      logOffboardingAction("Error fetching offboarding details", {
        userId,
        error: error.message || error,
        response: error.response?.data,
      });

      console.error("Error fetching offboarding details:", error);
      throw (
        error.response?.data?.message || "Failed to fetch offboarding details"
      );
    }
  },

  // Get all offboarding users
  getOffboardingUsers: async (page: number = 1, limit: number = 10) => {
    try {
      logOffboardingAction("Fetching all offboarding users", { page, limit });

      const response = await axios.get(`${BASE_URL}/offboarding/employees`, {
        params: { page, limit },
        withCredentials: true,
      });

      logOffboardingAction("Offboarding users response", response.data);

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to fetch offboarding users"
        );
      }

      return response.data;
    } catch (error: any) {
      logOffboardingAction("Error fetching offboarding users", {
        error: error.message || error,
        response: error.response?.data,
      });

      console.error("Failed to fetch offboarding users:", error);
      throw error;
    }
  },

  // Cancel offboarding process
  cancelOffboarding: async (
    userId: string,
    reason: string
  ): Promise<OffboardingData> => {
    try {
      // Log the request data
      logOffboardingAction("Cancelling offboarding for user", {
        userId,
        reason,
      });

      const response = await axios.post(
        `${BASE_URL}/offboarding/cancel/${userId}`,
        { reason },
        { withCredentials: true }
      );

      // Log the response
      logOffboardingAction("Offboarding cancellation response", response.data);

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to cancel offboarding"
        );
      }

      return response.data.data;
    } catch (error: any) {
      // Log the error
      logOffboardingAction("Error cancelling offboarding", {
        userId,
        reason,
        error: error.message || error,
        response: error.response?.data,
      });

      console.error("Error cancelling offboarding:", error);
      throw error.response?.data?.message || "Failed to cancel offboarding";
    }
  },

  getFinalSettlementReport: async (employeeId: string) => {
    try {
      console.log(
        "Requesting final settlement report for employee:",
        employeeId
      );

      const response = await axios.get(
        `${BASE_URL}/offboarding/final-settlement-report/${employeeId}`,
        {
          responseType: "blob",
          withCredentials: true,
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
      const response = await axios.post(
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
