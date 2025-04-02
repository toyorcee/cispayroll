"use client";

import { useState } from "react";
import { FaPlus, FaEdit, FaTrash, FaHistory } from "react-icons/fa";

interface Allowance {
  _id: string;
  employeeName: string;
  employeeId: string;
  type: string;
  value: number;
  calculationMethod: "percentage" | "fixed";
  frequency: string;
  isActive: boolean;
  lastModified?: Date;
  effectiveDate: Date;
  expiryDate?: Date;
  description?: string;
  taxable: boolean;
}

// Constants from the model
const AllowanceType = {
  FIXED: "fixed",
  PERCENTAGE: "percentage",
  PERFORMANCE_BASED: "performance_based",
};

const CalculationMethod = {
  FIXED: "fixed",
  PERCENTAGE: "percentage",
};

const PayrollFrequency = {
  WEEKLY: "weekly",
  BIWEEKLY: "biweekly",
  MONTHLY: "monthly",
  QUARTERLY: "quarterly",
  ANNUAL: "annual",
};

const AllowanceStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

export default function AllowanceManagement() {
  const [allowances] = useState<Allowance[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAllowance, setEditingAllowance] = useState<
    Allowance | undefined
  >(undefined);
  const [view, setView] = useState<"list" | "analytics">("list");
  const [formData, setFormData] = useState({
    employeeName: "",
    employeeId: "",
    type: AllowanceType.FIXED,
    value: 0,
    calculationMethod: CalculationMethod.FIXED,
    frequency: PayrollFrequency.MONTHLY,
    description: "",
    taxable: true,
    status: AllowanceStatus.PENDING,
    isActive: true,
    effectiveDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
    scope: "department",
    priority: 1,
  });

  // Placeholder functions for future implementation
  const handleToggleStatus = async (id: string) => {
    console.log("Toggle status for:", id);
  };

  const handleDelete = async (id: string) => {
    console.log("Delete allowance:", id);
  };

  const handleEdit = (allowance: Allowance) => {
    setEditingAllowance(allowance);
    setShowAddForm(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    setShowAddForm(false);
    setFormData({
      employeeName: "",
      employeeId: "",
      type: AllowanceType.FIXED,
      value: 0,
      calculationMethod: CalculationMethod.FIXED,
      frequency: PayrollFrequency.MONTHLY,
      description: "",
      taxable: true,
      status: AllowanceStatus.PENDING,
      isActive: true,
      effectiveDate: new Date().toISOString().split("T")[0],
      expiryDate: "",
      scope: "department",
      priority: 1,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Section with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">
            Total Allowances
          </h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">
            Active Allowances
          </h3>
          <p className="mt-2 text-3xl font-semibold text-green-600">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">
            Departments Using
          </h3>
          <p className="mt-2 text-3xl font-semibold text-blue-600">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Monthly Impact</h3>
          <p className="mt-2 text-3xl font-semibold text-purple-600">₦0</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <button
              onClick={() => setView("list")}
              className={`px-4 py-2 rounded-md ${
                view === "list"
                  ? "bg-green-50 text-green-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setView("analytics")}
              className={`px-4 py-2 rounded-md ${
                view === "analytics"
                  ? "bg-green-50 text-green-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Analytics
            </button>
          </div>
          <button
            onClick={() => {
              setEditingAllowance(undefined);
              setShowAddForm(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent 
                     rounded-md shadow-sm text-sm font-medium text-white 
                     bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 
                     focus:ring-offset-2 focus:ring-green-500"
          >
            <FaPlus className="mr-2 -ml-1 h-4 w-4" />
            Create Allowance
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Calculation Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Departments
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
                {allowances.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center">
                      <div className="text-gray-500 text-sm">
                        No allowances found. Click "Create Allowance" to add
                        one.
                      </div>
                    </td>
                  </tr>
                ) : (
                  allowances.map((allowance) => (
                    <tr key={allowance._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {allowance.employeeName}
                        </div>
                        <div className="text-xs text-gray-500">
                          Last modified:{" "}
                          {new Date(
                            allowance.lastModified || Date.now()
                          ).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {allowance.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {allowance.calculationMethod === "percentage"
                            ? `${allowance.value}%`
                            : `₦${allowance.value.toLocaleString()}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {allowance.calculationMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {allowance.employeeId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(allowance._id)}
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${
                            allowance.isActive
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                        >
                          {allowance.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(allowance)}
                          className="text-green-600 hover:text-green-900 mr-4"
                          title="Edit Allowance"
                        >
                          <FaEdit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(allowance._id)}
                          className="text-red-600 hover:text-red-900 mr-4"
                          title="Delete Allowance"
                        >
                          <FaTrash className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            /* View history */
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View History"
                        >
                          <FaHistory className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-lg bg-white lg:ml-[25%] md:ml-[20%] sm:ml-[10%]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingAllowance
                  ? "Edit Employee Allowance"
                  : "Create New Employee Allowance"}
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingAllowance(undefined);
                }}
                className="text-gray-400 hover:text-gray-500 focus:outline-none p-2 hover:bg-gray-100 rounded-full"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Employee Name
                  </label>
                  <input
                    type="text"
                    name="employeeName"
                    value={formData.employeeName || ""}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    placeholder="Enter employee name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    name="employeeId"
                    value={formData.employeeId || ""}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    placeholder="Enter employee ID"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Allowance Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  >
                    {Object.entries(AllowanceType).map(([key, value]) => (
                      <option key={key} value={value}>
                        {key.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Value
                  </label>
                  <input
                    type="number"
                    name="value"
                    value={formData.value}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    placeholder="Enter allowance value"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Calculation Method
                  </label>
                  <select
                    name="calculationMethod"
                    value={formData.calculationMethod}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  >
                    {Object.entries(CalculationMethod).map(([key, value]) => (
                      <option key={key} value={value}>
                        {key.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Frequency
                  </label>
                  <select
                    name="frequency"
                    value={formData.frequency}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  >
                    {Object.entries(PayrollFrequency).map(([key, value]) => (
                      <option key={key} value={value}>
                        {key.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Effective Date
                  </label>
                  <input
                    type="date"
                    name="effectiveDate"
                    value={formData.effectiveDate}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  placeholder="Enter reason for this allowance"
                />
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="taxable"
                    checked={formData.taxable}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Taxable</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingAllowance(undefined);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  {editingAllowance ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
