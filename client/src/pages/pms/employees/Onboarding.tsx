import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FaSpinner } from "react-icons/fa";
import { Department } from "../../../types/department";
import { useAuth } from "../../../context/AuthContext";
import { User } from "../../../types/auth";
import {
  OnboardingEmployee,
  ExtendedOnboardingEmployee,
} from "../../../types/employee";
import { Pagination } from "@mui/material";
import { Grid } from "@mui/material";
import { departmentService } from "../../../services/departmentService";
import {
  onboardingService,
  OnboardingFilters,
} from "../../../services/onboardingService";
import { OnboardingDetailsModal } from "../../../components/modals/OnboardingDetailsModal";

const useOnboardingData = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [onboardingEmployees, setOnboardingEmployees] = useState<
    ExtendedOnboardingEmployee[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [stats, setStats] = useState({
    total: 0,
    byStatus: {} as Record<string, number>,
    departments: [] as string[],
  });
  const { user } = useAuth() as { user: User | null };

  const fetchData = useCallback(
    async (page = 1, filters: OnboardingFilters = {}) => {
      setIsLoading(true);
      try {
        const deps = await departmentService.getAllDepartments();
        setDepartments(deps);

        const response = await onboardingService.getOnboardingEmployees({
          page,
          limit: 10,
          ...filters,
        });

        // Filter out super admins and only show employees in onboarding process
        const filteredEmployees = (
          response.data as ExtendedOnboardingEmployee[]
        ).filter((emp) => {
          return (
            emp.role !== "SUPER_ADMIN" &&
            emp.onboarding?.status !== "completed" &&
            emp.status !== "offboarding"
          );
        });

        // console.log(
        //   "Filtered Onboarding Employees:",
        //   filteredEmployees.map((emp) => ({
        //     id: emp._id,
        //     name: `${emp.firstName} ${emp.lastName}`,
        //     role: emp.role,
        //     status: emp.onboarding?.status,
        //     department: emp.department?.name || emp.department,
        //   }))
        // );

        setOnboardingEmployees(filteredEmployees);
        setPagination({
          ...response.pagination,
          total: filteredEmployees.length,
          totalPages: Math.ceil(filteredEmployees.length / 10),
        });
        setStats({
          ...response.stats,
          total: filteredEmployees.length,
          byStatus: filteredEmployees.reduce((acc, emp) => {
            acc[emp.onboarding?.status || "unknown"] =
              (acc[emp.onboarding?.status || "unknown"] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        });
        setError(null);
      } catch (error: unknown) {
        if (error instanceof Error) {
          setError(error.message || "Failed to load data");
        } else {
          setError("An unknown error occurred");
        }
        setOnboardingEmployees([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      try {
        const response = await onboardingService.getOnboardingEmployees();
        const transformedEmployees = response.data.map((emp) => ({
          ...emp,
          department:
            typeof emp.department === "string"
              ? { name: emp.department }
              : emp.department,
          onboarding: {
            status: emp.onboarding?.status || "not_started",
            progress: emp.onboarding?.progress || 0,
            tasks: emp.onboarding?.tasks || [],
            startedAt: emp.onboarding?.startedAt,
          },
        })) as OnboardingEmployee[];

        setOnboardingEmployees(transformedEmployees);
      } catch (error) {
        console.error("Error refreshing employees:", error);
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, []);

  return {
    departments,
    setDepartments,
    onboardingEmployees,
    setOnboardingEmployees,
    isLoading,
    error,
    fetchData,
    user,
    pagination,
    stats,
  };
};

const ONBOARDING_STAGES = {
  NOT_STARTED: "not_started",
  CONTRACT_STAGE: "contract_stage",
  DOCUMENTATION_STAGE: "documentation_stage",
  IT_SETUP_STAGE: "it_setup_stage",
  TRAINING_STAGE: "training_stage",
  COMPLETED: "completed",
} as const;

type OnboardingStage =
  (typeof ONBOARDING_STAGES)[keyof typeof ONBOARDING_STAGES];

export default function Onboarding() {
  const [filters, setFilters] = useState<OnboardingFilters>({
    status: "",
    department: "",
    search: "",
  });

  const {
    departments,
    onboardingEmployees,
    setOnboardingEmployees,
    isLoading,
    error,
    fetchData,
    pagination,
    stats,
  } = useOnboardingData();

  const [page] = useState(1);
  const [itemsPerPage] = useState(6);

  const [selectedEmployee, setSelectedEmployee] =
    useState<OnboardingEmployee | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  // All useEffect hooks
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 100);
    return () => clearTimeout(timer);
  }, [fetchData]);

  // Define all your handler functions here
  const getFilteredEmployees = () => {
    const filtered =
      filters.status === "all"
        ? onboardingEmployees
        : onboardingEmployees.filter(
            (emp) => emp.onboarding?.status === filters.status
          );

    return filtered;
  };

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    fetchData(value, filters);
  };

  const handleFilterChange = (newFilters: OnboardingFilters) => {
    setFilters(newFilters);
    fetchData(1, newFilters);
  };

  // Add this function to handle opening the modal
  const handleOpenModal = (employee: OnboardingEmployee) => {
    console.log("Opening modal for:", employee);
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const getStatusColor = (status: OnboardingStage) => {
    switch (status) {
      case ONBOARDING_STAGES.COMPLETED:
        return "bg-green-100 text-green-800";
      case ONBOARDING_STAGES.NOT_STARTED:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getStatusText = (status: OnboardingStage) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleTaskComplete = (updatedEmployee: OnboardingEmployee) => {
    const updatedEmployees = onboardingEmployees.map((emp) =>
      emp._id === updatedEmployee._id ? updatedEmployee : emp
    );

    // Update the state with the new employee data
    setOnboardingEmployees(updatedEmployees);

    if (selectedEmployee?._id === updatedEmployee._id) {
      setSelectedEmployee(updatedEmployee);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-sky-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 text-red-600 p-4 rounded-lg mb-4">
            <p className="font-medium">Error loading dashboard</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={() => fetchData(1, filters)}
            className="text-sky-500 hover:text-sky-600 font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedEmployees = getFilteredEmployees().slice(startIndex, endIndex);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-6 overflow-x-hidden"
    >
      {/* Filter and Cards Section */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Onboarding Employees
            </h2>
            <div className="flex space-x-4">
              <input
                type="text"
                placeholder="Search employees..."
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium
                         text-gray-700 hover:border-sky-500 focus:outline-none focus:ring-2 
                         focus:ring-sky-500 focus:border-transparent transition-all duration-200"
                value={filters.search}
                onChange={(e) =>
                  handleFilterChange({ ...filters, search: e.target.value })
                }
              />
              <select
                value={filters.status}
                onChange={(e) =>
                  handleFilterChange({ ...filters, status: e.target.value })
                }
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium
                       text-gray-700 hover:border-sky-500 focus:outline-none focus:ring-2 
                       focus:ring-sky-500 focus:border-transparent transition-all duration-200"
              >
                <option value="all">All Stages</option>
                <option value="not_started">Not Started</option>
                <option value="contract_stage">Contract Stage</option>
                <option value="documentation_stage">Documentation Stage</option>
                <option value="it_setup_stage">IT Setup Stage</option>
                <option value="training_stage">Training Stage</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={filters.department}
                onChange={(e) =>
                  handleFilterChange({ ...filters, department: e.target.value })
                }
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium
                         text-gray-700 hover:border-sky-500 focus:outline-none focus:ring-2 
                         focus:ring-sky-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-sky-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-sky-700">
                Total Employees
              </h3>
              <p className="text-2xl font-bold text-sky-600">{stats.total}</p>
            </div>
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <div key={status} className="bg-sky-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-sky-700">
                  {status.replace(/_/g, " ").toUpperCase()}
                </h3>
                <p className="text-2xl font-bold text-sky-600">{count}</p>
              </div>
            ))}
          </div>

          {/* Employee Cards Grid */}
          <Grid container spacing={3}>
            {displayedEmployees.map((employee) => (
              <Grid item xs={12} sm={6} lg={4} key={employee._id}>
                <div className="bg-white rounded-lg shadow-md p-6 mb-4 min-h-[200px] flex flex-col justify-between">
                  {/* Top Section */}
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {employee.firstName} {employee.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {employee.position}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 text-sm font-semibold rounded-full 
                        ${getStatusColor(
                          employee.onboarding?.status as OnboardingStage
                        )}`}
                      >
                        {getStatusText(
                          employee.onboarding?.status as OnboardingStage
                        )}
                      </span>
                    </div>

                    {/* Progress Section */}
                    <div className="mb-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">
                          Onboarding Progress
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {employee.onboarding.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${employee.onboarding.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Section with Actions */}
                  <div className="mt-auto pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center space-x-4">
                      <button
                        onClick={() => handleOpenModal(employee)}
                        className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </Grid>
            ))}
          </Grid>

          <div className="mt-6 flex justify-center">
            <Pagination
              count={pagination.totalPages}
              page={pagination.page}
              onChange={handlePageChange}
              color="primary"
              size="large"
            />
          </div>
        </div>
      </div>

      {/* Add this where you want to show the employee list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {onboardingEmployees.map((employee) => (
          <div
            key={employee._id}
            className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleOpenModal(employee)}
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <img
                  src={`${import.meta.env.VITE_API_URL}/${
                    employee.profileImage
                  }`}
                  alt={`${employee.firstName} ${employee.lastName}`}
                  className="h-16 w-16 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/default-avatar.png";
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {employee.firstName} {employee.lastName}
                </h3>
                <p className="text-sm text-gray-500">{employee.position}</p>
                <div className="mt-2">
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${employee.onboarding.progress}%` }}
                      />
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      {employee.onboarding.progress}%
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  <p>
                    Department:{" "}
                    {typeof employee.department === "string"
                      ? employee.department
                      : employee.department?.name}
                  </p>
                  <p>Status: {employee.onboarding.status}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add the modal */}
      {selectedEmployee && (
        <OnboardingDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          employee={selectedEmployee}
          onTaskComplete={handleTaskComplete}
        />
      )}
    </motion.div>
  );
}
