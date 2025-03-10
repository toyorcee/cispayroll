import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import UserModel from "../models/User.js";
import PayrollModel from "../models/Payroll.js";
import LeaveModel, { LeaveStatus } from "../models/Leave.js";
import { handleError, ApiError } from "../utils/errorHandler.js";

export class RegularUserController {
  // Profile Management
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
        throw new ApiError(404, "User not found");
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  static async updateOwnProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      // Prevent updating sensitive fields
      const protectedFields = [
        "role",
        "permissions",
        "department",
        "employeeId",
      ];
      const updates = { ...req.body };

      protectedFields.forEach((field) => delete updates[field]);

      const user = await UserModel.findByIdAndUpdate(
        req.user.id,
        { $set: updates },
        { new: true, runValidators: true }
      ).select("-password");

      if (!user) {
        throw new ApiError(404, "User not found");
      }

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message,
      });
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
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message,
      });
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
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message,
      });
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
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message,
      });
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
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message,
      });
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
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }
}
