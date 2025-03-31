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

const asObjectId = (id) => new Types.ObjectId(id);

export class PayrollService {
  static async validateAndGetEmployee(employeeId) {
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
    if (allowance.calculationMethod === "percentage") {
      const base = allowance.baseAmount || basicSalary;
      return (base * allowance.value) / 100;
    }
    return allowance.value;
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

  static getMonthPeriod(month, year) {
    // Create dates in UTC to avoid timezone issues
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    return { startDate, endDate };
  }

  static async calculatePayroll(
    employeeId,
    salaryGradeId,
    month,
    year,
    frequency = PayrollFrequency.MONTHLY
  ) {
    try {
      console.log("🧮 Calculating payroll for:", {
        employeeId,
        month,
        year,
        frequency,
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

      // Check for existing payroll
      const existingPayroll = await PayrollModel.findOne({
        employee: employeeId,
        month,
        year,
        frequency,
      });

      if (existingPayroll) {
        throw new ApiError(
          400,
          `Payroll record already exists for employee in ${month}/${year} with ${frequency} frequency`
        );
      }

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

      // Process grade-specific components
      const components = [];
      let totalAllowances = 0;

      if (salaryGrade.components && salaryGrade.components.length > 0) {
        console.log("\n📋 Processing salary grade components:", {
          totalComponents: salaryGrade.components.length,
          components: salaryGrade.components.map((c) => ({
            name: c.name,
            type: c.type,
            calculationMethod: c.calculationMethod,
            value: c.value,
            isActive: c.isActive,
          })),
        });

        salaryGrade.components
          .filter((comp) => comp.isActive)
          .forEach((comp) => {
            console.log(`\n🔍 Processing component: ${comp.name}`);
            console.log("Component details:", {
              type: comp.type,
              calculationMethod: comp.calculationMethod,
              value: comp.value,
              isActive: comp.isActive,
            });

            const amount =
              comp.calculationMethod === "percentage"
                ? (basicSalary * comp.value) / 100
                : comp.value;

            console.log(`Calculated amount: ₦${amount.toLocaleString()}`);

            components.push({
              name: comp.name,
              type: comp.type,
              value: comp.value,
              calculationMethod: comp.calculationMethod,
              amount: amount,
              isActive: true,
            });

            if (comp.type === "allowance") {
              totalAllowances += amount;
            }
          });
      }

      // Calculate gross salary first
      const grossSalary = this.roundToKobo(basicSalary + totalAllowances);
      console.log("\n💰 Gross Salary Calculation:", {
        basicSalary,
        totalAllowances,
        grossSalary,
      });

      // Calculate bonuses for the period
      const bonusDetails = await this.calculateBonuses(
        employeeId,
        startDate,
        endDate
      );

      // Calculate deductions
      const deductionDetails =
        await DeductionService.calculateStatutoryDeductions(
          basicSalary,
          grossSalary
        );

      // Calculate tax rate (PAYE)
      const taxRate =
        grossSalary > 0
          ? Number(((deductionDetails.paye / grossSalary) * 100).toFixed(2))
          : 0;

      console.log("\n✅ Payroll calculation completed:", {
        basicSalary,
        totalAllowances,
        totalBonuses: bonusDetails.totalBonuses || 0,
        totalDeductions: deductionDetails.total,
        grossSalary,
        netSalary: grossSalary - deductionDetails.total,
        taxRate,
      });

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
        basicSalary,
        components: components.map((c) => ({
          name: c.name,
          type: c.type,
          value: c.value,
          amount: c.amount,
          calculationMethod: c.calculationMethod,
          isActive: c.isActive,
        })),
        earnings: {
          overtime: { hours: 0, rate: 0, amount: 0 },
          bonus: bonusDetails.items || [],
          totalEarnings: grossSalary,
        },
        deductions: {
          tax: {
            taxableAmount: grossSalary,
            taxRate: taxRate,
            amount: this.roundToKobo(deductionDetails.paye),
          },
          pension: {
            pensionableAmount: basicSalary,
            rate: 8,
            amount: this.roundToKobo(deductionDetails.pension),
          },
          nhf: {
            pensionableAmount: basicSalary,
            rate: 2.5,
            amount: this.roundToKobo(deductionDetails.nhf),
          },
          loans: [],
          others: [],
          totalDeductions: this.roundToKobo(deductionDetails.total),
        },
        totals: {
          basicSalary,
          totalAllowances,
          totalBonuses: bonusDetails.totalBonuses || 0,
          grossEarnings: grossSalary,
          totalDeductions: this.roundToKobo(deductionDetails.total),
          netPay: this.roundToKobo(grossSalary - deductionDetails.total),
        },
        allowances: {
          gradeAllowances: components
            .filter((c) => c.type === "allowance")
            .map((c) => ({
              name: c.name,
              type: c.type,
              value: c.value,
              amount: c.amount,
              calculationMethod: c.calculationMethod,
              isActive: c.isActive,
            })),
          additionalAllowances: [],
          totalAllowances,
        },
        bonuses: {
          items: bonusDetails.items || [],
          totalBonuses: bonusDetails.totalBonuses || 0,
        },
        frequency,
        periodStart: startDate,
        periodEnd: endDate,
        status: PAYROLL_STATUS.PENDING,
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
}
