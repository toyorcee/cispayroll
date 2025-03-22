import { Response, NextFunction } from "express";
import { Types } from "mongoose";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { EmployeeService } from "../services/employeeService.js";
import { handleError, ApiError } from "../utils/errorHandler.js";
import UserModel from "../models/User.js";
import PayrollModel from "../models/Payroll.js";
import LeaveModel, { LeaveStatus } from "../models/Leave.js";
import { Multer } from "multer";
import { UserRole } from "../models/User.js";

export interface AuthenticatedRequestWithFile extends AuthenticatedRequest {
  file?: Express.Multer.File;
}

export class EmployeeController {
  // Admin/Super Admin creating an employee
  static async createEmployee(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { role = UserRole.USER, ...employeeData } = req.body;

      // Validate role creation permissions
      if (role === UserRole.ADMIN && req.user.role !== UserRole.SUPER_ADMIN) {
        throw new ApiError(403, "Only super admins can create admin accounts");
      }

      const creator = {
        _id: new Types.ObjectId(req.user.id),
        role: req.user.role,
        department: req.user.department
          ? new Types.ObjectId(req.user.department)
          : undefined,
      };

      // Pass the role to the service
      const { employee, invitationToken } =
        await EmployeeService.createEmployee(
          { ...employeeData, role },
          creator
        );

      // Customize message based on role
      const message = `${
        role === UserRole.ADMIN ? "Admin" : "Employee"
      } created successfully. Invitation sent.`;

      res.status(201).json({
        success: true,
        message,
        employee,
      });
    } catch (error) {
      next(error);
    }
  }

  // Employee viewing their own profile
  static async getOwnProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const user = await UserModel.findById(req.user.id)
        .select("-password")
        .populate("department", "name code");

      if (!user) {
        throw new ApiError(404, "Employee not found");
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  // Employee updating their own profile
  static async updateOwnProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const protectedFields = [
        "role",
        "permissions",
        "department",
        "employeeId",
        "status",
        "isEmailVerified",
      ];
      const updates = { ...req.body };

      protectedFields.forEach((field) => delete updates[field]);

      const user = await UserModel.findByIdAndUpdate(
        req.user.id,
        { $set: updates },
        { new: true, runValidators: true }
      ).select("-password");

      if (!user) {
        throw new ApiError(404, "Employee not found");
      }

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  // Payslip Management
  static async getOwnPayslips(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const payslips = await PayrollModel.find({
        employee: req.user.id,
        status: "APPROVED",
      })
        .populate("department", "name code")
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        payslips,
        count: payslips.length,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOwnPayslipById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const payslip = await PayrollModel.findOne({
        _id: req.params.id,
        employee: req.user.id,
        status: "APPROVED",
      }).populate([
        { path: "department", select: "name code" },
        { path: "approvedBy", select: "firstName lastName" },
      ]);

      if (!payslip) {
        throw new ApiError(404, "Payslip not found");
      }

      res.status(200).json({
        success: true,
        payslip,
      });
    } catch (error) {
      next(error);
    }
  }

  // Leave Management
  static async getOwnLeaveRequests(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const leaveRequests = await LeaveModel.find({
        employee: req.user.id,
      })
        .populate("approvedBy", "firstName lastName")
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        leaveRequests,
        count: leaveRequests.length,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createLeaveRequest(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const leaveRequest = await LeaveModel.create({
        ...req.body,
        employee: req.user.id,
        status: LeaveStatus.PENDING,
        createdBy: req.user.id,
        updatedBy: req.user.id,
      });

      await leaveRequest.populate("employee", "firstName lastName employeeId");

      res.status(201).json({
        success: true,
        message: "Leave request created successfully",
        leaveRequest,
      });
    } catch (error) {
      next(error);
    }
  }

  static async cancelLeaveRequest(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const leaveRequest = await LeaveModel.findOne({
        _id: req.params.id,
        employee: req.user.id,
      });

      if (!leaveRequest) {
        throw new ApiError(404, "Leave request not found");
      }

      if (leaveRequest.status !== LeaveStatus.PENDING) {
        throw new ApiError(400, "Can only cancel pending leave requests");
      }

      leaveRequest.status = LeaveStatus.CANCELLED;
      await leaveRequest.save();

      res.status(200).json({
        success: true,
        message: "Leave request cancelled successfully",
        leaveRequest,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfileImage(
    req: AuthenticatedRequestWithFile,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.file) {
        throw new ApiError(400, "No image file provided");
      }

      const user = await UserModel.findByIdAndUpdate(
        req.user.id,
        {
          $set: {
            profileImage: req.file.path,
          },
        },
        { new: true }
      ).select("-password");

      if (!user) {
        throw new ApiError(404, "Employee not found");
      }

      res.status(200).json({
        success: true,
        message: "Profile image updated successfully",
        profileImage: user.profileImage,
      });
    } catch (error) {
      next(error);
    }
  }
}
