import { Types } from "mongoose";
import { ApiError } from "../utils/errorHandler.js";
import UserModel from "../models/User.js";
import PayrollModel, {
  PAYROLL_STATUS,
  PayrollFrequency,
} from "../models/Payroll.js";
import SalaryGrade from "../models/SalaryStructure.js";
import { DeductionService } from "./DeductionService.js";
import { AllowanceService } from "./AllowanceService.js";
import { BonusService } from "./BonusService.js";
import { SalaryStructureService } from "./SalaryStructureService.js";

const asObjectId = (id) => new Types.ObjectId(id);

export class PayrollService {
  static async validateAndGetEmployee(employeeId) {
    console.log("🔍 Validating employee:", employeeId);

    const employee = await UserModel.findById(employeeId).lean();

    if (!employee) {
      throw new ApiError(400, "Employee not found");
    }

    if (!employee.department) {
      throw new ApiError(400, "Employee must be assigned to a department");
    }

    // Create department object if it's a string
    const departmentInfo =
      typeof employee.department === "string"
        ? {
            _id: new Types.ObjectId(),
            name: employee.department,
            code: employee.department,
          }
        : employee.department;

    return {
      ...employee,
      department: departmentInfo,
      gradeLevel: employee.gradeLevel?.toString() || "",
    };
  }

  static async checkExistingPayroll(employeeId, month, year) {
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

  static calculatePayPeriod(month, year) {
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

  static calculateAllowanceAmount(allowance, basicSalary) {
    if (allowance.calculationMethod === "percentage") {
      const base = allowance.baseAmount || basicSalary;
      return (base * allowance.value) / 100;
    }
    return allowance.value;
  }

  static async calculateSalaryComponents(salaryGradeId, employeeId) {
    console.log("🧮 Calculating salary components for grade:", salaryGradeId);

    const salaryGrade = await SalaryGrade.findById(salaryGradeId);
    if (!salaryGrade) {
      throw new ApiError(404, "Salary grade not found");
    }

    // Define standard allowances
    const standardAllowances = [
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
      components: standardAllowances,
      additionalAllowances: [],
      totalAllowances,
      grossSalary: salaryGrade.basicSalary + totalAllowances,
    };
  }

  static async calculateDeductions(basicSalary, grossSalary) {
    console.log("🧮 Calculating deductions for salary:", {
      basicSalary,
      grossSalary,
    });

    // Get all active deductions
    const deductions = await DeductionService.getActiveDeductions();

    // 1. Calculate Statutory Deductions
    const paye = this.calculatePAYE(grossSalary);
    const pension = basicSalary * 0.08;
    const nhf = basicSalary * 0.025;

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

  static calculatePAYE(grossSalary) {
    console.log(
      `\nCalculating PAYE for salary: ₦${grossSalary.toLocaleString()}`
    );

    const brackets = [
      { min: 0, max: 300000, rate: 7 },
      { min: 300001, max: 600000, rate: 11 },
      { min: 600001, max: 1100000, rate: 15 },
      { min: 1100001, max: 1600000, rate: 19 },
      { min: 1600001, max: 3200000, rate: 21 },
      { min: 3200001, max: Number.MAX_SAFE_INTEGER, rate: 24 },
    ];

    let totalTax = 0;
    let remainingSalary = grossSalary;

    for (const bracket of brackets) {
      if (remainingSalary <= 0) break;

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

  static async calculateBonuses(employeeId, startDate, endDate) {
    try {
      const filters = {
        employee: employeeId,
        approvalStatus: "approved",
        active: true,
      };

      let bonuses = await BonusService.getAllBonuses(filters);

      if (!bonuses || !Array.isArray(bonuses) || bonuses.length === 0) {
        console.log("No bonuses found for employee:", employeeId);
        return {
          items: [],
          totalBonuses: 0,
        };
      }

      const periodBonuses = bonuses.filter((bonus) => {
        if (!bonus || !bonus.paymentDate) {
          console.log("Invalid bonus record:", bonus);
          return false;
        }

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

      const items = periodBonuses.map((bonus) => {
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
          amount: bonus.amount,
        };
      });

      const totalBonuses = items.reduce((sum, item) => sum + item.amount, 0);

      console.log(`Calculated ${items.length} bonuses, total: ${totalBonuses}`);

      return {
        items,
        totalBonuses,
      };
    } catch (error) {
      console.error("Error calculating bonuses:", error);
      return {
        items: [],
        totalBonuses: 0,
      };
    }
  }

  static adjustAmountByFrequency(
    amount,
    frequency,
    targetFrequency = PayrollFrequency.MONTHLY
  ) {
    const monthlyAmount = (() => {
      switch (frequency) {
        case PayrollFrequency.YEARLY:
          return amount / 12;
        case PayrollFrequency.SEMI_MONTHLY:
          return amount * 2;
        case PayrollFrequency.BI_WEEKLY:
          return amount * 2.167;
        case PayrollFrequency.WEEKLY:
          return amount * 4.333;
        case PayrollFrequency.DAILY:
          return amount * 21.75;
        default:
          return amount;
      }
    })();

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

  static validatePayrollData(payrollData) {
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

  static roundToKobo(amount) {
    return parseFloat((Math.round(amount * 100) / 100).toFixed(2));
  }

  static getMonthPeriod(month, year) {
    // Create dates in UTC to avoid timezone issues
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    return { startDate, endDate };
  }

  static async calculatePayroll(employeeId, salaryGradeId, month, year) {
    const existingPayroll = await PayrollModel.findOne({
      employee: employeeId,
      month,
      year,
    });

    if (existingPayroll) {
      throw new ApiError(
        400,
        `Payroll record already exists for employee in ${month}/${year}`
      );
    }

    const salaryGrade = await SalaryStructureService.getSalaryGradeById(
      salaryGradeId
    );
    if (!salaryGrade) {
      throw new ApiError(404, "Salary grade not found");
    }

    const salaryDetails =
      SalaryStructureService.calculateTotalSalary(salaryGrade);
    const grossSalary = this.roundToKobo(salaryDetails.grossSalary);

    const deductionDetails =
      await DeductionService.calculateStatutoryDeductions(
        salaryDetails.basicSalary,
        grossSalary
      );

    const totalDeductions = this.roundToKobo(
      deductionDetails.paye + deductionDetails.pension + deductionDetails.nhf
    );

    const totalAllowances = this.roundToKobo(salaryDetails.totalAllowances);

    // Process components with amounts
    const gradeAllowances = salaryGrade.components.map((comp) => {
      const amount =
        comp.type === "percentage" ||
        (comp.type === "allowance" && comp.name === "Housing Allowance")
          ? this.roundToKobo((comp.value / 100) * salaryDetails.basicSalary)
          : this.roundToKobo(comp.value);

      return {
        name: comp.name,
        type: comp.type,
        value: comp.value,
        amount,
      };
    });

    // Get correct period dates
    const { startDate: periodStart, endDate: periodEnd } = this.getMonthPeriod(
      month,
      year
    );

    return {
      month,
      year,
      employee: employeeId,
      salaryGrade: salaryGradeId,
      basicSalary: this.roundToKobo(salaryDetails.basicSalary),
      components: gradeAllowances,
      earnings: {
        overtime: { hours: 0, rate: 0, amount: 0 },
        bonus: [],
        totalEarnings: grossSalary,
      },
      deductions: {
        tax: {
          taxableAmount: grossSalary,
          taxRate: this.roundToKobo(
            (deductionDetails.paye / grossSalary) * 100
          ),
          amount: this.roundToKobo(deductionDetails.paye),
        },
        pension: {
          pensionableAmount: this.roundToKobo(salaryDetails.basicSalary),
          rate: 8,
          amount: this.roundToKobo(deductionDetails.pension),
        },
        nhf: {
          pensionableAmount: this.roundToKobo(salaryDetails.basicSalary),
          rate: 2.5,
          amount: this.roundToKobo(deductionDetails.nhf),
        },
        loans: [],
        others: [],
        totalDeductions,
      },
      totals: {
        basicSalary: this.roundToKobo(salaryDetails.basicSalary),
        totalAllowances,
        totalBonuses: 0,
        grossEarnings: grossSalary,
        totalDeductions,
        netPay: this.roundToKobo(grossSalary - totalDeductions),
      },
      allowances: {
        gradeAllowances,
        additionalAllowances: [],
        totalAllowances,
      },
      bonuses: {
        items: [],
        totalBonuses: 0,
      },
      frequency: "monthly",
      periodStart,
      periodEnd,
    };
  }

  static async getEmployeePayrollHistory(employeeId) {
    try {
      console.log("🔍 Fetching payroll history for employee:", employeeId);

      const history = await PayrollModel.find({
        employee: asObjectId(employeeId),
      })
        .sort({ year: -1, month: -1 })
        .populate([
          { path: "employee", select: "firstName lastName employeeId" },
          { path: "department", select: "name code" },
          { path: "salaryGrade", select: "level description" },
        ])
        .lean();

      console.log(`📋 Found ${history.length} payroll records`);
      return history;
    } catch (error) {
      console.error("❌ Error fetching employee payroll history:", error);
      throw error;
    }
  }
}
