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
import path from "path";
import fs from "fs";

export class EmployeeController {
  static async createEmployee(req, res, next) {
    let employee = null;
    try {
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

      // Add department population
      const department = await DepartmentModel.findById(
        employeeData.department
      );
      if (!department) {
        throw new ApiError(400, "Invalid department selected");
      }

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

      // Create the employee first
      employee = new UserModel({
        ...employeeData,
        employeeId,
        role,
        status: "pending",
        invitationToken,
        invitationExpires,
        createdBy: creator._id,
        department: department._id,
      });

      await employee.save();

      // Add audit logging
      await PayrollStatisticsLogger.logEmployeeAction({
        action: "CREATE",
        employeeId: employee._id,
        userId: req.user.id,
        details: {
          employeeId: employee.employeeId,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          role: employee.role,
          department: department.name,
          createdBy: req.user.id,
          message: `Created ${
            role === UserRole.ADMIN ? "admin" : "employee"
          }: ${employee.firstName} ${employee.lastName}`,
          remarks: `Created ${
            role === UserRole.ADMIN ? "admin" : "employee"
          }: ${employee.firstName} ${employee.lastName}`,
        },
      });

      // Send the invitation email
      try {
        await EmailService.sendInvitationEmail(
          employeeData.email,
          invitationToken,
          role
        );
      } catch (emailError) {
        // If email fails, update employee status and add a note
        await UserModel.findByIdAndUpdate(employee._id, {
          $set: {
            status: "active",
            "invitation.status": "failed",
            "invitation.error": emailError.message,
            "invitation.lastAttempt": new Date(),
          },
        });

        // Return success but with email warning
        return res.status(201).json({
          success: true,
          message: `${
            role === UserRole.ADMIN ? "Admin" : "Employee"
          } created successfully, but invitation email could not be sent. Please try sending the invitation email again later.`,
          employee,
          emailError: {
            message: "Failed to send invitation email",
            details: emailError.message,
          },
        });
      }

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

      // Enhance error message for email-related errors
      if (error.message.includes("email") || error.message.includes("SMTP")) {
        error.message =
          "Failed to send invitation email. Please check your email service configuration.";
      }

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

      // Add audit logging
      await PayrollStatisticsLogger.logEmployeeAction({
        action: "UPDATE_PROFILE",
        employeeId: user._id,
        userId: req.user.id,
        details: {
          employeeId: user.employeeId,
          firstName: user.firstName,
          lastName: user.lastName,
          updatedFields: Object.keys(updates),
          message: `Updated profile: ${user.firstName} ${user.lastName}`,
          remarks: `Updated profile: ${user.firstName} ${user.lastName}`,
        },
      });

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
      // Check if user has the required permission
      if (!req.user.permissions.includes("VIEW_OWN_PAYSLIP")) {
        console.error(
          "❌ [getOwnPayslips] User does not have VIEW_OWN_PAYSLIP permission"
        );
        throw new ApiError(403, "You do not have permission to view payslips");
      }

      // Get pagination parameters from query
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      console.log(
        `📋 [getOwnPayslips] Pagination: page=${page}, limit=${limit}, skip=${skip}`
      );

      // Fetch payslips with pagination - include both APPROVED and PAID statuses
      const payrolls = await PayrollModel.find({
        employee: req.user.id,
        status: { $in: ["APPROVED", "PAID"] },
      })
        .populate([
          {
            path: "employee",
            select: "firstName lastName employeeId bankDetails",
          },
          { path: "department", select: "name code" },
          { path: "salaryGrade", select: "level description" },
        ])
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Get total count for pagination - include both APPROVED and PAID statuses
      const total = await PayrollModel.countDocuments({
        employee: req.user.id,
        status: { $in: ["APPROVED", "PAID"] },
      });

      // Format each payslip with detailed information
      const formattedPayslips = payrolls.map((payroll) => ({
        _id: payroll._id,
        payslipId: `PS${payroll.month}${payroll.year}${payroll.employee.employeeId}`,
        employee: {
          id: payroll.employee._id,
          name: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
          employeeId: payroll.employee.employeeId,
          department: payroll.department?.name || "Not Assigned",
          salaryGrade: payroll.salaryGrade?.level || "Not Assigned",
        },
        period: {
          month: payroll.month,
          year: payroll.year,
          startDate: new Date(payroll.year, payroll.month - 1, 1),
          endDate: new Date(payroll.year, payroll.month, 0),
        },
        earnings: {
          basicSalary: payroll.basicSalary,
          allowances: payroll.allowances,
          bonuses: payroll.bonuses,
          totalEarnings: payroll.totals.grossEarnings,
        },
        deductions: {
          tax: payroll.deductions.tax,
          pension: payroll.deductions.pension,
          nhf: payroll.deductions.nhf,
          loans: payroll.deductions.loans,
          others: payroll.deductions.others,
          totalDeductions: payroll.totals.totalDeductions,
        },
        totals: {
          grossEarnings: payroll.totals.grossEarnings,
          totalDeductions: payroll.totals.totalDeductions,
          netPay: payroll.totals.netPay,
        },
        status: payroll.status,
        processedAt: payroll.createdAt,
      }));

      const response = {
        success: true,
        data: {
          payslips: formattedPayslips,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
          },
        },
        count: formattedPayslips.length,
      };

      console.log("📤 [getOwnPayslips] Sending response:", response);
      res.status(200).json(response);
    } catch (error) {
      console.error("❌ [getOwnPayslips] Error:", error);
      next(error);
    }
  }

  static async getOwnPayslipById(req, res, next) {
    try {
      // First check if the payroll exists at all
      const payrollExists = await PayrollModel.exists({ _id: req.params.id });

      if (!payrollExists) {
        throw new ApiError(
          404,
          "This payslip does not exist in the system. It may have been deleted or never created."
        );
      }

      const payroll = await PayrollModel.findOne({
        _id: req.params.id,
        employee: req.user.id,
        status: { $in: ["APPROVED", "PAID"] },
      })
        .populate([
          {
            path: "employee",
            select: "firstName lastName employeeId bankDetails",
          },
          { path: "department", select: "name code" },
          { path: "salaryGrade", select: "level description" },
        ])
        .lean();

      if (!payroll) {
        // Check if it exists but belongs to another user
        const otherUserPayroll = await PayrollModel.exists({
          _id: req.params.id,
        });
        if (otherUserPayroll) {
          throw new ApiError(
            403,
            "You are not authorized to view this payslip. This payslip belongs to another employee."
          );
        } else {
          throw new ApiError(
            404,
            "This payslip does not exist in the system. It may have been deleted or never created."
          );
        }
      }

      // Format the response with detailed payslip information
      const payslipData = {
        payslipId: `PS${payroll.month}${payroll.year}${payroll.employee.employeeId}`,
        employee: {
          id: payroll.employee._id,
          name: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
          employeeId: payroll.employee.employeeId,
          department: payroll.department?.name || "Not Assigned",
          salaryGrade: payroll.salaryGrade?.level || "Not Assigned",
        },
        paymentDetails: {
          bankName: payroll.employee.bankDetails?.bankName || "Not Provided",
          accountNumber:
            payroll.employee.bankDetails?.accountNumber || "Not Provided",
          accountName:
            payroll.employee.bankDetails?.accountName || "Not Provided",
        },
        period: {
          month: payroll.month,
          year: payroll.year,
        },
        earnings: {
          basicSalary: payroll.basicSalary,
          allowances: payroll.allowances,
          bonuses: payroll.bonuses,
          totalEarnings: payroll.totals.grossEarnings,
        },
        deductions: {
          tax: payroll.deductions.tax,
          pension: payroll.deductions.pension,
          nhf: payroll.deductions.nhf,
          loans: payroll.deductions.loans,
          others: payroll.deductions.others,
          totalDeductions: payroll.totals.totalDeductions,
        },
        summary: {
          grossEarnings: payroll.totals.grossEarnings,
          totalDeductions: payroll.totals.totalDeductions,
          netPay: payroll.totals.netPay,
        },
        status: payroll.status,
        processedAt: payroll.createdAt,
      };

      res.status(200).json({
        success: true,
        data: payslipData,
      });
    } catch (error) {
      console.error("❌ Error fetching payslip details:", error);
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

      // Add audit logging
      await PayrollStatisticsLogger.logLeaveAction({
        action: "CREATE",
        leaveId: leaveRequest._id,
        userId: req.user.id,
        details: {
          employeeId: req.user.employeeId,
          employeeName: `${req.user.firstName} ${req.user.lastName}`,
          leaveType: leaveRequest.leaveType,
          startDate: leaveRequest.startDate,
          endDate: leaveRequest.endDate,
          reason: leaveRequest.reason,
          message: `Created leave request: ${leaveRequest.leaveType}`,
          remarks: `Created leave request: ${leaveRequest.leaveType}`,
        },
      });

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

      // Add audit logging
      await PayrollStatisticsLogger.logLeaveAction({
        action: "CANCEL",
        leaveId: leaveRequest._id,
        userId: req.user.id,
        details: {
          employeeId: req.user.employeeId,
          employeeName: `${req.user.firstName} ${req.user.lastName}`,
          leaveType: leaveRequest.leaveType,
          startDate: leaveRequest.startDate,
          endDate: leaveRequest.endDate,
          reason: leaveRequest.reason,
          message: `Cancelled leave request: ${leaveRequest.leaveType}`,
          remarks: `Cancelled leave request: ${leaveRequest.leaveType}`,
        },
      });

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
      // 1. Check if file exists in request
      if (!req.file) {
        throw new ApiError(400, "No image file provided");
      }

      // 2. Find current user
      const currentUser = await UserModel.findById(req.user.id);
      if (!currentUser) {
        throw new ApiError(404, "Employee not found");
      }

      // 3. Handle existing image (Update case)
      if (currentUser.profileImage) {
        const oldImagePath = path.join(process.cwd(), currentUser.profileImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath); // Delete old image file
        }
      }

      // 4. Update user with new image path (relative only)
      const relativePath = `uploads/profiles/${req.file.filename}`;
      const user = await UserModel.findByIdAndUpdate(
        req.user.id,
        {
          $set: {
            profileImage: relativePath,
          },
        },
        { new: true }
      ).select("-password");

      console.log(
        "✅ Uploaded image:",
        req.file.filename,
        "Saved as:",
        relativePath
      );

      if (!user) {
        throw new ApiError(404, "Employee not found");
      }

      // Add audit logging
      await PayrollStatisticsLogger.logEmployeeAction({
        action: "UPDATE_PROFILE_IMAGE",
        employeeId: user._id,
        userId: req.user.id,
        details: {
          employeeId: user.employeeId,
          firstName: user.firstName,
          lastName: user.lastName,
          oldImagePath: currentUser.profileImage,
          newImagePath: relativePath,
          message: `Updated profile image: ${user.firstName} ${user.lastName}`,
          remarks: `Updated profile image: ${user.firstName} ${user.lastName}`,
        },
      });

      // 5. Return success response
      res.status(200).json({
        success: true,
        message: "Profile image updated successfully",
        profileImage: relativePath,
        imageUrl: `${process.env.BASE_URL}/${relativePath}`,
      });
    } catch (error) {
      if (req.file) {
        const filePath = path.join(process.cwd(), req.file.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      next(error);
    }
  }

  static async deleteEmployee(req, res, next) {
    try {
      // Get employee data before deletion for audit
      const employee = await UserModel.findById(req.params.id)
        .select("firstName lastName employeeId role department")
        .populate("department", "name");

      if (!employee) {
        throw new ApiError(404, "Employee not found");
      }

      const deletedEmployee = await EmployeeService.deleteEmployee(
        req.params.id
      );

      // Add audit logging
      await PayrollStatisticsLogger.logEmployeeAction({
        action: "DELETE",
        employeeId: employee._id,
        userId: req.user.id,
        details: {
          employeeId: employee.employeeId,
          firstName: employee.firstName,
          lastName: employee.lastName,
          role: employee.role,
          department: employee.department?.name,
          deletedBy: req.user.id,
          message: `Deleted employee: ${employee.firstName} ${employee.lastName}`,
          remarks: `Deleted employee: ${employee.firstName} ${employee.lastName}`,
        },
      });

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

  static async getEmployeeById(req, res, next) {
    try {
      const employee = await UserModel.findById(req.params.id)
        .select("-password")
        .populate("department", "name code")
        .populate("createdBy", "firstName lastName");

      if (!employee) {
        throw new ApiError(404, "Employee not found");
      }

      res.status(200).json({
        success: true,
        employee,
      });
    } catch (error) {
      next(error);
    }
  }

  static async viewPayslip(req, res, next) {
    try {
      console.log("🔍 Fetching payslip details for:", req.params.payrollId);

      // First check if the payroll exists at all
      const payrollExists = await PayrollModel.exists({
        _id: req.params.payrollId,
      });

      if (!payrollExists) {
        throw new ApiError(
          404,
          "This payslip does not exist in the system. It may have been deleted or never created."
        );
      }

      const payroll = await PayrollModel.findById(req.params.payrollId)
        .populate([
          {
            path: "employee",
            select: "firstName lastName employeeId bankDetails",
          },
          { path: "department", select: "name code" },
          { path: "salaryGrade", select: "level description" },
        ])
        .lean();

      // Security check: Ensure users can only view their own payslips
      if (payroll.employee._id.toString() !== req.user.id) {
        throw new ApiError(
          403,
          "You are not authorized to view this payslip. This payslip belongs to another employee."
        );
      }

      // Check if the payslip is processed
      if (payroll.status === "PENDING") {
        throw new ApiError(
          404,
          "This payslip exists but has not been processed yet. Please check back later."
        );
      }

      // Format the response with detailed payslip information
      const payslipData = {
        payslipId: `PS${payroll.month}${payroll.year}${payroll.employee.employeeId}`,
        employee: {
          id: payroll.employee._id,
          name: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
          employeeId: payroll.employee.employeeId,
          department: payroll.department?.name || "Not Assigned",
          salaryGrade: payroll.salaryGrade?.level || "Not Assigned",
        },
        paymentDetails: {
          bankName: payroll.employee.bankDetails?.bankName || "Not Provided",
          accountNumber:
            payroll.employee.bankDetails?.accountNumber || "Not Provided",
          accountName:
            payroll.employee.bankDetails?.accountName || "Not Provided",
        },
        period: {
          month: payroll.month,
          year: payroll.year,
        },
        earnings: {
          basicSalary: payroll.basicSalary,
          allowances: payroll.allowances,
          bonuses: payroll.bonuses,
          totalEarnings: payroll.totals.grossEarnings,
        },
        deductions: {
          tax: payroll.deductions.tax,
          pension: payroll.deductions.pension,
          nhf: payroll.deductions.nhf,
          loans: payroll.deductions.loans,
          others: payroll.deductions.others,
          totalDeductions: payroll.totals.totalDeductions,
        },
        summary: {
          grossEarnings: payroll.totals.grossEarnings,
          totalDeductions: payroll.totals.totalDeductions,
          netPay: payroll.totals.netPay,
        },
        status: payroll.status,
        processedAt: payroll.createdAt,
      };

      console.log("✅ Payslip details retrieved successfully");

      res.status(200).json({
        success: true,
        data: payslipData,
      });
    } catch (error) {
      console.error("❌ Error fetching payslip details:", error);
      next(error);
    }
  }
}
