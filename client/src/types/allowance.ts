export enum AllowanceType {
  TRANSPORT = "TRANSPORT",
  HOUSING = "HOUSING",
  MEAL = "MEAL",
  MEDICAL = "MEDICAL",
  OTHER = "OTHER",
}

export enum CalculationMethod {
  FIXED = "fixed",
  PERCENTAGE = "percentage",
}

export enum PayrollFrequency {
  WEEKLY = "weekly",
  BIWEEKLY = "biweekly",
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  ANNUAL = "annual",
}

export enum AllowanceStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum AllowancePriority {
  DEPARTMENT = 1,
  GRADE = 2,
  INDIVIDUAL = 3,
}

export interface AllowanceEmployee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  fullName: string;
  id: string;
}

export interface AllowanceDepartment {
  _id: string;
  name: string;
}

export interface Allowance {
  _id: string;
  employee: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    fullName: string;
  };
  type: string;
  amount: number;
  reason: string;
  paymentDate: string;
  department: {
    _id: string;
    name: string;
  };
  createdBy: string;
  updatedBy: string;
  approvalStatus: string;
  approvedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    fullName: string;
  };
  approvedAt?: string;
  __v: number;
}

export interface CreateAllowanceRequest {
  name: string;
  type: AllowanceType;
  amount: number;
  description: string;
  calculationMethod: CalculationMethod;
  baseAmount?: number;
  frequency: PayrollFrequency;
  taxable?: boolean;
  effectiveDate: Date;
  expiryDate?: Date;
  salaryGrade?: string;
  scope: "department" | "grade" | "individual";
  department: string;
  performanceRating?: number;
  employee: string;
}

export interface AllowancesListResponse {
  success: boolean;
  message: string;
  data: {
    allowances: Allowance[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}
