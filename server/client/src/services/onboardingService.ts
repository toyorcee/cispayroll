import axios from "axios";
import { OnboardingEmployee, Task } from "../types/employee";
import { toast } from "react-toastify";

const BASE_URL = "http://localhost:5000/api";

export const onboardingService = {
  // Get all employees in onboarding
  getOnboardingEmployees: async (): Promise<OnboardingEmployee[]> => {
    try {
      const response = await axios.get(`${BASE_URL}/onboarding`);
      return response.data.data;
    } catch (error: any) {
      console.error("Failed to fetch onboarding employees:", error);
      toast.error(error.response?.data?.message || "Failed to fetch employees");
      return [];
    }
  },

  // Update onboarding progress
  updateProgress: async (userId: string, progress: number): Promise<void> => {
    try {
      await axios.patch(`${BASE_URL}/onboarding/${userId}/progress`, {
        progress,
      });
      toast.success("Progress updated successfully");
    } catch (error: any) {
      console.error("Failed to update progress:", error);
      toast.error(error.response?.data?.message || "Failed to update progress");
      throw error;
    }
  },

  // Complete a specific task
  completeTask: async (userId: string, taskName: string): Promise<void> => {
    try {
      await axios.patch(`${BASE_URL}/onboarding/${userId}/tasks/${taskName}`);
      toast.success("Task completed successfully");
    } catch (error: any) {
      console.error("Failed to complete task:", error);
      toast.error(error.response?.data?.message || "Failed to complete task");
      throw error;
    }
  },

  // Get onboarding tasks for an employee
  getEmployeeTasks: async (userId: string): Promise<Task[]> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/onboarding/${userId}/tasks`
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Failed to fetch tasks:", error);
      toast.error(error.response?.data?.message || "Failed to fetch tasks");
      return [];
    }
  },

  // Add the updateOnboardingStage method here
  updateOnboardingStage: async (employeeId: string, stage: string) => {
    try {
      const response = await axios.put(
        `${BASE_URL}/onboarding/${employeeId}/stage`,
        { stage }
      );
      toast.success("Onboarding stage updated successfully");
      return response.data;
    } catch (error: any) {
      console.error("Failed to update onboarding stage:", error);
      toast.error(error.response?.data?.message || "Failed to update stage");
      throw error;
    }
  },
};
