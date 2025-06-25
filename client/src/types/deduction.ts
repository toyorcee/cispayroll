export enum DeductionType {
  STATUTORY = "STATUTORY",
  VOLUNTARY = "VOLUNTARY",
}

export enum CalculationMethod {
  FIXED = "FIXED",
  PERCENTAGE = "PERCENTAGE",
  PROGRESSIVE = "PROGRESSIVE",
}

export enum DeductionScope {
  COMPANY_WIDE = "company_wide",
  DEPARTMENT = "department",
  INDIVIDUAL = "individual",
}

export enum DeductionCategory {
  TAX = "tax",
  PENSION = "pension",
  HOUSING = "housing",
  LOAN = "loan",
  TRANSPORT = "transport",
  COOPERATIVE = "cooperative",
  INSURANCE = "insurance",
  ASSOCIATION = "association",
  SAVINGS = "savings",
  GENERAL = "general",
  OTHER = "other",
}

export interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
}

export interface Deduction {
  _id: string;
  name: string;
  type: DeductionType;
  description?: string;
  calculationMethod: CalculationMethod;
  value: number;
  taxBrackets?: TaxBracket[];
  isActive: boolean;
  scope: DeductionScope;
  department?: string;
  assignedEmployees?: string[];
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  effectiveDate?: string;
  category?: DeductionCategory;
}

export interface DeductionPreference {
  deduction: string;
  opted: boolean;
  startDate: string;
  endDate?: string;
  optedAt: string;
  optedBy: string;
  amount?: number;
  percentage?: number;
  notes?: string;
}

export interface UserDeductionPreferences {
  statutory: {
    standardStatutory: DeductionPreference[];
    customStatutory: DeductionPreference[];
  };
  voluntary: {
    standardVoluntary: DeductionPreference[];
    customVoluntary: DeductionPreference[];
  };
}

export interface DeductionResponse {
  statutory: Deduction[];
  voluntary: Deduction[];
  departmentSpecific?: Deduction[];
}

export type CreateDeductionInput = {
  name: string;
  description?: string;
  calculationMethod: CalculationMethod;
  value: number;
  taxBrackets?: TaxBracket[];
  isActive: boolean;
  effectiveDate: Date;
  category: DeductionCategory;
  scope: DeductionScope;
  type: "statutory" | "voluntary";
  department?: string;
  assignedEmployees?: string[];
};

export type UpdateDeductionInput = {
  name?: string;
  description?: string;
  calculationMethod?: CalculationMethod;
  value?: number;
  taxBrackets?: TaxBracket[];
  isActive?: boolean;
  effectiveDate?: Date;
  category?: DeductionCategory;
  scope?: DeductionScope;
  type: "statutory" | "voluntary";
  department?: string;
  assignedEmployees?: string[];
};
