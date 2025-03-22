import { Types } from "mongoose";
import { ApiError } from "../utils/errorHandler.js";
import UserModel from "../models/User.js";
import PayrollModel from "../models/Payroll.js";
import SalaryGrade from "../models/SalaryStructure.js";
import { DeductionService } from "./DeductionService.js";
import { IEmployee, IDepartment } from "../types/payroll.js";
import { AllowanceService } from "./AllowanceService.js";
import { BonusService } from "./BonusService.js";

// Add interface for populated employee
interface PopulatedEmployee extends Omit<IEmployee, "department"> {
  department: IDepartment;
}

// Add this interface at the top with other interfaces
interface BonusItem {
  amount: number;
  type: string;
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
      startDate,
      endDate,
    };
  }

  static async calculateSalaryComponents(salaryGradeId: Types.ObjectId) {
    console.log("🧮 Calculating salary components for grade:", salaryGradeId);

    const salaryGrade = await SalaryGrade.findById(salaryGradeId);
    if (!salaryGrade) {
      throw new ApiError(404, "Salary grade not found");
    }

    // Calculate built-in allowances from components
    const totalComponentAllowances = salaryGrade.components.reduce(
      (total, component) => {
        if (component.isActive && component.type === "allowance") {
          const amount =
            component.calculationMethod === "percentage"
              ? (salaryGrade.basicSalary * component.value) / 100
              : component.value;
          return total + amount;
        }
        return total;
      },
      0
    );

    // Get additional allowances from AllowanceService
    const additionalAllowances = await AllowanceService.getAllAllowances({
      active: true,
      gradeLevel: salaryGrade.level.toString(),
    });

    // Calculate additional allowance amounts
    const additionalAllowanceDetails = additionalAllowances.map(
      (allowance) => ({
        name: allowance.name,
        amount: AllowanceService.calculateAllowanceAmount(
          salaryGrade.basicSalary,
          allowance
        ),
      })
    );

    const totalAdditionalAllowances = additionalAllowanceDetails.reduce(
      (sum, a) => sum + a.amount,
      0
    );

    // Total all allowances
    const totalAllowances =
      totalComponentAllowances + totalAdditionalAllowances;

    // Gross salary is basic salary plus all allowances
    const grossSalary = salaryGrade.basicSalary + totalAllowances;

    return {
      basicSalary: salaryGrade.basicSalary,
      totalAllowances,
      grossSalary,
      components: salaryGrade.components,
      additionalAllowances: additionalAllowanceDetails,
    };
  }

  static async calculateDeductions(basicSalary: number, grossSalary: number) {
    console.log("🧮 Calculating deductions for salary:", {
      basicSalary,
      grossSalary,
    });

    // Get all active deductions
    const deductions = await DeductionService.getActiveDeductions();

    // Calculate statutory deductions
    const statutoryDeductions = DeductionService.calculateStatutoryDeductions(
      basicSalary,
      grossSalary
    );

    // Calculate voluntary deductions
    const voluntaryDeductions = deductions.voluntary.reduce(
      (total, deduction) => {
        if (deduction.isActive) {
          return (
            total +
            DeductionService.calculateVoluntaryDeduction(basicSalary, deduction)
          );
        }
        return total;
      },
      0
    );

    const totalDeductions = statutoryDeductions.total + voluntaryDeductions;

    return {
      statutory: statutoryDeductions,
      voluntary: voluntaryDeductions,
      total: totalDeductions,
    };
  }

  static async calculatePayroll(
    employeeId: Types.ObjectId,
    salaryGradeId: Types.ObjectId,
    month: number,
    year: number
  ) {
    console.log("📊 Calculating payroll for:", {
      employeeId,
      salaryGradeId,
      month,
      year,
    });

    // Get salary components
    const salaryDetails = await this.calculateSalaryComponents(salaryGradeId);

    // Calculate deductions
    const deductionDetails = await this.calculateDeductions(
      salaryDetails.basicSalary,
      salaryDetails.grossSalary
    );

    // Get approved bonuses for this period
    const { startDate, endDate } = this.calculatePayPeriod(month, year);
    let bonusAmount = 0;
    let bonusItems: BonusItem[] = [];

    try {
      const bonuses = await BonusService.getAllBonuses({
        employee: employeeId,
        approvalStatus: "approved",
      });

      bonusItems = bonuses
        .filter((bonus) => {
          const bonusDate = new Date(bonus.createdAt);
          return bonusDate >= startDate && bonusDate <= endDate;
        })
        .map((bonus) => ({
          amount: bonus.amount,
          type: bonus.type,
        }));

      bonusAmount = bonusItems.reduce((sum, bonus) => sum + bonus.amount, 0);
    } catch (error) {
      console.error("Error fetching bonuses:", error);
      // Continue without bonuses if there's an error
    }

    // Calculate final salaries including bonuses
    const grossSalary = salaryDetails.grossSalary + bonusAmount;
    const netSalary = grossSalary - deductionDetails.total;

    return {
      basicSalary: salaryDetails.basicSalary,
      components: salaryDetails.components,
      grossSalary,
      deductions: deductionDetails,
      netSalary,
      bonuses: bonusItems,
      totalBonuses: bonusAmount,
    };
  }
}
