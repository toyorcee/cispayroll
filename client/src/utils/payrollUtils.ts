import { PayrollData, Payslip } from "../types/payroll";

export const mapToPayslip = (payrollData: PayrollData): Payslip => {
  return {
    _id: payrollData._id,
    payslipId: payrollData._id,
    employee: {
      id: payrollData.employee._id,
      name: payrollData.employee.fullName,
      employeeId: payrollData.employee.employeeId,
      department: payrollData.department.name,
      salaryGrade: payrollData.salaryGrade.level,
    },
    period: {
      month: payrollData.month,
      year: payrollData.year,
      startDate: payrollData.periodStart,
      endDate: payrollData.periodEnd,
    },
    allowances: {
      gradeAllowances: payrollData.allowances.gradeAllowances,
      additionalAllowances: payrollData.allowances.additionalAllowances,
      totalAllowances: payrollData.allowances.totalAllowances,
    },
    bonuses: {
      items: payrollData.bonuses.items,
      totalBonuses: payrollData.bonuses.totalBonuses,
    },
    earnings: {
      basicSalary: payrollData.basicSalary,
      allowances: {
        gradeAllowances: payrollData.allowances.gradeAllowances,
        additionalAllowances: payrollData.allowances.additionalAllowances,
        totalAllowances: payrollData.allowances.totalAllowances,
      },
      bonuses: {
        items: payrollData.bonuses.items,
        totalBonuses: payrollData.bonuses.totalBonuses,
      },
      totalEarnings: payrollData.earnings.totalEarnings,
    },
    deductions: {
      tax: {
        taxableAmount: payrollData.deductions.tax.taxableAmount,
        taxRate: payrollData.deductions.tax.taxRate,
        amount: payrollData.deductions.tax.amount,
      },
      pension: {
        pensionableAmount: payrollData.deductions.pension.pensionableAmount,
        rate: payrollData.deductions.pension.rate,
        amount: payrollData.deductions.pension.amount,
      },
      nhf: {
        pensionableAmount: payrollData.deductions.nhf.rate * 100,
        rate: payrollData.deductions.nhf.rate,
        amount: payrollData.deductions.nhf.amount,
      },
      loans: [],
      others: payrollData.deductions.others,
      totalDeductions: payrollData.deductions.totalDeductions,
    },
    totals: {
      grossEarnings: payrollData.totals.grossEarnings,
      totalDeductions: payrollData.totals.totalDeductions,
      netPay: payrollData.totals.netPay,
    },
    status: payrollData.status,
    processedAt: payrollData.processedDate || new Date().toISOString(),
  };
};
