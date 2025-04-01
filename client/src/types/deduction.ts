export enum DeductionType {
  STATUTORY = "statutory",
  VOLUNTARY = "voluntary",
}

export enum CalculationMethod {
  FIXED = "fixed",
  PERCENTAGE = "percentage",
  PROGRESSIVE = "progressive",
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
  GENERAL = "general",
}

export enum DeductionApplicability {
  GLOBAL = "global",
  INDIVIDUAL = "individual",
}

export interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
}

export interface Deduction {
  _id: string;
  name: string;
  type: "statutory" | "voluntary";
  description?: string;
  calculationMethod: CalculationMethod;
  value: number;
  taxBrackets?: TaxBracket[];
  isActive: boolean;
  effectiveDate: Date;
  isCustom: boolean;
  category: DeductionCategory;
  scope: DeductionScope;
  createdBy: string;
  updatedBy: string;
  applicability: DeductionApplicability;
  assignedEmployees?: string[];
  assignmentHistory: any[];
  createdAt: Date;
  updatedAt: Date;
  assignedEmployeesCount: number;
}

export type CreateDeductionInput = {
  name: string;
  description?: string;
  calculationMethod: CalculationMethod;
  value: number;
  taxBrackets?: TaxBracket[];
  isActive: boolean;
  effectiveDate: Date;
  isCustom: boolean;
  category: DeductionCategory;
  scope: DeductionScope;
  applicability: DeductionApplicability;
  type: "statutory" | "voluntary";
};

export interface DeductionsResponse {
  success: boolean;
  data: {
    statutory: Deduction[];
    voluntary: Deduction[];
  };
}

export type UpdateDeductionInput = {
  name?: string;
  description?: string;
  calculationMethod?: CalculationMethod;
  value?: number;
  taxBrackets?: TaxBracket[];
  isActive?: boolean;
  effectiveDate?: Date;
  isCustom?: boolean;
  category?: DeductionCategory;
  scope?: DeductionScope;
  applicability?: DeductionApplicability;
  type: "statutory" | "voluntary";
};
