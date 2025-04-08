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
  COMPANY = "company",
  DEPARTMENT = "department",
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

export enum DeductionOptOutReason {
  PERSONAL_CHOICE = "personal_choice",
  ALTERNATIVE_PLAN = "alternative_plan",
  TEMPORARY_SUSPENSION = "temporary_suspension",
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
  description: string;
  calculationMethod: CalculationMethod;
  value: number;
  taxBrackets?: TaxBracket[];
  isActive: boolean;
  scope: DeductionScope;
  department?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  effectiveDate?: string;
  category?: DeductionCategory;
  applicability?: DeductionApplicability;
  isCustom?: boolean;
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
  optOutReason?: DeductionOptOutReason;
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
  isCustom: boolean;
  category: DeductionCategory;
  scope: DeductionScope;
  applicability: DeductionApplicability;
  type: "statutory" | "voluntary";
};

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
