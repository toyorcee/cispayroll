import { ApiError } from "../utils/errorHandler.js";
import { handleError } from "../utils/errorHandler.js";
import UserModel from "../models/User.js";
import PayrollModel from "../models/Payroll.js";
import LeaveModel, { LEAVE_STATUS } from "../models/Leave.js";
import Allowance, { AllowanceStatus } from "../models/Allowance.js";
import Deduction from "../models/Deduction.js";
import Department from "../models/Department.js";
import Notification from "../models/Notification.js";
import SalaryGrade from "../models/SalaryStructure.js";
import { NotificationService } from "../services/NotificationService.js";

export class RegularUserController {
  // ===== Dashboard Statistics Methods =====
  static async getDashboardStats(req, res) {
    try {
      const userId = req.user._id;
      const user = await UserModel.findById(userId).populate("department");

      if (!user) {
        throw new ApiError(404, "User not found");
      }

      // Get department size
      const departmentSize = await UserModel.countDocuments({
        department: user.department._id,
        status: "active",
      });

      // Get active colleagues count
      const activeColleagues = await UserModel.countDocuments({
        department: user.department._id,
        status: "active",
        _id: { $ne: userId }, // Exclude current user
      });

      // Get team members count (users in the same department)
      const teamMembers = await UserModel.countDocuments({
        department: user.department._id,
        _id: { $ne: userId }, // Exclude current user
      });

      // Get recent activities count (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentActivities = await LeaveModel.countDocuments({
        employee: userId,
        createdAt: { $gte: sevenDaysAgo },
      });

      // Get unread notifications count
      const unreadNotifications = await Notification.countDocuments({
        recipient: userId,
        read: false,
      });

      res.status(200).json({
        success: true,
        data: {
          departmentSize,
          activeColleagues,
          departmentName: user.department.name,
          teamMembers,
          recentActivities,
          unreadNotifications,
        },
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  static async getDepartmentStats(req, res) {
    try {
      const userId = req.user._id;
      const user = await UserModel.findById(userId).populate("department");

      if (!user) {
        throw new ApiError(404, "User not found");
      }

      // Get department statistics
      const department = await Department.findById(user.department._id);

      // Get department employees by role
      const employeesByRole = await UserModel.aggregate([
        { $match: { department: user.department._id, status: "active" } },
        { $group: { _id: "$role", count: { $sum: 1 } } },
      ]);

      // Get department employees by status
      const employeesByStatus = await UserModel.aggregate([
        { $match: { department: user.department._id } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);

      res.status(200).json({
        success: true,
        data: {
          department,
          employeesByRole,
          employeesByStatus,
        },
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  static async getTeamStats(req, res) {
    try {
      const userId = req.user._id;
      const user = await UserModel.findById(userId).populate("department");

      if (!user) {
        throw new ApiError(404, "User not found");
      }

      // Get team members
      const teamMembers = await UserModel.find({
        department: user.department._id,
        _id: { $ne: userId }, // Exclude current user
        status: "active",
      })
        .select("firstName lastName employeeId position profileImage")
        .limit(10);

      // Get team members on leave
      const teamOnLeave = await LeaveModel.find({
        employee: { $in: teamMembers.map((member) => member._id) },
        status: "APPROVED",
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
      }).populate("employee", "firstName lastName employeeId");

      res.status(200).json({
        success: true,
        data: {
          teamMembers,
          teamOnLeave,
        },
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

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
      const userId = req.user._id;
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new ApiError(404, "User not found");
      }

      if (!user.gradeLevel) {
        throw new ApiError(400, "User does not have a grade level assigned");
      }

      // Find salary grade for the user's grade level
      const salaryGrade = await SalaryGrade.findOne({
        level: user.gradeLevel,
        isActive: true,
      });

      if (!salaryGrade) {
        throw new ApiError(
          400,
          `No active salary grade found for level ${user.gradeLevel}`
        );
      }

      // Create the allowance request
      const allowanceRequest = {
        ...req.body,
        employee: userId,
        department: user.department,
        salaryGrade: salaryGrade._id,
        year: new Date(req.body.effectiveDate).getFullYear(),
        month: new Date(req.body.effectiveDate).getMonth() + 1,
        createdBy: userId,
        updatedBy: userId,
      };

      const allowance = await Allowance.create(allowanceRequest);
      console.log("Allowance created successfully with ID:", allowance._id);

      // Get the appropriate approver based on department and allowance type
      const approver = await getApproverForAllowance(user, allowance);

      res.status(201).json({
        success: true,
        message: "Allowance request submitted successfully",
        data: {
          ...allowance.toObject(),
          approverId: approver.approverId,
          approverRole: approver.approverRole,
        },
      });
    } catch (error) {
      console.error("ERROR in requestAllowance:", error);
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

// Replace the determineApproverRole function with a more professional approach
async function getApproverForAllowance(user, allowance) {
  console.log("=== DETERMINING APPROVER ===");
  console.log("User ID:", user._id);
  console.log("User department:", user.department);
  console.log("Allowance type:", allowance.type);
  console.log("Allowance amount:", allowance.amount);

  // Get the user's department
  const department = await Department.findById(user.department);
  console.log("Department found:", department ? "Yes" : "No");
  console.log("Department name:", department?.name);

  if (!department) {
    console.log("Department not found, throwing error");
    throw new ApiError(404, "User department not found");
  }

  // Get the department head - look for position title instead of role
  console.log("Looking for department head...");
  const departmentHead = await UserModel.findOne({
    department: department._id,
    position: {
      $in: [
        "Head of Department",
        "Department Head",
        "Head",
        "Director",
        "Manager",
      ],
    },
    status: "active",
  });
  console.log("Department head found:", departmentHead ? "Yes" : "No");
  console.log("Department head ID:", departmentHead?._id);

  if (!departmentHead) {
    // If no department head, find HR manager
    console.log("No department head found, looking for HR manager...");
    const hrDepartment = await Department.findOne({
      name: { $in: ["Human Resources", "HR"] },
      status: "active",
    });

    if (!hrDepartment) {
      console.log("HR department not found");
      throw new ApiError(404, "HR department not found");
    }

    const hrManager = await UserModel.findOne({
      department: hrDepartment._id,
      position: {
        $in: [
          "Head of Human Resources",
          "HR Manager",
          "HR Head",
          "Human Resources Manager",
          "HR Director",
          "HRM",
        ],
      },
      status: "active",
    });

    if (!hrManager) {
      console.log("HR manager not found");
      throw new ApiError(404, "HR manager not found");
    }

    console.log("HR manager found:", hrManager._id);
    return { approverId: hrManager._id, approverRole: "hr" };
  }

  // For most allowances, the department head is the first approver
  console.log("Department head found, setting approver to HOD");
  console.log("=== APPROVER DETERMINED ===");
  return { approverId: departmentHead._id, approverRole: "hod" };
}
