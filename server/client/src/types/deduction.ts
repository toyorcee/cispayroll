export enum DeductionType {
  STATUTORY = "STATUTORY",
  VOLUNTARY = "VOLUNTARY",
}

export enum CalculationMethod {
  FIXED = "FIXED",
  PERCENTAGE = "PERCENTAGE",
}

export interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
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
  type: DeductionType;
  description?: string;
  calculationMethod: CalculationMethod;
  value: number;
  taxBrackets?: TaxBracket[];
  isActive: boolean;
  effectiveDate?: Date;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}
