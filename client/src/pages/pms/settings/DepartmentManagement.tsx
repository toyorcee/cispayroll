"use client";

import { useState } from "react";
import {
  FaBuilding,
  FaUsers,
  FaUserTie,
  FaPlus,
  FaPencilAlt,
  FaTrash,
  FaChartLine,
  FaTimes,
} from "react-icons/fa";

type DepartmentStatus = "Active" | "Inactive" | "Pending";

interface Department {
  id: number;
  name: string;
  code: string;
  head: string;
  employees: number;
  status: DepartmentStatus;
  budget: string;
  description: string;
  location: string;
  createdAt: string;
}

// Demo data
const departments: Department[] = [
  {
    id: 1,
    name: "Engineering",
    code: "ENG",
    head: "John Doe",
    employees: 25,
    status: "Active",
    budget: "₦15,000,000",
    description: "Software and Hardware Engineering Department",
    location: "Lagos HQ",
    createdAt: "2023-01-15",
  },
  {
    id: 2,
    name: "Human Resources",
    code: "HR",
    head: "Jane Smith",
    employees: 12,
    status: "Active",
    budget: "₦8,000,000",
    description: "Human Resources and Talent Management",
    location: "Lagos HQ",
    createdAt: "2023-02-01",
  },
  {
    id: 3,
    name: "Finance",
    code: "FIN",
    head: "Mike Johnson",
    employees: 18,
    status: "Active",
    budget: "₦12,000,000",
    description: "Financial Management and Accounting",
    location: "Lagos HQ",
    createdAt: "2023-02-15",
  },
  {
    id: 4,
    name: "Marketing",
    code: "MKT",
    head: "Sarah Williams",
    employees: 15,
    status: "Pending",
    budget: "₦10,000,000",
    description: "Marketing and Communications",
    location: "Abuja Branch",
    createdAt: "2023-03-01",
  },
  {
    id: 5,
    name: "Operations",
    code: "OPS",
    head: "David Brown",
    employees: 20,
    status: "Inactive",
    budget: "₦9,000,000",
    description: "Operations and Logistics",
    location: "Port Harcourt Branch",
    createdAt: "2023-03-15",
  },
];

const statusColors: Record<DepartmentStatus, string> = {
  Active: "bg-green-100 text-green-800",
  Inactive: "bg-red-100 text-red-800",
  Pending: "bg-yellow-100 text-yellow-800",
};

export default function DepartmentManagement() {
  const [isAdding, setIsAdding] = useState(false);
  const [departmentsList, setDepartmentsList] =
    useState<Department[]>(departments);
  const [newDepartment, setNewDepartment] = useState<Partial<Department>>({
    name: "",
    code: "",
    head: "",
    employees: 0,
    status: "Active",
    budget: "",
    description: "",
    location: "",
  });

  const inputClasses =
    "mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 text-sm md:text-base " +
    "focus:outline-none focus:ring-green-500 focus:border-green-500 " +
    "transition-all duration-200 hover:border-green-400 " +
    "disabled:bg-gray-50 disabled:cursor-not-allowed";

  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    const newDept: Department = {
      ...newDepartment,
      id: departmentsList.length + 1,
      createdAt: new Date().toISOString().split("T")[0],
    } as Department;

    setDepartmentsList([...departmentsList, newDept]);
    setIsAdding(false);
    setNewDepartment({
      name: "",
      code: "",
      head: "",
      employees: 0,
      status: "Active",
      budget: "",
      description: "",
      location: "",
    });
  };

  const handleDeleteDepartment = (id: number) => {
    if (window.confirm("Are you sure you want to delete this department?")) {
      setDepartmentsList(departmentsList.filter((dept) => dept.id !== id));
    }
  };

  const handleEditDepartment = (id: number) => {
    // Implement edit functionality
    console.log("Edit department:", id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center px-4 py-2 !bg-green-600 !text-white rounded-lg hover:bg-green-700 
                   transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg
                   animate-bounce-slow cursor-pointer focus:outline-none focus:ring-0"
        >
          <FaPlus className="h-5 w-5 mr-2" />
          Add Department
        </button>
      </div>

      {/* Department Overview */}
      <div className="bg-white shadow rounded-lg transition-all duration-200 hover:shadow-md">
        <div className="p-4 md:p-6">
          <div className="flex items-center mb-4">
            <FaChartLine className="h-5 w-5 text-green-600 mr-2" />
            <h2 className="text-base md:text-lg font-medium text-gray-900">
              Department Overview
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-3">
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-200">
              <FaBuilding className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">
                  Total Departments
                </p>
                <p className="text-sm md:text-base text-gray-900">
                  {departmentsList.length}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-200">
              <FaUsers className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">
                  Total Employees
                </p>
                <p className="text-sm md:text-base text-gray-900">
                  {departmentsList.reduce(
                    (acc, dept) => acc + dept.employees,
                    0
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-200">
              <FaUserTie className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">
                  Department Heads
                </p>
                <p className="text-sm md:text-base text-gray-900">
                  {departmentsList.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Department List */}
      <div className="bg-white shadow rounded-lg transition-all duration-200 hover:shadow-md">
        <div className="p-4 md:p-6">
          <div className="flex items-center mb-4">
            <FaBuilding className="h-5 w-5 text-green-600 mr-2" />
            <h2 className="text-base md:text-lg font-medium text-gray-900">
              Department List
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Head
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employees
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget
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
                {departmentsList.map((dept) => (
                  <tr
                    key={dept.id}
                    className="hover:bg-gray-50 transition-all duration-200 hover:shadow-sm"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {dept.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {dept.code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{dept.head}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {dept.employees}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{dept.budget}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                 ${statusColors[dept.status]}`}
                      >
                        {dept.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditDepartment(dept.id)}
                        className="text-green-600 hover:text-green-700 mr-4 transition-all duration-200 
                                 cursor-pointer hover:scale-110"
                      >
                        <FaPencilAlt className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDepartment(dept.id)}
                        className="text-red-600 hover:text-red-700 transition-all duration-200 
                                 cursor-pointer hover:scale-110"
                      >
                        <FaTrash className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Department Form */}
      {isAdding && (
        <div className="bg-white shadow rounded-lg transition-all duration-200 hover:shadow-md">
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FaPlus className="h-5 w-5 text-green-600 mr-2" />
                <h2 className="text-base md:text-lg font-medium text-gray-900">
                  Add New Department
                </h2>
              </div>
              <button
                onClick={() => setIsAdding(false)}
                className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddDepartment}>
              <div className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700">
                    Department Name
                  </label>
                  <input
                    type="text"
                    value={newDepartment.name}
                    onChange={(e) =>
                      setNewDepartment({
                        ...newDepartment,
                        name: e.target.value,
                      })
                    }
                    className={inputClasses}
                    placeholder="Enter department name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700">
                    Department Code
                  </label>
                  <input
                    type="text"
                    value={newDepartment.code}
                    onChange={(e) =>
                      setNewDepartment({
                        ...newDepartment,
                        code: e.target.value,
                      })
                    }
                    className={inputClasses}
                    placeholder="Enter department code"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700">
                    Department Head
                  </label>
                  <input
                    type="text"
                    value={newDepartment.head}
                    onChange={(e) =>
                      setNewDepartment({
                        ...newDepartment,
                        head: e.target.value,
                      })
                    }
                    className={inputClasses}
                    placeholder="Enter department head name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700">
                    Budget
                  </label>
                  <input
                    type="text"
                    value={newDepartment.budget}
                    onChange={(e) =>
                      setNewDepartment({
                        ...newDepartment,
                        budget: e.target.value,
                      })
                    }
                    className={inputClasses}
                    placeholder="Enter department budget"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <input
                    type="text"
                    value={newDepartment.location}
                    onChange={(e) =>
                      setNewDepartment({
                        ...newDepartment,
                        location: e.target.value,
                      })
                    }
                    className={inputClasses}
                    placeholder="Enter department location"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={newDepartment.status}
                    onChange={(e) =>
                      setNewDepartment({
                        ...newDepartment,
                        status: e.target.value as DepartmentStatus,
                      })
                    }
                    className={inputClasses}
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 !bg-green-600 !text-white rounded-lg hover:bg-green-700 
                           transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg
                           cursor-pointer focus:outline-none focus:ring-0"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
