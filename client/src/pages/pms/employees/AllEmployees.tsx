import { useState, useEffect } from "react";
import {
  FaBuilding,
  FaPlus,
  FaEdit,
  FaTimes,
  FaSpinner,
  FaSignOutAlt,
  FaExclamationTriangle,
  FaUsers,
} from "react-icons/fa";
import { Employee, EmployeeFilters } from "../../../types/employee";
import { Status } from "../../../types/common";
import { useAuth } from "../../../context/AuthContext";
import { UserRole, Permission } from "../../../types/auth";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Component imports
import { EmployeeSearch } from "../../../components/employees/EmployeeSearch";
import { EmployeeDetailsModal } from "../../../components/employees/EmployeeDetailsModal";
import { StatusFilter } from "../../../components/employees/StatusFilter";
import { Pagination } from "../../../components/shared/Pagination";
import { EmployeeTableSkeleton } from "../../../components/employees/EmployeeTableSkeleton";
import { DepartmentModal } from "../../../components/departments/DepartmentModal";
import { EditEmployeeModal } from "../../../components/employees/EditEmployeeModal";

// Service imports
import {
  employeeService,
  EMPLOYEES_QUERY_KEY,
} from "../../../services/employeeService";
import { departmentService } from "../../../services/departmentService";
import { salaryStructureService } from "../../../services/salaryStructureService";
import { offboardingService } from "../../../services/offboardingService";

// Additional imports
import { toast } from "react-toastify";
import { Dialog } from "@headlessui/react";
import { Department } from "../../../types/department";
import type { AdminResponse } from "../../../services/employeeService";
import { ISalaryGrade } from "../../../types/salary";
import { Tooltip } from "@mui/material";
import { OffboardingType } from "../../../types/offboarding";

const LoadingDots = () => (
  <div className="flex space-x-1 items-center px-2">
    <motion.div
      className="w-2 h-2 bg-blue-500 rounded-full"
      animate={{ y: ["0%", "-50%", "0%"] }}
      transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
    />
    <motion.div
      className="w-2 h-2 bg-green-500 rounded-full"
      animate={{ y: ["0%", "-50%", "0%"] }}
      transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
    />
    <motion.div
      className="w-2 h-2 bg-red-500 rounded-full"
      animate={{ y: ["0%", "-50%", "0%"] }}
      transition={{ duration: 0.5, repeat: Infinity, delay: 0.4 }}
    />
  </div>
);

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
  role: "USER" | "ADMIN";
}

export default function AllEmployees() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filters, setFilters] = useState<EmployeeFilters>({
    page: 1,
    limit: 10,
    search: "",
    status: undefined,
    department: undefined,
  });
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showOffboardingModal, setShowOffboardingModal] = useState(false);
  const [showOffboardingConfirm, setShowOffboardingConfirm] = useState(false);
  const [employeeToOffboard, setEmployeeToOffboard] = useState<Employee | null>(
    null
  );
  const [formData, setFormData] = useState<EmployeeFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
    gradeLevel: "",
    workLocation: "",
    dateJoined: new Date().toISOString().split("T")[0],
    department: "",
    role: "USER",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [admins, setAdmins] = useState<AdminResponse[]>([]);
  const [offboardingData, setOffboardingData] = useState({
    type: "",
    reason: "",
    targetExitDate: new Date().toISOString().split("T")[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const isAdmin = user?.role === UserRole.ADMIN;

  const getActionPermissions = () => {
    if (isSuperAdmin) {
      return {
        canCreate: true,
        canEdit: true,
        canDelete: true,
      };
    }

    return {
      canCreate: user?.permissions?.includes(Permission.CREATE_USER),
      canEdit: user?.permissions?.includes(Permission.EDIT_USER),
      canDelete: user?.permissions?.includes(Permission.DELETE_USER),
    };
  };

  const { canCreate } = getActionPermissions();

  const { data: departmentsData, isLoading: departmentsLoading } =
    departmentService.useGetDepartments();

  const {
    data: employeesData,
    isLoading: isLoadingEmployees,
    error: employeesError,
    refetch,
  } = isSuperAdmin
    ? employeeService.useGetEmployees(filters)
    : employeeService.adminService.useGetEmployees(filters);

  // Update query configuration
  useEffect(() => {
    queryClient.setQueryDefaults([...EMPLOYEES_QUERY_KEY, filters], {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  }, [filters, queryClient]);

  const {
    data: salaryGrades = [],
    isLoading: salaryGradesLoading,
    error: salaryGradesError,
  } = useQuery<ISalaryGrade[]>({
    queryKey: ["salaryGrades", user?.role],
    queryFn: () => salaryStructureService.getAllSalaryGrades(user?.role),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: !!user?.role,
  });

  // Handle errors in useEffect
  useEffect(() => {
    if (salaryGradesError) {
      console.error("Salary grades query error:", salaryGradesError);
      toast.error("Failed to load salary grades. Please try again.");
    }
  }, [salaryGradesError]);

  // Log when salary grades are loaded
  useEffect(() => {
    if (salaryGrades.length > 0) {
      console.log("Salary grades loaded:", salaryGrades);
    }
  }, [salaryGrades]);

  const { data: adminsData } = employeeService.useGetAdmins();

  console.log("React Query State:", {
    isLoadingEmployees,
    employeesData,
    employeesError,
  });

  useEffect(() => {
    console.log("useEffect triggered with employeesData:", employeesData);
    if (employeesData) {
      // Preserve the original data structure for super admin
      if (isSuperAdmin) {
        setEmployees(employeesData.data || []);
        setTotalEmployees(employeesData.pagination?.total || 0);
      } else {
        // For regular admin, use the new structure
        setEmployees(employeesData.users || []);
        setTotalEmployees(employeesData.totalUsers || 0);
      }
    }
  }, [employeesData, isSuperAdmin]);

  useEffect(() => {
    if (departmentsData) {
      setDepartments(departmentsData);
    }
  }, [departmentsData]);

  useEffect(() => {
    if (adminsData && isSuperAdmin) {
      const filteredAdmins = adminsData.filter(
        (admin): admin is AdminResponse => {
          if (!admin || typeof admin !== "object") return false;
          return admin.role === UserRole.ADMIN;
        }
      );
      setAdmins(filteredAdmins);
    }
  }, [adminsData, isSuperAdmin]);

  const handleSearch = (query: string) => {
    setFilters((prev) => ({ ...prev, search: query, page: 1 }));
  };

  const handleEmployeeClick = (employeeId: string) => {
    const employee = employees.find((e) => e._id === employeeId);

    if (employee?.status?.toLowerCase() === "active") {
      setSelectedEmployeeId(employeeId);
      setShowDetailsModal(true);
    } else {
      toast.info("Detailed information is only available for active employees");
    }
  };

  const handleEditClick = (e: React.MouseEvent, employee: Employee) => {
    e.stopPropagation();
    setSelectedEmployeeId(employee._id);
    setShowEditModal(true);
  };

  const handleStatusChange = (newStatus: Status | undefined) => {
    setFilters((prev) => ({
      ...prev,
      status: newStatus,
      page: 1,
    }));
  };

  const handleDepartmentChange = (departmentId: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      department: departmentId,
      page: 1,
    }));
  };

  const refreshDepartments = async () => {
    try {
      const departments = await departmentService.getAllDepartments();
      setDepartments(departments);
    } catch (error) {
      console.error("Failed to refresh departments:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "!bg-green-600 !text-white";
      case "pending":
        return "!bg-blue-600 !text-white";
      case "offboarding":
        return "!bg-orange-600 !text-white";
      case "suspended":
        return "!bg-yellow-600 !text-white";
      case "terminated":
        return "!bg-red-600 !text-white";
      case "inactive":
        return "!bg-gray-600 !text-white";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleInitiateOffboarding = (
    e: React.MouseEvent,
    employee: Employee
  ) => {
    e.stopPropagation();
    console.log("[OFFBOARDING UI] Initiating offboarding for employee:", {
      id: employee._id,
      name: `${employee.firstName} ${employee.lastName}`,
      email: employee.email,
    });
    setEmployeeToOffboard(employee);
    setShowOffboardingConfirm(true);
  };

  const handleConfirmOffboarding = () => {
    if (employeeToOffboard) {
      console.log("[OFFBOARDING UI] Confirming offboarding for employee:", {
        id: employeeToOffboard._id,
        name: `${employeeToOffboard.firstName} ${employeeToOffboard.lastName}`,
      });
      setSelectedEmployeeId(employeeToOffboard._id);
      setShowOffboardingConfirm(false);
      setShowOffboardingModal(true);
    }
  };

  const handleOffboardingSubmit = async () => {
    try {
      if (!selectedEmployeeId) return;
      setIsSubmitting(true);
      console.log("[OFFBOARDING UI] Submitting offboarding form with data:", {
        employeeId: selectedEmployeeId,
        type: offboardingData.type,
        reason: offboardingData.reason,
        targetExitDate: offboardingData.targetExitDate,
      });
      await offboardingService.initiateOffboarding(selectedEmployeeId, {
        type: offboardingData.type as OffboardingType,
        reason: offboardingData.reason,
        targetExitDate: new Date(offboardingData.targetExitDate),
      });
      console.log(
        "[OFFBOARDING UI] Offboarding process initiated successfully"
      );
      toast.success("Offboarding process initiated successfully");
      setShowOffboardingModal(false);
      refetch();
    } catch (error) {
      console.error("[OFFBOARDING UI] Error initiating offboarding:", error);
      toast.error("Failed to initiate offboarding process");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderActions = (employee: Employee) => (
    <div
      className="flex justify-end items-center gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      <Tooltip title="Edit employee details" arrow>
        <button
          onClick={(e) => handleEditClick(e, employee)}
          className="text-blue-600 hover:text-blue-900 flex items-center cursor-pointer transition-colors"
        >
          <FaEdit className="h-5 w-5" />
        </button>
      </Tooltip>
      <Tooltip title="Initiate offboarding process" arrow>
        <button
          onClick={(e) => handleInitiateOffboarding(e, employee)}
          className="text-red-600 hover:text-red-900 flex items-center cursor-pointer transition-colors"
        >
          <FaSignOutAlt className="h-5 w-5" />
        </button>
      </Tooltip>
    </div>
  );

  const handleCreateEmployee = async (formData: EmployeeFormData) => {
    try {
      setIsCreating(true);
      console.log("Creating employee with data:", formData);

      // Ensure department is set for admin users
      if (!formData.department && isAdmin) {
        const userDepartment =
          typeof user?.department === "object"
            ? user.department._id
            : user?.department;

        if (!userDepartment) {
          toast.error("No department assigned to admin user");
          return;
        }

        formData.department = userDepartment;
      }

      if (isAdmin) {
        formData.role = "USER";
      }

      let response;
      if (isSuperAdmin) {
        console.log("Using super admin service to create employee");
        response = await employeeService.createEmployee(formData);
      } else {
        console.log("Using admin service to create employee");
        response = await employeeService.adminService.createEmployee(formData);
      }

      console.log("Employee creation response:", response);

      toast.success("Employee created successfully. Invitation sent.");
      setShowCreateModal(false);
      refetch();
    } catch (error) {
      console.error("Error creating employee:", error);
      toast.error("Failed to create employee. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateEmployee = async (id: string, data: Partial<Employee>) => {
    try {
      if (isSuperAdmin) {
        await employeeService.updateEmployee(id, data);
      } else {
        await employeeService.adminService.updateEmployee(id, data);
      }

      toast.success("Employee updated successfully");
      setShowEditModal(false);
      refetch();
    } catch (error) {
      console.error("Error updating employee:", error);
      toast.error("Failed to update employee");
    }
  };

  const renderDepartmentName = (department: any) => {
    if (typeof department === "object" && department !== null) {
      return department.name || "No Department";
    }
    return (
      departments?.find((d) => d._id === department)?.name || "No Department"
    );
  };

  // Use the hook to fetch employee details
  const {
    data: employeeDetails,
    isLoading: isLoadingEmployeeDetails,
    error: employeeDetailsError,
  } = useQuery({
    queryKey: ["employee", selectedEmployeeId],
    queryFn: async () => {
      if (!selectedEmployeeId) {
        return null;
      }

      try {
        const result = isSuperAdmin
          ? await employeeService.getEmployeeById(selectedEmployeeId)
          : await employeeService.adminService.getEmployeeById(
              selectedEmployeeId
            );

        return result;
      } catch (error) {
        console.error("Error fetching employee details:", error);
        throw error;
      }
    },
    enabled: !!selectedEmployeeId,
  });

  // Add effect to log when employeeDetails changes
  useEffect(() => {
    // Silent effect to handle employee details updates
  }, [
    employeeDetails,
    isLoadingEmployeeDetails,
    employeeDetailsError,
    showDetailsModal,
    selectedEmployeeId,
  ]);

  // Fetch departments when component mounts
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const departments = await departmentService.getAllDepartments();
        setDepartments(departments);
      } catch (error) {
        console.error("Failed to fetch departments:", error);
      }
    };
    fetchDepartments();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4"
    >
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-2">
          <div className="bg-gradient-to-br from-green-500 to-blue-500 rounded-full p-3 shadow-lg">
            <FaUsers className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              All Employees
            </h1>
            <p className="text-gray-600 text-sm">
              View, manage, and onboard employees. Use filters and actions to
              manage your workforce efficiently.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons and Filters Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-lg p-6 mb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
      >
        <div className="w-full sm:w-auto sm:flex-1 max-w-md">
          <EmployeeSearch onSearch={handleSearch} />
        </div>
        <div className="w-full sm:w-auto flex flex-col xs:flex-row items-stretch gap-2">
          {canCreate && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="min-w-[140px] px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <FaPlus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          )}
          {isSuperAdmin && (
            <button
              onClick={() => setShowDepartmentModal(true)}
              className="min-w-[140px] px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <FaBuilding className="w-4 h-4" />
              <span>Manage Departments</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* Filters/Status Bar Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl shadow p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full"
      >
        <div className="flex-1 w-full sm:w-auto">
          <StatusFilter
            currentStatus={filters.status as Status | undefined}
            onStatusChange={handleStatusChange}
            className="flex flex-nowrap overflow-x-auto"
            buttonClassName="px-3 py-1.5 text-xs rounded-lg whitespace-nowrap"
          />
        </div>
        {isSuperAdmin && (
          <div className="w-full sm:w-56">
            <select
              value={filters.department || ""}
              onChange={(e) =>
                handleDepartmentChange(e.target.value || undefined)
              }
              className="w-full p-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Departments</option>
              <option value="No Department">No Department</option>
              {departmentsData?.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name} ({dept.employeeCounts.total})
                </option>
              ))}
            </select>
          </div>
        )}
      </motion.div>
      <div className="border-b border-gray-200 mb-6" />

      <div className="bg-white rounded-lg shadow mt-6 overflow-hidden">
        {isLoadingEmployees ? (
          <div className="w-full">
            <EmployeeTableSkeleton isSuperAdmin={isSuperAdmin} />
            <div className="text-center mt-4">Loading employees...</div>
          </div>
        ) : employeesError ? (
          <div className="p-4 text-center text-red-500">
            Error loading employees: {(employeesError as Error).message}
          </div>
        ) : !employees || employees.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No employees found
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <div className="rounded-xl shadow-lg bg-gradient-to-br from-white via-blue-50 to-purple-50">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-blue-500 to-purple-500">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Employee
                      </th>
                      {isSuperAdmin && (
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Department
                        </th>
                      )}
                      <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Position
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-white uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employees.map((employee, idx) => (
                      <motion.tr
                        key={employee._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() => handleEmployeeClick(employee._id || "")}
                        className={`transition-colors duration-200 ${
                          employee.status.toLowerCase() === "active"
                            ? "hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer"
                            : "cursor-not-allowed"
                        } ${idx % 2 === 0 ? "bg-white" : "bg-blue-50"}`}
                      >
                        <td className="px-3 py-2">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                                {employee.firstName} {employee.lastName}
                              </div>
                              <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                {employee.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        {isSuperAdmin && (
                          <td className="px-3 py-2">
                            <div className="text-sm text-gray-900 truncate max-w-[150px]">
                              {renderDepartmentName(employee.department)}
                            </div>
                          </td>
                        )}
                        <td className="px-3 py-2">
                          <div className="text-sm text-gray-900 truncate max-w-[150px]">
                            {employee.position}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-sm">
                            {(employee as any).role === "SUPER_ADMIN"
                              ? "Super Admin"
                              : (employee as any).role === "ADMIN"
                              ? "Admin"
                              : "Employee"}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full
                              ${getStatusColor(employee.status)}`}
                          >
                            {employee.status.charAt(0).toUpperCase() +
                              employee.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-medium">
                          {renderActions(employee)}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile View */}
            <div className="md:hidden">
              {employees.map((employee) => (
                <div
                  key={employee._id}
                  onClick={() => handleEmployeeClick(employee._id || "")}
                  className="p-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {employee.firstName} {employee.lastName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {employee.email}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full
                        ${getStatusColor(employee.status)}`}
                    >
                      {employee.status.charAt(0).toUpperCase() +
                        employee.status.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                    {isSuperAdmin && (
                      <div className="text-gray-500">
                        <span className="font-medium">Department:</span>{" "}
                        {renderDepartmentName(employee.department)}
                      </div>
                    )}
                    <div className="text-gray-500">
                      <span className="font-medium">Position:</span>{" "}
                      {employee.position}
                    </div>
                    <div className="text-gray-500">
                      <span className="font-medium">Role:</span>{" "}
                      {(employee as any).role === "SUPER_ADMIN"
                        ? "Super Admin"
                        : (employee as any).role === "ADMIN"
                        ? "Admin"
                        : "Employee"}
                    </div>
                  </div>

                  <div className="mt-2 flex justify-end gap-2">
                    {renderActions(employee)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {!isLoadingEmployees && employees.length > 0 && (
        <div className="mt-6">
          <div className="flex flex-col items-center gap-2 text-sm text-gray-600 mb-4">
            <div>
              Showing{" "}
              <span className="font-semibold text-green-600">
                {((filters.page || 1) - 1) * (filters.limit || 10) + 1}
              </span>{" "}
              -{" "}
              <span className="font-semibold text-green-600">
                {Math.min(
                  (filters.page || 1) * (filters.limit || 10),
                  totalEmployees
                )}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-green-600">
                {totalEmployees}
              </span>{" "}
              employees
            </div>
            <div>
              Page{" "}
              <span className="font-semibold text-green-600">
                {filters.page || 1}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-green-600">
                {Math.ceil(totalEmployees / (filters.limit || 10))}
              </span>
            </div>
          </div>
          <Pagination
            currentPage={filters.page || 1}
            totalPages={Math.ceil(totalEmployees / (filters.limit || 10))}
            onPageChange={(page) => {
              setFilters((prev) => ({ ...prev, page }));
              window.scrollTo(0, 0);
            }}
          />
        </div>
      )}

      <EmployeeDetailsModal
        employee={isLoadingEmployeeDetails ? null : employeeDetails || null}
        departments={departments}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedEmployeeId(null);
        }}
      />

      <EditEmployeeModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        employee={
          employees.find((e) => e._id === selectedEmployeeId) ||
          ({} as Employee)
        }
        onSave={(data) => handleUpdateEmployee(selectedEmployeeId || "", data)}
      />

      <Dialog
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        className="relative z-50"
      >
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          aria-hidden="true"
        />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-2xl shadow-2xl bg-gradient-to-br from-white via-blue-50 to-emerald-50 p-0">
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-blue-500 rounded-t-2xl px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaPlus className="text-white text-xl" />
                <h2 className="text-lg font-bold text-white">
                  Create New Employee
                </h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-white hover:text-emerald-200 focus:outline-none text-xl bg-white/20 rounded-full p-2 hover:bg-white/30 transition-all duration-200"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateEmployee(formData);
              }}
              className="space-y-4 px-6 py-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    pattern="[A-Za-z\s]+"
                    title="Please enter a valid name (letters and spaces only)"
                    className="w-full rounded-lg border border-gray-200 bg-gradient-to-r from-white to-blue-50 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    pattern="[A-Za-z\s]+"
                    title="Please enter a valid name (letters and spaces only)"
                    className="w-full rounded-lg border border-gray-200 bg-gradient-to-r from-white to-blue-50 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full rounded-lg border border-gray-200 bg-gradient-to-r from-white to-blue-50 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value.toLowerCase(),
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    pattern="[\+]?[0-9\s\-]+"
                    title="Please enter a valid phone number"
                    className="w-full rounded-lg border border-gray-200 bg-gradient-to-r from-white to-blue-50 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="+234 XXX XXX XXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Position *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-lg border border-gray-200 bg-gradient-to-r from-white to-blue-50 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Grade Level *
                  </label>
                  <div className="relative">
                    <select
                      required
                      className="w-full rounded-lg border border-gray-200 bg-gradient-to-r from-white to-blue-50 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
                      value={formData.gradeLevel}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          gradeLevel: e.target.value,
                        }))
                      }
                      disabled={salaryGradesLoading}
                    >
                      <option value="">
                        {salaryGradesLoading
                          ? "Loading grades..."
                          : "Select Grade Level"}
                      </option>
                      {Array.isArray(salaryGrades) &&
                        salaryGrades.map((grade: ISalaryGrade) => (
                          <option key={grade._id} value={grade.level}>
                            {grade.level} - {grade.description} (₦
                            {(grade.basicSalary || 0).toLocaleString()})
                          </option>
                        ))}
                    </select>
                    {salaryGradesLoading && (
                      <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                        <LoadingDots />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Work Location *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-lg border border-gray-200 bg-gradient-to-r from-white to-blue-50 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
                    value={formData.workLocation}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        workLocation: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="HQ-3F-IT"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Date Joined *
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full rounded-lg border border-gray-200 bg-gradient-to-r from-white to-blue-50 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
                    value={formData.dateJoined}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        dateJoined: e.target.value,
                      }))
                    }
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>

                {isSuperAdmin && (
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Role *
                    </label>
                    <select
                      required
                      className="w-full rounded-lg border border-gray-200 bg-gradient-to-r from-white to-blue-50 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          role: e.target.value as "USER" | "ADMIN",
                        }))
                      }
                    >
                      <option value="USER">Regular Employee</option>
                      <option value="ADMIN">Department Admin</option>
                    </select>
                  </div>
                )}

                {isSuperAdmin && (
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Department *
                    </label>
                    <div className="relative">
                      <select
                        required
                        className="w-full rounded-lg border border-gray-200 bg-gradient-to-r from-white to-blue-50 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
                        value={formData.department}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          console.log("Selected department ID:", selectedId);
                          setFormData((prev) => ({
                            ...prev,
                            department: selectedId,
                          }));
                        }}
                        disabled={departmentsLoading}
                      >
                        <option value="">
                          {departmentsLoading
                            ? "Loading departments..."
                            : "Select Department"}
                        </option>
                        {departmentsData?.map((dept) => (
                          <option key={dept._id} value={dept._id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                      {departmentsLoading && (
                        <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                          <LoadingDots />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400 transition"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400 transition disabled:bg-green-400 disabled:cursor-not-allowed"
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

      <DepartmentModal
        isOpen={showDepartmentModal}
        onClose={() => setShowDepartmentModal(false)}
        departments={departments}
        admins={admins}
        isLoading={departmentsLoading}
        onSuccess={async () => {
          await refetch();
          await refreshDepartments();
        }}
      />

      <Dialog
        open={showOffboardingModal}
        onClose={() => setShowOffboardingModal(false)}
        className="relative z-50"
      >
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          aria-hidden="true"
        />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full rounded-2xl shadow-2xl bg-gradient-to-br from-white via-blue-50 to-emerald-50 p-0">
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-orange-500 via-yellow-500 to-pink-500 rounded-t-2xl px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaSignOutAlt className="text-white text-xl" />
                <h2 className="text-lg font-bold text-white">
                  Initiate Offboarding
                </h2>
              </div>
              <button
                onClick={() => setShowOffboardingModal(false)}
                className="text-white hover:text-yellow-200 focus:outline-none text-xl bg-white/20 rounded-full p-2 hover:bg-white/30 transition-all duration-200"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleOffboardingSubmit();
              }}
              className="space-y-4 px-6 py-6"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Type
                </label>
                <select
                  required
                  className="w-full rounded-lg border border-gray-200 bg-gradient-to-r from-white to-yellow-50 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
                  value={offboardingData.type}
                  onChange={(e) =>
                    setOffboardingData((prev) => ({
                      ...prev,
                      type: e.target.value,
                    }))
                  }
                >
                  <option value="">Select Type</option>
                  <option value="voluntary_resignation">
                    Voluntary Resignation
                  </option>
                  <option value="involuntary_termination">
                    Involuntary Termination
                  </option>
                  <option value="retirement">Retirement</option>
                  <option value="contract_end">Contract End</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Reason
                </label>
                <textarea
                  required
                  className="w-full rounded-lg border border-gray-200 bg-gradient-to-r from-white to-yellow-50 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
                  value={offboardingData.reason}
                  onChange={(e) =>
                    setOffboardingData((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Target Exit Date
                </label>
                <input
                  type="date"
                  required
                  className="w-full rounded-lg border border-gray-200 bg-gradient-to-r from-white to-yellow-50 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
                  value={offboardingData.targetExitDate}
                  onChange={(e) =>
                    setOffboardingData((prev) => ({
                      ...prev,
                      targetExitDate: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowOffboardingModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400 transition"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg shadow-lg hover:from-orange-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400 transition disabled:opacity-50 flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
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
                      Initiating...
                    </>
                  ) : (
                    "Initiate Offboarding"
                  )}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      <Dialog
        open={showOffboardingConfirm}
        onClose={() => setShowOffboardingConfirm(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full rounded-xl bg-white p-6 shadow-xl">
            <Dialog.Title className="text-xl font-semibold text-gray-900 mb-4">
              Confirm Offboarding
            </Dialog.Title>
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to initiate the offboarding process for{" "}
                <span className="font-semibold">
                  {employeeToOffboard?.firstName} {employeeToOffboard?.lastName}
                </span>
                ?
              </p>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      This will start the offboarding workflow. The employee
                      will be moved to the offboarding process, and you'll need
                      to complete all required tasks before finalizing their
                      departure.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowOffboardingConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmOffboarding}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Proceed with Offboarding
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </motion.div>
  );
}
