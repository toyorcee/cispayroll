import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FaUserPlus,
  FaUsers,
  FaBuildingColumns,
  FaUserMinus,
} from "react-icons/fa6";
import { FaTimes, FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";
import { employeeService } from "../../../services/employeeService";
import { Dialog } from "@headlessui/react";
import { DepartmentModal } from "../../../components/departments/DepartmentModal";
import { Department, DepartmentFormData } from "../../../types/department";
import { useAuth } from "../../../context/AuthContext";
import { UserRole, User, Permission } from "../../../types/auth";
import { AxiosError } from "axios";
import {
  CreateEmployeeData,
  OnboardingEmployee,
} from "../../../types/employee";
import { Pagination } from "@mui/material";
import { Grid } from "@mui/material";
import CreateAdminModal from "../../../components/modals/CreateAdminModal";
import { departmentService } from "../../../services/departmentService";
import {
  onboardingService,
  OnboardingFilters,
  OnboardingResponse,
} from "../../../services/onboardingService";

// Update the AdminUser interface to match User type exactly
interface AdminUser {
  _id: string;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status:
    | "active"
    | "inactive"
    | "pending"
    | "suspended"
    | "terminated"
    | "offboarding";
  permissions: Permission[];
}

interface EmployeeFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  gradeLevel: string;
  workLocation: string;
  dateJoined: string;
  department: string;
}

const useOnboardingData = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [onboardingEmployees, setOnboardingEmployees] = useState<
    OnboardingEmployee[]
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
        const filteredEmployees = response.data.filter((emp) => {
          return (
            emp.role !== "SUPER_ADMIN" &&
            emp.onboarding.status !== "completed" &&
            emp.status !== "offboarding"
          );
        });

        console.log(
          "Filtered Onboarding Employees:",
          filteredEmployees.map((emp) => ({
            id: emp._id,
            name: `${emp.firstName} ${emp.lastName}`,
            role: emp.role,
            status: emp.onboarding.status,
            department: emp.department.name,
          }))
        );

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
            acc[emp.onboarding.status] = (acc[emp.onboarding.status] || 0) + 1;
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

// Add these constants at the top of the file
const ONBOARDING_STAGES = {
  NOT_STARTED: "not_started",
  CONTRACT_STAGE: "contract_stage",
  DOCUMENTATION_STAGE: "documentation_stage",
  IT_SETUP_STAGE: "it_setup_stage",
  TRAINING_STAGE: "training_stage",
  COMPLETED: "completed",
} as const;

export default function Onboarding() {
  // Move ALL hooks to the top, before any conditional returns
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [filters, setFilters] = useState<OnboardingFilters>({
    status: "",
    department: "",
    search: "",
  });

  const [formData, setFormData] = useState<CreateEmployeeData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "USER",
    position: "",
    gradeLevel: "",
    workLocation: "",
    dateJoined: new Date().toISOString().split("T")[0],
    department: "",
  });

  const {
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
  } = useOnboardingData();

  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(6);

  // Add a state for admins
  const [admins, setAdmins] = useState<AdminUser[]>([]);

  // Update the fetchAdmins function to properly type the permissions
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await employeeService.getAdmins();
        if (response && Array.isArray(response)) {
        const transformedAdmins = response.map((admin) => ({
          _id: admin._id,
          id: admin._id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          role: admin.role || UserRole.ADMIN,
          status: admin.status || "active",
          permissions: (admin.permissions || []).map(
            (perm) => perm as Permission
          ),
        }));
        setAdmins(transformedAdmins as AdminUser[]);
        } else {
          setAdmins([]);
        }
      } catch (error) {
        console.error("Failed to fetch admins:", error);
        setAdmins([]);
      }
    };

    fetchAdmins();
  }, []);

  // All useEffect hooks
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 100);
    return () => clearTimeout(timer);
  }, [fetchData]);

  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      try {
        const response = await employeeService.getOnboardingEmployees();
        setOnboardingEmployees(response);
      } catch (error) {
        console.error("Error refreshing employees:", error);
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, []);

  // Define all your handler functions here
  const getFilteredEmployees = () => {
    const filtered =
      filters.status === "all"
          ? onboardingEmployees
        : onboardingEmployees.filter(
            (emp) => emp.onboarding.status === filters.status
          );

    return filtered;
  };

const handleCreateEmployee = async (e: React.FormEvent) => {
  e.preventDefault();
    try {
      await employeeService.createEmployee(formData);
      toast.success("Employee created successfully");
    setShowCreateModal(false);
      fetchData();
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(
          error.response?.data?.message || "Failed to create employee"
        );
    } else {
        toast.error("An unexpected error occurred");
    }
  }
};

  const handleDepartmentSave = async (
    formData: DepartmentFormData & { _id?: string }
  ) => {
    try {
      if (formData._id) {
        await departmentService.updateDepartment(formData._id, formData);
      } else {
        await departmentService.createDepartment(formData);
      }

      // Refresh departments
      const response = await departmentService.getAllDepartments();
      setDepartments(response);
      toast.success(
        formData._id ? "Department updated!" : "Department created!"
      );
    } catch (error) {
      toast.error("Failed to save department");
      throw error;
    }
  };

  const handleDepartmentDelete = async (department: Department) => {
    try {
      await departmentService.deleteDepartment(department._id);
      toast.success("Department deleted successfully");
      setShowDepartmentModal(false);
      fetchData();
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(
          error.response?.data?.message || "Failed to delete department"
        );
      } else {
        toast.error("An unexpected error occurred");
      }
    }
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    fetchData(value, filters);
  };

  const handleFilterChange = (newFilters: OnboardingFilters) => {
    setFilters(newFilters);
    fetchData(1, newFilters);
  };

  const handleFilterClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const newFilters = { ...filters };
    setFilters(newFilters);
    fetchData(1, newFilters);
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    try {
      await employeeService.deleteEmployee(employeeId);
      setOnboardingEmployees((prev) =>
        prev.filter((emp) => emp.id !== employeeId)
      );
      toast.success("Employee deleted successfully");
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast.error("Failed to delete employee");
    }
  };

  const handleInitiateOffboarding = async (employeeId: string) => {
    try {
      // Simplified payload to match backend expectations
      const response = await employeeService.initiateOffboarding(employeeId);

      if (response.success) {
        // Remove from onboarding list
        setOnboardingEmployees((prev) =>
          prev.filter((emp) => emp.id !== employeeId)
        );
        toast.success("Employee offboarding initiated");
        fetchData(); // Refresh the list
      } else {
        throw new Error("Failed to initiate offboarding");
      }
    } catch (error) {
      console.error("❌ Error:", error);
      toast.error("Failed to initiate offboarding");
    }
  };

  // Add this new function after the other handler functions
  const handleUpdateOnboardingStage = async (
    employeeId: string,
    currentStage: string
  ) => {
    try {
      let nextStage;
      switch (currentStage) {
        case ONBOARDING_STAGES.NOT_STARTED:
          nextStage = ONBOARDING_STAGES.CONTRACT_STAGE;
          break;
        case ONBOARDING_STAGES.CONTRACT_STAGE:
          nextStage = ONBOARDING_STAGES.DOCUMENTATION_STAGE;
          break;
        case ONBOARDING_STAGES.DOCUMENTATION_STAGE:
          nextStage = ONBOARDING_STAGES.IT_SETUP_STAGE;
          break;
        case ONBOARDING_STAGES.IT_SETUP_STAGE:
          nextStage = ONBOARDING_STAGES.TRAINING_STAGE;
          break;
        case ONBOARDING_STAGES.TRAINING_STAGE:
          nextStage = ONBOARDING_STAGES.COMPLETED;
          break;
        default:
          return;
      }

      // Call the backend API to update the stage
      await employeeService.updateOnboardingStage(employeeId, nextStage);

      // Update the local state
      setOnboardingEmployees((prev) =>
        prev.map((emp) => {
          if (emp.id === employeeId) {
            return {
              ...emp,
              status: nextStage,
              progress: calculateProgress(nextStage),
            };
          }
          return emp;
        })
      );

      toast.success("Onboarding stage updated successfully");
    } catch (error) {
      console.error("Error updating onboarding stage:", error);
      toast.error("Failed to update onboarding stage");
    }
  };

  // Add this helper function to calculate progress percentage
  const calculateProgress = (stage: string): number => {
    switch (stage) {
      case ONBOARDING_STAGES.NOT_STARTED:
        return 0;
      case ONBOARDING_STAGES.CONTRACT_STAGE:
        return 20;
      case ONBOARDING_STAGES.DOCUMENTATION_STAGE:
        return 40;
      case ONBOARDING_STAGES.IT_SETUP_STAGE:
        return 60;
      case ONBOARDING_STAGES.TRAINING_STAGE:
        return 80;
      case ONBOARDING_STAGES.COMPLETED:
        return 100;
      default:
        return 0;
    }
  };

  const handleDepartmentSelect = (department: Department) => {
    setFormData((prev) => ({ ...prev, department: department._id }));
  };

  const handleDepartmentUpdate = async (department: Department) => {
    try {
      await departmentService.updateDepartment(department._id, {
        name: department.name,
        code: department.code,
        description: department.description,
        location: department.location,
        headOfDepartment: department.headOfDepartment._id,
        status: department.status,
      });
      toast.success("Department updated successfully");
      setShowDepartmentModal(false);
      fetchData();
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(
          error.response?.data?.message || "Failed to update department"
        );
      } else {
        toast.error("An unexpected error occurred");
      }
    }
  };

  // Add this function to handle task completion
  const handleTaskComplete = async (employeeId: string, taskName: string) => {
    try {
      await onboardingService.completeTask(employeeId, taskName);
      toast.success("Task completed successfully");
      fetchData(); // Refresh the data
    } catch (error) {
      console.error("Error completing task:", error);
      toast.error("Failed to complete task");
    }
  };

  // Now you can safely use conditional rendering
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
      {/* Simplified top section with just the buttons */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setShowCreateModal(true)}
          className="!bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
        >
          <FaUserPlus className="text-lg" />
          <span>Create Employee</span>
        </button>

        <button
          onClick={() => setShowAdminModal(true)}
          className="!bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
        >
          <FaUsers className="text-lg" />
          <span>Create Admin</span>
        </button>

        <button
          onClick={() => setShowDepartmentModal(true)}
          className="!bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
        >
          <FaBuildingColumns className="text-lg" />
          <span>Manage Departments</span>
        </button>
      </div>

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
                <div className="bg-white rounded-lg shadow p-6 relative">
                  {/* User Info Section */}
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 text-lg font-semibold">
                        {employee.firstName[0]}
                        {employee.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {`${employee.firstName} ${employee.lastName}`}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {employee.position}
                      </p>
                    </div>
                  </div>

                  {/* Employee Details */}
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Department:</span>{" "}
                      {employee.department.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Status:</span>{" "}
                      {employee.onboarding.status
                        .replace(/_/g, " ")
                        .toUpperCase()}
                    </p>

                    {/* Progress Bar */}
                    <div className="mt-2">
                      <div className="h-2 bg-gray-200 rounded">
                        <div
                          className="h-2 bg-indigo-600 rounded"
                          style={{
                            width: `${calculateProgress(
                              employee.onboarding.status
                            )}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Onboarding Progress:{" "}
                        {calculateProgress(employee.onboarding.status)}%
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Current Stage:{" "}
                        {employee.onboarding.status
                          .replace(/_/g, " ")
                          .toUpperCase()}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                      {employee.onboarding.status !==
                        ONBOARDING_STAGES.COMPLETED && (
                        <button
                          onClick={() =>
                            handleUpdateOnboardingStage(
                              employee._id,
                              employee.onboarding.status
                            )
                          }
                          className="w-full flex items-center justify-center space-x-2 px-4 py-2 
                                   bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 
                                   hover:to-indigo-700 text-white rounded-lg transition-all duration-200 
                                   transform hover:scale-[1.02] mb-2"
                        >
                          <span className="font-medium">
                            Move to Next Stage
                          </span>
                        </button>
                      )}

                      <button
                        onClick={() => handleInitiateOffboarding(employee._id)}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 
                                 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 
                                 hover:to-red-700 text-white rounded-lg transition-all duration-200 
                                 transform hover:scale-[1.02]"
                      >
                        <FaUserMinus className="text-lg" />
                        <span className="font-medium">
                          Initiate Offboarding
                        </span>
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

      {/* Modals */}
      {showCreateModal && (
        <Dialog
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-xl bg-white p-6 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <Dialog.Title className="text-xl font-semibold text-gray-900">
                  Create New Employee
                </Dialog.Title>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleCreateEmployee} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          firstName: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          lastName: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Phone
                    </label>
                    <input
                      type="tel"
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Position
                    </label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      value={formData.position}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          position: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Grade Level
                    </label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      value={formData.gradeLevel}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          gradeLevel: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Work Location
                    </label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      value={formData.workLocation}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          workLocation: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Date Joined
                    </label>
                    <input
                      type="date"
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      value={formData.dateJoined}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          dateJoined: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Department
                    </label>
                    <select
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          department: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    disabled={isCreating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white !bg-green-600 rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed"
                  >
                    {isCreating ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      "Create Employee"
                    )}
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}

      {showAdminModal && (
        <CreateAdminModal
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
          departments={departments.map((dept) => dept.name)}
        />
      )}

      <DepartmentModal
        isOpen={showDepartmentModal}
        onClose={() => setShowDepartmentModal(false)}
        departments={departments}
        admins={admins}
        isLoading={isLoading}
        onSuccess={async () => {
          const response = await departmentService.getAllDepartments();
          setDepartments(response);
        }}
      />
    </motion.div>
  );
}
