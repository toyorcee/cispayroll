import { AuthService } from "../services/authService.js";
import { UserRole, Permission } from "../models/User.js";
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
import { EmailService } from "../services/EmailService.js";
import BaseApprovalController, {
  APPROVAL_LEVELS,
} from "./BaseApprovalController.js";

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
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const payrolls = await PayrollModel.find(query)
        .sort({ year: -1, month: -1 })
        .skip(skip)
        .limit(limit)
        .populate([
          { path: "employee", select: "firstName lastName employeeId" },
          { path: "department", select: "name code" },
          { path: "salaryGrade", select: "level description" },
        ]);

      const total = await PayrollModel.countDocuments(query);

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
          payrolls,
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

      // Only allow access to DRAFT payrolls
      if (payroll.status !== "DRAFT") {
        return res.status(403).json({
          success: false,
          message: "Only draft payrolls can be edited",
          status: payroll.status,
        });
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

      console.log("Fetching stats for period:", { month, year });

      const stats = await PayrollModel.aggregate([
        {
          $match: {
            month: month,
            year: year,
            status: { $in: ["PAID", "APPROVED"] }, // Only count PAID and APPROVED payrolls
          },
        },
        {
          $group: {
            _id: null,
            totalNetSalary: { $sum: "$totals.netPay" },
            totalEmployees: { $sum: 1 },
            pendingReviews: {
              $sum: {
                $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalNetSalary: 1,
            totalEmployees: 1,
            pendingReviews: 1,
          },
        },
      ]);

      console.log("Aggregated stats:", stats);

      const defaultStats = {
        totalNetSalary: 0,
        totalEmployees: 0,
        pendingReviews: 0,
      };

      res.status(200).json({
        success: true,
        data: stats.length > 0 ? stats[0] : defaultStats,
        period: {
          month,
          year,
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
      console.log("🔍 Fetching payslip details for:", req.params.payrollId);
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

      // Add null check for employee
      if (!payroll.employee) {
        throw new ApiError(404, "Employee details not found");
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

      console.log("✅ Payslip details retrieved successfully");

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

  static async rejectPayroll(req, res, next) {
    try {
      const { id } = req.params;
      const { remarks } = req.body;

      const payroll = await PayrollModel.findById(id);
      // ... rejection logic
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

      const existingComponent = salaryGrade.components[componentIndex];

      // Validate calculationMethod
      const validCalculationMethods = ["fixed", "percentage"];
      if (
        req.body.calculationMethod &&
        !validCalculationMethods.includes(req.body.calculationMethod)
      ) {
        throw new ApiError(400, "Invalid calculation method");
      }

      salaryGrade.components[componentIndex] = {
        ...existingComponent.toObject(),
        ...req.body,
        type: "allowance", // Always allowance
        calculationMethod:
          req.body.calculationMethod || existingComponent.calculationMethod,
        value: Number(req.body.value || existingComponent.value),
        updatedBy: userId,
      };

      salaryGrade.updatedBy = userId;
      await salaryGrade.save();

      res.status(200).json({
        success: true,
        message: "Component updated successfully",
        data: salaryGrade,
      });
    } catch (error) {
      console.error("❌ Error updating salary component:", error);
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

      await SalaryGrade.findByIdAndDelete(id);

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
      console.log("📝 Creating voluntary deduction");

      // Validate required fields
      if (
        !req.body.name ||
        !req.body.calculationMethod ||
        req.body.value === undefined
      ) {
        throw new ApiError(
          400,
          "Missing required fields: name, calculationMethod, value"
        );
      }

      // Validate deduction value
      if (req.body.value < 0) {
        throw new ApiError(400, "Deduction value cannot be negative");
      }

      if (req.body.calculationMethod === "percentage" && req.body.value > 100) {
        throw new ApiError(400, "Percentage deduction cannot exceed 100%");
      }

      const userId = asObjectId(req.user.id);
      const deductionData = {
        name: req.body.name,
        description: req.body.description,
        calculationMethod: req.body.calculationMethod,
        value: req.body.value,
        effectiveDate: req.body.effectiveDate
          ? new Date(req.body.effectiveDate)
          : new Date(),
        category: req.body.category || "general",
        isActive: true,
        isCustom: req.body.isCustom || false, // Added this line
        createdBy: userId,
        updatedBy: userId,
      };

      const deduction = await DeductionService.createVoluntaryDeduction(
        userId,
        deductionData
      );

      console.log("✅ Deduction created successfully:", deduction);

      res.status(201).json({
        success: true,
        message: "Voluntary deduction created successfully",
        data: deduction,
      });
    } catch (error) {
      console.error("❌ Error creating deduction:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
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
      console.log("📝 Updating deduction:", req.params.id);

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
          updatedBy: asObjectId(req.user.id),
          $push: { history: historyEntry },
        },
        { new: true }
      );

      console.log("✅ Deduction updated successfully");

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
      console.log("📝 Creating deduction:", req.body); // Debug log

      const deduction = new Deduction({
        ...req.body,
        createdBy: req.user._id,
        updatedBy: req.user._id,
        isActive: true,
      });

      await deduction.save();
      console.log("✅ Deduction created successfully"); // Debug log

      res.status(201).json({
        success: true,
        message: "Deduction created successfully",
        data: deduction,
      });
    } catch (error) {
      console.error("❌ Error creating deduction:", error); // Debug log
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

      // Create audit log
      await Audit.create({
        user: req.user._id,
        action: AuditAction.VIEW,
        entity: AuditEntity.PAYMENT,
        entityId: payrollId,
        details: {
          payrollId,
          paymentCount: payments.length,
        },
      });

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

      // Create audit log
      await Audit.create({
        user: req.user._id,
        action: AuditAction.CREATE,
        entity: AuditEntity.PAYMENT_METHOD,
        entityId: paymentMethod._id,
        details: {
          name: paymentMethod.name,
          type: paymentMethod.type,
        },
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

      // Create audit log
      await Audit.create({
        user: req.user._id,
        action: AuditAction.UPDATE,
        entity: AuditEntity.PAYMENT_METHOD,
        entityId: paymentMethod._id,
        details: {
          name: paymentMethod.name,
          type: paymentMethod.type,
          changes: req.body,
        },
      });

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

      // Create audit log
      await Audit.create({
        user: req.user._id,
        action: AuditAction.DELETE,
        entity: AuditEntity.PAYMENT_METHOD,
        entityId: req.params.id,
        details: {
          name: paymentMethod.name,
          type: paymentMethod.type,
        },
      });

      res.status(200).json({
        success: true,
        message: "Payment method deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async markPaymentFailed(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      console.log("🔍 Starting mark as failed for payroll ID:", id);
      console.log("👤 Processor:", req.user.firstName, req.user.lastName);

      const payroll = await PayrollModel.findById(id);
      if (!payroll) {
        throw new ApiError(404, "Payroll not found");
      }

      // Validate payroll status
      if (payroll.status !== PAYROLL_STATUS.PENDING_PAYMENT) {
        throw new ApiError(
          400,
          "Only pending payment payrolls can be marked as failed"
        );
      }

      // Update payroll status
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
              user: req.user._id,
              action: "REJECT",
              updatedBy: req.user._id,
              updatedAt: new Date(),
              remarks: notes || "Payment failed",
            },
          ],
          submittedBy: req.user._id,
          submittedAt: new Date(),
          status: PAYROLL_STATUS.FAILED,
          remarks: notes || "Payment failed",
        },
      };

      // Update the payroll with all required fields
      const updated = await PayrollModel.findByIdAndUpdate(
        id,
        { $set: updatedPayroll },
        { new: true, runValidators: true }
      );

      if (!updated) {
        throw new ApiError(500, "Failed to update payroll status");
      }

      console.log("Updated payroll status:", updated.status);

      // Create payment record
      await Payment.create({
        payrollId: payroll._id,
        employeeId: payroll.employee,
        amount: payroll.totals.netPay,
        status: PaymentStatus.FAILED,
        processedBy: req.user._id,
        processedAt: new Date(),
        paymentMethod: "BANK_TRANSFER",
        reference: `PAY-${Date.now()}`,
        bankDetails: payroll.payment,
        notes: notes || "Payment failed",
      });

      // Create audit log
      await Audit.create({
        user: req.user._id,
        action: AuditAction.PROCESS,
        entity: AuditEntity.PAYROLL,
        entityId: payroll._id,
        performedBy: req.user._id,
        details: {
          previousStatus: payroll.status,
          newStatus: PAYROLL_STATUS.FAILED,
          amount: payroll.totals.netPay,
          notes: notes || "Payment failed",
        },
      });

      // Create notification for employee
      console.log(
        "📬 Creating notification for employee:",
        payroll.employee._id
      );
      await NotificationService.createPayrollNotification(
        payroll.employee._id,
        NOTIFICATION_TYPES.PAYROLL_FAILED,
        payroll,
        "Your payment has failed"
      );

      // Create notification for accountants
      console.log("📬 Creating notifications for accountants");
      const accountants = await UserModel.find({ role: "ACCOUNTANT" });
      for (const accountant of accountants) {
        console.log("📬 Sending notification to accountant:", accountant._id);
        await NotificationService.createPayrollNotification(
          accountant._id,
          NOTIFICATION_TYPES.PAYROLL_FAILED,
          payroll,
          "A payment has been marked as failed"
        );
      }

      res.status(200).json({
        success: true,
        message: "Payment marked as failed successfully",
        data: {
          payrollId: updated._id,
          amount: updated.totals.netPay,
          status: updated.status,
          paymentDate: updated.approvalFlow.submittedAt,
        },
      });
    } catch (error) {
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
      const { payslipId } = req.params;

      // Find payroll by payslipId and populate necessary fields
      const payroll = await Payroll.findOne({ payslipId })
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

      // Prepare data for PDF generation
      const pdfData = {
        employee: payroll.employee,
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
      };

      // Generate PDF
      const pdfDoc = await generatePayslipPDF(pdfData);
      const pdfBuffer = await pdfDoc.output("arraybuffer");

      // Create email service instance
      const emailService = new EmailService();

      // Send email
      await emailService.sendPayslipEmail(
        payroll.employee.email,
        pdfData,
        pdfBuffer
      );

      // Update payroll record to mark email as sent
      await Payroll.findOneAndUpdate(
        { payslipId },
        {
          $set: {
            emailSent: true,
            emailSentAt: new Date(),
          },
        }
      );

      return res.status(200).json({
        success: true,
        message: "Payslip email sent successfully",
      });
    } catch (error) {
      console.error("Error sending payslip email:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message: message || "Failed to send payslip email",
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

      // Get all active employees in the department
      const employees = await UserModel.find({
        department: departmentId,
        status: "active",
        role: "employee",
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
            employeeId: employee._id,
            month,
            year,
            status: { $in: ["DRAFT", "PENDING", "APPROVED", "COMPLETED"] },
          });

          if (existingPayroll) {
            results.skipped++;
            results.skippedDetails.push(
              `${employee.firstName} ${employee.lastName} (${employee.employeeId})`
            );
            continue;
          }

          // Calculate payroll
          const payroll = await calculatePayroll(employee, month, year);

          // Create payroll record with COMPLETED status since it's at Super Admin level
          const newPayroll = await PayrollModel.create({
            ...payroll,
            employeeId: employee._id,
            departmentId: department._id,
            status: "COMPLETED", // Set as COMPLETED since it's at Super Admin level
            approvalLevel: "SUPER_ADMIN",
            approvedBy: req.user._id,
            approvedAt: new Date(),
          });

          // Send notification to employee
          await NotificationService.createPayrollNotification(
            newPayroll,
            NOTIFICATION_TYPES.PAYROLL_COMPLETED,
            req.user,
            "Your payroll has been processed and is ready for payment.",
            {
              approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
            }
          );

          results.processed++;
          results.processedDetails.push(
            `${employee.firstName} ${employee.lastName} (${employee.employeeId})`
          );
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

      res.status(200).json({
        success: true,
        message: "Department payroll processing completed",
        data: results,
      });
    } catch (error) {
      console.error("❌ Error in processDepartmentEmployeesPayroll:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process department payroll",
        error: error.message,
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

  // Process single employee payroll
  static async processSingleEmployeePayroll(req, res, next) {
    try {
      console.log("🔄 Processing single employee payroll:", req.body);
      const { employeeId, departmentId, month, year, frequency } = req.body;

      console.log(
        `👤 Super Admin processing payroll for employee: ${employeeId}`
      );

      // Get employee
      const employee = await UserModel.findOne({
        _id: employeeId,
        department: departmentId,
        status: "active",
      });

      if (!employee) {
        console.error(`❌ Employee not found or not active: ${employeeId}`);
        throw new ApiError(404, "Employee not found or not active");
      }

      // Get the employee's salary grade based on their grade level
      if (!employee.gradeLevel) {
        console.error(`❌ Employee has no grade level assigned: ${employeeId}`);
        throw new ApiError(
          400,
          "Employee does not have a grade level assigned"
        );
      }

      // Find the corresponding salary grade
      const salaryGrade = await SalaryGrade.findOne({
        level: employee.gradeLevel,
        isActive: true,
      });

      if (!salaryGrade) {
        console.error(
          `❌ No active salary grade found for level ${employee.gradeLevel}`
        );
        throw new ApiError(
          400,
          `No active salary grade found for level ${employee.gradeLevel}`
        );
      }

      console.log(
        `👤 Employee found: ${employee.firstName} ${employee.lastName} (${employee._id})`
      );

      // Calculate payroll using the found salary grade
      console.log(
        `🧮 Calculating payroll for employee ${employeeId} with salary grade ${salaryGrade._id}`
      );
      const payrollData = await PayrollService.calculatePayroll(
        employeeId,
        salaryGrade._id,
        month,
        year,
        frequency.toLowerCase()
      );

      // Create payroll record
      const payroll = await PayrollModel.create({
        ...payrollData,
        employee: employeeId,
        department: departmentId,
        status: PAYROLL_STATUS.PROCESSING,
        processedBy: req.user._id,
        createdBy: req.user._id,
        updatedBy: req.user._id,
        payment: {
          accountName: "Pending",
          accountNumber: "Pending",
          bankName: "Pending",
        },
        approvalFlow: {
          currentLevel: APPROVAL_LEVELS.PROCESSING,
          history: [],
          submittedBy: req.user._id,
          submittedAt: new Date(),
          status: PAYROLL_STATUS.PROCESSING,
          remarks: "Initial payroll creation",
        },
      });

      console.log(`✅ Payroll created with ID: ${payroll._id}`);

      // Create notification for super admin only
      await NotificationService.createPayrollNotification(
        payroll,
        "PAYROLL_DRAFT_CREATED",
        req.user,
        "You have created a draft payroll"
      );

      return res.status(201).json({
        success: true,
        message: "Payroll processed successfully",
        data: payroll,
      });
    } catch (error) {
      console.error(`❌ Error processing payroll: ${error.message}`);
      next(error);
    }
  }

  static async processMultipleEmployeesPayroll(req, res, next) {
    try {
      console.log("🔄 Processing multiple employees payroll:", req.body);
      const {
        month,
        year,
        frequency,
        employeeSalaryGrades,
        validationErrors = [],
      } = req.body;
      const superAdminId = req.user.id;

      console.log(
        `👤 Super Admin processing payrolls: ${req.user.firstName} ${req.user.lastName} (${superAdminId})`
      );

      const results = {
        total: employeeSalaryGrades.length,
        processed: 0,
        skipped: 0,
        failed: 0,
        errors: [],
        successful: [],
        validationErrors: validationErrors, // Include validation errors
        details: [], // Track status of each employee
      };

      // Process each employee's payroll
      for (const { employeeId, salaryGradeId } of employeeSalaryGrades) {
        try {
          console.log(
            `\n🔄 Processing employee: ${employeeId} with salary grade: ${salaryGradeId}`
          );

          // Check if payroll already exists
          const existingPayroll = await PayrollModel.findOne({
            employee: employeeId,
            month,
            year,
            frequency,
          });

          if (existingPayroll) {
            console.log(
              `⚠️ Payroll already exists for employee ${employeeId}, skipping`
            );
            results.skipped++;
            results.errors.push({
              employeeId,
              reason: "Payroll already exists for this period",
            });
            results.details.push({
              employeeId,
              status: "SKIPPED",
              reason: "Payroll already exists for this period",
            });
            continue;
          }

          // Calculate payroll for this employee
          console.log(`🧮 Calculating payroll for employee ${employeeId}`);
          const payrollData = await PayrollService.calculatePayroll(
            employeeId,
            salaryGradeId,
            month,
            year,
            frequency
          );

          if (payrollData) {
            // Create payroll record
            const payroll = await PayrollModel.create({
              ...payrollData,
              status: PAYROLL_STATUS.PROCESSING, // Set to PROCESSING for super admin
              processedBy: superAdminId,
              createdBy: superAdminId,
              updatedBy: superAdminId,
              payment: {
                accountName: "Pending",
                accountNumber: "Pending",
                bankName: "Pending",
              },
              approvalFlow: {
                currentLevel: APPROVAL_LEVELS.PROCESSING, // Set to PROCESSING
                history: [],
                submittedBy: superAdminId,
                submittedAt: new Date(),
                status: PAYROLL_STATUS.PROCESSING, // Set to PROCESSING
                remarks: "Initial payroll creation",
              },
            });

            console.log(`✅ Payroll created with ID: ${payroll._id}`);

            // Create notification for the employee
            console.log(`🔔 Creating notification for employee: ${employeeId}`);
            await NotificationService.createPayrollNotification(
              payroll,
              NOTIFICATION_TYPES.PAYROLL_PROCESSING_STARTED,
              req.user,
              "Payroll processing started"
            );

            // Create notification for the super admin
            console.log(
              `🔔 Creating notification for super admin: ${superAdminId}`
            );
            await NotificationService.createPayrollNotification(
              payroll,
              NOTIFICATION_TYPES.PAYROLL_PROCESSING_STARTED,
              req.user,
              "Payroll processing started"
            );

            results.processed++;
            results.successful.push({
              employeeId,
              payrollId: payroll._id,
            });
            results.details.push({
              employeeId,
              status: "SUCCESS",
              payrollId: payroll._id,
            });

            console.log(
              `✅ Successfully processed payroll for employee: ${employeeId}`
            );
          } else {
            console.error(
              `❌ Failed to calculate payroll for employee ${employeeId}`
            );
            results.failed++;
            results.errors.push({
              employeeId,
              reason: "Failed to calculate payroll",
            });
            results.details.push({
              employeeId,
              status: "FAILED",
              reason: "Failed to calculate payroll",
            });
          }
        } catch (error) {
          console.error(
            `❌ Error processing employee ${employeeId}: ${error.message}`
          );
          results.failed++;
          results.errors.push({
            employeeId,
            reason: error.message || "Unknown error occurred",
          });
          results.details.push({
            employeeId,
            status: "FAILED",
            reason: error.message || "Unknown error occurred",
          });
        }
      }

      console.log(`\n📊 Payroll processing summary:`);
      console.log(`- Total employees: ${results.total}`);
      console.log(`- Successfully processed: ${results.processed}`);
      console.log(`- Skipped: ${results.skipped}`);
      console.log(`- Failed: ${results.failed}`);
      if (validationErrors.length > 0) {
        console.log(`- Validation errors: ${validationErrors.length}`);
      }

      res.status(200).json({
        success: true,
        message:
          validationErrors.length > 0
            ? `Processed ${results.processed} payrolls (${validationErrors.length} failed validation)`
            : `Processed ${results.processed} payrolls`,
        data: results,
      });
    } catch (error) {
      console.error(`❌ Error processing multiple payrolls: ${error.message}`);
      next(error);
    }
  }

  static async initiatePayment(req, res) {
    try {
      const { id } = req.params;
      const { method, bankDetails, notes } = req.body;

      console.log("🔍 Starting payment initiation for payroll ID:", id);
      console.log("👤 Initiator:", req.user.firstName, req.user.lastName);

      // Find and populate the payroll with employee data
      const payroll = await PayrollModel.findById(id)
        .populate("employee", "firstName lastName")
        .populate("department", "name code");

      if (!payroll) {
        throw new ApiError(404, "Payroll not found");
      }

      // Validate payroll status
      if (payroll.status !== PAYROLL_STATUS.PROCESSING) {
        throw new ApiError(
          400,
          "Only processing payrolls can be initiated for payment"
        );
      }

      // Generate payment reference
      const paymentReference = `PAY-${Date.now()}`;

      // Update payroll status and payment details
      const updatedPayroll = await PayrollModel.findByIdAndUpdate(
        id,
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
        throw new ApiError(500, "Failed to update payroll status");
      }

      // Create notification for employee
      console.log(
        "📬 Creating notification for employee:",
        updatedPayroll.employee._id
      );
      await NotificationService.createPayrollNotification(
        updatedPayroll,
        NOTIFICATION_TYPES.PAYROLL_PENDING_PAYMENT,
        updatedPayroll.employee,
        "Your payment is pending processing"
      );

      // Create notification for super admin
      console.log("📬 Creating notification for super admin:", req.user._id);
      await NotificationService.createPayrollNotification(
        updatedPayroll,
        NOTIFICATION_TYPES.PAYROLL_PENDING_PAYMENT,
        req.user,
        `Employee ${updatedPayroll.employee.firstName} ${updatedPayroll.employee.lastName}'s payroll is pending payment`
      );

      // Create notification for accountant
      console.log("📬 Creating notification for accountant");
      const accountants = await UserModel.find({ role: "ACCOUNTANT" });
      for (const accountant of accountants) {
        console.log("📬 Sending notification to accountant:", accountant._id);
        await NotificationService.createPayrollNotification(
          updatedPayroll,
          NOTIFICATION_TYPES.PAYROLL_PENDING_PAYMENT,
          accountant,
          `Employee ${updatedPayroll.employee.firstName} ${updatedPayroll.employee.lastName}'s payroll is pending payment`
        );
      }

      // Return success response
      return res.status(200).json({
        success: true,
        message: "Payment initiated successfully",
        data: {
          payrollId: updatedPayroll._id,
          status: updatedPayroll.status,
          payment: updatedPayroll.payment,
        },
      });
    } catch (error) {
      console.error("❌ Error in initiatePayment:", error);
      console.error("Error details:", error);
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

  static async markPaymentPaid(req, res, next) {
    try {
      const { payrollId } = req.params;
      const user = req.user;

      console.log("🔍 Starting mark as paid for payroll ID:", payrollId);
      console.log("👤 Processor:", user.firstName, user.lastName);

      // Find the payroll
      const payroll = await PayrollModel.findById(payrollId).populate([
        { path: "employee", select: "firstName lastName employeeId email" },
        { path: "department", select: "name code" },
      ]);

      if (!payroll) {
        throw new ApiError(404, "Payroll not found");
      }

      // Check if user has permission
      if (!user.hasPermission(Permission.APPROVE_PAYROLL)) {
        throw new ApiError(
          403,
          "You don't have permission to mark payments as paid"
        );
      }

      // Validate payroll status
      if (payroll.status !== PAYROLL_STATUS.PENDING_PAYMENT) {
        throw new ApiError(
          400,
          "Only pending payment payrolls can be marked as paid"
        );
      }

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

      // Update the payroll with all required fields
      const updated = await PayrollModel.findByIdAndUpdate(
        payrollId,
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
        reference: `PAY-${Date.now()}`,
        bankDetails: payroll.payment,
      });

      // Create notification for the super admin
      console.log("📬 Creating notification for super admin:", user._id);
      await NotificationService.createPayrollNotification(
        payroll,
        NOTIFICATION_TYPES.PAYROLL_PAID,
        user,
        "Payment marked as completed successfully"
      );

      // Create notification for the employee
      if (payroll.employee && payroll.employee.email) {
        console.log(
          "📬 Creating notification for employee:",
          payroll.employee._id
        );
        await NotificationService.createPayrollNotification(
          payroll,
          NOTIFICATION_TYPES.PAYROLL_PAID,
          payroll.employee,
          "Your payment has been processed successfully"
        );
      }

      // Create notification for accountants
      console.log("📬 Creating notifications for accountants");
      const accountants = await UserModel.find({ role: "ACCOUNTANT" });
      for (const accountant of accountants) {
        console.log("📬 Sending notification to accountant:", accountant._id);
        await NotificationService.createPayrollNotification(
          payroll,
          NOTIFICATION_TYPES.PAYROLL_PAID,
          accountant,
          "A payment has been marked as completed"
        );
      }

      res.status(200).json({
        success: true,
        message: "Payment marked as completed successfully",
        data: {
          payrollId: updated._id,
          status: PAYROLL_STATUS.PAID,
          payment: {
            amount: updated.totals.netPay,
            method: req.body.paymentMethod || "BANK_TRANSFER",
            reference: payment.reference,
            bankDetails: payroll.payment,
            notes: "Payment marked as completed",
          },
        },
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
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
