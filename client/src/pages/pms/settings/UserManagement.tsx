"use client";

import { useState } from "react";
import { FaUser, FaPlus, FaPencilAlt, FaTrash, FaTimes } from "react-icons/fa";
import { UserRole, Permission } from "../../../types/auth";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  department: string;
  status: "active" | "inactive" | "suspended";
  position: string;
  employeeId: string;
  permissions: Permission[];
}

// Demo data
const users: User[] = [
  {
    _id: "1",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    role: UserRole.ADMIN,
    department: "Engineering",
    status: "active",
    position: "Senior Engineer",
    employeeId: "EMP001",
    permissions: [],
  },
  {
    _id: "2",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@example.com",
    role: UserRole.USER,
    department: "Human Resources",
    status: "active",
    position: "HR Manager",
    employeeId: "EMP002",
    permissions: [],
  },
  {
    _id: "3",
    firstName: "Mike",
    lastName: "Johnson",
    email: "mike.j@example.com",
    role: UserRole.USER,
    department: "Finance",
    status: "inactive",
    position: "Accountant",
    employeeId: "EMP003",
    permissions: [],
  },
  {
    _id: "4",
    firstName: "Sarah",
    lastName: "Williams",
    email: "sarah.w@example.com",
    role: UserRole.USER,
    department: "Marketing",
    status: "suspended",
    position: "Marketing Manager",
    employeeId: "EMP004",
    permissions: [],
  },
];

export default function UserManagement() {
  const [usersList, setUsersList] = useState<User[]>(users);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    employeeId: "",
    role: UserRole.USER,
    department: "",
    position: "",
    status: "active" as "active" | "inactive" | "suspended",
  });

  // Function to get default permissions based on role
  const getDefaultPermissions = (role: UserRole): Permission[] => {
    switch (role) {
      case UserRole.ADMIN:
        return [
          Permission.VIEW_DASHBOARD,
          Permission.VIEW_ALL_USERS,
          Permission.MANAGE_DEPARTMENT_USERS,
          Permission.MANAGE_ONBOARDING,
          Permission.MANAGE_OFFBOARDING,
          Permission.APPROVE_LEAVE,
          Permission.VIEW_PERSONAL_INFO,
          Permission.MANAGE_DEPARTMENT_SETTINGS,
          Permission.MANAGE_USER_SETTINGS,
          Permission.MANAGE_LEAVE_SETTINGS,
          Permission.MANAGE_NOTIFICATION_SETTINGS,
          Permission.VIEW_REPORTS,
          Permission.VIEW_PAYROLL_REPORTS,
          Permission.VIEW_EMPLOYEE_REPORTS,
          Permission.VIEW_TAX_REPORTS,
          Permission.VIEW_ALL_PAYROLL,
          Permission.VIEW_DEPARTMENT_PAYROLL,
          Permission.VIEW_SALARY_STRUCTURE,
          Permission.VIEW_ALLOWANCES,
          Permission.VIEW_DEDUCTIONS,
          Permission.VIEW_BONUSES,
          Permission.VIEW_OWN_PAYSLIP,
          Permission.VIEW_OWN_ALLOWANCES,
          Permission.VIEW_OWN_DEDUCTIONS,
          Permission.REQUEST_ALLOWANCES,
          Permission.REQUEST_LEAVE,
          Permission.VIEW_OWN_LEAVE,
          Permission.CANCEL_OWN_LEAVE,
          Permission.VIEW_TEAM_LEAVE,
          Permission.MANAGE_FEEDBACK,
        ];
      case UserRole.USER:
        return [
          Permission.VIEW_DASHBOARD,
          Permission.VIEW_PERSONAL_INFO,
          Permission.REQUEST_LEAVE,
          Permission.VIEW_OWN_LEAVE,
          Permission.CANCEL_OWN_LEAVE,
          Permission.VIEW_OWN_PAYSLIP,
          Permission.VIEW_OWN_ALLOWANCES,
          Permission.VIEW_OWN_DEDUCTIONS,
          Permission.REQUEST_ALLOWANCES,
          Permission.MANAGE_FEEDBACK,
        ];
      default:
        return [];
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const newUserWithId: User = {
      ...newUser,
      _id: (usersList.length + 1).toString(),
      permissions: getDefaultPermissions(newUser.role)
    };
    setUsersList([...usersList, newUserWithId]);
    setShowAddUser(false);
    setNewUser({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      employeeId: "",
      role: UserRole.USER,
      department: "",
      position: "",
      status: "active",
    });
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setUsersList(usersList.filter((user) => user._id !== userId));
    }
  };

  const handleEditUser = (userId: string) => {
    // Implement edit functionality
    console.log("Edit user:", userId);
  };

  // Add departments array
  const departments = [
    "Human Resources",
    "Finance",
    "Information Technology",
    "Operations",
    "Marketing",
    "Sales",
    "Research & Development",
  ];

  const AddUserForm = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 w-full max-w-2xl">
        <div className="bg-white rounded-lg shadow-xl">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-xl font-medium">Add New User</h3>
            <button
              onClick={() => setShowAddUser(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleAddUser} className="p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Basic Information</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={newUser.firstName}
                    onChange={(e) =>
                      setNewUser({ ...newUser, firstName: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={newUser.lastName}
                    onChange={(e) =>
                      setNewUser({ ...newUser, lastName: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              {/* Employment Details */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">
                  Employment Details
                </h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={newUser.employeeId}
                    onChange={(e) =>
                      setNewUser({ ...newUser, employeeId: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Department
                  </label>
                  <select
                    value={newUser.department}
                    onChange={(e) =>
                      setNewUser({ ...newUser, department: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        role: e.target.value as UserRole,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  >
                    <option value={UserRole.ADMIN}>Department Admin</option>
                    <option value={UserRole.USER}>Regular User</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Position
                  </label>
                  <input
                    type="text"
                    value={newUser.position}
                    onChange={(e) =>
                      setNewUser({ ...newUser, position: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddUser(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Create User
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Add User Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowAddUser(true)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <FaPlus className="mr-2" />
          Add New User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {usersList.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <FaUser className="h-10 w-10 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {`${user.firstName} ${user.lastName}`}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.role}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.department}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.status === "active"
                        ? "bg-green-100 text-green-800"
                        : user.status === "inactive"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleEditUser(user._id)}
                      className="text-green-600 hover:text-green-900"
                    >
                      <FaPencilAlt />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddUser && <AddUserForm />}
    </div>
  );
}
