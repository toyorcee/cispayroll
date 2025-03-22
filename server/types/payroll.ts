import { Types } from "mongoose";
import { IAllowance } from "../models/Allowance.js";

// Unified Status Enums
export enum PayrollStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  APPROVED = "approved",
  REJECTED = "rejected",
  PAID = "paid",
  CANCELLED = "cancelled",
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
  THIRTEENTH_MONTH = "thirteenthMonth",
  OTHER = "other",
}

export enum PayPeriod {
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  BI_MONTHLY = "bi-monthly",
  DAILY = "daily",
  YEARLY = "yearly",
}

export interface PayPeriodRange {
  type: PayPeriod;
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

export interface IBonus {
  type: BonusType;
  amount: number;
  description?: string;
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
    type: PayPeriod;
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
