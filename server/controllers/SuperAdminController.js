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
import { DepartmentService } from "../services/departmentService.js";
import { AllowanceService } from "../services/AllowanceService.js";
import { BonusService } from "../services/BonusService.js";
import Bonus from "../models/Bonus.js";
import Allowance from "../models/Allowance.js";
import Notification from "../models/Notification.js";

// Helper function for converting string IDs to ObjectId
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
      const admins = await UserModel.find({ role: UserRole.ADMIN })
        .select("-password")
        .populate("department", "name code")
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        admins,
        count: admins.length,
      });
    } catch (error) {
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
      const departmentName = req.query.department;

      // Base query - now includes all roles
      const query = {};

      // If user is admin, only show users from their department
      if (req.user.role === UserRole.ADMIN) {
        query.department = req.user.department;
        query.role = { $ne: UserRole.SUPER_ADMIN };
      }

      // Add other filters if provided
      if (status) {
        query.status = status;
      }

      // Modified department filter to handle null/undefined departments
      if (departmentName && req.user.role === UserRole.SUPER_ADMIN) {
        if (departmentName === "No Department") {
          query.department = { $in: [null, undefined] };
        } else {
          query.department = departmentName;
        }
      }

      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      const total = await UserModel.countDocuments(query);
      const totalPages = Math.ceil(total / limit);
      const skip = (page - 1) * limit;

      const users = await UserModel.find(query)
        .select("-password")
        .populate("department", "name code")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      res.status(200).json({
        success: true,
        data: users,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
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
      if (!req.body.department) {
        throw new ApiError(400, "Department is required");
      }

      const userData = {
        ...req.body,
        role: UserRole.USER,
        isEmailVerified: true, // Since super admin creates it, it's verified
      };

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
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async updateUser(req, res, next) {
    try {
      const userId = req.params.id;
      const user = await UserModel.findById(userId);

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

      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { $set: req.body },
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
      const departments = await DepartmentService.getAllDepartments();
      res.status(200).json({
        success: true,
        data: { departments },
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async createDepartment(req, res) {
    try {
      const department = await DepartmentService.createDepartment(
        req.body,
        req.user.id
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
      const department = await DepartmentService.updateDepartment(
        req.params.id,
        req.body,
        req.user.id
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
      await DepartmentService.deleteDepartment(req.params.id);
      res.status(200).json({
        success: true,
        message: "Department deleted successfully",
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  // ===== Payroll Management =====
  static async createPayroll(req, res) {
    try {
      console.log("📝 Creating payroll record with data:", req.body);
      const { employee, month, year, salaryGrade } = req.body;

      // First check if payroll already exists
      const existingPayroll = await PayrollModel.findOne({
        employee: asObjectId(employee),
        month,
        year,
      });

      if (existingPayroll) {
        return res.status(400).json({
          success: false,
          message: `Payroll record already exists for employee in ${month}/${year}`,
          data: existingPayroll,
        });
      }

      // Get calculations from PayrollService
      const calculations = await PayrollService.calculatePayroll(
        asObjectId(employee),
        asObjectId(salaryGrade),
        month,
        year
      );

      // Calculate allowance amounts based on components
      const processedComponents = calculations.components.map((component) => {
        let calculatedAmount = 0;
        if (component.type === "allowance") {
          if (component.name === "Housing Allowance") {
            calculatedAmount =
              (component.value / 100) * calculations.basicSalary;
          } else {
            calculatedAmount = component.value;
          }
        }
        return {
          ...component,
          amount: calculatedAmount,
        };
      });

      // Calculate total allowances and gross earnings
      const totalAllowances = processedComponents.reduce(
        (sum, component) => sum + (component.amount || 0),
        0
      );
      const grossEarnings = calculations.basicSalary + totalAllowances;

      // Prepare payroll data
      const payrollData = {
        ...calculations,
        components: processedComponents,
        allowances: {
          gradeAllowances: processedComponents
            .filter((comp) => comp.type === "allowance")
            .map((comp) => ({
              name: comp.name,
              type: "allowance",
              value: comp.value,
              amount: comp.amount,
              calculationMethod: comp.calculationMethod,
            })),
          additionalAllowances: [],
          totalAllowances,
        },
        totals: {
          basicSalary: calculations.basicSalary,
          totalAllowances,
          totalBonuses: 0,
          grossEarnings,
          totalDeductions: calculations.deductions.totalDeductions,
          netPay: grossEarnings - calculations.deductions.totalDeductions,
        },
        processedBy: asObjectId(req.user.id),
        createdBy: asObjectId(req.user.id),
        updatedBy: asObjectId(req.user.id),
        approvalFlow: {
          submittedBy: asObjectId(req.user.id),
          submittedAt: new Date(),
        },
        payment: {
          bankName:
            calculations.employee.bankDetails?.bankName ||
            "Bank Details Required",
          accountNumber:
            calculations.employee.bankDetails?.accountNumber ||
            "Bank Details Required",
          accountName:
            calculations.employee.bankDetails?.accountName ||
            "Bank Details Required",
        },
        frequency: "monthly",
        periodStart: new Date(),
        periodEnd: new Date(),
        month,
        year,
      };

      // Create and populate payroll record
      const payroll = await PayrollModel.create(payrollData);
      const populatedPayroll = await PayrollModel.findById(
        payroll._id
      ).populate([
        { path: "employee", select: "firstName lastName employeeId" },
        { path: "department", select: "name code" },
        { path: "salaryGrade", select: "level description" },
      ]);

      res.status(201).json({
        success: true,
        message: "Payroll record created successfully",
        data: populatedPayroll,
      });
    } catch (error) {
      console.error("❌ Error in createPayroll:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message: "Failed to create payroll record",
        error: error instanceof Error ? error.message : "Unknown error",
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

  //Get all payrolls
  static async getAllPayroll(req, res) {
    try {
      console.log("=== GETTING ALL PAYROLLS WITH FILTERS ===");
      const { dateRange, department, frequency, status, month, year } =
        req.query;

      let query = {};

      // Apply filters if provided
      if (department && department !== "all") {
        query.department = department;
      }

      if (frequency && frequency !== "all") {
        query.frequency = frequency;
      }

      if (status && status !== "all") {
        query.status = status;
      }

      // Handle date range or specific month/year
      if (month && year) {
        query.month = parseInt(month);
        query.year = parseInt(year);
      } else if (dateRange) {
        const now = new Date();
        let monthsToSubtract;
        switch (dateRange) {
          case "last3":
            monthsToSubtract = 3;
            break;
          case "last6":
            monthsToSubtract = 6;
            break;
          case "last12":
            monthsToSubtract = 12;
            break;
        }

        if (monthsToSubtract) {
          const startDate = new Date(
            now.setMonth(now.getMonth() - monthsToSubtract)
          );
          query.createdAt = { $gte: startDate };
        }
      }

      console.log("🔍 Filter Query:", query);

      const payrolls = await PayrollModel.find(query)
        .populate("employee", "firstName lastName employeeId")
        .populate("department", "name")
        .sort({ createdAt: -1 });

      console.log(`📊 Found ${payrolls.length} payrolls matching filters`);

      return res.status(200).json({
        success: true,
        count: payrolls.length,
        payrolls,
      });
    } catch (error) {
      console.error("❌ Error getting payrolls:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to get payrolls",
        error: error.message,
      });
    }
  }

  static async getEmployeePayrollHistory(req, res) {
    try {
      const { employeeId } = req.params;
      console.log("🔍 Fetching payroll history for employee:", employeeId);

      // Get employee with populated fields
      const employee = await UserModel.findById(employeeId).populate([
        { path: "department", select: "name code" },
        { path: "salaryGrade", select: "level description" },
      ]);

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      // Get payroll history
      const payrollHistory = await PayrollModel.find({
        employee: asObjectId(employeeId),
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
      console.log("Fetching payroll by ID:", req.params.id);

      const payroll = await PayrollModel.findById(req.params.id).populate([
        {
          path: "employee",
          select: "firstName lastName employeeId bankDetails",
        },
        { path: "department", select: "name code" },
        { path: "salaryGrade", select: "level description" },
        { path: "processedBy", select: "firstName lastName" },
        { path: "createdBy", select: "firstName lastName" },
        { path: "approvalFlow.submittedBy", select: "firstName lastName" },
        { path: "approvalFlow.approvedBy", select: "firstName lastName" },
      ]);

      if (!payroll) {
        throw new ApiError(404, "Payroll record not found");
      }

      // Generate a unique payslip ID using the populated employee data
      const payslipId = `PS${payroll.month}${payroll.year}${payroll.employee.employeeId}`;

      console.log("Found payroll record:", payroll._id);

      res.status(200).json({
        success: true,
        data: {
          ...payroll.toObject(),
          payslipId,
        },
      });
    } catch (error) {
      console.error("Error fetching payroll by ID:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async getPayrollPeriods(req, res) {
    try {
      const periods = await PayrollModel.aggregate([
        {
          $group: {
            _id: { month: "$month", year: "$year" },
            totalEmployees: { $sum: 1 },
            totalNetSalary: { $sum: "$totals.netPay" },
            status: { $first: "$status" },
            processedDate: { $first: "$createdAt" },
          },
        },
        {
          $project: {
            _id: 0,
            month: "$_id.month",
            year: "$_id.year",
            totalEmployees: 1,
            totalNetSalary: 1,
            status: 1,
            processedDate: 1,
          },
        },
        { $sort: { year: -1, month: -1 } },
      ]);

      res.status(200).json({
        success: true,
        data: periods,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
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
      console.error("Error fetching payroll stats:", error);
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

      if (!payroll) {
        throw new ApiError(404, "Payroll record not found");
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
      const query = buildPayrollQuery(req.query);
      const payrolls = await PayrollModel.find(query)
        .populate("employee", "employeeId firstName lastName fullName")
        .sort({ createdAt: -1 });

      // Get counts by status
      const statusCounts = await PayrollModel.aggregate([
        { $match: query },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      // Convert to object for easier access
      const counts = {
        PENDING: 0,
        APPROVED: 0,
        REJECTED: 0,
        total: payrolls.length,
      };

      statusCounts.forEach(({ _id, count }) => {
        counts[_id] = count;
      });

      res.status(200).json({
        success: true,
        counts, // Now includes status breakdown
        payrolls,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get payrolls",
        error: error.message,
      });
    }
  }

  //Onboarding & Offboarding
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

  static async getDepartmentEmployees(req, res) {
    try {
      const departmentId = req.params.departmentId;
      console.log("🔍 Fetching employees for department:", departmentId);

      const department = await DepartmentModel.findById(departmentId);
      if (!department) {
        throw new ApiError(404, "Department not found");
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const status = req.query.status;

      const query = {
        department: department.name,
        role: { $in: [UserRole.USER, UserRole.ADMIN] },
        $or: [
          { role: UserRole.USER },
          {
            $and: [
              { role: UserRole.ADMIN },
              { position: { $regex: /head|director|hod/i } },
            ],
          },
        ],
      };

      if (status) {
        query.status = status;
      }

      console.log("📝 Query:", JSON.stringify(query, null, 2));

      const [employees, total] = await Promise.all([
        UserModel.find(query)
          .select("-password")
          .sort({ role: -1, firstName: 1 })
          .skip((page - 1) * limit)
          .limit(limit),
        UserModel.countDocuments(query),
      ]);

      console.log(
        `✅ Found ${employees.length} employees (including HODs) for department ${department.name}`
      );

      res.status(200).json({
        success: true,
        data: {
          employees: employees.map((emp) => ({
            _id: emp._id,
            firstName: emp.firstName,
            lastName: emp.lastName,
            email: emp.email,
            employeeId: emp.employeeId,
            position: emp.position,
            department: department.name,
            status: emp.status,
            gradeLevel: emp.gradeLevel,
            role: emp.role,
            isHOD: emp.role === UserRole.ADMIN,
          })),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("❌ Error fetching department employees:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message: message || "Failed to fetch department employees",
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

      console.log("👤 User info:", {
        id: req.user?.id,
        _id: req.user?._id,
        fullUser: req.user,
      });

      const existingGrade = await SalaryGrade.findOne({ level });
      if (existingGrade) {
        throw new ApiError(
          400,
          `Salary grade with level '${level}' already exists`
        );
      }

      const salaryGrade = await SalaryGrade.create({
        level,
        basicSalary: Number(basicSalary),
        description: description || "",
        department: department ? new Types.ObjectId(department) : null,
        components: components.map((comp) => ({
          name: comp.name.trim(),
          type: comp.type,
          value: Number(comp.value),
          isActive: comp.isActive,
          _id: new Types.ObjectId(),
          createdBy: new Types.ObjectId(req.user.id),
          updatedBy: new Types.ObjectId(req.user.id),
        })),
        createdBy: new Types.ObjectId(req.user.id),
        updatedBy: new Types.ObjectId(req.user.id),
        isActive: true,
      });

      const populatedGrade = await SalaryGrade.findById(salaryGrade._id)
        .populate("department", "name code")
        .populate("components.createdBy", "name")
        .populate("components.updatedBy", "name");

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

      console.log("📝 Updating salary grade with data:", {
        gradeId: req.params.id,
        updateData,
        department,
        components,
      });

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
          type: comp.type,
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

      const newComponent = {
        ...req.body,
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
      salaryGrade.components[componentIndex] = {
        ...existingComponent,
        name: existingComponent.name,
        type: existingComponent.type,
        createdBy: existingComponent.createdBy,
        ...req.body,
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
      await DeductionService.createStatutoryDeductions(asObjectId(req.user.id));
      console.log("✅ Statutory deductions set up successfully");
      res.status(201).json({
        success: true,
        message: "Statutory deductions set up successfully",
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
      // Validate request body
      if (
        !req.body.name ||
        !req.body.calculationMethod ||
        req.body.value === undefined
      ) {
        console.log("❌ Validation failed: Missing required fields");
        throw new Error("Missing required fields");
      }

      const userId = asObjectId(req.user.id);
      console.log("🔑 Converted user ID:", userId);

      const deductionData = {
        name: req.body.name,
        description: req.body.description,
        calculationMethod: req.body.calculationMethod,
        value: req.body.value,
        effectiveDate: req.body.effectiveDate || new Date(),
      };
      console.log("✅ Prepared deduction data:", deductionData);

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
      console.error("❌ Error in controller:", error);
      console.error(
        "Stack trace:",
        error instanceof Error ? error.stack : "No stack trace"
      );
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async updateDeduction(req, res) {
    try {
      console.log("📝 Updating deduction:", {
        id: req.params.id,
        updates: req.body,
      });

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

      const updatedDeduction = await Deduction.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          updatedBy: asObjectId(req.user.id),
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
      const { id } = req.params;

      const result = await DeductionService.toggleDeductionStatus(
        asObjectId(id),
        asObjectId(req.user.id)
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
      const deduction = await Deduction.findById(req.params.id);
      if (!deduction) {
        throw new ApiError(404, "Deduction not found");
      }

      // Don't allow deleting statutory deductions
      if (deduction.type === "statutory") {
        throw new ApiError(400, "Cannot delete statutory deductions");
      }

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

  static async approvePayroll(req, res, next) {
    try {
      const { id } = req.params;
      const { remarks } = req.body;

      const payroll = await PayrollModel.findById(id);
      if (!payroll) {
        return res.status(404).json({
          success: false,
          message: "Payroll not found",
        });
      }

      // Check if payroll is already approved or rejected
      if (payroll.status === PAYROLL_STATUS.APPROVED) {
        return res.status(400).json({
          success: false,
          message: "Payroll is already approved",
        });
      }

      if (payroll.status === PAYROLL_STATUS.REJECTED) {
        return res.status(400).json({
          success: false,
          message: "Cannot approve a rejected payroll",
        });
      }

      // Update payroll status and approval details
      payroll.status = PAYROLL_STATUS.APPROVED;
      payroll.approvalFlow = {
        ...payroll.approvalFlow,
        approvedBy: req.user._id,
        approvedAt: new Date(),
        remarks: remarks || "",
      };

      // Save the changes
      await payroll.save();

      // Create notification for the employee
      await Notification.createPayrollNotification(
        payroll.employee,
        "PAYROLL_APPROVED",
        payroll,
        remarks
      );

      res.status(200).json({
        success: true,
        message: "Payroll approved successfully",
        data: payroll,
      });
    } catch (error) {
      next(error);
    }
  }

  static async rejectPayroll(req, res, next) {
    try {
      const { id } = req.params;
      const { remarks } = req.body;

      if (!remarks?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Remarks are required when rejecting a payroll",
        });
      }

      const payroll = await PayrollModel.findById(id);
      if (!payroll) {
        return res.status(404).json({
          success: false,
          message: "Payroll not found",
        });
      }

      // Check if payroll is already approved or rejected
      if (payroll.status === PAYROLL_STATUS.APPROVED) {
        return res.status(400).json({
          success: false,
          message: "Cannot reject an approved payroll",
        });
      }

      if (payroll.status === PAYROLL_STATUS.REJECTED) {
        return res.status(400).json({
          success: false,
          message: "Payroll is already rejected",
        });
      }

      // Update payroll status and rejection details
      payroll.status = PAYROLL_STATUS.REJECTED;
      payroll.approvalFlow = {
        ...payroll.approvalFlow,
        rejectedBy: req.user._id,
        rejectedAt: new Date(),
        remarks,
      };

      // Save the changes
      await payroll.save();

      // Create notification for the employee
      await Notification.createPayrollNotification(
        payroll.employee,
        "PAYROLL_REJECTED",
        payroll,
        remarks
      );

      res.status(200).json({
        success: true,
        message: "Payroll rejected successfully",
        data: payroll,
      });
    } catch (error) {
      next(error);
    }
  }
}
