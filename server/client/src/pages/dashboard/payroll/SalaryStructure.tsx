import { useState } from "react";
import { Link } from "react-router-dom";
import { FaPlus, FaFilter, FaBuilding, FaChartBar } from "react-icons/fa";
import {
  salaryStructures,
  departments,
  calculateSalarySummary,
  formatCurrency,
} from "../../../data/salary";
import type { Department, SalaryStructureSummary } from "../../../types/salary";

export default function SalaryStructure() {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const summary: SalaryStructureSummary = calculateSalarySummary();

  const filteredStructures =
    selectedDepartment === "all"
      ? salaryStructures
      : salaryStructures.filter(
          (s) => s.department.toLowerCase() === selectedDepartment
        );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link
          to="/dashboard/payroll/grade/new"
          className="inline-flex items-center px-4 py-2 !bg-green-600 !text-white rounded-lg hover:bg-green-700 
                   transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg
                   animate-bounce-slow cursor-pointer focus:outline-none focus:ring-0"
        >
          <FaPlus className="h-5 w-5 mr-2" />
          Add Grade Level
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div
          className="bg-white overflow-hidden shadow rounded-lg cursor-pointer
                    transform transition-all duration-300 hover:scale-105 hover:shadow-xl
                    hover:-translate-y-1"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaChartBar className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs md:text-sm font-medium text-gray-500 truncate">
                    Total Grade Levels
                  </dt>
                  <dd className="text-base md:text-lg font-medium text-gray-900">
                    {summary.totalGradeLevels}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div
          className="bg-white overflow-hidden shadow rounded-lg cursor-pointer
                    transform transition-all duration-300 hover:scale-105 hover:shadow-xl
                    hover:-translate-y-1"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaBuilding className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs md:text-sm font-medium text-gray-500 truncate">
                    Departments Covered
                  </dt>
                  <dd className="text-base md:text-lg font-medium text-gray-900">
                    {summary.departmentsCovered}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div
          className="bg-white overflow-hidden shadow rounded-lg cursor-pointer
                    transform transition-all duration-300 hover:scale-105 hover:shadow-xl
                    hover:-translate-y-1"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaChartBar className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs md:text-sm font-medium text-gray-500 truncate">
                    Average Package
                  </dt>
                  <dd className="text-base md:text-lg font-medium text-gray-900">
                    {formatCurrency(summary.averagePackage)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4 items-center">
        <div className="flex items-center">
          <FaFilter className="h-4 w-4 text-green-600 mr-2" />
          <select
            className="text-sm md:text-base border-gray-300 rounded-lg shadow-sm 
                     !bg-green-600 !text-white px-3 py-1.5 
                     hover:!bg-green-700 transition-all duration-200
                     transform hover:-translate-y-0.5 hover:shadow-md
                     focus:outline-none focus:ring-0 cursor-pointer"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            {departments.map((dept: Department) => (
              <option key={dept.id} value={dept.code}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Salary Structure Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Grade Level
                </th>
                <th className="px-6 py-3 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Basic Salary
                </th>
                <th className="px-6 py-3 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Allowances
                </th>
                <th className="px-6 py-3 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Total Package
                </th>
                <th className="px-6 py-3 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Employees
                </th>
                <th className="px-6 py-3 text-right text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStructures.map((structure) => (
                <tr
                  key={structure.id}
                  className="hover:bg-gray-50 transition-all duration-200 
                           transform hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm md:text-base font-medium text-gray-900">
                      {structure.grade}
                    </div>
                    <div className="text-xs md:text-sm text-gray-500">
                      {structure.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm md:text-base font-medium text-gray-900">
                    {formatCurrency(structure.basicSalary)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm md:text-base text-gray-900">
                      Housing: {formatCurrency(structure.housingAllowance)}
                    </div>
                    <div className="text-xs md:text-sm text-gray-500">
                      Transport: {formatCurrency(structure.transportAllowance)}
                    </div>
                    <div className="text-xs md:text-sm text-gray-500">
                      Medical: {formatCurrency(structure.medicalAllowance)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm md:text-base font-medium text-gray-900">
                    {formatCurrency(structure.totalPackage)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm md:text-base text-gray-500">
                    {structure.employees}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm md:text-base font-medium">
                    <button
                      className="text-green-600 hover:text-green-700 mr-4
                               transition-all duration-200 
                               transform hover:-translate-y-0.5 hover:shadow-sm cursor-pointer
                               focus:outline-none focus:ring-0"
                    >
                      Edit
                    </button>
                    <button
                      className="text-green-600 hover:text-green-700
                               transition-all duration-200 
                               transform hover:-translate-y-0.5 hover:shadow-sm cursor-pointer
                               focus:outline-none focus:ring-0"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
