import { ApiError } from "../utils/errorHandler.js";
import { Types } from "mongoose";
import { PAYROLL_STATUS } from "../models/Payroll.js";

// Keep this simple validation for basic request checking
export const validatePayrollCreate = (req, res, next) => {
  try {
    const { employee, month, year, salaryGrade } = req.body;

    // Check required fields
    if (!employee || !month || !year || !salaryGrade) {
      throw new ApiError(400, "Missing required fields");
    }

    // Validate ID formats
    if (!Types.ObjectId.isValid(employee)) {
      throw new ApiError(400, "Invalid employee ID format");
    }

    if (!Types.ObjectId.isValid(salaryGrade)) {
      throw new ApiError(400, "Invalid salary grade ID format");
    }

    // Basic month/year validation
    if (month < 1 || month > 12) {
      throw new ApiError(400, "Month must be between 1 and 12");
    }

    const currentYear = new Date().getFullYear();
    if (year < currentYear - 1 || year > currentYear + 1) {
      throw new ApiError(400, "Year is out of valid range");
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const validatePayrollStatus = (req, res, next) => {
  const { status } = req.body;

  if (!status) {
    throw new ApiError(400, "Status is required");
  }

  if (!Object.values(PAYROLL_STATUS).includes(status)) {
    throw new ApiError(
      400,
      `Invalid payroll status. Must be one of: ${Object.values(
        PAYROLL_STATUS
      ).join(", ")}`
    );
  }

  next();
};

export const validatePayrollUpdate = (req, res, next) => {
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

export const validateEmployeePayrollHistory = (req, res, next) => {
  try {
    const { employeeId } = req.params;

    if (!employeeId) {
      throw new ApiError(400, "Employee ID is required");
    }

    if (!Types.ObjectId.isValid(employeeId)) {
      throw new ApiError(400, "Invalid employee ID format");
    }

    next();
  } catch (error) {
    next(error);
  }
};
