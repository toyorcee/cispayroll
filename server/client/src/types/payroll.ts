// Import and re-export all types from the backend
import type {
  PayrollStatus,
  AllowanceType,
  DeductionType,
  BonusType,
  IAllowance,
  IDeduction,
  IBonus,
  IOvertime,
  IBankDetails,
} from "../../../types/payroll";

import type { IPayroll } from "../../../models/Payroll";

export type {
  PayrollStatus,
  AllowanceType,
  DeductionType,
  BonusType,
  IAllowance,
  IDeduction,
  IBonus,
  IOvertime,
  IBankDetails,
  IPayroll,
};

export interface PayrollPeriod {
  id: string;
  month: number;
  year: number;
  totalEmployees?: number;
  totalNetSalary?: number;
  status: "draft" | "processing" | "approved" | "paid";
  processedDate?: Date;
  processedBy?: string;
}
