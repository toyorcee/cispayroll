// import React from "react";
import { Payslip } from "../../../types/payroll";
import { FaDownload, FaPrint, FaEnvelope } from "react-icons/fa";
// import { useAuth } from "../../../context/AuthContext";
import { generatePayslipPDF } from "../../../utils/pdfGenerator";
import { PayrollBranding } from "../../shared/PayrollBranding";
import { payrollService } from "../../../services/payrollService";
import { useState } from "react";

interface PayslipDetailProps {
  payslip: Payslip;
  onClose: () => void;
  setPayslip: React.Dispatch<React.SetStateAction<Payslip>>;
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
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    await generatePayslipPDF(payslip);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = async () => {
    try {
      setLoading(true);
      const success = await payrollService.sendPayslipEmail(payslip.payslipId);
      if (success) {
        // Update local state to reflect email sent
        setPayslip((prev) => ({
          ...prev,
          emailSent: true,
          emailSentAt: new Date(),
        }));
      }
    } catch (error) {
      console.error("Error sending email:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add null checks for all numeric values
  const basicSalary = payslip.earnings?.basicSalary || 0;
  const totalAllowances = payslip.earnings?.allowances?.totalAllowances || 0;
  const totalDeductions = payslip.deductions?.totalDeductions || 0;
  const netPay = payslip.totals?.netPay || 0;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-6 border w-[95%] md:w-[600px] lg:w-[800px] shadow-xl rounded-lg bg-white mb-20">
        {/* Header with Branding and Payslip ID */}
        <div className="border-b border-gray-200 pb-6 mb-6">
          <div className="mb-6">
            <PayrollBranding className="max-w-[200px] mx-auto" />
            <p className="text-center text-sm text-gray-500 mt-2">
              Ref: {payslip.payslipId}
            </p>
          </div>

          {/* Employee Information */}
          <div className="grid grid-cols-2 gap-6 mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Employee Details
              </h3>
              <p className="text-base font-semibold">
                {payslip.employee?.name}
              </p>
              <p className="text-sm text-gray-600">
                ID: {payslip.employee?.employeeId}
              </p>
              <p className="text-sm text-gray-600">
                Dept: {payslip.employee?.department}
              </p>
              <p className="text-sm text-gray-600">
                Grade: {payslip.employee?.salaryGrade}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Payment Details
              </h3>
              <p className="text-sm text-gray-600">
                Bank: {payslip.paymentDetails?.bankName}
              </p>
              <p className="text-sm text-gray-600">
                Account: {payslip.paymentDetails?.accountNumber}
              </p>
              <p className="text-sm text-gray-600">
                Name: {payslip.paymentDetails?.accountName}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
              title="Download PDF"
            >
              <FaDownload className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Download</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
              title="Print"
            >
              <FaPrint className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Print</span>
            </button>
            <button
              onClick={handleEmail}
              className="flex items-center gap-2 px-3 py-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
              title="Email"
            >
              <FaEnvelope className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Email</span>
            </button>
          </div>
        </div>

        {/* Pay Period Information */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-base font-semibold text-green-600 mb-1">
                Pay Period
              </h3>
              <p className="text-gray-700">
                {new Date(payslip.period?.startDate).toLocaleDateString()} -{" "}
                {new Date(payslip.period?.endDate).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600">
                Frequency: {payslip.period?.frequency}
              </p>
            </div>
            <div className="text-right">
              <h3 className="text-base font-semibold text-green-600 mb-1">
                Status
              </h3>
              <p className="text-gray-700">{payslip.status}</p>
            </div>
          </div>
        </div>

        {/* Earnings Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
          <div className="px-4 py-3 bg-green-50 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-semibold text-green-700">
                Earnings
              </h3>
              <p className="text-sm font-medium text-green-700">
                Gross: {formatAmount(payslip.totals?.grossEarnings)}
              </p>
            </div>
          </div>
          <div className="p-4 space-y-2">
            <div className="flex justify-between text-gray-700">
              <span className="font-medium">Basic Salary</span>
              <span className="font-semibold">{formatAmount(basicSalary)}</span>
            </div>

            {payslip.earnings?.allowances?.gradeAllowances?.map(
              (allowance, index) => (
                <div key={index} className="flex justify-between text-gray-700">
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
              <div className="flex justify-between text-gray-700">
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
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
          <div className="px-4 py-3 bg-red-50 border-b border-gray-200">
            <h3 className="text-base font-semibold text-red-700">Deductions</h3>
          </div>
          <div className="p-4 space-y-2">
            <div className="flex justify-between text-gray-700">
              <span className="font-medium">
                PAYE Tax ({payslip.deductions?.tax?.taxRate?.toFixed(2)}%)
              </span>
              <span className="font-semibold text-red-600">
                {formatAmount(payslip.deductions?.tax?.amount)}
              </span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span className="font-medium">
                Pension ({payslip.deductions?.pension?.rate}%)
              </span>
              <span className="font-semibold text-red-600">
                {formatAmount(payslip.deductions?.pension?.amount)}
              </span>
            </div>
            <div className="flex justify-between text-gray-700">
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
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-base font-medium text-gray-700 mb-1">
                Total Earnings
              </h3>
              <p className="text-xl font-bold text-green-600">
                {formatAmount(payslip.totals?.grossEarnings)}
              </p>
            </div>
            <div>
              <h3 className="text-base font-medium text-gray-700 mb-1">
                Total Deductions
              </h3>
              <p className="text-xl font-bold text-red-600">
                {formatAmount(totalDeductions)}
              </p>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Net Pay</h3>
              <p className="text-2xl font-bold text-green-600">
                {formatAmount(netPay)}
              </p>
            </div>
          </div>
        </div>

        {/* Approval Information */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-600">
          <div className="grid grid-cols-2 gap-4">
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
        <div className="flex justify-between items-center pt-4 mt-6 border-t border-gray-200">
          <div className="text-xs text-gray-500">
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
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayslipDetail;
