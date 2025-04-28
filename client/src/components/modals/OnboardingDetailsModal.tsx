import React, { useState, useEffect } from "react";
import axios from "axios";
import { OnboardingEmployee, Task } from "../../types/employee";
import { toast } from "react-toastify";

const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

export interface OnboardingFilters {
  page?: number;
  limit?: number;
  status?: string;
  department?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface OnboardingResponse {
  success: boolean;
  data: OnboardingEmployee[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats: {
    total: number;
    byStatus: Record<string, number>;
    departments: string[];
  };
}

export const onboardingService = {
  // Get all employees in onboarding with pagination and filtering
  getOnboardingEmployees: async (
    filters?: OnboardingFilters
  ): Promise<OnboardingResponse> => {
    try {
      const response = await axios.get(`${BASE_URL}/onboarding`, {
        params: filters,
      });
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch onboarding employees:", error);
      toast.error(error.response?.data?.message || "Failed to fetch employees");
      return {
        success: false,
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
        stats: {
          total: 0,
          byStatus: {},
          departments: [],
        },
      };
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

interface OnboardingDetailsModalProps {
  employee: OnboardingEmployee;
  isOpen: boolean;
  onClose: () => void;
  onTaskComplete: (updatedEmployee: OnboardingEmployee) => void;
}

export const OnboardingDetailsModal: React.FC<OnboardingDetailsModalProps> = ({
  employee,
  isOpen,
  onClose,
  onTaskComplete,
}) => {
  const [loadingTasks, setLoadingTasks] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [localEmployee, setLocalEmployee] =
    useState<OnboardingEmployee>(employee);

  useEffect(() => {
    setLocalEmployee(employee);
  }, [employee]);

  const handleTaskComplete = async (taskName: string) => {
    if (!isOpen) return;

    try {
      setLoadingTasks((prev) => ({ ...prev, [taskName]: true }));

      const updatedTasks = localEmployee.onboarding.tasks.map((task) =>
        task.name === taskName
          ? { ...task, completed: true, completedAt: new Date().toISOString() }
          : task
      );

      const completedTasks = updatedTasks.filter(
        (task) => task.completed
      ).length;
      const newProgress = Math.round(
        (completedTasks / updatedTasks.length) * 100
      );

      const updatedEmployee = {
        ...localEmployee,
        onboarding: {
          ...localEmployee.onboarding,
          tasks: updatedTasks,
          progress: newProgress,
        },
      };

      // Update local state immediately
      setLocalEmployee(updatedEmployee);

      // Make API call in the background
      const encodedTaskName = encodeURIComponent(taskName);
      await axios.patch(
        `/api/onboarding/${employee._id}/tasks/${encodedTaskName}`
      );

      onTaskComplete(updatedEmployee);
      toast.success(`Task "${taskName}" marked as complete`);
    } catch (error) {
      console.error("Failed to complete task:", error);

      setLocalEmployee((prev) => ({
        ...prev,
        onboarding: {
          ...prev.onboarding,
          tasks: prev.onboarding.tasks.map((task) =>
            task.name === taskName
              ? { ...task, completed: false, completedAt: undefined }
              : task
          ),
          progress: employee.onboarding.progress,
        },
      }));

      toast.error("Failed to mark task as complete");
    } finally {
      setLoadingTasks((prev) => ({ ...prev, [taskName]: false }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-100 bg-opacity-30 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Onboarding Progress</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Overall Progress
            </span>
            <span className="text-sm font-medium text-gray-700">
              {localEmployee.onboarding.progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${localEmployee.onboarding.progress}%` }}
            ></div>
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto flex-1">
          {localEmployee.onboarding.tasks.map((task) => (
            <div
              key={task._id}
              className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200"
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-200
                  ${task.completed ? "bg-green-500" : "bg-gray-200"}`}
                >
                  {task.completed && (
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{task.name}</h3>
                  {task.completedAt && (
                    <p className="text-sm text-gray-500">
                      Completed:{" "}
                      {new Date(task.completedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {!task.completed && (
                <div className="flex items-center space-x-2">
                  {loadingTasks[task.name] && (
                    <svg
                      className="animate-spin h-4 w-4 text-blue-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  )}
                  <button
                    onClick={() => handleTaskComplete(task.name)}
                    disabled={loadingTasks[task.name]}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer transition-colors duration-200"
                  >
                    Mark Complete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
