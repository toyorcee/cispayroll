import React from "react";
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
    basicSalary: number;
    allowances: {
      gradeAllowances: Array<{
        name: string;
        type: string;
        value: number;
        amount: number;
        _id: string;
      }>;
      totalAllowances: number;
    };
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
    nhf: {
      rate: number;
      pensionableAmount: number;
      amount: number;
    };
  };
  totals: {
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
    department: string;
    salaryGrade: string;
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
  payslipId: string;
  period: {
    month: number;
    year: number;
  };
  paymentDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  processedAt: string;
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

  const getMonthName = (month: number) => {
    const monthNames = [
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
    return monthNames[month - 1];
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
          <p className="font-medium">Reference: {data.payslipId}</p>
          <p>
            Period: {getMonthName(data.period.month)} {data.period.year}
          </p>
        </div>
      </div>

      {/* Employee & Payment Info */}
      <div className="grid grid-cols-2 gap-6 my-4 print:grid print:grid-cols-2 print:gap-6 print:my-2">
        <div>
          <h3 className="font-semibold">Employee Information</h3>
          <div className="mt-2 space-y-1 text-sm">
            <p>Name: {data.employee.fullName}</p>
            <p>Employee ID: {data.employee.employeeId}</p>
            <p>Department: {data.employee.department}</p>
            <p>Grade: {data.salaryGrade.level}</p>
          </div>
        </div>
        <div className="justify-self-end">
          <h3 className="font-semibold">Payment Information</h3>
          <div className="mt-2 space-y-1 text-sm text-right">
            <p>Bank: {data.paymentDetails.bankName}</p>
            <p>Account Name: {data.paymentDetails.accountName}</p>
            <p>Account Number: {data.paymentDetails.accountNumber}</p>
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
              <td className="text-right">
                ₦{formatAmount(data.earnings.basicSalary)}
              </td>
            </tr>

            {/* Grade Allowances */}
            {data.earnings.allowances.gradeAllowances.map((allowance) => (
              <tr key={allowance._id}>
                <td className="py-2">
                  {allowance.name}
                  {allowance.type === "percentage"
                    ? ` (${allowance.value}%)`
                    : ""}
                </td>
                <td className="text-right">
                  ₦{formatAmount(allowance.amount)}
                </td>
              </tr>
            ))}

            {/* Total Allowances */}
            <tr className="border-t">
              <td className="py-2 font-medium">Total Allowances</td>
              <td className="text-right">
                ₦{formatAmount(data.earnings.allowances.totalAllowances)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Deductions Breakdown */}
      <div className="my-6 print:my-4">
        <h3 className="text-lg font-semibold text-red-600 print:text-red-600">
          Deductions
        </h3>
        <table className="w-full text-sm print:text-xs">
          <tbody className="print:text-black">
            <tr className="border-t">
              <td className="py-2">
                PAYE Tax ({data.deductions.tax.taxRate}% of ₦
                {formatAmount(data.deductions.tax.taxableAmount)})
              </td>
              <td className="text-right">
                ₦{formatAmount(data.deductions.tax.amount)}
              </td>
            </tr>
            <tr>
              <td className="py-2">
                Pension ({data.deductions.pension.rate}% of ₦
                {formatAmount(data.deductions.pension.pensionableAmount)})
              </td>
              <td className="text-right">
                ₦{formatAmount(data.deductions.pension.amount)}
              </td>
            </tr>
            <tr>
              <td className="py-2">
                NHF ({data.deductions.nhf.rate}% of ₦
                {formatAmount(data.deductions.nhf.pensionableAmount)})
              </td>
              <td className="text-right">
                ₦{formatAmount(data.deductions.nhf.amount)}
              </td>
            </tr>

            <tr className="border-t font-semibold">
              <td className="py-2">Total Deductions</td>
              <td className="text-right">
                ₦{formatAmount(data.totals.totalDeductions)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="bg-gray-100 p-4 rounded-lg mt-6 print:bg-transparent print:border print:border-green-200">
        <div className="grid grid-cols-2 gap-4">
          <div className="font-medium">Gross Earnings</div>
          <div className="text-right">
            ₦{formatAmount(data.totals.grossEarnings)}
          </div>
          <div className="font-medium">Total Deductions</div>
          <div className="text-right text-red-600">
            ₦{formatAmount(data.totals.totalDeductions)}
          </div>
          <div className="text-lg font-bold">Net Pay</div>
          <div className="text-lg font-bold text-green-600">
            ₦{formatAmount(data.totals.netPay)}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-xs text-gray-500 border-t pt-4 print:mt-4 print:text-black">
        <p>Status: {data.status}</p>
        <p>Generated on: {new Date(data.processedAt).toLocaleString()}</p>
        <p className="text-center mt-2">
          Powered by Century Information Systems | {new Date().getFullYear()}
        </p>
      </div>

      {/* Print Button */}
      {onPrint && (
        <div className="mt-8 flex justify-center print:hidden">
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
