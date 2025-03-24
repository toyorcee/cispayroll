import { Types } from "mongoose";
import { ApiError } from "../utils/errorHandler.js";
import UserModel from "../models/User.js";
import PayrollModel from "../models/Payroll.js";
import SalaryGrade from "../models/SalaryStructure.js";
import { DeductionService } from "./DeductionService.js";
import { AllowanceService } from "./AllowanceService.js";
import { BonusService } from "./BonusService.js";
import {
  IEmployee,
  IDepartment,
  PayrollStatus,
  PayrollFrequency,
  IPayrollCalculationResult,
  ISalaryGradeDetails,
  IPayrollBonus,
  IAdditionalAllowance,
  BonusItem,
  IBonusFilters,
  IAllowanceFilters,
  ISalaryComponent,
} from "../types/payroll.js";
import { IAllowance } from "../models/Allowance.js";

interface StatutoryDeductions {
  paye: number;
  pension: number;
  nhf: number;
  total: number;
}

interface DeductionCalculation {
  statutory: StatutoryDeductions;
  voluntary: number;
  total: number;
}

interface BonusCalculation {
  items: BonusItem[];
  totalBonuses: number;
}

interface EmployeePayrollHistory {
  _id: Types.ObjectId;
  employee: {
    _id: Types.ObjectId;
    firstName: string;
    lastName: string;
    employeeId: string;
  };
  department: {
    _id: Types.ObjectId;
    name: string;
    code: string;
  };
  salaryGrade: {
    _id: Types.ObjectId;
    level: string;
    description: string;
  };
  month: number;
  year: number;
  totals: {
    basicSalary: number;
    totalAllowances: number;
    totalBonuses: number;
    grossEarnings: number;
    totalDeductions: number;
    netPay: number;
  };
  status: PayrollStatus;
  createdAt: Date;
}

const asObjectId = (id: string): Types.ObjectId => new Types.ObjectId(id);

interface RawPayrollDocument {
  _id: Types.ObjectId;
  employee: {
    _id: Types.ObjectId;
    firstName: string;
    lastName: string;
    employeeId: string;
  };
  department: {
    _id: Types.ObjectId;
    name: string;
    code: string;
  };
  salaryGrade: {
    _id: Types.ObjectId;
    level: string;
    description: string;
  };
  month: number;
  year: number;
  totals: {
    basicSalary: number;
    totalAllowances: number;
    totalBonuses: number;
    grossEarnings: number;
    totalDeductions: number;
    netPay: number;
  };
  status: PayrollStatus;
  createdAt: Date;
}

export class PayrollService {
  static async validateAndGetEmployee(
    employeeId: string | Types.ObjectId
  ): Promise<IEmployee> {
    console.log("🔍 Validating employee:", employeeId);

    const employee = await UserModel.findById(employeeId).lean();

    if (!employee) {
      throw new ApiError(400, "Employee not found");
    }

    if (!employee.department) {
      throw new ApiError(400, "Employee must be assigned to a department");
    }

    // Create department object if it's a string
    const departmentInfo: IDepartment =
      typeof employee.department === "string"
        ? {
            _id: new Types.ObjectId(),
            name: employee.department,
            code: employee.department,
          }
        : (employee.department as IDepartment);

    return {
      ...employee,
      department: departmentInfo,
      gradeLevel: employee.gradeLevel?.toString() || "",
    } as IEmployee;
  }

  static async checkExistingPayroll(
    employeeId: string | Types.ObjectId,
    month: number,
    year: number
  ) {
    console.log("🔍 Checking for existing payroll:", {
      employeeId,
      month,
      year,
    });

    const existing = await PayrollModel.findOne({
      employee: employeeId,
      "payPeriod.month": month,
      "payPeriod.year": year,
    });

    if (existing) {
      throw new ApiError(400, "Payroll record already exists for this period");
    }

    return false;
  }

  static calculatePayPeriod(month: number, year: number) {
    console.log("📅 Calculating pay period for:", { month, year });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return {
      type: PayrollFrequency.MONTHLY,
      startDate,
      endDate,
      month,
      year,
    };
  }

  private static calculateAllowanceAmount(
    allowance: IAllowance,
    basicSalary: number
  ): number {
    if (allowance.calculationMethod === "percentage") {
      const base = allowance.baseAmount || basicSalary;
      return (base * allowance.value) / 100;
    }
    return allowance.value;
  }

  static async calculateSalaryComponents(
    salaryGradeId: Types.ObjectId,
    employeeId: Types.ObjectId
  ): Promise<ISalaryGradeDetails> {
    console.log("🧮 Calculating salary components for grade:", salaryGradeId);

    const salaryGrade = await SalaryGrade.findById(salaryGradeId);
    if (!salaryGrade) {
      throw new ApiError(404, "Salary grade not found");
    }

    // Define standard allowances with correct types
    const standardAllowances: ISalaryComponent[] = [
      {
        name: "Housing Allowance",
        type: "allowance",
        value: 25,
        calculationMethod: "percentage",
        amount: (salaryGrade.basicSalary * 25) / 100,
        isActive: true,
      },
      {
        name: "Transport Allowance",
        type: "allowance",
        value: 60000,
        calculationMethod: "fixed",
        amount: 60000,
        isActive: true,
      },
      {
        name: "Medical Allowance",
        type: "allowance",
        value: 40000,
        calculationMethod: "fixed",
        amount: 40000,
        isActive: true,
      },
    ];

    // Calculate totals
    const totalAllowances = standardAllowances.reduce(
      (sum, a) => sum + a.amount,
      0
    );

    return {
      basicSalary: salaryGrade.basicSalary,
      components: standardAllowances, // This is now correctly typed as ISalaryComponent[]
      additionalAllowances: [],
      totalAllowances,
      grossSalary: salaryGrade.basicSalary + totalAllowances,
    };
  }

  static async calculateDeductions(
    basicSalary: number,
    grossSalary: number
  ): Promise<DeductionCalculation> {
    console.log("🧮 Calculating deductions for salary:", {
      basicSalary,
      grossSalary,
    });

    // Get all active deductions
    const deductions = await DeductionService.getActiveDeductions();

    // 1. Calculate Statutory Deductions
    const paye = this.calculatePAYE(grossSalary); // Progressive tax calculation
    const pension = basicSalary * 0.08; // 8% of basic salary
    const nhf = basicSalary * 0.025; // 2.5% of basic salary

    const statutoryTotal = paye + pension + nhf;

    // 2. Calculate Voluntary Deductions
    const voluntaryDeductions = deductions.voluntary
      .filter((d) => d.isActive)
      .reduce((total, deduction) => {
        const amount =
          deduction.calculationMethod === "percentage"
            ? (basicSalary * deduction.value) / 100
            : deduction.value;
        return total + amount;
      }, 0);

    return {
      statutory: {
        paye,
        pension,
        nhf,
        total: statutoryTotal,
      },
      voluntary: voluntaryDeductions,
      total: statutoryTotal + voluntaryDeductions,
    };
  }

  // Add PAYE calculation method
  private static calculatePAYE(grossSalary: number): number {
    console.log(
      `\nCalculating PAYE for salary: ₦${grossSalary.toLocaleString()}`
    );

    const brackets = [
      { min: 0, max: 300000, rate: 7 }, // First 300,000
      { min: 300001, max: 600000, rate: 11 }, // Next 299,999
      { min: 600001, max: 1100000, rate: 15 }, // Next 499,999
      { min: 1100001, max: 1600000, rate: 19 }, // Next 499,999
      { min: 1600001, max: 3200000, rate: 21 }, // Next 1,599,999
      { min: 3200001, max: Number.MAX_SAFE_INTEGER, rate: 24 },
    ];

    let totalTax = 0;
    let remainingSalary = grossSalary;

    for (const bracket of brackets) {
      if (remainingSalary <= 0) break;

      // Calculate exact amount that falls in this bracket
      const bracketSize =
        bracket.min === 0 ? bracket.max : bracket.max - bracket.min + 1;

      const amountInBracket = Math.min(remainingSalary, bracketSize);
      const tax = (amountInBracket * bracket.rate) / 100;

      console.log(
        `Bracket ₦${bracket.min.toLocaleString()} - ₦${bracket.max.toLocaleString()}:`
      );
      console.log(
        `  Amount taxed in this bracket: ₦${amountInBracket.toLocaleString()}`
      );
      console.log(`  Rate: ${bracket.rate}%`);
      console.log(`  Tax: ₦${tax.toLocaleString()}\n`);

      totalTax += tax;
      remainingSalary -= amountInBracket;
    }

    return totalTax;
  }

  static async calculateBonuses(
    employeeId: Types.ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<BonusCalculation> {
    try {
      // Get individual bonuses for the employee
      const filters: IBonusFilters = {
        employee: employeeId,
        approvalStatus: "approved",
        active: true,
      };

      let bonuses = await BonusService.getAllBonuses(filters);

      // If no bonuses found, return empty result
      if (!bonuses || !Array.isArray(bonuses) || bonuses.length === 0) {
        console.log("No bonuses found for employee:", employeeId);
        return {
          items: [],
          totalBonuses: 0,
        };
      }

      // Filter valid bonuses for the current period
      const periodBonuses = bonuses.filter((bonus) => {
        // Basic validation
        if (!bonus || !bonus.paymentDate) {
          console.log("Invalid bonus record:", bonus);
          return false;
        }

        // Check if bonus is valid for the current period
        const bonusDate = new Date(bonus.paymentDate);
        const isInPeriod = bonusDate >= startDate && bonusDate <= endDate;

        if (!isInPeriod) {
          console.log(`Bonus ${bonus._id} not in current period`);
          return false;
        }

        return true;
      });

      if (periodBonuses.length === 0) {
        console.log("No valid bonuses found for the period");
        return {
          items: [],
          totalBonuses: 0,
        };
      }

      // Calculate bonus amounts
      const items: BonusItem[] = periodBonuses.map((bonus) => {
        // Ensure we have the required fields
        if (!bonus.amount || !bonus.type) {
          console.log("Missing required bonus fields:", bonus);
          return {
            type: "unknown",
            description: "Invalid bonus record",
            amount: 0,
          };
        }

        return {
          type: bonus.type,
          description: bonus.description || bonus.type,
          amount: bonus.amount, // Use the direct amount since it's already per period
        };
      });

      // Calculate total bonuses
      const totalBonuses = items.reduce((sum, item) => sum + item.amount, 0);

      console.log(`Calculated ${items.length} bonuses, total: ${totalBonuses}`);

      return {
        items,
        totalBonuses,
      };
    } catch (error) {
      console.error("Error calculating bonuses:", error);
      // Return safe default values in case of error
      return {
        items: [],
        totalBonuses: 0,
      };
    }
  }

  // Update the frequency adjustment helper
  private static adjustAmountByFrequency(
    amount: number,
    frequency: PayrollFrequency,
    targetFrequency: PayrollFrequency = PayrollFrequency.MONTHLY
  ): number {
    const monthlyAmount = (() => {
      switch (frequency) {
        case PayrollFrequency.YEARLY:
          return amount / 12;
        case PayrollFrequency.SEMI_MONTHLY:
          return amount * 2;
        case PayrollFrequency.BI_WEEKLY:
          return amount * 2.167; // 26 pay periods / 12 months
        case PayrollFrequency.WEEKLY:
          return amount * 4.333; // 52 weeks / 12 months
        case PayrollFrequency.DAILY:
          return amount * 21.75; // Average working days per month
        default:
          return amount;
      }
    })();

    // Convert monthly amount to target frequency
    switch (targetFrequency) {
      case PayrollFrequency.YEARLY:
        return monthlyAmount * 12;
      case PayrollFrequency.SEMI_MONTHLY:
        return monthlyAmount / 2;
      case PayrollFrequency.BI_WEEKLY:
        return monthlyAmount / 2.167;
      case PayrollFrequency.WEEKLY:
        return monthlyAmount / 4.333;
      case PayrollFrequency.DAILY:
        return monthlyAmount / 21.75;
      default:
        return monthlyAmount;
    }
  }

  // Add this method to validate the payroll data before saving
  private static validatePayrollData(
    payrollData: IPayrollCalculationResult
  ): void {
    // Validate allowances
    const { gradeAllowances } = payrollData.allowances;

    if (!Array.isArray(gradeAllowances)) {
      throw new ApiError(400, "Grade allowances must be an array");
    }

    gradeAllowances.forEach((allowance, index) => {
      if (!allowance.type) {
        throw new ApiError(400, `Allowance at index ${index} missing type`);
      }
      if (typeof allowance.value !== "number") {
        throw new ApiError(400, `Allowance at index ${index} missing value`);
      }
      if (!allowance.name) {
        throw new ApiError(400, `Allowance at index ${index} missing name`);
      }
      if (typeof allowance.amount !== "number") {
        throw new ApiError(400, `Allowance at index ${index} missing amount`);
      }
    });
  }

  static async calculatePayroll(
    employeeId: Types.ObjectId,
    salaryGradeId: Types.ObjectId,
    month: number,
    year: number
  ): Promise<IPayrollCalculationResult> {
    console.log("📊 Calculating payroll for:", {
      employeeId,
      salaryGradeId,
      month,
      year,
    });

    // Get employee details
    const employee = await this.validateAndGetEmployee(employeeId);

    // Calculate salary components (includes allowances)
    const salaryDetails = await this.calculateSalaryComponents(
      salaryGradeId,
      employeeId
    );

    // Calculate deductions based on salary and allowances
    const deductionDetails = await this.calculateDeductions(
      salaryDetails.basicSalary,
      salaryDetails.grossSalary
    );

    // Get bonuses for the period
    const { startDate, endDate } = this.calculatePayPeriod(month, year);
    const bonuses = await this.calculateBonuses(employeeId, startDate, endDate);

    // Final calculations
    const grossSalary = salaryDetails.grossSalary + bonuses.totalBonuses;
    const netSalary = grossSalary - deductionDetails.total;

    // Return the complete payroll object matching your model structure
    const payrollData = {
      employee,
      department:
        typeof employee.department === "string"
          ? new Types.ObjectId(employee.department)
          : employee.department._id,
      salaryGrade: salaryGradeId,
      month,
      year,
      periodStart: startDate,
      periodEnd: endDate,
      basicSalary: salaryDetails.basicSalary,
      components: salaryDetails.components.map((c) => ({
        ...c,
        amount: c.amount,
      })),
      allowances: {
        gradeAllowances: salaryDetails.components
          .filter((c) => c.type === "allowance" && c.isActive)
          .map((c) => ({
            name: c.name,
            type: c.type,
            value: c.value,
            amount: c.amount,
          })),
        additionalAllowances: salaryDetails.additionalAllowances.map((a) => ({
          name: a.name,
          type: "allowance",
          value: a.amount,
          amount: a.amount,
          frequency: PayrollFrequency.MONTHLY,
        })),
        totalAllowances: salaryDetails.totalAllowances,
      },
      bonuses: {
        items: bonuses.items.map(
          (bonus): IPayrollBonus => ({
            type: bonus.type,
            description: bonus.type,
            amount: bonus.amount,
          })
        ),
        totalBonuses: bonuses.totalBonuses,
      },
      earnings: {
        overtime: { hours: 0, rate: 0, amount: 0 },
        bonus: bonuses.items,
        totalEarnings: grossSalary,
      },
      deductions: {
        tax: {
          taxableAmount: grossSalary,
          taxRate: (deductionDetails.statutory.paye / grossSalary) * 100,
          amount: deductionDetails.statutory.paye,
        },
        pension: {
          pensionableAmount: salaryDetails.basicSalary,
          rate: 8,
          amount: deductionDetails.statutory.pension,
        },
        loans: [],
        others: [],
        totalDeductions: deductionDetails.total,
      },
      totals: {
        basicSalary: salaryDetails.basicSalary,
        totalAllowances: salaryDetails.totalAllowances,
        totalBonuses: bonuses.totalBonuses,
        grossEarnings: grossSalary,
        totalDeductions: deductionDetails.total,
        netPay: netSalary,
      },
      status: PayrollStatus.PENDING,
      frequency: PayrollFrequency.MONTHLY,
    };

    // Validate before returning
    this.validatePayrollData(payrollData);

    return payrollData;
  }

  static async getEmployeePayrollHistory(
    employeeId: string
  ): Promise<EmployeePayrollHistory[]> {
    try {
      console.log("🔍 Fetching payroll history for employee:", employeeId);

      const history = await PayrollModel.find({
        "employee._id": asObjectId(employeeId),
      })
        .sort({ year: -1, month: -1 })
        .populate([
          { path: "employee", select: "firstName lastName employeeId" },
          { path: "department", select: "name code" },
          { path: "salaryGrade", select: "level description" },
        ])
        .lean<RawPayrollDocument[]>();

      // Transform the data to ensure correct types
      const transformedHistory: EmployeePayrollHistory[] = history.map(
        (record) => ({
          _id: record._id,
          employee: {
            _id: record.employee._id,
            firstName: record.employee.firstName,
            lastName: record.employee.lastName,
            employeeId: record.employee.employeeId,
          },
          department: {
            _id: record.department._id,
            name: record.department.name,
            code: record.department.code,
          },
          salaryGrade: {
            _id: record.salaryGrade._id,
            level: record.salaryGrade.level,
            description: record.salaryGrade.description,
          },
          month: record.month,
          year: record.year,
          totals: {
            basicSalary: record.totals.basicSalary,
            totalAllowances: record.totals.totalAllowances,
            totalBonuses: record.totals.totalBonuses,
            grossEarnings: record.totals.grossEarnings,
            totalDeductions: record.totals.totalDeductions,
            netPay: record.totals.netPay,
          },
          status: record.status,
          createdAt: record.createdAt,
        })
      );

      console.log(`📋 Found ${transformedHistory.length} payroll records`);
      return transformedHistory;
    } catch (error) {
      console.error("❌ Error fetching employee payroll history:", error);
      throw error;
    }
  }
}
