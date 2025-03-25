import { OnboardingEmployee, Task } from "../types/employee";
import { api, handleApiResponse, handleApiError } from "../config/api";

interface OnboardingStageResponse {
  success: boolean;
  message: string;
  data: OnboardingEmployee;
}

// Define specific error types for onboarding operations
interface OnboardingError extends Error {
  code?: string;
  status?: number;
}

export const onboardingService = {
  // Get all employees in onboarding
  getOnboardingEmployees: async (): Promise<OnboardingEmployee[]> => {
    try {
      const response = await api.get("/onboarding");
      return handleApiResponse<OnboardingEmployee[]>(response);
    } catch (error) {
      const err = handleApiError(error) as OnboardingError;
      if (err.status === 403) {
        throw new Error(
          "You don't have permission to view onboarding employees"
        );
      }
      throw err;
    }
  },

  // Update onboarding progress
  updateProgress: async (userId: string, progress: number): Promise<void> => {
    try {
      await api.patch(`/onboarding/${userId}/progress`, { progress });
    } catch (error) {
      const err = handleApiError(error) as OnboardingError;
      if (err.status === 404) {
        throw new Error("Employee not found in onboarding process");
      }
      if (err.status === 403) {
        throw new Error(
          "You don't have permission to update onboarding progress"
        );
      }
      if (err.status === 400) {
        throw new Error("Invalid progress value provided");
      }
      throw err;
    }
  },

  // Complete a specific task
  completeTask: async (userId: string, taskName: string): Promise<void> => {
    try {
      await api.patch(`/onboarding/${userId}/tasks/${taskName}`);
    } catch (error) {
      const err = handleApiError(error) as OnboardingError;
      if (err.status === 404) {
        throw new Error("Employee or task not found in onboarding process");
      }
      if (err.status === 403) {
        throw new Error(
          "You don't have permission to complete onboarding tasks"
        );
      }
      if (err.status === 400) {
        throw new Error("Task cannot be completed at this stage");
      }
      throw err;
    }
  },

  // Get onboarding tasks for an employee
  getEmployeeTasks: async (userId: string): Promise<Task[]> => {
    try {
      const response = await api.get(`/onboarding/${userId}/tasks`);
      return handleApiResponse<Task[]>(response);
    } catch (error) {
      const err = handleApiError(error) as OnboardingError;
      if (err.status === 404) {
        throw new Error("Employee not found in onboarding process");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to view onboarding tasks");
      }
      throw err;
    }
  },

  // Update onboarding stage
  updateOnboardingStage: async (
    employeeId: string,
    stage: string
  ): Promise<OnboardingEmployee> => {
    try {
      const response = await api.put(`/onboarding/${employeeId}/stage`, {
        stage,
      });
      return handleApiResponse<OnboardingEmployee>(response);
    } catch (error) {
      const err = handleApiError(error) as OnboardingError;
      if (err.status === 404) {
        throw new Error("Employee not found in onboarding process");
      }
      if (err.status === 403) {
        throw new Error("You don't have permission to update onboarding stage");
      }
      if (err.status === 400) {
        throw new Error("Invalid stage or cannot update to this stage");
      }
      if (err.status === 409) {
        throw new Error("Cannot update stage: previous tasks are incomplete");
      }
      throw err;
    }
  },
};
