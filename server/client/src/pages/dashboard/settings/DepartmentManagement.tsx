import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Permission } from "../../../types/auth";
import { Department } from "../../../types/department";
import { departments as testData } from "../../../data/departments";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaUserCog,
  FaSpinner,
  FaExclamationTriangle,
} from "react-icons/fa";

export default function DepartmentManagement() {
  const { user, hasPermission } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      // For now, use test data
      setDepartments(testData);
      setError(null);
    } catch (error) {
      setError("Failed to fetch departments");
      console.error("Error fetching departments:", error);
    } finally {
      setLoading(false);
    }
  };

  const canManageDepartments =
    hasPermission(Permission.CREATE_DEPARTMENT) &&
    hasPermission(Permission.EDIT_DEPARTMENT) &&
    hasPermission(Permission.DELETE_DEPARTMENT);

  const canViewDepartments = hasPermission(Permission.VIEW_ALL_DEPARTMENTS);
  const canAssignAdmin = hasPermission(Permission.ASSIGN_DEPARTMENT_ADMIN);

  if (!canViewDepartments) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <FaExclamationTriangle className="mx-auto h-12 w-12 text-yellow-400" />
          <h3 className="mt-2 text-lg font-medium">Access Denied</h3>
          <p className="mt-1">You don't have permission to view departments.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <FaSpinner className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Department Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage company departments and their administrators
          </p>
        </div>
        {canManageDepartments && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg 
                     hover:bg-green-700 transition-colors duration-200"
          >
            <FaPlus className="mr-2" />
            Add Department
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <FaExclamationTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Admin
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employees
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {departments.map((department) => (
              <tr key={department.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {department.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {department.description}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {department.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {department.adminName}
                  </div>
                  {canAssignAdmin && !department.adminId && (
                    <button className="text-xs text-green-600 hover:text-green-900">
                      Assign Admin
                    </button>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${
                      department.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {department.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {department.employeeCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {canManageDepartments && (
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setSelectedDepartment(department)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <FaEdit className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <FaTrash className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal would go here */}
    </div>
  );
}
