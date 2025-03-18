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
