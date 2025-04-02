// import React from "react";
import { Payslip } from "../../../types/payroll";
import { FaDownload, FaPrint, FaEnvelope } from "react-icons/fa";
// import { useAuth } from "../../../context/AuthContext";
import { generatePayslipPDF } from "../../../utils/pdfGenerator";
import { PayrollBranding } from "../../shared/PayrollBranding";
import { payrollService } from "../../../services/payrollService";
import { useState } from "react";
import { toast } from "react-hot-toast";

interface PayslipDetailProps {
  payslip: Payslip;
  onClose: () => void;
  setPayslip: React.Dispatch<React.SetStateAction<Payslip | null>>;
}

const formatAmount = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null) return "₦0.00";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);
};

const PayslipDetail: React.FC<PayslipDetailProps> = ({
  payslip,
  onClose,
  setPayslip,
}) => {
  //   const { user } = useAuth();
  const [loading, setLoading] = useState({
    email: false,
    download: false,
    print: false,
  });

  const handleDownload = async () => {
    try {
      setLoading((prev) => ({ ...prev, download: true }));
    await generatePayslipPDF(payslip);
      toast.success("Payslip downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download payslip. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, download: false }));
    }
  };

  const handlePrint = () => {
    setLoading((prev) => ({ ...prev, print: true }));
    window.print();
    // Reset print loading state after a short delay
    setTimeout(() => {
      setLoading((prev) => ({ ...prev, print: false }));
    }, 1000);
  };

  const handleEmail = async () => {
    try {
      setLoading((prev) => ({ ...prev, email: true }));
      const success = await payrollService.sendPayslipEmail(payslip.payslipId);
      if (success) {
        // Update local state to reflect email sent
        setPayslip((prev) => {
          if (!prev) return null;
          return {
          ...prev,
          emailSent: true,
          emailSentAt: new Date(),
          } as Payslip;
        });
      }
    } catch (error) {
      console.error("Error sending email:", error);
    } finally {
      setLoading((prev) => ({ ...prev, email: false }));
    }
  };

  // Add null checks for all numeric values
  const basicSalary = payslip.earnings?.basicSalary || 0;
  const totalDeductions = payslip.deductions?.totalDeductions || 0;
  const netPay = payslip.totals?.netPay || 0;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 sm:top-8 md:top-20 mx-auto p-4 sm:p-6 border w-[95%] md:w-[600px] lg:w-[800px] shadow-xl rounded-lg bg-white mb-4 sm:mb-8 md:mb-20 ml-0 sm:ml-[280px] print:ml-0 print:w-full print:max-w-none print:shadow-none print:border-0 payslip-container">
        {/* Header with Branding and Payslip ID */}
        <div className="border-b border-gray-200 pb-4 sm:pb-6 mb-4 sm:mb-6">
          <div className="mb-4 sm:mb-6">
            <PayrollBranding className="max-w-[150px] sm:max-w-[200px] mx-auto" />
            <p className="text-center text-xs sm:text-sm text-gray-500 mt-2">
              Ref: {payslip.payslipId}
            </p>
          </div>

          {/* Employee Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4">
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-500">
                Employee Details
              </h3>
              <p className="text-sm sm:text-base font-semibold">
                {payslip.employee?.name}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                ID: {payslip.employee?.employeeId}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                Dept: {payslip.employee?.department}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                Grade: {payslip.employee?.salaryGrade}
              </p>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-500">
                Payment Details
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Bank: {payslip.paymentDetails?.bankName}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                Account: {payslip.paymentDetails?.accountNumber}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                Name: {payslip.paymentDetails?.accountName}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-end gap-2 sm:gap-3 print:hidden">
            <button
              onClick={handleDownload}
              disabled={loading.download}
              className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
              title="Download PDF"
            >
              {loading.download ? (
                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <FaDownload className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
              <span className="hidden sm:inline">
                {loading.download ? "Downloading..." : "Download"}
              </span>
            </button>
            <button
              onClick={handlePrint}
              disabled={loading.print}
              className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
              title="Print"
            >
              {loading.print ? (
                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <FaPrint className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
              <span className="hidden sm:inline">
                {loading.print ? "Printing..." : "Print"}
              </span>
            </button>
            <button
              onClick={handleEmail}
              disabled={loading.email}
              className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
              title="Email"
            >
              {loading.email ? (
                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <FaEnvelope className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
              <span className="hidden sm:inline">
                {loading.email ? "Sending..." : "Email"}
              </span>
            </button>
          </div>
        </div>

        {/* Pay Period Information */}
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-green-600 mb-1">
                Pay Period
              </h3>
              <p className="text-xs sm:text-sm text-gray-700">
                {new Date(payslip.period?.startDate).toLocaleDateString()} -{" "}
                {new Date(payslip.period?.endDate).toLocaleDateString()}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                Frequency: {payslip.period?.frequency}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <h3 className="text-sm sm:text-base font-semibold text-green-600 mb-1">
                Status
              </h3>
              <p className="text-xs sm:text-sm text-gray-700">
                {payslip.status}
              </p>
            </div>
          </div>
        </div>

        {/* Earnings Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4 sm:mb-6">
          <div className="px-3 sm:px-4 py-2 sm:py-3 bg-green-50 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-sm sm:text-base font-semibold text-green-700">
                Earnings
              </h3>
              <p className="text-xs sm:text-sm font-medium text-green-700">
                Gross: {formatAmount(payslip.totals?.grossEarnings)}
              </p>
            </div>
          </div>
          <div className="p-3 sm:p-4 space-y-2">
            <div className="flex justify-between text-gray-700 text-xs sm:text-sm">
              <span className="font-medium">Basic Salary</span>
              <span className="font-semibold">{formatAmount(basicSalary)}</span>
            </div>

            {payslip.earnings?.allowances?.gradeAllowances?.map(
              (allowance, index) => (
                <div
                  key={index}
                  className="flex justify-between text-gray-700 text-xs sm:text-sm"
                >
                  <span className="font-medium">
                    {allowance.name}{" "}
                    {allowance.type === "percentage"
                      ? `(${allowance.value}%)`
                      : ""}
                  </span>
                  <span className="font-semibold">
                    {formatAmount(allowance.amount)}
                  </span>
                </div>
              )
            )}

            {payslip.earnings?.overtime?.amount > 0 && (
              <div className="flex justify-between text-gray-700 text-xs sm:text-sm">
                <span className="font-medium">
                  Overtime ({payslip.earnings.overtime.hours}hrs @{" "}
                  {formatAmount(payslip.earnings.overtime.rate)}/hr)
                </span>
                <span className="font-semibold">
                  {formatAmount(payslip.earnings.overtime.amount)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Deductions Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4 sm:mb-6">
          <div className="px-3 sm:px-4 py-2 sm:py-3 bg-red-50 border-b border-gray-200">
            <h3 className="text-sm sm:text-base font-semibold text-red-700">
              Deductions
            </h3>
          </div>
          <div className="p-3 sm:p-4 space-y-2">
            <div className="flex justify-between text-gray-700 text-xs sm:text-sm">
              <span className="font-medium">
                PAYE Tax ({payslip.deductions?.tax?.taxRate?.toFixed(2)}%)
              </span>
              <span className="font-semibold text-red-600">
                {formatAmount(payslip.deductions?.tax?.amount)}
              </span>
            </div>
            <div className="flex justify-between text-gray-700 text-xs sm:text-sm">
              <span className="font-medium">
                Pension ({payslip.deductions?.pension?.rate}%)
              </span>
              <span className="font-semibold text-red-600">
                {formatAmount(payslip.deductions?.pension?.amount)}
              </span>
            </div>
            <div className="flex justify-between text-gray-700 text-xs sm:text-sm">
              <span className="font-medium">
                NHF ({payslip.deductions?.nhf?.rate}%)
              </span>
              <span className="font-semibold text-red-600">
                {formatAmount(payslip.deductions?.nhf?.amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h3 className="text-sm sm:text-base font-medium text-gray-700 mb-1">
                Total Earnings
              </h3>
              <p className="text-lg sm:text-xl font-bold text-green-600">
                {formatAmount(payslip.totals?.grossEarnings)}
              </p>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-medium text-gray-700 mb-1">
                Total Deductions
              </h3>
              <p className="text-lg sm:text-xl font-bold text-red-600">
                {formatAmount(totalDeductions)}
              </p>
            </div>
          </div>
          <div className="pt-3 sm:pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">
                Net Pay
              </h3>
              <p className="text-xl sm:text-2xl font-bold text-green-600">
                {formatAmount(netPay)}
              </p>
            </div>
          </div>
        </div>

        {/* Approval Information */}
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200 text-xs sm:text-sm text-gray-600">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <p>Submitted by: {payslip.approvalFlow?.submittedBy?.name}</p>
              <p>
                Date:{" "}
                {new Date(payslip.approvalFlow?.submittedAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p>Approved by: {payslip.approvalFlow?.approvedBy?.name}</p>
              <p>
                Date:{" "}
                {new Date(payslip.approvalFlow?.approvedAt).toLocaleString()}
              </p>
            </div>
          </div>
          <p className="mt-2">Remarks: {payslip.approvalFlow?.remarks}</p>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 pt-3 sm:pt-4 mt-4 sm:mt-6 border-t border-gray-200">
          <div className="text-[10px] sm:text-xs text-gray-500">
            <p>
              Generated:{" "}
              {new Date(payslip.timestamps?.createdAt).toLocaleString()}
            </p>
            <p>
              Powered by Century Information Systems |{" "}
              {new Date().getFullYear()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-xs sm:text-sm print:hidden"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayslipDetail;
