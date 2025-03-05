import { useState } from "react";
import {
  FaMoneyBill,
  FaFilter,
  FaSpinner,
  FaExclamationTriangle,
  FaFileAlt,
} from "react-icons/fa";
import { PayrollPeriod } from "../../../types/payroll";
import { payrollPeriods, payrollSummaries } from "../../../data/payroll";
import { Link } from "react-router-dom";

const statusColors: Record<PayrollPeriod["status"], string> = {
  draft: "bg-gray-100 text-gray-800",
  processing: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  paid: "bg-green-100 text-green-800",
};

const formatCurrency = (amount: number | undefined) => {
  if (!amount) return "₦0.00";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);
};

export default function ProcessPayroll() {
  const [selectedStatus, setSelectedStatus] = useState<
    PayrollPeriod["status"] | "all"
  >("all");
  const [isLoading, setIsLoading] = useState(false);

  const filteredPeriods =
    selectedStatus === "all"
      ? payrollPeriods
      : payrollPeriods.filter((period) => period.status === selectedStatus);

  const currentSummary = payrollSummaries[0];
  const pendingReviews = payrollPeriods.filter(
    (p) => p.status === "processing"
  ).length;

  const handleRunPayroll = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Error running payroll:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link
          to="/dashboard/payroll/run"
          className="inline-flex items-center px-4 py-2 !bg-green-600 !text-white rounded-lg hover:bg-green-700 
                   transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg
                   animate-bounce-slow cursor-pointer focus:outline-none focus:ring-0"
        >
          {isLoading ? (
            <FaSpinner className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <FaMoneyBill className="h-5 w-5 mr-2" />
          )}
          Run Payroll
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg transform transition-all duration-300 hover:scale-105 cursor-pointer">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaMoneyBill className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Payroll Amount
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(currentSummary?.totalNetSalary)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg transform transition-all duration-300 hover:scale-105 cursor-pointer">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaFileAlt className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Employees to Process
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {currentSummary?.totalEmployees || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg transform transition-all duration-300 hover:scale-105 cursor-pointer">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending Reviews
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {pendingReviews}
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
            value={selectedStatus}
            onChange={(e) =>
              setSelectedStatus(
                e.target.value as PayrollPeriod["status"] | "all"
              )
            }
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="processing">Processing</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Payroll Periods Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employees
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPeriods.map((period) => (
                <tr
                  key={period.id}
                  className="hover:bg-gray-50 transition-all duration-200 
                           transform hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm md:text-base font-medium text-gray-900">
                      {new Date(period.year, period.month - 1).toLocaleString(
                        "default",
                        {
                          month: "long",
                          year: "numeric",
                        }
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm md:text-base text-gray-500">
                    {period.totalEmployees || 0} employees
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm md:text-base font-medium text-gray-900">
                    {formatCurrency(period.totalNetSalary)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs md:text-sm leading-5 font-semibold rounded-full ${
                        statusColors[period.status]
                      }`}
                    >
                      {period.status.charAt(0).toUpperCase() +
                        period.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm md:text-base text-gray-500">
                    {period.processedDate
                      ? period.processedDate.toLocaleDateString()
                      : "Pending"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      className="text-xs md:text-sm px-2 py-1 bg-green-100 text-green-700 rounded-lg 
                               hover:bg-green-200 transition-all duration-200 transform hover:-translate-y-0.5
                               hover:shadow-md cursor-pointer focus:outline-none focus:ring-0"
                    >
                      {period.status === "paid" ? "View Details" : "Process"}
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
