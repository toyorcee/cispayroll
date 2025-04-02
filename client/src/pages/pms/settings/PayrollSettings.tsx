"use client";

import { useState } from "react";
import {
  FaMoneyBillWave,
  FaPlus,
  FaPencilAlt,
  FaTrash,
  FaTimes,
} from "react-icons/fa";

interface PayrollComponent {
  _id: string;
  name: string;
  type: "allowance" | "deduction" | "bonus";
  amount: number;
  isPercentage: boolean;
  description: string;
  status: "active" | "inactive";
}

// Demo data
const payrollComponents: PayrollComponent[] = [
  {
    _id: "1",
    name: "Basic Salary",
    type: "allowance",
    amount: 50000,
    isPercentage: false,
    description: "Base salary for all employees",
    status: "active",
  },
  {
    _id: "2",
    name: "Housing Allowance",
    type: "allowance",
    amount: 15,
    isPercentage: true,
    description: "Housing allowance based on basic salary",
    status: "active",
  },
  {
    _id: "3",
    name: "Transport Allowance",
    type: "allowance",
    amount: 5000,
    isPercentage: false,
    description: "Fixed transport allowance",
    status: "active",
  },
  {
    _id: "4",
    name: "Tax Deduction",
    type: "deduction",
    amount: 10,
    isPercentage: true,
    description: "Income tax deduction",
    status: "active",
  },
  {
    _id: "5",
    name: "Annual Bonus",
    type: "bonus",
    amount: 20,
    isPercentage: true,
    description: "Annual performance bonus",
    status: "active",
  },
];

export default function PayrollSettings() {
  const [components, setComponents] =
    useState<PayrollComponent[]>(payrollComponents);
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [newComponent, setNewComponent] = useState<
    Omit<PayrollComponent, "_id">
  >({
    name: "",
    type: "allowance",
    amount: 0,
    isPercentage: false,
    description: "",
    status: "active",
  });

  const handleAddComponent = (e: React.FormEvent) => {
    e.preventDefault();
    const newComponentWithId: PayrollComponent = {
      ...newComponent,
      _id: (components.length + 1).toString(),
    };
    setComponents([...components, newComponentWithId]);
    setShowAddComponent(false);
    setNewComponent({
      name: "",
      type: "allowance",
      amount: 0,
      isPercentage: false,
      description: "",
      status: "active",
    });
  };

  const handleDeleteComponent = (id: string) => {
    if (window.confirm("Are you sure you want to delete this component?")) {
      setComponents(components.filter((component) => component._id !== id));
    }
  };

  const handleEditComponent = (id: string) => {
    // Implement edit functionality
    console.log("Edit component:", id);
  };

  const AddComponentForm = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 w-full max-w-2xl">
        <div className="bg-white rounded-lg shadow-xl">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-xl font-medium">Add New Payroll Component</h3>
            <button
              onClick={() => setShowAddComponent(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleAddComponent} className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Component Name
                </label>
                <input
                  type="text"
                  value={newComponent.name}
                  onChange={(e) =>
                    setNewComponent({ ...newComponent, name: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Type
                </label>
                <select
                  value={newComponent.type}
                  onChange={(e) =>
                    setNewComponent({
                      ...newComponent,
                      type: e.target.value as
                        | "allowance"
                        | "deduction"
                        | "bonus",
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  required
                >
                  <option value="allowance">Allowance</option>
                  <option value="deduction">Deduction</option>
                  <option value="bonus">Bonus</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Amount
                </label>
                <input
                  type="number"
                  value={newComponent.amount}
                  onChange={(e) =>
                    setNewComponent({
                      ...newComponent,
                      amount: parseFloat(e.target.value),
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newComponent.isPercentage}
                  onChange={(e) =>
                    setNewComponent({
                      ...newComponent,
                      isPercentage: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Amount is percentage
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={newComponent.description}
                  onChange={(e) =>
                    setNewComponent({
                      ...newComponent,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={newComponent.status}
                  onChange={(e) =>
                    setNewComponent({
                      ...newComponent,
                      status: e.target.value as "active" | "inactive",
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddComponent(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Add Component
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Add Component Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowAddComponent(true)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <FaPlus className="mr-2" />
          Add New Component
        </button>
      </div>

      {/* Payroll Components Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Component
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
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
            {components.map((component) => (
              <tr key={component._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <FaMoneyBillWave className="h-10 w-10 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {component.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {component.description}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {component.type.charAt(0).toUpperCase() +
                    component.type.slice(1)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {component.isPercentage
                    ? `${component.amount}%`
                    : `$${component.amount.toLocaleString()}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      component.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {component.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleEditComponent(component._id)}
                      className="text-green-600 hover:text-green-900"
                    >
                      <FaPencilAlt />
                    </button>
                    <button
                      onClick={() => handleDeleteComponent(component._id)}
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

      {showAddComponent && <AddComponentForm />}
    </div>
  );
}
