import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/errorHandler.js";
import { Types } from "mongoose";
import { PayrollStatus } from "../types/payroll.js";

// Keep validation simple for now
export const validatePayrollCreate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("🔍 Validating payroll data:", req.body);

    const { employee, month, year, basicSalary, salaryGrade } = req.body;

    // Check required fields
    if (!employee || !month || !year || !basicSalary || !salaryGrade) {
      throw new ApiError(400, "Missing required fields");
    }

    // Validate IDs
    if (!Types.ObjectId.isValid(employee)) {
      throw new ApiError(400, "Invalid employee ID");
    }

    if (!Types.ObjectId.isValid(salaryGrade)) {
      throw new ApiError(400, "Invalid salary grade ID");
    }

    // Validate month and year
    if (month < 1 || month > 12) {
      throw new ApiError(400, "Invalid month");
    }

    const currentYear = new Date().getFullYear();
    if (year < currentYear - 1 || year > currentYear + 1) {
      throw new ApiError(400, "Invalid year");
    }

    // Validate amounts
    if (typeof basicSalary !== "number" || basicSalary <= 0) {
      throw new ApiError(400, "Basic salary must be a positive number");
    }

    console.log("✅ Validation passed");
    next();
  } catch (error) {
    console.error("❌ Validation error:", error);
    next(error);
  }
};

export const validatePayrollStatus = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { status } = req.body;

  if (!status) {
    throw new ApiError(400, "Status is required");
  }

  if (!Object.values(PayrollStatus).includes(status)) {
    throw new ApiError(
      400,
      `Invalid payroll status. Must be one of: ${Object.values(
        PayrollStatus
      ).join(", ")}`
    );
  }

  next();
};

export const validatePayrollUpdate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { basicSalary, components } = req.body;

  if (basicSalary && basicSalary < 0) {
    throw new ApiError(400, "Basic salary cannot be negative");
  }

  if (components) {
    if (!Array.isArray(components)) {
      throw new ApiError(400, "Components must be an array");
    }

    components.forEach((component, index) => {
      if (
        !component.name ||
        !component.type ||
        !component.value ||
        !component.calculationMethod
      ) {
        throw new ApiError(
          400,
          `Component at index ${index} is missing required fields`
        );
      }

      if (!["allowance", "deduction"].includes(component.type)) {
        throw new ApiError(
          400,
          `Invalid component type at index ${index}. Must be 'allowance' or 'deduction'`
        );
      }

      if (!["fixed", "percentage"].includes(component.calculationMethod)) {
        throw new ApiError(
          400,
          `Invalid calculation method at index ${index}. Must be 'fixed' or 'percentage'`
        );
      }

      if (component.value < 0) {
        throw new ApiError(
          400,
          `Component value cannot be negative at index ${index}`
        );
      }
    });
  }

  next();
};
