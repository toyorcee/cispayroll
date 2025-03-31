import mongoose from "mongoose";
import { EmployeeService } from "../services/employeeService.js";
import { handleError, ApiError } from "../utils/errorHandler.js";
import UserModel from "../models/User.js";
import PayrollModel from "../models/Payroll.js";
import LeaveModel from "../models/Leave.js";
import { LEAVE_STATUS } from "../models/Leave.js";
import { v4 as uuidv4 } from "uuid";
import { UserRole } from "../models/User.js";
import { EmailService } from "../services/emailService.js";
import DepartmentModel from "../models/Department.js";

export class EmployeeController {
  static async createEmployee(req, res, next) {
    let employee = null;
    try {
      console.log("Request body:", req.body);

      const { role = UserRole.USER, ...employeeData } = req.body;

      // Validate role creation permissions
      if (role === UserRole.ADMIN && req.user.role !== UserRole.SUPER_ADMIN) {
        throw new ApiError(403, "Only super admins can create admin accounts");
      }

      const creator = {
        _id: new mongoose.Types.ObjectId(req.user.id),
        role: req.user.role,
        department: req.user.department
          ? new mongoose.Types.ObjectId(req.user.department)
          : undefined,
      };

      // Generate employee ID with dynamic prefix
      const today = new Date();
      const day = today.getDate().toString().padStart(2, "0");
      const month = (today.getMonth() + 1).toString().padStart(2, "0");
      const sequentialNumber = (
        (await UserModel.countDocuments({
          createdAt: {
            $gte: new Date().setHours(0, 0, 0, 0),
            $lte: new Date().setHours(23, 59, 59, 999),
          },
        })) + 1
      )
        .toString()
        .padStart(3, "0");

      const prefix = role === UserRole.ADMIN ? "ADM" : "EMP";
      const employeeId = `${prefix}${day}${month}${sequentialNumber}`;

      // Generate invitation token
      const invitationToken = uuidv4();
      const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Send the invitation email
      try {
        await EmailService.sendInvitationEmail(
          employeeData.email,
          invitationToken,
          role
        );
      } catch (emailError) {
        console.error("Failed to send invitation email:", emailError);
        throw new ApiError(
          500,
          "Failed to send invitation email. Employee not created."
        );
      }

      // Create the employee after successful email sending
      employee = new UserModel({
        ...employeeData,
        employeeId,
        role,
        status: "pending",
        invitationToken,
        invitationExpires,
        createdBy: creator._id,
      });

      await employee.save();
      console.log("Employee saved successfully");

      return res.status(201).json({
        success: true,
        message: `${
          role === UserRole.ADMIN ? "Admin" : "Employee"
        } created successfully. Invitation sent.`,
        employee,
      });
    } catch (error) {
      if (employee && employee._id) {
        await UserModel.findByIdAndDelete(employee._id);
      }
      console.error("Error in createEmployee:", error);
      next(error);
    }
  }

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

  static async getDashboardStats(req, res) {
    try {
      const userRole = req.user.role;
      const userDepartment = req.user.department;

      let stats = {
        employees: {
          total: 0,
          active: 0,
          pending: 0,
          byRole: {},
        },
        departments: {
          total: 0,
          hodCount: 0,
        },
      };

      let employeeQuery = {};
      if (userRole === UserRole.ADMIN) {
        employeeQuery.department = userDepartment;
        employeeQuery.role = { $ne: UserRole.SUPER_ADMIN };
      }

      if (userRole === UserRole.SUPER_ADMIN) {
        stats.employees.byRole.superAdmin = await UserModel.countDocuments({
          role: UserRole.SUPER_ADMIN,
        });
      }

      stats.employees.byRole.admin = await UserModel.countDocuments({
        role: UserRole.ADMIN,
        ...(userRole === UserRole.ADMIN ? { department: userDepartment } : {}),
      });

      stats.employees.byRole.user = await UserModel.countDocuments({
        role: UserRole.USER,
        ...(userRole === UserRole.ADMIN ? { department: userDepartment } : {}),
      });

      stats.employees.active = await UserModel.countDocuments({
        ...employeeQuery,
        status: "active",
      });

      stats.employees.pending = await UserModel.countDocuments({
        ...employeeQuery,
        status: "pending",
      });

      stats.departments.total = await DepartmentModel.countDocuments();
      stats.departments.hodCount = await UserModel.countDocuments({
        role: UserRole.ADMIN,
        position: { $regex: /head|director|hod/i },
      });

      stats.employees.total = Object.values(stats.employees.byRole).reduce(
        (a, b) => a + b,
        0
      );

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }
}
