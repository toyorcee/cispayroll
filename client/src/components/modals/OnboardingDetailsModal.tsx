import React, { useState, useEffect, useRef } from "react";
import { onboardingService } from "../../services/onboardingService";
import { OnboardingEmployee, Task } from "../../types/employee";
import { toast } from "react-toastify";
import {
  FaCheckCircle,
  FaUser,
  FaIdBadge,
  FaBuilding,
  FaRegCalendarCheck,
  FaClipboardList,
} from "react-icons/fa";
import Confetti from "react-dom-confetti";

interface OnboardingDetailsModalProps {
  employee: OnboardingEmployee;
  isOpen: boolean;
  onClose: () => void;
  onTaskComplete: (updatedEmployee: OnboardingEmployee) => void;
}

const taskIcons: Record<string, React.ReactNode> = {
  "Welcome Meeting": <FaUser className="text-blue-500" />,
  "Department Introduction": <FaBuilding className="text-green-500" />,
  "System Access Setup": <FaIdBadge className="text-purple-500" />,
  "Policy Documentation Review": (
    <FaClipboardList className="text-yellow-500" />
  ),
  "Initial Training Session": <FaRegCalendarCheck className="text-pink-500" />,
};

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
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiRef = useRef<HTMLDivElement>(null);
  const prevAllTasksComplete = useRef(false);
  const [_isEditing, _setIsEditing] = useState(false);
  const [_editedTasks, setEditedTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (employee?.onboarding?.tasks) {
      setEditedTasks(employee.onboarding.tasks);
    }
  }, [employee]);

  useEffect(() => {
    setLocalEmployee(employee);
  }, [employee]);

  const tasks = localEmployee.onboarding.tasks;
  const hasTasks = tasks && tasks.length > 0;
  const allTasksComplete = hasTasks && tasks.every((task) => task.completed);

  // Only trigger confetti when allTasksComplete transitions from false to true and there are tasks
  useEffect(() => {
    if (hasTasks && !prevAllTasksComplete.current && allTasksComplete) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    }
    prevAllTasksComplete.current = allTasksComplete;
  }, [allTasksComplete, hasTasks]);

  const handleTaskComplete = async (
    taskName: string,
    completed: boolean = true
  ) => {
    if (!isOpen) return;
    try {
      setLoadingTasks((prev) => ({ ...prev, [taskName]: true }));
      const updatedTasks = localEmployee.onboarding.tasks.map((task) =>
        task.name === taskName
          ? {
              ...task,
              completed,
              completedAt: completed ? new Date().toISOString() : undefined,
            }
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
      setLocalEmployee(updatedEmployee);
      await onboardingService.completeOnboardingTask(
        employee._id,
        taskName,
        completed
      );
      onTaskComplete(updatedEmployee);

      // console.log("✅ [TASK COMPLETED]", {
      //   employee: employee.fullName,
      //   task: taskName,
      //   action: completed ? "completed" : "uncompleted",
      //   progress: `${newProgress}%`,
      //   completedTasks,
      //   totalTasks: updatedTasks.length,
      // });

      toast.success(
        `Task "${taskName}" ${
          completed ? "marked as complete" : "marked as incomplete"
        }`
      );
    } catch (error) {
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
    <div className="fixed inset-0 bg-gray-900 bg-opacity-40 z-50 flex items-center justify-center px-2">
      <div className="relative w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-6 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
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

        {/* Employee Info */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-sky-500 flex items-center justify-center shadow-lg mb-2">
            {employee.profileImage ? (
              <img
                src={`${import.meta.env.VITE_API_URL}/${employee.profileImage}`}
                alt={employee.fullName}
                className="w-20 h-20 rounded-full object-cover border-2 border-white"
              />
            ) : (
              <FaUser className="text-white text-4xl" />
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-800 text-center">
            {employee.fullName}
          </h2>
          <div className="text-sm text-gray-500 text-center">
            {employee.position} &bull;{" "}
            {typeof employee.department === "string"
              ? employee.department
              : employee.department?.name}
          </div>
        </div>

        {/* Main Content */}
        {hasTasks ? (
          <>
            {/* Circular Progress Bar */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative w-24 h-24 mb-2">
                <svg className="w-24 h-24" viewBox="0 0 100 100">
                  <circle
                    className="text-gray-200"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="44"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className="text-blue-500 transition-all duration-500"
                    strokeWidth="8"
                    strokeDasharray={276.46}
                    strokeDashoffset={
                      276.46 -
                      (276.46 * localEmployee.onboarding.progress) / 100
                    }
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="44"
                    cx="50"
                    cy="50"
                  />
                  <text
                    x="50"
                    y="54"
                    textAnchor="middle"
                    className="text-2xl font-bold text-blue-600"
                    fill="#2563eb"
                  >
                    {localEmployee.onboarding.progress}%
                  </text>
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">
                Onboarding Progress
              </span>
            </div>

            {/* Task Checklist */}
            <div className="space-y-4 flex-1 overflow-y-auto mb-4">
              {tasks.map((task) => (
                <div
                  key={task._id}
                  className={`flex items-center justify-between p-4 rounded-xl shadow border transition-all duration-300 ${
                    task.completed
                      ? "bg-green-50 border-green-200"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {taskIcons[task.name] || (
                        <FaClipboardList className="text-gray-400" />
                      )}
                    </span>
                    <div>
                      <h3
                        className={`font-semibold ${
                          task.completed
                            ? "text-green-700 line-through"
                            : "text-gray-900"
                        }`}
                      >
                        {task.name}
                      </h3>
                      {task.completedAt && (
                        <p className="text-xs text-gray-500">
                          Completed:{" "}
                          {new Date(task.completedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!task.completed && !allTasksComplete && (
                      <button
                        onClick={() => handleTaskComplete(task.name, true)}
                        disabled={loadingTasks[task.name]}
                        className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 transition-all duration-200"
                      >
                        {loadingTasks[task.name] ? "..." : "Mark Complete"}
                      </button>
                    )}
                    {task.completed && (
                      <div className="flex items-center gap-2">
                        <FaCheckCircle className="text-green-500 text-xl animate-bounceIn" />
                        <button
                          onClick={() => handleTaskComplete(task.name, false)}
                          disabled={loadingTasks[task.name]}
                          className="px-3 py-1 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50 transition-all duration-200"
                          title="Mark as incomplete"
                        >
                          {loadingTasks[task.name] ? "..." : "Undo"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Completion Celebration */}
            <div className="flex flex-col items-center mt-4 relative">
              <div
                ref={confettiRef}
                className="absolute top-0 left-1/2 -translate-x-1/2"
              >
                <Confetti active={showConfetti} />
              </div>
              {allTasksComplete && (
                <>
                  <FaCheckCircle className="text-green-500 text-4xl mb-2 animate-bounceIn" />
                  <h3 className="text-lg font-bold text-green-700 mb-1">
                    Fully Onboarded!
                  </h3>
                  <p className="text-gray-500 text-sm mb-2 text-center">
                    All onboarding tasks are complete. This employee is now
                    fully onboarded and eligible for payroll.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-2 px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <FaClipboardList className="text-4xl text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No onboarding tasks assigned
            </h3>
            <p className="text-gray-500 text-center max-w-xs">
              This employee does not have any onboarding tasks assigned yet.
              Please contact HR or an administrator to assign tasks.
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-all"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
