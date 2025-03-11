import { useState } from "react";
import {
  FaUser,
  FaFilter,
  FaFileAlt,
  FaClock,
  FaCheckCircle,
  FaSpinner,
} from "react-icons/fa";
import {
  OffboardingStatus,
  OffboardingEmployee,
} from "../../../types/employee";
import { Link } from "react-router-dom";

const statusLabels: Record<OffboardingStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  clearance_pending: "Clearance Pending",
  completed: "Completed",
  cancelled: "Cancelled",
};

// Sample data for testing
const offboardingEmployees: OffboardingEmployee[] = [
  {
    id: "OFF001",
    employeeId: "EMP003",
    firstName: "Chidi",
    lastName: "Okafor",
    position: "Senior Developer",
    department: "Engineering",
    lastWorkingDate: new Date("2024-05-30"),
    initiatedDate: new Date("2024-04-01"),
    status: "in_progress",
    progress: 45,
    supervisor: "Oluwaseun Adebayo",
    reason: "Career growth opportunity",
    tasks: [
      {
        name: "exit_interview",
        completed: true,
        assignedTo: "Aisha Ibrahim",
      },
      {
        name: "equipment_return",
        completed: false,
        assignedTo: "Babajide Oluwole",
      },
      // ... add more tasks
    ],
    clearance: {
      itClearance: true,
      financeClearance: false,
      hrClearance: false,
      departmentClearance: true,
    },
  },
  // Add more sample employees as needed
];

export default function Offboarding() {
  const [selectedStatus, setSelectedStatus] = useState<
    OffboardingStatus | "all"
  >("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredEmployees =
    selectedStatus === "all"
      ? offboardingEmployees
      : offboardingEmployees.filter((emp) => emp.status === selectedStatus);

  const handleInitiateOffboarding = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Initiate offboarding clicked");
    } catch (error) {
      console.error("Error initiating offboarding:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Employee Offboarding
        </h2>
        <Link
          to="/dashboard/employees/initiate-offboarding"
          onClick={handleInitiateOffboarding}
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg 
                   hover:bg-red-700 transition-all duration-300"
        >
          {isLoading ? (
            <FaSpinner className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <FaFileAlt className="h-5 w-5 mr-2" />
          )}
          Initiate Offboarding
        </Link>
      </div>

      {/* Status Filter */}
      <div className="bg-white p-4 rounded-lg shadow">
        <select
          className="border-gray-300 rounded-lg"
          value={selectedStatus}
          onChange={(e) =>
            setSelectedStatus(e.target.value as OffboardingStatus | "all")
          }
        >
          <option value="all">All Status</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Offboarding Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredEmployees.map((employee) => (
          <div
            key={employee.id}
            className="bg-white shadow rounded-lg overflow-hidden"
          >
            {/* Employee Card Content */}
            <div className="p-6">
              <div className="flex items-center">
                <FaUser className="h-12 w-12 text-red-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-medium">
                    {employee.firstName} {employee.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">{employee.position}</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-500">
                  Last Working Day:{" "}
                  {employee.lastWorkingDate.toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  Status: {statusLabels[employee.status]}
                </p>
                <div className="mt-2">
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-red-600 bg-red-100">
                          Progress
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-red-600">
                          {employee.progress}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-red-100">
                      <div
                        style={{ width: `${employee.progress}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-600"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clearance Status */}
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Clearance Status</h4>
                <div className="space-y-2">
                  {Object.entries(employee.clearance).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-500 capitalize">
                        {key.replace("Clearance", "")}
                      </span>
                      <span
                        className={`text-sm ${
                          value ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {value ? "Cleared" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="bg-gray-50 px-6 py-4">
              <button
                className="w-full text-center text-sm font-medium text-red-600 hover:text-red-700"
                onClick={() => console.log("View details:", employee.id)}
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
