import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import UserModel from "../models/User.js";
import PayrollModel, { PayrollStatus } from "../models/Payroll.js";
import { Permission, UserRole } from "../models/User.js";
import { PermissionChecker } from "../utils/permissionUtils.js";
import { Types } from "mongoose";
import { handleError, ApiError } from "../utils/errorHandler.js";

export class AdminController {
  // Get all users in admin's department
  static async getDepartmentUsers(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
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

  // Create a new user in admin's department
  static async createDepartmentUser(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
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
        createdBy: req.user.id,
      };

      const user = await UserModel.create(userData);
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

  // Update a user in admin's department
  static async updateDepartmentUser(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
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

  // Get department payroll records
  static async getDepartmentPayroll(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
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

  // Create payroll record for department user
  static async createDepartmentPayroll(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
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
        status: PayrollStatus.PENDING,
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

  // Update payroll record for department user
  static async updateDepartmentPayroll(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
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

      if (payroll.status === PayrollStatus.APPROVED) {
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
}
