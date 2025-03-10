import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { UserRole, Permission } from "../../../types/auth";
import {
  FaFileInvoiceDollar,
  FaFilter,
  FaDownload,
  FaEye,
  FaClock,
  FaCheckCircle,
} from "react-icons/fa";
import { Payslip } from "../../../types/payslip";
import { mockPayslips } from "../../../data/payslips";
import PayslipDetail from "../../../components/payroll/PayslipDetail";
import PayslipForm from "../../../components/payroll/PayslipForm";
import { generatePayslipPDF } from "../../../utils/pdfGenerator";

const statusColors: Record<Payslip["status"], string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processed: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
};

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function PayslipManagement() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [showPayslipForm, setShowPayslipForm] = useState(false);

  const canManagePayroll = user?.permissions?.includes(
    Permission.MANAGE_PAYROLL
  );

  const getFilteredPayslips = () => {
    let filtered = mockPayslips;

    // Role-based filtering
    if (user?.role === UserRole.USER) {
      filtered = mockPayslips.filter(
        (payslip) => payslip.employeeId === user.id
      );
    } else if (user?.role === UserRole.ADMIN && !canManagePayroll) {
      filtered = mockPayslips.filter(
        (payslip) => user.department === "Finance"
      );
    }

    // Apply month/year filters
    if (selectedMonth !== "all") {
      filtered = filtered.filter((payslip) => payslip.month === selectedMonth);
    }
    if (selectedYear !== "all") {
      filtered = filtered.filter(
        (payslip) => payslip.year === parseInt(selectedYear)
      );
    }

    return filtered;
  };

  const getPageTitle = () => {
    switch (user?.role) {
      case UserRole.SUPER_ADMIN:
        return "All Payslips";
      case UserRole.ADMIN:
        return canManagePayroll ? "Payroll Management" : "Department Payslips";
      default:
        return "My Payslips";
    }
  };

  const calculateTotalAllowances = (payslip: Payslip): number => {
    return payslip.allowances.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateTotalDeductions = (payslip: Payslip): number => {
    return payslip.deductions.reduce((sum, item) => sum + item.amount, 0);
  };

  const handleGeneratePayslips = () => {
    setShowPayslipForm(true);
  };

  const handlePayslipFormSubmit = async (formData: any) => {
    // TODO: Implement API call to create payslip
    console.log("Creating payslip:", formData);
    setShowPayslipForm(false);
  };

  const handlePayslipFormCancel = () => {
    setShowPayslipForm(false);
  };

  const handleDownloadPayslip = async (payslip: Payslip) => {
    try {
      await generatePayslipPDF(payslip);
    } catch (error) {
      console.error("Error generating PDF:", error);
      // TODO: Show error notification
    }
  };

  const handleViewPayslip = (payslip: Payslip) => {
    setSelectedPayslip(payslip);
  };

  const filteredPayslips = getFilteredPayslips();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">
          {getPageTitle()}
        </h1>
        {user?.role !== UserRole.USER && (
          <button
            onClick={handleGeneratePayslips}
            className="inline-flex items-center px-4 py-2 !bg-green-600 !text-white rounded-lg hover:bg-green-700 
                         transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
          >
            <FaFileInvoiceDollar className="h-5 w-5 mr-2" />
            Generate Payslips
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaFileInvoiceDollar className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Payslips
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {filteredPayslips.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaClock className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {
                      filteredPayslips.filter((p) => p.status === "pending")
                        .length
                    }
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaCheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Processed
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {
                      filteredPayslips.filter((p) => p.status === "processed")
                        .length
                    }
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
                     !bg-green-600 !text-white px-3 py-1.5"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="all">All Months</option>
            {months.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center">
          <select
            className="text-sm md:text-base border-gray-300 rounded-lg shadow-sm 
                     !bg-green-600 !text-white px-3 py-1.5"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="all">All Years</option>
            {[2024, 2023, 2022].map((year) => (
              <option key={year} value={year.toString()}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Basic Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Allowances
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Deductions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Pay
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
              {filteredPayslips.map((payslip) => (
                <tr
                  key={payslip.id}
                  className="hover:bg-gray-50 transition-all duration-200"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {payslip.month} {payslip.year}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ₦{payslip.basicSalary.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ₦{calculateTotalAllowances(payslip).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ₦{calculateTotalDeductions(payslip).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ₦{payslip.netPay.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        statusColors[payslip.status]
                      }`}
                    >
                      {payslip.status.charAt(0).toUpperCase() +
                        payslip.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewPayslip(payslip)}
                      className="text-green-600 hover:text-green-900 mr-4"
                      title="View Details"
                    >
                      <FaEye className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDownloadPayslip(payslip)}
                      className="text-green-600 hover:text-green-900"
                      title="Download PDF"
                    >
                      <FaDownload className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {selectedPayslip && (
        <PayslipDetail
          payslip={selectedPayslip}
          onClose={() => setSelectedPayslip(null)}
        />
      )}

      {showPayslipForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
            <PayslipForm
              onSubmit={handlePayslipFormSubmit}
              onCancel={handlePayslipFormCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
}
