// Import types from backend
import type {
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

import { PayrollStatus } from "../../../types/payroll";

import type { IPayroll } from "../../../models/Payroll";
import type { ISalaryGrade } from "../../../models/SalaryStructure";

// Re-export the enum as a value
export { PayrollStatus };

// Re-export types
export type {
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
  ISalaryGrade,
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
  complianceChecks?: {
    payeCalculated: boolean;
    pensionDeducted: boolean;
    nhfDeducted: boolean;
    taxReportGenerated: boolean;
  };
}

// Add PayrollStats interface for the summary data
export interface PayrollStats {
  totalEmployees: number;
  totalNetSalary: number;
  pendingReviews: number;
  departmentBreakdown?: {
    [department: string]: {
      employees: number;
      totalCost: number;
    };
  };
}
