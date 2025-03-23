// Import types from backend
import type {
  PayrollStatus,
  AllowanceType,
  DeductionType,
  BonusType,
  IDeduction,
  IBonus,
  IOvertime,
  IBankDetails,
  ISalaryComponent,
  IPayrollAllowance,
  IBonusFilters,
  IAllowanceFilters,
  IPayrollCalculationResult,
  PayrollCalculationRequest,
  IPayrollComponent,
} from "../../../types/payroll";

import type { IPayroll } from "../../../models/Payroll";

// Re-export all types
export type {
  PayrollStatus,
  AllowanceType,
  DeductionType,
  BonusType,
  IDeduction,
  IBonus,
  IOvertime,
  IBankDetails,
  IPayroll,
  ISalaryComponent,
  IPayrollAllowance,
  IBonusFilters,
  IAllowanceFilters,
  IPayrollCalculationResult,
  PayrollCalculationRequest,
  IPayrollComponent,
};

export interface PayrollPeriod {
  id: string;
  month: number;
  year: number;
  totalEmployees?: number;
  totalNetSalary?: number;
  status: PayrollStatus;
  processedDate?: Date;
  processedBy?: string;
}
