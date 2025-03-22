import { useState, useEffect } from "react";
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
import TableSkeleton from "../../../components/skeletons/TableSkeleton";
import { toast } from "react-toastify";

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
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [summary, setSummary] = useState({
    totalPayroll: 0,
    totalEmployees: 0,
    pendingReviews: 0,
  });

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

  const SummaryCard = ({
    icon,
    title,
    value,
  }: {
    icon: React.ReactNode;
    title: string;
    value: string;
  }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-lg cursor-pointer">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">{icon}</div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="text-lg font-medium text-gray-900">{value}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  const PayrollRow = ({
    period,
    onProcess,
    isLoading,
  }: {
    period: PayrollPeriod;
    onProcess: () => void;
    isLoading: boolean;
  }) => (
    <tr className="hover:bg-gray-50 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-md cursor-pointer">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm md:text-base font-medium text-gray-900">
          {new Date(period.year, period.month - 1).toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
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
          {period.status.charAt(0).toUpperCase() + period.status.slice(1)}
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
          onClick={onProcess}
        >
          {isLoading
            ? "Processing..."
            : period.status === "paid"
            ? "View Details"
            : "Process"}
        </button>
      </td>
    </tr>
  );

  // Add this new component for empty state
  const EmptyState = () => (
    <tr>
      <td colSpan={6} className="px-6 py-12 text-center">
        <div className="flex flex-col items-center justify-center space-y-3">
          <FaMoneyBill className="h-12 w-12 text-gray-300" />
          <div className="text-gray-500 text-lg font-medium">
            No Payroll Data
          </div>
          <p className="text-gray-400 text-sm max-w-sm">
            Start by clicking "Run New Payroll" to begin processing payroll for
            this period
          </p>
        </div>
      </td>
    </tr>
  );

  useEffect(() => {
    const fetchPayrollData = async () => {
      setIsLoading(true);
      try {
        // TODO: Implement API calls to fetch:
        // - Payroll periods
        // - Summary data
        // - Active allowances and bonuses
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Remove this when implementing real API
      } catch (error) {
        toast.error("Failed to fetch payroll data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayrollData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">
          Process Payroll
        </h1>
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
          Run New Payroll
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          icon={<FaMoneyBill className="h-6 w-6 text-green-600" />}
          title="Total Payroll Amount"
          value={formatCurrency(summary.totalPayroll)}
        />

        <SummaryCard
          icon={<FaFileAlt className="h-6 w-6 text-green-600" />}
          title="Employees to Process"
          value={summary.totalEmployees.toString()}
        />

        <SummaryCard
          icon={<FaExclamationTriangle className="h-6 w-6 text-green-600" />}
          title="Pending Reviews"
          value={summary.pendingReviews.toString()}
        />
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

      {/* Payroll Table */}
      {isLoading ? (
        <TableSkeleton />
      ) : (
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
                {filteredPeriods.length > 0 ? (
                  filteredPeriods.map((period) => (
                    <PayrollRow
                      key={period.id}
                      period={period}
                      onProcess={() => handleRunPayroll()}
                      isLoading={isLoading}
                    />
                  ))
                ) : (
                  <EmptyState />
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
