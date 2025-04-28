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
  name: string;
  type: AllowanceType;
  amount: number;
  description: string;
  status: AllowanceStatus;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  documents?: Array<{
    name: string;
    url: string;
    uploadedAt: Date;
  }>;
  month: number;
  year: number;
  employee: AllowanceEmployee;
  calculationMethod: CalculationMethod;
  baseAmount?: number;
  frequency: PayrollFrequency;
  taxable: boolean;
  isActive: boolean;
  effectiveDate: string;
  expiryDate?: Date;
  salaryGrade: {
    _id: string;
    level: string;
    basicSalary: number;
  };
  scope: "department" | "grade" | "individual";
  department: AllowanceDepartment;
  priority: number;
  performanceRating?: number;
  createdBy: string;
  updatedBy: string;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
  approvalStatus: string;
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
