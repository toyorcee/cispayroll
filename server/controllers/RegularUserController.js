import UserModel from "../models/User.js";
import PayrollModel from "../models/Payroll.js";
import LeaveModel, { LEAVE_STATUS } from "../models/Leave.js";
import { handleError, ApiError } from "../utils/errorHandler.js";
import Allowance from "../models/Allowance.js";
import { AllowanceStatus } from "../models/Allowance.js";
import Deduction from "../models/Deduction.js";

export class RegularUserController {
  // ===== Profile Management Methods =====
  static async getOwnProfile(req, res, next) {
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

  static async updateOwnProfile(req, res, next) {
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

  // ===== Payslip Management Methods =====
  // These methods have been moved to EmployeeController to avoid duplication
  // Please use the EmployeeController methods instead

  // ===== Leave Management Methods =====
  static async getOwnLeaveRequests(req, res, next) {
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

  static async createLeaveRequest(req, res, next) {
    try {
      const leaveRequest = await LeaveModel.create({
        ...req.body,
        employee: req.user.id,
        status: LEAVE_STATUS.PENDING,
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

  static async cancelLeaveRequest(req, res, next) {
    try {
      const leaveRequest = await LeaveModel.findOne({
        _id: req.params.id,
        employee: req.user.id,
      });

      if (!leaveRequest) {
        throw new ApiError(404, "Leave request not found");
      }

      if (leaveRequest.status !== LEAVE_STATUS.PENDING) {
        throw new ApiError(400, "Can only cancel pending leave requests");
      }

      leaveRequest.status = LEAVE_STATUS.CANCELLED;
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

  // ===== Salary Structure & Allowances Management =====
  static async getMyAllowances(req, res) {
    try {
      const allowances = await Allowance.find({
        employee: req.user._id,
        scope: "individual",
        status: AllowanceStatus.APPROVED,
        isActive: true,
      })
        .populate("salaryGrade", "level basicSalary")
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: allowances,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  static async requestAllowance(req, res) {
    try {
      const allowance = await Allowance.create({
        ...req.body,
        employee: req.user._id,
        department: req.user.department,
        scope: "individual",
        status: AllowanceStatus.PENDING,
        createdBy: req.user._id,
        updatedBy: req.user._id,
      });

      res.status(201).json({
        success: true,
        data: allowance,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  static async getAllowanceHistory(req, res) {
    try {
      const allowances = await Allowance.find({
        employee: req.user._id,
        scope: "individual",
      })
        .populate("salaryGrade", "level basicSalary")
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: allowances,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  // ===== Deduction Management Methods =====
  static async getMyDeductions(req, res) {
    try {
      const deductions = await Deduction.find({
        employee: req.user._id,
        isActive: true,
      })
        .populate("department", "name")
        .sort({ createdAt: -1 });

      // Group deductions by type for better organization
      const groupedDeductions = {
        statutory: deductions.filter((d) => d.type === "statutory"),
        voluntary: deductions.filter((d) => d.type === "voluntary"),
      };

      res.status(200).json({
        success: true,
        data: groupedDeductions,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  static async getDeductionDetails(req, res) {
    try {
      const deduction = await Deduction.findOne({
        _id: req.params.id,
        employee: req.user._id,
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
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }
}
