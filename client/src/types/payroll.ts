// Enums
export enum PayrollStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  PAID = "PAID",
  CANCELLED = "CANCELLED",
}

export enum AllowanceType {
  HOUSING = "housing",
  TRANSPORT = "transport",
  MEAL = "meal",
  HAZARD = "hazard",
  OTHER = "other",
}

export enum DeductionType {
  TAX = "tax",
  PENSION = "pension",
  NHF = "nhf",
  LOAN = "loan",
  UNION_DUES = "unionDues",
  OTHER = "other",
}

export enum BonusType {
  PERFORMANCE = "performance",
  THIRTEENTH_MONTH = "thirteenth_month",
  SPECIAL = "special",
  ACHIEVEMENT = "achievement",
  RETENTION = "retention",
  PROJECT = "project",
}

export enum PayrollFrequency {
  DAILY = "daily",
  WEEKLY = "weekly",
  BI_WEEKLY = "bi-weekly",
  SEMI_MONTHLY = "semi-monthly",
  MONTHLY = "monthly",
  YEARLY = "yearly",
}

// Interfaces
export interface IDeduction {
  type: DeductionType;
  percentage?: number;
  amount: number;
  description?: string;
}

export interface IBonus {
  _id: string;
  employee: string;
  type: BonusType;
  amount: number;
  description?: string;
  frequency: PayrollFrequency;
  paymentDate: Date;
  effectiveDate: Date;
  expiryDate?: Date;
  approvalStatus: "pending" | "approved" | "rejected";
  approvedBy?: string;
  approvedAt?: Date;
  department?: string;
  gradeLevel?: string;
  taxable: boolean;
  active: boolean;
}

export interface IOvertime {
  hours: number;
  rate: number;
  amount: number;
  description?: string;
}

export interface IBankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
  ippisNumber?: string;
  tsaReference?: string;
}

export interface ISalaryComponent {
  name: string;
  type: "allowance" | "deduction";
  calculationMethod: "fixed" | "percentage";
  value: number;
  isActive: boolean;
  description?: string;
}

export interface IPayrollAllowance {
  name: string;
  type: string;
  value: number;
  amount: number;
}

export interface IBonusFilters {
  employee?: string;
  department?: string;
  approvalStatus?: string;
  type?: BonusType;
  active?: boolean;
}

export interface IAllowanceFilters {
  active?: boolean;
  department?: string;
  gradeLevel?: string;
  employee?: string;
}

export interface IPayrollComponent {
  name: string;
  type: "fixed" | "percentage";
  value: number;
  amount: number;
  componentId: string;
}

export interface IPayrollCalculationResult {
  employee: {
    _id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
  };
  department: string;
  salaryGrade: string;
  month: number;
  year: number;
  periodStart: Date;
  periodEnd: Date;
  basicSalary: number;
  components: ISalaryComponent[];
  allowances: {
    gradeAllowances: Array<{
      name: string;
      type: string;
      value: number;
      amount: number;
    }>;
    additionalAllowances: Array<{
      name: string;
      amount: number;
    }>;
    totalAllowances: number;
  };
  bonuses: {
    items: Array<{
      type: string;
      description: string;
      amount: number;
    }>;
    totalBonuses: number;
  };
  earnings: {
    overtime: IOvertime;
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
    loans: Array<{
      description: string;
      amount: number;
    }>;
    others: Array<{
      description: string;
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
  status: PayrollStatus;
  frequency: PayrollFrequency;
}

export interface IPayroll {
  _id: string;
  employee: string;
  department: string;
  salaryGrade: string;
  payPeriod: {
    type: PayrollFrequency;
    startDate: Date;
    endDate: Date;
    month: number;
    year: number;
  };
  basicSalary: number;
  components: IPayrollComponent[];
  earnings: {
    overtime: IOvertime;
    bonus: Array<{
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
    loans: Array<{
      loanId: string;
      description: string;
      amount: number;
    }>;
    others: Array<{
      description: string;
      amount: number;
    }>;
    totalDeductions: number;
  };
  totals: {
    grossEarnings: number;
    totalDeductions: number;
    netPay: number;
  };
  status: PayrollStatus;
  payment: IBankDetails;
  processedBy?: string;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISalaryGrade {
  _id: string;
  level: string;
  basicSalary: number;
  components: ISalaryComponent[];
  description?: string;
  isActive: boolean;
  department?: string;
  departmentName?: string;
  createdAt: Date;
  updatedAt: Date;
}

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
