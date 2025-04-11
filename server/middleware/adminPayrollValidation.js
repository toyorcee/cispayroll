import { ApiError } from "../utils/errorHandler.js";
import { Types } from "mongoose";
import { PayrollFrequency } from "../models/Payroll.js";
import UserModel from "../models/User.js";
import SalaryGrade from "../models/SalaryStructure.js";

export const validateAdminSinglePayrollCreate = async (req, res, next) => {
  try {
    console.log("🔍 Validating admin single payroll data:", req.body);
    const {
      employeeId,
      month,
      year,
      frequency = PayrollFrequency.MONTHLY,
    } = req.body;

    // Check if admin is HR or department head
    const admin = await UserModel.findById(req.user.id);
    if (!admin) {
      throw new ApiError(404, "Admin not found");
    }

    const isHrRole =
      admin.role.toLowerCase() === "hr" ||
      admin.role.toLowerCase() === "human resources";

    const isHrPosition =
      admin.position?.toLowerCase().includes("head of") ||
      admin.position?.toLowerCase().includes("hod") ||
      admin.position?.toLowerCase().includes("hr manager") ||
      admin.position?.toLowerCase().includes("hrm");

    if (!isHrRole && !isHrPosition) {
      throw new ApiError(
        403,
        "Only HR personnel or Head of Department can create payrolls"
      );
    }

    // Check required fields
    if (!employeeId || !month || !year) {
      throw new ApiError(400, "Employee ID, month, and year are required");
    }

    // Validate employee ID format
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new ApiError(400, "Invalid employee ID format");
    }

    // Validate month (1-12)
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new ApiError(400, "Month must be between 1 and 12");
    }

    // Validate year
    const currentDate = new Date();
    if (
      year < currentDate.getFullYear() ||
      (year === currentDate.getFullYear() && month < currentDate.getMonth() + 1)
    ) {
      throw new ApiError(400, "Cannot create payroll for past dates");
    }

    // Validate frequency
    const validFrequencies = Object.values(PayrollFrequency).map((f) =>
      f.toLowerCase()
    );
    if (!validFrequencies.includes(frequency.toLowerCase())) {
      throw new ApiError(
        400,
        `Invalid frequency. Must be one of: ${validFrequencies.join(", ")}`
      );
    }

    // Get employee and check their grade level
    const employee = await UserModel.findById(employeeId);
    if (!employee) {
      throw new ApiError(404, "Employee not found");
    }

    if (!employee.gradeLevel) {
      throw new ApiError(400, "Employee does not have a grade level assigned");
    }

    // Find the corresponding salary grade
    const salaryGrade = await SalaryGrade.findOne({
      level: employee.gradeLevel,
      isActive: true,
    });

    if (!salaryGrade) {
      throw new ApiError(
        404,
        `No active salary grade found for level ${employee.gradeLevel}`
      );
    }

    // Add the salary grade ID to the request body
    req.body.salaryGrade = salaryGrade._id;

    console.log("✅ Admin single payroll validation passed");
    next();
  } catch (error) {
    console.error("❌ Admin single payroll validation failed:", error);
    next(error);
  }
};

export const validateAdminBulkPayrollCreate = async (req, res, next) => {
  try {
    const { employeeIds, month, year, frequency } = req.body;

    // Validate required fields
    if (
      !employeeIds ||
      !Array.isArray(employeeIds) ||
      employeeIds.length === 0
    ) {
      throw new ApiError(400, "Employee IDs array is required");
    }

    if (!month || !year) {
      throw new ApiError(400, "Month and year are required");
    }

    // Validate month format
    const monthNum = parseInt(month);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      throw new ApiError(400, "Month must be between 1 and 12");
    }

    // Validate year is not in the past
    const currentYear = new Date().getFullYear();
    if (year < currentYear) {
      throw new ApiError(400, "Cannot process payroll for past years");
    }

    // Validate frequency
    if (!frequency || !["monthly", "weekly", "biweekly"].includes(frequency)) {
      throw new ApiError(400, "Invalid payroll frequency");
    }

    // Validate each employee exists and has a grade level
    const employees = await UserModel.find({ _id: { $in: employeeIds } });

    if (employees.length !== employeeIds.length) {
      throw new ApiError(400, "One or more employees not found");
    }

    // Check each employee has a grade level and get their salary grades
    const employeeSalaryGrades = [];
    const errors = [];

    for (const employee of employees) {
      if (!employee.gradeLevel) {
        errors.push(
          `Employee ${employee.employeeId} does not have a grade level assigned`
        );
        continue;
      }

      // Find the corresponding salary grade
      const salaryGrade = await SalaryGrade.findOne({
        level: employee.gradeLevel,
        isActive: true,
      });

      if (!salaryGrade) {
        errors.push(
          `No active salary grade found for level ${employee.gradeLevel}`
        );
        continue;
      }

      employeeSalaryGrades.push({
        employeeId: employee._id,
        salaryGradeId: salaryGrade._id,
      });
    }

    // If we have errors but also have some valid employees, add the valid ones to the request
    if (errors.length > 0) {
      if (employeeSalaryGrades.length === 0) {
        // If no valid employees, throw an error with all the issues
        throw new ApiError(400, `Validation failed: ${errors.join(", ")}`);
      } else {
        // If we have some valid employees, add them to the request and add errors to the response
        req.body.employeeSalaryGrades = employeeSalaryGrades;
        req.body.validationErrors = errors;
        console.log(
          `⚠️ Partial validation: ${errors.length} employees failed validation, ${employeeSalaryGrades.length} passed`
        );
      }
    } else {
      // All employees passed validation
      req.body.employeeSalaryGrades = employeeSalaryGrades;
    }

    next();
  } catch (error) {
    console.error("❌ Admin bulk payroll validation failed:", error);
    next(error);
  }
};

export const validateAdminPayrollSubmission = (req, res, next) => {
  try {
    const { month, year, remarks } = req.body;

    if (!month || !year) {
      throw new ApiError(400, "Month and year are required");
    }

    // Validate month (1-12)
    if (month < 1 || month > 12) {
      throw new ApiError(400, "Invalid month");
    }

    // Validate year
    const currentYear = new Date().getFullYear();
    if (year < currentYear - 1 || year > currentYear) {
      throw new ApiError(400, "Invalid year");
    }

    // Validate remarks if provided
    if (remarks && typeof remarks !== "string") {
      throw new ApiError(400, "Remarks must be a string");
    }

    if (remarks && remarks.length > 500) {
      throw new ApiError(400, "Remarks cannot exceed 500 characters");
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const validateAdminDepartmentPayrollCreate = async (req, res, next) => {
  try {
    const { month, year, frequency } = req.body;

    // Validate required fields
    if (!month || !year) {
      throw new ApiError(400, "Month and year are required");
    }

    // Validate month format
    const monthNum = parseInt(month);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      throw new ApiError(400, "Month must be between 1 and 12");
    }

    // Validate year is not in the past
    const currentYear = new Date().getFullYear();
    if (year < currentYear) {
      throw new ApiError(400, "Cannot process payroll for past years");
    }

    // Validate frequency
    if (!frequency || !["monthly", "weekly", "biweekly"].includes(frequency)) {
      throw new ApiError(400, "Invalid payroll frequency");
    }

    // Get admin's department
    const admin = await UserModel.findById(req.user._id).select("department");
    if (!admin?.department) {
      throw new ApiError(400, "Admin must be assigned to a department");
    }

    // Get all active employees in the department
    const employees = await UserModel.find({
      department: admin.department,
      status: "active",
      role: "employee",
    }).select("employeeId firstName lastName email gradeLevel bankDetails");

    if (!employees.length) {
      throw new ApiError(404, "No active employees found in department");
    }

    // Check each employee has a grade level and get their salary grades
    const employeeSalaryGrades = [];
    const errors = [];

    for (const employee of employees) {
      if (!employee.gradeLevel) {
        errors.push(
          `Employee ${employee.employeeId} does not have a grade level assigned`
        );
        continue;
      }

      // Find the corresponding salary grade
      const salaryGrade = await SalaryGrade.findOne({
        level: employee.gradeLevel,
        isActive: true,
      });

      if (!salaryGrade) {
        errors.push(
          `No active salary grade found for level ${employee.gradeLevel}`
        );
        continue;
      }

      employeeSalaryGrades.push({
        employeeId: employee._id,
        salaryGradeId: salaryGrade._id,
      });
    }

    // If we have errors but also have some valid employees, add the valid ones to the request
    if (errors.length > 0) {
      if (employeeSalaryGrades.length === 0) {
        // If no valid employees, throw an error with all the issues
        throw new ApiError(400, `Validation failed: ${errors.join(", ")}`);
      } else {
        // If we have some valid employees, add them to the request and add errors to the response
        req.body.employeeSalaryGrades = employeeSalaryGrades;
        req.body.validationErrors = errors;
        console.log(
          `⚠️ Partial validation: ${errors.length} employees failed validation, ${employeeSalaryGrades.length} passed`
        );
      }
    } else {
      // All employees passed validation
      req.body.employeeSalaryGrades = employeeSalaryGrades;
    }

    next();
  } catch (error) {
    console.error("❌ Admin department payroll validation failed:", error);
    next(error);
  }
};
