export enum DeductionType {
  STATUTORY = "statutory",
  VOLUNTARY = "voluntary",
}

export enum CalculationMethod {
  FIXED = "fixed",
  PERCENTAGE = "percentage",
  PROGRESSIVE = "progressive",
}

export interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
  _id?: string;
}

export interface CreateVoluntaryDeductionInput {
  name: string;
  description?: string;
  calculationMethod: CalculationMethod;
  value: number;
  effectiveDate?: Date;
}

export interface Deduction {
  _id: string;
  name: string;
  description?: string;
  type: DeductionType;
  calculationMethod: CalculationMethod;
  value: number;
  isActive: boolean;
  effectiveDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  taxBrackets?: TaxBracket[];
  createdBy?: string;
  updatedBy?: string;
}

export interface DeductionsResponse {
  success: boolean;
  data: {
    statutory: Deduction[];
    voluntary: Deduction[];
  };
}
