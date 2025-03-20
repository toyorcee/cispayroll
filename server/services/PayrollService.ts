import { Types } from "mongoose";
import { ApiError } from "../utils/errorHandler.js";
import UserModel from "../models/User.js";
import PayrollModel from "../models/Payroll.js";
import { IEmployee, IDepartment } from "../types/payroll.js";

// Add interface for populated employee
interface PopulatedEmployee extends Omit<IEmployee, "department"> {
  department: IDepartment;
}

export class PayrollService {
  static async validateAndGetEmployee(
    employeeId: string | Types.ObjectId
  ): Promise<IEmployee> {
    console.log("🔍 Validating employee:", employeeId);

    const employee = await UserModel.findById(employeeId)
      .populate("department", "name code _id")
      .lean();

    if (!employee) {
      throw new ApiError(400, "Employee not found");
    }

    if (!employee.department || typeof employee.department === "string") {
      throw new ApiError(400, "Employee department information is missing");
    }

    console.log("✅ Employee found:", {
      id: employee._id,
      name: `${employee.firstName} ${employee.lastName}`,
      department: employee.department,
    });

    // First cast to unknown, then to our populated type
    return employee as unknown as IEmployee;
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
}
