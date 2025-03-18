import { Types } from "mongoose";
import { ApiError } from "../utils/errorHandler.js";
import PayrollModel, { PayrollStatus } from "../models/Payroll.js";
import UserModel from "../models/User.js";
import {
  PayrollAllowances,
  PayrollDeductions,
  IEmployee,
  PayrollCalculation,
  BulkPayrollResult,
  BulkPayrollError,
} from "../types/payroll.js";

export class PayrollService {
  // Calculate components
  private static calculateAllowances(allowances: PayrollAllowances): number {
    return Object.values(allowances).reduce<number>((sum, value) => {
      return sum + (typeof value === "number" ? value : 0);
    }, 0);
  }

  private static calculateDeductions(deductions: PayrollDeductions): number {
    return Object.values(deductions).reduce<number>((sum, value) => {
      return sum + (typeof value === "number" ? value : 0);
    }, 0);
  }

  private static calculateTax(grossSalary: number): number {
    // Implement tax calculation logic based on your requirements
    // This is a simple example - replace with your actual tax calculation
    if (grossSalary <= 30000) return grossSalary * 0.05;
    if (grossSalary <= 50000) return grossSalary * 0.1;
    return grossSalary * 0.15;
  }

  // Validate payroll data
  private static async validatePayrollData(data: {
    employee: Types.ObjectId | string;
    month: number;
    year: number;
    basicSalary: number;
    allowances: PayrollAllowances;
    deductions: PayrollDeductions;
  }): Promise<IEmployee> {
    const { employee, month, year } = data;

    const employeeData = await UserModel.findById(employee)
      .populate("department", "name code")
      .lean();

    if (!employeeData) {
      throw new ApiError(400, "Invalid employee ID");
    }

    const typedEmployee = employeeData as unknown as IEmployee;

    if (!typedEmployee.bankDetails) {
      throw new ApiError(400, "Employee bank details not found");
    }

    // Validate month and year
    if (month < 1 || month > 12) {
      throw new ApiError(400, "Invalid month value");
    }

    const currentYear = new Date().getFullYear();
    if (year < currentYear - 1 || year > currentYear + 1) {
      throw new ApiError(400, "Invalid year value");
    }

    // Check for existing payroll
    const existingPayroll = await PayrollModel.findOne({
      employee,
      month,
      year,
    });

    if (existingPayroll) {
      throw new ApiError(400, "Payroll record already exists for this period");
    }

    return typedEmployee;
  }

  // Calculate payroll
  public static async calculatePayroll(data: {
    employee: Types.ObjectId | string;
    month: number;
    year: number;
    basicSalary: number;
    allowances: PayrollAllowances;
    deductions: PayrollDeductions;
  }): Promise<{
    employeeData: IEmployee;
    calculations: PayrollCalculation;
  }> {
    // Validate data first
    const employeeData = await this.validatePayrollData(data);

    const { basicSalary, allowances, deductions } = data;

    // Calculate components
    const totalAllowances = this.calculateAllowances(allowances);
    const grossSalary = basicSalary + totalAllowances;

    // Calculate deductions including tax
    const tax = this.calculateTax(grossSalary);
    const totalDeductions = this.calculateDeductions({
      ...deductions,
      tax,
    });

    const netSalary = grossSalary - totalDeductions;

    return {
      employeeData,
      calculations: {
        basicSalary,
        allowances,
        totalAllowances,
        grossSalary,
        deductions: {
          ...deductions,
          tax,
        },
        totalDeductions,
        netSalary,
      },
    };
  }

  // Generate payslip
  public static async generatePayslip(payrollId: string) {
    const payroll = await PayrollModel.findById(payrollId)
      .populate([
        {
          path: "employee",
          select: "firstName lastName employeeId bankDetails",
        },
        {
          path: "department",
          select: "name code",
        },
      ])
      .lean();

    if (!payroll) {
      throw new ApiError(404, "Payroll record not found");
    }

    const typedPayroll = payroll as unknown as {
      employee: IEmployee;
      department: IEmployee["department"];
    };

    // Format payslip data
    const payslipData = {
      employeeInfo: {
        name: `${typedPayroll.employee.firstName} ${typedPayroll.employee.lastName}`,
        employeeId: typedPayroll.employee.employeeId,
        department: typedPayroll.department.name,
        bankDetails: typedPayroll.employee.bankDetails,
      },
      payrollInfo: {
        month: payroll.month,
        year: payroll.year,
        payrollId: payroll._id,
      },
      earnings: {
        basicSalary: payroll.basicSalary,
        allowances: payroll.allowances,
        grossSalary: payroll.grossSalary,
      },
      deductions: {
        ...payroll.deductions,
        totalDeductions: Object.values(payroll.deductions).reduce(
          (sum, val) => sum + val,
          0
        ),
      },
      netSalary: payroll.netSalary,
      generatedAt: new Date(),
    };

    return payslipData;
  }

  // Process bulk payroll
  public static async processBulkPayroll(
    departmentId: string,
    month: number,
    year: number
  ): Promise<BulkPayrollResult> {
    const rawEmployees = await UserModel.find({
      department: departmentId,
      status: "active",
    })
      .populate("department", "name code")
      .lean();

    const employees = rawEmployees as unknown as IEmployee[];

    const payrollResults: Array<{
      employeeData: IEmployee;
      calculations: PayrollCalculation;
    }> = [];
    const errors: BulkPayrollError[] = [];

    for (const employee of employees) {
      try {
        const payrollData = {
          employee: employee._id,
          month,
          year,
          basicSalary: employee.salary || 0,
          allowances: employee.allowances || {
            housing: 0,
            transport: 0,
            meal: 0,
            other: 0,
          },
          deductions: employee.deductions || {
            pension: 0,
            loan: 0,
            other: 0,
          },
        };

        const calculatedPayroll = await this.calculatePayroll(payrollData);
        payrollResults.push(calculatedPayroll);
      } catch (error: any) {
        errors.push({
          employee: employee._id,
          error: error.message || "Unknown error occurred",
        });
      }
    }

    return {
      processed: payrollResults.length,
      failed: errors.length,
      payrollResults,
      errors,
    };
  }
}
