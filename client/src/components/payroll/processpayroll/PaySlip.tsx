import React from "react";
import { PayrollBranding } from "../../shared/PayrollBranding";

export interface PayrollData {
  _id: string;
  earnings: {
    overtime: {
      hours: number;
      rate: number;
      amount: number;
    };
    bonus: Array<{
      type: string;
      description: string;
      amount: number;
    }>;
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
    nhf: {
      rate: number;
      amount: number;
    };
    others: Array<{
      name: string;
      amount: number;
    }>;
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
  employee: {
    _id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    fullName: string;
  };
  allowances: {
    gradeAllowances: Array<{
      name: string;
      type: string;
      value: number;
      amount: number;
      _id: string;
    }>;
    additionalAllowances: Array<{
      name: string;
      amount: number;
    }>;
    totalAllowances: number;
  };
  salaryGrade: {
    level: string;
    description: string;
  };
  basicSalary: number;
  month: number;
  year: number;
  status: string;
  createdAt: string;
  periodStart: string;
  periodEnd: string;

  // Add the bonuses property
  bonuses: {
    items: Array<{
      type: string;
      description: string;
      amount: number;
    }>;
    totalBonuses: number;
  };

  // Optional properties
  approvalFlow?: Array<{
    step: string;
    approver: string;
    status: string;
    date?: string;
  }>;
  processedBy?: string;

  // Payment information
  payment?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
  };
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
  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

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
            <p>Name: {data.employee.fullName}</p>
            <p>Employee ID: {data.employee.employeeId}</p>
            <p>Grade: {data.salaryGrade.level}</p>
            <p>Department: {data.salaryGrade.description}</p>
          </div>
        </div>
        <div className="justify-self-end">
          <h3 className="font-semibold">Payment Information</h3>
          <div className="mt-2 space-y-1 text-sm text-right">
            <p>Bank: {data.payment?.bankName}</p>
            <p>Account Name: {data.payment?.accountName || "N/A"}</p>
            <p>Account Number: {data.payment?.accountNumber}</p>
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
              <td className="text-right">{formatAmount(data.basicSalary)}</td>
            </tr>

            {/* Allowances */}
            {data.allowances.gradeAllowances.map((allowance) => (
              <tr key={allowance._id}>
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
      <div className="my-6 print:my-4">
        <h3 className="text-lg font-semibold text-green-600 print:text-green-600">
          Deductions
        </h3>
        <table className="w-full text-sm print:text-xs">
          <tbody className="print:text-black">
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
            <tr>
              <td className="py-2">Nhf ({data.deductions.nhf.rate}%)</td>
              <td className="text-right">
                {formatAmount(data.deductions.nhf.amount)}
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

      {/* Net Pay - Remove print background but keep text color */}
      <div className="bg-gray-100 p-4 rounded-lg mt-6 print:bg-transparent print:border print:border-green-200">
        <div className="grid grid-cols-2 gap-4 text-lg font-bold">
          <div className="print:text-green-600">Net Pay</div>
          <div className="text-right text-green-600 print:text-green-600">
            {formatAmount(data.totals.netPay)}
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
