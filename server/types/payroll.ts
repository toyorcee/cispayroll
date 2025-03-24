import { Types } from "mongoose";

// Unified Status Enums
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

export interface PayPeriodRange {
  type: PayrollFrequency;
  startDate: Date;
  endDate: Date;
}

// Unified Interfaces
export interface IDeduction {
  type: DeductionType;
  percentage?: number;
  amount: number;
  description?: string;
}

export interface IBonus extends Document {
  _id: Types.ObjectId;
  employee: Types.ObjectId;
  type: BonusType;
  amount: number;
  description?: string;
  frequency: PayrollFrequency;
  paymentDate: Date;
  effectiveDate: Date;
  expiryDate?: Date;
  approvalStatus: "pending" | "approved" | "rejected";
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  department?: Types.ObjectId;
  gradeLevel?: string;
  taxable: boolean;
  active: boolean;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
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

// Main Payroll Interface
export interface IPayroll {
  _id: Types.ObjectId;
  employee: Types.ObjectId;
  department: Types.ObjectId;
  salaryGrade: Types.ObjectId;

  payPeriod: {
    type: PayrollFrequency;
    startDate: Date;
    endDate: Date;
    month: number;
    year: number;
  };

  basicSalary: number;

  components: Array<IPayrollComponent>;

  earnings: {
    overtime: {
      hours: number;
      rate: number;
      amount: number;
    };
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
      loanId: Types.ObjectId;
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
  approvalFlow: IApprovalFlow;
  payment: IPayrollPayment;

  processedBy?: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Populated Interfaces
export interface IPopulatedEmployee {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  employeeId: string;
  department?: string;
}

export interface IPopulatedPayroll extends Omit<IPayroll, "employee"> {
  employee: IPopulatedEmployee;
}

// Summary Interfaces
export interface IPayrollSummary {
  periodId: string;
  totalEmployees: number;
  totalBasicSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  totalNetSalary: number;
  totalTax: number;
  totalPension: number;
  totalNHF: number;
  totalOvertime?: number;
  totalBonuses?: number;
  departmentBreakdown?: {
    [department: string]: {
      employees: number;
      totalCost: number;
    };
  };
  complianceStatus: {
    payeSubmitted: boolean;
    pensionRemitted: boolean;
    nhfRemitted: boolean;
  };
}

export interface IPayrollPeriod {
  _id: string;
  periodMonth: number;
  periodYear: number;
  status: PayrollStatus;
  processedDate?: Date;
  approvedBy?: Types.ObjectId;
  approvedDate?: Date;
  totalEmployees?: number;
  totalBasicSalary?: number;
  totalAllowances?: number;
  totalDeductions?: number;
  totalNetSalary?: number;
  isThirteenthMonth?: boolean;
  complianceChecks: {
    payeCalculated: boolean;
    pensionDeducted: boolean;
    nhfDeducted: boolean;
    taxReportGenerated: boolean;
  };
}

export interface PayrollAllowances {
  housing: number;
  transport: number;
  meal: number;
  other: number;
}

export interface PayrollDeductions {
  tax?: number;
  pension: number;
  loan: number;
  other: number;
}

export interface IDepartment {
  _id: Types.ObjectId;
  name: string;
  code: string;
}

// Standalone interface without extending UserDocument
export interface IEmployee {
  _id: Types.ObjectId;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: IDepartment | string;
  gradeLevel: string;
  role: string;
  bankDetails?: IBankDetails;
  salary?: number;
  allowances?: PayrollAllowances;
  deductions?: PayrollDeductions;
  status: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollCalculationResult {
  basicSalary: number;
  components: {
    name: string;
    type: "fixed" | "percentage";
    amount: number;
  }[];
  earnings: {
    overtime: {
      hours: number;
      rate: number;
      amount: number;
    };
    bonus: {
      description: string;
      amount: number;
    }[];
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
    loans: {
      loanId: Types.ObjectId;
      description: string;
      amount: number;
    }[];
    others: {
      description: string;
      amount: number;
    }[];
    totalDeductions: number;
  };
  totals: {
    grossEarnings: number;
    totalDeductions: number;
    netPay: number;
  };
}

export interface BulkPayrollError {
  employee: Types.ObjectId;
  error: string;
}

export interface BulkPayrollResult {
  processed: number;
  failed: number;
  payrollResults: Array<{
    employeeData: IEmployee;
    calculations: PayrollCalculationResult;
  }>;
  errors: BulkPayrollError[];
}

export interface PayrollCalculationRequest {
  employee: Types.ObjectId | string;
  month: number;
  year: number;
  basicSalary: number;
  components?: {
    name: string;
    type: "fixed" | "percentage";
    amount: number; // Changed from value to amount
  }[];
  overtime?: {
    hours: number;
    rate: number;
  };
  bonus?: {
    description: string;
    amount: number;
  }[];
  // Add these fields to match what's being used
  salaryGrade?: string;
  department?: Types.ObjectId;
}

// Add new interfaces
export interface IPayrollComponent {
  name: string;
  type: "fixed" | "percentage";
  value: number;
  amount: number;
  componentId: Types.ObjectId;
}

export interface IPayrollPayment extends IBankDetails {
  paymentDate?: Date;
  transactionReference?: string;
}

export interface IApprovalFlow {
  submittedBy: Types.ObjectId;
  submittedAt: Date;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectedBy?: Types.ObjectId;
  rejectedAt?: Date;
  comments?: string;
}

// Add or update these interfaces
export interface IDepartmentFromDB {
  _id: Types.ObjectId;
  name: string;
  code: string;
}

export interface ISalaryComponent {
  name: string;
  type: "allowance" | "deduction";
  value: number;
  calculationMethod: "fixed" | "percentage";
  amount: number;
  isActive: boolean;
}

export interface ISalaryGradeDetails {
  basicSalary: number;
  components: ISalaryComponent[];
  additionalAllowances: IAdditionalAllowance[];
  totalAllowances: number;
  grossSalary: number;
}

interface IDeductionRule {
  _id: Types.ObjectId;
  name: string;
  type: "statutory" | "voluntary";
  value: number;
  calculationMethod: "fixed" | "percentage";
  isActive: boolean;
}

export interface IAllowanceFilters {
  active?: boolean;
  department?: Types.ObjectId;
  gradeLevel?: string;
  employee?: Types.ObjectId;
}

export interface ICalculatedComponent {
  name: string;
  type: "allowance" | "deduction";
  value: number;
  calculationMethod: "fixed" | "percentage";
  amount: number;
  isActive: boolean;
}

// Add BonusItem interface
export interface BonusItem {
  type: string;
  description: string;
  amount: number;
}

// Add IPayrollCalculationResult
export interface IPayrollCalculationResult {
  employee: IEmployee;
  department: Types.ObjectId;
  salaryGrade: Types.ObjectId;
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
    additionalAllowances: IAdditionalAllowance[];
    totalAllowances: number;
  };
  bonuses: {
    items: IPayrollBonus[];
    totalBonuses: number;
  };
  earnings: {
    overtime: IOvertime;
    bonus: BonusItem[];
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
  status: PayrollStatus;
  frequency: PayrollFrequency;
}

// Add these interfaces
export interface IPayrollBonus {
  type: string;
  description: string;
  amount: number;
}

export interface IAdditionalAllowance {
  name: string;
  amount: number;
}

// Add this interface with the bonus filters
export interface IBonusFilters {
  employee?: Types.ObjectId;
  department?: Types.ObjectId;
  approvalStatus?: string;
  type?: BonusType;
  active?: boolean;
}

export interface IPayrollAllowance {
  name: string;
  type: string;
  value: number;
  amount: number;
}

// Add these interfaces to your types file
export interface PopulatedEmployee {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  employeeId: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  department?: Types.ObjectId;
  salaryGrade?: Types.ObjectId;
}

export interface PopulatedDepartment {
  _id: Types.ObjectId;
  name: string;
  code: string;
}

export interface PopulatedSalaryGrade {
  _id: Types.ObjectId;
  level: string;
  description: string;
}

export interface PopulatedPayrollRecord {
  _id: Types.ObjectId;
  employee: {
    _id: Types.ObjectId;
    firstName: string;
    lastName: string;
    employeeId: string;
    bankDetails?: {
      bankName: string;
      accountNumber: string;
      accountName: string;
    };
  };
  department: {
    _id: Types.ObjectId;
    name: string;
    code: string;
  };
  salaryGrade: {
    _id: Types.ObjectId;
    level: string;
    description: string;
  };
  month: number;
  year: number;
  basicSalary: number;
  allowances: {
    gradeAllowances: Array<{
      name: string;
      type: string;
      value: number;
      amount: number;
    }>;
    additionalAllowances: Array<{
      name: string;
      type: string;
      value: number;
      amount: number;
      frequency: string;
    }>;
    totalAllowances: number;
  };
  earnings: {
    overtime: {
      hours: number;
      rate: number;
      amount: number;
    };
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
      description: string;
      amount: number;
    }>;
    others: Array<{
      description: string;
      amount: number;
    }>;
    totalDeductions: number;
  };
  bonuses: {
    items: Array<{
      type: string;
      description: string;
      amount: number;
    }>;
    totalBonuses: number;
  };
  totals: {
    basicSalary: number;
    totalAllowances: number;
    totalBonuses: number;
    grossEarnings: number;
    totalDeductions: number;
    netPay: number;
  };
  payment: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  status: PayrollStatus;
  createdAt: Date;
  updatedAt: Date;
}
