import { useState } from "react";
import {
  FaUser,
  FaFilter,
  FaFileAlt,
  FaClock,
  FaCheckCircle,
  FaSpinner,
} from "react-icons/fa";
import { OnboardingStatus } from "../../../types/employee";
import { onboardingEmployees } from "../../../data/onboarding";
import { Link } from "react-router-dom";

const statusLabels: Record<OnboardingStatus, string> = {
  documentation_pending: "Documentation Pending",
  it_setup_pending: "IT Setup Pending",
  contract_pending: "Contract Pending",
  completed: "Completed",
};

export default function Onboarding() {
  const [selectedStatus, setSelectedStatus] = useState<
    OnboardingStatus | "all"
  >("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isViewingDetails, setIsViewingDetails] = useState(false);

  const filteredEmployees =
    selectedStatus === "all"
      ? onboardingEmployees
      : onboardingEmployees.filter((emp) => emp.status === selectedStatus);

  const handleStartOnboarding = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Start onboarding clicked");
    } catch (error) {
      console.error("Error starting onboarding:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = async (employeeId: string) => {
    setIsViewingDetails(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("View details clicked for:", employeeId);
    } catch (error) {
      console.error("Error viewing details:", error);
    } finally {
      setIsViewingDetails(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link
          to="/dashboard/employees/onboard"
          onClick={handleStartOnboarding}
          className="inline-flex items-center px-4 py-2 !bg-green-600 !text-white rounded-lg hover:bg-green-700 
                   transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg
                   animate-bounce-slow cursor-pointer focus:outline-none focus:ring-0"
        >
          {isLoading ? (
            <>
              <FaSpinner className="h-5 w-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <FaFileAlt className="h-5 w-5 mr-2" />
              Start Onboarding
            </>
          )}
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div
          className="bg-white overflow-hidden shadow rounded-lg transform transition-all duration-300 
                    hover:scale-105 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaUser className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Onboarding
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {onboardingEmployees.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4 items-center">
        <div className="flex items-center">
          <FaFilter className="h-4 w-4 text-green-600 mr-2" />
          <select
            className="text-sm md:text-base border-gray-300 rounded-lg shadow-sm 
                     !bg-green-600 !text-white px-3 py-1.5 
                     hover:!bg-green-700 transition-all duration-200
                     transform hover:-translate-y-0.5 hover:shadow-md
                     focus:ring-0 focus:outline-none cursor-pointer"
            value={selectedStatus}
            onChange={(e) =>
              setSelectedStatus(e.target.value as OnboardingStatus | "all")
            }
            disabled={isLoading}
          >
            <option value="all">All Status</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Onboarding Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredEmployees.map((employee) => (
          <div
            key={employee.id}
            className="bg-white shadow rounded-lg overflow-hidden transform transition-all duration-300 
                     hover:scale-105 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FaUser className="h-12 w-12 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {employee.firstName} {employee.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">{employee.position}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm text-gray-500">
                  <FaClock className="h-5 w-5 mr-2 text-green-600" />
                  Start Date: {employee.startDate.toLocaleDateString()}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Supervisor: {employee.supervisor}
                </div>
              </div>
              <div className="mt-4">
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-100">
                        Progress
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-green-600">
                        {employee.progress}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-100">
                    <div
                      style={{ width: `${employee.progress}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-600
                               transition-all duration-500"
                    ></div>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Onboarding Tasks
                </h4>
                <ul className="space-y-2">
                  {employee.tasks.map((task, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between text-sm text-gray-500 transition-all duration-200
                               hover:bg-gray-50 rounded-md p-1"
                    >
                      <div className="flex items-center">
                        <span
                          className={`h-4 w-4 mr-2 rounded-full flex items-center justify-center 
                                    transition-all duration-300 ${
                                      task.completed
                                        ? "bg-green-500"
                                        : "bg-gray-200"
                                    }`}
                        >
                          {task.completed && (
                            <FaCheckCircle className="h-3 w-3 text-white" />
                          )}
                        </span>
                        <span className="capitalize">
                          {task.name.replace(/_/g, " ")}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {task.assignedTo}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4">
              <button
                onClick={() => handleViewDetails(employee.id)}
                disabled={isViewingDetails}
                className="w-full text-center text-sm font-medium text-green-600 
                         transition-all duration-200 transform hover:-translate-y-0.5
                         hover:text-green-700 hover:shadow-sm cursor-pointer
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isViewingDetails ? (
                  <span className="flex items-center justify-center">
                    <FaSpinner className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </span>
                ) : (
                  "View Details"
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
