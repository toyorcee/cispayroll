// Import types from backend
import type {
  AllowanceType,
  DeductionType,
  BonusType,
  IDeduction,
  IBonus,
  IOvertime,
  IBankDetails,
  ISalaryComponent,
  IPayrollAllowance,
  IBonusFilters,
  IAllowanceFilters,
  IPayrollCalculationResult,
  IPayrollComponent,
} from "../../../types/payroll";

import { PayrollStatus } from "../../../types/payroll";

import type { IPayroll } from "../../../models/Payroll";
import type { ISalaryGrade } from "../../../models/SalaryStructure";

// Re-export the enum as a value
export { PayrollStatus };

// Re-export types
export type {
  AllowanceType,
  DeductionType,
  BonusType,
  IDeduction,
  IBonus,
  IOvertime,
  IBankDetails,
  IPayroll,
  ISalaryComponent,
  IPayrollAllowance,
  IBonusFilters,
  IAllowanceFilters,
  IPayrollCalculationResult,
  IPayrollComponent,
  ISalaryGrade,
};

export interface PayrollPeriod {
  _id: string;
  month: number;
  year: number;
  status: PayrollStatus;
  totalNetSalary?: number;
  totalEmployees?: number;
  processedDate?: string;
  employee?: string;
}

// Add PayrollStats interface for the summary data
export interface PayrollStats {
  totalNetSalary: number;
  totalEmployees: number;
  pendingReviews: number;
}

export interface PayrollData {
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
    additionalAllowances: any[];
    totalAllowances: number;
  };
  basicSalary: number;
  month: number;
  year: number;
  status: string;
  createdAt: string;
}

// Keep only one definition of PayrollCalculationRequest
export interface PayrollCalculationRequest {
  employee: string;
  salaryGrade: string;
  month: number;
  year: number;
}

export interface PeriodPayrollResponse {
  period: {
    month: number;
    year: number;
    monthName: string;
  };
  employees: Array<{
    id: string;
    employee: {
      id: string;
      name: string;
      employeeId: string;
    };
    department: string;
    salaryGrade: {
      level: string;
      description: string;
    };
    payroll: {
      basicSalary: number;
      totalAllowances: number;
      totalDeductions: number;
      netPay: number;
    };
    status: PayrollStatus;
    processedAt: string;
  }>;
  summary: {
    totalEmployees: number;
    totalNetPay: number;
    totalBasicSalary: number;
    totalAllowances: number;
    totalDeductions: number;
    statusBreakdown: Record<PayrollStatus, number>;
  };
}

// Add this interface to your types/payroll.ts
export interface Payslip {
  id: string;
  employeeId: string;
  employeeName: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: Array<{
    type: string;
    amount: number;
  }>;
  deductions: Array<{
    type: string;
    amount: number;
  }>;
  netPay: number;
  status: PayrollStatus;
  paymentDate: Date;
  createdAt: string;
}
