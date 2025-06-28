import { AuthService } from "../services/authService.js";
import { UserRole, Permission, UserStatus } from "../models/User.js";
import UserModel from "../models/User.js";
import DepartmentModel, { DepartmentStatus } from "../models/Department.js";
import PayrollModel, {
  PAYROLL_STATUS,
  PayrollFrequency,
} from "../models/Payroll.js";
import { handleError, ApiError } from "../utils/errorHandler.js";
import Leave from "../models/Leave.js";
import { LEAVE_STATUS } from "../models/Leave.js";
import { PayrollService } from "../services/PayrollService.js";
import SalaryGrade from "../models/SalaryStructure.js";
import { Types } from "mongoose";
import mongoose from "mongoose";
import { DeductionService } from "../services/DeductionService.js";
import Deduction from "../models/Deduction.js";
import { AllowanceService } from "../services/AllowanceService.js";
import { BonusService } from "../services/BonusService.js";
import Allowance from "../models/Allowance.js";
import Notification from "../models/Notification.js";
import {
  NotificationService,
  NOTIFICATION_TYPES,
} from "../services/NotificationService.js";
import { DepartmentService } from "../services/departmentService.js";
import { DeductionType, DeductionScope } from "../models/Deduction.js";
import Payment from "../models/Payment.js";
import PaymentMethod from "../models/PaymentMethod.js";
import Audit from "../models/Audit.js";
import { AuditAction, AuditEntity } from "../models/Audit.js";
import { PaymentStatus } from "../models/Payment.js";
import generatePayslipPDF from "../utils/pdfGenerator.js";
import { EmailService } from "../services/emailService.js";
import BaseApprovalController, {
  APPROVAL_LEVELS,
} from "./BaseApprovalController.js";
import Payroll from "../models/Payroll.js";
import AuditService from "../services/AuditService.js";
import SalaryStructureModel from "../models/SalaryStructure.js";
import DeductionModel from "../models/Deduction.js";
import AllowanceModel from "../models/Allowance.js";
import BonusModel from "../models/Bonus.js";
import PayrollStatisticsLogger from "../utils/payrollStatisticsLogger.js";
import { SummaryType } from "../models/PayrollSummary.js";
import PayrollSummaryService from "../services/PayrollSummaryService.js";

const asObjectId = (id) => new Types.ObjectId(id);

export class SuperAdminController {
  // ===== Base CRUD Operations =====
  static async findById(Model, id, populate) {
    const query = Model.findById(id);
    if (populate) {
      populate.forEach((field) => query.populate(field));
    }
    return query.select("-password");
  }

  // ===== Admin Management =====
  static async getAllAdmins(req, res, next) {
    try {
      console.log("🔍 Fetching all admins for HOD selection");

      const admins = await UserModel.find({ role: UserRole.ADMIN })
        .select("-password")
        .populate("department", "name code")
        .sort({ createdAt: -1 });

      console.log(`✅ Found ${admins.length} admins`);
      console.log(
        "📊 Admins with HOD positions:",
        admins
          .filter((admin) => admin.position?.toLowerCase().includes("head of"))
          .map((hod) => ({
            id: hod._id,
            name: `${hod.firstName} ${hod.lastName}`,
            department: hod.department?.name,
          }))
      );

      res.status(200).json({
        success: true,
        admins,
        count: admins.length,
      });
    } catch (error) {
      console.error("❌ Error fetching admins:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async getAdminById(req, res, next) {
    try {
      const admin = await this.findById(UserModel, req.params.id, [
        { path: "department", select: "name code" },
      ]);

      if (!admin || admin.role !== UserRole.ADMIN) {
        throw new ApiError(404, "Admin not found");
      }

      res.status(200).json({ success: true, admin });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async createAdmin(req, res) {
    try {
      // Generate admin ID with date format
      const today = new Date();
      const day = today.getDate().toString().padStart(2, "0");
      const month = (today.getMonth() + 1).toString().padStart(2, "0");

      // Get count of admins created today for sequential numbering
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const todayAdminsCount = await UserModel.countDocuments({
        role: UserRole.ADMIN,
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      });

      const sequentialNumber = (todayAdminsCount + 1)
        .toString()
        .padStart(3, "0");
      const adminId = `ADM${day}${month}${sequentialNumber}`;

      const userData = {
        ...req.body,
        role: UserRole.ADMIN,
        isEmailVerified: true,
        createdBy: req.user.id,
        status: "pending",
        employeeId: adminId,
      };

      const { user: admin } = await AuthService.createUser(userData);
      res.status(201).json({
        success: true,
        message: "Admin created successfully",
        admin,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async updateAdmin(req, res, next) {
    try {
      const adminId = req.params.id;
      const admin = await UserModel.findById(adminId);

      if (!admin) {
        throw new ApiError(404, "Admin not found");
      }

      if (admin.role !== UserRole.ADMIN) {
        throw new ApiError(400, "User is not an admin");
      }

      if (req.body.role && req.body.role !== UserRole.ADMIN) {
        throw new ApiError(
          400,
          "Cannot change admin role through this endpoint"
        );
      }

      const updatedAdmin = await UserModel.findByIdAndUpdate(
        adminId,
        { $set: req.body },
        { new: true }
      ).select("-password");

      res.status(200).json({
        success: true,
        message: "Admin updated successfully",
        admin: updatedAdmin,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async deleteAdmin(req, res, next) {
    try {
      const admin = await UserModel.findById(req.params.id);

      if (!admin) {
        throw new ApiError(404, "Admin not found");
      }

      if (admin.role !== UserRole.ADMIN) {
        throw new ApiError(400, "User is not an admin");
      }

      await UserModel.findByIdAndDelete(req.params.id);

      res.status(200).json({
        success: true,
        message: "Admin deleted successfully",
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  // ===== Regular User Management =====
  static async getAllUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search;
      const status = req.query.status;
      const departmentFilter = req.query.department;

      const query = {};

      // Add search filter
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      // Add status filter
      if (status) {
        query.status = status;
      } else {
        // Exclude offboarded and terminated users by default
        query.$and = [
          { status: { $nin: ["offboarding", "terminated"] } },
          { "lifecycle.currentState": { $ne: "OFFBOARDING" } },
        ];
      }

      // Handle department filter properly
      if (departmentFilter && departmentFilter !== "No Department") {
        // Always find the department first to get its ID
        const department = await DepartmentModel.findOne({
          $or: [
            {
              _id: Types.ObjectId.isValid(departmentFilter)
                ? departmentFilter
                : null,
            },
            { name: departmentFilter },
          ],
        });

        if (department) {
          // Only filter by department ID
          query.department = department._id;
        }
      } else if (departmentFilter === "No Department") {
        query.department = null;
      }

      const users = await UserModel.find(query)
        .select("-password")
        .populate({
          path: "department",
          select: "name code",
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await UserModel.countDocuments(query);

      res.status(200).json({
        success: true,
        data: users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getUserById(req, res, next) {
    try {
      const user = await UserModel.findById(req.params.id)
        .select("-password")
        .populate("department", "name code");

      if (!user) {
        throw new ApiError(404, "User not found");
      }

      res.status(200).json({ success: true, user });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async createUser(req, res) {
    try {
      const userData = req.body;

      // If department is provided as a name, convert it to ID
      if (userData.department && typeof userData.department === "string") {
        const department = await DepartmentModel.findOne({
          name: userData.department,
        });
        if (department) {
          userData.department = department._id;
        }
      }

      // Create user with department ID
      const user = await UserModel.create(userData);

      res.status(201).json({
        success: true,
        message: "User created successfully",
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          department: user.department,
        },
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // If updating department, ensure it's an ID
      if (updateData.department && typeof updateData.department === "string") {
        const department = await DepartmentModel.findOne({
          name: updateData.department,
        });
        if (department) {
          updateData.department = department._id;
        }
      }

      const user = await UserModel.findByIdAndUpdate(id, updateData, {
        new: true,
      }).populate("department");

      if (!user) {
        throw new ApiError(404, "User not found");
      }

      if (req.body.role && req.body.role !== UserRole.USER) {
        throw new ApiError(
          400,
          "Cannot change user role through this endpoint"
        );
      }

      if (req.body.department) {
        const department = await DepartmentModel.findById(req.body.department);
        if (!department) {
          throw new ApiError(400, "Invalid department ID");
        }
      }

      res.status(200).json({
        success: true,
        message: "User updated successfully",
        user: user,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteUser(req, res, next) {
    try {
      const user = await UserModel.findById(req.params.id);

      if (!user) {
        throw new ApiError(404, "User not found");
      }

      if (user.role !== UserRole.USER) {
        throw new ApiError(
          400,
          "Cannot delete non-user accounts through this endpoint"
        );
      }

      await UserModel.findByIdAndDelete(req.params.id);

      res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  // ===== Department Management =====
  static async getAllDepartments(req, res) {
    try {
      const { page = 1, limit = 10, ...filter } = req.query;
      const departments = await DepartmentService.getAllDepartments(
        parseInt(page),
        parseInt(limit),
        filter
      );

      res.status(200).json({
        success: true,
        data: departments.data,
        pagination: departments.pagination,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async getDepartmentById(req, res) {
    try {
      const { id } = req.params;
      const department = await DepartmentService.getDepartmentById(id);

      res.status(200).json({
        success: true,
        data: department,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async createDepartment(req, res) {
    try {
      const departmentData = {
        ...req.body,
        createdBy: req.user.id,
        updatedBy: req.user.id,
      };

      // Validate required fields
      if (
        !departmentData.name ||
        !departmentData.code ||
        !departmentData.headOfDepartment
      ) {
        throw new ApiError(
          400,
          "Name, code, and head of department are required"
        );
      }

      const department = await DepartmentService.createDepartment(
        departmentData
      );

      res.status(201).json({
        success: true,
        message: "Department created successfully",
        data: department,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async updateDepartment(req, res) {
    try {
      const { id } = req.params;
      const updateData = {
        ...req.body,
        updatedBy: req.user.id,
      };

      const department = await DepartmentService.updateDepartment(
        id,
        updateData
      );

      res.status(200).json({
        success: true,
        message: "Department updated successfully",
        data: department,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async deleteDepartment(req, res) {
    try {
      const { id } = req.params;
      await DepartmentService.deleteDepartment(id);

      res.status(200).json({
        success: true,
        message: "Department deleted successfully",
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async getDepartmentEmployees(req, res) {
    try {
      const { departmentId } = req.params;
      const { page = 1, limit = 10, status, role } = req.query;

      const result = await DepartmentService.getDepartmentEmployees(
        departmentId,
        {
          page: parseInt(page),
          limit: parseInt(limit),
          status,
          role,
        }
      );

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message: message || "Failed to fetch department employees",
      });
    }
  }

  // ===== Payroll Management =====
  static async createPayroll(req, res) {
    try {
      const {
        employee,
        month,
        year,
        salaryGrade,
        frequency = PayrollFrequency.MONTHLY,
      } = req.body;

      // Validate month and year
      const currentDate = new Date();
      if (
        year < currentDate.getFullYear() ||
        (year === currentDate.getFullYear() &&
          month < currentDate.getMonth() + 1)
      ) {
        throw new ApiError(400, "Cannot create payroll for past dates");
      }

      if (month < 1 || month > 12) {
        throw new ApiError(400, "Invalid month");
      }

      // Validate frequency
      if (!Object.values(PayrollFrequency).includes(frequency)) {
        throw new ApiError(400, "Invalid payroll frequency");
      }

      // Get calculations from PayrollService
      const calculations = await PayrollService.calculatePayroll(
        employee,
        salaryGrade,
        month,
        year,
        frequency
      );

      // Create payroll data with all required fields
      const payrollData = {
        ...calculations,
        processedBy: req.user.id,
        createdBy: req.user.id,
        updatedBy: req.user.id,
        approvalFlow: {
          currentLevel: APPROVAL_LEVELS.PROCESSING,
          history: [],
          submittedBy: req.user.id,
          submittedAt: new Date(),
          status: PAYROLL_STATUS.PROCESSING,
          remarks: "Initial payroll creation",
        },
        status: PAYROLL_STATUS.PROCESSING,
        payment: {
          bankName: "Pending",
          accountNumber: "Pending",
          accountName: "Pending",
        },
      };

      const payroll = await PayrollModel.create(payrollData);
      const populatedPayroll = await PayrollModel.findById(
        payroll._id
      ).populate([
        {
          path: "employee",
          select: "firstName lastName employeeId department",
          populate: {
            path: "department",
            select: "name code",
          },
        },
        { path: "department", select: "name code" },
        { path: "salaryGrade", select: "level description" },
        { path: "processedBy", select: "firstName lastName" },
        { path: "createdBy", select: "firstName lastName" },
        { path: "updatedBy", select: "firstName lastName" },
        { path: "approvalFlow.submittedBy", select: "firstName lastName" },
      ]);

      // Ensure department is set from employee's department if not already set
      if (
        !populatedPayroll.department &&
        populatedPayroll.employee.department
      ) {
        populatedPayroll.department = populatedPayroll.employee.department;
        await populatedPayroll.save();
      }

      // Consolidated audit logging - replaces redundant logging
      await PayrollStatisticsLogger.logPayrollAction({
        action: AuditAction.CREATE,
        payrollId: payroll._id,
        userId: req.user.id,
        status: PAYROLL_STATUS.PROCESSING,
        details: {
          employeeId: employee,
          departmentId:
            populatedPayroll.department?._id ||
            populatedPayroll.employee?.department?._id,
          month,
          year,
          frequency,
          netPay: populatedPayroll.totals?.netPay,
          employeeName: `${populatedPayroll.employee?.firstName} ${populatedPayroll.employee?.lastName}`,
          departmentName:
            populatedPayroll.department?.name ||
            populatedPayroll.employee?.department?.name,
          createdBy: req.user.id,
          position: req.user.position,
          role: req.user.role,
          message: `Created payroll for ${populatedPayroll.employee?.firstName} ${populatedPayroll.employee?.lastName}`,
          approvalLevel: APPROVAL_LEVELS.PROCESSING,
          remarks: "Initial payroll creation",
        },
      });

      // Create notification for the employee
      console.log(`🔔 Creating notification for employee: ${employee}`);
      await NotificationService.createPayrollNotification(
        populatedPayroll,
        NOTIFICATION_TYPES.PAYROLL_DRAFT_CREATED,
        populatedPayroll.employee
      );

      // Create notification for the super admin
      console.log(`🔔 Creating notification for super admin: ${req.user.id}`);
      await NotificationService.createPayrollNotification(
        populatedPayroll,
        NOTIFICATION_TYPES.PAYROLL_DRAFT_CREATED,
        req.user
      );

      res.status(201).json({
        success: true,
        message: "Payroll record created successfully",
        data: populatedPayroll,
      });
    } catch (error) {
      console.error("❌ Error in createPayroll:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create payroll record",
        error: error.message,
      });
    }
  }

  static async deletePayroll(req, res) {
    try {
      const { id } = req.params;
      console.log("🗑️ Attempting to delete payroll:", id);

      const payroll = await PayrollModel.findById(id);
      if (!payroll) {
        throw new ApiError(404, "Payroll record not found");
      }

      await PayrollModel.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: "Payroll record deleted successfully",
      });
    } catch (error) {
      console.error("❌ Error deleting payroll:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message: message || "Failed to delete payroll record",
      });
    }
  }

  static async getAllPayrolls(req, res) {
    try {
      const {
        month,
        year,
        status,
        department,
        dateRange,
        frequency = "monthly",
        employee,
      } = req.query;

      let query = {};

      // Period filtering
      if (month && year) {
        query.month = parseInt(month);
        query.year = parseInt(year);
      } else if (dateRange) {
        // Handle special date range cases
        const endDate = new Date();
        const startDate = new Date();

        if (dateRange === "last3") {
          startDate.setMonth(startDate.getMonth() - 3);
        } else if (dateRange === "last6") {
          startDate.setMonth(startDate.getMonth() - 6);
        } else if (dateRange === "last12") {
          startDate.setMonth(startDate.getMonth() - 12);
        } else if (dateRange === "custom") {
          startDate.setMonth(startDate.getMonth() - 3);
        } else {
          const [startDateStr, endDateStr] = dateRange.split(",");
          if (startDateStr && endDateStr) {
            query.createdAt = {
              $gte: new Date(startDateStr),
              $lte: new Date(endDateStr),
            };
            // Skip the default date range assignment
            return;
          }
        }

        query.createdAt = {
          $gte: startDate,
          $lte: endDate,
        };
      }

      // Status filtering
      if (status && status !== "all") {
        query.status = status;
      }

      // Department filtering
      if (department && department !== "all") {
        query.department = department;
      }

      // Employee filtering
      if (employee && employee !== "all") {
        query.employee = employee;
      }

      // Frequency filtering
      if (frequency && frequency !== "all") {
        query.frequency = frequency;
      }

      // Get paginated results
      const page = parseInt(req.query.page) || 1;
      const limit = req.query.limit ? parseInt(req.query.limit) : null;
      const skip = limit ? (page - 1) * limit : 0;

      let queryBuilder = PayrollModel.find(query)
        .sort({ createdAt: -1, year: -1, month: -1 })
        .populate([
          { path: "employee", select: "firstName lastName employeeId" },
          { path: "department", select: "name code" },
          { path: "salaryGrade", select: "level description" },
        ]);

      // Only apply pagination if limit is specified
      if (limit) {
        queryBuilder = queryBuilder.skip(skip).limit(limit);
      }

      const payrolls = await queryBuilder;
      const total = await PayrollModel.countDocuments(query);

      // Simple fallback for missing breakdown
      const payrollsWithFallback = payrolls.map((payroll) => {
        const payrollObj = payroll.toObject();

        if (!payrollObj.deductions.breakdown) {
          payrollObj.deductions.breakdown = {
            statutory: [],
            voluntary: [],
          };
        }

        return payrollObj;
      });

      // Calculate frequency-based totals
      const frequencyTotals = await PayrollModel.aggregate([
        {
          $match: {
            ...query,
            status: { $ne: PAYROLL_STATUS.DRAFT },
          },
        },
        {
          $group: {
            _id: "$frequency",
            totalNetPay: { $sum: "$totals.netPay" },
            totalGrossPay: { $sum: "$totals.grossEarnings" },
            totalDeductions: { $sum: "$totals.totalDeductions" },
            count: { $sum: 1 },
            paidCount: {
              $sum: { $cond: [{ $eq: ["$status", "PAID"] }, 1, 0] },
            },
            approvedCount: {
              $sum: { $cond: [{ $eq: ["$status", "APPROVED"] }, 1, 0] },
            },
            pendingCount: {
              $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] },
            },
            pendingPaymentCount: {
              $sum: { $cond: [{ $eq: ["$status", "PENDING_PAYMENT"] }, 1, 0] },
            },
            processingCount: {
              $sum: { $cond: [{ $eq: ["$status", "PROCESSING"] }, 1, 0] },
            },
            rejectedCount: {
              $sum: { $cond: [{ $eq: ["$status", "REJECTED"] }, 1, 0] },
            },
            cancelledCount: {
              $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] },
            },
          },
        },
      ]);

      // Calculate status breakdown
      const statusBreakdown = await PayrollModel.aggregate([
        {
          $match: {
            ...query,
            status: { $ne: PAYROLL_STATUS.DRAFT },
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalNetPay: { $sum: "$totals.netPay" },
          },
        },
      ]);

      // Calculate department breakdown
      const departmentBreakdown = await PayrollModel.aggregate([
        {
          $match: {
            ...query,
            status: { $ne: PAYROLL_STATUS.DRAFT },
          },
        },
        {
          $group: {
            _id: "$department",
            count: { $sum: 1 },
            totalNetPay: { $sum: "$totals.netPay" },
          },
        },
        {
          $lookup: {
            from: "departments",
            localField: "_id",
            foreignField: "_id",
            as: "departmentInfo",
          },
        },
        { $unwind: "$departmentInfo" },
        {
          $project: {
            departmentName: "$departmentInfo.name",
            count: 1,
            totalNetPay: 1,
          },
        },
      ]);

      res.status(200).json({
        success: true,
        data: {
          payrolls: payrollsWithFallback,
          pagination: {
            total,
            page,
            pages: Math.ceil(total / limit),
          },
          summary: {
            frequencyTotals,
            statusBreakdown,
            departmentBreakdown,
          },
        },
      });
    } catch (error) {
      console.error("❌ Error in getAllPayrolls:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch payrolls",
        error: error.message,
      });
    }
  }

  static async getEmployeePayrollHistory(req, res) {
    try {
      const { employeeId } = req.params;
      console.log("🔍 Fetching payroll history for employee:", employeeId);

      // Add this debug log
      console.log("Looking for employee in UserModel with ID:", employeeId);

      // Get employee with populated fields
      const employee = await UserModel.findById(employeeId).populate([
        { path: "department", select: "name code" },
        { path: "salaryGrade", select: "level description" },
      ]);

      // Add this debug log
      console.log("Found employee:", employee);

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      // Get payroll history - modify this part
      const payrollHistory = await PayrollModel.find({
        employee: employeeId, // Changed from asObjectId(employeeId)
      })
        .populate([
          {
            path: "employee",
            select: "firstName lastName employeeId bankDetails",
          },
          {
            path: "department",
            select: "name code",
          },
          {
            path: "salaryGrade",
            select: "level description",
          },
        ])
        .sort({ year: -1, month: -1 })
        .lean();

      // Add this debug log
      console.log("Found payroll history:", payrollHistory);

      // Add deduction breakdown to each payroll record if missing (for backward compatibility)
      for (const payroll of payrollHistory) {
        if (payroll.deductions && !payroll.deductions.breakdown) {
          console.log(
            "🔧 Adding missing deduction breakdown to payroll in history:",
            payroll._id
          );

          // Get statutory deductions
          const statutoryDeductions = await DeductionModel.find({
            type: "statutory",
            isActive: true,
          }).lean();

          // Get voluntary deductions
          const voluntaryDeductions = await DeductionModel.find({
            type: "voluntary",
            isActive: true,
          }).lean();

          // Create breakdown structure
          payroll.deductions.breakdown = {
            statutory: [
              // Include existing statutory deductions from payroll
              {
                name: "PAYE Tax",
                amount: payroll.deductions.tax?.amount || 0,
                code: "tax",
                description: "Pay As You Earn Tax",
                type: "statutory",
              },
              {
                name: "Pension",
                amount: payroll.deductions.pension?.amount || 0,
                code: "pension",
                description: "Pension Contribution",
                type: "statutory",
              },
              {
                name: "NHF",
                amount: payroll.deductions.nhf?.amount || 0,
                code: "nhf",
                description: "National Housing Fund",
                type: "statutory",
              },
              // Add any additional statutory deductions from database
              ...statutoryDeductions
                .filter(
                  (deduction) =>
                    !["tax", "pension", "nhf"].includes(deduction.code)
                )
                .map((deduction) => ({
                  name: deduction.name,
                  amount: payroll.deductions[deduction.code] || 0,
                  code: deduction.code,
                  description: deduction.description,
                  type: "statutory",
                })),
            ],
            voluntary: [
              // Include existing loans from payroll
              ...(payroll.deductions.loans || []).map((loan) => ({
                name: loan.description,
                amount: loan.amount,
                code: "loan",
                description: loan.description,
                type: "voluntary",
              })),
              // Include existing others from payroll
              ...(payroll.deductions.others || []).map((other) => ({
                name: other.description,
                amount: other.amount,
                code: "other",
                description: other.description,
                type: "voluntary",
              })),
              // Include existing department-specific deductions from payroll
              ...(payroll.deductions.departmentSpecific || []).map(
                (deduction) => ({
                  name: deduction.name,
                  amount: deduction.amount,
                  code: "department",
                  description: deduction.description,
                  type: deduction.type?.toLowerCase() || "voluntary",
                })
              ),
              // Add any additional voluntary deductions from database
              ...voluntaryDeductions.map((deduction) => ({
                name: deduction.name,
                amount: payroll.deductions[deduction.code] || 0,
                code: deduction.code,
                description: deduction.description,
                type: "voluntary",
              })),
            ],
          };

          console.log(
            "✅ Added deduction breakdown to payroll in history:",
            payroll._id
          );
        }
      }

      // Calculate summary
      const approvedPayrolls = payrollHistory.filter(
        (record) => record.status === PAYROLL_STATUS.APPROVED
      );

      const totalPaid = approvedPayrolls.reduce(
        (sum, record) => sum + record.totals.netPay,
        0
      );

      // Format payroll history to remove redundancy
      const formattedPayrollHistory = payrollHistory.map((record) => ({
        period: {
          month: record.month,
          year: record.year,
        },
        earnings: {
          basicSalary: record.basicSalary,
          allowances: record.allowances,
          bonuses: record.bonuses,
          totalEarnings: record.totals.grossEarnings,
        },
        deductions: record.deductions,
        totals: record.totals,
        status: record.status,
        processedAt: record.createdAt,
      }));

      // Get the latest salary grade from the most recent payroll record
      const latestPayroll = payrollHistory[0];
      const currentSalaryGrade =
        latestPayroll?.salaryGrade?.level ||
        employee.salaryGrade?.level ||
        "Not Assigned";

      return res.status(200).json({
        success: true,
        data: {
          employee: {
            id: employee._id,
            name: `${employee.firstName} ${employee.lastName}`,
            employeeId: employee.employeeId,
            department: employee.department?.name || "Not Assigned",
            salaryGrade: currentSalaryGrade,
          },
          payrollHistory: formattedPayrollHistory,
          summary: {
            totalRecords: payrollHistory.length,
            latestPayroll: {
              period: latestPayroll
                ? {
                    month: latestPayroll.month,
                    year: latestPayroll.year,
                  }
                : null,
              status: latestPayroll?.status || null,
              totals: latestPayroll?.totals || null,
            },
            totalPaid,
            averagePayroll:
              approvedPayrolls.length > 0
                ? totalPaid / approvedPayrolls.length
                : 0,
          },
        },
      });
    } catch (error) {
      console.error("❌ Error fetching employee payroll history:", error);
      const { statusCode, message } = handleError(error);
      return res.status(statusCode).json({
        success: false,
        message: message || "Failed to fetch employee payroll history",
      });
    }
  }

  static async getPayrollById(req, res) {
    try {
      const { id } = req.params;
      const payroll = await PayrollModel.findById(id)
        .populate(
          "employee",
          "firstName lastName employeeId position gradeLevel"
        )
        .populate("salaryGrade", "level basicSalary allowances deductions");

      if (!payroll) {
        return res.status(404).json({
          success: false,
          message: "Payroll not found",
        });
      }

      // Simple fallback for missing breakdown
      if (payroll.deductions && !payroll.deductions.breakdown) {
        payroll.deductions.breakdown = {
          statutory: [],
          voluntary: [],
        };
      }

      res.json({
        success: true,
        data: payroll,
      });
    } catch (error) {
      console.error("Error fetching payroll:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching payroll",
      });
    }
  }

  static async updatePayroll(req, res) {
    try {
      const { id } = req.params;
      const { month, year, employee, salaryGrade } = req.body;

      // Find the payroll
      const payroll = await PayrollModel.findById(id);

      if (!payroll) {
        return res.status(404).json({
          success: false,
          message: "Payroll not found",
        });
      }

      // Only allow updates to DRAFT payrolls
      if (payroll.status !== "DRAFT") {
        return res.status(403).json({
          success: false,
          message: "Only draft payrolls can be edited",
          status: payroll.status,
        });
      }

      // Update the payroll
      payroll.month = month;
      payroll.year = year;
      payroll.employee = employee;
      payroll.salaryGrade = salaryGrade;
      payroll.processedDate = new Date(year, month - 1);

      // Recalculate payroll
      const updatedPayroll = await payroll.save();

      res.json({
        success: true,
        message: "Payroll updated successfully",
        data: updatedPayroll,
      });
    } catch (error) {
      console.error("Error updating payroll:", error);
      res.status(500).json({
        success: false,
        message: "Error updating payroll",
      });
    }
  }

  static async getPayrollPeriods(req, res) {
    try {
      const { department } = req.query; // Optional department filter

      const matchStage = department
        ? { department: new Types.ObjectId(department) }
        : {};

      const periods = await PayrollModel.aggregate([
        {
          $match: matchStage,
        },
        {
          $group: {
            _id: {
              year: "$year",
              month: "$month",
              department: "$department",
            },
            count: { $sum: 1 },
            totalAmount: { $sum: "$netPay" },
            statuses: { $addToSet: "$status" },
            pendingCount: {
              $sum: {
                $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0],
              },
            },
            approvedCount: {
              $sum: {
                $cond: [{ $eq: ["$status", "APPROVED"] }, 1, 0],
              },
            },
            rejectedCount: {
              $sum: {
                $cond: [{ $eq: ["$status", "REJECTED"] }, 1, 0],
              },
            },
            paidCount: {
              $sum: {
                $cond: [{ $eq: ["$status", "PAID"] }, 1, 0],
              },
            },
          },
        },
        {
          $lookup: {
            from: "departments",
            localField: "_id.department",
            foreignField: "_id",
            as: "departmentInfo",
          },
        },
        {
          $project: {
            _id: 0,
            year: "$_id.year",
            month: "$_id.month",
            department: {
              $arrayElemAt: ["$departmentInfo.name", 0],
            },
            count: 1,
            totalAmount: 1,
            statuses: 1,
            statusCounts: {
              pending: "$pendingCount",
              approved: "$approvedCount",
              rejected: "$rejectedCount",
              paid: "$paidCount",
            },
          },
        },
        {
          $sort: { year: -1, month: -1 },
        },
      ]);

      res.status(200).json({
        success: true,
        data: periods,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPayrollStats(req, res) {
    try {
      // Allow query parameters to override default current period
      const month = parseInt(req.query.month) || new Date().getMonth() + 1;
      const year = parseInt(req.query.year) || new Date().getFullYear();
      const status = req.query.status;
      const department = req.query.department;
      const startDate = req.query.startDate;
      const endDate = req.query.endDate;

      console.log("Fetching stats for period:", {
        month,
        year,
        status,
        department,
        startDate,
        endDate,
      });

      // Build match conditions
      const matchConditions = {
        month: month,
        year: year,
        status: {
          $in: [
            "PENDING",
            "PROCESSING",
            "APPROVED",
            "REJECTED",
            "PAID",
            "CANCELLED",
            "FAILED",
            "COMPLETED",
            "PENDING_PAYMENT",
          ],
        },
      };

      // Add status filter if provided
      if (status && status !== "ALL") {
        matchConditions.status = status;
      }

      // Add department filter if provided
      if (department && department !== "ALL") {
        matchConditions.department = new Types.ObjectId(department);
      }

      // Add date range filter if provided
      if (startDate || endDate) {
        matchConditions.createdAt = {};
        if (startDate) {
          matchConditions.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          matchConditions.createdAt.$lte = new Date(endDate);
        }
      }

      console.log(
        "Match conditions:",
        JSON.stringify(matchConditions, null, 2)
      );

      const stats = await PayrollModel.aggregate([
        {
          $match: matchConditions,
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalNetPay: { $sum: "$totals.netPay" },
          },
        },
      ]);

      console.log("Aggregated stats:", stats);

      // Calculate totals
      const totalCount = stats.reduce((sum, stat) => sum + stat.count, 0);
      const totalAmount = stats.reduce(
        (sum, stat) => sum + stat.totalNetPay,
        0
      );

      res.status(200).json({
        success: true,
        data: {
          stats,
          summary: {
            totalCount,
            totalAmount,
          },
        },
        period: {
          month,
          year,
        },
        filters: {
          status,
          department,
          startDate,
          endDate,
        },
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async getPeriodPayroll(req, res) {
    try {
      const { month, year } = req.params;

      // Validate month and year
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);

      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({
          success: false,
          message: "Invalid month",
        });
      }

      if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
        return res.status(400).json({
          success: false,
          message: "Invalid year",
        });
      }

      // Get all payroll records for the specified period
      const payrollRecords = await PayrollModel.find({
        month: monthNum,
        year: yearNum,
      })
        .populate("employee", "firstName lastName fullName employeeId")
        .populate("department", "name code")
        .populate("salaryGrade", "level description")
        .lean();

      // Add deduction breakdown to each payroll record if missing (for backward compatibility)
      for (const payroll of payrollRecords) {
        if (payroll.deductions && !payroll.deductions.breakdown) {
          console.log(
            "🔧 Adding missing deduction breakdown to period payroll:",
            payroll._id
          );

          // Get statutory deductions
          const statutoryDeductions = await DeductionModel.find({
            type: "statutory",
            isActive: true,
          }).lean();

          // Get voluntary deductions
          const voluntaryDeductions = await DeductionModel.find({
            type: "voluntary",
            isActive: true,
          }).lean();

          // Create breakdown structure
          payroll.deductions.breakdown = {
            statutory: [
              // Include existing statutory deductions from payroll
              {
                name: "PAYE Tax",
                amount: payroll.deductions.tax?.amount || 0,
                code: "tax",
                description: "Pay As You Earn Tax",
                type: "statutory",
              },
              {
                name: "Pension",
                amount: payroll.deductions.pension?.amount || 0,
                code: "pension",
                description: "Pension Contribution",
                type: "statutory",
              },
              {
                name: "NHF",
                amount: payroll.deductions.nhf?.amount || 0,
                code: "nhf",
                description: "National Housing Fund",
                type: "statutory",
              },
              // Add any additional statutory deductions from database
              ...statutoryDeductions
                .filter(
                  (deduction) =>
                    !["tax", "pension", "nhf"].includes(deduction.code)
                )
                .map((deduction) => ({
                  name: deduction.name,
                  amount: payroll.deductions[deduction.code] || 0,
                  code: deduction.code,
                  description: deduction.description,
                  type: "statutory",
                })),
            ],
            voluntary: [
              // Include existing loans from payroll
              ...(payroll.deductions.loans || []).map((loan) => ({
                name: loan.description,
                amount: loan.amount,
                code: "loan",
                description: loan.description,
                type: "voluntary",
              })),
              // Include existing others from payroll
              ...(payroll.deductions.others || []).map((other) => ({
                name: other.description,
                amount: other.amount,
                code: "other",
                description: other.description,
                type: "voluntary",
              })),
              // Include existing department-specific deductions from payroll
              ...(payroll.deductions.departmentSpecific || []).map(
                (deduction) => ({
                  name: deduction.name,
                  amount: deduction.amount,
                  code: "department",
                  description: deduction.description,
                  type: deduction.type?.toLowerCase() || "voluntary",
                })
              ),
              // Add any additional voluntary deductions from database
              ...voluntaryDeductions.map((deduction) => ({
                name: deduction.name,
                amount: payroll.deductions[deduction.code] || 0,
                code: deduction.code,
                description: deduction.description,
                type: "voluntary",
              })),
            ],
          };

          console.log(
            "✅ Added deduction breakdown to period payroll:",
            payroll._id
          );
        }
      }

      // Calculate period summary
      const summary = {
        totalEmployees: payrollRecords.length,
        totalNetPay: payrollRecords.reduce(
          (sum, record) => sum + record.totals.netPay,
          0
        ),
        totalBasicSalary: payrollRecords.reduce(
          (sum, record) => sum + record.totals.basicSalary,
          0
        ),
        totalAllowances: payrollRecords.reduce(
          (sum, record) => sum + record.totals.totalAllowances,
          0
        ),
        totalDeductions: payrollRecords.reduce(
          (sum, record) => sum + record.totals.totalDeductions,
          0
        ),
        statusBreakdown: payrollRecords.reduce((acc, record) => {
          acc[record.status] = (acc[record.status] || 0) + 1;
          return acc;
        }, {}),
      };

      return res.status(200).json({
        success: true,
        data: {
          period: {
            month: monthNum,
            year: yearNum,
            monthName: new Date(yearNum, monthNum - 1).toLocaleString(
              "default",
              {
                month: "long",
              }
            ),
          },
          employees: payrollRecords.map((record) => ({
            id: record._id,
            employee: {
              id: record.employee._id,
              name: `${record.employee.firstName} ${record.employee.lastName}`,
              employeeId: record.employee.employeeId,
            },
            department: record.department?.name || "Not Assigned",
            salaryGrade: {
              level: record.salaryGrade.level,
              description: record.salaryGrade.description,
            },
            payroll: {
              basicSalary: record.totals.basicSalary,
              totalAllowances: record.totals.totalAllowances,
              totalDeductions: record.totals.totalDeductions,
              netPay: record.totals.netPay,
            },
            status: record.status,
            processedAt: record.createdAt,
          })),
          summary,
        },
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      return res.status(statusCode).json({ success: false, message });
    }
  }

  static async viewPayslip(req, res) {
    try {
      const user = req.user;

      const payroll = await PayrollModel.findById(req.params.payrollId)
        .populate([
          {
            path: "employee",
            select: "firstName lastName employeeId bankDetails department",
          },
          { path: "department", select: "name code" },
          { path: "salaryGrade", select: "level description" },
          { path: "processedBy", select: "firstName lastName" },
          { path: "createdBy", select: "firstName lastName" },
          { path: "updatedBy", select: "firstName lastName" },
          { path: "approvalFlow.submittedBy", select: "firstName lastName" },
          { path: "approvalFlow.approvedBy", select: "firstName lastName" },
        ])
        .lean();

      if (!payroll) {
        throw new ApiError(404, "Payroll record not found");
      }

      // Simple fallback for missing breakdown
      if (payroll.deductions && !payroll.deductions.breakdown) {
        payroll.deductions.breakdown = {
          statutory: [],
          voluntary: [],
        };
      }

      // Check permissions based on user role and department
      if (user.role === UserRole.SUPER_ADMIN) {
        // Super admin can view all payslips
        if (!user.hasPermission(Permission.VIEW_OWN_PAYSLIP)) {
          throw new ApiError(403, "You don't have permission to view payslips");
        }
      } else if (user.role === UserRole.ADMIN) {
        // Admin can only view payslips of their department
        if (!user.hasPermission(Permission.VIEW_DEPARTMENT_PAYSLIPS)) {
          throw new ApiError(
            403,
            "You don't have permission to view department payslips"
          );
        }
        if (
          payroll.employee.department.toString() !== user.department.toString()
        ) {
          throw new ApiError(
            403,
            "You can only view payslips of employees in your department"
          );
        }
      } else {
        // Regular users can only view their own payslips
        if (!user.hasPermission(Permission.VIEW_OWN_PAYSLIP)) {
          throw new ApiError(403, "You don't have permission to view payslips");
        }
        if (payroll.employee._id.toString() !== user._id.toString()) {
          throw new ApiError(403, "You can only view your own payslip");
        }
      }

      // Format the response with detailed payslip information
      const payslipData = {
        _id: payroll._id,
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
          startDate: payroll.periodStart,
          endDate: payroll.periodEnd,
          frequency: payroll.frequency,
        },
        earnings: {
          basicSalary: payroll.basicSalary,
          overtime: payroll.earnings.overtime,
          bonus: payroll.earnings.bonus,
          allowances: payroll.allowances,
          totalEarnings: payroll.totals.grossEarnings,
        },
        deductions: {
          tax: payroll.deductions.tax,
          pension: payroll.deductions.pension,
          nhf: payroll.deductions.nhf,
          loans: payroll.deductions.loans,
          others: payroll.deductions.others,
          totalDeductions: payroll.totals.totalDeductions,
          breakdown: payroll.deductions.breakdown,
        },
        totals: {
          basicSalary: payroll.totals.basicSalary,
          totalAllowances: payroll.totals.totalAllowances,
          totalBonuses: payroll.totals.totalBonuses,
          grossEarnings: payroll.totals.grossEarnings,
          totalDeductions: payroll.totals.totalDeductions,
          netPay: payroll.totals.netPay,
        },
        components: payroll.components,
        status: payroll.status,
        approvalFlow: {
          submittedBy: payroll.approvalFlow.submittedBy
            ? {
                id: payroll.approvalFlow.submittedBy._id,
                name: `${payroll.approvalFlow.submittedBy.firstName} ${payroll.approvalFlow.submittedBy.lastName}`,
                role: payroll.approvalFlow.submittedBy.role,
              }
            : null,
          submittedAt: payroll.approvalFlow.submittedAt,
          approvedBy: payroll.approvalFlow.approvedBy
            ? {
                id: payroll.approvalFlow.approvedBy._id,
                name: `${payroll.approvalFlow.approvedBy.firstName} ${payroll.approvalFlow.approvedBy.lastName}`,
                role: payroll.approvalFlow.approvedBy.role,
              }
            : null,
          approvedAt: payroll.approvalFlow.approvedAt,
          remarks: payroll.approvalFlow.remarks || null,
        },
        processedBy: {
          id: payroll.processedBy._id,
          name: `${payroll.processedBy.firstName} ${payroll.processedBy.lastName}`,
          role: payroll.processedBy.role,
        },
        createdBy: {
          id: payroll.createdBy._id,
          name: `${payroll.createdBy.firstName} ${payroll.createdBy.lastName}`,
          role: payroll.createdBy.role,
        },
        updatedBy: {
          id: payroll.updatedBy._id,
          name: `${payroll.updatedBy.firstName} ${payroll.updatedBy.lastName}`,
          role: payroll.updatedBy.role,
        },
        timestamps: {
          createdAt: payroll.createdAt,
          updatedAt: payroll.updatedAt,
        },
        comments: payroll.comments,
      };

      res.status(200).json({
        success: true,
        message: "Payslip details retrieved successfully",
        data: payslipData,
      });
    } catch (error) {
      console.error("❌ Error fetching payslip details:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message: message || "Failed to fetch payslip details",
      });
    }
  }

  static async getPendingPayrolls(req, res) {
    try {
      const pendingPayrolls = await PayrollModel.find({
        status: "PENDING",
      }).select("_id month year employee department");

      console.log("📊 Pending Payrolls Found:", {
        count: pendingPayrolls.length,
        payrolls: pendingPayrolls.map((p) => ({
          id: p._id,
          period: `${p.month}/${p.year}`,
        })),
      });

      return res.status(200).json({
        success: true,
        count: pendingPayrolls.length,
        pendingPayrolls,
      });
    } catch (error) {
      console.error("❌ Error getting pending payrolls:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to get pending payrolls",
        error: error.message,
      });
    }
  }

  static async getFilteredPayrolls(req, res) {
    try {
      console.log("🔍 Fetching filtered payrolls");
      const { month, year, status, department } = req.query;

      // Build filter object
      const filter = {};

      // Add month filter if provided
      if (month) {
        filter.month = parseInt(month);
      }

      // Add year filter if provided
      if (year) {
        filter.year = parseInt(year);
      }

      // Add status filter if provided
      if (status) {
        filter.status = status;
      }

      // Handle department filter
      if (department) {
        // First find the department by name
        const departmentDoc = await DepartmentModel.findOne({
          name: { $regex: new RegExp(department, "i") },
        });

        if (!departmentDoc) {
          throw new ApiError(404, `Department "${department}" not found`);
        }

        filter.department = departmentDoc._id;
      }

      // Get payrolls with filters
      const payrolls = await PayrollModel.find(filter)
        .populate("employee", "firstName lastName employeeId")
        .populate("department", "name code")
        .populate("salaryGrade", "level description")
        .sort({ createdAt: -1 });

      // Add deduction breakdown to each payroll record if missing (for backward compatibility)
      for (const payroll of payrolls) {
        if (payroll.deductions && !payroll.deductions.breakdown) {
          console.log(
            "🔧 Adding missing deduction breakdown to filtered payroll:",
            payroll._id
          );

          // Get statutory deductions
          const statutoryDeductions = await DeductionModel.find({
            type: "statutory",
            isActive: true,
          }).lean();

          // Get voluntary deductions
          const voluntaryDeductions = await DeductionModel.find({
            type: "voluntary",
            isActive: true,
          }).lean();

          // Create breakdown structure
          payroll.deductions.breakdown = {
            statutory: [
              // Include existing statutory deductions from payroll
              {
                name: "PAYE Tax",
                amount: payroll.deductions.tax?.amount || 0,
                code: "tax",
                description: "Pay As You Earn Tax",
                type: "statutory",
              },
              {
                name: "Pension",
                amount: payroll.deductions.pension?.amount || 0,
                code: "pension",
                description: "Pension Contribution",
                type: "statutory",
              },
              {
                name: "NHF",
                amount: payroll.deductions.nhf?.amount || 0,
                code: "nhf",
                description: "National Housing Fund",
                type: "statutory",
              },
              // Add any additional statutory deductions from database
              ...statutoryDeductions
                .filter(
                  (deduction) =>
                    !["tax", "pension", "nhf"].includes(deduction.code)
                )
                .map((deduction) => ({
                  name: deduction.name,
                  amount: payroll.deductions[deduction.code] || 0,
                  code: deduction.code,
                  description: deduction.description,
                  type: "statutory",
                })),
            ],
            voluntary: [
              // Include existing loans from payroll
              ...(payroll.deductions.loans || []).map((loan) => ({
                name: loan.description,
                amount: loan.amount,
                code: "loan",
                description: loan.description,
                type: "voluntary",
              })),
              // Include existing others from payroll
              ...(payroll.deductions.others || []).map((other) => ({
                name: other.description,
                amount: other.amount,
                code: "other",
                description: other.description,
                type: "voluntary",
              })),
              // Include existing department-specific deductions from payroll
              ...(payroll.deductions.departmentSpecific || []).map(
                (deduction) => ({
                  name: deduction.name,
                  amount: deduction.amount,
                  code: "department",
                  description: deduction.description,
                  type: deduction.type?.toLowerCase() || "voluntary",
                })
              ),
              // Add any additional voluntary deductions from database
              ...voluntaryDeductions.map((deduction) => ({
                name: deduction.name,
                amount: payroll.deductions[deduction.code] || 0,
                code: deduction.code,
                description: deduction.description,
                type: "voluntary",
              })),
            ],
          };

          console.log(
            "✅ Added deduction breakdown to filtered payroll:",
            payroll._id
          );
        }
      }

      console.log(`✅ Found ${payrolls.length} payrolls matching filters`);

      res.status(200).json({
        success: true,
        data: payrolls,
        count: payrolls.length,
      });
    } catch (error) {
      console.error("❌ Error fetching filtered payrolls:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async approvePayroll(req, res, next) {
    try {
      const { id } = req.params;
      const { remarks } = req.body;
      const admin = await UserModel.findById(req.user.id);

      console.log(
        `\n🔍 Starting Super Admin payroll approval process for ID: ${id}`
      );
      console.log(
        `👤 Approver: ${admin.firstName} ${admin.lastName} (${admin.position})`
      );
      console.log(`🏢 Department: ${admin.department?.name || "Not assigned"}`);
      console.log(`📝 Remarks: ${remarks || "None provided"}`);

      // Check if user is a Super Admin
      if (
        admin.role !== "ADMIN" ||
        !admin.permissions.includes("MANAGE_SYSTEM")
      ) {
        console.error(`❌ Permission denied for user: ${admin._id}`);
        throw new ApiError(
          403,
          "You must be a Super Admin to approve at this level"
        );
      }

      const payroll = await PayrollModel.findById(id);
      // ... approval logic
      // ... notification logic
    } catch (error) {
      next(error);
    }
  }

  static async updatePayrollStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, remarks } = req.body;
      const user = req.user;

      // Validate status transition
      const payroll = await PayrollModel.findById(id);
      if (!payroll) {
        return res.status(404).json({
          success: false,
          message: "Payroll not found",
        });
      }

      // Check if user has permission to update payroll status
      if (!user.hasPermission(Permission.APPROVE_PAYROLL)) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to update payroll status",
        });
      }

      // Update payroll status
      payroll.status = status;
      if (remarks) payroll.remarks = remarks;
      await payroll.save();

      // Create audit log
      await Audit.create({
        user: user._id,
        action: "UPDATE_PAYROLL_STATUS",
        details: {
          payrollId: id,
          oldStatus: payroll.status,
          newStatus: status,
          remarks,
        },
      });

      res.json({
        success: true,
        message: "Payroll status updated successfully",
        data: payroll,
      });
    } catch (error) {
      next(error);
    }
  }

  static async processPayment(req, res, next) {
    try {
      const { id } = req.params;
      const user = req.user;

      // Find the payroll
      const payroll = await PayrollModel.findById(id);
      if (!payroll) {
        return res.status(404).json({
          success: false,
          message: "Payroll not found",
        });
      }

      // Check if user has permission to process payments
      if (!user.hasPermission(Permission.APPROVE_PAYROLL)) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to process payments",
        });
      }

      // Validate payroll status
      if (payroll.status !== PAYROLL_STATUS.APPROVED) {
        return res.status(400).json({
          success: false,
          message: "Only approved payrolls can be processed for payment",
        });
      }

      // Update payroll status to PAID
      payroll.status = PAYROLL_STATUS.PAID;
      payroll.approvalFlow = {
        ...payroll.approvalFlow,
        paidBy: user._id,
        paidAt: new Date(),
        remarks: "Payment processed successfully",
      };
      await payroll.save();

      // Create payment record
      await Payment.create({
        payrollId: payroll._id,
        employeeId: payroll.employee,
        amount: payroll.totals.netPay,
        status: "COMPLETED",
        processedBy: user._id,
        processedAt: new Date(),
        paymentMethod: "BANK_TRANSFER",
        reference: `PAY-${Date.now()}`,
        bankDetails: payroll.payment,
      });

      // Create audit log
      await Audit.create({
        user: user._id,
        action: AuditAction.PROCESS,
        entity: AuditEntity.PAYROLL,
        entityId: payroll._id,
        performedBy: user._id,
        details: {
          previousStatus: payroll.status,
          newStatus: PAYROLL_STATUS.PAID,
          amount: payroll.totals.netPay,
        },
      });

      // Create notification for employee
      await NotificationService.createPayrollNotification(
        payroll.employee._id,
        NOTIFICATION_TYPES.PAYROLL_PAID,
        payroll,
        "Your payment has been processed successfully"
      );

      res.status(200).json({
        success: true,
        message: "Payment processed successfully",
        data: {
          payrollId: payroll._id,
          amount: payroll.totals.netPay,
          status: payroll.status,
          paymentDate: payroll.approvalFlow.paidAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  //Onboarding & Offboarding

  static async getActiveEmployees(req, res) {
    try {
      const employees = await UserModel.find({
        status: "active",
        role: { $ne: UserRole.SUPER_ADMIN },
      })
        .select("-password")
        .populate("department", "name code")
        .sort({ firstName: 1 });

      res.status(200).json({
        success: true,
        data: employees,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }
  static async getOnboardingEmployees(req, res) {
    try {
      console.log("🔍 Fetching onboarding employees");

      const employees = await UserModel.find({
        role: UserRole.USER,
        status: "pending",
      })
        .select("-password")
        .populate("department", "name code")
        .sort({ createdAt: -1 });

      console.log(`📋 Found ${employees.length} onboarding employees`);

      res.status(200).json({
        success: true,
        data: employees,
      });
    } catch (error) {
      console.error("❌ Error in getOnboardingEmployees:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message: "Failed to fetch onboarding employees",
      });
    }
  }

  static async getOffboardingEmployees(req, res) {
    try {
      console.log("🔍 Fetching offboarding employees");

      const offboardingEmployees = await UserModel.find({
        role: UserRole.USER,
        $or: [
          { status: "offboarding" },
          { "offboarding.status": { $in: ["in_progress", "completed"] } },
        ],
      })
        .select("-password")
        .populate("department", "name code")
        .populate("offboarding.completedBy", "firstName lastName")
        .sort({ "offboarding.initiatedAt": -1 });

      console.log(
        `📋 Found ${offboardingEmployees.length} offboarding employees`
      );

      return res.status(200).json({
        success: true,
        data: offboardingEmployees,
      });
    } catch (error) {
      console.error("❌ Error fetching offboarding employees:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch offboarding employees",
      });
    }
  }

  static async initiateOffboarding(req, res) {
    try {
      console.log(
        "🔄 Processing offboarding request for:",
        req.params.employeeId
      );

      const employeeId = req.params.employeeId;
      const employee = await UserModel.findById(employeeId);

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      const updatedEmployee = await UserModel.findByIdAndUpdate(
        employeeId,
        {
          $set: {
            status: "offboarding",
            offboarding: {
              status: "pending_exit",
              lastWorkingDay: new Date(),
              initiatedAt: new Date(),
              initiatedBy: req.user._id,
              checklist: {
                exitInterview: false,
                assetsReturned: false,
                knowledgeTransfer: false,
                accessRevoked: false,
                finalSettlement: false,
              },
            },
          },
        },
        { new: true }
      ).populate("department", "name code");

      console.log("✅ Offboarding initiated successfully for:", employeeId);

      return res.status(200).json({
        success: true,
        message: "Offboarding initiated successfully",
        data: updatedEmployee,
      });
    } catch (error) {
      console.error("❌ Error in initiateOffboarding:", error);
      const { statusCode, message } = handleError(error);
      return res.status(statusCode).json({
        success: false,
        message: message || "Failed to initiate offboarding",
      });
    }
  }

  static async revertToOnboarding(req, res) {
    try {
      console.log(
        "🔄 Reverting employee to onboarding:",
        req.params.employeeId
      );

      const employeeId = req.params.employeeId;
      const employee = await UserModel.findById(employeeId);

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      const updatedEmployee = await UserModel.findByIdAndUpdate(
        employeeId,
        {
          $set: {
            status: "pending",
            offboarding: null,
          },
        },
        { new: true }
      ).populate("department", "name code");

      return res.status(200).json({
        success: true,
        message: "Employee reverted to onboarding successfully",
        data: updatedEmployee,
      });
    } catch (error) {
      console.error("❌ Error in revertToOnboarding:", error);
      const { statusCode, message } = handleError(error);
      return res.status(statusCode).json({
        success: false,
        message: message || "Failed to revert employee to onboarding",
      });
    }
  }

  static async updateOffboardingStatus(req, res) {
    try {
      console.log("🔄 Updating offboarding status for:", req.params.employeeId);

      const employeeId = req.params.employeeId;
      const updates = req.body;

      const employee = await UserModel.findById(employeeId);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      // Calculate completion status
      const checklist = updates.checklist;
      const totalItems = Object.keys(checklist).length;
      const completedItems = Object.values(checklist).filter(Boolean).length;
      const isCompleted = completedItems === totalItems;

      // Update with completion tracking
      const updatedEmployee = await UserModel.findByIdAndUpdate(
        employeeId,
        {
          $set: {
            "offboarding.checklist": updates.checklist,
            "offboarding.status": updates.status,
            "offboarding.progress": (completedItems / totalItems) * 100,
            ...(isCompleted
              ? {
                  "offboarding.completedAt": new Date(),
                  "offboarding.completedBy": req.user._id,
                  status: "completed", // Update main employee status
                }
              : {}),
          },
        },
        { new: true }
      ).populate("department", "name code");

      return res.status(200).json({
        success: true,
        message: "Offboarding status updated successfully",
        data: updatedEmployee,
      });
    } catch (error) {
      console.error("❌ Error updating offboarding status:", error);
      const { statusCode, message } = handleError(error);
      return res.status(statusCode).json({
        success: false,
        message: message || "Failed to update offboarding status",
      });
    }
  }

  static async archiveEmployee(req, res) {
    try {
      console.log("🔄 Archiving employee:", req.params.employeeId);

      const employeeId = req.params.employeeId;
      const employee = await UserModel.findById(employeeId);

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      // Archive the employee
      const archivedEmployee = await UserModel.findByIdAndUpdate(
        employeeId,
        {
          $set: {
            status: "archived",
            "archive.archivedAt": new Date(),
            "archive.archivedBy": req.user._id,
          },
        },
        { new: true }
      ).populate("department", "name code");

      return res.status(200).json({
        success: true,
        message: "Employee archived successfully",
        data: archivedEmployee,
      });
    } catch (error) {
      console.error("❌ Error archiving employee:", error);
      const { statusCode, message } = handleError(error);
      return res.status(statusCode).json({
        success: false,
        message: message || "Failed to archive employee",
      });
    }
  }

  // ===== Payroll Management =====
  static async createPayroll(req, res) {
    try {
      const {
        employee,
        month,
        year,
        salaryGrade,
        frequency = PayrollFrequency.MONTHLY,
      } = req.body;

      // Validate month and year
      const currentDate = new Date();
      if (
        year < currentDate.getFullYear() ||
        (year === currentDate.getFullYear() &&
          month < currentDate.getMonth() + 1)
      ) {
        throw new ApiError(400, "Cannot create payroll for past dates");
      }

      if (month < 1 || month > 12) {
        throw new ApiError(400, "Invalid month");
      }

      // Validate frequency
      if (!Object.values(PayrollFrequency).includes(frequency)) {
        throw new ApiError(400, "Invalid payroll frequency");
      }

      // Get calculations from PayrollService
      const calculations = await PayrollService.calculatePayroll(
        employee,
        salaryGrade,
        month,
        year,
        frequency
      );

      // Create payroll data with all required fields
      const payrollData = {
        ...calculations,
        processedBy: req.user.id,
        createdBy: req.user.id,
        updatedBy: req.user.id,
        approvalFlow: {
          currentLevel: APPROVAL_LEVELS.PROCESSING,
          history: [],
          submittedBy: req.user.id,
          submittedAt: new Date(),
          status: PAYROLL_STATUS.PROCESSING,
          remarks: "Initial payroll creation",
        },
        status: PAYROLL_STATUS.PROCESSING,
        payment: {
          bankName: "Pending",
          accountNumber: "Pending",
          accountName: "Pending",
        },
      };

      const payroll = await PayrollModel.create(payrollData);
      const populatedPayroll = await PayrollModel.findById(
        payroll._id
      ).populate([
        {
          path: "employee",
          select: "firstName lastName employeeId department",
          populate: {
            path: "department",
            select: "name code",
          },
        },
        { path: "department", select: "name code" },
        { path: "salaryGrade", select: "level description" },
        { path: "processedBy", select: "firstName lastName" },
        { path: "createdBy", select: "firstName lastName" },
        { path: "updatedBy", select: "firstName lastName" },
        { path: "approvalFlow.submittedBy", select: "firstName lastName" },
      ]);

      // Ensure department is set from employee's department if not already set
      if (
        !populatedPayroll.department &&
        populatedPayroll.employee.department
      ) {
        populatedPayroll.department = populatedPayroll.employee.department;
        await populatedPayroll.save();
      }

      // Consolidated audit logging - replaces redundant logging
      await PayrollStatisticsLogger.logPayrollAction({
        action: AuditAction.CREATE,
        payrollId: payroll._id,
        userId: req.user.id,
        status: PAYROLL_STATUS.PROCESSING,
        details: {
          employeeId: employee,
          departmentId:
            populatedPayroll.department?._id ||
            populatedPayroll.employee?.department?._id,
          month,
          year,
          frequency,
          netPay: populatedPayroll.totals?.netPay,
          employeeName: `${populatedPayroll.employee?.firstName} ${populatedPayroll.employee?.lastName}`,
          departmentName:
            populatedPayroll.department?.name ||
            populatedPayroll.employee?.department?.name,
          createdBy: req.user.id,
          position: req.user.position,
          role: req.user.role,
          message: `Created payroll for ${populatedPayroll.employee?.firstName} ${populatedPayroll.employee?.lastName}`,
          approvalLevel: APPROVAL_LEVELS.PROCESSING,
          remarks: "Initial payroll creation",
        },
      });

      // Create notification for the employee
      console.log(`🔔 Creating notification for employee: ${employee}`);
      await NotificationService.createPayrollNotification(
        populatedPayroll,
        NOTIFICATION_TYPES.PAYROLL_DRAFT_CREATED,
        populatedPayroll.employee
      );

      // Create notification for the super admin
      console.log(`🔔 Creating notification for super admin: ${req.user.id}`);
      await NotificationService.createPayrollNotification(
        populatedPayroll,
        NOTIFICATION_TYPES.PAYROLL_DRAFT_CREATED,
        req.user
      );

      res.status(201).json({
        success: true,
        message: "Payroll record created successfully",
        data: populatedPayroll,
      });
    } catch (error) {
      console.error("❌ Error in createPayroll:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create payroll record",
        error: error.message,
      });
    }
  }

  static async deletePayroll(req, res) {
    try {
      const { id } = req.params;
      console.log("🗑️ Attempting to delete payroll:", id);

      const payroll = await PayrollModel.findById(id);
      if (!payroll) {
        throw new ApiError(404, "Payroll record not found");
      }

      await PayrollModel.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: "Payroll record deleted successfully",
      });
    } catch (error) {
      console.error("❌ Error deleting payroll:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message: message || "Failed to delete payroll record",
      });
    }
  }

  static async getAllPayrolls(req, res) {
    try {
      const {
        month,
        year,
        status,
        department,
        dateRange,
        frequency = "monthly",
        employee,
      } = req.query;

      let query = {};

      // Period filtering
      if (month && year) {
        query.month = parseInt(month);
        query.year = parseInt(year);
      } else if (dateRange) {
        // Handle special date range cases
        const endDate = new Date();
        const startDate = new Date();

        if (dateRange === "last3") {
          startDate.setMonth(startDate.getMonth() - 3);
        } else if (dateRange === "last6") {
          startDate.setMonth(startDate.getMonth() - 6);
        } else if (dateRange === "last12") {
          startDate.setMonth(startDate.getMonth() - 12);
        } else if (dateRange === "custom") {
          startDate.setMonth(startDate.getMonth() - 3);
        } else {
          const [startDateStr, endDateStr] = dateRange.split(",");
          if (startDateStr && endDateStr) {
            query.createdAt = {
              $gte: new Date(startDateStr),
              $lte: new Date(endDateStr),
            };
            // Skip the default date range assignment
            return;
          }
        }

        query.createdAt = {
          $gte: startDate,
          $lte: endDate,
        };
      }

      // Status filtering
      if (status && status !== "all") {
        query.status = status;
      }

      // Department filtering
      if (department && department !== "all") {
        query.department = department;
      }

      // Employee filtering
      if (employee && employee !== "all") {
        query.employee = employee;
      }

      // Frequency filtering
      if (frequency && frequency !== "all") {
        query.frequency = frequency;
      }

      // Get paginated results
      const page = parseInt(req.query.page) || 1;
      const limit = req.query.limit ? parseInt(req.query.limit) : null;
      const skip = limit ? (page - 1) * limit : 0;

      let queryBuilder = PayrollModel.find(query)
        .sort({ createdAt: -1, year: -1, month: -1 })
        .populate([
          { path: "employee", select: "firstName lastName employeeId" },
          { path: "department", select: "name code" },
          { path: "salaryGrade", select: "level description" },
        ]);

      // Only apply pagination if limit is specified
      if (limit) {
        queryBuilder = queryBuilder.skip(skip).limit(limit);
      }

      const payrolls = await queryBuilder;
      const total = await PayrollModel.countDocuments(query);

      // Simple fallback for missing breakdown
      const payrollsWithFallback = payrolls.map((payroll) => {
        const payrollObj = payroll.toObject();

        if (!payrollObj.deductions.breakdown) {
          payrollObj.deductions.breakdown = {
            statutory: [],
            voluntary: [],
          };
        }

        return payrollObj;
      });

      // Calculate frequency-based totals
      const frequencyTotals = await PayrollModel.aggregate([
        {
          $match: {
            ...query,
            status: { $ne: PAYROLL_STATUS.DRAFT },
          },
        },
        {
          $group: {
            _id: "$frequency",
            totalNetPay: { $sum: "$totals.netPay" },
            totalGrossPay: { $sum: "$totals.grossEarnings" },
            totalDeductions: { $sum: "$totals.totalDeductions" },
            count: { $sum: 1 },
            paidCount: {
              $sum: { $cond: [{ $eq: ["$status", "PAID"] }, 1, 0] },
            },
            approvedCount: {
              $sum: { $cond: [{ $eq: ["$status", "APPROVED"] }, 1, 0] },
            },
            pendingCount: {
              $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] },
            },
            pendingPaymentCount: {
              $sum: { $cond: [{ $eq: ["$status", "PENDING_PAYMENT"] }, 1, 0] },
            },
            processingCount: {
              $sum: { $cond: [{ $eq: ["$status", "PROCESSING"] }, 1, 0] },
            },
            rejectedCount: {
              $sum: { $cond: [{ $eq: ["$status", "REJECTED"] }, 1, 0] },
            },
            cancelledCount: {
              $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] },
            },
          },
        },
      ]);

      // Calculate status breakdown
      const statusBreakdown = await PayrollModel.aggregate([
        {
          $match: {
            ...query,
            status: { $ne: PAYROLL_STATUS.DRAFT },
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalNetPay: { $sum: "$totals.netPay" },
          },
        },
      ]);

      // Calculate department breakdown
      const departmentBreakdown = await PayrollModel.aggregate([
        {
          $match: {
            ...query,
            status: { $ne: PAYROLL_STATUS.DRAFT },
          },
        },
        {
          $group: {
            _id: "$department",
            count: { $sum: 1 },
            totalNetPay: { $sum: "$totals.netPay" },
          },
        },
        {
          $lookup: {
            from: "departments",
            localField: "_id",
            foreignField: "_id",
            as: "departmentInfo",
          },
        },
        { $unwind: "$departmentInfo" },
        {
          $project: {
            departmentName: "$departmentInfo.name",
            count: 1,
            totalNetPay: 1,
          },
        },
      ]);

      res.status(200).json({
        success: true,
        data: {
          payrolls: payrollsWithFallback,
          pagination: {
            total,
            page,
            pages: Math.ceil(total / limit),
          },
          summary: {
            frequencyTotals,
            statusBreakdown,
            departmentBreakdown,
          },
        },
      });
    } catch (error) {
      console.error("❌ Error in getAllPayrolls:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch payrolls",
        error: error.message,
      });
    }
  }

  static async getEmployeePayrollHistory(req, res) {
    try {
      const { employeeId } = req.params;
      console.log("🔍 Fetching payroll history for employee:", employeeId);

      // Add this debug log
      console.log("Looking for employee in UserModel with ID:", employeeId);

      // Get employee with populated fields
      const employee = await UserModel.findById(employeeId).populate([
        { path: "department", select: "name code" },
        { path: "salaryGrade", select: "level description" },
      ]);

      // Add this debug log
      console.log("Found employee:", employee);

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      // Get payroll history - modify this part
      const payrollHistory = await PayrollModel.find({
        employee: employeeId, // Changed from asObjectId(employeeId)
      })
        .populate([
          {
            path: "employee",
            select: "firstName lastName employeeId bankDetails",
          },
          {
            path: "department",
            select: "name code",
          },
          {
            path: "salaryGrade",
            select: "level description",
          },
        ])
        .sort({ year: -1, month: -1 })
        .lean();

      // Add this debug log
      console.log("Found payroll history:", payrollHistory);

      // Add deduction breakdown to each payroll record if missing (for backward compatibility)
      for (const payroll of payrollHistory) {
        if (payroll.deductions && !payroll.deductions.breakdown) {
          console.log(
            "🔧 Adding missing deduction breakdown to payroll in history:",
            payroll._id
          );

          // Get statutory deductions
          const statutoryDeductions = await DeductionModel.find({
            type: "statutory",
            isActive: true,
          }).lean();

          // Get voluntary deductions
          const voluntaryDeductions = await DeductionModel.find({
            type: "voluntary",
            isActive: true,
          }).lean();

          // Create breakdown structure
          payroll.deductions.breakdown = {
            statutory: [
              // Include existing statutory deductions from payroll
              {
                name: "PAYE Tax",
                amount: payroll.deductions.tax?.amount || 0,
                code: "tax",
                description: "Pay As You Earn Tax",
                type: "statutory",
              },
              {
                name: "Pension",
                amount: payroll.deductions.pension?.amount || 0,
                code: "pension",
                description: "Pension Contribution",
                type: "statutory",
              },
              {
                name: "NHF",
                amount: payroll.deductions.nhf?.amount || 0,
                code: "nhf",
                description: "National Housing Fund",
                type: "statutory",
              },
              // Add any additional statutory deductions from database
              ...statutoryDeductions
                .filter(
                  (deduction) =>
                    !["tax", "pension", "nhf"].includes(deduction.code)
                )
                .map((deduction) => ({
                  name: deduction.name,
                  amount: payroll.deductions[deduction.code] || 0,
                  code: deduction.code,
                  description: deduction.description,
                  type: "statutory",
                })),
            ],
            voluntary: [
              // Include existing loans from payroll
              ...(payroll.deductions.loans || []).map((loan) => ({
                name: loan.description,
                amount: loan.amount,
                code: "loan",
                description: loan.description,
                type: "voluntary",
              })),
              // Include existing others from payroll
              ...(payroll.deductions.others || []).map((other) => ({
                name: other.description,
                amount: other.amount,
                code: "other",
                description: other.description,
                type: "voluntary",
              })),
              // Include existing department-specific deductions from payroll
              ...(payroll.deductions.departmentSpecific || []).map(
                (deduction) => ({
                  name: deduction.name,
                  amount: deduction.amount,
                  code: "department",
                  description: deduction.description,
                  type: deduction.type?.toLowerCase() || "voluntary",
                })
              ),
              // Add any additional voluntary deductions from database
              ...voluntaryDeductions.map((deduction) => ({
                name: deduction.name,
                amount: payroll.deductions[deduction.code] || 0,
                code: deduction.code,
                description: deduction.description,
                type: "voluntary",
              })),
            ],
          };

          console.log(
            "✅ Added deduction breakdown to payroll in history:",
            payroll._id
          );
        }
      }

      // Calculate summary
      const approvedPayrolls = payrollHistory.filter(
        (record) => record.status === PAYROLL_STATUS.APPROVED
      );

      const totalPaid = approvedPayrolls.reduce(
        (sum, record) => sum + record.totals.netPay,
        0
      );

      // Format payroll history to remove redundancy
      const formattedPayrollHistory = payrollHistory.map((record) => ({
        period: {
          month: record.month,
          year: record.year,
        },
        earnings: {
          basicSalary: record.basicSalary,
          allowances: record.allowances,
          bonuses: record.bonuses,
          totalEarnings: record.totals.grossEarnings,
        },
        deductions: record.deductions,
        totals: record.totals,
        status: record.status,
        processedAt: record.createdAt,
      }));

      // Get the latest salary grade from the most recent payroll record
      const latestPayroll = payrollHistory[0];
      const currentSalaryGrade =
        latestPayroll?.salaryGrade?.level ||
        employee.salaryGrade?.level ||
        "Not Assigned";

      return res.status(200).json({
        success: true,
        data: {
          employee: {
            id: employee._id,
            name: `${employee.firstName} ${employee.lastName}`,
            employeeId: employee.employeeId,
            department: employee.department?.name || "Not Assigned",
            salaryGrade: currentSalaryGrade,
          },
          payrollHistory: formattedPayrollHistory,
          summary: {
            totalRecords: payrollHistory.length,
            latestPayroll: {
              period: latestPayroll
                ? {
                    month: latestPayroll.month,
                    year: latestPayroll.year,
                  }
                : null,
              status: latestPayroll?.status || null,
              totals: latestPayroll?.totals || null,
            },
            totalPaid,
            averagePayroll:
              approvedPayrolls.length > 0
                ? totalPaid / approvedPayrolls.length
                : 0,
          },
        },
      });
    } catch (error) {
      console.error("❌ Error fetching employee payroll history:", error);
      const { statusCode, message } = handleError(error);
      return res.status(statusCode).json({
        success: false,
        message: message || "Failed to fetch employee payroll history",
      });
    }
  }

  static async getPayrollById(req, res) {
    try {
      const { id } = req.params;
      const payroll = await PayrollModel.findById(id)
        .populate(
          "employee",
          "firstName lastName employeeId position gradeLevel"
        )
        .populate("salaryGrade", "level basicSalary allowances deductions");

      if (!payroll) {
        return res.status(404).json({
          success: false,
          message: "Payroll not found",
        });
      }

      // Simple fallback for missing breakdown
      if (payroll.deductions && !payroll.deductions.breakdown) {
        payroll.deductions.breakdown = {
          statutory: [],
          voluntary: [],
        };
      }

      res.json({
        success: true,
        data: payroll,
      });
    } catch (error) {
      console.error("Error fetching payroll:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching payroll",
      });
    }
  }

  static async updatePayroll(req, res) {
    try {
      const { id } = req.params;
      const { month, year, employee, salaryGrade } = req.body;

      // Find the payroll
      const payroll = await PayrollModel.findById(id);

      if (!payroll) {
        return res.status(404).json({
          success: false,
          message: "Payroll not found",
        });
      }

      // Only allow updates to DRAFT payrolls
      if (payroll.status !== "DRAFT") {
        return res.status(403).json({
          success: false,
          message: "Only draft payrolls can be edited",
          status: payroll.status,
        });
      }

      // Update the payroll
      payroll.month = month;
      payroll.year = year;
      payroll.employee = employee;
      payroll.salaryGrade = salaryGrade;
      payroll.processedDate = new Date(year, month - 1);

      // Recalculate payroll
      const updatedPayroll = await payroll.save();

      res.json({
        success: true,
        message: "Payroll updated successfully",
        data: updatedPayroll,
      });
    } catch (error) {
      console.error("Error updating payroll:", error);
      res.status(500).json({
        success: false,
        message: "Error updating payroll",
      });
    }
  }

  static async getPayrollPeriods(req, res) {
    try {
      const { department } = req.query; // Optional department filter

      const matchStage = department
        ? { department: new Types.ObjectId(department) }
        : {};

      const periods = await PayrollModel.aggregate([
        {
          $match: matchStage,
        },
        {
          $group: {
            _id: {
              year: "$year",
              month: "$month",
              department: "$department",
            },
            count: { $sum: 1 },
            totalAmount: { $sum: "$netPay" },
            statuses: { $addToSet: "$status" },
            pendingCount: {
              $sum: {
                $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0],
              },
            },
            approvedCount: {
              $sum: {
                $cond: [{ $eq: ["$status", "APPROVED"] }, 1, 0],
              },
            },
            rejectedCount: {
              $sum: {
                $cond: [{ $eq: ["$status", "REJECTED"] }, 1, 0],
              },
            },
            paidCount: {
              $sum: {
                $cond: [{ $eq: ["$status", "PAID"] }, 1, 0],
              },
            },
          },
        },
        {
          $lookup: {
            from: "departments",
            localField: "_id.department",
            foreignField: "_id",
            as: "departmentInfo",
          },
        },
        {
          $project: {
            _id: 0,
            year: "$_id.year",
            month: "$_id.month",
            department: {
              $arrayElemAt: ["$departmentInfo.name", 0],
            },
            count: 1,
            totalAmount: 1,
            statuses: 1,
            statusCounts: {
              pending: "$pendingCount",
              approved: "$approvedCount",
              rejected: "$rejectedCount",
              paid: "$paidCount",
            },
          },
        },
        {
          $sort: { year: -1, month: -1 },
        },
      ]);

      res.status(200).json({
        success: true,
        data: periods,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPayrollStats(req, res) {
    try {
      // Allow query parameters to override default current period
      const month = parseInt(req.query.month) || new Date().getMonth() + 1;
      const year = parseInt(req.query.year) || new Date().getFullYear();
      const status = req.query.status;
      const department = req.query.department;
      const startDate = req.query.startDate;
      const endDate = req.query.endDate;

      console.log("Fetching stats for period:", {
        month,
        year,
        status,
        department,
        startDate,
        endDate,
      });

      // Build match conditions
      const matchConditions = {
        month: month,
        year: year,
        status: {
          $in: [
            "PENDING",
            "PROCESSING",
            "APPROVED",
            "REJECTED",
            "PAID",
            "CANCELLED",
            "FAILED",
            "COMPLETED",
            "PENDING_PAYMENT",
          ],
        },
      };

      // Add status filter if provided
      if (status && status !== "ALL") {
        matchConditions.status = status;
      }

      // Add department filter if provided
      if (department && department !== "ALL") {
        matchConditions.department = new Types.ObjectId(department);
      }

      // Add date range filter if provided
      if (startDate || endDate) {
        matchConditions.createdAt = {};
        if (startDate) {
          matchConditions.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          matchConditions.createdAt.$lte = new Date(endDate);
        }
      }

      console.log(
        "Match conditions:",
        JSON.stringify(matchConditions, null, 2)
      );

      const stats = await PayrollModel.aggregate([
        {
          $match: matchConditions,
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalNetPay: { $sum: "$totals.netPay" },
          },
        },
      ]);

      console.log("Aggregated stats:", stats);

      // Calculate totals
      const totalCount = stats.reduce((sum, stat) => sum + stat.count, 0);
      const totalAmount = stats.reduce(
        (sum, stat) => sum + stat.totalNetPay,
        0
      );

      res.status(200).json({
        success: true,
        data: {
          stats,
          summary: {
            totalCount,
            totalAmount,
          },
        },
        period: {
          month,
          year,
        },
        filters: {
          status,
          department,
          startDate,
          endDate,
        },
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async getPeriodPayroll(req, res) {
    try {
      const { month, year } = req.params;

      // Validate month and year
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);

      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({
          success: false,
          message: "Invalid month",
        });
      }

      if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
        return res.status(400).json({
          success: false,
          message: "Invalid year",
        });
      }

      // Get all payroll records for the specified period
      const payrollRecords = await PayrollModel.find({
        month: monthNum,
        year: yearNum,
      })
        .populate("employee", "firstName lastName fullName employeeId")
        .populate("department", "name code")
        .populate("salaryGrade", "level description")
        .lean();

      // Add deduction breakdown to each payroll record if missing (for backward compatibility)
      for (const payroll of payrollRecords) {
        if (payroll.deductions && !payroll.deductions.breakdown) {
          console.log(
            "🔧 Adding missing deduction breakdown to period payroll:",
            payroll._id
          );

          // Get statutory deductions
          const statutoryDeductions = await DeductionModel.find({
            type: "statutory",
            isActive: true,
          }).lean();

          // Get voluntary deductions
          const voluntaryDeductions = await DeductionModel.find({
            type: "voluntary",
            isActive: true,
          }).lean();

          // Create breakdown structure
          payroll.deductions.breakdown = {
            statutory: [
              // Include existing statutory deductions from payroll
              {
                name: "PAYE Tax",
                amount: payroll.deductions.tax?.amount || 0,
                code: "tax",
                description: "Pay As You Earn Tax",
                type: "statutory",
              },
              {
                name: "Pension",
                amount: payroll.deductions.pension?.amount || 0,
                code: "pension",
                description: "Pension Contribution",
                type: "statutory",
              },
              {
                name: "NHF",
                amount: payroll.deductions.nhf?.amount || 0,
                code: "nhf",
                description: "National Housing Fund",
                type: "statutory",
              },
              // Add any additional statutory deductions from database
              ...statutoryDeductions
                .filter(
                  (deduction) =>
                    !["tax", "pension", "nhf"].includes(deduction.code)
                )
                .map((deduction) => ({
                  name: deduction.name,
                  amount: payroll.deductions[deduction.code] || 0,
                  code: deduction.code,
                  description: deduction.description,
                  type: "statutory",
                })),
            ],
            voluntary: [
              // Include existing loans from payroll
              ...(payroll.deductions.loans || []).map((loan) => ({
                name: loan.description,
                amount: loan.amount,
                code: "loan",
                description: loan.description,
                type: "voluntary",
              })),
              // Include existing others from payroll
              ...(payroll.deductions.others || []).map((other) => ({
                name: other.description,
                amount: other.amount,
                code: "other",
                description: other.description,
                type: "voluntary",
              })),
              // Include existing department-specific deductions from payroll
              ...(payroll.deductions.departmentSpecific || []).map(
                (deduction) => ({
                  name: deduction.name,
                  amount: deduction.amount,
                  code: "department",
                  description: deduction.description,
                  type: deduction.type?.toLowerCase() || "voluntary",
                })
              ),
              // Add any additional voluntary deductions from database
              ...voluntaryDeductions.map((deduction) => ({
                name: deduction.name,
                amount: payroll.deductions[deduction.code] || 0,
                code: deduction.code,
                description: deduction.description,
                type: "voluntary",
              })),
            ],
          };

          console.log(
            "✅ Added deduction breakdown to period payroll:",
            payroll._id
          );
        }
      }

      // Calculate period summary
      const summary = {
        totalEmployees: payrollRecords.length,
        totalNetPay: payrollRecords.reduce(
          (sum, record) => sum + record.totals.netPay,
          0
        ),
        totalBasicSalary: payrollRecords.reduce(
          (sum, record) => sum + record.totals.basicSalary,
          0
        ),
        totalAllowances: payrollRecords.reduce(
          (sum, record) => sum + record.totals.totalAllowances,
          0
        ),
        totalDeductions: payrollRecords.reduce(
          (sum, record) => sum + record.totals.totalDeductions,
          0
        ),
        statusBreakdown: payrollRecords.reduce((acc, record) => {
          acc[record.status] = (acc[record.status] || 0) + 1;
          return acc;
        }, {}),
      };

      return res.status(200).json({
        success: true,
        data: {
          period: {
            month: monthNum,
            year: yearNum,
            monthName: new Date(yearNum, monthNum - 1).toLocaleString(
              "default",
              {
                month: "long",
              }
            ),
          },
          employees: payrollRecords.map((record) => ({
            id: record._id,
            employee: {
              id: record.employee._id,
              name: `${record.employee.firstName} ${record.employee.lastName}`,
              employeeId: record.employee.employeeId,
            },
            department: record.department?.name || "Not Assigned",
            salaryGrade: {
              level: record.salaryGrade.level,
              description: record.salaryGrade.description,
            },
            payroll: {
              basicSalary: record.totals.basicSalary,
              totalAllowances: record.totals.totalAllowances,
              totalDeductions: record.totals.totalDeductions,
              netPay: record.totals.netPay,
            },
            status: record.status,
            processedAt: record.createdAt,
          })),
          summary,
        },
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      return res.status(statusCode).json({ success: false, message });
    }
  }

  static async viewPayslip(req, res) {
    try {
      const user = req.user;

      const payroll = await PayrollModel.findById(req.params.payrollId)
        .populate([
          {
            path: "employee",
            select: "firstName lastName employeeId bankDetails department",
          },
          { path: "department", select: "name code" },
          { path: "salaryGrade", select: "level description" },
          { path: "processedBy", select: "firstName lastName" },
          { path: "createdBy", select: "firstName lastName" },
          { path: "updatedBy", select: "firstName lastName" },
          { path: "approvalFlow.submittedBy", select: "firstName lastName" },
          { path: "approvalFlow.approvedBy", select: "firstName lastName" },
        ])
        .lean();

      if (!payroll) {
        throw new ApiError(404, "Payroll record not found");
      }

      // Simple fallback for missing breakdown
      if (payroll.deductions && !payroll.deductions.breakdown) {
        payroll.deductions.breakdown = {
          statutory: [],
          voluntary: [],
        };
      }

      // Check permissions based on user role and department
      if (user.role === UserRole.SUPER_ADMIN) {
        // Super admin can view all payslips
        if (!user.hasPermission(Permission.VIEW_OWN_PAYSLIP)) {
          throw new ApiError(403, "You don't have permission to view payslips");
        }
      } else if (user.role === UserRole.ADMIN) {
        // Admin can only view payslips of their department
        if (!user.hasPermission(Permission.VIEW_DEPARTMENT_PAYSLIPS)) {
          throw new ApiError(
            403,
            "You don't have permission to view department payslips"
          );
        }
        if (
          payroll.employee.department.toString() !== user.department.toString()
        ) {
          throw new ApiError(
            403,
            "You can only view payslips of employees in your department"
          );
        }
      } else {
        // Regular users can only view their own payslips
        if (!user.hasPermission(Permission.VIEW_OWN_PAYSLIP)) {
          throw new ApiError(403, "You don't have permission to view payslips");
        }
        if (payroll.employee._id.toString() !== user._id.toString()) {
          throw new ApiError(403, "You can only view your own payslip");
        }
      }

      // Format the response with detailed payslip information
      const payslipData = {
        _id: payroll._id,
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
          startDate: payroll.periodStart,
          endDate: payroll.periodEnd,
          frequency: payroll.frequency,
        },
        earnings: {
          basicSalary: payroll.basicSalary,
          overtime: payroll.earnings.overtime,
          bonus: payroll.earnings.bonus,
          allowances: payroll.allowances,
          totalEarnings: payroll.totals.grossEarnings,
        },
        deductions: {
          tax: payroll.deductions.tax,
          pension: payroll.deductions.pension,
          nhf: payroll.deductions.nhf,
          loans: payroll.deductions.loans,
          others: payroll.deductions.others,
          totalDeductions: payroll.totals.totalDeductions,
          breakdown: payroll.deductions.breakdown,
        },
        totals: {
          basicSalary: payroll.totals.basicSalary,
          totalAllowances: payroll.totals.totalAllowances,
          totalBonuses: payroll.totals.totalBonuses,
          grossEarnings: payroll.totals.grossEarnings,
          totalDeductions: payroll.totals.totalDeductions,
          netPay: payroll.totals.netPay,
        },
        components: payroll.components,
        status: payroll.status,
        approvalFlow: {
          submittedBy: payroll.approvalFlow.submittedBy
            ? {
                id: payroll.approvalFlow.submittedBy._id,
                name: `${payroll.approvalFlow.submittedBy.firstName} ${payroll.approvalFlow.submittedBy.lastName}`,
                role: payroll.approvalFlow.submittedBy.role,
              }
            : null,
          submittedAt: payroll.approvalFlow.submittedAt,
          approvedBy: payroll.approvalFlow.approvedBy
            ? {
                id: payroll.approvalFlow.approvedBy._id,
                name: `${payroll.approvalFlow.approvedBy.firstName} ${payroll.approvalFlow.approvedBy.lastName}`,
                role: payroll.approvalFlow.approvedBy.role,
              }
            : null,
          approvedAt: payroll.approvalFlow.approvedAt,
          remarks: payroll.approvalFlow.remarks || null,
        },
        processedBy: {
          id: payroll.processedBy._id,
          name: `${payroll.processedBy.firstName} ${payroll.processedBy.lastName}`,
          role: payroll.processedBy.role,
        },
        createdBy: {
          id: payroll.createdBy._id,
          name: `${payroll.createdBy.firstName} ${payroll.createdBy.lastName}`,
          role: payroll.createdBy.role,
        },
        updatedBy: {
          id: payroll.updatedBy._id,
          name: `${payroll.updatedBy.firstName} ${payroll.updatedBy.lastName}`,
          role: payroll.updatedBy.role,
        },
        timestamps: {
          createdAt: payroll.createdAt,
          updatedAt: payroll.updatedAt,
        },
        comments: payroll.comments,
      };

      res.status(200).json({
        success: true,
        message: "Payslip details retrieved successfully",
        data: payslipData,
      });
    } catch (error) {
      console.error("❌ Error fetching payslip details:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message: message || "Failed to fetch payslip details",
      });
    }
  }

  static async getPendingPayrolls(req, res) {
    try {
      const pendingPayrolls = await PayrollModel.find({
        status: "PENDING",
      }).select("_id month year employee department");

      console.log("📊 Pending Payrolls Found:", {
        count: pendingPayrolls.length,
        payrolls: pendingPayrolls.map((p) => ({
          id: p._id,
          period: `${p.month}/${p.year}`,
        })),
      });

      return res.status(200).json({
        success: true,
        count: pendingPayrolls.length,
        pendingPayrolls,
      });
    } catch (error) {
      console.error("❌ Error getting pending payrolls:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to get pending payrolls",
        error: error.message,
      });
    }
  }

  static async getFilteredPayrolls(req, res) {
    try {
      console.log("🔍 Fetching filtered payrolls");
      const { month, year, status, department } = req.query;

      // Build filter object
      const filter = {};

      // Add month filter if provided
      if (month) {
        filter.month = parseInt(month);
      }

      // Add year filter if provided
      if (year) {
        filter.year = parseInt(year);
      }

      // Add status filter if provided
      if (status) {
        filter.status = status;
      }

      // Handle department filter
      if (department) {
        // First find the department by name
        const departmentDoc = await DepartmentModel.findOne({
          name: { $regex: new RegExp(department, "i") },
        });

        if (!departmentDoc) {
          throw new ApiError(404, `Department "${department}" not found`);
        }

        filter.department = departmentDoc._id;
      }

      // Get payrolls with filters
      const payrolls = await PayrollModel.find(filter)
        .populate("employee", "firstName lastName employeeId")
        .populate("department", "name code")
        .populate("salaryGrade", "level description")
        .sort({ createdAt: -1 });

      // Add deduction breakdown to each payroll record if missing (for backward compatibility)
      for (const payroll of payrolls) {
        if (payroll.deductions && !payroll.deductions.breakdown) {
          console.log(
            "🔧 Adding missing deduction breakdown to filtered payroll:",
            payroll._id
          );

          // Get statutory deductions
          const statutoryDeductions = await DeductionModel.find({
            type: "statutory",
            isActive: true,
          }).lean();

          // Get voluntary deductions
          const voluntaryDeductions = await DeductionModel.find({
            type: "voluntary",
            isActive: true,
          }).lean();

          // Create breakdown structure
          payroll.deductions.breakdown = {
            statutory: [
              // Include existing statutory deductions from payroll
              {
                name: "PAYE Tax",
                amount: payroll.deductions.tax?.amount || 0,
                code: "tax",
                description: "Pay As You Earn Tax",
                type: "statutory",
              },
              {
                name: "Pension",
                amount: payroll.deductions.pension?.amount || 0,
                code: "pension",
                description: "Pension Contribution",
                type: "statutory",
              },
              {
                name: "NHF",
                amount: payroll.deductions.nhf?.amount || 0,
                code: "nhf",
                description: "National Housing Fund",
                type: "statutory",
              },
              // Add any additional statutory deductions from database
              ...statutoryDeductions
                .filter(
                  (deduction) =>
                    !["tax", "pension", "nhf"].includes(deduction.code)
                )
                .map((deduction) => ({
                  name: deduction.name,
                  amount: payroll.deductions[deduction.code] || 0,
                  code: deduction.code,
                  description: deduction.description,
                  type: "statutory",
                })),
            ],
            voluntary: [
              // Include existing loans from payroll
              ...(payroll.deductions.loans || []).map((loan) => ({
                name: loan.description,
                amount: loan.amount,
                code: "loan",
                description: loan.description,
                type: "voluntary",
              })),
              // Include existing others from payroll
              ...(payroll.deductions.others || []).map((other) => ({
                name: other.description,
                amount: other.amount,
                code: "other",
                description: other.description,
                type: "voluntary",
              })),
              // Include existing department-specific deductions from payroll
              ...(payroll.deductions.departmentSpecific || []).map(
                (deduction) => ({
                  name: deduction.name,
                  amount: deduction.amount,
                  code: "department",
                  description: deduction.description,
                  type: deduction.type?.toLowerCase() || "voluntary",
                })
              ),
              // Add any additional voluntary deductions from database
              ...voluntaryDeductions.map((deduction) => ({
                name: deduction.name,
                amount: payroll.deductions[deduction.code] || 0,
                code: deduction.code,
                description: deduction.description,
                type: "voluntary",
              })),
            ],
          };

          console.log(
            "✅ Added deduction breakdown to filtered payroll:",
            payroll._id
          );
        }
      }

      console.log(`✅ Found ${payrolls.length} payrolls matching filters`);

      res.status(200).json({
        success: true,
        data: payrolls,
        count: payrolls.length,
      });
    } catch (error) {
      console.error("❌ Error fetching filtered payrolls:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async approvePayroll(req, res, next) {
    try {
      const { id } = req.params;
      const { remarks } = req.body;
      const admin = await UserModel.findById(req.user.id);

      console.log(
        `\n🔍 Starting Super Admin payroll approval process for ID: ${id}`
      );
      console.log(
        `👤 Approver: ${admin.firstName} ${admin.lastName} (${admin.position})`
      );
      console.log(`🏢 Department: ${admin.department?.name || "Not assigned"}`);
      console.log(`📝 Remarks: ${remarks || "None provided"}`);

      // Check if user is a Super Admin
      if (
        admin.role !== "ADMIN" ||
        !admin.permissions.includes("MANAGE_SYSTEM")
      ) {
        console.error(`❌ Permission denied for user: ${admin._id}`);
        throw new ApiError(
          403,
          "You must be a Super Admin to approve at this level"
        );
      }

      const payroll = await PayrollModel.findById(id);
      // ... approval logic
      // ... notification logic
    } catch (error) {
      next(error);
    }
  }

  static async updatePayrollStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, remarks } = req.body;
      const user = req.user;

      // Validate status transition
      const payroll = await PayrollModel.findById(id);
      if (!payroll) {
        return res.status(404).json({
          success: false,
          message: "Payroll not found",
        });
      }

      // Check if user has permission to update payroll status
      if (!user.hasPermission(Permission.APPROVE_PAYROLL)) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to update payroll status",
        });
      }

      // Update payroll status
      payroll.status = status;
      if (remarks) payroll.remarks = remarks;
      await payroll.save();

      // Create audit log
      await Audit.create({
        user: user._id,
        action: "UPDATE_PAYROLL_STATUS",
        details: {
          payrollId: id,
          oldStatus: payroll.status,
          newStatus: status,
          remarks,
        },
      });

      res.json({
        success: true,
        message: "Payroll status updated successfully",
        data: payroll,
      });
    } catch (error) {
      next(error);
    }
  }

  static async processPayment(req, res, next) {
    try {
      const { id } = req.params;
      const user = req.user;

      // Find the payroll
      const payroll = await PayrollModel.findById(id);
      if (!payroll) {
        return res.status(404).json({
          success: false,
          message: "Payroll not found",
        });
      }

      // Check if user has permission to process payments
      if (!user.hasPermission(Permission.APPROVE_PAYROLL)) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to process payments",
        });
      }

      // Validate payroll status
      if (payroll.status !== PAYROLL_STATUS.APPROVED) {
        return res.status(400).json({
          success: false,
          message: "Only approved payrolls can be processed for payment",
        });
      }

      // Update payroll status to PAID
      payroll.status = PAYROLL_STATUS.PAID;
      payroll.approvalFlow = {
        ...payroll.approvalFlow,
        paidBy: user._id,
        paidAt: new Date(),
        remarks: "Payment processed successfully",
      };
      await payroll.save();

      // Create payment record
      await Payment.create({
        payrollId: payroll._id,
        employeeId: payroll.employee,
        amount: payroll.totals.netPay,
        status: "COMPLETED",
        processedBy: user._id,
        processedAt: new Date(),
        paymentMethod: "BANK_TRANSFER",
        reference: `PAY-${Date.now()}`,
        bankDetails: payroll.payment,
      });

      // Create audit log
      await Audit.create({
        user: user._id,
        action: AuditAction.PROCESS,
        entity: AuditEntity.PAYROLL,
        entityId: payroll._id,
        performedBy: user._id,
        details: {
          previousStatus: payroll.status,
          newStatus: PAYROLL_STATUS.PAID,
          amount: payroll.totals.netPay,
        },
      });

      // Create notification for employee
      await NotificationService.createPayrollNotification(
        payroll.employee._id,
        NOTIFICATION_TYPES.PAYROLL_PAID,
        payroll,
        "Your payment has been processed successfully"
      );

      res.status(200).json({
        success: true,
        message: "Payment processed successfully",
        data: {
          payrollId: payroll._id,
          amount: payroll.totals.netPay,
          status: payroll.status,
          paymentDate: payroll.approvalFlow.paidAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  //Onboarding & Offboarding

  static async getActiveEmployees(req, res) {
    try {
      const employees = await UserModel.find({
        status: "active",
        role: { $ne: UserRole.SUPER_ADMIN },
      })
        .select("-password")
        .populate("department", "name code")
        .sort({ firstName: 1 });

      res.status(200).json({
        success: true,
        data: employees,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }
  static async getOnboardingEmployees(req, res) {
    try {
      console.log("🔍 Fetching onboarding employees");

      const employees = await UserModel.find({
        role: UserRole.USER,
        status: "pending",
      })
        .select("-password")
        .populate("department", "name code")
        .sort({ createdAt: -1 });

      console.log(`📋 Found ${employees.length} onboarding employees`);

      res.status(200).json({
        success: true,
        data: employees,
      });
    } catch (error) {
      console.error("❌ Error in getOnboardingEmployees:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message: "Failed to fetch onboarding employees",
      });
    }
  }

  static async getOffboardingEmployees(req, res) {
    try {
      console.log("🔍 Fetching offboarding employees");

      const offboardingEmployees = await UserModel.find({
        role: UserRole.USER,
        $or: [
          { status: "offboarding" },
          { "offboarding.status": { $in: ["in_progress", "completed"] } },
        ],
      })
        .select("-password")
        .populate("department", "name code")
        .populate("offboarding.completedBy", "firstName lastName")
        .sort({ "offboarding.initiatedAt": -1 });

      console.log(
        `📋 Found ${offboardingEmployees.length} offboarding employees`
      );

      return res.status(200).json({
        success: true,
        data: offboardingEmployees,
      });
    } catch (error) {
      console.error("❌ Error fetching offboarding employees:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch offboarding employees",
      });
    }
  }

  static async initiateOffboarding(req, res) {
    try {
      console.log(
        "🔄 Processing offboarding request for:",
        req.params.employeeId
      );

      const employeeId = req.params.employeeId;
      const employee = await UserModel.findById(employeeId);

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      const updatedEmployee = await UserModel.findByIdAndUpdate(
        employeeId,
        {
          $set: {
            status: "offboarding",
            offboarding: {
              status: "pending_exit",
              lastWorkingDay: new Date(),
              initiatedAt: new Date(),
              initiatedBy: req.user._id,
              checklist: {
                exitInterview: false,
                assetsReturned: false,
                knowledgeTransfer: false,
                accessRevoked: false,
                finalSettlement: false,
              },
            },
          },
        },
        { new: true }
      ).populate("department", "name code");

      console.log("✅ Offboarding initiated successfully for:", employeeId);

      return res.status(200).json({
        success: true,
        message: "Offboarding initiated successfully",
        data: updatedEmployee,
      });
    } catch (error) {
      console.error("❌ Error in initiateOffboarding:", error);
      const { statusCode, message } = handleError(error);
      return res.status(statusCode).json({
        success: false,
        message: message || "Failed to initiate offboarding",
      });
    }
  }

  static async revertToOnboarding(req, res) {
    try {
      console.log(
        "🔄 Reverting employee to onboarding:",
        req.params.employeeId
      );

      const employeeId = req.params.employeeId;
      const employee = await UserModel.findById(employeeId);

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      const updatedEmployee = await UserModel.findByIdAndUpdate(
        employeeId,
        {
          $set: {
            status: "pending",
            offboarding: null,
          },
        },
        { new: true }
      ).populate("department", "name code");

      return res.status(200).json({
        success: true,
        message: "Employee reverted to onboarding successfully",
        data: updatedEmployee,
      });
    } catch (error) {
      console.error("❌ Error in revertToOnboarding:", error);
      const { statusCode, message } = handleError(error);
      return res.status(statusCode).json({
        success: false,
        message: message || "Failed to revert employee to onboarding",
      });
    }
  }

  static async updateOffboardingStatus(req, res) {
    try {
      console.log("🔄 Updating offboarding status for:", req.params.employeeId);

      const employeeId = req.params.employeeId;
      const updates = req.body;

      const employee = await UserModel.findById(employeeId);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      // Calculate completion status
      const checklist = updates.checklist;
      const totalItems = Object.keys(checklist).length;
      const completedItems = Object.values(checklist).filter(Boolean).length;
      const isCompleted = completedItems === totalItems;

      // Update with completion tracking
      const updatedEmployee = await UserModel.findByIdAndUpdate(
        employeeId,
        {
          $set: {
            "offboarding.checklist": updates.checklist,
            "offboarding.status": updates.status,
            "offboarding.progress": (completedItems / totalItems) * 100,
            ...(isCompleted
              ? {
                  "offboarding.completedAt": new Date(),
                  "offboarding.completedBy": req.user._id,
                  status: "completed", // Update main employee status
                }
              : {}),
          },
        },
        { new: true }
      ).populate("department", "name code");

      return res.status(200).json({
        success: true,
        message: "Offboarding status updated successfully",
        data: updatedEmployee,
      });
    } catch (error) {
      console.error("❌ Error updating offboarding status:", error);
      const { statusCode, message } = handleError(error);
      return res.status(statusCode).json({
        success: false,
        message: message || "Failed to update offboarding status",
      });
    }
  }

  static async archiveEmployee(req, res) {
    try {
      console.log("🔄 Archiving employee:", req.params.employeeId);

      const employeeId = req.params.employeeId;
      const employee = await UserModel.findById(employeeId);

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      // Update employee status to archived
      const updatedEmployee = await UserModel.findByIdAndUpdate(
        employeeId,
        {
          $set: {
            status: "archived",
            "offboarding.completedAt": new Date(),
            "offboarding.completedBy": req.user._id,
          },
        },
        { new: true }
      ).populate("department", "name code");

      return res.status(200).json({
        success: true,
        message: "Employee archived successfully",
        data: updatedEmployee,
      });
    } catch (error) {
      console.error("❌ Error archiving employee:", error);
      const { statusCode, message } = handleError(error);
      return res.status(statusCode).json({
        success: false,
        message: message || "Failed to archive employee",
      });
    }
  }

  // ===== Leave Management =====
  static async getAllLeaves(req, res) {
    try {
      console.log("🔍 Fetching all leave requests");

      const leaves = await Leave.find()
        .populate([
          {
            path: "employee",
            select: "firstName lastName employeeId department",
          },
          { path: "approvedBy", select: "firstName lastName" },
        ])
        .sort({ createdAt: -1 });

      console.log(`📋 Found ${leaves.length} leave requests`);

      res.status(200).json({
        success: true,
        data: leaves,
        count: leaves.length,
      });
    } catch (error) {
      console.error("❌ Error fetching leaves:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message: "Failed to fetch leave requests",
      });
    }
  }

  static async approveLeave(req, res) {
    try {
      console.log("✍️ Processing leave approval for:", req.params.id);

      const leave = await Leave.findByIdAndUpdate(
        req.params.id,
        {
          status: LEAVE_STATUS.APPROVED,
          approvedBy: req.user._id,
          approvedAt: new Date(),
          approvalNotes: req.body.notes || "",
        },
        { new: true }
      ).populate([
        { path: "employee", select: "firstName lastName employeeId" },
        { path: "approvedBy", select: "firstName lastName" },
      ]);

      if (!leave) {
        throw new ApiError(404, "Leave request not found");
      }

      console.log("✅ Leave request approved successfully");

      // Add audit logging
      await PayrollStatisticsLogger.logLeaveAction({
        action: "APPROVE",
        leaveId: leave._id,
        userId: req.user._id,
        details: {
          employeeId: leave.employee._id,
          employeeName: `${leave.employee.firstName} ${leave.employee.lastName}`,
          leaveType: leave.leaveType,
          startDate: leave.startDate,
          endDate: leave.endDate,
          duration: leave.duration,
          approvedBy: req.user._id,
          position: req.user.position,
          role: req.user.role,
          approvalNotes: req.body.notes || "",
          message: `Leave approved for ${leave.employee.firstName} ${leave.employee.lastName}`,
        },
        statisticsDetails: {
          leaveType: leave.leaveType,
          duration: leave.duration,
          status: "APPROVED",
        },
        auditDetails: {
          entity: "LEAVE",
          entityId: leave._id,
          action: "APPROVE",
          performedBy: req.user._id,
          status: "APPROVED",
          remarks: req.body.notes || "Leave approved",
          previousStatus: "PENDING",
          newStatus: "APPROVED",
        },
      });

      res.status(200).json({
        success: true,
        message: "Leave approved successfully",
        data: leave,
      });
    } catch (error) {
      console.error("❌ Error approving leave:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message: message || "Failed to approve leave",
      });
    }
  }

  static async rejectLeave(req, res) {
    try {
      console.log("✍️ Processing leave rejection for:", req.params.id);

      const leave = await Leave.findByIdAndUpdate(
        req.params.id,
        {
          status: LEAVE_STATUS.REJECTED,
          approvedBy: req.user._id,
          approvedAt: new Date(),
          approvalNotes: req.body.notes || "",
        },
        { new: true }
      ).populate([
        { path: "employee", select: "firstName lastName employeeId" },
        { path: "approvedBy", select: "firstName lastName" },
      ]);

      if (!leave) {
        throw new ApiError(404, "Leave request not found");
      }

      console.log("✅ Leave request rejected successfully");

      // Add audit logging
      await PayrollStatisticsLogger.logLeaveAction({
        action: "REJECT",
        leaveId: leave._id,
        userId: req.user._id,
        details: {
          employeeId: leave.employee._id,
          employeeName: `${leave.employee.firstName} ${leave.employee.lastName}`,
          leaveType: leave.leaveType,
          startDate: leave.startDate,
          endDate: leave.endDate,
          duration: leave.duration,
          rejectedBy: req.user._id,
          position: req.user.position,
          role: req.user.role,
          rejectionNotes: req.body.notes || "",
          message: `Leave rejected for ${leave.employee.firstName} ${leave.employee.lastName}`,
        },
        statisticsDetails: {
          leaveType: leave.leaveType,
          duration: leave.duration,
          status: "REJECTED",
        },
        auditDetails: {
          entity: "LEAVE",
          entityId: leave._id,
          action: "REJECT",
          performedBy: req.user._id,
          status: "REJECTED",
          remarks: req.body.notes || "Leave rejected",
          previousStatus: "PENDING",
          newStatus: "REJECTED",
        },
      });

      res.status(200).json({
        success: true,
        message: "Leave rejected successfully",
        data: leave,
      });
    } catch (error) {
      console.error("❌ Error rejecting leave:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message: message || "Failed to reject leave",
      });
    }
  }

  // ===== Salary Structure Management =====

  static async createSalaryGrade(req, res) {
    try {
      console.log("📝 Creating new salary grade");
      const { level, basicSalary, components, description, department } =
        req.body;

      // Validate components
      if (!components || !Array.isArray(components)) {
        throw new ApiError(400, "Components must be an array");
      }

      // Validate each component
      components.forEach((comp, index) => {
        if (!comp.calculationMethod) {
          throw new ApiError(
            400,
            `Calculation method is required for component ${index + 1}`
          );
        }
        if (!["fixed", "percentage"].includes(comp.calculationMethod)) {
          throw new ApiError(
            400,
            `Invalid calculation method for component ${index + 1}`
          );
        }
      });

      const salaryGradeData = {
        level,
        basicSalary: Number(basicSalary),
        description: description || "",
        // Only include department if it's provided and valid
        ...(department && department !== "department_id_here"
          ? { department: new Types.ObjectId(department) }
          : {}),
        components: components.map((comp) => ({
          name: comp.name.trim(),
          type: "allowance",
          calculationMethod: comp.calculationMethod,
          value: Number(comp.value),
          isActive: comp.isActive ?? true,
          _id: new Types.ObjectId(),
          createdBy: new Types.ObjectId(req.user.id),
          updatedBy: new Types.ObjectId(req.user.id),
        })),
        createdBy: new Types.ObjectId(req.user.id),
        updatedBy: new Types.ObjectId(req.user.id),
        isActive: true,
      };

      const salaryGrade = await SalaryGrade.create(salaryGradeData);

      const populatedGrade = await SalaryGrade.findById(salaryGrade._id)
        .populate("department", "name code")
        .populate("components.createdBy", "firstName lastName")
        .populate("components.updatedBy", "firstName lastName");

      // Add audit logging
      await PayrollStatisticsLogger.logSalaryGradeAction({
        action: "CREATE",
        salaryGradeId: salaryGrade._id,
        userId: req.user._id,
        details: {
          level: salaryGrade.level,
          basicSalary: salaryGrade.basicSalary,
          description: salaryGrade.description,
          department: salaryGrade.department,
          componentsCount: salaryGrade.components.length,
          createdBy: req.user._id,
          position: req.user.position,
          role: req.user.role,
          message: `Created salary grade: ${salaryGrade.level}`,
        },
        statisticsDetails: {
          level: salaryGrade.level,
          basicSalary: salaryGrade.basicSalary,
          componentsCount: salaryGrade.components.length,
        },
        auditDetails: {
          entity: "SALARY_GRADE",
          entityId: salaryGrade._id,
          action: "CREATE",
          performedBy: req.user._id,
          status: "ACTIVE",
          remarks: `Created salary grade: ${salaryGrade.level}`,
        },
      });

      res.status(201).json({
        success: true,
        message: "Salary grade created successfully",
        data: populatedGrade,
      });
    } catch (error) {
      console.error("❌ Error creating salary grade:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message: message || "Failed to create salary grade",
      });
    }
  }

  static async getAllSalaryGrades(req, res) {
    try {
      console.log("🔍 Fetching all salary grades");

      const salaryGrades = await SalaryGrade.find()
        .populate("department", "name code")
        .sort({ level: 1 });

      console.log(`📋 Found ${salaryGrades.length} salary grades`);

      res.status(200).json({
        success: true,
        data: salaryGrades,
      });
    } catch (error) {
      console.error("❌ Error fetching salary grades:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message: message || "Failed to fetch salary grades",
      });
    }
  }

  static async updateSalaryGrade(req, res) {
    try {
      const userId = req.user.id;
      const { department, components, ...updateData } = req.body;

      const salaryGrade = await SalaryGrade.findById(req.params.id);
      if (!salaryGrade) {
        throw new ApiError(404, "Salary grade not found");
      }

      // Store previous values for audit
      const previousData = {
        level: salaryGrade.level,
        basicSalary: salaryGrade.basicSalary,
        description: salaryGrade.description,
        department: salaryGrade.department,
        componentsCount: salaryGrade.components.length,
      };

      Object.assign(salaryGrade, {
        ...updateData,
        department: department || null,
        updatedBy: userId,
      });

      if (components) {
        salaryGrade.components = components.map((comp) => ({
          name: comp.name,
          type: "allowance",
          calculationMethod: comp.calculationMethod,
          value: Number(comp.value),
          isActive: comp.isActive,
          _id: comp._id ? new Types.ObjectId(comp._id) : new Types.ObjectId(),
          createdBy: userId,
          updatedBy: userId,
        }));
      }

      await salaryGrade.save();

      const populatedGrade = await SalaryGrade.findById(
        salaryGrade._id
      ).populate("department", "name code");

      // Add audit logging
      await PayrollStatisticsLogger.logSalaryGradeAction({
        action: "UPDATE",
        salaryGradeId: salaryGrade._id,
        userId: req.user._id,
        details: {
          level: salaryGrade.level,
          basicSalary: salaryGrade.basicSalary,
          description: salaryGrade.description,
          department: salaryGrade.department,
          componentsCount: salaryGrade.components.length,
          previousLevel: previousData.level,
          previousBasicSalary: previousData.basicSalary,
          updatedBy: req.user._id,
          position: req.user.position,
          role: req.user.role,
          message: `Updated salary grade: ${salaryGrade.level}`,
        },
        statisticsDetails: {
          level: salaryGrade.level,
          basicSalary: salaryGrade.basicSalary,
          componentsCount: salaryGrade.components.length,
          previousBasicSalary: previousData.basicSalary,
        },
        auditDetails: {
          entity: "SALARY_GRADE",
          entityId: salaryGrade._id,
          action: "UPDATE",
          performedBy: req.user._id,
          status: "ACTIVE",
          remarks: `Updated salary grade: ${salaryGrade.level}`,
          previousStatus: previousData.basicSalary,
          newStatus: salaryGrade.basicSalary,
        },
      });

      res.status(200).json({
        success: true,
        message: "Salary grade updated successfully",
        data: populatedGrade,
      });
    } catch (error) {
      console.error("❌ Error updating salary grade:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async addSalaryComponent(req, res) {
    try {
      const userId = new mongoose.Types.ObjectId(req.user.id);
      const gradeId = req.params.id;

      const salaryGrade = await SalaryGrade.findById(gradeId);
      if (!salaryGrade) {
        throw new ApiError(404, "Salary grade not found");
      }

      // Validate calculationMethod
      const validCalculationMethods = ["fixed", "percentage"];
      if (!validCalculationMethods.includes(req.body.calculationMethod)) {
        throw new ApiError(400, "Invalid calculation method");
      }

      const newComponent = {
        ...req.body,
        type: "allowance", // Always allowance
        calculationMethod: req.body.calculationMethod,
        value: Number(req.body.value),
        isActive: true,
        createdBy: userId,
        updatedBy: userId,
        _id: new mongoose.Types.ObjectId(),
      };

      salaryGrade.components.push(newComponent);
      salaryGrade.updatedBy = userId;
      await salaryGrade.save();

      // Add audit logging
      await PayrollStatisticsLogger.logSalaryComponentAction({
        action: "CREATE",
        salaryGradeId: salaryGrade._id,
        componentId: newComponent._id,
        userId: req.user._id,
        details: {
          salaryGradeLevel: salaryGrade.level,
          componentName: newComponent.name,
          componentType: newComponent.type,
          calculationMethod: newComponent.calculationMethod,
          value: newComponent.value,
          isActive: newComponent.isActive,
          createdBy: req.user._id,
          position: req.user.position,
          role: req.user.role,
          message: `Added component ${newComponent.name} to salary grade ${salaryGrade.level}`,
        },
        statisticsDetails: {
          salaryGradeLevel: salaryGrade.level,
          componentType: newComponent.type,
          calculationMethod: newComponent.calculationMethod,
          value: newComponent.value,
        },
        auditDetails: {
          entity: "SALARY_COMPONENT",
          entityId: newComponent._id,
          action: "CREATE",
          performedBy: req.user._id,
          status: "ACTIVE",
          remarks: `Added component ${newComponent.name} to salary grade ${salaryGrade.level}`,
        },
      });

      res.status(200).json({
        success: true,
        message: "Component added successfully",
        data: salaryGrade,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async updateSalaryComponent(req, res) {
    try {
      const userId = new mongoose.Types.ObjectId(req.user.id);
      const salaryGrade = await SalaryGrade.findById(req.params.id);
      if (!salaryGrade) {
        throw new ApiError(404, "Salary grade not found");
      }

      const componentIndex = salaryGrade.components.findIndex(
        (c) => c._id.toString() === req.params.componentId
      );

      if (componentIndex === -1) {
        throw new ApiError(404, "Component not found");
      }

      // Store previous component data for audit
      const previousComponent = { ...salaryGrade.components[componentIndex] };

      // Update the component
      salaryGrade.components[componentIndex] = {
        ...salaryGrade.components[componentIndex],
        ...req.body,
        value: Number(req.body.value),
        updatedBy: userId,
      };

      salaryGrade.updatedBy = userId;
      await salaryGrade.save();

      const updatedComponent = salaryGrade.components[componentIndex];

      // Add audit logging
      await PayrollStatisticsLogger.logSalaryComponentAction({
        action: "UPDATE",
        salaryGradeId: salaryGrade._id,
        componentId: updatedComponent._id,
        userId: req.user._id,
        details: {
          salaryGradeLevel: salaryGrade.level,
          componentName: updatedComponent.name,
          componentType: updatedComponent.type,
          calculationMethod: updatedComponent.calculationMethod,
          previousValue: previousComponent.value,
          newValue: updatedComponent.value,
          updatedBy: req.user._id,
          position: req.user.position,
          role: req.user.role,
          message: `Updated component ${updatedComponent.name} in salary grade ${salaryGrade.level}`,
        },
        statisticsDetails: {
          salaryGradeLevel: salaryGrade.level,
          componentType: updatedComponent.type,
          calculationMethod: updatedComponent.calculationMethod,
          previousValue: previousComponent.value,
          newValue: updatedComponent.value,
        },
        auditDetails: {
          entity: "SALARY_COMPONENT",
          entityId: updatedComponent._id,
          action: "UPDATE",
          performedBy: req.user._id,
          status: "ACTIVE",
          remarks: `Updated component ${updatedComponent.name} in salary grade ${salaryGrade.level}`,
          previousStatus: previousComponent.value,
          newStatus: updatedComponent.value,
        },
      });

      res.status(200).json({
        success: true,
        message: "Component updated successfully",
        data: salaryGrade,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async getSalaryGrade(req, res) {
    try {
      const { id } = req.params;
      const grade = await SalaryGrade.findById(id)
        .populate("department")
        .populate("components.createdBy", "name")
        .populate("components.updatedBy", "name");

      console.log("🔍 Found grade:", {
        grade,
        departmentId: grade?.department?._id,
        departmentData: grade?.department,
      });

      if (!grade) {
        throw new ApiError(404, "Salary grade not found");
      }

      res.status(200).json({
        success: true,
        data: grade,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async deleteSalaryGrade(req, res) {
    try {
      const { id } = req.params;

      const grade = await SalaryGrade.findById(id);
      if (!grade) {
        throw new ApiError(404, "Salary grade not found");
      }

      // Store grade data before deletion for audit
      const deletedGradeData = {
        level: grade.level,
        basicSalary: grade.basicSalary,
        description: grade.description,
        department: grade.department,
        componentsCount: grade.components.length,
      };

      await SalaryGrade.findByIdAndDelete(id);

      // Add audit logging
      await PayrollStatisticsLogger.logSalaryGradeAction({
        action: "DELETE",
        salaryGradeId: grade._id,
        userId: req.user._id,
        details: {
          level: grade.level,
          basicSalary: grade.basicSalary,
          description: grade.description,
          department: grade.department,
          componentsCount: grade.components.length,
          deletedBy: req.user._id,
          position: req.user.position,
          role: req.user.role,
          message: `Deleted salary grade: ${grade.level}`,
        },
        statisticsDetails: {
          level: grade.level,
          basicSalary: grade.basicSalary,
          componentsCount: grade.components.length,
        },
        auditDetails: {
          entity: "SALARY_GRADE",
          entityId: grade._id,
          action: "DELETE",
          performedBy: req.user._id,
          status: "DELETED",
          remarks: `Deleted salary grade: ${grade.level}`,
          previousStatus: "ACTIVE",
          newStatus: "DELETED",
        },
      });

      res.status(200).json({
        success: true,
        message: "Salary grade deleted successfully",
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async setupStatutoryDeductions(req, res) {
    try {
      console.log("🔄 Setting up statutory deductions");

      const userId = asObjectId(req.user.id);

      // Create all statutory deductions at once
      const deductions = await DeductionService.createStatutoryDeductions(
        userId
      );

      res.status(201).json({
        success: true,
        message: "Statutory deductions set up successfully",
        data: deductions,
      });
    } catch (error) {
      console.error("❌ Error setting up statutory deductions:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async getAllDeductions(req, res) {
    try {
      console.log("🔍 Fetching all deductions");
      const deductions = await DeductionService.getAllDeductions();

      console.log("✅ Found deductions:", {
        statutoryCount: deductions.statutory.length,
        voluntaryCount: deductions.voluntary.length,
      });

      res.status(200).json({
        success: true,
        data: deductions,
      });
    } catch (error) {
      console.error("❌ Error fetching deductions:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async createVoluntaryDeduction(req, res) {
    try {
      console.log("🚀 SuperAdminController: Creating voluntary deduction...");
      console.log("📝 SuperAdminController: Request body:", req.body);
      console.log("👤 SuperAdminController: User ID:", req.user.id);

      const userId = req.user.id;

      // Validate required fields
      if (!req.body.name || !req.body.calculationMethod || !req.body.value) {
        console.log("❌ SuperAdminController: Missing required fields");
        return res.status(400).json({
          success: false,
          message: "Name, calculation method, and value are required",
        });
      }

      // Validate deduction value
      const value = parseFloat(req.body.value);
      if (isNaN(value) || value < 0) {
        console.log("❌ SuperAdminController: Invalid deduction value");
        return res.status(400).json({
          success: false,
          message: "Deduction value must be a positive number",
        });
      }

      // Validate percentage doesn't exceed 100%
      if (req.body.calculationMethod === "PERCENTAGE" && value > 100) {
        console.log("❌ SuperAdminController: Percentage exceeds 100%");
        return res.status(400).json({
          success: false,
          message: "Percentage deduction cannot exceed 100%",
        });
      }

      // Validate effective date is not in the past
      const effectiveDate = req.body.effectiveDate
        ? new Date(req.body.effectiveDate)
        : new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const isMonthly =
        req.body.deductionDuration === "ongoing" &&
        (req.body.appliesToPeriod?.periodType === "monthly" ||
          !req.body.appliesToPeriod);
      const minDate = isMonthly ? firstOfMonth : today;
      if (effectiveDate < minDate) {
        return res.status(400).json({
          success: false,
          message: isMonthly
            ? "Effective date cannot be before the 1st of this month for monthly payrolls"
            : "Effective date cannot be in the past",
        });
      }

      // Validate scope-specific requirements
      if (req.body.scope === "department" && !req.body.department) {
        console.log(
          "❌ SuperAdminController: Department scope requires department ID"
        );
        return res.status(400).json({
          success: false,
          message: "Department ID is required for department scope",
        });
      }

      if (
        req.body.scope === "individual" &&
        (!req.body.assignedEmployees || req.body.assignedEmployees.length === 0)
      ) {
        console.log(
          "❌ SuperAdminController: Individual scope requires assigned employees"
        );
        return res.status(400).json({
          success: false,
          message:
            "At least one employee must be assigned for individual scope",
        });
      }

      console.log("✅ SuperAdminController: Validation passed");

      const deductionData = {
        name: req.body.name,
        type: "VOLUNTARY", // Always voluntary for this endpoint
        description: req.body.description,
        calculationMethod: req.body.calculationMethod,
        value: req.body.value,
        effectiveDate: req.body.effectiveDate
          ? new Date(req.body.effectiveDate)
          : new Date(),
        category: req.body.category || "general",
        scope: req.body.scope || "company_wide", // Default to company-wide
        department: req.body.department, // Only required if scope is department
        assignedEmployees: req.body.assignedEmployees, // Only for individual scope
        isActive: true,
        createdBy: userId,
        updatedBy: userId,
        deductionDuration: req.body.deductionDuration || "ongoing",
        ...(req.body.deductionDuration === "one-off" && {
          appliesToPeriod: {
            periodType: req.body.appliesToPeriod?.periodType,
            year: req.body.appliesToPeriod?.year,
            ...(req.body.appliesToPeriod?.periodType === "monthly" && {
              month: req.body.appliesToPeriod?.month,
            }),
            ...(req.body.appliesToPeriod?.periodType === "weekly" && {
              week: req.body.appliesToPeriod?.week,
            }),
            ...(req.body.appliesToPeriod?.periodType === "biweekly" && {
              biweek: req.body.appliesToPeriod?.biweek,
            }),
            ...(req.body.appliesToPeriod?.periodType === "quarterly" && {
              quarter: req.body.appliesToPeriod?.quarter,
            }),
          },
        }),
      };

      console.log(
        "📊 SuperAdminController: Deduction data to save:",
        deductionData
      );
      console.log("🎯 SuperAdminController: Scope:", deductionData.scope);
      console.log(
        "⏱️ SuperAdminController: Duration:",
        deductionData.deductionDuration
      );
      if (deductionData.deductionDuration === "one-off") {
        console.log(
          "📅 SuperAdminController: Period data:",
          deductionData.appliesToPeriod
        );
      }
      if (deductionData.scope === "department") {
        console.log(
          "🏢 SuperAdminController: Department ID:",
          deductionData.department
        );
      }
      if (deductionData.scope === "individual") {
        console.log(
          "👥 SuperAdminController: Assigned employees:",
          deductionData.assignedEmployees
        );
      }

      const deduction = new Deduction(deductionData);
      await deduction.save();

      // Log deduction creation
      await PayrollStatisticsLogger.logDeductionAction({
        action: "CREATE",
        deductionId: deduction._id,
        userId,
        details: deductionData,
      });

      console.log("✅ SuperAdminController: Deduction saved successfully");
      console.log("🆔 SuperAdminController: New deduction ID:", deduction._id);

      res.status(201).json({
        success: true,
        message: "Voluntary deduction created successfully",
        deduction,
      });
    } catch (error) {
      console.error(
        "❌ SuperAdminController: Error creating voluntary deduction:",
        error
      );
      console.error("Error creating voluntary deduction:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create voluntary deduction",
        error: error.message,
      });
    }
  }

  static async createBulkDeductions(req, res) {
    try {
      console.log("📦 Creating bulk deductions");

      if (
        !Array.isArray(req.body.deductions) ||
        req.body.deductions.length === 0
      ) {
        throw new ApiError(400, "Deductions array is required");
      }

      const userId = asObjectId(req.user.id);
      const results = await Promise.all(
        req.body.deductions.map((deduction) =>
          DeductionService.createVoluntaryDeduction(userId, {
            ...deduction,
            effectiveDate: deduction.effectiveDate || new Date(),
            category: deduction.category || "general",
            isActive: true,
            createdBy: userId,
            updatedBy: userId,
          })
        )
      );

      console.log(`✅ Created ${results.length} deductions successfully`);

      res.status(201).json({
        success: true,
        message: "Bulk deductions created successfully",
        data: results,
      });
    } catch (error) {
      console.error("❌ Error creating bulk deductions:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async updateDeduction(req, res) {
    try {
      console.log("�� Updating deduction:", req.params.id);

      const deduction = await Deduction.findById(req.params.id);
      if (!deduction) {
        throw new ApiError(404, "Deduction not found");
      }

      // Don't allow changing the type of deduction
      if (req.body.type) {
        throw new ApiError(400, "Cannot change deduction type");
      }

      // For PAYE, only allow updating tax brackets
      if (deduction.name === "PAYE Tax" && req.body.value !== undefined) {
        throw new ApiError(
          400,
          "Cannot modify PAYE value directly. Update tax brackets instead."
        );
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

      // Effective date validation removed - frontend has warnings to guide users

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
          updatedBy: asObjectId(req.user.id),
          $push: { history: historyEntry },
        },
        { new: true }
      );

      console.log("✅ Deduction updated successfully");

      // Add audit logging
      await PayrollStatisticsLogger.logDeductionAction({
        action: "UPDATE",
        deductionId: deduction._id,
        userId: req.user._id,
        details: {
          name: deduction.name,
          type: deduction.type,
          previousValue: deduction.value,
          newValue: req.body.value,
          changes: req.body,
          updatedBy: req.user._id,
          position: req.user.position,
          role: req.user.role,
          message: `Updated deduction: ${deduction.name}`,
        },
        statisticsDetails: {
          deductionType: deduction.type,
          calculationMethod: deduction.calculationMethod,
          previousValue: deduction.value,
          newValue: req.body.value,
        },
        auditDetails: {
          entity: "DEDUCTION",
          entityId: deduction._id,
          action: "UPDATE",
          performedBy: req.user._id,
          status: "ACTIVE",
          remarks: `Updated deduction: ${deduction.name}`,
          previousStatus: deduction.value,
          newStatus: req.body.value,
        },
      });

      res.status(200).json({
        success: true,
        message: "Deduction updated successfully",
        data: updatedDeduction,
      });
    } catch (error) {
      console.error("❌ Error updating deduction:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async toggleDeductionStatus(req, res) {
    try {
      console.log("🔄 Toggling deduction status:", req.params.id);

      const result = await DeductionService.toggleDeductionStatus(
        asObjectId(req.params.id),
        asObjectId(req.user.id)
      );

      console.log(
        `✅ Deduction ${
          result.deduction.isActive ? "activated" : "deactivated"
        } successfully`
      );

      // Add audit logging
      await PayrollStatisticsLogger.logDeductionAction({
        action: "TOGGLE_STATUS",
        deductionId: result.deduction._id,
        userId: req.user._id,
        details: {
          name: result.deduction.name,
          type: result.deduction.type,
          previousStatus: !result.deduction.isActive,
          newStatus: result.deduction.isActive,
          updatedBy: req.user._id,
          position: req.user.position,
          role: req.user.role,
          message: `Deduction ${
            result.deduction.isActive ? "activated" : "deactivated"
          }: ${result.deduction.name}`,
        },
        statisticsDetails: {
          deductionType: result.deduction.type,
          calculationMethod: result.deduction.calculationMethod,
          isActive: result.deduction.isActive,
        },
        auditDetails: {
          entity: "DEDUCTION",
          entityId: result.deduction._id,
          action: "TOGGLE_STATUS",
          performedBy: req.user._id,
          status: result.deduction.isActive ? "ACTIVE" : "INACTIVE",
          remarks: `Deduction ${
            result.deduction.isActive ? "activated" : "deactivated"
          }: ${result.deduction.name}`,
          previousStatus: !result.deduction.isActive,
          newStatus: result.deduction.isActive,
        },
      });

      res.json({
        success: true,
        message: `Deduction ${
          result.deduction.isActive ? "activated" : "deactivated"
        } successfully`,
        data: {
          deduction: result.deduction,
          allDeductions: result.allDeductions,
        },
      });
    } catch (error) {
      console.error("❌ Error toggling deduction status:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async deleteDeduction(req, res) {
    try {
      console.log("🗑️ Deleting deduction:", req.params.id);

      const deduction = await Deduction.findById(req.params.id);
      if (!deduction) {
        throw new ApiError(404, "Deduction not found");
      }

      // Allow super admin to delete any deduction, including statutory
      const isSuperAdmin = req.user.role === UserRole.SUPER_ADMIN;
      if (deduction.type === DeductionType.STATUTORY && !isSuperAdmin) {
        throw new ApiError(
          400,
          "Only super admin can delete statutory deductions"
        );
      }

      // Actually delete the deduction instead of just archiving
      await Deduction.findByIdAndDelete(req.params.id);

      console.log("✅ Deduction deleted successfully");

      // Add audit logging
      await PayrollStatisticsLogger.logDeductionAction({
        action: "DELETE",
        deductionId: deduction._id,
        userId: req.user._id,
        details: {
          name: deduction.name,
          type: deduction.type,
          value: deduction.value,
          calculationMethod: deduction.calculationMethod,
          deletedBy: req.user._id,
          position: req.user.position,
          role: req.user.role,
          message: `Deleted deduction: ${deduction.name}`,
        },
        statisticsDetails: {
          deductionType: deduction.type,
          calculationMethod: deduction.calculationMethod,
          value: deduction.value,
        },
        auditDetails: {
          entity: "DEDUCTION",
          entityId: deduction._id,
          action: "DELETE",
          performedBy: req.user._id,
          status: "DELETED",
          remarks: `Deleted deduction: ${deduction.name}`,
          previousStatus: "ACTIVE",
          newStatus: "DELETED",
        },
      });

      res.status(200).json({
        success: true,
        message: "Deduction deleted successfully",
      });
    } catch (error) {
      console.error("❌ Error deleting deduction:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  // ===== Allowance Management =====
  static async createAllowance(req, res) {
    try {
      console.log("📝 Creating allowance with data:", req.body);

      const allowance = await AllowanceService.createAllowance(
        asObjectId(req.user.id),
        {
          ...req.body,
          effectiveDate: new Date(req.body.effectiveDate),
          expiryDate: req.body.expiryDate
            ? new Date(req.body.expiryDate)
            : undefined,
          department: req.body.department
            ? asObjectId(req.body.department)
            : undefined,
        }
      );

      res.status(201).json({
        success: true,
        message: "Allowance created successfully",
        data: allowance,
      });
    } catch (error) {
      console.error("❌ Error creating allowance:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async getAllAllowances(req, res) {
    try {
      console.log("🔍 Fetching allowances");
      const filters = {
        active: req.query.active === "true",
        department: req.query.department
          ? asObjectId(req.query.department)
          : undefined,
        gradeLevel: req.query.gradeLevel,
      };

      const allowances = await AllowanceService.getAllAllowances(filters);

      res.status(200).json({
        success: true,
        data: allowances,
      });
    } catch (error) {
      console.error("❌ Error fetching allowances:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async updateAllowance(req, res) {
    try {
      console.log("📝 Updating allowance:", req.params.id);

      const allowance = await AllowanceService.updateAllowance(
        req.params.id,
        asObjectId(req.user.id),
        req.body
      );

      res.status(200).json({
        success: true,
        message: "Allowance updated successfully",
        data: allowance,
      });
    } catch (error) {
      console.error("❌ Error updating allowance:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async toggleAllowanceStatus(req, res) {
    try {
      console.log("🔄 Toggling allowance status:", req.params.id);

      const allowance = await AllowanceService.toggleAllowanceStatus(
        req.params.id,
        asObjectId(req.user.id)
      );

      res.status(200).json({
        success: true,
        message: `Allowance ${
          allowance.active ? "activated" : "deactivated"
        } successfully`,
        data: allowance,
      });
    } catch (error) {
      console.error("❌ Error toggling allowance status:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async deleteAllowance(req, res) {
    try {
      console.log("🗑️ Deleting allowance:", req.params.id);

      await AllowanceService.deleteAllowance(req.params.id);

      res.status(200).json({
        success: true,
        message: "Allowance deleted successfully",
      });
    } catch (error) {
      console.error("❌ Error deleting allowance:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  // ===== Bonus Management =====
  static async createBonus(req, res) {
    try {
      console.log("📝 Creating bonus with data:", req.body);

      const bonus = await BonusService.createBonus(asObjectId(req.user.id), {
        ...req.body,
        employee: asObjectId(req.body.employee),
        department: req.body.department
          ? asObjectId(req.body.department)
          : undefined,
        paymentDate: new Date(req.body.paymentDate),
      });

      res.status(201).json({
        success: true,
        message: "Bonus created successfully",
        data: bonus,
      });
    } catch (error) {
      console.error("❌ Error creating bonus:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async getAllBonuses(req, res) {
    try {
      console.log("🔍 Fetching bonuses");
      const filters = {
        employee: req.query.employee
          ? asObjectId(req.query.employee)
          : undefined,
        department: req.query.department
          ? asObjectId(req.query.department)
          : undefined,
        approvalStatus: req.query.status,
        type: req.query.type,
      };

      const bonuses = await BonusService.getAllBonuses(filters);

      res.status(200).json({
        success: true,
        data: bonuses,
      });
    } catch (error) {
      console.error("❌ Error fetching bonuses:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async updateBonus(req, res) {
    try {
      console.log("📝 Updating bonus:", req.params.id);

      const bonus = await BonusService.updateBonus(
        req.params.id,
        asObjectId(req.user.id),
        req.body
      );

      res.status(200).json({
        success: true,
        message: "Bonus updated successfully",
        data: bonus,
      });
    } catch (error) {
      console.error("❌ Error updating bonus:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async approveBonus(req, res) {
    try {
      console.log("✍️ Processing bonus approval for:", req.params.id);

      const bonus = await BonusService.approveBonus(
        req.params.id,
        asObjectId(req.user.id),
        req.body.approved
      );

      res.status(200).json({
        success: true,
        message: `Bonus ${bonus.approvalStatus} successfully`,
        data: bonus,
      });
    } catch (error) {
      console.error("❌ Error approving bonus:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async deleteBonus(req, res) {
    try {
      console.log("🗑️ Deleting bonus:", req.params.id);

      await BonusService.deleteBonus(req.params.id);

      res.status(200).json({
        success: true,
        message: "Bonus deleted successfully",
      });
    } catch (error) {
      console.error("❌ Error deleting bonus:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  // Allowance Management Methods
  static async getAllAllowances(req, res) {
    try {
      const allowances = await Allowance.find()
        .populate("department", "name")
        .populate("employee", "firstName lastName email")
        .populate("salaryGrade", "level basicSalary")
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: allowances,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async createAllowance(req, res) {
    try {
      const allowance = await Allowance.create({
        ...req.body,
        createdBy: req.user._id,
        updatedBy: req.user._id,
      });

      res.status(201).json({
        success: true,
        data: allowance,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async getAllowanceDetails(req, res) {
    try {
      const allowance = await Allowance.findById(req.params.id)
        .populate("department", "name")
        .populate("employee", "firstName lastName email")
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
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async updateAllowance(req, res) {
    try {
      const allowance = await Allowance.findByIdAndUpdate(
        req.params.id,
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
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async deleteAllowance(req, res) {
    try {
      const allowance = await Allowance.findByIdAndDelete(req.params.id);

      if (!allowance) {
        return res.status(404).json({
          success: false,
          error: "Allowance not found",
        });
      }

      res.status(200).json({
        success: true,
        data: {},
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async approveAllowance(req, res) {
    try {
      const allowance = await Allowance.findByIdAndUpdate(
        req.params.id,
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

      // Update user's personal allowances array
      await UserModel.findByIdAndUpdate(allowance.employee, {
        $pull: { personalAllowances: { allowanceId: allowance._id } },
      });

      const personalAllowance = {
        allowanceId: allowance._id,
        status: "APPROVED",
        usedInPayroll: {
          month: null,
          year: null,
          payrollId: null,
        },
      };

      await UserModel.findByIdAndUpdate(allowance.employee, {
        $push: { personalAllowances: personalAllowance },
      });

      res.status(200).json({
        success: true,
        data: allowance,
        message: "Allowance approved successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async rejectAllowance(req, res) {
    try {
      const { rejectionReason } = req.body;

      const allowance = await Allowance.findByIdAndUpdate(
        req.params.id,
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
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Add this new method for custom statutory deductions
  static async createCustomStatutoryDeduction(req, res) {
    try {
      const userId = req.user.id; // Changed from req.user.userId
      const deductionData = req.body;

      const deduction = await DeductionService.createCustomStatutoryDeduction(
        userId,
        deductionData
      );

      res.status(201).json({
        success: true,
        message: "Custom statutory deduction created successfully",
        data: deduction,
      });
    } catch (error) {
      console.error("❌ Error creating custom statutory deduction:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  // Add this method to the SuperAdminController class
  static async createDepartmentStatutoryDeduction(req, res) {
    try {
      const { userId } = req.user;
      const { departmentId, ...deductionData } = req.body;

      if (!departmentId) {
        throw new ApiError(400, "Department ID is required");
      }

      const deduction = await DeductionService.createDepartmentDeduction(
        userId,
        departmentId,
        {
          ...deductionData,
          type: "statutory",
        }
      );

      res.status(201).json({
        success: true,
        message: "Department statutory deduction created successfully",
        data: deduction,
      });
    } catch (error) {
      console.error("❌ Error creating department statutory deduction:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async assignDeductionToEmployee(req, res) {
    try {
      const { deductionId, employeeId } = req.params;

      const deduction = await DeductionService.assignDeductionToEmployee(
        deductionId,
        employeeId,
        req.user._id // Pass the assigner's ID
      );

      return res.status(200).json({
        success: true,
        message: "Deduction assigned successfully",
        data: deduction,
      });
    } catch (error) {
      throw new ApiError(error.statusCode || 500, error.message);
    }
  }

  static async removeDeductionFromEmployee(req, res) {
    try {
      const { deductionId, employeeId } = req.params;
      const { reason } = req.body; // Add reason support

      const deduction = await DeductionService.removeDeductionFromEmployee(
        deductionId,
        employeeId,
        req.user._id,
        reason
      );

      return res.status(200).json({
        success: true,
        message: "Deduction removed successfully",
        data: deduction,
      });
    } catch (error) {
      throw new ApiError(error.statusCode || 500, error.message);
    }
  }

  static async getEmployeeDeductions(req, res) {
    try {
      const { employeeId } = req.params;

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

  static async assignDeductionToMultipleEmployees(req, res) {
    try {
      const { deductionId } = req.params;
      const { employeeIds } = req.body;

      console.log("🔄 Processing batch deduction assignment");

      if (!employeeIds || !Array.isArray(employeeIds)) {
        throw new ApiError(400, "Employee IDs array is required");
      }

      const result = await DeductionService.assignDeductionToMultipleEmployees(
        deductionId,
        employeeIds,
        req.user._id
      );

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.deduction,
      });
    } catch (error) {
      console.error("❌ Batch assignment failed:", error);
      throw new ApiError(error.statusCode || 500, error.message);
    }
  }

  static async removeDeductionFromMultipleEmployees(req, res) {
    try {
      const { deductionId } = req.params;
      const { employeeIds, reason } = req.body;

      console.log("🔄 Processing batch deduction removal");

      if (!employeeIds || !Array.isArray(employeeIds)) {
        throw new ApiError(400, "Employee IDs array is required");
      }

      const result =
        await DeductionService.removeDeductionFromMultipleEmployees(
          deductionId,
          employeeIds,
          req.user._id,
          reason
        );

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.deduction,
      });
    } catch (error) {
      console.error("❌ Batch removal failed:", error);
      throw new ApiError(error.statusCode || 500, error.message);
    }
  }

  static async getDeductionAssignmentHistory(req, res) {
    try {
      const { deductionId } = req.params;

      const deduction = await Deduction.findById(deductionId)
        .populate({
          path: "assignmentHistory.employee",
          select: "firstName lastName employeeId",
        })
        .populate({
          path: "assignmentHistory.by",
          select: "firstName lastName",
        });

      if (!deduction) {
        throw new ApiError(404, "Deduction not found");
      }

      return res.status(200).json({
        success: true,
        data: deduction.assignmentHistory,
      });
    } catch (error) {
      throw new ApiError(error.statusCode || 500, error.message);
    }
  }

  static async createDeduction(req, res) {
    try {
      console.log("📝 Creating deduction:", req.body);

      const deduction = new Deduction({
        ...req.body,
        createdBy: req.user._id,
        updatedBy: req.user._id,
        isActive: true,
      });

      await deduction.save();
      console.log("✅ Deduction created successfully");

      // Add audit logging
      await PayrollStatisticsLogger.logDeductionAction({
        action: "CREATE",
        deductionId: deduction._id,
        userId: req.user._id,
        details: {
          name: deduction.name,
          type: deduction.type,
          value: deduction.value,
          calculationMethod: deduction.calculationMethod,
          effectiveDate: deduction.effectiveDate,
          expiryDate: deduction.expiryDate,
          department: deduction.department,
          gradeLevel: deduction.gradeLevel,
          createdBy: req.user._id,
          position: req.user.position,
          role: req.user.role,
          message: `Created deduction: ${deduction.name}`,
        },
        statisticsDetails: {
          deductionType: deduction.type,
          calculationMethod: deduction.calculationMethod,
          value: deduction.value,
        },
        auditDetails: {
          entity: "DEDUCTION",
          entityId: deduction._id,
          action: "CREATE",
          performedBy: req.user._id,
          status: "ACTIVE",
          remarks: `Created deduction: ${deduction.name}`,
        },
      });

      res.status(201).json({
        success: true,
        message: "Deduction created successfully",
        data: deduction,
      });
    } catch (error) {
      console.error("❌ Error creating deduction:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  // ===== Payment Management Controllers =====
  static async getPaymentHistory(req, res) {
    try {
      const { payrollId } = req.params;
      const payments = await Payment.find({ payrollId })
        .populate("employeeId", "firstName lastName employeeId")
        .populate("processedBy", "firstName lastName")
        .sort({ processedAt: -1 });

      res.status(200).json({
        success: true,
        data: payments,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPaymentMethods(req, res) {
    try {
      const paymentMethods = await PaymentMethod.find()
        .populate("createdBy", "firstName lastName")
        .populate("updatedBy", "firstName lastName")
        .sort({ name: 1 });

      res.status(200).json({
        success: true,
        data: paymentMethods,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPaymentMethods(req, res) {
    try {
      const paymentMethods = await PaymentMethod.find()
        .populate("createdBy", "firstName lastName")
        .populate("updatedBy", "firstName lastName")
        .sort({ name: 1 });

      // Create audit log
      await Audit.create({
        user: req.user._id,
        action: AuditAction.VIEW,
        entity: AuditEntity.PAYMENT_METHOD,
        details: {
          methodCount: paymentMethods.length,
        },
      });

      res.status(200).json({
        success: true,
        data: paymentMethods,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createPaymentMethod(req, res) {
    try {
      const paymentMethod = await PaymentMethod.create({
        ...req.body,
        createdBy: req.user._id,
        updatedBy: req.user._id,
      });

      res.status(201).json({
        success: true,
        message: "Payment method created successfully",
        data: paymentMethod,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updatePaymentMethod(req, res) {
    try {
      const paymentMethod = await PaymentMethod.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          updatedBy: req.user._id,
        },
        { new: true }
      );

      if (!paymentMethod) {
        throw new ApiError(404, "Payment method not found");
      }

      res.status(200).json({
        success: true,
        message: "Payment method updated successfully",
        data: paymentMethod,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deletePaymentMethod(req, res) {
    try {
      const paymentMethod = await PaymentMethod.findById(req.params.id);

      if (!paymentMethod) {
        throw new ApiError(404, "Payment method not found");
      }

      // Check if payment method is in use
      const inUse = await Payment.exists({ paymentMethod: paymentMethod.type });
      if (inUse) {
        throw new ApiError(400, "Cannot delete payment method that is in use");
      }

      await PaymentMethod.findByIdAndDelete(req.params.id);

      res.status(200).json({
        success: true,
        message: "Payment method deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async markPaymentPaid(req, res, next) {
    try {
      const { payrollIds } = req.body;
      const user = req.user;

      // Handle both single and multiple payrolls
      const isBatch = Array.isArray(payrollIds) && payrollIds.length > 0;
      const ids = isBatch ? payrollIds : [req.params.id];

      // Validate IDs
      if (!ids || ids.length === 0) {
        console.error("❌ No payroll IDs provided");
        throw new ApiError(400, "No payroll IDs provided");
      }

      // Find all payrolls
      const payrolls = await PayrollModel.find({
        _id: { $in: ids },
      }).populate([
        { path: "employee", select: "firstName lastName employeeId email" },
        { path: "department", select: "name code" },
      ]);

      if (payrolls.length !== ids.length) {
        console.error(
          "❌ Some payrolls not found. Expected:",
          ids.length,
          "Found:",
          payrolls.length
        );
        throw new ApiError(404, "Some payrolls not found");
      }

      // Check if user has permission
      if (!user.hasPermission(Permission.APPROVE_PAYROLL)) {
        console.error("❌ User lacks permission:", user._id);
        throw new ApiError(
          403,
          "You don't have permission to mark payments as paid"
        );
      }

      // Validate all payrolls status
      const invalidPayrolls = payrolls.filter(
        (payroll) => payroll.status !== PAYROLL_STATUS.PENDING_PAYMENT
      );

      if (invalidPayrolls.length > 0) {
        console.error(
          "❌ Invalid payroll statuses:",
          invalidPayrolls.map((p) => ({ id: p._id, status: p.status }))
        );
        throw new ApiError(
          400,
          `Some payrolls are not in pending payment status: ${invalidPayrolls
            .map((p) => p._id)
            .join(", ")}`
        );
      }

      const updatedPayrolls = [];
      const errors = [];

      // Process each payroll
      for (const payroll of payrolls) {
        try {
          // Update payroll status to PAID
          const updatedPayroll = {
            ...payroll.toObject(),
            status: PAYROLL_STATUS.PAID,
            approvalFlow: {
              ...payroll.approvalFlow,
              currentLevel: APPROVAL_LEVELS.SUPER_ADMIN,
              history: [
                ...(payroll.approvalFlow.history || []),
                {
                  level: APPROVAL_LEVELS.SUPER_ADMIN,
                  status: "APPROVED",
                  user: user._id,
                  action: "APPROVE",
                  updatedBy: user._id,
                  updatedAt: new Date(),
                  remarks: "Payment completed successfully",
                },
              ],
              submittedBy: user._id,
              submittedAt: new Date(),
              remarks: "Payment marked as completed",
            },
          };

          // Update the payroll
          const updated = await PayrollModel.findByIdAndUpdate(
            payroll._id,
            { $set: updatedPayroll },
            { new: true, runValidators: true }
          );

          // Create payment record
          const payment = await Payment.create({
            payrollId: payroll._id,
            employeeId: payroll.employee._id,
            amount: payroll.totals.netPay,
            status: "COMPLETED",
            processedBy: user._id,
            processedAt: new Date(),
            paymentMethod: req.body.paymentMethod || "BANK_TRANSFER",
            reference: `PAY-${Date.now()}-${payroll._id}`,
            bankDetails: payroll.payment,
          });

          // Consolidated audit logging for payment completion
          await PayrollStatisticsLogger.logPayrollAction({
            action: AuditAction.PAYMENT_PROCESSED,
            payrollId: payroll._id,
            userId: user.id,
            status: PAYROLL_STATUS.PAID,
            details: {
              previousStatus: PAYROLL_STATUS.PENDING_PAYMENT,
              paymentMethod: req.body.paymentMethod || "BANK_TRANSFER",
              notes: "Payment marked as completed",
              employeeName: `${payroll.employee?.firstName} ${payroll.employee?.lastName}`,
              departmentName: payroll.department?.name,
              netPay: payroll.totals?.netPay,
              paymentReference: payment.reference,
              createdBy: user.id,
              position: user.position,
              role: user.role,
              message: `Payment completed for ${payroll.employee?.firstName} ${payroll.employee?.lastName}`,
              approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
              remarks: "Payment marked as completed",
            },
          });

          updatedPayrolls.push({ payroll: updated, payment });
        } catch (error) {
          console.error("❌ Error processing payroll:", payroll._id, error);
          errors.push({
            payrollId: payroll._id,
            error: error.message,
          });
        }
      }

      // Create notifications
      if (isBatch) {
        const batchMessage = `Batch payment completed for ${updatedPayrolls.length} payrolls`;
        console.log("📢 Sending batch notification:", batchMessage);

        // Notify super admin
        await NotificationService.createPayrollNotification(
          null,
          NOTIFICATION_TYPES.PAYROLL_PAID,
          user,
          batchMessage
        );

        // Notify accountants
        const accountants = await UserModel.find({ role: "ACCOUNTANT" });
        for (const accountant of accountants) {
          await NotificationService.createPayrollNotification(
            null,
            NOTIFICATION_TYPES.PAYROLL_PAID,
            accountant,
            batchMessage
          );
        }
      } else {
        // Single payroll notifications
        const payroll = updatedPayrolls[0].payroll;

        // Notify super admin
        await NotificationService.createPayrollNotification(
          payroll,
          NOTIFICATION_TYPES.PAYROLL_PAID,
          user,
          "Payment marked as completed successfully"
        );

        // Notify accountants
        const accountants = await UserModel.find({ role: "ACCOUNTANT" });
        for (const accountant of accountants) {
          await NotificationService.createPayrollNotification(
            payroll,
            NOTIFICATION_TYPES.PAYROLL_PAID,
            accountant,
            "A payment has been marked as completed"
          );
        }
      }

      // Log batch operation if multiple payrolls
      if (isBatch && updatedPayrolls.length > 0) {
        await PayrollStatisticsLogger.logBatchOperation(
          "MARK_AS_PAID",
          updatedPayrolls.map(({ payroll }) => payroll._id),
          user.id,
          {
            paymentMethod: req.body.paymentMethod || "BANK_TRANSFER",
            notes: "Batch payments marked as completed",
            successCount: updatedPayrolls.length,
            errorCount: errors.length,
            message: `Batch payments marked as completed for ${updatedPayrolls.length} payrolls`,
            approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
            createdBy: user.id,
            position: user.position,
            role: user.role,
          }
        );
      }

      res.status(200).json({
        success: true,
        message: isBatch
          ? "Batch payments marked as completed successfully"
          : "Payment marked as completed successfully",
        data: {
          payrolls: updatedPayrolls.map(({ payroll, payment }) => ({
            payrollId: payroll._id,
            status: PAYROLL_STATUS.PAID,
            payment: {
              amount: payroll.totals.netPay,
              method: req.body.paymentMethod || "BANK_TRANSFER",
              reference: payment.reference,
              bankDetails: payroll.payment,
              notes: "Payment marked as completed",
            },
          })),
          errors: errors.length > 0 ? errors : undefined,
        },
      });
    } catch (error) {
      console.error("❌ Batch mark as paid error:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async markPaymentFailed(req, res) {
    try {
      const { payrollIds } = req.body;
      const user = req.user;

      // Handle both single and multiple payrolls
      const isBatch = Array.isArray(payrollIds) && payrollIds.length > 1;
      const ids = isBatch ? payrollIds : [req.params.id];
      console.log(
        `🔍 Starting ${
          isBatch ? "batch" : "single"
        } mark as failed for payroll ID(s):`,
        ids
      );
      console.log("👤 Processor:", user.firstName, user.lastName);

      // Find all payrolls
      const payrolls = await PayrollModel.find({
        _id: { $in: ids },
      }).populate([
        { path: "employee", select: "firstName lastName employeeId email" },
        { path: "department", select: "name code" },
      ]);

      if (payrolls.length !== ids.length) {
        throw new ApiError(404, "Some payrolls not found");
      }

      // Validate all payrolls status
      const invalidPayrolls = payrolls.filter(
        (payroll) => payroll.status !== PAYROLL_STATUS.PENDING_PAYMENT
      );

      if (invalidPayrolls.length > 0) {
        throw new ApiError(
          400,
          `Some payrolls are not in pending payment status: ${invalidPayrolls
            .map((p) => p._id)
            .join(", ")}`
        );
      }

      const updatedPayrolls = [];
      const errors = [];

      // Process each payroll
      for (const payroll of payrolls) {
        try {
          // Update payroll status to FAILED
          const updatedPayroll = {
            ...payroll.toObject(),
            status: PAYROLL_STATUS.FAILED,
            approvalFlow: {
              ...payroll.approvalFlow,
              currentLevel: APPROVAL_LEVELS.SUPER_ADMIN,
              history: [
                ...(payroll.approvalFlow.history || []),
                {
                  level: APPROVAL_LEVELS.SUPER_ADMIN,
                  status: "REJECTED",
                  user: user._id,
                  action: "REJECT",
                  updatedBy: user._id,
                  updatedAt: new Date(),
                  remarks: "Payment marked as failed",
                },
              ],
              submittedBy: user._id,
              submittedAt: new Date(),
              remarks: "Payment marked as failed",
            },
          };

          // Update the payroll
          const updated = await PayrollModel.findByIdAndUpdate(
            payroll._id,
            { $set: updatedPayroll },
            { new: true, runValidators: true }
          );

          // Create payment record
          const payment = await Payment.create({
            payrollId: payroll._id,
            employeeId: payroll.employee._id,
            amount: payroll.totals.netPay,
            status: PaymentStatus.FAILED,
            processedBy: user._id,
            processedAt: new Date(),
            paymentMethod: "BANK_TRANSFER",
            reference: `PAY-${Date.now()}-${payroll._id}`,
            bankDetails: payroll.payment,
            notes: "Payment marked as failed",
          });

          // Consolidated audit logging for payment failure
          await PayrollStatisticsLogger.logPayrollAction({
            action: AuditAction.PAYMENT_PROCESSED,
            payrollId: payroll._id,
            userId: user.id,
            status: PAYROLL_STATUS.FAILED,
            details: {
              previousStatus: PAYROLL_STATUS.PENDING_PAYMENT,
              paymentMethod: "BANK_TRANSFER",
              notes: "Payment marked as failed",
              employeeName: `${payroll.employee?.firstName} ${payroll.employee?.lastName}`,
              departmentName: payroll.department?.name,
              netPay: payroll.totals?.netPay,
              paymentReference: payment.reference,
              createdBy: user.id,
              position: user.position,
              role: user.role,
              message: `Payment failed for ${payroll.employee?.firstName} ${payroll.employee?.lastName}`,
              approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
              remarks: "Payment marked as failed",
            },
          });

          updatedPayrolls.push({ payroll: updated, payment });
        } catch (error) {
          errors.push({
            payrollId: payroll._id,
            error: error.message,
          });
        }
      }

      // Log batch operation if multiple payrolls
      if (isBatch && updatedPayrolls.length > 0) {
        await PayrollStatisticsLogger.logBatchOperation(
          "MARK_AS_FAILED",
          updatedPayrolls.map(({ payroll }) => payroll._id),
          user.id,
          {
            paymentMethod: "BANK_TRANSFER",
            notes: "Batch payments marked as failed",
            successCount: updatedPayrolls.length,
            errorCount: errors.length,
            message: `Batch payments marked as failed for ${updatedPayrolls.length} payrolls`,
            approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
            createdBy: user.id,
            position: user.position,
            role: user.role,
          }
        );
      }

      // Create batch notification if processing multiple payrolls
      if (isBatch) {
        const batchMessage = `Batch payment failed for ${updatedPayrolls.length} payrolls`;

        // Notify super admin
        await NotificationService.createPayrollNotification(
          null,
          NOTIFICATION_TYPES.PAYROLL_FAILED,
          user,
          batchMessage
        );

        // Notify accountants
        const accountants = await UserModel.find({ role: "ACCOUNTANT" });
        for (const accountant of accountants) {
          await NotificationService.createPayrollNotification(
            null,
            NOTIFICATION_TYPES.PAYROLL_FAILED,
            accountant,
            batchMessage
          );
        }
      } else {
        // Single payroll notifications
        const payroll = updatedPayrolls[0].payroll;

        // Notify super admin
        await NotificationService.createPayrollNotification(
          payroll,
          NOTIFICATION_TYPES.PAYROLL_FAILED,
          user,
          "Payment marked as failed"
        );

        // Notify accountants
        const accountants = await UserModel.find({ role: "ACCOUNTANT" });
        for (const accountant of accountants) {
          await NotificationService.createPayrollNotification(
            payroll,
            NOTIFICATION_TYPES.PAYROLL_FAILED,
            accountant,
            "A payment has been marked as failed"
          );
        }
      }

      res.status(200).json({
        success: true,
        message: isBatch
          ? "Batch payments marked as failed successfully"
          : "Payment marked as failed successfully",
        data: {
          payrolls: updatedPayrolls.map(({ payroll }) => ({
            payrollId: payroll._id,
            status: PAYROLL_STATUS.FAILED,
            payment: {
              amount: payroll.totals.netPay,
              notes: "Payment marked as failed",
            },
          })),
          errors: errors.length > 0 ? errors : undefined,
        },
      });
    } catch (error) {
      console.error("Batch mark as failed error:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async cancelPayment(req, res) {
    try {
      const { payrollId } = req.params;
      const payroll = await PayrollModel.findById(payrollId);

      if (!payroll) {
        throw new ApiError(404, "Payroll not found");
      }

      // Update payroll status
      payroll.status = PAYROLL_STATUS.CANCELLED;
      await payroll.save();

      // Create payment record with cancelled status
      await Payment.create({
        payrollId,
        employeeId: payroll.employee,
        amount: payroll.totals.netPay,
        status: PaymentStatus.CANCELLED,
        paymentMethod: req.body.paymentMethod,
        reference: `PAY-CANCEL-${Date.now()}`,
        processedBy: req.user._id,
        processedAt: new Date(),
        notes: req.body.notes,
      });

      // Create audit log
      await Audit.create({
        user: req.user._id,
        action: AuditAction.PROCESS,
        entity: AuditEntity.PAYMENT,
        entityId: payrollId,
        details: {
          status: PaymentStatus.CANCELLED,
          notes: req.body.notes,
        },
      });

      // Send notification to employee
      await NotificationService.createPayrollNotification(
        payroll.employee,
        NOTIFICATION_TYPES.PAYMENT_CANCELLED,
        payroll,
        req.body.notes
      );

      // Send notification to admin who processed the payment
      await NotificationService.createPayrollNotification(
        req.user._id,
        NOTIFICATION_TYPES.PAYMENT_CANCELLED,
        payroll,
        req.body.notes
      );

      res.status(200).json({
        success: true,
        message: "Payment cancelled successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async archivePayment(req, res) {
    try {
      const { payrollId } = req.params;
      const payroll = await PayrollModel.findById(payrollId);

      if (!payroll) {
        throw new ApiError(404, "Payroll not found");
      }

      // Update payroll status
      payroll.status = PAYROLL_STATUS.ARCHIVED;
      await payroll.save();

      // Create audit log
      await Audit.create({
        user: req.user._id,
        action: AuditAction.PROCESS,
        entity: AuditEntity.PAYMENT,
        entityId: payrollId,
        details: {
          status: PAYROLL_STATUS.ARCHIVED,
        },
      });

      // Send notification to employee
      await NotificationService.createPayrollNotification(
        payroll.employee,
        NOTIFICATION_TYPES.PAYMENT_ARCHIVED,
        payroll
      );

      // Send notification to admin who processed the payment
      await NotificationService.createPayrollNotification(
        req.user._id,
        NOTIFICATION_TYPES.PAYMENT_ARCHIVED,
        payroll
      );

      res.status(200).json({
        success: true,
        message: "Payment archived successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async sendPayslipEmail(req, res) {
    try {
      const { payrollId } = req.params;
      const user = req.user;

      // Check permissions
      if (!user.hasPermission(Permission.VIEW_DEPARTMENT_PAYSLIPS)) {
        throw new ApiError(403, "You don't have permission to send payslips");
      }

      // Find payroll by _id
      const payroll = await PayrollModel.findById(payrollId)
        .populate("employee")
        .populate("department")
        .populate("salaryGrade")
        .populate({
          path: "approvalFlow",
          populate: ["submittedBy", "approvedBy"],
        });

      if (!payroll) {
        throw new ApiError(404, "Payslip not found");
      }

      // Check if user has permission to view this payslip
      if (
        user.role === UserRole.ADMIN &&
        payroll.employee.department.toString() !== user.department.toString()
      ) {
        throw new ApiError(
          403,
          "You can only send payslips for employees in your department"
        );
      }

      // Prepare data for PDF generation
      const pdfData = {
        employee: payroll.employee,
        department: payroll.department,
        month: payroll.month,
        year: payroll.year,
        basicSalary: payroll.basicSalary,
        earnings: {
          basicSalary: payroll.basicSalary,
          overtime: payroll.earnings.overtime,
          bonus: payroll.earnings.bonus,
          totalEarnings: payroll.earnings.totalEarnings,
        },
        deductions: {
          tax: payroll.deductions.tax,
          pension: payroll.deductions.pension,
          nhf: payroll.deductions.nhf,
          loans: payroll.deductions.loans,
          others: payroll.deductions.others,
          totalDeductions: payroll.totals.totalDeductions,
          breakdown: payroll.deductions.breakdown,
        },
        totals: {
          grossEarnings: payroll.totals.grossEarnings,
          totalDeductions: payroll.totals.totalDeductions,
          netPay: payroll.totals.netPay,
        },
        paymentDetails: {
          status: payroll.status,
          paymentDate: payroll.approvalFlow.paidAt || new Date(),
        },
        gradeAllowances: payroll.allowances?.gradeAllowances || [],
        additionalAllowances: payroll.allowances?.additionalAllowances || [],
        personalBonuses: payroll.bonuses?.items || [],
      };

      // Generate PDF
      const pdfDoc = await generatePayslipPDF(pdfData);
      const pdfBuffer = await pdfDoc.output("arraybuffer");

      // Create email service instance
      const emailService = new EmailService();

      // Retry logic for email sending
      const maxRetries = 3;
      let lastError = null;
      let attempt = 0;

      for (attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(
            `📧 [sendPayslipEmail] Attempt ${attempt}/${maxRetries} - Sending payslip to ${payroll.employee.email}`
          );

          // Send email
          await emailService.sendPayslipEmail(
            payroll.employee.email,
            pdfData,
            pdfBuffer
          );

          console.log(
            `✅ [sendPayslipEmail] Payslip sent successfully on attempt ${attempt}`
          );

          // Update payroll record to mark email as sent
          await PayrollModel.findByIdAndUpdate(payrollId, {
            $set: {
              emailSent: true,
              emailSentAt: new Date(),
            },
          });

          // Create notification for employee
          await NotificationService.createNotification(
            payroll.employee._id,
            NOTIFICATION_TYPES.PAYROLL_COMPLETED,
            payroll.employee,
            payroll,
            null,
            { recipientId: payroll.employee._id }
          );

          // Create notification for sender (admin)
          await NotificationService.createNotification(
            user._id,
            NOTIFICATION_TYPES.PAYROLL_COMPLETED,
            payroll.employee,
            payroll,
            null,
            { recipientId: user._id }
          );

          return res.status(200).json({
            success: true,
            message: "Payslip sent successfully",
            attempt: attempt,
          });
        } catch (error) {
          lastError = error;
          console.error(
            `❌ [sendPayslipEmail] Attempt ${attempt}/${maxRetries} failed:`,
            {
              error: error.message,
              code: error.code,
              employeeEmail: payroll.employee.email,
              payrollId: payrollId,
            }
          );

          // If this is not the last attempt, wait before retrying
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
            console.log(
              `⏳ [sendPayslipEmail] Waiting ${delay}ms before retry...`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      // If all attempts failed
      console.error(
        `💥 [sendPayslipEmail] All ${maxRetries} attempts failed for payroll ${payrollId}:`,
        {
          employeeEmail: payroll.employee.email,
          finalError: lastError.message,
          attempts: maxRetries,
        }
      );

      // Update payroll record to mark email as failed
      await PayrollModel.findByIdAndUpdate(payrollId, {
        $set: {
          emailSent: false,
          emailSentAt: new Date(),
          emailError: lastError.message,
        },
      });

      return res.status(500).json({
        success: false,
        message: `Failed to send payslip after ${maxRetries} attempts`,
        error: lastError.message,
        attempts: maxRetries,
      });
    } catch (error) {
      console.error("Error sending payslip:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message: message || "Failed to send payslip",
      });
    }
  }

  static async getOffboardingUsers(req, res) {
    try {
      const offboardingUsers = await UserModel.find({
        status: "offboarding",
      })
        .select("-password")
        .populate("department", "name code")
        .populate("createdBy", "firstName lastName");

      return res.status(200).json({
        success: true,
        data: offboardingUsers,
      });
    } catch (error) {
      console.error("Error fetching offboarding users:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch offboarding users",
      });
    }
  }

  // Process payroll for all employees in a department
  static async processDepartmentEmployeesPayroll(req, res) {
    try {
      const {
        departmentId,
        month,
        year,
        frequency = PayrollFrequency.MONTHLY,
      } = req.body;
      console.log("🔄 Processing payroll for department:", departmentId);

      // Get super admin details
      const superAdmin = await UserModel.findById(req.user.id)
        .populate("department", "name code")
        .select("+position +role +department");

      if (!superAdmin) {
        throw new ApiError(404, "Super Admin not found");
      }

      // Get department details
      const department = await DepartmentModel.findById(departmentId);
      if (!department) {
        throw new ApiError(404, "Department not found");
      }

      // Get all active employees in the department
      const employees = await UserModel.find({
        department: departmentId,
        status: "active",
        role: UserRole.USER,
      });

      if (!employees.length) {
        throw new ApiError(404, "No active employees found in department");
      }

      const results = {
        total: employees.length,
        processed: 0,
        skipped: 0,
        failed: 0,
        errors: [],
        successful: [],
        skippedDetails: [],
        failedDetails: [],
        processedDetails: [],
      };

      // Process each employee's payroll
      for (const employee of employees) {
        try {
          // Check if payroll already exists for this period
          const existingPayroll = await PayrollModel.findOne({
            employee: employee._id,
            month,
            year,
            frequency,
          });

          if (existingPayroll) {
            results.skipped++;
            results.skippedDetails.push(
              `${employee.firstName} ${employee.lastName} (${employee.employeeId}): Payroll already exists`
            );
            continue;
          }

          // Get employee's salary grade
          if (!employee.gradeLevel) {
            results.failed++;
            results.failedDetails.push(
              `${employee.firstName} ${employee.lastName} (${employee.employeeId}): No grade level assigned`
            );
            continue;
          }

          const salaryGrade = await SalaryGrade.findOne({
            level: employee.gradeLevel,
            isActive: true,
          });

          if (!salaryGrade) {
            results.failed++;
            results.failedDetails.push(
              `${employee.firstName} ${employee.lastName} (${employee.employeeId}): No active salary grade found for level ${employee.gradeLevel}`
            );
            continue;
          }

          // Calculate payroll using PayrollService
          const payrollData = await PayrollService.calculatePayroll(
            employee._id,
            salaryGrade._id,
            month,
            year,
            frequency,
            departmentId
          );

          if (!payrollData) {
            results.failed++;
            results.failedDetails.push(
              `${employee.firstName} ${employee.lastName} (${employee.employeeId}): Failed to calculate payroll`
            );
            continue;
          }

          // Create payroll record with APPROVED status
          const newPayroll = await PayrollModel.create({
            ...payrollData,
            employee: employee._id,
            department: department._id,
            status: PAYROLL_STATUS.APPROVED,
            processedBy: superAdmin._id,
            createdBy: superAdmin._id,
            updatedBy: superAdmin._id,
            payment: {
              accountName: "Pending",
              accountNumber: "Pending",
              bankName: "Pending",
            },
            approvalFlow: {
              currentLevel: APPROVAL_LEVELS.SUPER_ADMIN,
              history: [
                {
                  level: APPROVAL_LEVELS.SUPER_ADMIN,
                  status: "APPROVED",
                  action: "APPROVE",
                  user: superAdmin._id,
                  timestamp: new Date(),
                  remarks:
                    "Department payroll created and approved by Super Admin",
                },
              ],
              submittedBy: superAdmin._id,
              submittedAt: new Date(),
              status: "APPROVED",
            },
          });

          // Consolidated audit logging for each processed payroll
          await PayrollStatisticsLogger.logPayrollAction({
            action: AuditAction.CREATE,
            payrollId: newPayroll._id,
            userId: superAdmin._id,
            status: PAYROLL_STATUS.APPROVED,
            details: {
              employeeId: employee._id,
              departmentId: department._id,
              month,
              year,
              frequency,
              netPay: newPayroll.totals?.netPay,
              employeeName: `${employee.firstName} ${employee.lastName}`,
              departmentName: department.name,
              createdBy: superAdmin._id,
              position: superAdmin.position,
              role: superAdmin.role,
              message: `Department payroll approved for ${employee.firstName} ${employee.lastName}`,
              approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
              remarks: "Department payroll processing by Super Admin",
            },
          });

          results.processed++;
          results.processedDetails.push(
            `${employee.firstName} ${employee.lastName} (${employee.employeeId})`
          );
          results.successful.push({
            employeeId: employee._id,
            payrollId: newPayroll._id,
            department: department._id,
          });
        } catch (error) {
          console.error(
            `Error processing payroll for employee ${employee.employeeId}:`,
            error
          );
          results.failed++;
          results.failedDetails.push(
            `${employee.firstName} ${employee.lastName} (${employee.employeeId}): ${error.message}`
          );
        }
      }

      // Log batch operation summary
      if (results.processed > 0) {
        await PayrollStatisticsLogger.logBatchOperation(
          "DEPARTMENT_PROCESSING",
          results.successful.map((s) => s.payrollId),
          superAdmin._id,
          {
            departmentId,
            departmentName: department.name,
            month,
            year,
            frequency,
            total: results.total,
            processed: results.processed,
            skipped: results.skipped,
            failed: results.failed,
            message: `Department payroll processing approved for ${department.name}`,
            approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
            createdBy: superAdmin._id,
            position: superAdmin.position,
            role: superAdmin.role,
            processedEmployees: results.processedDetails,
            skippedEmployees: results.skippedDetails,
            failedEmployees: results.failedDetails,
          }
        );

        // Find HR Manager and Finance Director to notify
        const hrDepartment = await DepartmentModel.findOne({
          name: { $in: ["Human Resources", "HR"] },
          status: "active",
        });

        const financeDepartment = await DepartmentModel.findOne({
          name: { $in: ["Finance and Accounting", "Finance", "Financial"] },
          status: "active",
        });

        // Create notification metadata
        const notificationMetadata = {
          month,
          year,
          departmentId,
          departmentName: department.name,
          totalEmployees: results.total,
          processedCount: results.processed,
          skippedCount: results.skipped,
          failedCount: results.failed,
          processedBy: `${superAdmin.firstName} ${superAdmin.lastName}`,
          processedByRole: "Super Admin",
          processedEmployees: results.processedDetails,
          skippedEmployees: results.skippedDetails,
          failedEmployees: results.failedDetails,
        };

        // Create a payroll object for the notification
        const notificationPayroll = {
          _id: new Types.ObjectId(),
          month,
          year,
          status: "APPROVED",
          totals: {
            processed: results.processed,
            skipped: results.skipped,
            failed: results.failed,
          },
        };

        // Notify Super Admin
        const notificationMessage = `You have processed ${results.processed}/${results.total} payrolls for ${department.name} department (${month}/${year}). ${results.skipped} skipped, ${results.failed} failed.`;

        await NotificationService.createNotification(
          superAdmin._id,
          NOTIFICATION_TYPES.BULK_PAYROLL_PROCESSED,
          null,
          notificationPayroll,
          notificationMessage,
          {
            approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
            metadata: notificationMetadata,
          }
        );

        // Notify HR Manager
        if (hrDepartment) {
          const hrManager = await UserModel.findOne({
            department: hrDepartment._id,
            position: {
              $in: [
                "Head of Human Resources",
                "HR Manager",
                "HR Head",
                "Human Resources Manager",
                "HR Director",
              ],
            },
            status: "active",
          });

          if (hrManager) {
            await NotificationService.createNotification(
              hrManager._id,
              NOTIFICATION_TYPES.BULK_PAYROLL_PROCESSED,
              null,
              notificationPayroll,
              `${results.processed} payrolls have been processed and approved for ${department.name} department by ${superAdmin.firstName} ${superAdmin.lastName} (Super Admin) for ${month}/${year}.`,
              {
                approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
                metadata: notificationMetadata,
              }
            );
          }
        }

        // Notify Finance Director
        if (financeDepartment) {
          const financeDirector = await UserModel.findOne({
            department: financeDepartment._id,
            position: {
              $in: [
                "Head of Finance",
                "Finance Director",
                "Finance Head",
                "Financial Director",
                "Financial Head",
              ],
            },
            status: "active",
          });

          if (financeDirector) {
            await NotificationService.createNotification(
              financeDirector._id,
              NOTIFICATION_TYPES.BULK_PAYROLL_PROCESSED,
              null,
              notificationPayroll,
              `${results.processed} payrolls have been processed and approved for ${department.name} department by ${superAdmin.firstName} ${superAdmin.lastName} (Super Admin) for ${month}/${year}.`,
              {
                approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
                metadata: notificationMetadata,
              }
            );
          }
        }
      }

      // Set response headers to trigger UI updates
      res.set({
        "X-Refresh-Payrolls": "true",
        "X-Refresh-Audit-Logs": "true",
      });

      // Create summary message
      const summaryMessage = `Department payroll processing approved. Successfully processed ${results.processed} out of ${results.total} employees. Skipped: ${results.skipped}, Failed: ${results.failed}`;

      res.status(200).json({
        success: true,
        message: summaryMessage,
        data: results,
      });
    } catch (error) {
      console.error("❌ Error in processDepartmentEmployeesPayroll:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Error processing department payroll",
      });
    }
  }

  // Process payroll for all employees across all departments
  static async processAllDepartmentsPayroll(req, res, next) {
    try {
      const { month, year, frequency } = req.body;

      // Get all departments
      const departments = await DepartmentModel.find({ active: true });

      if (!departments.length) {
        throw new ApiError(404, "No active departments found");
      }

      const results = [];
      const errors = [];

      // Process each department
      for (const department of departments) {
        try {
          // Get active employees in department
          const employees = await UserModel.find({
            department: department._id,
            status: "ACTIVE",
            role: "EMPLOYEE",
          });

          // Skip if no employees
          if (!employees.length) {
            results.push({
              department: department.name,
              processed: 0,
              skipped: 0,
              message: "No active employees",
            });
            continue;
          }

          // Check existing payrolls
          const existingPayrolls = await PayrollModel.find({
            department: department._id,
            month,
            year,
            employee: { $in: employees.map((emp) => emp._id) },
          });

          const processableEmployees = employees.filter(
            (emp) =>
              !existingPayrolls.some(
                (p) => p.employee.toString() === emp._id.toString()
              )
          );

          // Process payroll for eligible employees
          const departmentPayrolls = await Promise.all(
            processableEmployees.map(async (employee) => {
              const payrollData =
                await PayrollService.calculatePayrollComponents(
                  employee._id,
                  month,
                  year,
                  frequency
                );

              const payroll = await PayrollModel.create({
                ...payrollData,
                status: PAYROLL_STATUS.PROCESSING,
                createdBy: req.user._id,
                department: department._id,
              });

              await NotificationService.createPayrollNotification(
                employee._id,
                NOTIFICATION_TYPES.PAYROLL_CREATED,
                payroll
              );

              return payroll;
            })
          );

          results.push({
            department: department.name,
            processed: departmentPayrolls.length,
            skipped: employees.length - departmentPayrolls.length,
            payrolls: departmentPayrolls,
          });
        } catch (error) {
          errors.push({
            department: department.name,
            error: error.message,
          });
        }
      }

      // Notify super admin of completion
      await NotificationService.createPayrollNotification(
        req.user._id,
        NOTIFICATION_TYPES.BULK_PAYROLL_PROCESSED,
        {
          month,
          year,
          totalDepartments: departments.length,
          successfulDepartments: results.length,
          failedDepartments: errors.length,
        }
      );

      res.status(200).json({
        success: true,
        message: "All departments payroll processing completed",
        data: {
          results,
          errors,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // For handling bulk department submissions
  static async approveDepartmentPayrolls(req, res, next) {
    try {
      const { departmentId, month, year, remarks } = req.body;

      // Find all pending payrolls for the department
      const pendingPayrolls = await PayrollModel.find({
        department: departmentId,
        month,
        year,
        status: PAYROLL_STATUS.PENDING,
      }).populate("employee");

      if (pendingPayrolls.length === 0) {
        throw new ApiError(
          404,
          "No pending payrolls found for this department"
        );
      }

      // Update all payrolls
      const updatedPayrolls = await Promise.all(
        pendingPayrolls.map(async (payroll) => {
          payroll.status = PAYROLL_STATUS.APPROVED;
          payroll.approvalFlow.push({
            status: PAYROLL_STATUS.APPROVED,
            approvedBy: req.user._id,
            approvedAt: new Date(),
            remarks,
          });
          await payroll.save();

          // Consolidated audit logging for each approved payroll
          await PayrollStatisticsLogger.logPayrollAction({
            action: AuditAction.APPROVE,
            payrollId: payroll._id,
            userId: req.user._id,
            status: PAYROLL_STATUS.APPROVED,
            details: {
              employeeId: payroll.employee._id,
              departmentId: payroll.department,
              month: payroll.month,
              year: payroll.year,
              netPay: payroll.totals?.netPay,
              employeeName: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
              departmentName: payroll.department?.name,
              createdBy: req.user._id,
              position: req.user.position,
              role: req.user.role,
              message: `Payroll approved for ${payroll.employee.firstName} ${payroll.employee.lastName}`,
              approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
              remarks: remarks || "Department payroll approved",
            },
          });

          // Send notification to employee
          await NotificationService.createPayrollNotification(
            payroll.employee._id,
            NOTIFICATION_TYPES.PAYROLL_APPROVED,
            payroll,
            remarks
          );

          return payroll;
        })
      );

      // Log batch operation for department approval
      await PayrollStatisticsLogger.logBatchOperation(
        "DEPARTMENT_APPROVAL",
        updatedPayrolls.map((p) => p._id),
        req.user._id,
        {
          departmentId,
          month,
          year,
          approvedCount: updatedPayrolls.length,
          remarks: remarks || "Department payrolls approved",
          message: `Approved ${updatedPayrolls.length} payrolls for department`,
          approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
          createdBy: req.user._id,
          position: req.user.position,
          role: req.user.role,
        }
      );

      // Send notification to department admin
      await NotificationService.createPayrollNotification(
        pendingPayrolls[0].createdBy,
        NOTIFICATION_TYPES.DEPARTMENT_PAYROLL_APPROVED,
        { month, year, department: departmentId },
        remarks
      );

      res.status(200).json({
        success: true,
        message: "Department payrolls approved successfully",
        data: {
          approved: updatedPayrolls.length,
          payrolls: updatedPayrolls,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // For handling selective rejection in bulk submissions
  static async rejectSelectedPayrolls(req, res, next) {
    try {
      const { payrollIds, remarks } = req.body;

      // Find all specified payrolls
      const payrolls = await PayrollModel.find({
        _id: { $in: payrollIds },
        status: PAYROLL_STATUS.PENDING,
      }).populate("employee");

      if (payrolls.length === 0) {
        throw new ApiError(
          404,
          "No pending payrolls found with the specified IDs"
        );
      }

      // Update selected payrolls
      const updatedPayrolls = await Promise.all(
        payrolls.map(async (payroll) => {
          payroll.status = PAYROLL_STATUS.REJECTED;
          payroll.approvalFlow.push({
            status: PAYROLL_STATUS.REJECTED,
            rejectedBy: req.user._id,
            rejectedAt: new Date(),
            remarks,
          });
          await payroll.save();

          // Consolidated audit logging for each rejected payroll
          await PayrollStatisticsLogger.logPayrollAction({
            action: AuditAction.REJECT,
            payrollId: payroll._id,
            userId: req.user._id,
            status: PAYROLL_STATUS.REJECTED,
            details: {
              employeeId: payroll.employee._id,
              departmentId: payroll.department._id,
              month: payroll.month,
              year: payroll.year,
              netPay: payroll.totals?.netPay,
              employeeName: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
              departmentName: payroll.department?.name,
              createdBy: req.user._id,
              position: req.user.position,
              role: req.user.role,
              message: `Payroll rejected for ${payroll.employee.firstName} ${payroll.employee.lastName}`,
              approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
              remarks: remarks || "Payroll rejected",
            },
          });

          // Send notification to employee
          await NotificationService.createPayrollNotification(
            payroll.employee._id,
            NOTIFICATION_TYPES.PAYROLL_REJECTED,
            payroll,
            remarks
          );

          return payroll;
        })
      );

      // Log batch operation for selected rejections
      await PayrollStatisticsLogger.logBatchOperation(
        "SELECTED_REJECTION",
        updatedPayrolls.map((p) => p._id),
        req.user._id,
        {
          payrollIds,
          rejectedCount: updatedPayrolls.length,
          remarks: remarks || "Selected payrolls rejected",
          message: `Rejected ${updatedPayrolls.length} selected payrolls`,
          approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
          createdBy: req.user._id,
          position: req.user.position,
          role: req.user.role,
        }
      );

      // Group payrolls by department for notifications
      const payrollsByDepartment = {};
      updatedPayrolls.forEach((payroll) => {
        if (!payrollsByDepartment[payroll.department._id]) {
          payrollsByDepartment[payroll.department._id] = [];
        }
        payrollsByDepartment[payroll.department._id].push(payroll);
      });

      // Send notifications to department admins
      for (const [departmentId, departmentPayrolls] of Object.entries(
        payrollsByDepartment
      )) {
        await NotificationService.createPayrollNotification(
          departmentPayrolls[0].createdBy,
          NOTIFICATION_TYPES.SELECTED_PAYROLLS_REJECTED,
          {
            month: departmentPayrolls[0].month,
            year: departmentPayrolls[0].year,
            department: departmentId,
            count: departmentPayrolls.length,
          },
          remarks
        );
      }

      res.status(200).json({
        success: true,
        message: "Selected payrolls rejected successfully",
        data: {
          rejected: updatedPayrolls.length,
          payrolls: updatedPayrolls,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async processSingleEmployeePayroll(req, res, next) {
    try {
      console.log(
        "🔄 Starting single employee payroll processing (Super Admin)"
      );
      console.log("📝 Request data:", JSON.stringify(req.body, null, 2));

      const { employeeId, departmentId, month, year, frequency } = req.body;

      // Standardized summary object
      const processingSummary = {
        totalAttempted: 1,
        processed: 0,
        skipped: 0,
        failed: 0,
        errors: [],
        warnings: [],
        details: {
          month,
          year,
          frequency,
          processingTime: null,
          totalNetPay: 0,
          departmentBreakdown: {},
          employeeDetails: [],
        },
      };

      const startTime = Date.now();

      // Get super admin with full details
      const superAdmin = await UserModel.findById(req.user.id)
        .populate("department", "name code")
        .select("+position +role +department");

      if (!superAdmin) {
        const error = "Super Admin not found";
        processingSummary.failed = 1;
        processingSummary.errors.push({
          type: "AUTHENTICATION_ERROR",
          message: error,
          code: "SUPER_ADMIN_NOT_FOUND",
        });

        console.error(`❌ ${error}`);
        return res.status(404).json({
          success: false,
          message: error,
          summary: processingSummary,
        });
      }

      // Validate department access
      if (!departmentId) {
        const error = "No department specified";
        processingSummary.failed = 1;
        processingSummary.errors.push({
          type: "VALIDATION_ERROR",
          message: error,
          code: "MISSING_DEPARTMENT",
        });

        console.error(`❌ ${error}`);
        return res.status(400).json({
          success: false,
          message: error,
          summary: processingSummary,
        });
      }

      // Get employee with proper department check
      const employee = await UserModel.findOne({
        _id: employeeId,
        department: departmentId,
        status: "active",
      }).populate("department", "name code");

      if (!employee) {
        const error = "Employee not found or not active";
        processingSummary.failed = 1;
        processingSummary.errors.push({
          type: "EMPLOYEE_ERROR",
          message: error,
          code: "EMPLOYEE_NOT_FOUND_OR_INACTIVE",
          employeeId,
          departmentId,
        });

        console.error(`❌ ${error}`);
        return res.status(404).json({
          success: false,
          message: error,
          summary: processingSummary,
        });
      }

      // Get the employee's salary grade based on their grade level
      if (!employee.gradeLevel) {
        const error = "Employee does not have a grade level assigned";
        processingSummary.failed = 1;
        processingSummary.errors.push({
          type: "GRADE_ERROR",
          message: error,
          code: "NO_GRADE_LEVEL",
          employeeId,
          employeeName: `${employee.firstName} ${employee.lastName}`,
        });

        processingSummary.details.employeeDetails.push({
          status: "failed",
          name: `${employee.firstName} ${employee.lastName}`,
          employeeId: employee._id,
          employeeCode: employee.employeeId,
          reason: error,
          department: employee.department._id,
          departmentName: employee.department.name,
          netPay: 0,
          grossPay: 0,
          totalDeductions: 0,
        });

        console.error(
          `❌ ${error} for employee: ${employee.firstName} ${employee.lastName}`
        );
        return res.status(400).json({
          success: false,
          message: error,
          summary: processingSummary,
        });
      }

      // Find the corresponding salary grade
      const salaryGrade = await SalaryGrade.findOne({
        level: employee.gradeLevel,
        isActive: true,
      });

      if (!salaryGrade) {
        const error = `No active salary grade found for level ${employee.gradeLevel}`;
        processingSummary.failed = 1;
        processingSummary.errors.push({
          type: "GRADE_ERROR",
          message: error,
          code: "NO_ACTIVE_SALARY_GRADE",
          employeeId,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          gradeLevel: employee.gradeLevel,
        });

        processingSummary.details.employeeDetails.push({
          status: "failed",
          name: `${employee.firstName} ${employee.lastName}`,
          employeeId: employee._id,
          employeeCode: employee.employeeId,
          reason: error,
          department: employee.department._id,
          departmentName: employee.department.name,
          netPay: 0,
          grossPay: 0,
          totalDeductions: 0,
        });

        console.error(
          `❌ ${error} for employee: ${employee.firstName} ${employee.lastName}`
        );
        return res.status(400).json({
          success: false,
          message: error,
          summary: processingSummary,
        });
      }

      // Check for existing payroll
      const existingPayroll = await PayrollModel.findOne({
        employee: employeeId,
        month,
        year,
        frequency,
      });

      if (existingPayroll) {
        const error = "Payroll already exists for this period";
        processingSummary.skipped = 1;
        processingSummary.warnings.push({
          type: "DUPLICATE_PAYROLL",
          message: error,
          code: "PAYROLL_ALREADY_EXISTS",
          employeeId,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          existingPayrollId: existingPayroll._id,
          period: `${month}/${year} (${frequency})`,
        });

        processingSummary.details.employeeDetails.push({
          status: "skipped",
          name: `${employee.firstName} ${employee.lastName}`,
          employeeId: employee._id,
          employeeCode: employee.employeeId,
          reason: error,
          department: employee.department._id,
          departmentName: employee.department.name,
          netPay: 0,
          grossPay: 0,
          totalDeductions: 0,
        });

        console.warn(
          `⚠️ ${error} for employee: ${employee.firstName} ${employee.lastName}`
        );
        return res.status(400).json({
          success: false,
          message: error,
          summary: processingSummary,
        });
      }

      // Calculate payroll using PayrollService
      console.log(
        `🧮 Calculating payroll for employee: ${employee.firstName} ${employee.lastName}`
      );
      const payrollData = await PayrollService.calculatePayroll(
        employeeId,
        salaryGrade._id,
        month,
        year,
        frequency,
        departmentId
      );

      if (!payrollData) {
        const error = "Failed to calculate payroll";
        processingSummary.failed = 1;
        processingSummary.errors.push({
          type: "CALCULATION_ERROR",
          message: error,
          code: "PAYROLL_CALCULATION_FAILED",
          employeeId,
          employeeName: `${employee.firstName} ${employee.lastName}`,
        });

        processingSummary.details.employeeDetails.push({
          status: "failed",
          name: `${employee.firstName} ${employee.lastName}`,
          employeeId: employee._id,
          employeeCode: employee.employeeId,
          reason: error,
          department: employee.department._id,
          departmentName: employee.department.name,
          netPay: 0,
          grossPay: 0,
          totalDeductions: 0,
        });

        console.error(
          `❌ ${error} for employee: ${employee.firstName} ${employee.lastName}`
        );
        return res.status(400).json({
          success: false,
          message: error,
          summary: processingSummary,
        });
      }

      // Validate pay period settings
      const payPeriodValidation =
        await PayrollService.validatePayPeriodSettings(
          null, // Will be fetched from system settings
          frequency
        );

      console.log(
        "🔍 Pay period validation for single employee payroll:",
        payPeriodValidation
      );

      if (!payPeriodValidation.isValidFrequency) {
        processingSummary.warnings.push({
          type: "FREQUENCY_WARNING",
          message: payPeriodValidation.recommendedAction,
          code: "INVALID_FREQUENCY",
          frequency,
        });
        console.warn(
          "⚠️ Invalid frequency detected:",
          payPeriodValidation.recommendedAction
        );
      }

      if (!payPeriodValidation.isSystemConsistent) {
        processingSummary.warnings.push({
          type: "SYSTEM_WARNING",
          message: payPeriodValidation.recommendedAction,
          code: "SYSTEM_INCONSISTENCY",
        });
        console.warn(
          "⚠️ System inconsistency detected:",
          payPeriodValidation.recommendedAction
        );
      }

      // Get department name for logging
      const department = await DepartmentModel.findById(departmentId).select(
        "name"
      );
      const departmentName = department?.name || "Unknown Department";

      // Create payroll record with APPROVED status since Super Admin is bypassing approval
      console.log(
        `💾 Creating payroll record for employee: ${employee.firstName} ${employee.lastName}`
      );
      const payroll = await PayrollModel.create({
        ...payrollData,
        employee: employeeId,
        department: departmentId,
        status: PAYROLL_STATUS.APPROVED,
        processedBy: superAdmin._id,
        createdBy: superAdmin._id,
        updatedBy: superAdmin._id,
        payment: {
          accountName: "Pending",
          accountNumber: "Pending",
          bankName: "Pending",
        },
        approvalFlow: {
          currentLevel: APPROVAL_LEVELS.SUPER_ADMIN,
          history: [
            {
              level: APPROVAL_LEVELS.SUPER_ADMIN,
              status: "APPROVED",
              action: "APPROVE",
              user: superAdmin._id,
              timestamp: new Date(),
              remarks: "Payroll created and approved by Super Admin",
            },
          ],
          submittedBy: superAdmin._id,
          submittedAt: new Date(),
          status: "APPROVED",
        },
      });

      // Calculate processing time
      const processingTime = Date.now() - startTime;

      // Update summary with success details
      processingSummary.processed = 1;
      processingSummary.details.processingTime = processingTime;
      processingSummary.details.totalNetPay = payroll.totals?.netPay || 0;

      // Department breakdown
      processingSummary.details.departmentBreakdown[departmentName] = {
        count: 1,
        totalNetPay: payroll.totals?.netPay || 0,
        employees: [
          {
            name: `${employee.firstName} ${employee.lastName}`,
            employeeCode: employee.employeeId,
            netPay: payroll.totals?.netPay,
          },
        ],
      };

      // Employee details - FIXED VERSION
      processingSummary.details.employeeDetails.push({
        status: "success",
        name: `${employee.firstName} ${employee.lastName}`,
        employeeId: employee._id,
        employeeCode: employee.employeeId,
        netPay: payroll.totals?.netPay,
        grossPay: payroll.totals?.grossEarnings,
        totalDeductions: payroll.totals?.totalDeductions,
        department: employee.department._id,
        departmentName: employee.department.name,
        payrollId: payroll._id,
      });

      console.log(
        `✅ Payroll created successfully for employee: ${employee.firstName} ${employee.lastName}`
      );
      console.log(`💰 Net Pay: ₦${payroll.totals?.netPay?.toLocaleString()}`);
      console.log(`⏱️ Processing time: ${processingTime}ms`);

      // SAVE SUMMARY TO DATABASE - NEW ADDITION
      const summaryData = {
        batchId: `BATCH_SINGLE_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        processedBy: superAdmin._id,
        department: departmentId,
        month,
        year,
        frequency,
        processingTime: processingTime,
        totalAttempted: 1,
        processed: 1,
        skipped: 0,
        failed: 0,
        totalNetPay: payroll.totals?.netPay || 0,
        totalGrossPay: payroll.totals?.grossEarnings || 0,
        totalDeductions: payroll.totals?.totalDeductions || 0,
        departmentBreakdown: processingSummary.details.departmentBreakdown,
        employeeDetails: processingSummary.details.employeeDetails,
        errors: processingSummary.errors,
        warnings: processingSummary.warnings,
        summaryType: SummaryType.PROCESSING,
        createdBy: superAdmin._id,
      };

      // Save the summary to database
      await PayrollSummaryService.createSummary(summaryData);
      console.log(
        "💾 Payroll summary saved to database with batch ID:",
        summaryData.batchId
      );

      // Audit logging
      await PayrollStatisticsLogger.logPayrollAction({
        action: "CREATE",
        payrollId: payroll._id,
        userId: superAdmin._id,
        status: PAYROLL_STATUS.APPROVED,
        details: {
          employeeId: employee._id,
          departmentId,
          month,
          year,
          frequency,
          netPay: payroll.totals?.netPay,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          departmentName: departmentName,
          createdBy: "SUPER_ADMIN",
          position: superAdmin.position,
          role: superAdmin.role,
          message: `Created and approved payroll for ${employee.firstName} ${employee.lastName}`,
          approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
          remarks: "Payroll created and approved by Super Admin",
          processingTime: processingTime,
        },
      });

      // Notification
      const notificationMessage = `You have successfully created and approved a payroll for ${
        employee.firstName
      } ${employee.lastName} (${
        employee.employeeId
      }) for ${month}/${year}. Net Pay: ₦${payroll.totals?.netPay?.toLocaleString()}`;

      await NotificationService.createNotification(
        superAdmin._id,
        NOTIFICATION_TYPES.PAYROLL_CREATED,
        employee,
        payroll,
        notificationMessage,
        {
          approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
          metadata: {
            payrollId: payroll._id,
            employeeId: employee._id,
            departmentId: employee.department._id,
            status: payroll.status,
            netPay: payroll.totals?.netPay,
            processingTime: processingTime,
          },
        }
      );

      // Set response headers to trigger UI updates
      res.set({
        "X-Refresh-Payrolls": "true",
        "X-Refresh-Audit-Logs": "true",
      });

      console.log(
        `🎉 Single employee payroll processing completed successfully!`
      );
      console.log(`📊 Summary:`, JSON.stringify(processingSummary, null, 2));

      return res.status(201).json({
        success: true,
        data: {
          payroll,
          batchId: summaryData.batchId, // Include batch ID in response
        },
        summary: processingSummary,
      });
    } catch (error) {
      console.error(`❌ Error processing payroll: ${error.message}`);
      console.error("Stack trace:", error.stack);

      // Create error summary
      const errorSummary = {
        totalAttempted: 1,
        processed: 0,
        skipped: 0,
        failed: 1,
        errors: [
          {
            type: "SYSTEM_ERROR",
            message: error.message,
            code: "UNEXPECTED_ERROR",
            stack: error.stack,
          },
        ],
        warnings: [],
        details: {
          month: req.body?.month,
          year: req.body?.year,
          frequency: req.body?.frequency,
          processingTime: null,
          totalNetPay: 0,
          departmentBreakdown: {},
          employeeDetails: [],
        },
      };

      return res.status(500).json({
        success: false,
        message: "An unexpected error occurred while processing payroll",
        summary: errorSummary,
      });
    }
  }

  static async initiatePayment(req, res) {
    try {
      // Handle both single and multiple payrolls
      const { payrollIds } = req.body;
      const { method, bankDetails, notes } = req.body;
      const isBatch = Array.isArray(payrollIds) && payrollIds.length > 1;
      const ids = isBatch ? payrollIds : [req.params.id];

      console.log(
        `🔍 Starting ${
          isBatch ? "batch" : "single"
        } payment initiation for payroll ID(s):`,
        ids
      );
      console.log("👤 Initiator:", req.user.firstName, req.user.lastName);

      // Find all payrolls
      const payrolls = await PayrollModel.find({
        _id: { $in: ids },
      })
        .populate("employee", "firstName lastName")
        .populate("department", "name code");

      if (payrolls.length !== ids.length) {
        throw new ApiError(404, "Some payrolls not found");
      }

      // Validate all payrolls status - ONLY APPROVED status allowed for payment initiation
      const invalidPayrolls = payrolls.filter(
        (payroll) => payroll.status !== PAYROLL_STATUS.APPROVED
      );

      if (invalidPayrolls.length > 0) {
        throw new ApiError(
          400,
          `Some payrolls are not in valid status for payment: ${invalidPayrolls
            .map((p) => p._id)
            .join(", ")}`
        );
      }

      const updatedPayrolls = [];
      const errors = [];

      // Process each payroll
      for (const payroll of payrolls) {
        try {
          const previousStatus = payroll.status;
          const paymentReference = `PAY-${Date.now()}-${payroll._id}`;

          const updatedPayroll = await PayrollModel.findByIdAndUpdate(
            payroll._id,
            {
              status: PAYROLL_STATUS.PENDING_PAYMENT,
              payment: {
                amount: payroll.totalAmount,
                method: method || "BANK_TRANSFER",
                reference: paymentReference,
                bankDetails: bankDetails || {
                  bankName: "Pending",
                  accountNumber: "Pending",
                  accountName: "Pending",
                },
                notes: notes || "Payment initiated",
              },
              approvalFlow: {
                ...payroll.approvalFlow,
                currentLevel: APPROVAL_LEVELS.SUPER_ADMIN,
                history: [
                  ...(payroll.approvalFlow.history || []),
                  {
                    level: APPROVAL_LEVELS.SUPER_ADMIN,
                    status: "APPROVED",
                    user: req.user._id,
                    action: "APPROVE",
                    updatedBy: req.user._id,
                    updatedAt: new Date(),
                    remarks: notes || "Payment initiated",
                  },
                ],
                submittedBy: req.user._id,
                submittedAt: new Date(),
                status: PAYROLL_STATUS.PENDING_PAYMENT,
              },
            },
            { new: true }
          ).populate("employee", "firstName lastName");

          if (!updatedPayroll) {
            throw new Error("Failed to update payroll status");
          }

          // Consolidated audit logging for payment initiation
          await PayrollStatisticsLogger.logPayrollAction({
            action: AuditAction.PAYMENT_PROCESSED,
            payrollId: payroll._id,
            userId: req.user.id,
            status: PAYROLL_STATUS.PENDING_PAYMENT,
            details: {
              previousStatus,
              paymentReference,
              method: method || "BANK_TRANSFER",
              notes: notes || "Payment initiated",
              employeeName: `${updatedPayroll.employee?.firstName} ${updatedPayroll.employee?.lastName}`,
              departmentName: updatedPayroll.department?.name,
              createdBy: req.user.id,
              position: req.user.position,
              role: req.user.role,
              message: `Payment initiated for ${updatedPayroll.employee?.firstName} ${updatedPayroll.employee?.lastName}`,
              approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
              remarks: notes || "Payment initiated",
            },
          });

          updatedPayrolls.push(updatedPayroll);
        } catch (error) {
          errors.push({
            payrollId: payroll._id,
            error: error.message,
          });
        }
      }

      // Log batch operation if multiple payrolls
      if (isBatch && updatedPayrolls.length > 0) {
        await PayrollStatisticsLogger.logBatchOperation(
          "PAYMENT_INITIATION",
          updatedPayrolls.map((p) => p._id),
          req.user.id,
          {
            method: method || "BANK_TRANSFER",
            notes: notes || "Batch payment initiated",
            successCount: updatedPayrolls.length,
            errorCount: errors.length,
            message: `Batch payment initiated for ${updatedPayrolls.length} payrolls`,
            approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
            createdBy: req.user.id,
            position: req.user.position,
            role: req.user.role,
          }
        );
      }

      // Create notifications for each successful update
      for (const updatedPayroll of updatedPayrolls) {
        // Notify super admin
        await NotificationService.createPayrollNotification(
          updatedPayroll,
          NOTIFICATION_TYPES.PAYROLL_PENDING_PAYMENT,
          req.user,
          `Employee ${updatedPayroll.employee.firstName} ${updatedPayroll.employee.lastName}'s payroll is pending payment`
        );

        // Notify accountants
        const accountants = await UserModel.find({ role: "ACCOUNTANT" });
        for (const accountant of accountants) {
          await NotificationService.createPayrollNotification(
            updatedPayroll,
            NOTIFICATION_TYPES.PAYROLL_PENDING_PAYMENT,
            accountant,
            `Employee ${updatedPayroll.employee.firstName} ${updatedPayroll.employee.lastName}'s payroll is pending payment`
          );
        }
      }

      // Return detailed response
      const response = {
        success: errors.length === 0,
        message:
          errors.length === 0
            ? "Batch payment initiation completed"
            : `Batch completed with ${errors.length} error(s)`,
        data: {
          payrolls: updatedPayrolls.map((payroll) => ({
            payrollId: payroll._id,
            status: payroll.status,
            payment: payroll.payment,
          })),
          errors: errors.length > 0 ? errors : undefined,
        },
      };

      console.log(
        "🔵 Backend response structure:",
        JSON.stringify(response, null, 2)
      );

      return res.status(200).json(response);
    } catch (error) {
      console.error("❌ Error in initiatePayment:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to initiate payment",
        error: error.message,
      });
    }
  }

  static async getProcessingStatistics(req, res) {
    try {
      const stats = await PayrollService.getProcessingStatistics();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error getting processing statistics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get processing statistics",
        error: error.message,
      });
    }
  }

  // Process multiple employees payroll
  static async processMultipleEmployeesPayroll(req, res, next) {
    try {
      console.log(
        "🔄 Starting multiple employees payroll processing (Super Admin)"
      );
      console.log("📝 Request data:", JSON.stringify(req.body, null, 2));

      const {
        employeeIds,
        month,
        year,
        frequency = PayrollFrequency.MONTHLY,
      } = req.body;

      // Initialize comprehensive summary object
      const processingSummary = {
        totalAttempted: employeeIds?.length || 0,
        processed: 0,
        skipped: 0,
        failed: 0,
        errors: [],
        warnings: [],
        details: {
          month,
          year,
          frequency,
          processingTime: null,
          totalNetPay: 0,
          departmentBreakdown: {},
          employeeDetails: [],
        },
      };

      const startTime = Date.now();

      // Get super admin details
      const superAdmin = await UserModel.findById(req.user.id)
        .populate("department", "name code")
        .select("+position +role +department");

      if (!superAdmin) {
        const error = "Super Admin not found";
        processingSummary.failed = processingSummary.totalAttempted;
        processingSummary.errors.push({
          type: "AUTHENTICATION_ERROR",
          message: error,
          code: "SUPER_ADMIN_NOT_FOUND",
        });

        console.error(`❌ ${error}`);
        return res.status(404).json({
          success: false,
          message: error,
          summary: processingSummary,
        });
      }

      // Validate input
      if (
        !employeeIds ||
        !Array.isArray(employeeIds) ||
        employeeIds.length === 0
      ) {
        const error = "No employee IDs provided or invalid format";
        processingSummary.errors.push({
          type: "VALIDATION_ERROR",
          message: error,
          code: "INVALID_EMPLOYEE_IDS",
        });

        console.error(`❌ ${error}`);
        return res.status(400).json({
          success: false,
          message: error,
          summary: processingSummary,
        });
      }

      // Validate pay period settings for bulk processing
      const payPeriodValidation =
        await PayrollService.validatePayPeriodSettings(
          null, // Will be fetched from system settings
          frequency
        );

      console.log(
        "🔍 Pay period validation for bulk payroll processing:",
        payPeriodValidation
      );

      if (!payPeriodValidation.isValidFrequency) {
        processingSummary.warnings.push({
          type: "FREQUENCY_WARNING",
          message: payPeriodValidation.recommendedAction,
          code: "INVALID_FREQUENCY",
          frequency,
        });
        console.warn(
          "⚠️ Invalid frequency detected:",
          payPeriodValidation.recommendedAction
        );
      }

      if (!payPeriodValidation.isSystemConsistent) {
        processingSummary.warnings.push({
          type: "SYSTEM_WARNING",
          message: payPeriodValidation.recommendedAction,
          code: "SYSTEM_INCONSISTENCY",
        });
        console.warn(
          "⚠️ System inconsistency detected:",
          payPeriodValidation.recommendedAction
        );
      }

      // Process each employee
      const results = {
        total: employeeIds.length,
        processed: 0,
        skipped: 0,
        failed: 0,
        successful: [],
        failedEmployees: [],
        skippedEmployees: [],
      };

      // Get all employees with their departments and salary grades
      const employees = await UserModel.find({
        _id: { $in: employeeIds },
        status: "active",
      })
        .populate("department", "name code")
        .lean();

      console.log(`👥 Found ${employees.length} active employees to process`);

      // Group employees by department for better organization
      const employeesByDepartment = {};
      employees.forEach((emp) => {
        const deptName = emp.department?.name || "Unknown Department";
        if (!employeesByDepartment[deptName]) {
          employeesByDepartment[deptName] = [];
        }
        employeesByDepartment[deptName].push(emp);
      });

      // Process employees by department
      for (const [departmentName, deptEmployees] of Object.entries(
        employeesByDepartment
      )) {
        console.log(`🏢 Processing department: ${departmentName}`);

        for (const employee of deptEmployees) {
          try {
            console.log(
              `👤 Processing employee: ${employee.firstName} ${employee.lastName} (${employee.employeeId})`
            );

            // Check for existing payroll
            const existingPayroll = await PayrollModel.findOne({
              employee: employee._id,
              month,
              year,
              frequency,
            });

            if (existingPayroll) {
              console.warn(
                `⚠️ Payroll already exists for ${employee.firstName} ${employee.lastName}`
              );
              results.skipped++;
              results.skippedEmployees.push({
                employeeId: employee._id,
                employeeName: `${employee.firstName} ${employee.lastName}`,
                employeeCode: employee.employeeId,
                reason: "Payroll already exists for this period",
                existingPayrollId: existingPayroll._id,
                department: employee.department._id,
                departmentName: employee.department.name,
              });
              continue;
            }

            // Get employee's salary grade
            if (!employee.gradeLevel) {
              console.error(
                `❌ No grade level for employee: ${employee.firstName} ${employee.lastName}`
              );
              results.failed++;
              results.failedEmployees.push({
                employeeId: employee._id,
                employeeName: `${employee.firstName} ${employee.lastName}`,
                employeeCode: employee.employeeId,
                reason: "No grade level assigned",
                department: employee.department._id,
                departmentName: employee.department.name,
              });
              continue;
            }

            const salaryGrade = await SalaryGrade.findOne({
              level: employee.gradeLevel,
              isActive: true,
            });

            if (!salaryGrade) {
              console.error(
                `❌ No active salary grade for level ${employee.gradeLevel}`
              );
              results.failed++;
              results.failedEmployees.push({
                employeeId: employee._id,
                employeeName: `${employee.firstName} ${employee.lastName}`,
                employeeCode: employee.employeeId,
                reason: `No active salary grade for level ${employee.gradeLevel}`,
                department: employee.department._id,
                departmentName: employee.department.name,
              });
              continue;
            }

            // Calculate payroll
            const payrollData = await PayrollService.calculatePayroll(
              employee._id,
              salaryGrade._id,
              month,
              year,
              frequency,
              employee.department._id
            );

            if (!payrollData) {
              console.error(
                `❌ Failed to calculate payroll for ${employee.firstName} ${employee.lastName}`
              );
              results.failed++;
              results.failedEmployees.push({
                employeeId: employee._id,
                employeeName: `${employee.firstName} ${employee.lastName}`,
                employeeCode: employee.employeeId,
                reason: "Payroll calculation failed",
                department: employee.department._id,
                departmentName: employee.department.name,
              });
              continue;
            }

            // Create payroll record
            const payroll = await PayrollModel.create({
              ...payrollData,
              employee: employee._id,
              department: employee.department._id,
              status: PAYROLL_STATUS.APPROVED,
              processedBy: superAdmin._id,
              createdBy: superAdmin._id,
              updatedBy: superAdmin._id,
              payment: {
                accountName: "Pending",
                accountNumber: "Pending",
                bankName: "Pending",
              },
              approvalFlow: {
                currentLevel: APPROVAL_LEVELS.SUPER_ADMIN,
                history: [
                  {
                    level: APPROVAL_LEVELS.SUPER_ADMIN,
                    status: "APPROVED",
                    action: "APPROVE",
                    user: superAdmin._id,
                    timestamp: new Date(),
                    remarks: "Payroll created and approved by Super Admin",
                  },
                ],
                submittedBy: superAdmin._id,
                submittedAt: new Date(),
                status: "APPROVED",
              },
            });

            console.log(
              `✅ Payroll created for ${employee.firstName} ${employee.lastName}`
            );

            results.processed++;
            results.successful.push({
              employeeId: employee._id,
              employeeName: `${employee.firstName} ${employee.lastName}`,
              employeeCode: employee.employeeId,
              payrollId: payroll._id,
              payroll: payroll,
              netPay: payroll.totals?.netPay,
              grossPay: payroll.totals?.grossEarnings,
              totalDeductions: payroll.totals?.totalDeductions,
              department: employee.department._id,
              departmentName: employee.department.name,
            });

            // Update department breakdown
            if (
              !processingSummary.details.departmentBreakdown[departmentName]
            ) {
              processingSummary.details.departmentBreakdown[departmentName] = {
                count: 0,
                totalNetPay: 0,
                employees: [],
              };
            }
            processingSummary.details.departmentBreakdown[departmentName]
              .count++;
            processingSummary.details.departmentBreakdown[
              departmentName
            ].totalNetPay += payroll.totals?.netPay || 0;
            processingSummary.details.departmentBreakdown[
              departmentName
            ].employees.push({
              name: `${employee.firstName} ${employee.lastName}`,
              employeeCode: employee.employeeId,
              netPay: payroll.totals?.netPay,
            });
          } catch (error) {
            console.error(
              `❌ Error processing employee ${employee.firstName} ${employee.lastName}:`,
              error.message
            );
            results.failed++;
            results.failedEmployees.push({
              employeeId: employee._id,
              employeeName: `${employee.firstName} ${employee.lastName}`,
              employeeCode: employee.employeeId,
              reason: error.message,
              department: employee.department._id,
              departmentName: employee.department.name,
            });
          }
        }
      }

      // Calculate processing time
      const processingTime = Date.now() - startTime;
      processingSummary.details.processingTime = processingTime;
      results.processingTime = processingTime;

      // Update summary totals
      processingSummary.processed = results.processed;
      processingSummary.skipped = results.skipped;
      processingSummary.failed = results.failed;
      processingSummary.details.totalNetPay = results.successful.reduce(
        (sum, emp) => sum + (emp.netPay || 0),
        0
      );

      // Add employee details to summary - FIXED VERSION
      processingSummary.details.employeeDetails = [
        ...results.successful.map((emp) => ({
          status: "success",
          name: emp.employeeName,
          employeeId: emp.employeeId,
          employeeCode: emp.employeeCode,
          netPay: emp.netPay,
          grossPay: emp.grossPay,
          totalDeductions: emp.totalDeductions,
          department: emp.department,
          departmentName: emp.departmentName,
          payrollId: emp.payrollId,
        })),
        ...results.skippedEmployees.map((emp) => ({
          status: "skipped",
          name: emp.employeeName,
          employeeId: emp.employeeId,
          employeeCode: emp.employeeCode,
          reason: emp.reason,
          department: emp.department,
          departmentName: emp.departmentName,
          netPay: 0,
          grossPay: 0,
          totalDeductions: 0,
        })),
        ...results.failedEmployees.map((emp) => ({
          status: "failed",
          name: emp.employeeName,
          employeeId: emp.employeeId,
          employeeCode: emp.employeeCode,
          reason: emp.reason,
          department: emp.department,
          departmentName: emp.departmentName,
          netPay: 0,
          grossPay: 0,
          totalDeductions: 0,
        })),
      ];

      console.log("�� Processing Results:", {
        total: results.total,
        processed: results.processed,
        skipped: results.skipped,
        failed: results.failed,
        processingTime: `${processingTime}ms`,
      });

      // SAVE SUMMARY TO DATABASE - NEW ADDITION
      const summaryData = {
        batchId: `BATCH_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        processedBy: superAdmin._id,
        department: req.body.departmentId || null,
        month,
        year,
        frequency,
        processingTime: processingTime,
        totalAttempted: results.total,
        processed: results.processed,
        skipped: results.skipped,
        failed: results.failed,
        totalNetPay: results.successful.reduce(
          (sum, emp) => sum + (emp.netPay || 0),
          0
        ),
        totalGrossPay: results.successful.reduce(
          (sum, emp) => sum + (emp.grossPay || 0),
          0
        ),
        totalDeductions: results.successful.reduce(
          (sum, emp) => sum + (emp.totalDeductions || 0),
          0
        ),
        departmentBreakdown: processingSummary.details.departmentBreakdown,
        employeeDetails: processingSummary.details.employeeDetails,
        errors: processingSummary.errors,
        warnings: processingSummary.warnings,
        summaryType: SummaryType.PROCESSING,
        createdBy: superAdmin._id,
      };

      // Save the summary to database
      await PayrollSummaryService.createSummary(summaryData);
      console.log(
        "💾 Payroll summary saved to database with batch ID:",
        summaryData.batchId
      );

      // Log batch operation with processing time
      if (results.processed > 0) {
        await PayrollStatisticsLogger.logBatchOperation(
          "PROCESS_MULTIPLE_EMPLOYEES",
          results.successful.map((s) => s.payrollId),
          superAdmin._id,
          {
            month,
            year,
            frequency,
            totalEmployees: results.total,
            processedCount: results.processed,
            skippedCount: results.skipped,
            failedCount: results.failed,
            totalAmount: results.successful.reduce(
              (sum, emp) => sum + (emp.netPay || 0),
              0
            ),
            processingTime: processingTime, // Add processing time
            remarks: `Processed ${results.processed} payrolls for ${month}/${year}`,
          }
        );
      }

      // Create a SINGLE consolidated notification for the Super Admin
      const notificationMessage = `You have successfully processed ${
        results.processed
      } payrolls for ${month}/${year}. ${
        results.skipped > 0 ? `${results.skipped} were skipped. ` : ""
      }${
        results.failed > 0 ? `${results.failed} failed. ` : ""
      }Total amount: ₦${processingSummary.details.totalNetPay.toLocaleString()}`;

      await NotificationService.createNotification(
        superAdmin._id,
        NOTIFICATION_TYPES.BULK_PAYROLL_PROCESSED,
        null, // No specific employee for batch operation
        null, // No specific payroll for batch operation
        notificationMessage,
        {
          approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
          metadata: {
            month,
            year,
            frequency,
            totalEmployees: results.total,
            processedCount: results.processed,
            skippedCount: results.skipped,
            failedCount: results.failed,
            totalAmount: processingSummary.details.totalNetPay,
            processingTime: processingTime,
            departmentBreakdown: processingSummary.details.departmentBreakdown,
            employeeDetails: processingSummary.details.employeeDetails,
            message: notificationMessage,
          },
        }
      );

      // Set response headers to trigger UI updates
      res.set({
        "X-Refresh-Payrolls": "true",
        "X-Refresh-Audit-Logs": "true",
      });

      console.log(
        `✅ Multiple employees payroll processing completed successfully!`
      );
      console.log(`📊 Summary:`, JSON.stringify(processingSummary, null, 2));

      return res.status(201).json({
        success: true,
        // message: `Successfully processed ${results.processed} payrolls for ${month}/${year}`,
        data: {
          processed: results.processed,
          skipped: results.skipped,
          failed: results.failed,
          total: results.total,
          processingTime: processingTime,
          batchId: summaryData.batchId, // Include batch ID in response
        },
        summary: processingSummary,
      });
    } catch (error) {
      console.error(
        `❌ Error processing multiple employees payroll: ${error.message}`
      );
      console.error("Stack trace:", error.stack);

      // Create error summary
      const errorSummary = {
        totalAttempted: req.body?.employeeIds?.length || 0,
        processed: 0,
        skipped: 0,
        failed: req.body?.employeeIds?.length || 0,
        errors: [
          {
            type: "SYSTEM_ERROR",
            message: error.message,
            code: "UNEXPECTED_ERROR",
            stack: error.stack,
          },
        ],
        warnings: [],
        details: {
          month: req.body?.month,
          year: req.body?.year,
          frequency: req.body?.frequency,
          processingTime: null,
          totalNetPay: 0,
          departmentBreakdown: {},
          employeeDetails: [],
        },
      };

      return res.status(500).json({
        success: false,
        message: "An unexpected error occurred while processing payrolls",
        summary: errorSummary,
      });
    }
  }

  // Process payroll for all active employees
  static async processAllEmployeesPayroll(req, res, next) {
    try {
      console.log("🔄 Starting all employees payroll processing (Super Admin)");
      console.log("📝 Request data:", JSON.stringify(req.body, null, 2));

      const { month, year, frequency = PayrollFrequency.MONTHLY } = req.body;

      // Standardized summary object
      const processingSummary = {
        totalAttempted: 0,
        processed: 0,
        skipped: 0,
        failed: 0,
        errors: [],
        warnings: [],
        details: {
          month,
          year,
          frequency,
          processingTime: null,
          totalNetPay: 0,
          departmentBreakdown: {},
          employeeDetails: [],
        },
      };

      const startTime = Date.now();

      // Get super admin details
      const superAdmin = await UserModel.findById(req.user.id)
        .populate("department", "name code")
        .select("+position +role +department");

      if (!superAdmin) {
        const error = "Super Admin not found";
        processingSummary.errors.push({
          type: "AUTHENTICATION_ERROR",
          message: error,
          code: "SUPER_ADMIN_NOT_FOUND",
        });

        console.error(`❌ ${error}`);
        return res.status(404).json({
          success: false,
          message: error,
          summary: processingSummary,
        });
      }

      // Validate pay period settings for bulk processing
      const payPeriodValidation =
        await PayrollService.validatePayPeriodSettings(
          null, // Will be fetched from system settings
          frequency
        );

      console.log(
        "🔍 Pay period validation for all employees processing:",
        payPeriodValidation
      );

      if (!payPeriodValidation.isValidFrequency) {
        processingSummary.warnings.push({
          type: "FREQUENCY_WARNING",
          message: payPeriodValidation.recommendedAction,
          code: "INVALID_FREQUENCY",
          frequency,
        });
        console.warn(
          "⚠️ Invalid frequency detected:",
          payPeriodValidation.recommendedAction
        );
      }

      if (!payPeriodValidation.isSystemConsistent) {
        processingSummary.warnings.push({
          type: "SYSTEM_WARNING",
          message: payPeriodValidation.recommendedAction,
          code: "SYSTEM_INCONSISTENCY",
        });
        console.warn(
          "⚠️ System inconsistency detected:",
          payPeriodValidation.recommendedAction
        );
      }

      // Get all active employees
      console.log("🔍 Fetching all active employees...");
      const employees = await UserModel.find({
        status: "active",
      }).populate("department");

      if (!employees || employees.length === 0) {
        const error = "No active employees found";
        processingSummary.errors.push({
          type: "DATA_ERROR",
          message: error,
          code: "NO_ACTIVE_EMPLOYEES",
        });

        console.error(`❌ ${error}`);
        return res.status(404).json({
          success: false,
          message: error,
          summary: processingSummary,
        });
      }

      processingSummary.totalAttempted = employees.length;
      console.log(`✅ Found ${employees.length} active employees`);

      const results = {
        total: employees.length,
        processed: 0,
        skipped: 0,
        failed: 0,
        successful: [],
        failedEmployees: [],
        skippedEmployees: [],
      };

      // Process each employee with individual error handling
      for (let i = 0; i < employees.length; i++) {
        const employee = employees[i];
        const employeeIndex = i + 1;

        try {
          console.log(
            `\n🔄 Processing employee ${employeeIndex}/${employees.length}: ${employee.firstName} ${employee.lastName} (${employee.employeeId})`
          );

          // Check for existing payroll
          const existingPayroll = await PayrollModel.findOne({
            employee: employee._id,
            month,
            year,
            frequency,
          });

          if (existingPayroll) {
            const warning = `${employee.firstName} ${employee.lastName} (${employee.employeeId}): Payroll already exists for ${month}/${year}`;
            console.warn(`⚠️ ${warning}`);

            results.skipped++;
            results.skippedEmployees.push({
              employeeId: employee._id,
              employeeName: `${employee.firstName} ${employee.lastName}`,
              employeeCode: employee.employeeId,
              reason: "Payroll already exists for this period",
              existingPayrollId: existingPayroll._id,
              department: employee.department?._id,
              departmentName: employee.department?.name,
            });
            processingSummary.warnings.push({
              type: "DUPLICATE_PAYROLL",
              message: warning,
              code: "PAYROLL_ALREADY_EXISTS",
              employeeId: employee._id,
              employeeName: `${employee.firstName} ${employee.lastName}`,
              period: `${month}/${year} (${frequency})`,
            });
            continue;
          }

          // Get employee's salary grade
          if (!employee.gradeLevel) {
            const error = `${employee.firstName} ${employee.lastName} (${employee.employeeId}): No grade level assigned`;
            console.error(`❌ ${error}`);

            results.failed++;
            results.failedEmployees.push({
              employeeId: employee._id,
              employeeName: `${employee.firstName} ${employee.lastName}`,
              employeeCode: employee.employeeId,
              reason: "No grade level assigned",
              department: employee.department?._id,
              departmentName: employee.department?.name,
            });
            processingSummary.errors.push({
              type: "GRADE_ERROR",
              message: error,
              code: "NO_GRADE_LEVEL",
              employeeId: employee._id,
              employeeName: `${employee.firstName} ${employee.lastName}`,
            });
            continue;
          }

          const salaryGrade = await SalaryGrade.findOne({
            level: employee.gradeLevel,
            isActive: true,
          });

          if (!salaryGrade) {
            const error = `${employee.firstName} ${employee.lastName} (${employee.employeeId}): No active salary grade found for level ${employee.gradeLevel}`;
            console.error(`❌ ${error}`);

            results.failed++;
            results.failedEmployees.push({
              employeeId: employee._id,
              employeeName: `${employee.firstName} ${employee.lastName}`,
              employeeCode: employee.employeeId,
              reason: `No active salary grade for level ${employee.gradeLevel}`,
              department: employee.department?._id,
              departmentName: employee.department?.name,
            });
            processingSummary.errors.push({
              type: "GRADE_ERROR",
              message: error,
              code: "NO_ACTIVE_SALARY_GRADE",
              employeeId: employee._id,
              employeeName: `${employee.firstName} ${employee.lastName}`,
              gradeLevel: employee.gradeLevel,
            });
            continue;
          }

          // Calculate payroll
          console.log(
            `🧮 Calculating payroll for ${employee.firstName} ${employee.lastName} (${employee.employeeId})`
          );
          console.log(
            `📋 Department: ${employee.department?.name || "Unknown"} (${
              employee.department?._id || "N/A"
            })`
          );

          const payrollData = await PayrollService.calculatePayroll(
            employee._id,
            salaryGrade._id,
            month,
            year,
            frequency,
            employee.department?._id
          );

          if (!payrollData) {
            const error = `${employee.firstName} ${employee.lastName} (${employee.employeeId}): Failed to calculate payroll`;
            console.error(`❌ ${error}`);

            results.failed++;
            results.failedEmployees.push({
              employeeId: employee._id,
              employeeName: `${employee.firstName} ${employee.lastName}`,
              employeeCode: employee.employeeId,
              reason: "Payroll calculation failed",
              department: employee.department?._id,
              departmentName: employee.department?.name,
            });
            processingSummary.errors.push({
              type: "CALCULATION_ERROR",
              message: error,
              code: "PAYROLL_CALCULATION_FAILED",
              employeeId: employee._id,
              employeeName: `${employee.firstName} ${employee.lastName}`,
            });
            continue;
          }

          // Create payroll record with APPROVED status
          const payroll = await PayrollModel.create({
            ...payrollData,
            employee: employee._id,
            department: employee.department?._id,
            status: PAYROLL_STATUS.APPROVED,
            processedBy: superAdmin._id,
            createdBy: superAdmin._id,
            updatedBy: superAdmin._id,
            payment: {
              accountName: "Pending",
              accountNumber: "Pending",
              bankName: "Pending",
            },
            approvalFlow: {
              currentLevel: APPROVAL_LEVELS.SUPER_ADMIN,
              history: [
                {
                  level: APPROVAL_LEVELS.SUPER_ADMIN,
                  status: "APPROVED",
                  action: "APPROVE",
                  user: superAdmin._id,
                  timestamp: new Date(),
                  remarks: "Payroll created and approved by Super Admin",
                },
              ],
              submittedBy: superAdmin._id,
              submittedAt: new Date(),
              status: "APPROVED",
            },
          });

          results.processed++;
          results.successful.push({
            employeeId: employee._id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            employeeCode: employee.employeeId,
            payrollId: payroll._id,
            payroll: payroll,
            netPay: payroll.totals?.netPay,
            grossPay: payroll.totals?.grossEarnings,
            totalDeductions: payroll.totals?.totalDeductions,
            department: employee.department?._id,
            departmentName: employee.department?.name,
          });

          // Update department breakdown
          const deptName = employee.department?.name || "Unknown";
          if (!processingSummary.details.departmentBreakdown[deptName]) {
            processingSummary.details.departmentBreakdown[deptName] = {
              count: 0,
              totalNetPay: 0,
              employees: [],
            };
          }
          processingSummary.details.departmentBreakdown[deptName].count++;
          processingSummary.details.departmentBreakdown[deptName].totalNetPay +=
            payroll.totals?.netPay || 0;
          processingSummary.details.departmentBreakdown[
            deptName
          ].employees.push({
            name: `${employee.firstName} ${employee.lastName}`,
            employeeCode: employee.employeeId,
            netPay: payroll.totals?.netPay,
          });

          // Audit logging
          await PayrollStatisticsLogger.logPayrollAction({
            action: AuditAction.CREATE,
            payrollId: payroll._id,
            userId: superAdmin._id,
            status: PAYROLL_STATUS.APPROVED,
            details: {
              employeeId: employee._id,
              departmentId: employee.department?._id,
              month,
              year,
              frequency,
              netPay: payroll.totals?.netPay,
              employeeName: `${employee.firstName} ${employee.lastName}`,
              departmentName: employee.department?.name,
              createdBy: superAdmin._id,
              position: superAdmin.position,
              role: superAdmin.role,
              message: `Created and approved payroll for ${employee.firstName} ${employee.lastName}`,
              approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
              remarks: "Payroll created and approved by Super Admin",
            },
          });
        } catch (error) {
          console.error(`❌ Error processing employee ${employee._id}:`, error);
          const errorMessage = `Employee ID ${employee._id}: ${error.message}`;

          results.failed++;
          results.failedEmployees.push({
            employeeId: employee._id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            employeeCode: employee.employeeId,
            reason: error.message,
            department: employee.department?._id,
            departmentName: employee.department?.name,
          });
          processingSummary.errors.push({
            type: "PROCESSING_ERROR",
            message: errorMessage,
            code: "EMPLOYEE_PROCESSING_FAILED",
            employeeId: employee._id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            index: employeeIndex,
            originalError: error.message,
          });
        }
      }

      // Calculate processing time
      const processingTime = Date.now() - startTime;
      processingSummary.details.processingTime = processingTime;
      results.processingTime = processingTime;

      // Update summary totals
      processingSummary.processed = results.processed;
      processingSummary.skipped = results.skipped;
      processingSummary.failed = results.failed;
      processingSummary.details.totalNetPay = results.successful.reduce(
        (sum, emp) => sum + (emp.netPay || 0),
        0
      );

      // Add employee details to summary - FIXED VERSION
      processingSummary.details.employeeDetails = [
        ...results.successful.map((emp) => ({
          status: "success",
          name: emp.employeeName,
          employeeId: emp.employeeId,
          employeeCode: emp.employeeCode,
          netPay: emp.netPay,
          grossPay: emp.grossPay,
          totalDeductions: emp.totalDeductions,
          department: emp.department,
          departmentName: emp.departmentName,
          payrollId: emp.payrollId,
        })),
        ...results.skippedEmployees.map((emp) => ({
          status: "skipped",
          name: emp.employeeName,
          employeeId: emp.employeeId,
          employeeCode: emp.employeeCode,
          reason: emp.reason,
          department: emp.department,
          departmentName: emp.departmentName,
          netPay: 0,
          grossPay: 0,
          totalDeductions: 0,
        })),
        ...results.failedEmployees.map((emp) => ({
          status: "failed",
          name: emp.employeeName,
          employeeId: emp.employeeId,
          employeeCode: emp.employeeCode,
          reason: emp.reason,
          department: emp.department,
          departmentName: emp.departmentName,
          netPay: 0,
          grossPay: 0,
          totalDeductions: 0,
        })),
      ];

      console.log(`\n🎉 All employees processing completed!`);
      console.log(
        `📊 Final Summary:`,
        JSON.stringify(processingSummary, null, 2)
      );

      // SAVE SUMMARY TO DATABASE - NEW ADDITION
      const summaryData = {
        batchId: `BATCH_ALL_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        processedBy: superAdmin._id,
        department: null, // All departments for all employees
        month,
        year,
        frequency,
        processingTime: processingTime,
        totalAttempted: results.total,
        processed: results.processed,
        skipped: results.skipped,
        failed: results.failed,
        totalNetPay: results.successful.reduce(
          (sum, emp) => sum + (emp.netPay || 0),
          0
        ),
        totalGrossPay: results.successful.reduce(
          (sum, emp) => sum + (emp.grossPay || 0),
          0
        ),
        totalDeductions: results.successful.reduce(
          (sum, emp) => sum + (emp.totalDeductions || 0),
          0
        ),
        departmentBreakdown: processingSummary.details.departmentBreakdown,
        employeeDetails: processingSummary.details.employeeDetails,
        errors: processingSummary.errors,
        warnings: processingSummary.warnings,
        summaryType: SummaryType.PROCESSING,
        createdBy: superAdmin._id,
      };

      // Save the summary to database
      await PayrollSummaryService.createSummary(summaryData);
      console.log(
        "💾 Payroll summary saved to database with batch ID:",
        summaryData.batchId
      );

      // Create a single audit log for the bulk action with processing time
      if (results.processed > 0) {
        await PayrollStatisticsLogger.logBatchOperation(
          "PROCESS_ALL_EMPLOYEES",
          results.successful.map((s) => s.payrollId),
          superAdmin._id,
          {
            month,
            year,
            frequency,
            totalEmployees: results.total,
            processedCount: results.processed,
            skippedCount: results.skipped,
            failedCount: results.failed,
            totalAmount: results.successful.reduce(
              (sum, emp) => sum + (emp.netPay || 0),
              0
            ),
            processingTime: processingTime,
            remarks: `Processed ${results.processed} payrolls for ${month}/${year}`,
            message: `Created and approved ${results.processed} payrolls for ${month}/${year}`,
            approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
            createdBy: superAdmin._id,
            position: superAdmin.position,
            role: superAdmin.role,
            processedEmployees: results.successful.map(
              (emp) => emp.employeeName
            ),
            skippedEmployees: results.skippedEmployees.map(
              (emp) => emp.employeeName
            ),
            failedEmployees: results.failedEmployees.map(
              (emp) => emp.employeeName
            ),
          }
        );

        // Create department breakdown for notification
        const departmentBreakdown = {};
        results.successful.forEach((result) => {
          const employee = employees.find(
            (emp) => emp._id.toString() === result.employeeId.toString()
          );
          if (employee && employee.department) {
            const deptName = employee.department.name || "Unknown";
            departmentBreakdown[deptName] =
              (departmentBreakdown[deptName] || 0) + 1;
          }
        });

        // Notification metadata
        const notificationMetadata = {
          month,
          year,
          totalEmployees: results.total,
          processedCount: results.processed,
          skippedCount: results.skipped,
          failedCount: results.failed,
          totalAmount: results.successful.reduce(
            (sum, emp) => sum + (emp.netPay || 0),
            0
          ),
          processingTime: processingTime,
          departmentBreakdown: Object.entries(departmentBreakdown).map(
            ([dept, count]) => ({
              department: dept,
              count: count,
            })
          ),
        };

        // Notification message
        const departmentBreakdownMessage = Object.entries(departmentBreakdown)
          .map(([dept, count]) => `${dept}: ${count}`)
          .join(", ");
        const notificationMessage = `You have processed ${results.processed}/${results.total} payrolls for ${month}/${year}. ${results.skipped} skipped, ${results.failed} failed.\n\nDepartment Breakdown:\n${departmentBreakdownMessage}`;

        // Dummy employee and payroll for notification
        const notificationPayroll = {
          _id: new Types.ObjectId(),
          month,
          year,
          status: "APPROVED",
          totals: {
            processed: results.processed,
            skipped: results.skipped,
            failed: results.failed,
          },
          employee: {
            firstName: "All",
            lastName: "Employees",
          },
        };
        const dummyEmployee = {
          _id: new Types.ObjectId(),
          firstName: "All",
          lastName: "Employees",
          email: "bulk@company.com",
          department: {
            name: "All Departments",
            code: "ALL",
          },
        };

        // Notify Super Admin
        await NotificationService.createNotification(
          superAdmin._id,
          NOTIFICATION_TYPES.BULK_PAYROLL_PROCESSED,
          dummyEmployee,
          notificationPayroll,
          notificationMessage,
          {
            approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
            metadata: notificationMetadata,
          }
        );

        // Notify HR Manager
        const hrDepartment = await DepartmentModel.findOne({
          name: { $in: ["Human Resources", "HR"] },
          status: "active",
        });
        if (hrDepartment) {
          const hrManager = await UserModel.findOne({
            department: hrDepartment._id,
            position: {
              $in: [
                "Head of Human Resources",
                "HR Manager",
                "HR Head",
                "Human Resources Manager",
                "HR Director",
              ],
            },
            status: "active",
          });
          if (hrManager) {
            await NotificationService.createNotification(
              hrManager._id,
              NOTIFICATION_TYPES.BULK_PAYROLL_PROCESSED,
              dummyEmployee,
              notificationPayroll,
              `${results.processed} payrolls have been processed and approved by ${superAdmin.firstName} ${superAdmin.lastName} (Super Admin) for ${month}/${year}.`,
              {
                approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
                metadata: notificationMetadata,
              }
            );
          }
        }

        // Notify Finance Director
        const financeDepartment = await DepartmentModel.findOne({
          name: { $in: ["Finance and Accounting", "Finance", "Financial"] },
          status: "active",
        });
        if (financeDepartment) {
          const financeDirector = await UserModel.findOne({
            department: financeDepartment._id,
            position: {
              $in: [
                "Head of Finance",
                "Finance Director",
                "Finance Head",
                "Financial Director",
                "Financial Head",
              ],
            },
            status: "active",
          });
          if (financeDirector) {
            await NotificationService.createNotification(
              financeDirector._id,
              NOTIFICATION_TYPES.BULK_PAYROLL_PROCESSED,
              dummyEmployee,
              notificationPayroll,
              `${results.processed} payrolls have been processed and approved by ${superAdmin.firstName} ${superAdmin.lastName} (Super Admin) for ${month}/${year}.`,
              {
                approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
                metadata: notificationMetadata,
              }
            );
          }
        }
      }

      // Set response headers to trigger UI updates
      res.set({
        "X-Refresh-Payrolls": "true",
        "X-Refresh-Audit-Logs": "true",
      });

      // Send response with detailed results and comprehensive summary
      res.status(200).json({
        success: true,
        data: {
          total: results.total,
          processed: results.processed,
          skipped: results.skipped,
          failed: results.failed,
          processingTime: processingTime,
          batchId: summaryData.batchId, // Include batch ID in response
        },
        summary: processingSummary,
      });
    } catch (error) {
      console.error("❌ Error in processAllEmployeesPayroll:", error);

      // Create comprehensive error summary
      const errorSummary = {
        totalAttempted: 0,
        processed: 0,
        skipped: 0,
        failed: 0,
        errors: [
          {
            type: "SYSTEM_ERROR",
            message: error.message,
            code: "ALL_EMPLOYEES_PROCESSING_FAILED",
            stack: error.stack,
          },
        ],
        warnings: [],
        details: {
          month: req.body?.month,
          year: req.body?.year,
          frequency: req.body?.frequency,
          processingTime: null,
          totalNetPay: 0,
          departmentBreakdown: {},
          employeeDetails: [],
        },
      };

      return res.status(500).json({
        success: false,
        message:
          "An unexpected error occurred during all employees payroll processing",
        summary: errorSummary,
      });
    }
  }

  static async initiatePaymentsMultiple(req, res) {
    try {
      const { payrollIds } = req.body;
      const { method, bankDetails, notes } = req.body;

      if (!Array.isArray(payrollIds) || payrollIds.length < 2) {
        throw new ApiError(
          400,
          "At least 2 payroll IDs are required for batch processing"
        );
      }

      // Find all payrolls
      const payrolls = await PayrollModel.find({ _id: { $in: payrollIds } })
        .populate("employee", "firstName lastName")
        .populate("department", "name code");

      if (payrolls.length !== payrollIds.length) {
        throw new ApiError(404, "Some payrolls not found");
      }

      // Validate all payrolls status - ONLY APPROVED status allowed for payment initiation
      const invalidPayrolls = payrolls.filter(
        (payroll) => payroll.status !== PAYROLL_STATUS.APPROVED
      );

      const updatedPayrolls = [];
      const errors = [];

      // Process each payroll
      for (const payroll of payrolls) {
        if (payroll.status !== PAYROLL_STATUS.APPROVED) {
          errors.push({
            payrollId: payroll._id,
            error: "Payroll is not in APPROVED status",
          });
          continue;
        }
        try {
          const paymentReference = `PAY-${Date.now()}-${payroll._id}`;
          const updatedPayroll = await PayrollModel.findByIdAndUpdate(
            payroll._id,
            {
              status: PAYROLL_STATUS.PENDING_PAYMENT,
              payment: {
                amount: payroll.totalAmount,
                method: method || "BANK_TRANSFER",
                reference: paymentReference,
                bankDetails: bankDetails || {
                  bankName: "Pending",
                  accountNumber: "Pending",
                  accountName: "Pending",
                },
                notes: notes || "Payment initiated",
              },
              approvalFlow: {
                ...payroll.approvalFlow,
                currentLevel: APPROVAL_LEVELS.SUPER_ADMIN,
                history: [
                  ...(payroll.approvalFlow.history || []),
                  {
                    level: APPROVAL_LEVELS.SUPER_ADMIN,
                    status: "APPROVED",
                    user: req.user._id,
                    action: "APPROVE",
                    updatedBy: req.user._id,
                    updatedAt: new Date(),
                    remarks: notes || "Payment initiated",
                  },
                ],
                submittedBy: req.user._id,
                submittedAt: new Date(),
                status: PAYROLL_STATUS.PENDING_PAYMENT,
              },
            },
            { new: true }
          ).populate("employee", "firstName lastName");

          if (!updatedPayroll) {
            throw new Error("Failed to update payroll status");
          }

          updatedPayrolls.push(updatedPayroll);
        } catch (error) {
          errors.push({
            payrollId: payroll._id,
            error: error.message,
          });
        }
      }

      // Return detailed response
      const response = {
        success: errors.length === 0,
        message:
          errors.length === 0
            ? "Batch payment initiation completed"
            : `Batch completed with ${errors.length} error(s)`,
        data: {
          payrolls: updatedPayrolls.map((payroll) => ({
            payrollId: payroll._id,
            status: payroll.status,
            payment: payroll.payment,
          })),
          errors: errors.length > 0 ? errors : undefined,
        },
      };

      console.log(
        "🔵 Backend response structure:",
        JSON.stringify(response, null, 2)
      );

      return res.status(200).json(response);
    } catch (error) {
      console.error("❌ Error in initiatePaymentsMultiple:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to initiate batch payments",
        error: error.message,
      });
    }
  }

  static async sendMultiplePayslipsEmail(req, res) {
    try {
      const { payrollIds } = req.body;
      const user = req.user;

      // Check permissions
      if (!user.hasPermission(Permission.VIEW_DEPARTMENT_PAYSLIPS)) {
        throw new ApiError(403, "You don't have permission to send payslips");
      }

      if (
        !payrollIds ||
        !Array.isArray(payrollIds) ||
        payrollIds.length === 0
      ) {
        throw new ApiError(400, "Please provide an array of payroll IDs");
      }

      console.log(
        `📧 [sendMultiplePayslipsEmail] Starting batch send for ${payrollIds.length} payslips`
      );

      const results = {
        total: payrollIds.length,
        successful: 0,
        failed: 0,
        skipped: 0,
        successfulDetails: [],
        failedDetails: [],
        skippedDetails: [],
      };

      // Process each payroll
      for (const payrollId of payrollIds) {
        try {
          // Find payroll by _id
          const payroll = await PayrollModel.findById(payrollId)
            .populate("employee")
            .populate("department")
            .populate("salaryGrade")
            .populate({
              path: "approvalFlow",
              populate: ["submittedBy", "approvedBy"],
            });

          if (!payroll) {
            results.skipped++;
            results.skippedDetails.push({
              payrollId,
              reason: "Payslip not found",
            });
            continue;
          }

          // Check if user has permission to view this payslip
          if (
            user.role === UserRole.ADMIN &&
            payroll.employee.department.toString() !==
              user.department.toString()
          ) {
            results.skipped++;
            results.skippedDetails.push({
              payrollId,
              employeeName: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
              reason:
                "You can only send payslips for employees in your department",
            });
            continue;
          }

          // Check if email was already sent
          if (payroll.emailSent) {
            results.skipped++;
            results.skippedDetails.push({
              payrollId,
              employeeName: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
              reason: "Email already sent",
            });
            continue;
          }

          // Prepare data for PDF generation
          const pdfData = {
            employee: payroll.employee,
            department: payroll.department,
            month: payroll.month,
            year: payroll.year,
            basicSalary: payroll.basicSalary,
            earnings: {
              basicSalary: payroll.basicSalary,
              overtime: payroll.earnings.overtime,
              bonus: payroll.earnings.bonus,
              totalEarnings: payroll.earnings.totalEarnings,
            },
            deductions: {
              tax: payroll.deductions.tax,
              pension: payroll.deductions.pension,
              nhf: payroll.deductions.nhf,
              loans: payroll.deductions.loans,
              others: payroll.deductions.others,
              totalDeductions: payroll.deductions.totalDeductions,
            },
            totals: {
              grossEarnings: payroll.totals.grossEarnings,
              totalDeductions: payroll.totals.totalDeductions,
              netPay: payroll.totals.netPay,
            },
            paymentDetails: {
              status: payroll.status,
              paymentDate: payroll.approvalFlow.paidAt || new Date(),
            },
            gradeAllowances: payroll.allowances?.gradeAllowances || [],
            additionalAllowances:
              payroll.allowances?.additionalAllowances || [],
            personalBonuses: payroll.bonuses?.items || [],
          };

          // Generate PDF
          const pdfDoc = await generatePayslipPDF(pdfData);
          const pdfBuffer = await pdfDoc.output("arraybuffer");

          // Create email service instance
          const emailService = new EmailService();

          // Retry logic for email sending
          const maxRetries = 3;
          let lastError = null;
          let attempt = 0;
          let emailSent = false;

          for (attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              console.log(
                `📧 [sendMultiplePayslipsEmail] Attempt ${attempt}/${maxRetries} - Sending payslip to ${payroll.employee.email} (ID: ${payrollId})`
              );

              // Send email
              await emailService.sendPayslipEmail(
                payroll.employee.email,
                pdfData,
                pdfBuffer
              );

              console.log(
                `✅ [sendMultiplePayslipsEmail] Payslip sent successfully on attempt ${attempt} for ${payroll.employee.email}`
              );
              emailSent = true;
              break;
            } catch (error) {
              lastError = error;
              console.error(
                `❌ [sendMultiplePayslipsEmail] Attempt ${attempt}/${maxRetries} failed for ${payroll.employee.email}:`,
                {
                  error: error.message,
                  code: error.code,
                  payrollId: payrollId,
                }
              );

              // If this is not the last attempt, wait before retrying
              if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
                console.log(
                  `⏳ [sendMultiplePayslipsEmail] Waiting ${delay}ms before retry for ${payroll.employee.email}...`
                );
                await new Promise((resolve) => setTimeout(resolve, delay));
              }
            }
          }

          if (emailSent) {
            // Update payroll record to mark email as sent
            await PayrollModel.findByIdAndUpdate(payrollId, {
              $set: {
                emailSent: true,
                emailSentAt: new Date(),
              },
            });

            // Create notification for employee
            await NotificationService.createNotification(
              payroll.employee._id,
              NOTIFICATION_TYPES.PAYROLL_COMPLETED,
              payroll.employee,
              payroll,
              null,
              { recipientId: payroll.employee._id }
            );

            results.successful++;
            results.successfulDetails.push({
              payrollId,
              employeeName: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
              employeeEmail: payroll.employee.email,
              attempt: attempt,
            });
          } else {
            // Update payroll record to mark email as failed
            await PayrollModel.findByIdAndUpdate(payrollId, {
              $set: {
                emailSent: false,
                emailSentAt: new Date(),
                emailError: lastError.message,
              },
            });

            results.failed++;
            results.failedDetails.push({
              payrollId,
              employeeName: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
              employeeEmail: payroll.employee.email,
              error: lastError.message,
              attempts: maxRetries,
            });
          }
        } catch (error) {
          console.error(
            `❌ [sendMultiplePayslipsEmail] Error processing payroll ${payrollId}:`,
            error
          );
          results.failed++;
          results.failedDetails.push({
            payrollId,
            error: error.message,
          });
        }
      }

      // Create notification for sender (admin) about batch operation
      const notificationMessage = `Batch payslip sending completed: ${results.successful} successful, ${results.failed} failed, ${results.skipped} skipped`;

      await NotificationService.createNotification(
        user._id,
        NOTIFICATION_TYPES.PAYROLL_COMPLETED,
        null,
        null,
        notificationMessage,
        { recipientId: user._id }
      );

      console.log(`✅ [sendMultiplePayslipsEmail] Batch operation completed:`, {
        total: results.total,
        successful: results.successful,
        failed: results.failed,
        skipped: results.skipped,
        userId: user._id,
      });

      return res.status(200).json({
        success: true,
        message: `Batch payslip sending completed: ${results.successful} successful, ${results.failed} failed, ${results.skipped} skipped`,
        data: results,
      });
    } catch (error) {
      console.error("Error in batch payslip sending:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message: message || "Failed to send payslips in batch",
      });
    }
  }
}
// Add this helper function
function calculatePeriodEnd(startDate, frequency) {
  const endDate = new Date(startDate);
  switch (frequency) {
    case "weekly":
      endDate.setDate(endDate.getDate() + 7);
      break;
    case "biweekly":
      endDate.setDate(endDate.getDate() + 14);
      break;
    case "monthly":
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case "quarterly":
      endDate.setMonth(endDate.getMonth() + 3);
      break;
    case "annual":
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
    default:
      endDate.setMonth(endDate.getMonth() + 1);
  }
  return endDate;
}
