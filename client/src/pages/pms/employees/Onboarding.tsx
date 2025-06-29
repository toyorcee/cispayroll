import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FaSpinner,
  FaUserPlus,
  FaUserCheck,
  FaUsers,
  FaBuilding,
  FaChartLine,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaPlay,
  FaPause,
  FaCheckCircle,
  FaInfoCircle,
  FaSync,
} from "react-icons/fa";
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
import { onboardingService } from "../../../services/onboardingService";
import { OnboardingDetailsModal } from "../../../components/modals/OnboardingDetailsModal";
import { SimpleCarousel } from "../../../components/shared/SimpleCarousel";

// Define OnboardingFilters type locally
interface OnboardingFilters {
  status?: string;
  department?: string;
  search?: string;
}

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
        const deps = await departmentService.getAllDepartments(
          user?.role,
          user?.permissions
        );
        setDepartments(deps);
        const response = await onboardingService.getOnboardingEmployees({
          page,
          limit: 10,
          ...filters,
        });

        // Access the correct nested data structure
        const employeesData = response.data?.data || response.data || [];
        const paginationData = response.data?.pagination || response.pagination;
        const statsData = response.data?.stats || response.stats;

        if (!employeesData || !Array.isArray(employeesData)) {
          setError("Failed to load onboarding data.");
          setOnboardingEmployees([]);
          setStats({ total: 0, byStatus: {}, departments: [] });
          setPagination({ total: 0, page: 1, limit: 10, totalPages: 0 });
          return;
        }

        // If the array is empty, that's fine! Just set the state and let the UI show the empty state.
        if (employeesData.length === 0) {
          setOnboardingEmployees([]);
          setStats({ total: 0, byStatus: {}, departments: [] });
          setPagination({ total: 0, page: 1, limit: 10, totalPages: 0 });
          setError(null);
          return;
        }

        // Transform the data to correctly map onboarding information
        const transformedEmployees = employeesData.map((emp: any) => {
          const transformed = {
            ...emp,
            onboarding: {
              status:
                emp.onboarding?.status ||
                emp.lifecycle?.onboarding?.status ||
                "not_started",
              progress:
                emp.onboarding?.progress ||
                emp.lifecycle?.onboarding?.progress ||
                0,
              tasks:
                emp.onboarding?.tasks || emp.lifecycle?.onboarding?.tasks || [],
              startedAt:
                emp.onboarding?.startedAt ||
                emp.lifecycle?.onboarding?.startedAt,
            },
            department: emp.department,
          };

          return transformed;
        });

        const filteredEmployees = transformedEmployees.filter((emp: any) => {
          return (
            emp.role !== "SUPER_ADMIN" &&
            emp.onboarding?.status !== "completed" &&
            emp.status !== "offboarding"
          );
        });

        setOnboardingEmployees(filteredEmployees);
        setPagination(
          paginationData || { total: 0, page: 1, limit: 10, totalPages: 0 }
        );
        setStats(statsData || { total: 0, byStatus: {}, departments: [] });
        setError(null);
      } catch (error: unknown) {
        setError(
          error instanceof Error
            ? error.message || "Failed to load data"
            : "An unknown error occurred"
        );
        setOnboardingEmployees([]);
        setStats({ total: 0, byStatus: {}, departments: [] });
        setPagination({ total: 0, page: 1, limit: 10, totalPages: 0 });
        console.error("[Onboarding] Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      try {
        const response = await onboardingService.getOnboardingEmployees();
        const employeesData = response.data?.data || response.data || [];

        const transformedEmployees = employeesData.map((emp: any) => ({
          ...emp,
          onboarding: {
            status:
              emp.onboarding?.status ||
              emp.lifecycle?.onboarding?.status ||
              "not_started",
            progress:
              emp.onboarding?.progress ||
              emp.lifecycle?.onboarding?.progress ||
              0,
            tasks:
              emp.onboarding?.tasks || emp.lifecycle?.onboarding?.tasks || [],
            startedAt:
              emp.onboarding?.startedAt || emp.lifecycle?.onboarding?.startedAt,
          },
          department:
            typeof emp.department === "string"
              ? { name: emp.department }
              : emp.department,
        }));

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
    if (!filters.status || filters.status === "all") {
      return onboardingEmployees;
    }
    return onboardingEmployees.filter(
      (emp) => emp.onboarding?.status === filters.status
    );
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

  // Modern animated empty state using Tailwind and MUI only
  const EmptyState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex flex-col items-center justify-center py-20 px-6"
    >
      {/* Animated Success Icon */}
      <motion.div
        className="relative mb-8"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 15,
          delay: 0.2,
        }}
      >
        {/* Outer ring animation */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-green-200"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 0.2, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Inner success circle */}
        <div className="relative flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-2xl">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
              delay: 0.4,
            }}
          >
            <FaUserCheck className="text-white text-6xl drop-shadow-lg" />
          </motion.div>
        </div>

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-green-300 rounded-full"
            style={{
              top: `${20 + Math.sin((i * 60 * Math.PI) / 180) * 60}px`,
              left: `${20 + Math.cos((i * 60 * Math.PI) / 180) * 60}px`,
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>

      {/* Success Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="text-center max-w-2xl"
      >
        <h3 className="text-3xl font-bold text-gray-800 mb-4">
          🎉 All Onboarding Complete!
        </h3>
        <p className="text-lg text-gray-600 mb-6 leading-relaxed">
          Fantastic news! All employees have successfully completed their
          onboarding process. Your team is ready to hit the ground running.
        </p>

        {/* Stats Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-center justify-center mb-2">
              <FaUserCheck className="text-green-600 text-xl" />
            </div>
            <p className="text-sm text-green-700 font-medium">Completed</p>
            <p className="text-2xl font-bold text-green-800">{stats.total}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-center mb-2">
              <FaUsers className="text-blue-600 text-xl" />
            </div>
            <p className="text-sm text-blue-700 font-medium">Total Employees</p>
            <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center justify-center mb-2">
              <FaChartLine className="text-purple-600 text-xl" />
            </div>
            <p className="text-sm text-purple-700 font-medium">Success Rate</p>
            <p className="text-2xl font-bold text-purple-800">100%</p>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <button
            onClick={() => fetchData(1, filters)}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            <FaSync className="inline mr-2" />
            Refresh Data
          </button>
        </motion.div>

        {/* Celebration Message */}
        <motion.p
          className="text-sm text-gray-500 mt-6 italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          🚀 Your onboarding process is running smoothly! New employees will
          appear here when they start their journey.
        </motion.p>
      </motion.div>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100">
        <div className="text-center animate-pulse">
          <FaSpinner className="animate-spin text-5xl text-sky-500 mx-auto mb-6" />
          <h2 className="text-xl font-bold text-sky-700 mb-2">
            Loading onboarding dashboard...
          </h2>
          <p className="text-gray-500">
            Please wait while we fetch the latest onboarding data.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center animate-fade-in">
          <div className="bg-red-100 text-red-600 p-6 rounded-2xl shadow mb-4">
            <p className="font-bold text-lg">Error loading dashboard</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={() => fetchData(1, filters)}
            className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-6 py-2 rounded-lg shadow transition-all"
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

  const welcomingDepartments = stats.departments
    .map((deptId) => {
      const department = departments.find((d) => d._id === deptId);
      if (!department) return null;
      const count = onboardingEmployees.filter((emp) => {
        if (typeof emp.department === "string") {
          return emp.department === deptId;
        } else if (emp.department && typeof emp.department === "object") {
          return "_id" in emp.department && emp.department._id === deptId;
        }
        return false;
      }).length;
      if (count === 0) return null;
      return { ...department, count };
    })
    .filter((d): d is NonNullable<typeof d> => !!d);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-8 overflow-x-hidden"
    >
      {/* Filter and Stats Section */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
        <div className="p-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
            <h2 className="text-2xl font-bold text-gray-800">
              Onboarding Employees
            </h2>
            <div className="flex flex-wrap gap-4">
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

          {/* Modern Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {/* Total Employees Card */}
            <motion.div
              whileHover={{ scale: 1.04, rotateY: 6 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 18,
              }}
              className="relative p-7 rounded-2xl shadow-xl border-0 bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100 hover:from-blue-100 hover:to-white transition-all duration-300 group overflow-hidden flex flex-col justify-between h-36"
            >
              <div className="flex flex-col items-start z-10 pt-1 pr-2">
                <h3 className="text-base font-semibold text-gray-700 mb-1 opacity-90 tracking-wide">
                  Total Employees
                </h3>
                <motion.p
                  className="text-4xl font-extrabold text-gray-900 mb-1 drop-shadow-lg"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  {stats.total}
                </motion.p>
                <p className="text-sm text-gray-500 opacity-80">
                  In onboarding process
                </p>
              </div>
              <motion.div
                className="absolute top-5 right-6 p-4 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg z-0 group-hover:scale-110 transition-transform duration-300"
                initial={{ rotate: -10, scale: 0.95 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 180 }}
              >
                <FaUsers className="w-8 h-8 text-white drop-shadow" />
              </motion.div>
            </motion.div>

            {/* Not Started Card */}
            <motion.div
              whileHover={{ scale: 1.04, rotateY: 6 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 18,
                delay: 0.1,
              }}
              className="relative p-7 rounded-2xl shadow-xl border-0 bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 hover:from-gray-100 hover:to-white transition-all duration-300 group overflow-hidden flex flex-col justify-between h-36"
            >
              <div className="flex flex-col items-start z-10 pt-1 pr-2">
                <h3 className="text-base font-semibold text-gray-700 mb-1 opacity-90 tracking-wide">
                  Not Started
                </h3>
                <motion.p
                  className="text-4xl font-extrabold text-gray-900 mb-1 drop-shadow-lg"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  {stats.byStatus.not_started || 0}
                </motion.p>
                <p className="text-sm text-gray-500 opacity-80">
                  Awaiting initiation
                </p>
              </div>
              <motion.div
                className="absolute top-5 right-6 p-4 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 shadow-lg z-0 group-hover:scale-110 transition-transform duration-300"
                initial={{ rotate: -10, scale: 0.95 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 180 }}
              >
                <FaPause className="w-8 h-8 text-white drop-shadow" />
              </motion.div>
            </motion.div>

            {/* In Progress Card */}
            <motion.div
              whileHover={{ scale: 1.04, rotateY: 6 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 18,
                delay: 0.2,
              }}
              className="relative p-7 rounded-2xl shadow-xl border-0 bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 hover:from-yellow-100 hover:to-white transition-all duration-300 group overflow-hidden flex flex-col justify-between h-36"
            >
              <div className="flex flex-col items-start z-10 pt-1 pr-2">
                <h3 className="text-base font-semibold text-gray-700 mb-1 opacity-90 tracking-wide">
                  In Progress
                </h3>
                <motion.p
                  className="text-4xl font-extrabold text-gray-900 mb-1 drop-shadow-lg"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  {Object.entries(stats.byStatus).reduce(
                    (total, [status, count]) => {
                      if (status !== "not_started" && status !== "completed") {
                        return total + count;
                      }
                      return total;
                    },
                    0
                  )}
                </motion.p>
                <p className="text-sm text-gray-500 opacity-80">
                  Currently active
                </p>
              </div>
              <motion.div
                className="absolute top-5 right-6 p-4 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg z-0 group-hover:scale-110 transition-transform duration-300"
                initial={{ rotate: -10, scale: 0.95 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 180 }}
              >
                <FaPlay className="w-8 h-8 text-white drop-shadow" />
              </motion.div>
            </motion.div>

            {/* Completed Card */}
            <motion.div
              whileHover={{ scale: 1.04, rotateY: 6 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 18,
                delay: 0.3,
              }}
              className="relative p-7 rounded-2xl shadow-xl border-0 bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 hover:from-green-100 hover:to-white transition-all duration-300 group overflow-hidden flex flex-col justify-between h-36"
            >
              <div className="flex flex-col items-start z-10 pt-1 pr-2">
                <h3 className="text-base font-semibold text-gray-700 mb-1 opacity-90 tracking-wide">
                  Completed This Month
                </h3>
                <motion.p
                  className="text-4xl font-extrabold text-gray-900 mb-1 drop-shadow-lg"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  {stats.byStatus.completedThisMonth || 0}
                </motion.p>
                <p className="text-sm text-gray-500 opacity-80">
                  Successfully onboarded this month
                </p>
              </div>
              <motion.div
                className="absolute top-5 right-6 p-4 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg z-0 group-hover:scale-110 transition-transform duration-300"
                initial={{ rotate: -10, scale: 0.95 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 180 }}
              >
                <FaCheckCircle className="w-8 h-8 text-white drop-shadow" />
              </motion.div>
            </motion.div>
          </div>

          {/* New Departments Section - Welcome Cards */}
          {stats.departments && stats.departments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mb-8"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaUserPlus className="text-sky-500" />
                New Departments Welcoming Employees
              </h3>

              <div className="w-full">
                {welcomingDepartments.length >= 5 ? (
                  <SimpleCarousel
                    slidesPerView={1}
                    spaceBetween={16}
                    autoplay={true}
                    autoplaySpeed={4000}
                    loop={true}
                    className="!pb-8"
                    breakpoints={{
                      640: { slidesPerView: 2 },
                      768: { slidesPerView: 3 },
                      1024: { slidesPerView: 4 },
                    }}
                  >
                    {welcomingDepartments.map((department) => (
                      <div
                        key={department._id}
                        className="bg-white rounded-2xl shadow-md p-5 flex flex-col items-center justify-center border border-gray-100 transition hover:shadow-lg"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sky-500 text-2xl">
                            <FaBuilding />
                          </span>
                          <span className="font-bold text-lg text-gray-800 text-center">
                            {department.name}
                          </span>
                        </div>
                        <div className="text-sky-700 font-semibold text-xl mb-1">
                          {department.count} new{" "}
                          {department.count === 1 ? "employee" : "employees"}
                        </div>
                        <div className="text-xs text-gray-500 text-center">
                          {department.description ?? ""}
                        </div>
                      </div>
                    ))}
                  </SimpleCarousel>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {welcomingDepartments.map((department) => (
                      <div
                        key={department._id}
                        className="bg-white rounded-2xl shadow-md p-5 flex flex-col items-center justify-center border border-gray-100 transition hover:shadow-lg"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sky-500 text-2xl">
                            <FaBuilding />
                          </span>
                          <span className="font-bold text-lg text-gray-800 text-center">
                            {department.name}
                          </span>
                        </div>
                        <div className="text-sky-700 font-semibold text-xl mb-1">
                          {department.count} new{" "}
                          {department.count === 1 ? "employee" : "employees"}
                        </div>
                        <div className="text-xs text-gray-500 text-center">
                          {department.description ?? ""}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Department Stats Section */}
          {stats.departments && stats.departments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-8"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaBuilding className="text-sky-500" />
                Department Distribution
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.departments.map((deptId, index) => {
                  // Find the department object by ID
                  const department = departments.find(
                    (dept) => dept._id === deptId
                  );
                  if (!department) return null;

                  const deptCount = onboardingEmployees.filter((emp) => {
                    if (typeof emp.department === "string") {
                      return emp.department === deptId;
                    } else if (
                      emp.department &&
                      typeof emp.department === "object"
                    ) {
                      return (
                        "_id" in emp.department && emp.department._id === deptId
                      );
                    }
                    return false;
                  }).length;

                  if (deptCount === 0) return null;

                  return (
                    <motion.div
                      key={deptId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="bg-white rounded-xl shadow-md p-4 border border-gray-100 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-800 truncate">
                          {department.name}
                        </h4>
                        <span className="text-2xl font-bold text-sky-600">
                          {deptCount}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-sky-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${(deptCount / stats.total) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {((deptCount / stats.total) * 100).toFixed(1)}% of total
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Quick Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          >
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-100">
                  <FaCalendarAlt className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-medium flex items-center gap-1">
                    Started This Month
                    <FaInfoCircle
                      className="inline text-purple-400 cursor-pointer"
                      title="Number of employees whose onboarding started this month. Helps track new joiners."
                    />
                  </p>
                  <p className="text-xl font-bold text-purple-800">
                    {
                      onboardingEmployees.filter((emp) => {
                        const startedAt = emp.onboarding?.startedAt;
                        if (!startedAt) return false;
                        const startDate = new Date(startedAt);
                        const now = new Date();
                        return (
                          startDate.getMonth() === now.getMonth() &&
                          startDate.getFullYear() === now.getFullYear()
                        );
                      }).length
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-orange-100">
                  <FaExclamationTriangle className="text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-orange-600 font-medium flex items-center gap-1">
                    Stuck &gt; 30 Days
                    <FaInfoCircle
                      className="inline text-orange-400 cursor-pointer"
                      title="Employees who started onboarding over 30 days ago and are not yet completed. Helps spot bottlenecks."
                    />
                  </p>
                  <p className="text-xl font-bold text-orange-800">
                    {
                      onboardingEmployees.filter((emp) => {
                        const startedAt = emp.onboarding?.startedAt;
                        if (!startedAt) return false;
                        const startDate = new Date(startedAt);
                        const now = new Date();
                        const daysDiff =
                          (now.getTime() - startDate.getTime()) /
                          (1000 * 3600 * 24);
                        return (
                          daysDiff > 30 &&
                          emp.onboarding?.status !== "completed"
                        );
                      }).length
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-emerald-100">
                  <FaChartLine className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-emerald-600 font-medium flex items-center gap-1">
                    Avg Progress
                    <FaInfoCircle
                      className="inline text-emerald-400 cursor-pointer"
                      title="Average onboarding progress across all employees. Gives a quick sense of overall onboarding health."
                    />
                  </p>
                  <p className="text-xl font-bold text-emerald-800">
                    {onboardingEmployees.length > 0
                      ? Math.round(
                          onboardingEmployees.reduce(
                            (sum, emp) => sum + (emp.onboarding?.progress || 0),
                            0
                          ) / onboardingEmployees.length
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Employee Cards Grid */}
          {displayedEmployees.length === 0 ? (
            <EmptyState />
          ) : (
            <Grid container spacing={4}>
              {displayedEmployees.map((employee) => (
                <Grid item xs={12} sm={6} lg={4} key={employee._id}>
                  <motion.div
                    whileHover={{
                      scale: 1.03,
                      boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                    }}
                    className="bg-white rounded-2xl shadow-md p-6 min-h-[220px] flex flex-col justify-between transition-all cursor-pointer border border-gray-100 hover:shadow-lg"
                    onClick={() => handleOpenModal(employee)}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative">
                        {employee.profileImage ? (
                          <img
                            src={`${import.meta.env.VITE_API_URL}/${
                              employee.profileImage
                            }`}
                            alt={`${employee.firstName} ${employee.lastName}`}
                            className="h-14 w-14 rounded-full object-cover border-2 border-sky-100 shadow"
                            onError={(e) => {
                              e.currentTarget.src =
                                "/src/assets/user-avatar.png";
                            }}
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center border-2 border-sky-100 shadow">
                            <span className="text-white font-bold text-lg">
                              {employee.firstName?.charAt(0)}
                              {employee.lastName?.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div
                          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                            employee.onboarding?.status === "completed"
                              ? "bg-green-500"
                              : employee.onboarding?.status === "not_started"
                              ? "bg-gray-400"
                              : "bg-yellow-500"
                          }`}
                        ></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 truncate">
                          {employee.firstName} {employee.lastName}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                          {employee.position}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          {employee.employeeId}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {typeof employee.department === "string"
                            ? employee.department
                            : employee.department?.name}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-700">
                          Onboarding Progress
                        </span>
                        <span className="text-xs font-bold text-gray-900">
                          {employee.onboarding?.progress || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-sky-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${employee.onboarding?.progress || 0}%`,
                          }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            employee.onboarding?.status as OnboardingStage
                          )}`}
                        >
                          {getStatusText(
                            employee.onboarding?.status as OnboardingStage
                          )}
                        </span>
                        {employee.onboarding?.startedAt && (
                          <span className="text-xs text-gray-500">
                            {new Date(
                              employee.onboarding.startedAt
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          )}

          <div className="mt-10 flex justify-center">
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

      {/* Employee Details Modal */}
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
