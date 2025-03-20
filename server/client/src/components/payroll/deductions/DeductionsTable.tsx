import { useState } from "react";
import { FaEdit, FaEye, FaToggleOn, FaToggleOff } from "react-icons/fa";
import { Deduction, CalculationMethod } from "../../../types/deduction";
import { TableSkeleton } from "./Skeletons";

interface DeductionsTableProps {
  deductions: {
    statutory: Deduction[];
    voluntary: Deduction[];
  };
  isLoading: boolean;
  onEdit: (deduction: Deduction) => void;
  onView: (deduction: Deduction) => void;
  onToggleStatus: (id: string) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);
};

export const DeductionsTable = ({
  deductions,
  isLoading,
  onEdit,
  onView,
  onToggleStatus,
}: DeductionsTableProps) => {
  const [filter, setFilter] = useState<"all" | "statutory" | "voluntary">(
    "all"
  );

  if (isLoading) return <TableSkeleton />;

  const allDeductions = [...deductions.statutory, ...deductions.voluntary];

  const filteredDeductions =
    filter === "all"
      ? allDeductions
      : allDeductions.filter((d) =>
          filter === "statutory"
            ? d.type === "statutory"
            : d.type === "voluntary"
        );

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <select
            className="form-select rounded-md border-gray-300 text-sm focus:ring-green-500 focus:border-green-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="all">All Deductions</option>
            <option value="statutory">Statutory</option>
            <option value="voluntary">Voluntary</option>
          </select>
        </div>
      </div>
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
                Calculation Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
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
            {filteredDeductions.map((deduction) => (
              <tr
                key={deduction._id}
                className="hover:bg-gray-50 transition-all duration-200"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {deduction.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {deduction.description}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {deduction.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {deduction.calculationMethod}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {deduction.calculationMethod === CalculationMethod.PERCENTAGE
                    ? `${deduction.value}%`
                    : formatCurrency(deduction.value)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      deduction.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {deduction.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onView(deduction)}
                    className="text-green-600 hover:text-green-900 mr-4"
                  >
                    <FaEye className="inline-block w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit(deduction)}
                    className="text-green-600 hover:text-green-900 mr-4"
                  >
                    <FaEdit className="inline-block w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onToggleStatus(deduction._id)}
                    className="text-green-600 hover:text-green-900"
                  >
                    {deduction.isActive ? (
                      <FaToggleOn className="inline-block w-4 h-4" />
                    ) : (
                      <FaToggleOff className="inline-block w-4 h-4" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
