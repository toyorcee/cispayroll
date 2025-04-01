import React from "react";
import { PayrollBranding } from "../../shared/PayrollBranding";
import { PayrollData } from "../../../types/payroll";

interface PaySlipProps {
  data: PayrollData;
  onPrint?: () => void;
}

const formatAmount = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null) return "₦0.00";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);
};

export const PaySlip: React.FC<PaySlipProps> = ({ data, onPrint }) => {
  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Add null checks for all numeric values
  const basicSalary = data.basicSalary || 0;
  const totalAllowances = data.allowances?.totalAllowances || 0;
  const totalBonuses = data.bonuses?.totalBonuses || 0;
  const totalDeductions = data.deductions?.totalDeductions || 0;
  const netPay = data.totals?.netPay || 0;

  return (
    <div className="payslip-container bg-white print:shadow-none print:p-0 print:w-full print:max-w-none">
      {/* Branding and Title */}
      <div className="border-b pb-6 mb-6 print:pb-4 print:mb-4 print:border-b print:border-gray-300">
        <PayrollBranding className="mb-6 max-w-[300px] mx-auto print:mb-4" />
        <h2 className="text-3xl font-bold text-center mb-4 print:text-2xl">
          PAYSLIP
        </h2>
        <div className="text-sm text-gray-600 text-center space-y-1 print:text-black">
          <p className="font-medium">Reference: {data._id}</p>
          <p>
            Period:{" "}
            {new Date(data.year, data.month - 1).toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </p>
          {/* <p>Frequency: {data.frequency}</p> */}
        </div>
      </div>

      {/* Employee & Payment Info */}
      <div className="grid grid-cols-2 gap-6 my-4 print:grid print:grid-cols-2 print:gap-6 print:my-2">
        <div>
          <h3 className="font-semibold">Employee Information</h3>
          <div className="mt-2 space-y-1 text-sm">
            <p>Name: {data.employee?.fullName || "N/A"}</p>
            <p>Employee ID: {data.employee?.employeeId || "N/A"}</p>
            <p>Grade: {data.salaryGrade?.level || "N/A"}</p>
            <p>Department: {data.salaryGrade?.description || "N/A"}</p>
          </div>
        </div>
        <div className="justify-self-end">
          <h3 className="font-semibold">Payment Information</h3>
          <div className="mt-2 space-y-1 text-sm text-right">
            <p>Bank: {data.payment?.bankName || "N/A"}</p>
            <p>Account Name: {data.payment?.accountName || "N/A"}</p>
            <p>Account Number: {data.payment?.accountNumber || "N/A"}</p>
          </div>
        </div>
      </div>

      {/* Earnings Breakdown */}
      <div className="my-6 print:my-4">
        <h3 className="text-lg font-semibold text-green-600 print:text-green-600">
          Earnings
        </h3>
        <table className="w-full text-sm print:text-xs">
          <tbody className="print:text-black">
            <tr className="border-t">
              <td className="py-2">Basic Salary</td>
              <td className="text-right">{formatAmount(basicSalary)}</td>
            </tr>

            {/* Allowances */}
            {data.allowances?.gradeAllowances?.map((allowance, index) => (
              <tr key={index}>
                <td className="py-2">
                  {allowance.name}
                  {allowance.type === "percentage"
                    ? ` (${allowance.value}%)`
                    : ""}
                </td>
                <td className="text-right">{formatAmount(allowance.amount)}</td>
              </tr>
            ))}

            {/* Overtime if any */}
            {data.earnings?.overtime?.amount > 0 && (
              <tr>
                <td className="py-2">
                  Overtime ({data.earnings.overtime.hours} hrs @{" "}
                  {formatAmount(data.earnings.overtime.rate)}/hr)
                </td>
                <td className="text-right">
                  {formatAmount(data.earnings.overtime.amount)}
                </td>
              </tr>
            )}

            <tr className="border-t font-semibold">
              <td className="py-2">Total Earnings</td>
              <td className="text-right">
                {formatAmount(basicSalary + totalAllowances)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Deductions Breakdown */}
      <div className="my-6 print:my-4">
        <h3 className="text-lg font-semibold text-green-600 print:text-green-600">
          Deductions
        </h3>
        <table className="w-full text-sm print:text-xs">
          <tbody className="print:text-black">
            <tr className="border-t">
              <td className="py-2">
                PAYE Tax ({data.deductions?.tax?.taxRate?.toFixed(2) || "0.00"}
                %)
              </td>
              <td className="text-right">
                {formatAmount(data.deductions?.tax?.amount)}
              </td>
            </tr>
            <tr>
              <td className="py-2">
                Pension ({data.deductions?.pension?.rate || "0.00"}%)
              </td>
              <td className="text-right">
                {formatAmount(data.deductions?.pension?.amount)}
              </td>
            </tr>
            <tr>
              <td className="py-2">
                Nhf ({data.deductions?.nhf?.rate || "0.00"}%)
              </td>
              <td className="text-right">
                {formatAmount(data.deductions?.nhf?.amount)}
              </td>
            </tr>

            {/* Other deductions if any */}
            {data.deductions?.others?.map((deduction, index) => (
              <tr key={index}>
                <td className="py-2">{deduction.name}</td>
                <td className="text-right">{formatAmount(deduction.amount)}</td>
              </tr>
            ))}

            <tr className="border-t font-semibold">
              <td className="py-2">Total Deductions</td>
              <td className="text-right">{formatAmount(totalDeductions)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Net Pay */}
      <div className="bg-gray-100 p-4 rounded-lg mt-6 print:bg-transparent print:border print:border-green-200">
        <div className="grid grid-cols-2 gap-4 text-lg font-bold">
          <div className="print:text-green-600">Net Pay</div>
          <div className="text-right text-green-600 print:text-green-600">
            {formatAmount(netPay)}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-xs text-gray-500 border-t pt-4 print:mt-4 print:text-black">
        <p>
          Period: {new Date(data.periodStart).toLocaleDateString()} -{" "}
          {new Date(data.periodEnd).toLocaleDateString()}
        </p>
        <p>Generated on: {new Date(data.createdAt).toLocaleString()}</p>
        <p>Status: {data.status}</p>
        <p className="text-center mt-2">
          Powered by Century Information Systems | {new Date().getFullYear()}
        </p>
      </div>

      {/* Print Button */}
      {onPrint && (
        <div className="mt-8 flex justify-center print-hidden">
          <button
            onClick={handlePrint}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Print Payslip
          </button>
        </div>
      )}
    </div>
  );
};
