import { PayrollData, Payslip, PayrollStatus } from "../types/payroll";

export const mapToPayslip = (payrollData: PayrollData): Payslip => {
  return {
    id: payrollData._id,
    employeeId: payrollData.employee.employeeId,
    employeeName: payrollData.employee.fullName,
    month: payrollData.month,
    year: payrollData.year,
    basicSalary: payrollData.basicSalary,
    allowances: payrollData.allowances.gradeAllowances.map((a) => ({
      type: a.name,
      amount: a.amount,
    })),
    deductions: [
      {
        type: "Tax",
        amount: payrollData.deductions.tax.amount,
      },
      {
        type: "Pension",
        amount: payrollData.deductions.pension.amount,
      },
      ...payrollData.deductions.others.map((d) => ({
        type: d.name,
        amount: d.amount,
      })),
    ],
    netPay: payrollData.totals.netPay,
    status: payrollData.status as PayrollStatus,
    paymentDate: new Date(payrollData.createdAt),
    createdAt: payrollData.createdAt,
  };
};
