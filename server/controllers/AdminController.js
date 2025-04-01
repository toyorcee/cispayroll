import UserModel from "../models/User.js";
import PayrollModel from "../models/Payroll.js";
import { Permission, UserRole } from "../models/User.js";
import { PAYROLL_STATUS } from "../models/Payroll.js";
import { PermissionChecker } from "../utils/permissionUtils.js";
import { Types } from "mongoose";
import { handleError, ApiError } from "../utils/errorHandler.js";
import { AuthService } from "../services/authService.js";
import Allowance from "../models/Allowance.js";
import { AllowanceStatus } from "../models/Allowance.js";
import Deduction from "../models/Deduction.js";
import { DeductionService } from "../services/DeductionService.js";
import { DeductionType, DeductionScope } from "../models/Deduction.js";

export class AdminController {
  // ===== User Management Methods =====
  static async getDepartmentUsers(req, res, next) {
    try {
      const admin = await UserModel.findById(req.user.id);
      if (!admin?.department) {
        throw new ApiError(400, "Admin is not assigned to any department");
      }

      const users = await UserModel.find({
        department: admin.department,
        role: UserRole.USER,
      })
        .select("-password")
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        users,
        count: users.length,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async createDepartmentUser(req, res, next) {
    try {
      if (!PermissionChecker.hasPermission(req.user, Permission.CREATE_USER)) {
        throw new ApiError(403, "Not authorized to create users");
      }

      const admin = await UserModel.findById(req.user.id);
      if (!admin?.department) {
        throw new ApiError(400, "Admin is not assigned to any department");
      }

      const userData = {
        ...req.body,
        department: admin.department,
        role: UserRole.USER,
        isEmailVerified: true,
        createdBy: req.user.id,
      };

      const { user } = await AuthService.createUser(userData);

      res.status(201).json({
        success: true,
        message: "User created successfully",
        user,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async updateDepartmentUser(req, res, next) {
    try {
      if (!PermissionChecker.hasPermission(req.user, Permission.EDIT_USER)) {
        throw new ApiError(403, "Not authorized to update users");
      }

      const admin = await UserModel.findById(req.user.id);
      const userToUpdate = await UserModel.findById(req.params.id);

      if (!admin?.department || !userToUpdate) {
        throw new ApiError(404, "User or department not found");
      }

      if (
        userToUpdate.department?.toString() !== admin.department?.toString()
      ) {
        throw new ApiError(403, "Cannot update user from another department");
      }

      if (req.body.role && req.body.role !== UserRole.USER) {
        throw new ApiError(400, "Cannot change user role");
      }

      if (req.body.department && req.body.department !== admin.department) {
        throw new ApiError(400, "Cannot change user's department");
      }

      const updatedUser = await UserModel.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          department: admin.department,
          updatedBy: req.user.id,
        },
        { new: true, runValidators: true }
      ).select("-password");

      res.status(200).json({
        success: true,
        message: "User updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  // ===== Payroll Management Methods =====
  static async getDepartmentPayroll(req, res, next) {
    try {
      if (
        !PermissionChecker.hasPermission(
          req.user,
          Permission.VIEW_DEPARTMENT_PAYROLL
        )
      ) {
        throw new ApiError(403, "Not authorized to view department payroll");
      }

      const admin = await UserModel.findById(req.user.id);
      if (!admin?.department) {
        throw new ApiError(400, "Admin is not assigned to any department");
      }

      const payroll = await PayrollModel.find({
        department: new Types.ObjectId(admin.department),
      })
        .populate([
          { path: "employee", select: "firstName lastName employeeId" },
          { path: "approvedBy", select: "firstName lastName" },
        ])
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        payroll,
        count: payroll.length,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async createDepartmentPayroll(req, res, next) {
    try {
      if (
        !PermissionChecker.hasPermission(req.user, Permission.CREATE_PAYROLL)
      ) {
        throw new ApiError(403, "Not authorized to create payroll records");
      }

      const admin = await UserModel.findById(req.user.id);
      if (!admin?.department) {
        throw new ApiError(400, "Admin is not assigned to any department");
      }

      const employee = await UserModel.findById(req.body.employee);
      if (!employee || employee.department !== admin.department) {
        throw new ApiError(
          400,
          "Invalid employee or employee not in your department"
        );
      }

      const payrollData = {
        ...req.body,
        department: new Types.ObjectId(admin.department),
        createdBy: new Types.ObjectId(req.user.id),
        status: PAYROLL_STATUS.PENDING,
      };

      const payroll = await PayrollModel.create(payrollData);
      await payroll.populate([
        { path: "employee", select: "firstName lastName employeeId" },
        { path: "createdBy", select: "firstName lastName" },
      ]);

      res.status(201).json({
        success: true,
        message: "Payroll record created successfully",
        payroll,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async updateDepartmentPayroll(req, res, next) {
    try {
      if (!PermissionChecker.hasPermission(req.user, Permission.EDIT_PAYROLL)) {
        throw new ApiError(403, "Not authorized to update payroll records");
      }

      const admin = await UserModel.findById(req.user.id);
      if (!admin?.department) {
        throw new ApiError(400, "Admin is not assigned to any department");
      }

      const payroll = await PayrollModel.findById(req.params.id);
      if (
        !payroll ||
        payroll.department.toString() !== admin.department.toString()
      ) {
        throw new ApiError(
          404,
          "Payroll record not found or not in your department"
        );
      }

      if (payroll.status === PAYROLL_STATUS.APPROVED) {
        throw new ApiError(400, "Cannot update approved payroll record");
      }

      const updatedPayroll = await PayrollModel.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          department: new Types.ObjectId(admin.department),
          updatedBy: new Types.ObjectId(req.user.id),
        },
        { new: true, runValidators: true }
      ).populate([
        { path: "employee", select: "firstName lastName employeeId" },
        { path: "updatedBy", select: "firstName lastName" },
      ]);

      res.status(200).json({
        success: true,
        message: "Payroll record updated successfully",
        payroll: updatedPayroll,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  // ===== Salary Structure & Allowances Management =====
  static async getDepartmentAllowances(req, res) {
    try {
      if (
        !PermissionChecker.hasPermission(req.user, Permission.VIEW_ALLOWANCES)
      ) {
        throw new ApiError(403, "Not authorized to view allowances");
      }

      const allowances = await Allowance.find({
        department: req.user.department,
        scope: { $in: ["department", "grade"] },
      })
        .populate("department", "name")
        .populate("salaryGrade", "level basicSalary")
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: allowances,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async createDepartmentAllowance(req, res) {
    try {
      if (
        !PermissionChecker.hasPermission(req.user, Permission.CREATE_ALLOWANCES)
      ) {
        throw new ApiError(403, "Not authorized to create allowances");
      }

      const allowance = await Allowance.create({
        ...req.body,
        department: req.user.department,
        scope: "department",
        createdBy: req.user._id,
        updatedBy: req.user._id,
      });

      res.status(201).json({
        success: true,
        data: allowance,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async getAllowanceDetails(req, res) {
    try {
      if (
        !PermissionChecker.hasPermission(req.user, Permission.VIEW_ALLOWANCES)
      ) {
        throw new ApiError(403, "Not authorized to view allowance details");
      }

      const allowance = await Allowance.findOne({
        _id: req.params.id,
        department: req.user.department,
      })
        .populate("department", "name")
        .populate("salaryGrade", "level basicSalary")
        .populate("createdBy", "firstName lastName")
        .populate("updatedBy", "firstName lastName");

      if (!allowance) {
        return res.status(404).json({
          success: false,
          error: "Allowance not found",
        });
      }

      res.status(200).json({
        success: true,
        data: allowance,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async updateDepartmentAllowance(req, res) {
    try {
      if (
        !PermissionChecker.hasPermission(req.user, Permission.EDIT_ALLOWANCES)
      ) {
        throw new ApiError(403, "Not authorized to update allowances");
      }

      const allowance = await Allowance.findOneAndUpdate(
        {
          _id: req.params.id,
          department: req.user.department,
          scope: "department",
        },
        {
          ...req.body,
          updatedBy: req.user._id,
        },
        { new: true, runValidators: true }
      );

      if (!allowance) {
        return res.status(404).json({
          success: false,
          error: "Allowance not found",
        });
      }

      res.status(200).json({
        success: true,
        data: allowance,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async approveAllowance(req, res) {
    try {
      if (
        !PermissionChecker.hasPermission(
          req.user,
          Permission.APPROVE_ALLOWANCES
        )
      ) {
        throw new ApiError(403, "Not authorized to approve allowances");
      }

      const allowance = await Allowance.findOneAndUpdate(
        {
          _id: req.params.id,
          department: req.user.department,
        },
        {
          status: AllowanceStatus.APPROVED,
          approvedBy: req.user._id,
          approvedAt: Date.now(),
          updatedBy: req.user._id,
        },
        { new: true, runValidators: true }
      );

      if (!allowance) {
        return res.status(404).json({
          success: false,
          error: "Allowance not found",
        });
      }

      res.status(200).json({
        success: true,
        data: allowance,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async rejectAllowance(req, res) {
    try {
      if (
        !PermissionChecker.hasPermission(
          req.user,
          Permission.APPROVE_ALLOWANCES
        )
      ) {
        throw new ApiError(403, "Not authorized to reject allowances");
      }

      const { rejectionReason } = req.body;

      const allowance = await Allowance.findOneAndUpdate(
        {
          _id: req.params.id,
          department: req.user.department,
        },
        {
          status: AllowanceStatus.REJECTED,
          rejectionReason,
          updatedBy: req.user._id,
        },
        { new: true, runValidators: true }
      );

      if (!allowance) {
        return res.status(404).json({
          success: false,
          error: "Allowance not found",
        });
      }

      res.status(200).json({
        success: true,
        data: allowance,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  // ===== Deduction Management Methods =====
  // Department Deductions
  static async createDepartmentDeduction(req, res) {
    try {
      const adminDepartmentId = req.user.department;
      const deductionData = {
        ...req.body,
        department: adminDepartmentId,
        scope: DeductionScope.DEPARTMENT,
        createdBy: req.user._id,
      };

      const deduction = await DeductionService.createDepartmentDeduction(
        req.user._id,
        adminDepartmentId,
        deductionData
      );

      res.status(201).json({
        success: true,
        message: "Department deduction created successfully",
        data: deduction,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async getDepartmentDeductions(req, res) {
    try {
      const adminDepartmentId = req.user.department;
      const deductions = await DeductionService.getDepartmentDeductions(
        adminDepartmentId
      );

      res.status(200).json({
        success: true,
        data: deductions,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async updateDepartmentDeduction(req, res) {
    try {
      if (
        !PermissionChecker.hasPermission(req.user, Permission.EDIT_DEDUCTIONS)
      ) {
        throw new ApiError(403, "Not authorized to update deductions");
      }

      const admin = await UserModel.findById(req.user.id);
      if (!admin?.department) {
        throw new ApiError(400, "Admin is not assigned to any department");
      }

      const deduction = await Deduction.findOne({
        _id: req.params.id,
        department: admin.department,
        type: "voluntary", // Only allow updating voluntary deductions
      });

      if (!deduction) {
        throw new ApiError(404, "Deduction not found");
      }

      // Validate new value if provided
      if (req.body.value !== undefined) {
        if (req.body.value < 0) {
          throw new ApiError(400, "Deduction value cannot be negative");
        }
        if (
          deduction.calculationMethod === "percentage" &&
          req.body.value > 100
        ) {
          throw new ApiError(400, "Percentage deduction cannot exceed 100%");
        }
      }

      // Validate dates if provided
      if (req.body.effectiveDate) {
        const effectiveDate = new Date(req.body.effectiveDate);
        if (effectiveDate < new Date()) {
          throw new ApiError(400, "Effective date cannot be in the past");
        }
      }

      if (req.body.expiryDate) {
        const expiryDate = new Date(req.body.expiryDate);
        const effectiveDate = req.body.effectiveDate
          ? new Date(req.body.effectiveDate)
          : deduction.effectiveDate;
        if (expiryDate <= effectiveDate) {
          throw new ApiError(400, "Expiry date must be after effective date");
        }
      }

      // Store previous values for history
      const historyEntry = {
        previousValue: deduction.value,
        newValue: req.body.value,
        updatedBy: req.user.id,
        updatedAt: new Date(),
        changes: req.body,
      };

      const updatedDeduction = await Deduction.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          updatedBy: req.user.id,
          $push: { history: historyEntry },
        },
        { new: true }
      ).populate([
        { path: "department", select: "name" },
        { path: "updatedBy", select: "firstName lastName" },
      ]);

      res.status(200).json({
        success: true,
        message: "Deduction updated successfully",
        data: updatedDeduction,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  // Employee Deduction Assignment
  static async assignDepartmentDeductionToEmployee(req, res) {
    try {
      const { deductionId, employeeId } = req.params;
      const adminDepartmentId = req.user.department;

      // Verify employee belongs to admin's department
      const employee = await UserModel.findOne({
        _id: employeeId,
        department: adminDepartmentId,
      });

      if (!employee) {
        throw new ApiError(
          403,
          "Cannot assign deduction to employee from different department"
        );
      }

      const deduction = await DeductionService.assignDeductionToEmployee(
        deductionId,
        employeeId,
        req.user._id
      );

      res.status(200).json({
        success: true,
        message: "Deduction assigned successfully",
        data: deduction,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async assignDepartmentDeductionToMultipleEmployees(req, res) {
    try {
      const { deductionId } = req.params;
      const { employeeIds } = req.body;
      const adminDepartmentId = req.user.department;

      // Verify all employees belong to admin's department
      const departmentEmployees = await UserModel.find({
        _id: { $in: employeeIds },
        department: adminDepartmentId,
      });

      if (departmentEmployees.length !== employeeIds.length) {
        throw new ApiError(
          403,
          "Some employees do not belong to your department"
        );
      }

      const result = await DeductionService.assignDeductionToMultipleEmployees(
        deductionId,
        employeeIds,
        req.user._id
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.deduction,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async removeDeductionFromEmployee(req, res) {
    try {
      const admin = await UserModel.findById(req.user.id).populate(
        "department"
      );
      if (!admin.department) {
        throw new ApiError(400, "Admin must be assigned to a department");
      }

      const { deductionId, employeeId } = req.params;

      // Verify the employee belongs to admin's department
      const employee = await UserModel.findOne({
        _id: employeeId,
        department: admin.department._id,
      });

      if (!employee) {
        throw new ApiError(404, "Employee not found in your department");
      }

      // Verify the deduction belongs to admin's department
      const deduction = await Deduction.findOne({
        _id: deductionId,
        department: admin.department._id,
      });

      if (!deduction) {
        throw new ApiError(404, "Deduction not found in your department");
      }

      const result = await DeductionService.removeDeductionFromEmployee(
        deductionId,
        employeeId,
        req.user.id
      );

      res.status(200).json({
        success: true,
        message: "Deduction removed successfully",
        data: result,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async getDepartmentEmployeeDeductions(req, res) {
    try {
      const admin = await UserModel.findById(req.user.id).populate(
        "department"
      );
      if (!admin.department) {
        throw new ApiError(400, "Admin must be assigned to a department");
      }

      const { employeeId } = req.params;

      // Verify employee belongs to admin's department
      const employee = await UserModel.findOne({
        _id: employeeId,
        department: admin.department._id,
      });

      if (!employee) {
        throw new ApiError(404, "Employee not found in your department");
      }

      const deductions = await DeductionService.getEmployeeDeductions(
        employeeId
      );

      res.status(200).json({
        success: true,
        data: deductions,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  // General Deduction Management
  static async getDeductionDetails(req, res) {
    try {
      if (
        !PermissionChecker.hasPermission(req.user, Permission.VIEW_DEDUCTIONS)
      ) {
        throw new ApiError(403, "Not authorized to view deduction details");
      }

      const admin = await UserModel.findById(req.user.id);
      if (!admin?.department) {
        throw new ApiError(400, "Admin is not assigned to any department");
      }

      const deduction = await Deduction.findOne({
        _id: req.params.id,
        department: admin.department,
        type: "voluntary", // Only show voluntary deductions
      })
        .populate("department", "name")
        .populate("createdBy", "firstName lastName")
        .populate("updatedBy", "firstName lastName");

      if (!deduction) {
        throw new ApiError(404, "Deduction not found");
      }

      res.status(200).json({
        success: true,
        data: deduction,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async toggleDeductionStatus(req, res) {
    try {
      if (
        !PermissionChecker.hasPermission(req.user, Permission.EDIT_DEDUCTIONS)
      ) {
        throw new ApiError(403, "Not authorized to toggle deduction status");
      }

      const admin = await UserModel.findById(req.user.id);
      if (!admin?.department) {
        throw new ApiError(400, "Admin is not assigned to any department");
      }

      const deduction = await Deduction.findOne({
        _id: req.params.id,
        department: admin.department,
        type: "voluntary", // Only allow toggling voluntary deductions
      });

      if (!deduction) {
        throw new ApiError(404, "Deduction not found");
      }

      deduction.isActive = !deduction.isActive;
      deduction.updatedBy = req.user.id;
      await deduction.save();

      res.status(200).json({
        success: true,
        message: `Deduction ${
          deduction.isActive ? "activated" : "deactivated"
        } successfully`,
        data: deduction,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async removeDepartmentDeductionFromMultipleEmployees(req, res) {
    try {
      const { deductionId } = req.params;
      const { employeeIds, reason } = req.body;
      const adminDepartmentId = req.user.department;

      if (!employeeIds || !Array.isArray(employeeIds)) {
        throw new ApiError(400, "Employee IDs array is required");
      }

      // Verify all employees belong to admin's department
      const departmentEmployees = await UserModel.find({
        _id: { $in: employeeIds },
        department: adminDepartmentId,
      });

      if (departmentEmployees.length !== employeeIds.length) {
        throw new ApiError(
          403,
          "Some employees do not belong to your department"
        );
      }

      // Verify the deduction belongs to admin's department
      const deduction = await Deduction.findOne({
        _id: deductionId,
        department: adminDepartmentId,
      });

      if (!deduction) {
        throw new ApiError(404, "Deduction not found in your department");
      }

      const result =
        await DeductionService.removeDeductionFromMultipleEmployees(
          deductionId,
          employeeIds,
          req.user._id,
          reason
        );

      res.status(200).json({
        success: true,
        message: "Deductions removed successfully",
        data: result,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async getDepartmentDeductionHistory(req, res) {
    try {
      const { deductionId } = req.params;
      const adminDepartmentId = req.user.department;

      // Verify the deduction belongs to admin's department
      const deduction = await Deduction.findOne({
        _id: deductionId,
        department: adminDepartmentId,
      }).populate({
        path: "assignmentHistory",
        populate: [
          {
            path: "employee",
            select: "firstName lastName employeeId",
          },
          {
            path: "by",
            select: "firstName lastName",
          },
        ],
      });

      if (!deduction) {
        throw new ApiError(404, "Deduction not found in your department");
      }

      res.status(200).json({
        success: true,
        data: deduction.assignmentHistory,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }
}
