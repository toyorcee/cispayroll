"use client";

import { useState } from "react";
import { FaUser, FaPlus, FaPencilAlt, FaTrash, FaTimes } from "react-icons/fa";
import { users, roles, userStats } from "../../../data/settings";
import { Link } from "react-router-dom";

export default function UserManagement() {
  const [showAddUser, setShowAddUser] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link
          to="/dashboard/settings/user-management/edit"
          className="inline-flex items-center px-4 py-2 !bg-green-600 !text-white rounded-lg hover:bg-green-700 
                   transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg
                   animate-bounce-slow cursor-pointer focus:outline-none focus:ring-0"
          onClick={() => setShowAddUser(true)}
        >
          <FaPlus className="h-5 w-5 mr-2" />
          Add User
        </Link>
      </div>

      {showAddUser && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50
                    transition-all duration-300 animate-fade-in"
        >
          <div
            className="relative top-20 mx-auto p-5 w-full max-w-md transform transition-all duration-300
                      animate-slide-up"
          >
            <div
              className="bg-white rounded-lg shadow-xl overflow-hidden transform transition-all duration-300
                        hover:shadow-2xl hover:scale-[1.02]"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Add New User
                  </h2>
                  <button
                    onClick={() => setShowAddUser(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <FaTimes className="h-6 w-6" />
                  </button>
                </div>

                <form className="space-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      placeholder="John Doe"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                               focus:outline-none focus:ring-0 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      placeholder="john@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                               focus:outline-none focus:ring-0 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="role"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Role
                    </label>
                    <select
                      id="role"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                               !bg-green-600 text-white cursor-pointer
                               focus:outline-none focus:ring-0 focus:border-gray-300
                               hover:!bg-green-700 transition-all duration-200"
                    >
                      <option value="">Select a role</option>
                      {roles.map((role) => (
                        <option key={role.name} value={role.name}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="department"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Department
                    </label>
                    <input
                      type="text"
                      id="department"
                      placeholder="HR"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                               focus:outline-none focus:ring-0 focus:border-green-500"
                    />
                  </div>

                  <div className="flex items-center mt-6 space-x-3">
                    <button
                      type="submit"
                      className="flex-1 !bg-green-600 text-white px-4 py-2 rounded-lg cursor-pointer
                               transform transition-all duration-300
                               hover:!bg-green-700 hover:-translate-y-0.5 hover:shadow-lg
                               focus:outline-none focus:ring-0"
                    >
                      Add User
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddUser(false)}
                      className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg cursor-pointer
                               transform transition-all duration-300
                               hover:bg-gray-200 hover:-translate-y-0.5 hover:shadow-lg
                               focus:outline-none focus:ring-0"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-3">
        <div
          className="bg-white overflow-hidden shadow rounded-lg transform transition-all duration-300 
                      hover:scale-105 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
        >
          <div className="p-4 md:p-5">
            <div className="flex items-center">
              <FaUser className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
              <div className="ml-4 md:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs md:text-sm font-medium text-gray-500 truncate">
                    Total Users
                  </dt>
                  <dd className="text-base md:text-lg font-medium text-gray-900">
                    {userStats.total}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div
          className="bg-white overflow-hidden shadow rounded-lg transform transition-all duration-300 
                      hover:scale-105 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
        >
          <div className="p-4 md:p-5">
            <div className="flex items-center">
              <FaUser className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
              <div className="ml-4 md:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs md:text-sm font-medium text-gray-500 truncate">
                    Active Users
                  </dt>
                  <dd className="text-base md:text-lg font-medium text-gray-900">
                    {userStats.active}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div
          className="bg-white overflow-hidden shadow rounded-lg transform transition-all duration-300 
                      hover:scale-105 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
        >
          <div className="p-4 md:p-5">
            <div className="flex items-center">
              <FaUser className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
              <div className="ml-4 md:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs md:text-sm font-medium text-gray-500 truncate">
                    Pending Invites
                  </dt>
                  <dd className="text-base md:text-lg font-medium text-gray-900">
                    {userStats.pending}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg transition-all duration-200 hover:shadow-md">
        <div className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <h2 className="text-base md:text-lg font-medium text-gray-900">
              System Users
            </h2>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <input
                type="text"
                placeholder="Search users..."
                className="w-full sm:w-56 md:w-64 px-3 py-1.5 border border-gray-300 rounded-lg 
                         text-sm focus:outline-none focus:ring-0 focus:border-green-500"
              />
              <select
                className="w-full sm:w-40 md:w-44 px-3 py-1.5 rounded-lg border-gray-300 text-sm
                         !bg-green-600 text-white cursor-pointer focus:outline-none focus:ring-0
                         focus:border-gray-300 hover:!bg-green-700"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-all duration-200 
                             transform hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap group-hover:bg-gray-50 transition-all duration-200">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <FaUser className="h-10 w-10 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 group-hover:bg-gray-50">
                      {user.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 group-hover:bg-gray-50">
                      {user.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap group-hover:bg-gray-50">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 group-hover:bg-gray-50">
                      {user.lastActive}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium group-hover:bg-gray-50">
                      <button
                        className="!text-green-600 hover:!text-green-700 mr-4 transition-all duration-200 
                                 hover:scale-110 cursor-pointer"
                      >
                        <FaPencilAlt className="h-5 w-5" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-700 transition-all duration-200 
                                 hover:scale-110 cursor-pointer"
                      >
                        <FaTrash className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Role Management */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-4 md:p-6">
          <h2 className="text-base md:text-lg font-medium text-gray-900 mb-4">
            Role Management
          </h2>
          <div className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-3">
            {roles.map((role) => (
              <div
                key={role.name}
                className="bg-white overflow-hidden shadow rounded-lg transform transition-all duration-300 
                         hover:scale-105 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
              >
                <div className="p-4">
                  <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">
                    {role.name}
                  </h3>
                  <ul className="space-y-2">
                    {role.permissions.map((permission) => (
                      <li
                        key={permission}
                        className="text-xs md:text-sm text-gray-500 flex items-center"
                      >
                        <span className="h-1.5 w-1.5 bg-green-500 rounded-full mr-2" />
                        {permission}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
