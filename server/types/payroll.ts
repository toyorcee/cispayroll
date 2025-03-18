import { Types } from "mongoose";
import { UserDocument } from "../models/User.js";

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

// Unified Interfaces
export interface IAllowance {
  type: AllowanceType;
  percentage?: number;
  amount: number;
  description?: string;
}

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
  _id?: Types.ObjectId;
  employee: Types.ObjectId;
  department: Types.ObjectId;
  periodMonth: number;
  periodYear: number;
  basicSalary: number;
  allowances: IAllowance[];
  deductions: IDeduction[];
  bonuses: IBonus[];
  overtime?: IOvertime;
  grossAmount: number;
  netAmount: number;
  status: PayrollStatus;
  paymentDetails: IBankDetails;
  paymentStatus: "pending" | "paid" | "failed";
  paymentDate?: Date;
  paymentReference?: string;
  processedBy: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  paidAt?: Date;
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
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  role: string;
  department: IDepartment;
  bankDetails?: IBankDetails;
  salary?: number;
  allowances?: PayrollAllowances;
  deductions?: PayrollDeductions;
  status: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollCalculation {
  basicSalary: number;
  allowances: PayrollAllowances;
  totalAllowances: number;
  grossSalary: number;
  deductions: PayrollDeductions;
  totalDeductions: number;
  netSalary: number;
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
    calculations: PayrollCalculation;
  }>;
  errors: BulkPayrollError[];
}
