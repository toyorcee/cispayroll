import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaUserPlus,
  FaFilter,
  FaUser,
  FaBuilding,
  FaMoneyBill,
  FaPencilAlt,
  FaEye,
  FaPlus,
  FaEdit,
  FaTrash,
  FaExchangeAlt,
  FaSearch,
  FaTimes,
  FaSpinner,
} from "react-icons/fa";
import { Employee, EmployeeFilters } from "../../../types/employee";
import { Status } from "../../../types/common";
import { useAuth } from "../../../context/AuthContext";
import { UserRole, Permission } from "../../../types/auth";
import { motion } from "framer-motion";
import { EmployeeSearch } from "../../../components/employees/EmployeeSearch";
import { EmployeeDetailsModal } from "../../../components/employees/EmployeeDetailsModal";
import { employeeService } from "../../../services/employeeService";
import { mapEmployeeToDetails } from "../../../utils/mappers";
import { DeleteEmployeeModal } from "../../../components/employees/DeleteEmployeeModal";
import { TransferEmployeeModal } from "../../../components/employees/TransferEmployeeModal";
import { toast } from "react-toastify";
import { StatusFilter } from "../../../components/employees/StatusFilter";
import { Pagination } from "../../../components/shared/Pagination";
import { EmployeeTableSkeleton } from "../../../components/employees/EmployeeTableSkeleton";
import { DepartmentModal } from "../../../components/departments/DepartmentModal";
import { Department, DepartmentFormData } from "../../../types/department";
import { Dialog } from "@headlessui/react";
import { departmentService } from "../../../services/departmentService";
import { User } from "../../../types/user";

export default function AllEmployees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EmployeeFilters>({
    page: 1,
    limit: 10,
  });
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
    gradeLevel: "",
    workLocation: "",
    dateJoined: new Date().toISOString().split("T")[0],
    department: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [admins, setAdmins] = useState<User[]>([]);

  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const isAdmin = user?.role === UserRole.ADMIN;

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await employeeService.getEmployees(filters);
        console.log("API Response:", response);

        // Set employees from response.data
        setEmployees(response.data);
        // Set total from response.pagination
        setTotalEmployees(response.pagination.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching employees:", err);
        setTotalEmployees(0);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [filters]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const departments = await departmentService.getAllDepartments();
        setDepartments(departments);
      } catch (error) {
        toast.error("Failed to fetch departments");
        setDepartments([]);
      }
    };

    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await employeeService.getEmployees({
          role: UserRole.ADMIN,
          status: "active",
          page: 1,
          limit: 100,
        });

        // Map Employee type to User type with proper type casting
        const adminUsers: User[] = response.data.map((emp: Employee) => ({
          _id: emp.id,
          id: emp.id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          email: emp.email,
          role: UserRole.ADMIN,
          department: emp.department,
          status: emp.status,
          permissions: emp.permissions,
        }));
        setAdmins(adminUsers);
      } catch (error) {
        console.error("Failed to fetch admins:", error);
        toast.error("Failed to fetch admin list");
      }
    };

    if (isSuperAdmin) {
      fetchAdmins();
    }
  }, [isSuperAdmin]);

  const getActionPermissions = () => {
    if (isSuperAdmin) {
      return {
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canTransfer: true,
      };
    }

    return {
      canCreate: user?.permissions?.includes(Permission.CREATE_USER),
      canEdit: user?.permissions?.includes(Permission.EDIT_USER),
      canDelete: user?.permissions?.includes(Permission.DELETE_USER),
      canTransfer: false, // Only super admin can transfer between departments
    };
  };

  const { canCreate, canEdit, canDelete, canTransfer } = getActionPermissions();

  const calculateTotalCompensation = (employee: Employee) => {
    const basic = employee.salary.basic;
    const allowances = employee.salary.allowances.reduce(
      (sum, a) => sum + a.amount,
      0
    );
    const deductions = employee.salary.deductions.reduce(
      (sum, d) => sum + d.amount,
      0
    );
    return basic + allowances - deductions;
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

  const handleSearch = (query: string) => {
    setFilters((prev) => ({ ...prev, search: query, page: 1 }));
  };

  const handleEmployeeClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowDetailsModal(true);
  };

  const handleEditClick = (e: React.MouseEvent, employee: Employee) => {
    e.stopPropagation();
    setSelectedEmployee(employee);
    setShowEditModal(true);
  };

  const handleDeleteClick = async (e: React.MouseEvent, employee: Employee) => {
    e.stopPropagation();
    setSelectedEmployee(employee);
    setShowDeleteModal(true);
  };

  const handleTransferClick = (e: React.MouseEvent, employee: Employee) => {
    e.stopPropagation();
    setSelectedEmployee(employee);
    setShowTransferModal(true);
  };

  const handleDelete = async () => {
    if (!selectedEmployee) return;
    try {
      await employeeService.deleteEmployee(selectedEmployee.id);
      setEmployees(employees.filter((e) => e.id !== selectedEmployee.id));
      await refreshDepartments();
      toast.success("Employee deleted successfully");
    } catch (error) {
      toast.error("Failed to delete employee");
    }
  };

  const handleTransfer = async (departmentId: string) => {
    if (!selectedEmployee) return;
    try {
      await employeeService.transferEmployee(selectedEmployee.id, departmentId);
      const response = await employeeService.getEmployees(filters);
      setEmployees(response.data);
      await refreshDepartments();
      toast.success("Employee transferred successfully");
    } catch (error) {
      toast.error("Failed to transfer employee");
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      // Ensure department is not undefined before making the API call
      if (!formData.department && isSuperAdmin) {
        toast.error("Please select a department");
        return;
      }

      const employeeData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        position: formData.position,
        gradeLevel: formData.gradeLevel,
        workLocation: formData.workLocation,
        dateJoined: new Date(formData.dateJoined),
        // Use non-null assertion since we've checked above
        department: isSuperAdmin ? formData.department : user?.department ?? "",
      };

      console.log("Sending employee data:", employeeData);

      const response = await employeeService.createEmployee(employeeData);
      console.log("Server response:", response);

      const employeesResponse = await employeeService.getEmployees(filters);
      setEmployees(employeesResponse.data);
      // Fix: Use total directly instead of pagination.total
      setTotalEmployees(employeesResponse.pagination.total);
      setShowCreateModal(false);

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        position: "",
        gradeLevel: "",
        workLocation: "",
        dateJoined: new Date().toISOString().split("T")[0],
        department: "",
      });

      await refreshDepartments();
      toast.success("Employee invitation sent successfully");
    } catch (error: any) {
      console.error("Error creating employee:", error);
      toast.error(error.response?.data?.message || "Failed to create employee");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateEmployee = async (data: Partial<Employee>) => {
    if (!selectedEmployee) return;
    try {
      await employeeService.updateEmployee(selectedEmployee.id, data);
      const response = await employeeService.getEmployees(filters);
      setEmployees(response.data);
      setShowEditModal(false);
      toast.success("Employee updated successfully");
    } catch (error) {
      toast.error("Failed to update employee");
      throw error;
    }
  };

  const handleDepartmentSave = async (formData: DepartmentFormData) => {
    try {
      if (formData.id) {
        await departmentService.updateDepartment(formData.id, formData);
        toast.success("Department updated successfully");
      } else {
        await departmentService.createDepartment(formData);
        toast.success("Department created successfully");
      }

      // Refresh departments list
      const departments = await departmentService.getAllDepartments();
      setDepartments(departments);
    } catch (error: any) {
      console.error("Failed to save department:", error);
      toast.error(error.response?.data?.message || "Failed to save department");
    }
  };

  const handleDepartmentDelete = async (id: string) => {
    try {
      await departmentService.deleteDepartment(id);
      toast.success("Department deleted successfully");

      // Refresh departments list
      const departments = await departmentService.getAllDepartments();
      setDepartments(departments);
    } catch (error: any) {
      console.error("Failed to delete department:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete department"
      );
    }
  };

  const handleStatusChange = (newStatus: Status | undefined) => {
    setFilters((prev) => ({
      ...prev,
      status: newStatus,
      page: 1,
    }));
  };

  const handleDepartmentChange = (departmentName: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      department: departmentName,
      page: 1, // Reset to first page when changing department
    }));
  };

  const renderActions = (employee: Employee) => (
    <div
      className="flex justify-end space-x-2"
      onClick={(e) => e.stopPropagation()}
    >
      {canEdit && (
        <button
          onClick={(e) => handleEditClick(e, employee)}
          className="text-blue-600 hover:text-blue-900 flex items-center"
        >
          <FaEdit className="w-4 h-4 mr-1" />
          Edit
        </button>
      )}
      {canDelete && (
        <button
          onClick={(e) => handleDeleteClick(e, employee)}
          className="text-red-600 hover:text-red-900 flex items-center"
        >
          <FaTrash className="w-4 h-4 mr-1" />
          Delete
        </button>
      )}
      {canTransfer && (
        <button
          onClick={(e) => handleTransferClick(e, employee)}
          className="text-green-600 hover:text-green-900 flex items-center"
        >
          <FaExchangeAlt className="w-4 h-4 mr-1" />
          Transfer
        </button>
      )}
    </div>
  );

  // Add this helper function to refresh departments
  const refreshDepartments = async () => {
    try {
      const departments = await departmentService.getAllDepartments();
      setDepartments(departments);
    } catch (error) {
      console.error("Failed to refresh departments:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-4"
    >
      {/* Move controls row to top and add margin-bottom */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        {/* Left side - Search */}
        <div className="flex-1 max-w-md">
          <EmployeeSearch onSearch={handleSearch} />
        </div>

        {/* Right side - Action Buttons */}
        <div className="flex items-center gap-2">
          {canCreate && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 !bg-green-600 !text-white rounded-lg hover:!bg-green-700 
                       transition-colors flex items-center space-x-2 whitespace-nowrap"
            >
              <FaPlus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          )}

          {isSuperAdmin && (
            <button
              onClick={() => setShowDepartmentModal(true)}
              className="px-4 py-2 !bg-blue-600 !text-white rounded-lg hover:!bg-blue-700 
                       transition-colors flex items-center space-x-2 whitespace-nowrap"
            >
              <FaBuilding className="w-4 h-4" />
              <span>Manage Departments</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters row - updated with better spacing and full width */}
      <div className="flex flex-wrap items-center gap-4 mb-6 w-full">
        {/* Status Filter - make it grow to fill available space */}
        <div className="flex-1 min-w-[200px]">
          <StatusFilter
            currentStatus={filters.status as Status | undefined}
            onStatusChange={handleStatusChange}
          />
        </div>

        {/* Department Filter - fixed width but with proper spacing */}
        {isSuperAdmin && (
          <div className="w-64">
            <select
              value={filters.department || ""}
              onChange={(e) =>
                handleDepartmentChange(e.target.value || undefined)
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Departments</option>
              <option value="No Department">No Department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.name}>
                  {dept.name} ({dept.employeeCounts.total})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Table with margin-top and no overflow */}
      <div className="bg-white rounded-lg shadow mt-6">
        {loading ? (
          <EmployeeTableSkeleton isSuperAdmin={isSuperAdmin} />
        ) : (
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                  Employee
                </th>
                {isSuperAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    Department
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((employee) => (
                <tr
                  key={employee.id}
                  onClick={() => handleEmployeeClick(employee)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-full">
                        <div className="text-sm font-medium text-gray-900 break-words">
                          {employee.firstName} {employee.lastName}
                        </div>
                        <div className="text-sm text-gray-500 break-words">
                          {employee.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  {isSuperAdmin && (
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 break-words">
                        {employee.department || "No Department"}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 break-words">
                      {employee.position}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium">
                      {(employee as any).role === "SUPER_ADMIN"
                        ? "Super Admin"
                        : (employee as any).role === "ADMIN"
                        ? "Admin"
                        : "Employee"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full
                        ${getStatusColor(employee.status)}`}
                    >
                      {employee.status.charAt(0).toUpperCase() +
                        employee.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {renderActions(employee)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add pagination */}
      {!loading && employees.length > 0 && (
        <div className="mt-6">
          <div className="flex flex-col items-center gap-2 text-sm text-gray-600 mb-4">
            <div>
              Showing{" "}
              <span className="font-semibold text-green-600">
                {(filters.page - 1) * filters.limit + 1}
              </span>{" "}
              -{" "}
              <span className="font-semibold text-green-600">
                {Math.min(filters.page * filters.limit, totalEmployees)}
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
                {filters.page}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-green-600">
                {Math.ceil(totalEmployees / filters.limit)}
              </span>
            </div>
          </div>
          <Pagination
            currentPage={filters.page}
            totalPages={Math.ceil(totalEmployees / filters.limit)}
            onPageChange={(page) => {
              setFilters((prev) => ({ ...prev, page }));
              window.scrollTo(0, 0);
            }}
          />
        </div>
      )}

      {/* Employee Details Modal */}
      <EmployeeDetailsModal
        employee={
          selectedEmployee ? mapEmployeeToDetails(selectedEmployee) : null
        }
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />

      {/* Add Delete Modal */}
      <DeleteEmployeeModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        employeeName={
          selectedEmployee
            ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}`
            : ""
        }
        onConfirm={handleDelete}
      />

      {/* Add Transfer Modal */}
      <TransferEmployeeModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        employee={
          selectedEmployee
            ? {
                id: selectedEmployee.id,
                name: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
                currentDepartment: selectedEmployee.department,
              }
            : {
                id: "",
                name: "",
                currentDepartment: "",
              }
        }
        departments={departments}
        onTransfer={handleTransfer}
      />

      {/* Create Employee Modal */}
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

                {isSuperAdmin && (
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
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
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

      <DepartmentModal
        isOpen={showDepartmentModal}
        onClose={() => setShowDepartmentModal(false)}
        onSave={handleDepartmentSave}
        onDelete={handleDepartmentDelete}
        departments={departments}
        admins={admins}
        isLoading={loading}
      />
    </motion.div>
  );
}
