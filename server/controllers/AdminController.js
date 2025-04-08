import UserModel from "../models/User.js";
import PayrollModel from "../models/Payroll.js";
import { Permission, UserRole } from "../models/User.js";
import { PAYROLL_STATUS, PayrollFrequency } from "../models/Payroll.js";
import { PermissionChecker } from "../utils/permissionUtils.js";
import { Types } from "mongoose";
import { handleError, ApiError } from "../utils/errorHandler.js";
import { AuthService } from "../services/authService.js";
import Allowance from "../models/Allowance.js";
import { AllowanceStatus } from "../models/Allowance.js";
import Deduction from "../models/Deduction.js";
import { DeductionService } from "../services/DeductionService.js";
import { DeductionType, DeductionScope } from "../models/Deduction.js";
import DepartmentModel from "../models/Department.js";
import { v4 as uuidv4 } from "uuid";
import { EmailService } from "../services/EmailService.js";
import { PayrollService } from "../services/PayrollService.js";
import { NotificationService } from "../services/NotificationService.js";
import Notification from "../models/Notification.js";

export class AdminController {
  // ===== User Management Methods =====
  static async getAllEmployees(req, res, next) {
    try {
      // Get the admin's department
      const admin = await UserModel.findById(req.user.id);
      if (!admin?.department) {
        throw new ApiError(400, "Admin is not assigned to any department");
      }

      // Query parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || "";
      const status = req.query.status;

      // Build query - removed role filter to get both admins and users
      const query = {
        department: admin.department,
        $or: [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { employeeId: { $regex: search, $options: "i" } },
        ],
      };

      if (status) {
        query.status = status;
      }

      // Get total count for pagination
      const totalUsers = await UserModel.countDocuments(query);

      // Calculate skip value for pagination
      const skip = (page - 1) * limit;

      // Get paginated results
      const users = await UserModel.find(query)
        .select("-password")
        .populate("department", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Calculate total pages
      const totalPages = Math.ceil(totalUsers / limit);

      res.status(200).json({
        success: true,
        users,
        totalPages,
        totalUsers,
        currentPage: page,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getDepartmentUsers(req, res, next) {
    try {
      const admin = await UserModel.findById(req.user.id);
      if (!admin?.department) {
        throw new ApiError(400, "Admin is not assigned to any department");
      }

      const users = await UserModel.find({
        department: admin.department,
        role: UserRole.USER,
      })
        .select("-password")
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        users,
        count: users.length,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async createDepartmentUser(req, res, next) {
    try {
      if (!PermissionChecker.hasPermission(req.user, Permission.CREATE_USER)) {
        throw new ApiError(403, "Not authorized to create users");
      }

      const admin = await UserModel.findById(req.user.id);
      if (!admin?.department) {
        throw new ApiError(400, "Admin is not assigned to any department");
      }

      const userData = {
        ...req.body,
        department: admin.department,
        role: UserRole.USER,
        isEmailVerified: true,
        createdBy: req.user.id,
      };

      const { user } = await AuthService.createUser(userData);

      res.status(201).json({
        success: true,
        message: "User created successfully",
        user,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async updateDepartmentUser(req, res, next) {
    try {
      if (!PermissionChecker.hasPermission(req.user, Permission.EDIT_USER)) {
        throw new ApiError(403, "Not authorized to update users");
      }

      const admin = await UserModel.findById(req.user.id);
      const userToUpdate = await UserModel.findById(req.params.id);

      if (!admin?.department || !userToUpdate) {
        throw new ApiError(404, "User or department not found");
      }

      if (
        userToUpdate.department?.toString() !== admin.department?.toString()
      ) {
        throw new ApiError(403, "Cannot update user from another department");
      }

      if (req.body.role && req.body.role !== UserRole.USER) {
        throw new ApiError(400, "Cannot change user role");
      }

      if (req.body.department && req.body.department !== admin.department) {
        throw new ApiError(400, "Cannot change user's department");
      }

      const updatedUser = await UserModel.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          department: admin.department,
          updatedBy: req.user.id,
        },
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

  // ===== Payroll Management Methods =====
  static async getDepartmentPayroll(req, res, next) {
    try {
      const { department } = req.user;
      if (!department) {
        return res.status(400).json({
          success: false,
          message: "Admin must be assigned to a department to view payrolls",
        });
      }

      const {
        page = 1,
        limit = 10,
        startDate,
        endDate,
        status,
        employeeId,
      } = req.query;

      const query = { department };

      // Add date range filter if provided
      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      // Add status filter if provided
      if (status) {
        query.status = status;
      }

      // Add employee filter if provided
      if (employeeId) {
        query.employee = employeeId;
      }

      const payrolls = await PayrollModel.find(query)
        .populate("employee", "firstName lastName email employeeId")
        .populate("department", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await PayrollModel.countDocuments(query);

      return res.status(200).json({
        success: true,
        data: {
          payrolls,
          pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPayrollById(req, res, next) {
    try {
      const { id } = req.params;
      const admin = await UserModel.findById(req.user.id);

      if (!admin?.department) {
        throw new ApiError(400, "Admin is not assigned to any department");
      }

      // Validate that id is a valid ObjectId
      if (!Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid payroll ID format");
      }

      const payroll = await PayrollModel.findOne({
        _id: id,
        department: admin.department,
      })
        .populate("employee", "firstName lastName email")
        .populate("department", "name")
        .populate("salaryGrade", "name")
        .populate("approvalFlow.approvedBy", "firstName lastName")
        .populate("approvalFlow.rejectedBy", "firstName lastName")
        .populate("approvalFlow.submittedBy", "firstName lastName")
        .populate("processedBy", "firstName lastName");

      if (!payroll) {
        throw new ApiError(404, "Payroll not found in your department");
      }

      res.status(200).json({
        success: true,
        data: payroll,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createDepartmentPayroll(req, res, next) {
    try {
      const { department } = req.user;
      if (!department) {
        return res.status(400).json({
          success: false,
          message: "Admin must be assigned to a department to create payrolls",
        });
      }

      const {
        employeeId,
        month,
        year,
        basicSalary,
        allowances,
        deductions,
        bonuses,
        notes,
      } = req.body;

      // Validate employee belongs to admin's department
      const employee = await UserModel.findOne({
        _id: employeeId,
        department,
        role: UserRole.USER,
      });

      if (!employee) {
        return res.status(400).json({
          success: false,
          message: "Employee not found or not assigned to your department",
        });
      }

      // Check if payroll already exists for this employee and period
      const existingPayroll = await PayrollModel.findOne({
        employee: employeeId,
        month,
        year,
        department,
      });

      if (existingPayroll) {
        return res.status(400).json({
          success: false,
          message: "Payroll already exists for this employee and period",
        });
      }

      // Create new payroll
      const payroll = await PayrollModel.create({
        employee: employeeId,
        department,
        month,
        year,
        basicSalary,
        allowances: allowances || [],
        deductions: deductions || [],
        bonuses: bonuses || [],
        notes,
        status: "DRAFT",
        createdBy: req.user.id,
      });

      // Populate the created payroll
      const populatedPayroll = await PayrollModel.findById(payroll._id)
        .populate("employee", "firstName lastName email employeeId")
        .populate("department", "name");

      return res.status(201).json({
        success: true,
        message: "Payroll created successfully",
        data: populatedPayroll,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateDepartmentPayroll(req, res, next) {
    try {
      if (!PermissionChecker.hasPermission(req.user, Permission.EDIT_PAYROLL)) {
        throw new ApiError(403, "Not authorized to update payroll records");
      }

      const admin = await UserModel.findById(req.user.id);
      if (!admin?.department) {
        throw new ApiError(400, "Admin is not assigned to any department");
      }

      const payroll = await PayrollModel.findById(req.params.id);
      if (
        !payroll ||
        payroll.department.toString() !== admin.department.toString()
      ) {
        throw new ApiError(
          404,
          "Payroll record not found or not in your department"
        );
      }

      if (payroll.status === PAYROLL_STATUS.APPROVED) {
        throw new ApiError(400, "Cannot update approved payroll record");
      }

      const updatedPayroll = await PayrollModel.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          department: new Types.ObjectId(admin.department),
          updatedBy: new Types.ObjectId(req.user.id),
        },
        { new: true, runValidators: true }
      ).populate([
        { path: "employee", select: "firstName lastName employeeId" },
        { path: "updatedBy", select: "firstName lastName" },
      ]);

      res.status(200).json({
        success: true,
        message: "Payroll record updated successfully",
        payroll: updatedPayroll,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  // Get employee payroll history
  static async getEmployeePayrollHistory(req, res, next) {
    try {
      const { employeeId } = req.params;
      const admin = await UserModel.findById(req.user.id);

      if (!admin?.department) {
        throw new ApiError(400, "Admin is not assigned to any department");
      }

      // Verify employee belongs to admin's department
      const employee = await UserModel.findOne({
        _id: employeeId,
        department: admin.department,
      });

      if (!employee) {
        throw new ApiError(404, "Employee not found in your department");
      }

      const payrolls = await PayrollModel.find({
        employee: employeeId,
        department: admin.department,
      }).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: payrolls,
      });
    } catch (error) {
      next(error);
    }
  }

  // Approve payroll
  static async approvePayroll(req, res, next) {
    try {
      console.log("🔄 Approving payroll:", req.params.id);
      const { id } = req.params;
      const { remarks } = req.body;
      const admin = await UserModel.findById(req.user.id);

      if (!admin?.department) {
        console.error("❌ Admin is not assigned to any department");
        throw new ApiError(400, "Admin is not assigned to any department");
      }

      console.log(
        `👤 Admin approving payroll: ${admin.firstName} ${admin.lastName} (${admin._id})`
      );
      console.log(`🏢 Department: ${admin.department}`);

      const payroll = await PayrollModel.findOne({
        _id: id,
        department: admin.department,
      }).populate("employee");

      if (!payroll) {
        console.error(`❌ Payroll not found in department: ${id}`);
        throw new ApiError(404, "Payroll not found in your department");
      }

      console.log(
        `📋 Found payroll for employee: ${payroll.employee.firstName} ${payroll.employee.lastName} (${payroll.employee._id})`
      );

      if (payroll.status !== PAYROLL_STATUS.PENDING) {
        console.error(`❌ Payroll is not in PENDING status: ${payroll.status}`);
        throw new ApiError(400, "Only pending payrolls can be approved");
      }

      // Get employee's bank details
      const employee = await UserModel.findById(payroll.employee);
      if (
        !employee?.bankDetails?.accountName ||
        !employee?.bankDetails?.accountNumber ||
        !employee?.bankDetails?.bankName
      ) {
        console.error(
          `❌ Employee ${employee._id} has incomplete bank details`
        );
        throw new ApiError(
          400,
          "Employee bank details are incomplete. Please update bank details before approval."
        );
      }

      // Update payroll status and payment details
      console.log(`🔄 Updating payroll status to APPROVED: ${payroll._id}`);
      payroll.status = PAYROLL_STATUS.APPROVED;
      payroll.payment = {
        accountName: employee.bankDetails.accountName,
        accountNumber: employee.bankDetails.accountNumber,
        bankName: employee.bankDetails.bankName,
      };
      payroll.approvalFlow.push({
        status: PAYROLL_STATUS.APPROVED,
        approvedBy: admin._id,
        approvedAt: new Date(),
        remarks,
      });

      await payroll.save();
      console.log(`✅ Payroll status updated successfully`);

      // Send notification to employee
      console.log(
        `🔔 Creating notification for employee: ${payroll.employee._id}`
      );
      await NotificationService.createPayrollNotification(
        payroll.employee._id,
        "PAYROLL_APPROVED",
        payroll,
        remarks
      );

      console.log(`✅ Payroll approval completed successfully`);

      res.status(200).json({
        success: true,
        message: "Payroll approved successfully",
        data: payroll,
      });
    } catch (error) {
      console.error(`❌ Error approving payroll: ${error.message}`);
      next(error);
    }
  }

  // Reject payroll
  static async rejectPayroll(req, res, next) {
    try {
      console.log("🔄 Rejecting payroll:", req.params.id);
      const { id } = req.params;
      const { remarks } = req.body;
      const admin = await UserModel.findById(req.user.id);

      if (!admin?.department) {
        console.error("❌ Admin is not assigned to any department");
        throw new ApiError(400, "Admin is not assigned to any department");
      }

      console.log(
        `👤 Admin rejecting payroll: ${admin.firstName} ${admin.lastName} (${admin._id})`
      );
      console.log(`🏢 Department: ${admin.department}`);

      const payroll = await PayrollModel.findOne({
        _id: id,
        department: admin.department,
      }).populate("employee");

      if (!payroll) {
        console.error(`❌ Payroll not found in department: ${id}`);
        throw new ApiError(404, "Payroll not found in your department");
      }

      console.log(
        `📋 Found payroll for employee: ${payroll.employee.firstName} ${payroll.employee.lastName} (${payroll.employee._id})`
      );

      if (payroll.status !== PAYROLL_STATUS.PENDING) {
        console.error(`❌ Payroll is not in PENDING status: ${payroll.status}`);
        throw new ApiError(400, "Only pending payrolls can be rejected");
      }

      // Update payroll status
      console.log(`🔄 Updating payroll status to REJECTED: ${payroll._id}`);
      payroll.status = PAYROLL_STATUS.REJECTED;
      payroll.approvalFlow.push({
        status: PAYROLL_STATUS.REJECTED,
        rejectedBy: admin._id,
        rejectedAt: new Date(),
        remarks,
      });

      await payroll.save();
      console.log(`✅ Payroll status updated successfully`);

      // Send notification to employee
      console.log(
        `🔔 Creating notification for employee: ${payroll.employee._id}`
      );
      await NotificationService.createPayrollNotification(
        payroll.employee._id,
        "PAYROLL_REJECTED",
        payroll,
        remarks
      );

      console.log(`✅ Payroll rejection completed successfully`);

      res.status(200).json({
        success: true,
        message: "Payroll rejected successfully",
        data: payroll,
      });
    } catch (error) {
      console.error(`❌ Error rejecting payroll: ${error.message}`);
      next(error);
    }
  }

  // Process payment
  static async processPayment(req, res, next) {
    try {
      const { id } = req.params;
      const admin = await UserModel.findById(req.user.id);

      if (!admin?.department) {
        throw new ApiError(400, "Admin is not assigned to any department");
      }

      const payroll = await PayrollModel.findOne({
        _id: id,
        department: admin.department,
      });

      if (!payroll) {
        throw new ApiError(404, "Payroll not found in your department");
      }

      if (payroll.status !== PAYROLL_STATUS.APPROVED) {
        throw new ApiError(400, "Only approved payrolls can be processed");
      }

      payroll.status = PAYROLL_STATUS.PAID;
      payroll.paymentDetails = {
        processedBy: admin._id,
        processedAt: new Date(),
      };

      await payroll.save();

      res.status(200).json({
        success: true,
        message: "Payment processed successfully",
        data: payroll,
      });
    } catch (error) {
      next(error);
    }
  }

  // Submit payroll for approval
  static async submitPayroll(req, res, next) {
    try {
      const { id } = req.params;
      const { remarks } = req.body;
      const admin = await UserModel.findById(req.user.id);

      if (!admin?.department) {
        throw new ApiError(400, "Admin is not assigned to any department");
      }

      const payroll = await PayrollModel.findOne({
        _id: id,
        department: admin.department,
      });

      if (!payroll) {
        throw new ApiError(404, "Payroll not found in your department");
      }

      if (payroll.status !== PAYROLL_STATUS.DRAFT) {
        throw new ApiError(400, "Only draft payrolls can be submitted");
      }

      // Validate required fields
      if (!payroll.basicSalary || !payroll.month || !payroll.year) {
        throw new ApiError(400, "Payroll is missing required fields");
      }

      // Update payroll status and add submission details
      payroll.status = PAYROLL_STATUS.PENDING;
      payroll.approvalFlow = payroll.approvalFlow || [];
      payroll.approvalFlow.push({
        status: PAYROLL_STATUS.PENDING,
        submittedBy: req.user.id,
        submittedAt: new Date(),
        remarks: remarks || "Submitted for approval",
      });

      await payroll.save();

      // Populate the updated payroll
      const updatedPayroll = await PayrollModel.findById(payroll._id)
        .populate("employee", "firstName lastName email employeeId")
        .populate("department", "name")
        .populate("approvalFlow.submittedBy", "firstName lastName");

      res.status(200).json({
        success: true,
        message: "Payroll submitted successfully",
        data: updatedPayroll,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get payroll periods
  static async getDepartmentPayrollPeriods(req, res) {
    try {
      const admin = await UserModel.findById(req.user.id);
      if (!admin?.department) {
        throw new ApiError(400, "Admin is not assigned to any department");
      }

      const periods = await PayrollModel.aggregate([
        {
          $match: {
            department: admin.department,
          },
        },
        {
          $group: {
            _id: {
              year: "$year",
              month: "$month",
            },
            count: { $sum: 1 },
            totalAmount: { $sum: "$netPay" },
            statuses: { $addToSet: "$status" },
          },
        },
        {
          $project: {
            _id: 0,
            year: "$_id.year",
            month: "$_id.month",
            count: 1,
            totalAmount: 1,
            statuses: 1,
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

  // Get payroll stats
  static async getPayrollStats(req, res, next) {
    try {
      const admin = await UserModel.findById(req.user.id);
      if (!admin?.department) {
        throw new ApiError(400, "Admin is not assigned to any department");
      }

      const stats = await PayrollModel.aggregate([
        {
          $match: {
            department: new Types.ObjectId(admin.department),
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalAmount: { $sum: "$totals.netPay" },
          },
        },
      ]);

      const formattedStats = {
        PENDING: 0,
        APPROVED: 0,
        REJECTED: 0,
        PAID: 0,
        total: 0,
        totalAmount: 0,
      };

      stats.forEach((stat) => {
        formattedStats[stat._id] = stat.count;
        formattedStats.total += stat.count;
        if (stat._id === "PAID") {
          formattedStats.totalAmount += stat.totalAmount || 0;
        }
      });

      res.status(200).json({
        success: true,
        data: formattedStats,
      });
    } catch (error) {
      next(error);
    }
  }

  // View payslip
  static async viewPayslip(req, res, next) {
    try {
      const { employeeId } = req.params;
      const admin = await UserModel.findById(req.user.id);

      if (!admin?.department) {
        throw new ApiError(400, "Admin is not assigned to any department");
      }

      // Verify employee belongs to admin's department
      const employee = await UserModel.findOne({
        _id: employeeId,
        department: admin.department,
      });

      if (!employee) {
        throw new ApiError(404, "Employee not found in your department");
      }

      const payroll = await PayrollModel.findOne({
        employee: employeeId,
        department: admin.department,
        status: PAYROLL_STATUS.PAID,
      }).sort({ createdAt: -1 });

      if (!payroll) {
        throw new ApiError(404, "No paid payroll found for this employee");
      }

      res.status(200).json({
        success: true,
        data: payroll,
      });
    } catch (error) {
      next(error);
    }
  }

  // ===== Salary Structure & Allowances Management =====
  static async getDepartmentAllowances(req, res) {
    try {
      if (
        !PermissionChecker.hasPermission(req.user, Permission.VIEW_ALLOWANCES)
      ) {
        throw new ApiError(403, "Not authorized to view allowances");
      }

      const allowances = await Allowance.find({
        department: req.user.department,
        scope: { $in: ["department", "grade"] },
      })
        .populate("department", "name")
        .populate("salaryGrade", "level basicSalary")
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: allowances,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async createDepartmentAllowance(req, res) {
    try {
      if (
        !PermissionChecker.hasPermission(req.user, Permission.CREATE_ALLOWANCES)
      ) {
        throw new ApiError(403, "Not authorized to create allowances");
      }

      const allowance = await Allowance.create({
        ...req.body,
        department: req.user.department,
        scope: "department",
        createdBy: req.user._id,
        updatedBy: req.user._id,
      });

      res.status(201).json({
        success: true,
        data: allowance,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async getAllowanceDetails(req, res) {
    try {
      if (
        !PermissionChecker.hasPermission(req.user, Permission.VIEW_ALLOWANCES)
      ) {
        throw new ApiError(403, "Not authorized to view allowance details");
      }

      const allowance = await Allowance.findOne({
        _id: req.params.id,
        department: req.user.department,
      })
        .populate("department", "name")
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
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async updateDepartmentAllowance(req, res) {
    try {
      if (
        !PermissionChecker.hasPermission(req.user, Permission.EDIT_ALLOWANCES)
      ) {
        throw new ApiError(403, "Not authorized to update allowances");
      }

      const allowance = await Allowance.findOneAndUpdate(
        {
          _id: req.params.id,
          department: req.user.department,
          scope: "department",
        },
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
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async approveAllowance(req, res) {
    try {
      if (
        !PermissionChecker.hasPermission(
          req.user,
          Permission.APPROVE_ALLOWANCES
        )
      ) {
        throw new ApiError(403, "Not authorized to approve allowances");
      }

      const allowance = await Allowance.findOneAndUpdate(
        {
          _id: req.params.id,
          department: req.user.department,
        },
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
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async rejectAllowance(req, res) {
    try {
      if (
        !PermissionChecker.hasPermission(
          req.user,
          Permission.APPROVE_ALLOWANCES
        )
      ) {
        throw new ApiError(403, "Not authorized to reject allowances");
      }

      const { rejectionReason } = req.body;

      const allowance = await Allowance.findOneAndUpdate(
        {
          _id: req.params.id,
          department: req.user.department,
        },
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
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  // ===== Deduction Management Methods =====
  static async getAllDeductions(req, res) {
    try {
      console.log("🔍 Fetching all deductions for admin");
      const adminId = req.user.id;
      console.log("Admin ID:", adminId);

      // Get the admin's department
      const admin = await UserModel.findById(adminId);
      if (!admin || !admin.department) {
        console.log("❌ Admin or department not found");
        throw new ApiError(404, "Admin department not found");
      }

      const departmentId = admin.department;
      console.log("Department ID:", departmentId);

      // Get all deductions
      console.log("Fetching all deductions from DeductionService");
      const deductions = await DeductionService.getAllDeductions();
      console.log("Raw deductions:", JSON.stringify(deductions, null, 2));

      // Return all deductions without filtering
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

  static async getDepartmentDeductions(req, res) {
    try {
      console.log("🔍 Fetching department deductions");
      const adminId = req.user.id;

      // Get the admin's department
      const admin = await UserModel.findById(adminId);
      if (!admin || !admin.department) {
        throw new ApiError(404, "Admin department not found");
      }

      const departmentId = admin.department;

      // Get deductions for the department
      const deductions = await DeductionService.getDepartmentDeductions(
        departmentId
      );

      res.status(200).json({
        success: true,
        data: deductions,
      });
    } catch (error) {
      console.error("❌ Error fetching department deductions:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async createDepartmentDeduction(req, res) {
    try {
      console.log("🔄 Creating department-specific deduction");
      const adminId = req.user.id;

      // Get the admin's department
      const admin = await UserModel.findById(adminId);
      if (!admin || !admin.department) {
        throw new ApiError(404, "Admin department not found");
      }

      const departmentId = admin.department;

      // Create the deduction with department scope
      const deductionData = {
        ...req.body,
        scope: DeductionScope.DEPARTMENT,
        department: departmentId,
        isActive: true,
        createdBy: adminId,
        updatedBy: adminId,
      };

      const deduction = await DeductionService.createDepartmentDeduction(
        adminId,
        departmentId,
        deductionData
      );

      res.status(201).json({
        success: true,
        message: "Department-specific deduction created successfully",
        data: deduction,
      });
    } catch (error) {
      console.error("❌ Error creating department-specific deduction:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  static async createVoluntaryDeduction(req, res) {
    try {
      console.log("🔄 Creating voluntary deduction");
      const adminId = req.user.id;

      // Get the admin's department
      const admin = await UserModel.findById(adminId);
      if (!admin || !admin.department) {
        throw new ApiError(404, "Admin department not found");
      }

      const departmentId = admin.department;

      // Create the deduction with department scope
      const deductionData = {
        ...req.body,
        scope: DeductionScope.DEPARTMENT,
        department: departmentId,
        type: DeductionType.VOLUNTARY,
        isActive: true,
        createdBy: adminId,
        updatedBy: adminId,
      };

      const deduction = await DeductionService.createVoluntaryDeduction(
        adminId,
        deductionData
      );

      res.status(201).json({
        success: true,
        message: "Voluntary deduction created successfully",
        data: deduction,
      });
    } catch (error) {
      console.error("❌ Error creating voluntary deduction:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  static async updateDeduction(req, res) {
    try {
      console.log("🔄 Updating deduction");
      const adminId = req.user.id;
      const deductionId = req.params.id;

      // Get the admin's department
      const admin = await UserModel.findById(adminId);
      if (!admin || !admin.department) {
        throw new ApiError(404, "Admin department not found");
      }

      const departmentId = admin.department;

      // Check if the deduction belongs to the admin's department
      const deduction = await Deduction.findById(deductionId);
      if (!deduction) {
        throw new ApiError(404, "Deduction not found");
      }

      if (
        deduction.scope !== DeductionScope.DEPARTMENT ||
        deduction.department.toString() !== departmentId.toString()
      ) {
        throw new ApiError(
          403,
          "You don't have permission to update this deduction"
        );
      }

      // Update the deduction
      const updatedDeduction = await Deduction.findByIdAndUpdate(
        deductionId,
        {
          ...req.body,
          updatedBy: adminId,
        },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: "Deduction updated successfully",
        data: updatedDeduction,
      });
    } catch (error) {
      console.error("❌ Error updating deduction:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  static async toggleDeductionStatus(req, res) {
    try {
      console.log("🔄 Toggling deduction status");
      const adminId = req.user.id;
      const deductionId = req.params.id;

      // Get the admin's department
      const admin = await UserModel.findById(adminId);
      if (!admin || !admin.department) {
        throw new ApiError(404, "Admin department not found");
      }

      const departmentId = admin.department;

      // Check if the deduction belongs to the admin's department
      const deduction = await Deduction.findById(deductionId);
      if (!deduction) {
        throw new ApiError(404, "Deduction not found");
      }

      if (
        deduction.scope !== DeductionScope.DEPARTMENT ||
        deduction.department.toString() !== departmentId.toString()
      ) {
        throw new ApiError(
          403,
          "You don't have permission to toggle this deduction"
        );
      }

      // Toggle the deduction status
      const result = await DeductionService.toggleDeductionStatus(
        deductionId,
        adminId
      );

      res.status(200).json({
        success: true,
        message: `Deduction ${
          result.deduction.isActive ? "activated" : "deactivated"
        } successfully`,
        data: result,
      });
    } catch (error) {
      console.error("❌ Error toggling deduction status:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  static async deleteDeduction(req, res) {
    try {
      console.log("🗑️ Deleting deduction");
      const adminId = req.user.id;
      const deductionId = req.params.id;

      // Get the admin's department
      const admin = await UserModel.findById(adminId);
      if (!admin || !admin.department) {
        throw new ApiError(404, "Admin department not found");
      }

      const departmentId = admin.department;

      // Check if the deduction belongs to the admin's department
      const deduction = await Deduction.findById(deductionId);
      if (!deduction) {
        throw new ApiError(404, "Deduction not found");
      }

      if (
        deduction.scope !== DeductionScope.DEPARTMENT ||
        deduction.department.toString() !== departmentId.toString()
      ) {
        throw new ApiError(
          403,
          "You don't have permission to delete this deduction"
        );
      }

      // Delete the deduction
      await Deduction.findByIdAndDelete(deductionId);

      res.status(200).json({
        success: true,
        message: "Deduction deleted successfully",
      });
    } catch (error) {
      console.error("❌ Error deleting deduction:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  static async assignDeductionToEmployee(req, res) {
    try {
      console.log("🔄 Assigning deduction to employee");
      const adminId = req.user.id;
      const { deductionId, employeeId } = req.params;

      // Get the admin's department
      const admin = await UserModel.findById(adminId);
      if (!admin || !admin.department) {
        throw new ApiError(404, "Admin department not found");
      }

      const departmentId = admin.department;

      // Check if the deduction belongs to the admin's department
      const deduction = await Deduction.findById(deductionId);
      if (!deduction) {
        throw new ApiError(404, "Deduction not found");
      }

      if (
        deduction.scope !== DeductionScope.DEPARTMENT ||
        deduction.department.toString() !== departmentId.toString()
      ) {
        throw new ApiError(
          403,
          "You don't have permission to assign this deduction"
        );
      }

      // Check if the employee belongs to the admin's department
      const employee = await UserModel.findById(employeeId);
      if (
        !employee ||
        !employee.department ||
        employee.department.toString() !== departmentId.toString()
      ) {
        throw new ApiError(
          403,
          "You don't have permission to assign deductions to this employee"
        );
      }

      // Assign the deduction to the employee
      const result = await DeductionService.assignDeductionToEmployee(
        deductionId,
        employeeId,
        adminId
      );

      res.status(200).json({
        success: true,
        message: "Deduction assigned to employee successfully",
        data: result,
      });
    } catch (error) {
      console.error("❌ Error assigning deduction to employee:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  static async removeDeductionFromEmployee(req, res) {
    try {
      console.log("🔄 Removing deduction from employee");
      const adminId = req.user.id;
      const { deductionId, employeeId } = req.params;

      // Get the admin's department
      const admin = await UserModel.findById(adminId);
      if (!admin || !admin.department) {
        throw new ApiError(404, "Admin department not found");
      }

      const departmentId = admin.department;

      // Check if the deduction belongs to the admin's department
      const deduction = await Deduction.findById(deductionId);
      if (!deduction) {
        throw new ApiError(404, "Deduction not found");
      }

      if (
        deduction.scope !== DeductionScope.DEPARTMENT ||
        deduction.department.toString() !== departmentId.toString()
      ) {
        throw new ApiError(
          403,
          "You don't have permission to remove this deduction"
        );
      }

      // Check if the employee belongs to the admin's department
      const employee = await UserModel.findById(employeeId);
      if (
        !employee ||
        !employee.department ||
        employee.department.toString() !== departmentId.toString()
      ) {
        throw new ApiError(
          403,
          "You don't have permission to remove deductions from this employee"
        );
      }

      // Remove the deduction from the employee
      const result = await DeductionService.removeDeductionFromEmployee(
        deductionId,
        employeeId,
        adminId
      );

      res.status(200).json({
        success: true,
        message: "Deduction removed from employee successfully",
        data: result,
      });
    } catch (error) {
      console.error("❌ Error removing deduction from employee:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  static async getEmployeeDeductions(req, res) {
    try {
      console.log("🔍 Fetching employee deductions");
      const adminId = req.user.id;
      const { employeeId } = req.params;

      // Get the admin's department
      const admin = await UserModel.findById(adminId);
      if (!admin || !admin.department) {
        throw new ApiError(404, "Admin department not found");
      }

      const departmentId = admin.department;

      // Check if the employee belongs to the admin's department
      const employee = await UserModel.findById(employeeId);
      if (
        !employee ||
        !employee.department ||
        employee.department.toString() !== departmentId.toString()
      ) {
        throw new ApiError(
          403,
          "You don't have permission to view deductions for this employee"
        );
      }

      // Get the employee's deductions
      const deductions = await DeductionService.getEmployeeDeductions(
        employeeId
      );

      res.status(200).json({
        success: true,
        data: deductions,
      });
    } catch (error) {
      console.error("❌ Error fetching employee deductions:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  static async assignDeductionToMultipleEmployees(req, res) {
    try {
      console.log("🔄 Assigning deduction to multiple employees");
      const adminId = req.user.id;
      const { deductionId } = req.params;
      const { employeeIds } = req.body;

      if (
        !employeeIds ||
        !Array.isArray(employeeIds) ||
        employeeIds.length === 0
      ) {
        throw new ApiError(400, "Employee IDs array is required");
      }

      // Get the admin's department
      const admin = await UserModel.findById(adminId);
      if (!admin || !admin.department) {
        throw new ApiError(404, "Admin department not found");
      }

      const departmentId = admin.department;

      // Check if the deduction belongs to the admin's department
      const deduction = await Deduction.findById(deductionId);
      if (!deduction) {
        throw new ApiError(404, "Deduction not found");
      }

      if (
        deduction.scope !== DeductionScope.DEPARTMENT ||
        deduction.department.toString() !== departmentId.toString()
      ) {
        throw new ApiError(
          403,
          "You don't have permission to assign this deduction"
        );
      }

      // Check if all employees belong to the admin's department
      const employees = await UserModel.find({ _id: { $in: employeeIds } });
      const invalidEmployees = employees.filter(
        (emp) =>
          !emp.department ||
          emp.department.toString() !== departmentId.toString()
      );

      if (invalidEmployees.length > 0) {
        throw new ApiError(
          403,
          "You don't have permission to assign deductions to some of these employees"
        );
      }

      // Assign the deduction to the employees
      const result = await DeductionService.assignDeductionToMultipleEmployees(
        deductionId,
        employeeIds,
        adminId
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      console.error(
        "❌ Error assigning deduction to multiple employees:",
        error
      );
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  static async removeDeductionFromMultipleEmployees(req, res) {
    try {
      console.log("🔄 Removing deduction from multiple employees");
      const adminId = req.user.id;
      const { deductionId } = req.params;
      const { employeeIds } = req.body;

      if (
        !employeeIds ||
        !Array.isArray(employeeIds) ||
        employeeIds.length === 0
      ) {
        throw new ApiError(400, "Employee IDs array is required");
      }

      // Get the admin's department
      const admin = await UserModel.findById(adminId);
      if (!admin || !admin.department) {
        throw new ApiError(404, "Admin department not found");
      }

      const departmentId = admin.department;

      // Check if the deduction belongs to the admin's department
      const deduction = await Deduction.findById(deductionId);
      if (!deduction) {
        throw new ApiError(404, "Deduction not found");
      }

      if (
        deduction.scope !== DeductionScope.DEPARTMENT ||
        deduction.department.toString() !== departmentId.toString()
      ) {
        throw new ApiError(
          403,
          "You don't have permission to remove this deduction"
        );
      }

      // Check if all employees belong to the admin's department
      const employees = await UserModel.find({ _id: { $in: employeeIds } });
      const invalidEmployees = employees.filter(
        (emp) =>
          !emp.department ||
          emp.department.toString() !== departmentId.toString()
      );

      if (invalidEmployees.length > 0) {
        throw new ApiError(
          403,
          "You don't have permission to remove deductions from some of these employees"
        );
      }

      // Remove the deduction from the employees
      const result =
        await DeductionService.removeDeductionFromMultipleEmployees(
          deductionId,
          employeeIds,
          adminId
        );

      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      console.error(
        "❌ Error removing deduction from multiple employees:",
        error
      );
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  // Get department-specific chart statistics for admin users
  static async getDepartmentChartStats(req, res) {
    try {
      const adminUser = req.user;
      const departmentId = adminUser.department;

      if (!departmentId) {
        return res.status(400).json({
          success: false,
          message: "Admin user does not have an assigned department",
        });
      }

      // Get department details
      const department = await DepartmentModel.findById(departmentId).lean();
      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }

      // Get employee counts by role
      const [totalCount, adminCount, userCount] = await Promise.all([
        UserModel.countDocuments({
          department: departmentId,
          status: { $ne: "archived" },
        }),
        UserModel.countDocuments({
          department: departmentId,
          role: UserRole.ADMIN,
          status: { $ne: "archived" },
        }),
        UserModel.countDocuments({
          department: departmentId,
          role: UserRole.USER,
          status: { $ne: "archived" },
        }),
      ]);

      // Get employee status counts
      const [activeCount, pendingCount, onLeaveCount] = await Promise.all([
        UserModel.countDocuments({
          department: departmentId,
          status: "active",
          role: UserRole.USER,
        }),
        UserModel.countDocuments({
          department: departmentId,
          status: "pending",
          role: UserRole.USER,
        }),
        UserModel.countDocuments({
          department: departmentId,
          status: "on_leave",
          role: UserRole.USER,
        }),
      ]);

      // Get monthly growth data for the last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyData = await UserModel.aggregate([
        {
          $match: {
            department: new Types.ObjectId(departmentId),
            createdAt: { $gte: sixMonthsAgo },
            role: UserRole.USER,
            status: { $ne: "archived" },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1 },
        },
      ]);

      // Format monthly data
      const months = [];
      const monthlyStats = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthName = d.toLocaleString("default", { month: "short" });
        months.push(monthName);

        const monthData = monthlyData.find(
          (data) =>
            data._id.month === d.getMonth() + 1 &&
            data._id.year === d.getFullYear()
        );

        monthlyStats.push(monthData ? monthData.count : 0);
      }

      // Return the chart data
      return res.status(200).json({
        success: true,
        data: {
          departmentStats: {
            labels: ["Total", "Active", "Pending", "On Leave"],
            datasets: [
              {
                label: "Employee Status",
                data: [totalCount, activeCount, pendingCount, onLeaveCount],
                backgroundColor: [
                  "rgba(75, 192, 192, 0.5)",
                  "rgba(54, 162, 235, 0.5)",
                  "rgba(255, 206, 86, 0.5)",
                  "rgba(255, 99, 132, 0.5)",
                ],
                borderColor: [
                  "rgba(75, 192, 192, 1)",
                  "rgba(54, 162, 235, 1)",
                  "rgba(255, 206, 86, 1)",
                  "rgba(255, 99, 132, 1)",
                ],
                borderWidth: 1,
              },
            ],
          },
          roleDistribution: {
            labels: ["Admins", "Regular Users"],
            datasets: [
              {
                label: "Role Distribution",
                data: [adminCount, userCount],
                backgroundColor: [
                  "rgba(255, 206, 86, 0.5)",
                  "rgba(54, 162, 235, 0.5)",
                ],
                borderColor: ["rgba(255, 206, 86, 1)", "rgba(54, 162, 235, 1)"],
                borderWidth: 1,
              },
            ],
          },
          monthlyGrowth: {
            labels: months,
            datasets: [
              {
                label: "Monthly Growth",
                data: monthlyStats,
                borderColor: "rgba(75, 192, 192, 1)",
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                tension: 0.4,
              },
            ],
          },
        },
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async getEmployeeById(req, res, next) {
    try {
      if (
        !PermissionChecker.hasPermission(req.user, Permission.VIEW_ALL_USERS)
      ) {
        throw new ApiError(403, "Not authorized to view employee details");
      }

      const admin = await UserModel.findById(req.user.id);
      if (!admin?.department) {
        throw new ApiError(400, "Admin is not assigned to any department");
      }

      const employee = await UserModel.findById(req.params.id)
        .select("-password")
        .populate([
          { path: "department", select: "name" },
          { path: "salaryGrade", select: "level basicSalary" },
        ]);

      if (!employee) {
        throw new ApiError(404, "Employee not found");
      }

      // Check if employee belongs to admin's department
      if (employee.department?.toString() !== admin.department?.toString()) {
        throw new ApiError(
          403,
          "Cannot access employee from another department"
        );
      }

      res.status(200).json({
        success: true,
        employee,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async createEmployee(req, res, next) {
    try {
      if (!PermissionChecker.hasPermission(req.user, Permission.CREATE_USER)) {
        throw new ApiError(403, "Not authorized to create employees");
      }

      const admin = await UserModel.findById(req.user.id);
      if (!admin?.department) {
        throw new ApiError(400, "Admin is not assigned to any department");
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

      const prefix = "EMP"; // Always EMP for regular employees
      const employeeId = `${prefix}${day}${month}${sequentialNumber}`;

      // Generate invitation token
      const invitationToken = uuidv4();
      const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Ensure the employee is created in the admin's department
      const employeeData = {
        ...req.body,
        employeeId,
        department: admin.department,
        role: UserRole.USER,
        status: "pending",
        invitationToken,
        invitationExpires,
        createdBy: req.user.id,
      };

      // Send the invitation email
      try {
        await EmailService.sendInvitationEmail(
          employeeData.email,
          invitationToken,
          UserRole.USER
        );
      } catch (emailError) {
        console.error("Failed to send invitation email:", emailError);
        throw new ApiError(
          500,
          "Failed to send invitation email. Employee not created."
        );
      }

      // Create the employee after successful email sending
      const employee = await UserModel.create(employeeData);

      // Remove sensitive data from response
      const employeeResponse = employee.toObject();
      delete employeeResponse.password;
      delete employeeResponse.invitationToken;

      res.status(201).json({
        success: true,
        message: "Employee created successfully. Invitation sent.",
        employee: employeeResponse,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async updateEmployee(req, res, next) {
    try {
      if (!PermissionChecker.hasPermission(req.user, Permission.EDIT_USER)) {
        throw new ApiError(403, "Not authorized to update employees");
      }

      const admin = await UserModel.findById(req.user.id);
      const employeeToUpdate = await UserModel.findById(req.params.id);

      if (!admin?.department || !employeeToUpdate) {
        throw new ApiError(404, "Employee or department not found");
      }

      // Check if employee belongs to admin's department
      if (
        employeeToUpdate.department?.toString() !== admin.department?.toString()
      ) {
        throw new ApiError(
          403,
          "Cannot update employee from another department"
        );
      }

      // Prevent changing role or department
      if (req.body.role && req.body.role !== UserRole.USER) {
        throw new ApiError(400, "Cannot change employee role");
      }

      if (req.body.department && req.body.department !== admin.department) {
        throw new ApiError(400, "Cannot change employee's department");
      }

      const updatedEmployee = await UserModel.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          department: admin.department,
          updatedBy: req.user.id,
        },
        { new: true, runValidators: true }
      ).select("-password");

      res.status(200).json({
        success: true,
        message: "Employee updated successfully",
        employee: updatedEmployee,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async deleteEmployee(req, res, next) {
    try {
      if (!PermissionChecker.hasPermission(req.user, Permission.DELETE_USER)) {
        throw new ApiError(403, "Not authorized to delete employees");
      }

      const admin = await UserModel.findById(req.user.id);
      const employeeToDelete = await UserModel.findById(req.params.id);

      if (!admin?.department || !employeeToDelete) {
        throw new ApiError(404, "Employee or department not found");
      }

      // Check if employee belongs to admin's department
      if (
        employeeToDelete.department?.toString() !== admin.department?.toString()
      ) {
        throw new ApiError(
          403,
          "Cannot delete employee from another department"
        );
      }

      // Soft delete by updating status
      await UserModel.findByIdAndUpdate(req.params.id, {
        status: "inactive",
        updatedBy: req.user.id,
      });

      res.status(200).json({
        success: true,
        message: "Employee deleted successfully",
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async getDepartmentEmployees(req, res, next) {
    try {
      if (
        !PermissionChecker.hasPermission(req.user, Permission.VIEW_ALL_USERS)
      ) {
        throw new ApiError(403, "Not authorized to view department employees");
      }

      const admin = await UserModel.findById(req.user.id);
      if (!admin?.department) {
        throw new ApiError(400, "Admin is not assigned to any department");
      }

      const departmentId = req.params.id;

      // Check if admin is trying to access their own department
      if (departmentId !== admin.department.toString()) {
        throw new ApiError(
          403,
          "Cannot access employees from another department"
        );
      }

      const { page = 1, limit = 10, search, status } = req.query;
      const query = {
        department: departmentId,
        role: UserRole.USER,
      };

      // Add search filter if provided
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { employeeId: { $regex: search, $options: "i" } },
        ];
      }

      // Add status filter if provided
      if (status) {
        query.status = status;
      }

      // Calculate skip value for pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitValue = parseInt(limit);

      // Get total count for pagination
      const totalEmployees = await UserModel.countDocuments(query);

      // Get paginated employees
      const employees = await UserModel.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitValue)
        .populate([
          { path: "department", select: "name" },
          { path: "salaryGrade", select: "level basicSalary" },
        ]);

      // Calculate total pages
      const totalPages = Math.ceil(totalEmployees / limitValue);

      res.status(200).json({
        success: true,
        employees,
        totalPages,
        totalEmployees,
        currentPage: parseInt(page),
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async getTestEmployees(req, res, next) {
    try {
      // Get the admin's department
      const admin = await UserModel.findById(req.user.id);
      if (!admin?.department) {
        throw new ApiError(400, "Admin is not assigned to any department");
      }

      // Simple query to get employees in admin's department
      const employees = await UserModel.find({
        department: admin.department,
        role: UserRole.USER,
      })
        .select("-password")
        .populate("department", "name")
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        count: employees.length,
        employees,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async calculateEmployeePayroll(employee, month, year) {
    // Get employee's allowances
    const allowances = await Allowance.find({
      $or: [
        { employee: employee._id },
        { department: employee.department, scope: "department" },
      ],
      isActive: true,
    });

    // Get employee's deductions
    const deductions = await Deduction.find({
      $or: [
        { employee: employee._id },
        { department: employee.department, scope: "department" },
      ],
      isActive: true,
    });

    // Calculate totals
    const basicSalary = employee.salaryGrade?.basicSalary || 0;
    const totalAllowances = allowances.reduce((sum, a) => sum + a.amount, 0);
    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
    const grossPay = basicSalary + totalAllowances;
    const netPay = grossPay - totalDeductions;

    return {
      allowances,
      deductions,
      totals: {
        basicSalary,
        totalAllowances,
        totalDeductions,
        grossPay,
        netPay,
      },
    };
  }

  static async processSingleEmployeePayroll(req, res, next) {
    try {
      console.log("🔄 Processing single employee payroll:", req.body);
      const { employeeId, month, year, frequency, salaryGrade } = req.body;
      const admin = await UserModel.findById(req.user.id);

      if (!admin?.department) {
        console.error("❌ Admin is not assigned to any department");
        throw new ApiError(400, "Admin is not assigned to any department");
      }

      console.log(
        `👤 Admin processing payroll: ${admin.firstName} ${admin.lastName} (${admin._id})`
      );
      console.log(`🏢 Department: ${admin.department}`);

      // Get employee
      const employee = await UserModel.findOne({
        _id: employeeId,
        department: admin.department,
        status: "active",
      });

      if (!employee) {
        console.error(
          `❌ Employee not found or not active in department: ${employeeId}`
        );
        throw new ApiError(
          404,
          "Employee not found or not active in your department"
        );
      }

      console.log(
        `👤 Employee found: ${employee.firstName} ${employee.lastName} (${employee._id})`
      );

      // Calculate payroll using the salary grade from request body
      console.log(
        `🧮 Calculating payroll for employee ${employeeId} with salary grade ${salaryGrade}`
      );
      const payrollData = await PayrollService.calculatePayroll(
        employeeId,
        salaryGrade,
        month,
        year,
        frequency.toLowerCase()
      );

      console.log(
        `✅ Payroll calculated successfully. Net pay: ${payrollData.totals.netPay}`
      );

      // Create payroll with correct approvalFlow structure
      const payroll = await PayrollModel.create({
        ...payrollData,
        employee: employeeId,
        department: admin.department,
        status: PAYROLL_STATUS.DRAFT, // Always start with DRAFT status
        createdBy: admin._id,
        updatedBy: admin._id,
        processedBy: admin._id,
        payment: {
          accountName: "Pending",
          accountNumber: "Pending",
          bankName: "Pending",
        },
        approvalFlow: {
          submittedBy: admin._id,
          submittedAt: new Date(),
          status: PAYROLL_STATUS.DRAFT,
          remarks: "Initial payroll creation",
        },
      });

      console.log(`✅ Payroll created with ID: ${payroll._id}`);

      // Create notification for the employee using NotificationService
      console.log(`🔔 Creating notification for employee: ${employeeId}`);
      await NotificationService.createPayrollNotification(
        employeeId,
        "PAYROLL_CREATED",
        payroll
      );

      // Create notification for the admin
      console.log(`🔔 Creating notification for admin: ${admin._id}`);
      await NotificationService.createPayrollNotification(
        admin._id,
        "PAYROLL_DRAFT_CREATED",
        payroll
      );

      console.log(
        `✅ Payroll processing completed successfully for employee: ${employeeId}`
      );

      return res.status(201).json({
        success: true,
        message: "Payroll processed successfully",
        data: payroll,
      });
    } catch (error) {
      console.error(`❌ Error processing payroll: ${error.message}`);

      // If it's already an ApiError, just pass it to next
      if (error instanceof ApiError) {
        next(error);
        return;
      }

      // For other errors, create a new ApiError with a clear message
      next(new ApiError(500, `Failed to process payroll: ${error.message}`));
    }
  }

  static async processMultipleEmployeesPayroll(req, res, next) {
    try {
      console.log("🔄 Processing multiple employees payroll:", req.body);
      const { month, year, frequency, employeeSalaryGrades } = req.body;
      const adminId = req.user.id;

      // Get admin's department
      const admin = await UserModel.findById(adminId).populate("department");
      if (!admin || !admin.department) {
        console.error("❌ Admin is not assigned to any department");
        throw new ApiError(400, "Admin must be assigned to a department");
      }

      console.log(
        `👤 Admin processing payrolls: ${admin.firstName} ${admin.lastName} (${admin._id})`
      );
      console.log(
        `🏢 Department: ${admin.department.name} (${admin.department._id})`
      );

      const results = {
        total: employeeSalaryGrades.length,
        processed: 0,
        skipped: 0,
        failed: 0,
        errors: [],
        successful: [],
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
            department: admin.department._id,
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
            continue;
          }

          // Calculate payroll for this employee
          console.log(`🧮 Calculating payroll for employee ${employeeId}`);
          const payrollData = await PayrollService.calculatePayroll(
            employeeId,
            salaryGradeId,
            month,
            year,
            frequency,
            admin.department._id
          );

          if (payrollData) {
            // Create payroll record
            const payroll = await PayrollModel.create({
              ...payrollData,
              status: PAYROLL_STATUS.DRAFT, // Start with DRAFT status for consistency
              processedBy: adminId,
              createdBy: adminId,
              updatedBy: adminId,
              payment: {
                accountName: "Pending",
                accountNumber: "Pending",
                bankName: "Pending",
              },
              approvalFlow: {
                submittedBy: adminId,
                submittedAt: new Date(),
                status: PAYROLL_STATUS.DRAFT,
                remarks: "Initial payroll creation",
              },
            });

            console.log(`✅ Payroll created with ID: ${payroll._id}`);

            // Create notification for the employee
            console.log(`🔔 Creating notification for employee: ${employeeId}`);
            await NotificationService.createPayrollNotification(
              employeeId,
              "PAYROLL_CREATED",
              payroll
            );

            // Create notification for the admin
            console.log(`🔔 Creating notification for admin: ${adminId}`);
            await NotificationService.createPayrollNotification(
              adminId,
              "PAYROLL_DRAFT_CREATED",
              payroll
            );

            results.processed++;
            results.successful.push({
              employeeId,
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
        }
      }

      console.log(`\n📊 Payroll processing summary:`);
      console.log(`- Total employees: ${results.total}`);
      console.log(`- Successfully processed: ${results.processed}`);
      console.log(`- Skipped: ${results.skipped}`);
      console.log(`- Failed: ${results.failed}`);

      res.status(200).json({
        success: true,
        message: "Multiple employee payrolls processed",
        data: results,
      });
    } catch (error) {
      console.error(`❌ Error processing multiple payrolls: ${error.message}`);
      next(error);
    }
  }
  static async processDepartmentPayroll(req, res) {
    try {
      console.log("🔄 Processing department payroll:", req.body);
      const { month, year, frequency, salaryGrade } = req.body;
      const adminId = req.user._id;

      // Get admin's department
      const admin = await UserModel.findById(adminId).select("department");
      if (!admin?.department) {
        console.error("❌ Admin is not assigned to any department");
        return res.status(400).json({
          success: false,
          message: "Admin must be assigned to a department",
        });
      }

      console.log(`👤 Admin processing department payroll: ${admin._id}`);
      console.log(`🏢 Department: ${admin.department}`);

      // Get all active employees in the department
      const employees = await UserModel.find({
        department: admin.department,
        status: "active",
        role: "employee",
      }).select("employeeId firstName lastName email gradeLevel bankDetails");

      if (!employees.length) {
        console.error("❌ No active employees found in department");
        return res.status(404).json({
          success: false,
          message: "No active employees found in department",
        });
      }

      console.log(
        `👥 Found ${employees.length} active employees in department`
      );

      const results = {
        total: employees.length,
        processed: 0,
        skipped: 0,
        failed: 0,
        errors: [],
        successful: [],
      };

      // Process each employee
      for (const employee of employees) {
        try {
          console.log(
            `\n🔄 Processing employee: ${employee.employeeId} (${employee.firstName} ${employee.lastName})`
          );

          // Skip if employee has no grade level
          if (!employee.gradeLevel) {
            console.log(
              `⚠️ Employee ${employee.employeeId} has no grade level, skipping`
            );
            results.skipped++;
            results.errors.push({
              employeeId: employee.employeeId,
              name: `${employee.firstName} ${employee.lastName}`,
              reason: "No grade level assigned",
            });
            continue;
          }

          // Skip if employee has no bank details
          if (
            !employee.bankDetails?.accountNumber ||
            !employee.bankDetails?.bankName
          ) {
            console.log(
              `⚠️ Employee ${employee.employeeId} has incomplete bank details, skipping`
            );
            results.skipped++;
            results.errors.push({
              employeeId: employee.employeeId,
              name: `${employee.firstName} ${employee.lastName}`,
              reason: "Incomplete bank details",
            });
            continue;
          }

          // Check for existing payroll
          const existingPayroll = await PayrollModel.findOne({
            employee: employee._id,
            month,
            year,
            status: { $nin: ["REJECTED", "CANCELLED"] },
          });

          if (existingPayroll) {
            console.log(
              `⚠️ Payroll already exists for employee ${employee.employeeId}, skipping`
            );
            results.skipped++;
            results.errors.push({
              employeeId: employee.employeeId,
              name: `${employee.firstName} ${employee.lastName}`,
              reason: "Payroll already exists for this period",
            });
            continue;
          }

          // Calculate payroll
          console.log(
            `🧮 Calculating payroll for employee ${employee.employeeId}`
          );
          const payrollData = await PayrollService.calculatePayroll(
            employee._id,
            salaryGrade,
            month,
            year,
            frequency
          );

          // Create payroll record
          const payroll = await PayrollModel.create({
            ...payrollData,
            status: PAYROLL_STATUS.DRAFT, // Start with DRAFT status for consistency
            processedBy: adminId,
            createdBy: adminId,
            updatedBy: adminId,
            payment: {
              accountName: "Pending",
              accountNumber: "Pending",
              bankName: "Pending",
            },
            approvalFlow: {
              submittedBy: adminId,
              submittedAt: new Date(),
              status: PAYROLL_STATUS.DRAFT,
              remarks: "Initial payroll creation",
            },
          });

          console.log(`✅ Payroll created with ID: ${payroll._id}`);

          // Create notification for the employee
          console.log(`🔔 Creating notification for employee: ${employee._id}`);
          await NotificationService.createPayrollNotification(
            employee._id,
            "PAYROLL_CREATED",
            payroll
          );

          // Create notification for the admin
          console.log(`🔔 Creating notification for admin: ${adminId}`);
          await NotificationService.createPayrollNotification(
            adminId,
            "PAYROLL_DRAFT_CREATED",
            payroll
          );

          results.processed++;
          results.successful.push({
            employeeId: employee.employeeId,
            name: `${employee.firstName} ${employee.lastName}`,
            payrollId: payroll._id,
          });

          console.log(
            `✅ Successfully processed payroll for employee: ${employee.employeeId}`
          );
        } catch (error) {
          console.error(
            `❌ Error processing employee ${employee.employeeId}: ${error.message}`
          );
          results.failed++;
          results.errors.push({
            employeeId: employee.employeeId,
            name: `${employee.firstName} ${employee.lastName}`,
            reason: error.message || "Unknown error occurred",
          });
        }
      }

      console.log(`\n📊 Department payroll processing summary:`);
      console.log(`- Total employees: ${results.total}`);
      console.log(`- Successfully processed: ${results.processed}`);
      console.log(`- Skipped: ${results.skipped}`);
      console.log(`- Failed: ${results.failed}`);

      return res.status(200).json({
        success: true,
        message: "Department payroll processed",
        data: results,
      });
    } catch (error) {
      console.error(`❌ Error processing department payroll: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: "Error processing department payroll",
        error: error.message,
      });
    }
  }

  static async submitDepartmentPayrolls(req, res, next) {
    try {
      console.log("🔄 Submitting department payrolls:", req.body);
      const { month, year, remarks } = req.body;
      const admin = await UserModel.findById(req.user.id);

      if (!admin?.department) {
        console.error("❌ Admin is not assigned to any department");
        throw new ApiError(400, "Admin is not assigned to any department");
      }

      console.log(
        `👤 Admin submitting payrolls: ${admin.firstName} ${admin.lastName} (${admin._id})`
      );
      console.log(`🏢 Department: ${admin.department}`);

      // Find all draft payrolls for the department and period
      const draftPayrolls = await PayrollModel.find({
        department: admin.department,
        month,
        year,
        status: PAYROLL_STATUS.DRAFT,
      });

      if (draftPayrolls.length === 0) {
        console.error("❌ No draft payrolls found for submission");
        throw new ApiError(404, "No draft payrolls found for submission");
      }

      console.log(`📋 Found ${draftPayrolls.length} draft payrolls to submit`);

      // Update all payrolls to PENDING status
      const updatedPayrolls = await Promise.all(
        draftPayrolls.map(async (payroll) => {
          console.log(`🔄 Updating payroll status to PENDING: ${payroll._id}`);

          // Update payroll status and add to approval flow
          payroll.status = PAYROLL_STATUS.PENDING;
          payroll.approvalFlow.push({
            status: PAYROLL_STATUS.PENDING,
            submittedBy: admin._id,
            submittedAt: new Date(),
            remarks: remarks || "Submitted for approval",
          });

          // Get all super admins who can approve payrolls
          const superAdmins = await UserModel.find({
            role: UserRole.SUPER_ADMIN,
            permissions: Permission.APPROVE_PAYROLL,
          });

          // Create notifications for all super admins
          await Promise.all(
            superAdmins.map((superAdmin) =>
              NotificationService.createPayrollNotification(
                superAdmin._id,
                "PAYROLL_SUBMITTED",
                payroll,
                remarks
              )
            )
          );

          // Create notification for the employee
          console.log(
            `🔔 Creating notification for employee: ${payroll.employee}`
          );
          await NotificationService.createPayrollNotification(
            payroll.employee,
            "PAYROLL_SUBMITTED",
            payroll,
            remarks
          );

          return payroll.save();
        })
      );

      console.log(
        `✅ Successfully submitted ${updatedPayrolls.length} payrolls`
      );

      return res.status(200).json({
        success: true,
        message: "Department payrolls submitted successfully",
        data: {
          submitted: updatedPayrolls.length,
          month,
          year,
        },
      });
    } catch (error) {
      console.error(
        `❌ Error submitting department payrolls: ${error.message}`
      );
      next(error);
    }
  }

  // For bulk department payroll approval/rejection
  static async approveDepartmentPayrolls(req, res, next) {
    try {
      const { month, year, remarks } = req.body;
      const admin = await UserModel.findById(req.user.id);

      if (!admin?.department) {
        throw new ApiError(400, "Admin is not assigned to any department");
      }

      // Find all pending payrolls for the department
      const pendingPayrolls = await PayrollModel.find({
        department: admin.department,
        month,
        year,
        status: PAYROLL_STATUS.PENDING,
      }).populate("employee");

      if (pendingPayrolls.length === 0) {
        throw new ApiError(404, "No pending payrolls found");
      }

      // Update all payrolls
      const updatedPayrolls = await Promise.all(
        pendingPayrolls.map(async (payroll) => {
          payroll.status = PAYROLL_STATUS.APPROVED;
          payroll.approvalFlow.push({
            status: PAYROLL_STATUS.APPROVED,
            approvedBy: admin._id,
            approvedAt: new Date(),
            remarks,
          });
          await payroll.save();

          // Send individual notifications to employees
          await NotificationService.createPayrollNotification(
            payroll.employee._id,
            "PAYROLL_APPROVED",
            payroll,
            remarks
          );

          return payroll;
        })
      );

      // Send batch notification to department admin
      await NotificationService.createPayrollNotification(
        admin._id,
        "DEPARTMENT_PAYROLL_APPROVED",
        { month, year },
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

  static async rejectDepartmentPayrolls(req, res, next) {
    try {
      const { month, year, remarks } = req.body;
      const admin = await UserModel.findById(req.user.id);

      if (!admin?.department) {
        throw new ApiError(400, "Admin is not assigned to any department");
      }

      // Find all pending payrolls for the department
      const pendingPayrolls = await PayrollModel.find({
        department: admin.department,
        month,
        year,
        status: PAYROLL_STATUS.PENDING,
      }).populate("employee");

      if (pendingPayrolls.length === 0) {
        throw new ApiError(404, "No pending payrolls found");
      }

      // Update all payrolls
      const updatedPayrolls = await Promise.all(
        pendingPayrolls.map(async (payroll) => {
          payroll.status = PAYROLL_STATUS.REJECTED;
          payroll.approvalFlow.push({
            status: PAYROLL_STATUS.REJECTED,
            rejectedBy: admin._id,
            rejectedAt: new Date(),
            remarks,
          });
          await payroll.save();

          // Send individual notifications to employees
          await NotificationService.createPayrollNotification(
            payroll.employee._id,
            "PAYROLL_REJECTED",
            payroll,
            remarks
          );

          return payroll;
        })
      );

      // Send batch notification to department admin
      await NotificationService.createPayrollNotification(
        admin._id,
        "DEPARTMENT_PAYROLL_REJECTED",
        { month, year },
        remarks
      );

      res.status(200).json({
        success: true,
        message: "Department payrolls rejected successfully",
        data: {
          rejected: updatedPayrolls.length,
          payrolls: updatedPayrolls,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
