import React from "react";
import { FaMoneyCheckAlt } from "react-icons/fa";
import { PayrollBranding } from "../../shared/PayrollBranding";

interface PayrollData {
  _id: string;
  earnings: {
    overtime: {
      hours: number;
      rate: number;
      amount: number;
    };
    bonus: any[];
    totalEarnings: number;
  };
  deductions: {
    tax: {
      taxableAmount: number;
      taxRate: number;
      amount: number;
    };
    pension: {
      pensionableAmount: number;
      rate: number;
      amount: number;
    };
    loans: any[];
    others: any[];
    totalDeductions: number;
  };
  totals: {
    basicSalary: number;
    totalAllowances: number;
    totalBonuses: number;
    grossEarnings: number;
    totalDeductions: number;
    netPay: number;
  };
  approvalFlow: {
    submittedBy: string;
    submittedAt: string;
  };
  payment: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  allowances: {
    gradeAllowances: Array<{
      name: string;
      type: string;
      value: number;
      amount: number;
      _id: string;
    }>;
    additionalAllowances: any[];
    totalAllowances: number;
  };
  bonuses: {
    items: any[];
    totalBonuses: number;
  };
  employee: {
    _id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    fullName: string;
  };
  salaryGrade: {
    _id: string;
    level: string;
    description: string;
  };
  month: number;
  year: number;
  basicSalary: number;
  status: string;
  frequency: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  processedBy: string;
}

interface PaySlipProps {
  data: PayrollData;
  onPrint?: () => void;
}

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);
};

export const PaySlip: React.FC<PaySlipProps> = ({ data, onPrint }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md print:shadow-none">
      <div className="border-b pb-4">
        <PayrollBranding className="mb-4" />
        <h2 className="text-2xl font-bold text-center">PAYSLIP</h2>
        <div className="text-sm text-gray-600">
          <p>Reference: {data._id}</p>
          <p>
            Period:{" "}
            {new Date(data.year, data.month - 1).toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </p>
          <p>Frequency: {data.frequency}</p>
        </div>
      </div>

      {/* Employee & Payment Info */}
      <div className="grid md:grid-cols-2 gap-6 my-4">
        <div>
          <h3 className="font-semibold">Employee Information</h3>
          <div className="mt-2 space-y-1 text-sm">
            <p>Name: {data.employee.fullName}</p>
            <p>Employee ID: {data.employee.employeeId}</p>
            <p>Grade: {data.salaryGrade.level}</p>
            <p>Position: {data.salaryGrade.description}</p>
          </div>
        </div>
        <div>
          <h3 className="font-semibold">Payment Information</h3>
          <div className="mt-2 space-y-1 text-sm">
            <p>Bank: {data.payment.bankName}</p>
            <p>Account Name: {data.payment.accountName}</p>
            <p>Account Number: {data.payment.accountNumber}</p>
          </div>
        </div>
      </div>

      {/* Earnings Breakdown */}
      <div className="my-6">
        <h3 className="text-lg font-semibold text-green-600 mb-2">Earnings</h3>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-t">
              <td className="py-2">Basic Salary</td>
              <td className="text-right">{formatAmount(data.basicSalary)}</td>
            </tr>

            {/* Allowances */}
            {data.allowances.gradeAllowances.map((allowance) => (
              <tr key={allowance._id}>
                <td className="py-2">
                  {allowance.name} ({allowance.value}%)
                </td>
                <td className="text-right">{formatAmount(allowance.amount)}</td>
              </tr>
            ))}

            {/* Overtime if any */}
            {data.earnings.overtime.amount > 0 && (
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
                {formatAmount(data.earnings.totalEarnings)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Deductions Breakdown */}
      <div className="my-6">
        <h3 className="text-lg font-semibold text-green-600 mb-2">
          Deductions
        </h3>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-t">
              <td className="py-2">
                PAYE Tax ({data.deductions.tax.taxRate.toFixed(2)}%)
              </td>
              <td className="text-right">
                {formatAmount(data.deductions.tax.amount)}
              </td>
            </tr>
            <tr>
              <td className="py-2">
                Pension ({data.deductions.pension.rate}%)
              </td>
              <td className="text-right">
                {formatAmount(data.deductions.pension.amount)}
              </td>
            </tr>

            {/* Other deductions if any */}
            {data.deductions.others.map((deduction, index) => (
              <tr key={index}>
                <td className="py-2">{deduction.name}</td>
                <td className="text-right">{formatAmount(deduction.amount)}</td>
              </tr>
            ))}

            <tr className="border-t font-semibold">
              <td className="py-2">Total Deductions</td>
              <td className="text-right">
                {formatAmount(data.deductions.totalDeductions)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Net Pay */}
      <div className="bg-gray-100 p-4 rounded-lg mt-6">
        <div className="grid grid-cols-2 gap-4 text-lg font-bold">
          <div>Net Pay</div>
          <div className="text-right">{formatAmount(data.totals.netPay)}</div>
        </div>
      </div>

      {/* Updated Footer */}
      <div className="mt-8 text-xs text-gray-500 border-t pt-4">
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
        <button
          onClick={onPrint}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 print:hidden"
        >
          Print Payslip
        </button>
      )}
    </div>
  );
};
