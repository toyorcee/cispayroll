import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FaMoneyBill,
  FaFilter,
  FaSpinner,
  FaExclamationTriangle,
  FaFileAlt,
} from "react-icons/fa";
import {
  PayrollStatus,
  type PayrollPeriod,
  type PayrollStats,
  type PayrollData,
  type PeriodPayrollResponse,
  type Payslip,
} from "../../../types/payroll";
import { payrollService } from "../../../services/payrollService";
import TableSkeleton from "../../../components/skeletons/TableSkeleton";
import { toast } from "react-toastify";
import PayslipDetail from "../../../components/payroll/processpayroll/PayslipDetail";
import { BarChart, LineChart, PieChart } from "../../../components/charts";
import { useInView } from "framer-motion";
import PayrollHistoryModal from "../../../components/payroll/processpayroll/PayrollHistoryModal";
import PayrollPeriodModal from "../../../components/payroll/processpayroll/PayrollPeriodModal";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
} from "@mui/material";
import {
  departmentService,
  Department,
} from "../../../services/departmentService";
import { RunPayrollModal } from "../../../components/payroll/processpayroll/RunPayrollModal";

const statusColors: Record<PayrollStatus, string> = {
  [PayrollStatus.PENDING]: "bg-yellow-100 text-yellow-800",
  [PayrollStatus.PROCESSING]: "bg-blue-100 text-blue-800",
  [PayrollStatus.APPROVED]: "bg-green-100 text-green-800",
  [PayrollStatus.REJECTED]: "bg-red-100 text-red-800",
  [PayrollStatus.PAID]: "bg-green-100 text-green-800",
  [PayrollStatus.CANCELLED]: "bg-gray-100 text-gray-800",
};

const formatCurrency = (amount: number | undefined) => {
  if (!amount) return "₦0.00";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);
};

// For LineChart
interface LineChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }[];
}

// For BarChart
interface BarChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string[];
    backgroundColor: string[];
    borderWidth: number;
  }[];
}

// For PieChart (if you're using it)
interface PieChartData {
  labels: string[];
  datasets: [
    {
      label: string;
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }
  ];
}

// Add proper typing for EmployeePayrollCharts
interface EmployeePayrollChartsProps {
  employeeData: {
    employeeId: string;
    payrollHistory: PayrollData[];
  };
}

const EmployeePayrollCharts: React.FC<EmployeePayrollChartsProps> = ({
  employeeData,
}) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
    {/* Salary Progression Chart */}
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Salary Progression</h3>
      <LineChart
        data={{
          labels: employeeData.payrollHistory.map(
            (p) =>
              `${new Date(p.year, p.month - 1).toLocaleString("default", {
                month: "short",
              })}/${p.year}`
          ),
          datasets: [
            {
              label: "Net Salary",
              data: employeeData.payrollHistory.map((p) => p.totals.netPay),
              borderColor: "rgb(34 197 94)",
              backgroundColor: "rgba(34, 197, 94, 0.1)",
            },
          ],
        }}
      />
    </div>

    {/* Earnings Breakdown */}
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Current Earnings Breakdown</h3>
      <PieChart
        data={{
          labels: ["Basic Salary", "Allowances", "Deductions"],
          datasets: [
            {
              data: [
                employeeData.payrollHistory[0].basicSalary,
                employeeData.payrollHistory[0].allowances.totalAllowances,
                -employeeData.payrollHistory[0].deductions.totalDeductions,
              ],
              backgroundColor: [
                "rgba(34, 197, 94, 0.8)",
                "rgba(59, 130, 246, 0.8)",
                "rgba(239, 68, 68, 0.8)",
              ],
              borderColor: ["white", "white", "white"],
              borderWidth: 2,
            },
          ],
        }}
      />
    </div>
  </div>
);

export default function ProcessPayroll() {
  const [selectedStatus, setSelectedStatus] = useState<PayrollStatus | "all">(
    "all"
  );
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedEmployeeData, setSelectedEmployeeData] = useState<{
    employeeId: string;
    payrollHistory: PayrollData[];
  } | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedEmployeeHistory, setSelectedEmployeeHistory] = useState(null);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [selectedPeriodData, setSelectedPeriodData] =
    useState<PeriodPayrollResponse | null>(null);
  const [showRunPayrollModal, setShowRunPayrollModal] = useState(false);

  // Add queryClient for local updates
  const queryClient = useQueryClient();

  const {
    data: periodsData = [] as PayrollPeriod[],
    isLoading: isPeriodsLoading,
  } = useQuery<PayrollPeriod[]>({
    queryKey: ["payrollPeriods"],
    queryFn: () => payrollService.getPayrollPeriods(),
  });

  const { isLoading: isStatsLoading } = useQuery<PayrollStats>({
    queryKey: ["payrollStats"],
    queryFn: () => payrollService.getPayrollStats(),
  });

  // Calculate total payroll amount (only APPROVED and PAID payrolls)
  const totalPayrollAmount = periodsData
    .filter(
      (period) =>
        period.status === PayrollStatus.APPROVED ||
        period.status === PayrollStatus.PAID
    )
    .reduce((sum, period) => sum + (period.totalNetSalary || 0), 0);

  // Calculate employees to process (only PENDING payrolls)
  const employeesToProcess = periodsData
    .filter((period) => period.status === PayrollStatus.PENDING)
    .reduce((sum, period) => sum + (period.totalEmployees || 0), 0);

  // Calculate pending reviews (only PENDING status)
  const pendingCount = periodsData.filter(
    (period) => period.status === PayrollStatus.PENDING
  ).length;

  // Fixed filtered periods
  const filteredPeriods =
    selectedStatus === "all"
      ? periodsData
      : periodsData.filter((period) => period.status === selectedStatus);

  const handleViewPeriodDetails = async (period: PayrollPeriod) => {
    try {
      setShowPeriodModal(true);
      setSelectedPeriodData(null); // Show loading state

      const periodData = await payrollService.getPeriodPayroll(
        period.month,
        period.year
      );
      setSelectedPeriodData(periodData);
    } catch (error) {
      console.error("Failed to fetch period details:", error);
      toast.error("Failed to fetch period details");
      setShowPeriodModal(false);
    }
  };

  const handleViewPayslip = async (employeeId: string) => {
    try {
      setShowPeriodModal(false);
      const payslip = await payrollService.viewPayslip(employeeId);
      setSelectedPayslip(payslip);
      setShowPayslipModal(true);
    } catch {
      toast.error("Failed to fetch payslip");
      setShowPeriodModal(true);
    }
  };

  const handleViewEmployeeHistory = async (employeeId: string) => {
    try {
      setShowPeriodModal(false);
      const history = await payrollService.getEmployeePayrollHistory(
        employeeId
      );
      setSelectedEmployeeHistory(history);
      setShowHistoryModal(true);
    } catch {
      toast.error("Failed to fetch employee history");
      setShowPeriodModal(true);
    }
  };

  // Type the props for SummaryCard
  interface SummaryCardProps {
    icon: React.ReactNode;
    title: string;
    value: string;
  }

  const SummaryCard = ({ icon, title, value }: SummaryCardProps) => (
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

  const EmptyState = () => (
    <tr>
      <td colSpan={6} className="h-[calc(100vh-300px)]">
        <div className="flex h-full w-full items-center justify-center">
          <div className="flex flex-col items-center justify-center space-y-6 p-10 rounded-xl bg-green-50/50 ml-56">
            <div className="p-5 rounded-full bg-green-100">
              <FaMoneyBill className="h-14 w-14 text-green-600" />
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-semibold text-green-600">
                No Payroll Data
              </h3>
              <p className="text-gray-600 text-base max-w-sm leading-relaxed">
                Start by clicking "Run New Payroll" to begin processing payroll
                for this period
              </p>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );

  const isLoading = isPeriodsLoading || isStatsLoading;

  // Add refs for chart animations
  const statusDistRef = useRef(null);
  const monthlyCompRef = useRef(null);

  // Removed unused isPayrollTrendsInView variable
  const isStatusDistInView = useInView(statusDistRef, { amount: 0.5 });
  const isMonthlyCompInView = useInView(monthlyCompRef, { amount: 0.5 });

  // Update the chart data preparation with tooltips
  const payrollTrendsData: LineChartData = {
    labels: periodsData.map(
      (period) =>
        `${new Date(period.year, period.month - 1).toLocaleString("default", {
          month: "short",
        })}/${period.year}`
    ),
    datasets: [
      {
        label: "Monthly Payroll Amount",
        data: periodsData.map((period) => period.totalNetSalary || 0),
        borderColor: "rgb(34 197 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
      },
    ],
  };

  const employeeTrendsData: BarChartData = {
    labels: periodsData.map(
      (period) =>
        `${new Date(period.year, period.month - 1).toLocaleString("default", {
          month: "short",
        })}/${period.year}`
    ),
    datasets: [
      {
        label: "Number of Employees",
        data: periodsData.map((period) => period.totalEmployees || 0),
        borderColor: Array(periodsData.length).fill("rgb(59 130 246)"),
        backgroundColor: Array(periodsData.length).fill(
          "rgba(59, 130, 246, 0.8)"
        ),
        borderWidth: 2,
      },
    ],
  };

  const monthlyComparisonData: BarChartData = {
    labels: periodsData.map(
      (period) =>
        `${new Date(period.year, period.month - 1).toLocaleString("default", {
          month: "short",
        })}/${period.year}`
    ),
    datasets: [
      {
        label: "Payroll Amount",
        data: periodsData.map((period) => period.totalNetSalary || 0),
        borderColor: Array(periodsData.length).fill("rgb(34 197 94)"),
        backgroundColor: Array(periodsData.length).fill(
          "rgba(34, 197, 94, 0.8)"
        ),
        borderWidth: 2,
      },
    ],
  };

  const statusDistributionData: PieChartData = {
    labels: ["Pending", "Approved", "Paid", "Processing"],
    datasets: [
      {
        label: "Status Distribution",
        data: [
          periodsData.filter((p) => p.status === PayrollStatus.PENDING).length,
          periodsData.filter((p) => p.status === PayrollStatus.APPROVED).length,
          periodsData.filter((p) => p.status === PayrollStatus.PAID).length,
          periodsData.filter((p) => p.status === PayrollStatus.PROCESSING)
            .length,
        ],
        backgroundColor: [
          "rgba(234, 179, 8, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(59, 130, 246, 0.8)",
          "rgba(249, 115, 22, 0.8)",
        ],
        borderColor: ["white", "white", "white", "white"],
        borderWidth: 2,
      },
    ],
  };

  // Update the table to use MUI components properly
  const PayrollTable = () => (
    <TableContainer component={Paper} className="rounded-lg shadow">
      <Table>
        <TableHead className="bg-gray-50">
          <TableRow>
            <TableCell>Period</TableCell>
            <TableCell>Employees</TableCell>
            <TableCell>Net Salary</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Date</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredPeriods.length > 0 ? (
            filteredPeriods.map((period) => (
              <TableRow key={period._id} hover>
                <TableCell>
                  {new Date(period.year, period.month - 1).toLocaleString(
                    "default",
                    { month: "long", year: "numeric" }
                  )}
                </TableCell>
                <TableCell>{period.totalEmployees || 0} employees</TableCell>
                <TableCell>{formatCurrency(period.totalNetSalary)}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      statusColors[period.status]
                    }`}
                  >
                    {period.status}
                  </span>
                </TableCell>
                <TableCell>
                  {period.processedDate
                    ? new Date(period.processedDate).toLocaleDateString()
                    : "Pending"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => handleViewPeriodDetails(period)}
                      className="text-green-600 hover:text-green-800 px-4 py-2 rounded-md hover:bg-green-50 transition-colors duration-200 flex items-center gap-2 cursor-pointer"
                      title="View period payroll details"
                    >
                      <FaFileAlt className="h-4 w-4" />
                      <span className="text-sm font-medium">View Details</span>
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6}>
                <EmptyState />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const {
    data: departments = [] as Department[],
    isLoading: isDepartmentsLoading,
  } = departmentService.useGetDepartments();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">
          Process Payroll
        </h1>
        <button
          onClick={() => setShowRunPayrollModal(true)}
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
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          icon={<FaMoneyBill className="h-6 w-6 text-green-600" />}
          title="Total Payroll Amount"
          value={formatCurrency(totalPayrollAmount)}
        />

        <SummaryCard
          icon={<FaFileAlt className="h-6 w-6 text-green-600" />}
          title="Employees to Process"
          value={employeesToProcess.toString()}
        />

        <SummaryCard
          icon={<FaExclamationTriangle className="h-6 w-6 text-green-600" />}
          title="Pending Reviews"
          value={pendingCount.toString()}
        />
      </div>

      {/* Add these filters above the charts section */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date Range
            </label>
            <select className="mt-1 block w-full rounded-md border-gray-300">
              <option value="last3">Last 3 Months</option>
              <option value="last6">Last 6 Months</option>
              <option value="last12">Last 12 Months</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Department
            </label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300"
              disabled={isDepartmentsLoading}
            >
              <option value="all">All Departments</option>
              {departments.map((dept: Department) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
            {isDepartmentsLoading && (
              <p className="text-sm text-gray-500 mt-1">
                Loading departments...
              </p>
            )}
          </div>

          {/* Payment Frequency Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Frequency
            </label>
            <select className="mt-1 block w-full rounded-md border-gray-300">
              <option value="all">All Frequencies</option>
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select className="mt-1 block w-full rounded-md border-gray-300">
              <option value="all">All STATUS</option>
              {Object.values(PayrollStatus).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payroll Trends */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Payroll Trends</h3>
          <LineChart data={payrollTrendsData} />
        </div>

        {/* Status Distribution */}
        <div ref={statusDistRef} className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Status Distribution</h3>
          {isStatusDistInView && <PieChart data={statusDistributionData} />}
        </div>

        {/* Employee Count Trends */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            Employee Count by Period
          </h3>
          <BarChart data={employeeTrendsData} />
        </div>

        {/* Monthly Comparison */}
        <div ref={monthlyCompRef} className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            Monthly Payroll Comparison
          </h3>
          {isMonthlyCompInView && <BarChart data={monthlyComparisonData} />}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4 items-center">
        <div
          className="flex items-center cursor-pointer"
          onClick={() => {
            const select = document.getElementById(
              "status-filter"
            ) as HTMLSelectElement;
            if (select) select.click();
          }}
        >
          <FaFilter className="h-4 w-4 text-green-600 mr-2 cursor-pointer" />
          <select
            id="status-filter"
            className="text-sm md:text-base border-gray-300 rounded-lg shadow-sm cursor-pointer"
            value={selectedStatus}
            onChange={(e) =>
              setSelectedStatus(e.target.value as PayrollStatus | "all")
            }
          >
            <option value="all">All Status</option>
            {Object.values(PayrollStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Payroll Table with typed data */}
      {isLoading ? <TableSkeleton /> : <PayrollTable />}

      {/* Show PayslipDetail modal when a payslip is selected */}
      {showPayslipModal && selectedPayslip && (
        <PayslipDetail
          payslip={selectedPayslip}
          onClose={() => {
            setShowPayslipModal(false);
            setSelectedPayslip(null);
            setShowPeriodModal(true);
          }}
        />
      )}

      {/* Employee Analysis Section */}
      {selectedEmployeeData && (
        <div className="relative bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              Employee Payroll Analysis - {selectedEmployeeData.employeeId}
            </h2>
            <button
              onClick={() => setSelectedEmployeeData(null)}
              className="inline-flex items-center px-4 py-2 text-sm text-gray-600 
                         hover:text-gray-800 bg-gray-100 rounded-md 
                         hover:bg-gray-200 transition-colors"
            >
              <span className="mr-2">←</span> Back to Overview
            </button>
          </div>
          <EmployeePayrollCharts employeeData={selectedEmployeeData} />
        </div>
      )}

      {/* Period Modal */}
      <PayrollPeriodModal
        isOpen={showPeriodModal}
        onClose={() => setShowPeriodModal(false)}
        data={selectedPeriodData}
        onViewPayslip={handleViewPayslip}
        onViewHistory={handleViewEmployeeHistory}
        isLoading={isLoading}
        onShowPeriodModal={() => setShowPeriodModal(true)}
      />

      {/* Employee History Modal */}
      <PayrollHistoryModal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setSelectedEmployeeHistory(null);
          setShowPeriodModal(true);
        }}
        data={selectedEmployeeHistory}
      />

      {/* Add RunPayrollModal */}
      <RunPayrollModal
        isOpen={showRunPayrollModal}
        onClose={() => setShowRunPayrollModal(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["payrollPeriods"] });
          queryClient.invalidateQueries({ queryKey: ["payrollStats"] });
        }}
      />
    </div>
  );
}
