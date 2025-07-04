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
import DepartmentModel from "../models/Department.js";
import Audit from "../models/Audit.js";
import Allowance from "../models/Allowance.js";
import Bonus from "../models/Bonus.js";

const asObjectId = (id) => new Types.ObjectId(id);

export class PayrollService {
  static async validateAndGetEmployee(employeeId, options = {}) {
    console.log("🔍 Validating employee:", employeeId);

    const employee = await UserModel.findById(employeeId).lean();
    console.log("📋 Employee data:", {
      id: employee._id,
      name: `${employee.firstName} ${employee.lastName}`,
      department: employee.department,
      departmentType: typeof employee.department,
    });

    if (!employee) {
      throw new ApiError(400, "Employee not found");
    }

    if (!employee.department) {
      throw new ApiError(400, "Employee must be assigned to a department");
    }

    // Check onboarding eligibility
    if (
      !options?.bypassOnboardingCheck &&
      employee.onboarding &&
      employee.onboarding.status !== "completed"
    ) {
      throw new ApiError(
        400,
        `Employee ${employee.firstName} ${employee.lastName} must complete onboarding before payroll can be processed`
      );
    }

    // Log successful onboarding check
    if (employee.onboarding) {
      console.log(
        `✅ Onboarding check PASSED for ${employee.firstName} ${employee.lastName} - status: ${employee.onboarding.status}`
      );
    } else {
      console.log(
        `✅ Onboarding check PASSED for ${employee.firstName} ${employee.lastName} - no onboarding data (legacy user)`
      );
    }

    // If department is a string, try to find the department by name
    if (typeof employee.department === "string") {
      const departmentData = await DepartmentModel.findOne({
        name: employee.department,
        status: "active",
      });
      console.log("🔍 Found department by name:", departmentData);

      if (!departmentData) {
        throw new ApiError(
          404,
          `Department "${employee.department}" not found`
        );
      }

      return {
        ...employee,
        department: departmentData,
        gradeLevel: employee.gradeLevel?.toString() || "",
      };
    }

    // If department is an ObjectId, populate the department data
    const populatedEmployee = await UserModel.findById(employeeId)
      .populate({
        path: "department",
        select: "name code",
      })
      .lean();

    console.log("🔍 Populated employee data:", {
      id: populatedEmployee._id,
      name: `${populatedEmployee.firstName} ${populatedEmployee.lastName}`,
      department: populatedEmployee.department,
    });

    return {
      ...populatedEmployee,
      gradeLevel: populatedEmployee.gradeLevel?.toString() || "",
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
    if (allowance.calculationMethod === "fixed") {
      return allowance.value;
    }
    if (allowance.calculationMethod === "percentage") {
      return (allowance.value / 100) * basicSalary;
    }
    return 0;
  }

  static calculateDeductionAmount(deduction, basicSalary) {
    if (deduction.calculationMethod === "fixed") {
      return deduction.value;
    }
    if (deduction.calculationMethod === "percentage") {
      return (deduction.value / 100) * basicSalary;
    }
    return 0;
  }

  static async calculateSalaryComponents(salaryGradeId, employeeId) {
    try {
      console.log("🧮 Calculating salary components for grade:", salaryGradeId);

      const salaryGrade = await SalaryGrade.findById(salaryGradeId);
      if (!salaryGrade) {
        throw new ApiError(404, "Salary grade not found");
      }

      if (!salaryGrade.basicSalary || salaryGrade.basicSalary <= 0) {
        throw new ApiError(400, "Invalid basic salary in salary grade");
      }

      console.log("✅ Salary grade data:", {
        level: salaryGrade.level,
        basicSalary: salaryGrade.basicSalary,
        components: salaryGrade.components?.length || 0,
      });

      // Get the full salary calculation from SalaryStructureService
      const salaryCalculation =
        await SalaryStructureService.calculateTotalSalary(salaryGrade);

      console.log("📊 Salary calculation results:", {
        basicSalary: salaryCalculation.basicSalary,
        totalAllowances: salaryCalculation.totalAllowances,
        totalDeductions: salaryCalculation.totalDeductions,
        totalBonuses: salaryCalculation.totalBonuses,
        grossSalary: salaryCalculation.grossSalary,
        netSalary: salaryCalculation.netSalary,
        components: salaryCalculation.components.map((c) => ({
          name: c.name,
          amount: c.amount,
        })),
      });

      return {
        basicSalary: salaryCalculation.basicSalary,
        components: salaryCalculation.components,
        totalAllowances: salaryCalculation.totalAllowances,
        totalDeductions: salaryCalculation.totalDeductions,
        totalBonuses: salaryCalculation.totalBonuses,
        grossSalary: salaryCalculation.grossSalary,
        netSalary: salaryCalculation.netSalary,
      };
    } catch (error) {
      console.error("❌ Error calculating salary components:", error);
      throw new ApiError(
        500,
        `Failed to calculate salary components: ${error.message}`
      );
    }
  }

  // Helper: Calculate current period data based on frequency
  static getCurrentPeriodData(frequency, payrollDate = new Date()) {
    const currentMonth = payrollDate.getMonth() + 1;
    const currentYear = payrollDate.getFullYear();

    // Calculate week of year (1-53)
    const startOfYear = new Date(currentYear, 0, 1);
    const days = Math.floor(
      (payrollDate - startOfYear) / (1000 * 60 * 60 * 24)
    );
    const currentWeek = Math.ceil((days + startOfYear.getDay() + 1) / 7);

    // Calculate biweek (1-27, every 2 weeks)
    const currentBiweek = Math.ceil(currentWeek / 2);

    // Calculate quarter (1-4)
    const currentQuarter = Math.ceil(currentMonth / 3);

    return {
      currentMonth,
      currentYear,
      currentWeek,
      currentBiweek,
      currentQuarter,
    };
  }

  static async calculateDeductions(
    basicSalary,
    grossSalary,
    frequency,
    payrollDate,
    scopeFilter = {}
  ) {
    console.log("🧮 [PayrollService] Calculating deductions for salary:", {
      basicSalary,
      grossSalary,
      frequency,
      payrollDate,
      scopeFilter,
    });

    // Get current period data
    const currentPeriodData = this.getCurrentPeriodData(frequency, payrollDate);

    // Get all applicable deductions for this period
    const deductions = await DeductionService.getApplicableDeductions(
      frequency,
      currentPeriodData,
      scopeFilter
    );

    console.log(
      "🔍 [PayrollService] All deductions fetched:",
      deductions.map((d) => ({
        name: d.name,
        type: d.type,
        scope: d.scope,
        department: d.department,
        value: d.value,
        calculationMethod: d.calculationMethod,
      }))
    );

    // 1. Calculate Statutory Deductions
    const paye = this.calculatePAYE(grossSalary);
    const pension = basicSalary * 0.08;
    const nhf = basicSalary * 0.025;

    const statutoryTotal = paye + pension + nhf;

    // 2. Calculate Voluntary Deductions
    let voluntaryTotal = 0;
    const voluntaryDeductions = deductions.filter(
      (d) => d.type === "VOLUNTARY" && d.isActive
    );

    console.log("🔍 Voluntary deductions found:", {
      count: voluntaryDeductions.length,
      deductions: voluntaryDeductions.map((d) => ({
        name: d.name,
        value: d.value,
        calculationMethod: d.calculationMethod,
        scope: d.scope,
        department: d.department,
      })),
    });

    // Calculate amounts for each voluntary deduction
    const calculatedVoluntaryDeductions = [];
    for (const deduction of voluntaryDeductions) {
      let amount = 0;

      switch (deduction.calculationMethod) {
        case "FIXED":
          amount = deduction.value;
          break;
        case "PERCENTAGE":
          amount = (grossSalary * deduction.value) / 100;
          break;
        case "PROGRESSIVE":
          amount = this.calculateProgressiveDeduction(
            grossSalary,
            deduction.taxBrackets
          );
          break;
        default:
          amount = deduction.value;
      }

      console.log(`💰 Voluntary deduction "${deduction.name}":`, {
        calculationMethod: deduction.calculationMethod,
        value: deduction.value,
        calculatedAmount: amount,
      });

      calculatedVoluntaryDeductions.push({
        ...deduction.toObject(),
        calculatedAmount: amount,
      });

      voluntaryTotal += amount;
    }

    console.log("📊 Deduction totals:", {
      statutory: {
        paye,
        pension,
        nhf,
        total: statutoryTotal,
      },
      voluntary: {
        count: voluntaryDeductions.length,
        total: voluntaryTotal,
      },
      grandTotal: statutoryTotal + voluntaryTotal,
    });

    return {
      statutory: {
        paye,
        pension,
        nhf,
        total: statutoryTotal,
      },
      voluntary: {
        deductions: calculatedVoluntaryDeductions,
        total: voluntaryTotal,
      },
      total: statutoryTotal + voluntaryTotal,
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

  static async calculatePersonalAllowances(
    employeeId,
    startDate,
    endDate,
    basicSalary
  ) {
    try {
      console.log("🧮 Calculating personal allowances for:", employeeId);

      // First, get the user with populated allowance details
      const user = await UserModel.findById(employeeId)
        .populate({
          path: "personalAllowances.allowanceId",
          select:
            "type amount calculationMethod effectiveDate expiryDate name description reason",
        })
        .lean();

      console.log("📋 User's personal allowances:", user.personalAllowances);

      if (!user?.personalAllowances?.length) {
        console.log("ℹ️ No personal allowances found for employee");
        return {
          additionalAllowances: [],
          totalPersonalAllowances: 0,
        };
      }

      // Filter for approved allowances within the date range
      const validAllowances = user.personalAllowances.filter((item) => {
        if (!item.allowanceId) return false; // skip malformed
        const isApproved = item.status === "APPROVED";
        const isWithinDateRange =
          (!item.allowanceId.effectiveDate ||
            new Date(item.allowanceId.effectiveDate) <= endDate) &&
          (!item.allowanceId.expiryDate ||
            new Date(item.allowanceId.expiryDate) >= startDate);

        return isApproved && isWithinDateRange;
      });
      // Calculate amounts for each valid allowance
      const additionalAllowances = validAllowances.map((item) => {
        let amount = 0;
        const allowance = item.allowanceId;

        console.log(`Calculating allowance ${allowance._id}:`, {
          type: allowance.type,
          calculationMethod: allowance.calculationMethod,
          baseAmount: allowance.amount,
        });

        // If calculationMethod is missing, treat it as fixed amount
        if (!allowance.calculationMethod) {
          amount = allowance.amount || 0;
          console.log(`Using fixed amount for allowance: ${amount}`);
        } else {
          switch (allowance.calculationMethod) {
            case "fixed":
              amount = allowance.amount;
              break;
            case "percentage":
              amount = (basicSalary * allowance.amount) / 100;
              break;
            case "performance":
              amount =
                AllowanceService.calculatePerformanceAllowance(allowance);
              break;
            default:
              console.warn(
                `⚠️ Unknown calculation method: ${allowance.calculationMethod}`
              );
              amount = allowance.amount || 0;
          }
        }

        console.log(`Calculated amount for ${allowance.name}: ${amount}`);

        return {
          name: allowance.name || "Additional Allowance",
          type: allowance.type || "additional",
          value: allowance.amount || 0,
          amount: amount,
          frequency: allowance.frequency || "monthly",
          reason:
            item.reason ||
            allowance.reason ||
            allowance.description ||
            "No reason provided",
          _id: allowance._id,
        };
      });

      const totalPersonalAllowances = additionalAllowances.reduce(
        (sum, item) => sum + item.amount,
        0
      );

      console.log(
        `💰 Total personal allowances calculated: ${totalPersonalAllowances}`
      );

      return {
        additionalAllowances,
        totalPersonalAllowances,
      };
    } catch (error) {
      console.error("❌ Error calculating personal allowances:", error);
      return {
        additionalAllowances: [],
        totalPersonalAllowances: 0,
      };
    }
  }

  static async calculateBonuses(employeeId, startDate, endDate, basicSalary) {
    try {
      console.log("🎯 Calculating bonuses for employee:", employeeId);

      // First, get the user with populated bonus details
      const user = await UserModel.findById(employeeId)
        .populate({
          path: "personalBonuses.bonusId",
          select: "type amount paymentDate description reason",
        })
        .lean();

      console.log("📋 User's personal bonuses:", user.personalBonuses);

      if (!user?.personalBonuses || user.personalBonuses.length === 0) {
        console.log("ℹ️ No bonuses found for employee");
        return {
          bonus: [],
          totalBonuses: 0,
        };
      }

      // Filter for approved bonuses within the date range
      const approvedBonuses = user.personalBonuses.filter((item) => {
        if (!item.bonusId) return false; // skip malformed
        const isApproved = item.status === "APPROVED";
        const paymentDate = new Date(item.bonusId.paymentDate);
        const isWithinDateRange =
          paymentDate >= startDate && paymentDate <= endDate;

        return isApproved && isWithinDateRange;
      });

      console.log(
        `✅ Found ${approvedBonuses.length} approved bonuses for period`
      );

      // Calculate amounts for each valid bonus
      const bonus = approvedBonuses.map((item) => {
        const bonus = item.bonusId;
        let amount = bonus.amount || 0; // Always use the amount directly

        console.log(`Calculating bonus ${bonus._id}:`, {
          type: bonus.type,
          amount: amount,
        });

        // For performance bonuses, we'll still use the amount directly
        // since it's already set in the bonus record
        if (bonus.type === "performance") {
          console.log(`Using performance bonus amount: ${amount}`);
        }

        return {
          type: bonus.type || "fixed",
          description:
            bonus.reason || bonus.description || `${bonus.type} Bonus`,
          reason: bonus.reason || bonus.description || `${bonus.type} Bonus`,
          amount: amount,
        };
      });

      const totalBonuses = bonus.reduce((sum, item) => sum + item.amount, 0);
      console.log(`💰 Total bonuses calculated: ${totalBonuses}`);

      return {
        bonus,
        totalBonuses,
      };
    } catch (error) {
      console.error("❌ Error calculating bonuses:", error);
      return {
        bonus: [],
        totalBonuses: 0,
      };
    }
  }

  static adjustAmountByFrequency(
    amount,
    frequency,
    targetFrequency = PayrollFrequency.MONTHLY
  ) {
    try {
      console.log("🔄 Adjusting amount by frequency:", {
        amount,
        from: frequency,
        to: targetFrequency,
      });

      const monthlyAmount = (() => {
        switch (frequency) {
          case PayrollFrequency.YEARLY:
            return amount / 12;
          case PayrollFrequency.QUARTERLY:
            return amount / 3;
          case PayrollFrequency.BIWEEKLY:
            return amount * 2.167;
          case PayrollFrequency.WEEKLY:
            return amount * 4.333;
          default:
            return amount;
        }
      })();

      const adjustedAmount = (() => {
        switch (targetFrequency) {
          case PayrollFrequency.YEARLY:
            return monthlyAmount * 12;
          case PayrollFrequency.QUARTERLY:
            return monthlyAmount * 3;
          case PayrollFrequency.BIWEEKLY:
            return monthlyAmount / 2.167;
          case PayrollFrequency.WEEKLY:
            return monthlyAmount / 4.333;
          default:
            return monthlyAmount;
        }
      })();

      console.log(`✅ Adjusted amount: ₦${adjustedAmount.toLocaleString()}`);
      return this.roundToKobo(adjustedAmount);
    } catch (error) {
      console.error("❌ Error adjusting amount by frequency:", error);
      throw new ApiError(
        500,
        `Failed to adjust amount by frequency: ${error.message}`
      );
    }
  }

  static getPeriodDates(frequency, month, year) {
    try {
      console.log("📅 Calculating period dates for:", {
        frequency,
        month,
        year,
      });

      const startDate = new Date(year, month - 1, 1);
      let endDate;

      switch (frequency) {
        case PayrollFrequency.WEEKLY:
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          break;
        case PayrollFrequency.BIWEEKLY:
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 13);
          break;
        case PayrollFrequency.MONTHLY:
          endDate = new Date(year, month, 0);
          break;
        case PayrollFrequency.QUARTERLY:
          endDate = new Date(year, month + 2, 0);
          break;
        case PayrollFrequency.YEARLY:
          endDate = new Date(year, 11, 31);
          break;
        default:
          endDate = new Date(year, month, 0);
      }

      console.log("✅ Period dates calculated:", {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      });

      return { startDate, endDate };
    } catch (error) {
      console.error("❌ Error calculating period dates:", error);
      throw new ApiError(
        500,
        `Failed to calculate period dates: ${error.message}`
      );
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

  static async validatePayPeriodSettings(systemPayPeriod, payrollFrequency) {
    try {
      console.log("🔍 Validating pay period settings:", {
        systemPayPeriod,
        payrollFrequency,
      });

      // Import SystemSettings model
      const SystemSettings = (await import("../models/SystemSettings.js"))
        .default;

      // Get current system settings
      const systemSettings = await SystemSettings.findOne();
      const currentSystemPayPeriod =
        systemSettings?.payrollSettings?.payPeriod || "monthly";

      console.log(
        "📋 Current system pay period setting:",
        currentSystemPayPeriod
      );

      // Validate frequency against system settings
      const isValidFrequency =
        Object.values(PayrollFrequency).includes(payrollFrequency);
      const isSystemConsistent = currentSystemPayPeriod === payrollFrequency;

      const validationResult = {
        systemPayPeriod: currentSystemPayPeriod,
        payrollFrequency,
        isValidFrequency,
        isSystemConsistent,
        recommendedAction: null,
      };

      if (!isValidFrequency) {
        validationResult.recommendedAction = `Invalid frequency: ${payrollFrequency}. Valid options: ${Object.values(
          PayrollFrequency
        ).join(", ")}`;
      } else if (!isSystemConsistent) {
        validationResult.recommendedAction = `Frequency mismatch: System setting is "${currentSystemPayPeriod}" but payroll uses "${payrollFrequency}". Update system settings to use "${payrollFrequency}".`;
      } else {
        validationResult.recommendedAction =
          "Pay period settings are consistent";
      }

      console.log("✅ Pay period validation result:", validationResult);
      return validationResult;
    } catch (error) {
      console.error("❌ Error validating pay period settings:", error);
      return {
        systemPayPeriod: "unknown",
        payrollFrequency,
        isValidFrequency: false,
        isSystemConsistent: false,
        recommendedAction: `Error validating settings: ${error.message}`,
      };
    }
  }

  static getMonthPeriod(month, year) {
    // Create dates in UTC to avoid timezone issues
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    return { startDate, endDate };
  }

  static async markAllowancesAndBonusesAsUsed(userId, payrollId, month, year) {
    try {
      console.log("🔍 Starting to mark items as used for:", {
        userId,
        month,
        year,
      });

      // Get all allowances and bonuses used in this payroll
      const user = await UserModel.findById(userId)
        .select("personalAllowances personalBonuses")
        .lean();

      const allowanceIds = user.personalAllowances
        .filter((a) => a.status === "APPROVED")
        .map((a) => a.allowanceId._id);

      const bonusIds = user.personalBonuses
        .filter((b) => b.status === "APPROVED")
        .map((b) => b.bonusId._id);

      console.log("📌 Items to mark as used:", {
        allowanceCount: allowanceIds.length,
        bonusCount: bonusIds.length,
      });

      // Update main collections
      await Allowance.updateMany(
        { _id: { $in: allowanceIds } },
        {
          $set: {
            usedInPayroll: { month, year, payrollId },
          },
        }
      );

      await Bonus.updateMany(
        { _id: { $in: bonusIds } },
        {
          $set: {
            usedInPayroll: { month, year, payrollId },
          },
        }
      );

      console.log("✅ Successfully marked items as used in main collections");

      // Update user's personal arrays
      await UserModel.updateOne(
        { _id: userId },
        {
          $set: {
            "personalAllowances.$[].usedInPayroll": { month, year, payrollId },
            "personalBonuses.$[].usedInPayroll": { month, year, payrollId },
          },
        }
      );

      console.log(
        "✅ Successfully marked items as used in user's personal arrays"
      );

      return true;
    } catch (error) {
      console.error("❌ Error marking items as used:", error);
      throw error;
    }
  }

  static async calculatePayroll(
    employeeId,
    salaryGradeId,
    month,
    year,
    frequency = PayrollFrequency.MONTHLY,
    departmentId = null
  ) {
    try {
      console.log("🧮 Calculating payroll for:", {
        employeeId,
        month,
        year,
        frequency,
        departmentId,
      });

      // Get employee details using validateAndGetEmployee
      const employee = await this.validateAndGetEmployee(employeeId);
      if (!employee.department) {
        throw new ApiError(400, "Employee must be assigned to a department");
      }

      // Handle department whether it's a string or ObjectId
      let departmentData;
      if (typeof employee.department === "string") {
        departmentData = await DepartmentModel.findOne({
          name: employee.department,
          status: "active",
        });
        if (!departmentData) {
          throw new ApiError(
            404,
            `Department "${employee.department}" not found`
          );
        }
      } else {
        departmentData = await DepartmentModel.findById(employee.department);
        if (!departmentData) {
          throw new ApiError(404, "Department not found");
        }
      }

      console.log("✅ Department found:", {
        id: departmentData._id,
        name: departmentData.name,
        code: departmentData.code,
      });

      // Get salary grade using SalaryStructureService
      console.log("\n🔍 Getting salary grade for ID:", salaryGradeId);
      const salaryGrade = await SalaryStructureService.getSalaryGradeById(
        salaryGradeId
      );
      if (!salaryGrade) {
        throw new ApiError(404, "Salary grade not found");
      }

      console.log("📋 Salary Grade Data:", {
        id: salaryGrade._id,
        level: salaryGrade.level,
        basicSalary: salaryGrade.basicSalary,
        components: salaryGrade.components,
        componentsCount: salaryGrade.components?.length || 0,
      });

      if (!salaryGrade.basicSalary || salaryGrade.basicSalary <= 0) {
        throw new ApiError(400, "Invalid basic salary in salary grade");
      }

      const basicSalary = this.roundToKobo(salaryGrade.basicSalary);
      console.log("✅ Basic salary:", basicSalary);

      // Get period dates
      const { startDate, endDate } = this.getPeriodDates(
        frequency,
        month,
        year
      );

      // Calculate salary components (from grade)
      const salaryComponents = await this.calculateSalaryComponents(
        salaryGradeId,
        employeeId
      );

      // Calculate personal allowances
      const personalAllowances = await this.calculatePersonalAllowances(
        employeeId,
        startDate,
        endDate,
        basicSalary
      );

      // Calculate bonuses
      const bonuses = await this.calculateBonuses(
        employeeId,
        startDate,
        endDate,
        basicSalary
      );

      // MARK ALLOWANCES AND BONUSES AS USED HERE
      console.log("🔍 Marking allowances and bonuses as used...");

      // Get the user's current state
      const user = await UserModel.findById(employeeId)
        .select("personalAllowances personalBonuses")
        .lean();

      // Get IDs of allowances and bonuses to mark
      const allowanceIds = user.personalAllowances
        ?.filter((a) => {
          const isApproved = a.status === "APPROVED";
          const isNotUsed =
            !a.usedInPayroll ||
            a.usedInPayroll.month !== month ||
            a.usedInPayroll.year !== year;
          return isApproved && isNotUsed;
        })
        .map((a) => a.allowanceId._id.toString());

      const bonusIds = user.personalBonuses
        ?.filter((b) => {
          const isApproved = b.status === "APPROVED";
          const isNotUsed =
            !b.usedInPayroll ||
            b.usedInPayroll.month !== month ||
            b.usedInPayroll.year !== year;
          return isApproved && isNotUsed;
        })
        .map((b) => b.bonusId._id.toString());

      console.log("📌 Allowances to mark:", allowanceIds);
      console.log("📌 Bonuses to mark:", bonusIds);

      if (allowanceIds?.length || bonusIds?.length) {
        // Update main collections
        await Allowance.updateMany(
          { _id: { $in: allowanceIds } },
          {
            $set: {
              usedInPayroll: { month, year, payrollId: null },
            },
          }
        );

        await Bonus.updateMany(
          { _id: { $in: bonusIds } },
          {
            $set: {
              usedInPayroll: { month, year, payrollId: null },
            },
          }
        );

        // Update user's personal arrays
        const update = {};
        const arrayFilters = [];

        if (allowanceIds?.length) {
          update["personalAllowances.$[a].usedInPayroll"] = {
            month,
            year,
            payrollId: null,
          };
          arrayFilters.push({
            "a.allowanceId": {
              $in: allowanceIds.map((id) => new Types.ObjectId(id)),
            },
          });
        }

        if (bonusIds?.length) {
          update["personalBonuses.$[b].usedInPayroll"] = {
            month,
            year,
            payrollId: null,
          };
          arrayFilters.push({
            "b.bonusId": { $in: bonusIds.map((id) => new Types.ObjectId(id)) },
          });
        }

        await UserModel.updateOne(
          { _id: employeeId },
          { $set: update },
          { arrayFilters, strict: false }
        );
      }

      // Calculate deductions with scope filtering for voluntary deductions
      const grossSalary =
        salaryComponents.grossSalary +
        (personalAllowances.totalPersonalAllowances || 0) +
        (bonuses.totalBonuses || 0);

      const scopeFilter = {
        departmentId: departmentId || departmentData._id,
        employeeId: employeeId,
      };

      const deductionDetails = await this.calculateDeductions(
        basicSalary,
        grossSalary,
        frequency,
        new Date(year, month - 1, 1), // Payroll date
        scopeFilter
      );
      console.log(
        "🧾 [PayrollService] Deductions details returned:",
        deductionDetails
      );

      // Calculate tax rate (PAYE)
      const taxRate =
        grossSalary > 0
          ? Number(
              ((deductionDetails.statutory.paye / grossSalary) * 100).toFixed(2)
            )
          : 0;

      // Calculate total deductions
      const totalDeductions = this.roundToKobo(deductionDetails.total);

      // Build breakdown structure for deductions
      const deductionsBreakdown = {
        statutory: [
          {
            name: "PAYE Tax",
            amount: this.roundToKobo(deductionDetails.statutory.paye),
            code: "tax",
            description: "Pay As You Earn Tax",
            type: "statutory",
            calculationMethod: "PROGRESSIVE",
          },
          {
            name: "Pension",
            amount: this.roundToKobo(deductionDetails.statutory.pension),
            code: "pension",
            description: "Pension Contribution",
            type: "statutory",
            calculationMethod: "PERCENTAGE",
          },
          {
            name: "NHF",
            amount: this.roundToKobo(deductionDetails.statutory.nhf),
            code: "nhf",
            description: "National Housing Fund",
            type: "statutory",
            calculationMethod: "PERCENTAGE",
          },
        ],
        voluntary: deductionDetails.voluntary.deductions.map((deduction) => ({
          name: deduction.name,
          amount: this.roundToKobo(deduction.calculatedAmount),
          code: deduction.category || "voluntary",
          description: deduction.description || `${deduction.name} deduction`,
          type: "voluntary",
          calculationMethod: deduction.calculationMethod,
          scope: deduction.scope,
          department: deduction.department,
        })),
      };

      const calculationLogs = {
        basicSalary: {
          value: salaryComponents.basicSalary,
          description: "Basic salary from salary grade",
        },
        allowances: {
          gradeAllowances: salaryComponents.components
            .filter((c) => c.type === "allowance")
            .map((c) => ({
              name: c.name,
              amount: c.amount,
              description: `Grade allowance: ${c.name}`,
            })),
          additionalAllowances: personalAllowances.additionalAllowances.map(
            (a) => ({
              name: a.name,
              amount: a.amount,
              description:
                a.reason || a.description || `Additional allowance: ${a.name}`,
            })
          ),
          total:
            salaryComponents.totalAllowances +
            (personalAllowances.totalPersonalAllowances || 0),
        },
        bonuses: bonuses.bonus.map((b) => ({
          type: b.type,
          amount: b.amount,
          description: b.reason || b.description || `${b.type} bonus`,
        })),
        deductions: {
          tax: {
            taxableAmount: grossSalary,
            taxRate: taxRate,
            amount: this.roundToKobo(deductionDetails.statutory.paye),
          },
          pension: {
            pensionableAmount: salaryComponents.basicSalary,
            rate: 8,
            amount: this.roundToKobo(deductionDetails.statutory.pension),
          },
          nhf: {
            pensionableAmount: salaryComponents.basicSalary,
            rate: 2.5,
            amount: this.roundToKobo(deductionDetails.statutory.nhf),
          },
          loans: [],
          others: [],
          breakdown: deductionsBreakdown,
          totalDeductions,
        },
        totals: {
          grossSalary,
          totalDeductions,
          netSalary: grossSalary - totalDeductions,
        },
      };

      console.log("\n✅ Payroll calculation completed:", calculationLogs);

      // Log the deductions breakdown for debugging
      console.log(
        "🔍 [PayrollService] Deductions breakdown being returned:",
        deductionsBreakdown
      );

      return {
        month,
        year,
        employee: employeeId,
        department: {
          _id: departmentData._id,
          name: departmentData.name,
          code: departmentData.code,
        },
        salaryGrade: salaryGradeId,
        basicSalary: salaryComponents.basicSalary,
        components: salaryComponents.components.map((c) => ({
          name: c.name,
          type: c.type,
          value: c.value,
          amount: c.amount,
          calculationMethod: c.calculationMethod,
          isActive: c.isActive,
        })),
        earnings: {
          basicSalary: salaryComponents.basicSalary,
          allowances: {
            gradeAllowances: salaryComponents.components.filter(
              (c) => c.type === "allowance"
            ),
            additionalAllowances: personalAllowances.additionalAllowances || [],
            totalAllowances:
              salaryComponents.totalAllowances +
              (personalAllowances.totalPersonalAllowances || 0),
          },
          bonus: bonuses.bonus || [],
          totalEarnings: grossSalary,
        },
        deductions: {
          tax: {
            taxableAmount: grossSalary,
            taxRate: taxRate,
            amount: this.roundToKobo(deductionDetails.statutory.paye),
          },
          pension: {
            pensionableAmount: salaryComponents.basicSalary,
            rate: 8,
            amount: this.roundToKobo(deductionDetails.statutory.pension),
          },
          nhf: {
            pensionableAmount: salaryComponents.basicSalary,
            rate: 2.5,
            amount: this.roundToKobo(deductionDetails.statutory.nhf),
          },
          loans: [],
          others: [],
          breakdown: deductionsBreakdown,
          totalDeductions,
        },
        totals: {
          basicSalary: salaryComponents.basicSalary,
          totalAllowances:
            salaryComponents.totalAllowances +
            (personalAllowances.totalPersonalAllowances || 0),
          totalBonuses: bonuses.totalBonuses || 0,
          grossEarnings: grossSalary,
          totalDeductions,
          netPay: this.roundToKobo(grossSalary - totalDeductions),
        },
        allowances: {
          gradeAllowances: salaryComponents.components.filter(
            (c) => c.type === "allowance"
          ),
          additionalAllowances: personalAllowances.additionalAllowances || [],
          totalAllowances:
            salaryComponents.totalAllowances +
            (personalAllowances.totalPersonalAllowances || 0),
        },
        bonuses: {
          items: bonuses.bonus || [],
          totalBonuses: bonuses.totalBonuses || 0,
        },
        frequency,
        periodStart: startDate,
        periodEnd: endDate,
        status: PAYROLL_STATUS.PENDING,
        calculationLogs,
      };
    } catch (error) {
      console.error("❌ Error calculating payroll:", error);
      throw new ApiError(500, `Failed to calculate payroll: ${error.message}`);
    }
  }

  static async getEmployeePayrollHistory(employeeId) {
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
        .lean();

      const transformedHistory = history.map((record) => ({
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
      }));

      console.log(`📋 Found ${transformedHistory.length} payroll records`);
      return transformedHistory;
    } catch (error) {
      console.error("❌ Error fetching employee payroll history:", error);
      throw error;
    }
  }

  /**
   * Calculate employee payroll with all applicable deductions
   */
  static async calculateEmployeePayroll(employee, salaryGrade, month, year) {
    try {
      console.log(
        "[PayrollService.calculateEmployeePayroll] employee:",
        employee
      );
      console.log(
        "[PayrollService.calculateEmployeePayroll] salaryGrade:",
        salaryGrade
      );

      console.log(
        "[calculateEmployeePayroll] Step 1: Calculating total allowances"
      );
      // Calculate allowances array with calculated amount
      const allowances = salaryGrade.components
        .filter(
          (component) => component.type === "allowance" && component.isActive
        )
        .map((component) => {
          const amount = this.calculateAllowanceAmount(
            component,
            salaryGrade.basicSalary
          );
          return {
            ...(component.toObject ? component.toObject() : component),
            amount,
          };
        });
      // Calculate total allowances from calculated amounts
      const totalAllowances = allowances.reduce(
        (total, a) => total + (a.amount || 0),
        0
      );
      console.log(
        "[calculateEmployeePayroll] Total allowances calculated:",
        totalAllowances
      );

      console.log(
        "[calculateEmployeePayroll] Step 2: Calculating gross salary"
      );
      const grossSalary = salaryGrade.basicSalary + totalAllowances;
      console.log("[calculateEmployeePayroll] Gross salary:", grossSalary);

      console.log(
        "[calculateEmployeePayroll] Step 3: Getting deductions using calculateDeductions"
      );
      // Use the same method as the working calculatePayroll
      const scopeFilter = {
        departmentId: employee.department._id || employee.department,
        employeeId: employee._id,
      };

      const deductionDetails = await this.calculateDeductions(
        salaryGrade.basicSalary,
        grossSalary,
        "monthly",
        new Date(year, month - 1, 1), // Payroll date
        scopeFilter
      );
      console.log(
        "[calculateEmployeePayroll] Deduction details:",
        deductionDetails
      );

      console.log("[calculateEmployeePayroll] Step 4: Building result");
      const result = {
        employee: employee._id,
        basicSalary: salaryGrade.basicSalary,
        allowances: allowances,
        deductions: {
          statutory: [
            {
              name: "PAYE Tax",
              type: "statutory",
              description: "Pay As You Earn Tax",
              amount: deductionDetails.statutory.paye,
              calculationMethod: "PROGRESSIVE",
            },
            {
              name: "Pension",
              type: "statutory",
              description: "Pension Contribution",
              amount: deductionDetails.statutory.pension,
              calculationMethod: "PERCENTAGE",
            },
            {
              name: "NHF",
              type: "statutory",
              description: "National Housing Fund",
              amount: deductionDetails.statutory.nhf,
              calculationMethod: "PERCENTAGE",
            },
          ],
          voluntary: deductionDetails.voluntary.deductions.map((deduction) => ({
            name: deduction.name,
            type: "voluntary",
            description: deduction.description || `${deduction.name} deduction`,
            amount: deduction.calculatedAmount,
            calculationMethod: deduction.calculationMethod,
          })),
        },
        grossSalary,
        totalDeductions: deductionDetails.total,
        netSalary: grossSalary - deductionDetails.total,
      };

      console.log("[calculateEmployeePayroll] Success! Returning result");
      return result;
    } catch (error) {
      console.error(
        "[PayrollService.calculateEmployeePayroll] ERROR employee:",
        employee
      );
      console.error(
        "[PayrollService.calculateEmployeePayroll] ERROR salaryGrade:",
        salaryGrade
      );
      console.error(
        "[PayrollService.calculateEmployeePayroll] ERROR details:",
        error.message,
        error.stack
      );
      throw new ApiError(500, "Failed to calculate employee payroll");
    }
  }

  static validateAllowancesAndBonuses(personalAllowances, bonuses) {
    const validationErrors = [];

    // Validate personal allowances
    if (personalAllowances?.items) {
      personalAllowances.items.forEach((allowance, index) => {
        if (
          !allowance.name ||
          !allowance.type ||
          allowance.amount === undefined
        ) {
          validationErrors.push(
            `Invalid personal allowance at index ${index}: missing required fields`
          );
        }
      });
    }

    // Validate bonuses
    if (bonuses?.items) {
      bonuses.items.forEach((bonus, index) => {
        if (!bonus.type || !bonus.description || bonus.amount === undefined) {
          validationErrors.push(
            `Invalid bonus at index ${index}: missing required fields`
          );
        }
      });
    }

    if (validationErrors.length > 0) {
      throw new ApiError(
        400,
        `Validation errors: ${validationErrors.join("; ")}`
      );
    }

    return true;
  }

  static async createPayroll(payrollData) {
    try {
      console.log("🔍 Validating payroll data:", payrollData);

      // Validate required fields
      if (!payrollData.employee || !payrollData.month || !payrollData.year) {
        throw new ApiError(400, "Missing required fields");
      }

      // Validate payroll data
      const validationResult = await this.validatePayrollData(payrollData);
      if (!validationResult.isValid) {
        throw new ApiError(400, validationResult.error);
      }

      // Calculate payroll
      const calculatedPayroll = await this.calculatePayroll(
        payrollData.employee,
        payrollData.salaryGrade,
        payrollData.month,
        payrollData.year,
        payrollData.frequency,
        payrollData.department
      );

      // Check if payroll already exists
      const existingPayroll = await PayrollModel.findOne({
        employee: payrollData.employee,
        month: payrollData.month,
        year: payrollData.year,
      });

      let payroll;
      if (existingPayroll) {
        // Update existing payroll
        console.log("📝 Updating existing payroll");
        payroll = await PayrollModel.findByIdAndUpdate(
          existingPayroll._id,
          {
            ...calculatedPayroll,
            updatedAt: new Date(),
          },
          { new: true }
        );
      } else {
        // Create new payroll
        console.log("📝 Creating new payroll");
        payroll = new PayrollModel({
          ...calculatedPayroll,
        });
        await payroll.save();
        console.log("✅ Payroll created successfully");
      }

      return payroll;
    } catch (error) {
      console.error("❌ Error in createPayroll:", error);
      throw new ApiError(500, `Failed to create payroll: ${error.message}`);
    }
  }

  static async getProcessingStatistics(departmentId = null) {
    try {
      // Create base query
      const baseQuery = departmentId ? { department: departmentId } : {};

      // Basic counts
      const totalPayrolls = await PayrollModel.countDocuments(baseQuery);
      const processingPayrolls = await PayrollModel.countDocuments({
        ...baseQuery,
        status: PAYROLL_STATUS.PROCESSING,
      });
      const completedPayrolls = await PayrollModel.countDocuments({
        ...baseQuery,
        status: PAYROLL_STATUS.COMPLETED,
      });
      const failedPayrolls = await PayrollModel.countDocuments({
        ...baseQuery,
        status: PAYROLL_STATUS.FAILED,
      });
      const approvedPayrolls = await PayrollModel.countDocuments({
        ...baseQuery,
        status: PAYROLL_STATUS.APPROVED,
      });
      const paidPayrolls = await PayrollModel.countDocuments({
        ...baseQuery,
        status: PAYROLL_STATUS.PAID,
      });
      const pendingPaymentPayrolls = await PayrollModel.countDocuments({
        ...baseQuery,
        status: PAYROLL_STATUS.PENDING_PAYMENT,
      });

      // Get recent activity count (last 24 hours)
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);

      const recentActivityCount = await Audit.countDocuments({
        createdAt: { $gte: oneDayAgo },
        ...(departmentId ? { "details.departmentId": departmentId } : {}),
      });

      // Calculate processing time statistics from audit logs
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      const currentMonthStart = new Date(currentYear, currentMonth - 1, 1);
      const currentMonthEnd = new Date(
        currentYear,
        currentMonth,
        0,
        23,
        59,
        59
      );

      const currentMonthProcessingStats = await Audit.aggregate([
        {
          $match: {
            action: "PROCESS",
            entity: "PAYROLL",
            createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd },
            "details.processingTime": { $exists: true, $ne: null },
            ...(departmentId ? { "details.departmentId": departmentId } : {}),
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalProcessingTime: { $sum: "$details.processingTime" },
            avgProcessingTime: { $avg: "$details.processingTime" },
            minProcessingTime: { $min: "$details.processingTime" },
            maxProcessingTime: { $max: "$details.processingTime" },
          },
        },
      ]);

      // Get processing time data for current year
      const currentYearStart = new Date(currentYear, 0, 1);
      const currentYearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

      const currentYearProcessingStats = await Audit.aggregate([
        {
          $match: {
            action: "PROCESS",
            entity: "PAYROLL",
            createdAt: { $gte: currentYearStart, $lte: currentYearEnd },
            "details.processingTime": { $exists: true, $ne: null },
            ...(departmentId ? { "details.departmentId": departmentId } : {}),
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalProcessingTime: { $sum: "$details.processingTime" },
            avgProcessingTime: { $avg: "$details.processingTime" },
            minProcessingTime: { $min: "$details.processingTime" },
            maxProcessingTime: { $max: "$details.processingTime" },
          },
        },
      ]);

      // Get monthly processing time breakdown for the current year
      const monthlyProcessingStats = await Audit.aggregate([
        {
          $match: {
            action: "PROCESS",
            entity: "PAYROLL",
            createdAt: { $gte: currentYearStart, $lte: currentYearEnd },
            "details.processingTime": { $exists: true, $ne: null },
            ...(departmentId ? { "details.departmentId": departmentId } : {}),
          },
        },
        {
          $group: {
            _id: { $month: "$createdAt" },
            count: { $sum: 1 },
            avgProcessingTime: { $avg: "$details.processingTime" },
            totalProcessingTime: { $sum: "$details.processingTime" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Get processing efficiency metrics
      const processingEfficiencyStats = await Audit.aggregate([
        {
          $match: {
            action: "PROCESS",
            entity: "PAYROLL",
            "details.processingTime": { $exists: true, $ne: null },
            ...(departmentId ? { "details.departmentId": departmentId } : {}),
          },
        },
        {
          $addFields: {
            efficiencyCategory: {
              $switch: {
                branches: [
                  {
                    case: { $lt: ["$details.processingTime", 2000] },
                    then: "excellent",
                  },
                  {
                    case: { $lt: ["$details.processingTime", 5000] },
                    then: "good",
                  },
                  {
                    case: { $lt: ["$details.processingTime", 10000] },
                    then: "average",
                  },
                ],
                default: "slow",
              },
            },
          },
        },
        {
          $group: {
            _id: "$efficiencyCategory",
            count: { $sum: 1 },
          },
        },
      ]);

      // Calculate rates
      const processingRate =
        totalPayrolls > 0 ? (processingPayrolls / totalPayrolls) * 100 : 0;
      const completionRate =
        totalPayrolls > 0 ? (completedPayrolls / totalPayrolls) * 100 : 0;
      const failureRate =
        totalPayrolls > 0 ? (failedPayrolls / totalPayrolls) * 100 : 0;
      const approvalRate =
        totalPayrolls > 0 ? (approvedPayrolls / totalPayrolls) * 100 : 0;
      const paymentRate =
        totalPayrolls > 0 ? (paidPayrolls / totalPayrolls) * 100 : 0;
      const pendingPaymentRate =
        totalPayrolls > 0 ? (pendingPaymentPayrolls / totalPayrolls) * 100 : 0;

      // Calculate total amounts with department filter
      const totalAmountApproved = await PayrollModel.aggregate([
        { $match: { ...baseQuery, status: PAYROLL_STATUS.APPROVED } },
        { $group: { _id: null, total: { $sum: "$totals.netPay" } } },
      ]);

      const totalAmountPaid = await PayrollModel.aggregate([
        { $match: { ...baseQuery, status: PAYROLL_STATUS.PAID } },
        { $group: { _id: null, total: { $sum: "$totals.netPay" } } },
      ]);

      const totalAmountPending = await PayrollModel.aggregate([
        { $match: { ...baseQuery, status: PAYROLL_STATUS.PENDING } },
        { $group: { _id: null, total: { $sum: "$totals.netPay" } } },
      ]);

      const totalAmountProcessing = await PayrollModel.aggregate([
        { $match: { ...baseQuery, status: PAYROLL_STATUS.PROCESSING } },
        { $group: { _id: null, total: { $sum: "$totals.netPay" } } },
      ]);

      const totalAmountPendingPayment = await PayrollModel.aggregate([
        { $match: { ...baseQuery, status: PAYROLL_STATUS.PENDING_PAYMENT } },
        { $group: { _id: null, total: { $sum: "$totals.netPay" } } },
      ]);

      // Extract processing time statistics
      const currentMonthStats = currentMonthProcessingStats[0] || {
        count: 0,
        totalProcessingTime: 0,
        avgProcessingTime: 0,
        minProcessingTime: 0,
        maxProcessingTime: 0,
      };

      const currentYearStats = currentYearProcessingStats[0] || {
        count: 0,
        totalProcessingTime: 0,
        avgProcessingTime: 0,
        minProcessingTime: 0,
        maxProcessingTime: 0,
      };

      // Convert efficiency stats to object
      const efficiencyBreakdown = {};
      processingEfficiencyStats.forEach((stat) => {
        efficiencyBreakdown[stat._id] = stat.count;
      });

      // Calculate last month's start and end
      const now = new Date();
      const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const lastMonthYear =
        now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const lastMonthStart = new Date(lastMonthYear, lastMonth, 1);
      const lastMonthEnd = new Date(
        lastMonthYear,
        lastMonth + 1,
        0,
        23,
        59,
        59
      );

      // Last month counts
      const approvedLastMonth = await PayrollModel.countDocuments({
        ...baseQuery,
        status: PAYROLL_STATUS.APPROVED,
        createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
      });
      const paidLastMonth = await PayrollModel.countDocuments({
        ...baseQuery,
        status: PAYROLL_STATUS.PAID,
        createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
      });
      const completedLastMonth = await PayrollModel.countDocuments({
        ...baseQuery,
        status: PAYROLL_STATUS.COMPLETED,
        createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
      });

      // This month counts (NO redeclaration!)
      const approvedThisMonth = await PayrollModel.countDocuments({
        ...baseQuery,
        status: PAYROLL_STATUS.APPROVED,
        createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd },
      });
      const paidThisMonth = await PayrollModel.countDocuments({
        ...baseQuery,
        status: PAYROLL_STATUS.PAID,
        createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd },
      });
      const completedThisMonth = await PayrollModel.countDocuments({
        ...baseQuery,
        status: PAYROLL_STATUS.COMPLETED,
        createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd },
      });

      return {
        totalPayrolls,
        processingPayrolls,
        completedPayrolls,
        failedPayrolls,
        approvedPayrolls,
        paidPayrolls,
        pendingPaymentPayrolls,
        recentActivityCount,
        processingRate,
        completionRate,
        failureRate,
        approvalRate,
        paymentRate,
        pendingPaymentRate,
        totalAmountApproved: totalAmountApproved[0]?.total || 0,
        totalAmountPaid: totalAmountPaid[0]?.total || 0,
        totalAmountPending: totalAmountPending[0]?.total || 0,
        totalAmountProcessing: totalAmountProcessing[0]?.total || 0,
        totalAmountPendingPayment: totalAmountPendingPayment[0]?.total || 0,
        processingTime: {
          currentMonth: {
            count: currentMonthStats.count,
            average: Math.round(currentMonthStats.avgProcessingTime || 0),
            total: currentMonthStats.totalProcessingTime || 0,
            min: currentMonthStats.minProcessingTime || 0,
            max: currentMonthStats.maxProcessingTime || 0,
          },
          currentYear: {
            count: currentYearStats.count,
            average: Math.round(currentYearStats.avgProcessingTime || 0),
            total: currentYearStats.totalProcessingTime || 0,
            min: currentYearStats.minProcessingTime || 0,
            max: currentYearStats.maxProcessingTime || 0,
          },
          monthlyBreakdown: monthlyProcessingStats.map((stat) => ({
            month: stat._id,
            monthName: new Date(currentYear, stat._id - 1).toLocaleString(
              "default",
              { month: "long" }
            ),
            count: stat.count,
            average: Math.round(stat.avgProcessingTime || 0),
            total: stat.totalProcessingTime || 0,
          })),
          efficiencyBreakdown,
        },
        lastMonth: {
          approved: approvedLastMonth,
          paid: paidLastMonth,
          completed: completedLastMonth,
        },
        thisMonth: {
          approved: approvedThisMonth,
          paid: paidThisMonth,
          completed: completedThisMonth,
        },
      };
    } catch (error) {
      console.error("Error calculating processing statistics:", error);
      throw error;
    }
  }

  /**
   * Check if employee is eligible for payroll processing based on onboarding status
   * @param {string} employeeId - Employee ID to check
   * @returns {Object} - { eligible: boolean, reason: string }
   */
  static async checkOnboardingEligibility(employeeId) {
    try {
      const employee = await UserModel.findById(employeeId)
        .select("firstName lastName onboarding status")
        .lean();

      if (!employee) {
        return { eligible: false, reason: "Employee not found" };
      }

      // If employee is not active, not eligible
      if (employee.status !== "active") {
        return { eligible: false, reason: "Employee is not active" };
      }

      // If no onboarding data exists, consider eligible (backward compatibility)
      if (!employee.onboarding) {
        return { eligible: true, reason: "No onboarding data (legacy user)" };
      }

      // If onboarding is completed, eligible
      if (employee.onboarding.status === "completed") {
        return { eligible: true, reason: "Onboarding completed" };
      }

      // If onboarding is not completed, not eligible
      return {
        eligible: false,
        reason: `Employee ${employee.firstName} ${employee.lastName} must complete onboarding before payroll can be processed`,
      };
    } catch (error) {
      console.error("Error checking onboarding eligibility:", error);
      return { eligible: false, reason: "Error checking eligibility" };
    }
  }
}
