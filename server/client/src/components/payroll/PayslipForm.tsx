import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Permission } from "../../types/auth";

interface PayslipFormData {
  employeeId: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: { type: string; amount: number }[];
  deductions: { type: string; amount: number }[];
}

const initialFormData: PayslipFormData = {
  employeeId: "",
  month: new Date().toLocaleString("default", { month: "long" }),
  year: new Date().getFullYear(),
  basicSalary: 0,
  allowances: [{ type: "", amount: 0 }],
  deductions: [{ type: "", amount: 0 }],
};

export default function PayslipForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: PayslipFormData) => void;
  onCancel: () => void;
}) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<PayslipFormData>(initialFormData);
  const [errors, setErrors] = useState<
    Partial<Record<keyof PayslipFormData, string>>
  >({});

  const canGeneratePayslip = user?.permissions?.includes(
    Permission.MANAGE_PAYROLL
  );

  const handleAddAllowance = () => {
    setFormData((prev) => ({
      ...prev,
      allowances: [...prev.allowances, { type: "", amount: 0 }],
    }));
  };

  const handleAddDeduction = () => {
    setFormData((prev) => ({
      ...prev,
      deductions: [...prev.deductions, { type: "", amount: 0 }],
    }));
  };

  const handleAllowanceChange = (
    index: number,
    field: "type" | "amount",
    value: string | number
  ) => {
    const newAllowances = [...formData.allowances];
    newAllowances[index] = {
      ...newAllowances[index],
      [field]: field === "amount" ? Number(value) : value,
    };
    setFormData((prev) => ({ ...prev, allowances: newAllowances }));
  };

  const handleDeductionChange = (
    index: number,
    field: "type" | "amount",
    value: string | number
  ) => {
    const newDeductions = [...formData.deductions];
    newDeductions[index] = {
      ...newDeductions[index],
      [field]: field === "amount" ? Number(value) : value,
    };
    setFormData((prev) => ({ ...prev, deductions: newDeductions }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof PayslipFormData, string>> = {};

    if (!formData.employeeId) newErrors.employeeId = "Employee ID is required";
    if (!formData.basicSalary)
      newErrors.basicSalary = "Basic salary is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  if (!canGeneratePayslip) {
    return <div>You don't have permission to generate payslips.</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Employee ID
            </label>
            <input
              type="text"
              value={formData.employeeId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, employeeId: e.target.value }))
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
            {errors.employeeId && (
              <p className="mt-1 text-sm text-red-600">{errors.employeeId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Basic Salary
            </label>
            <input
              type="number"
              value={formData.basicSalary}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  basicSalary: Number(e.target.value),
                }))
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
            {errors.basicSalary && (
              <p className="mt-1 text-sm text-red-600">{errors.basicSalary}</p>
            )}
          </div>
        </div>

        {/* Allowances */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Allowances</h3>
            <button
              type="button"
              onClick={handleAddAllowance}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              Add Allowance
            </button>
          </div>
          {formData.allowances.map((allowance, index) => (
            <div key={index} className="grid grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Allowance Type"
                value={allowance.type}
                onChange={(e) =>
                  handleAllowanceChange(index, "type", e.target.value)
                }
                className="rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
              <input
                type="number"
                placeholder="Amount"
                value={allowance.amount}
                onChange={(e) =>
                  handleAllowanceChange(index, "amount", e.target.value)
                }
                className="rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
          ))}
        </div>

        {/* Deductions */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Deductions</h3>
            <button
              type="button"
              onClick={handleAddDeduction}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              Add Deduction
            </button>
          </div>
          {formData.deductions.map((deduction, index) => (
            <div key={index} className="grid grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Deduction Type"
                value={deduction.type}
                onChange={(e) =>
                  handleDeductionChange(index, "type", e.target.value)
                }
                className="rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
              <input
                type="number"
                placeholder="Amount"
                value={deduction.amount}
                onChange={(e) =>
                  handleDeductionChange(index, "amount", e.target.value)
                }
                className="rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
          >
            Generate Payslip
          </button>
        </div>
      </div>
    </form>
  );
}
