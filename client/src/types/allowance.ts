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
  employee: string;
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
  department: string;
  priority: number;
  performanceRating?: number;
  createdBy: string;
  updatedBy: string;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
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
