import { useState } from "react";
import {
  FaFilter,
  FaPlus,
  FaCalculator,
  FaMoneyBill,
  FaArrowDown,
} from "react-icons/fa";
import { currentPayrollEntries } from "../../../data/payroll";
import { DeductionSummary, PayrollEntry } from "../../../types/payroll";
import { Deduction } from "../../../types/common";
import { Link } from "react-router-dom";

interface ExtendedDeduction extends Deduction {
  employeeId: string;
  employeeName: string;
}

type DeductionFilterType = "all" | "statutory" | "voluntary";

const getDeductionsSummary = (): DeductionSummary[] => {
  const deductions: ExtendedDeduction[] = currentPayrollEntries.flatMap(
    (entry: PayrollEntry) =>
      entry.employee.salary.deductions.map((d: Deduction) => ({
        ...d,
        employeeId: entry.employeeId,
        employeeName: `${entry.employee.firstName} ${entry.employee.lastName}`,
      }))
  );

  const summary = deductions.reduce<DeductionSummary[]>((acc, curr) => {
    const existing = acc.find((d) => d.type === curr.type);
    if (existing) {
      existing.totalAmount += curr.amount;
      existing.employees = new Set([
        ...existing.employeeIds,
        curr.employeeId,
      ]).size;
      existing.employeeIds.add(curr.employeeId);
    } else {
      acc.push({
        id: `${curr.type}-${Date.now()}-${Math.random()}`,
        name: curr.type,
        type:
          curr.type === "Tax" || curr.type === "Pension" || curr.type === "NHF"
            ? "Statutory"
            : "Voluntary",
        calculation:
          curr.type === "Tax"
            ? "Progressive Rate"
            : curr.type === "Pension"
            ? "8% of Basic Salary"
            : curr.type === "NHF"
            ? "2.5% of Basic Salary"
            : "Variable",
        totalAmount: curr.amount,
        employees: 1,
        employeeIds: new Set([curr.employeeId]),
        status: "Active",
        lastUpdated: new Date().toLocaleDateString(),
      });
    }
    return acc;
  }, []);

  return summary;
};

const statusColors = {
  Active: "bg-green-100 text-green-800",
  Inactive: "bg-gray-100 text-gray-800",
  Pending: "bg-yellow-100 text-yellow-800",
} as const;

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);
};

export default function Deductions() {
  const [selectedType, setSelectedType] = useState<DeductionFilterType>("all");
  const deductions = getDeductionsSummary();

  const filteredDeductions =
    selectedType === "all"
      ? deductions
      : deductions.filter(
          (d) =>
            d.type ===
            (selectedType === "statutory" ? "Statutory" : "Voluntary")
        );

  const totalDeductions = deductions.reduce((sum, d) => sum + d.totalAmount, 0);
  const averagePerEmployee = totalDeductions / currentPayrollEntries.length;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link
          to="/dashboard/payroll/deductions/new"
          className="inline-flex items-center px-4 py-2 !bg-green-600 !text-white rounded-lg hover:bg-green-700 
                   transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg
                   animate-bounce-slow cursor-pointer focus:outline-none focus:ring-0"
        >
          <FaPlus className="h-5 w-5 mr-2" />
          Add Deduction
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div
          className="bg-white overflow-hidden shadow rounded-lg transform transition-all duration-300 
                    hover:scale-105 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaCalculator className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Deductions
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(totalDeductions)}
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
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaMoneyBill className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Average Per Employee
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(averagePerEmployee)}
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
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaArrowDown className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Deductions
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {deductions.length}
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
            value={selectedType}
            onChange={(e) => {
              const value = e.target.value as DeductionFilterType;
              if (
                value === "all" ||
                value === "statutory" ||
                value === "voluntary"
              ) {
                setSelectedType(value);
              }
            }}
          >
            <option value="all">All Types</option>
            <option value="statutory">Statutory</option>
            <option value="voluntary">Voluntary</option>
          </select>
        </div>
      </div>

      {/* Deductions Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deduction Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Calculation Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
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
                  key={deduction.id}
                  className="hover:bg-gray-50 transition-all duration-200 
                           transform hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm md:text-base font-medium text-gray-900">
                      {deduction.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {deduction.employees} employees
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm md:text-base text-gray-500">
                    {deduction.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm md:text-base text-gray-500">
                    {deduction.calculation}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm md:text-base font-medium text-gray-900">
                    {formatCurrency(deduction.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs md:text-sm leading-5 font-semibold rounded-full ${
                        statusColors[
                          deduction.status as keyof typeof statusColors
                        ]
                      }`}
                    >
                      {deduction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm md:text-base">
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
