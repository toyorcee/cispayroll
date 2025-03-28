import { Types } from "mongoose";
import { EmployeeService } from "../services/employeeService.js";
import { handleError, ApiError } from "../utils/errorHandler.js";
import UserModel from "../models/User.js";
import PayrollModel from "../models/Payroll.js";
import LeaveModel from "../models/Leave.js";
import { LEAVE_STATUS } from "../models/Leave.js";
import { v4 as uuidv4 } from "uuid";
import { UserRole } from "../models/User.js";
import { EmailService } from "../services/emailService.js";

export class EmployeeController {
  // Admin/Super Admin creating an employee
  static async createEmployee(req, res, next) {
    try {
      console.log("Request body:", req.body); // Log the incoming request body

      const { role = UserRole.USER, ...employeeData } = req.body;

      // Validate role creation permissions
      if (role === UserRole.ADMIN && req.user.role !== UserRole.SUPER_ADMIN) {
        console.log(
          "Permission denied: Only super admins can create admin accounts"
        );
        throw new ApiError(403, "Only super admins can create admin accounts");
      }

      const creator = {
        _id: new Types.ObjectId(req.user.id),
        role: req.user.role,
        department: req.user.department
          ? new Types.ObjectId(req.user.department)
          : undefined,
      };
      console.log("Creator details:", creator); // Log the creator details

      // Generate employee ID with dynamic prefix
      const today = new Date();
      const day = today.getDate().toString().padStart(2, "0");
      const month = (today.getMonth() + 1).toString().padStart(2, "0");

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const todayEmployeesCount = await UserModel.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });
      console.log("Today's employee count:", todayEmployeesCount); // Log the count of employees created today

      const sequentialNumber = (todayEmployeesCount + 1)
        .toString()
        .padStart(3, "0");
      const prefix = role === UserRole.ADMIN ? "ADM" : "EMP";
      const employeeId = `${prefix}${day}${month}${sequentialNumber}`;
      console.log("Generated employee ID:", employeeId); // Log the generated employee ID

      // Generate invitation token
      const invitationToken = uuidv4();
      const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Token expires in 7 days
      console.log("Generated invitation token:", invitationToken); // Log the invitation token

      const employee = new UserModel({
        ...employeeData,
        employeeId,
        role,
        status: "pending",
        invitationToken,
        invitationExpires,
        createdBy: creator._id,
      });
      console.log("Employee data to be saved:", employee); // Log the employee data before saving

      await employee.save();
      console.log("Employee saved successfully"); // Log after saving the employee

      // Send invitation email
      console.log("Sending invitation email to:", employee.email); // Log the email being sent
      await EmailService.sendInvitationEmail(employee.email, invitationToken);
      console.log("Invitation email sent successfully"); // Log after sending the email

      res.status(201).json({
        success: true,
        message: `${
          role === UserRole.ADMIN ? "Admin" : "Employee"
        } created successfully. Invitation sent.`,
        employee,
      });
    } catch (error) {
      console.error("Error in createEmployee:", error); // Log the error
      next(error);
    }
  }
  // static async createEmployee(req, res, next) {
  //   try {
  //     const { role = UserRole.USER, ...employeeData } = req.body;

  //     // Validate role creation permissions
  //     if (role === UserRole.ADMIN && req.user.role !== UserRole.SUPER_ADMIN) {
  //       throw new ApiError(403, "Only super admins can create admin accounts");
  //     }

  //     const creator = {
  //       _id: new Types.ObjectId(req.user.id),
  //       role: req.user.role,
  //       department: req.user.department
  //         ? new Types.ObjectId(req.user.department)
  //         : undefined,
  //     };

  //     // Pass the role to the service
  //     const { employee, invitationToken } =
  //       await EmployeeService.createEmployee(
  //         { ...employeeData, role },
  //         creator
  //       );

  //     // Customize message based on role
  //     const message = `${
  //       role === UserRole.ADMIN ? "Admin" : "Employee"
  //     } created successfully. Invitation sent.`;

  //     res.status(201).json({
  //       success: true,
  //       message,
  //       employee,
  //     });
  //   } catch (error) {
  //     next(error);
  //   }
  // }

  // Employee viewing their own profile
  static async getOwnProfile(req, res, next) {
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
  static async updateOwnProfile(req, res, next) {
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
  static async getOwnPayslips(req, res, next) {
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

  static async getOwnPayslipById(req, res, next) {
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
      next(error);
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
      next(error);
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
      next(error);
    }
  }

  static async updateProfileImage(req, res, next) {
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
  static async deleteEmployee(req, res, next) {
    try {
      const employee = await EmployeeService.deleteEmployee(req.params.id);
      res.status(200).json({
        success: true,
        message: `Employee ${employee.employeeId} deleted successfully`,
      });
    } catch (error) {
      next(error);
    }
  }
}
