import { PayrollData, Payslip } from "../types/payroll";

export const mapToPayslip = (payrollData: PayrollData): Payslip => {
  return {
    payslipId: payrollData._id,
    employee: {
      name: payrollData.employee.fullName,
      employeeId: payrollData.employee.employeeId,
      department: payrollData.department.name,
      salaryGrade: payrollData.salaryGrade.level,
    },
    paymentDetails: payrollData.payment,
    period: {
      startDate: payrollData.periodStart,
      endDate: payrollData.periodEnd,
      frequency: "monthly",
      year: payrollData.year,
      month: payrollData.month,
    },
    status: payrollData.status,
    earnings: {
      basicSalary: payrollData.basicSalary,
      allowances: {
        gradeAllowances: payrollData.allowances.gradeAllowances,
        totalAllowances: payrollData.allowances.totalAllowances,
      },
      overtime: payrollData.earnings.overtime,
    },
    deductions: {
      tax: {
        taxRate: payrollData.deductions.tax.taxRate,
        amount: payrollData.deductions.tax.amount,
      },
      pension: {
        rate: payrollData.deductions.pension.rate,
        amount: payrollData.deductions.pension.amount,
      },
      nhf: {
        rate: payrollData.deductions.nhf.rate,
        amount: payrollData.deductions.nhf.amount,
      },
      others: payrollData.deductions.others,
      totalDeductions: payrollData.deductions.totalDeductions,
    },
    totals: {
      grossEarnings: payrollData.totals.grossEarnings,
      netPay: payrollData.totals.netPay,
    },
    approvalFlow: {
      submittedBy: {
        name: payrollData.approvalFlow.submittedBy || "Not submitted",
      },
      submittedAt: payrollData.approvalFlow.submittedAt || "",
      approvedBy: {
        name: payrollData.approvalFlow.approvedBy || "Not approved",
      },
      approvedAt: payrollData.approvalFlow.approvedAt || "",
      remarks: payrollData.approvalFlow.remarks || "",
    },
    timestamps: {
      createdAt: payrollData.createdAt,
    },
  };
};
