import UserModel from "../models/User.js";
import PayrollModel, {
  PAYROLL_STATUS,
  APPROVAL_LEVELS,
} from "../models/Payroll.js";
import { Permission, UserRole } from "../models/User.js";
import { PayrollFrequency } from "../models/Payroll.js";
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
import { EmailService } from "../services/emailService.js";
import { PayrollService } from "../services/PayrollService.js";
import {
  NotificationService,
  NOTIFICATION_TYPES,
} from "../services/NotificationService.js";
import AuditService from "../services/AuditService.js";
import BaseApprovalController from "./BaseApprovalController.js";
import { AuditAction, AuditEntity } from "../models/Audit.js";
import SalaryGrade from "../models/SalaryStructure.js";
import DeductionModel from "../models/Deduction.js";

// Define the order of approval levels
const APPROVAL_ORDER = [
  APPROVAL_LEVELS.DEPARTMENT_HEAD,
  APPROVAL_LEVELS.HR_MANAGER,
  APPROVAL_LEVELS.FINANCE_DIRECTOR,
  APPROVAL_LEVELS.SUPER_ADMIN,
];

// Simple function to check approval permissions
const checkApprovalPermission = (admin, currentLevel) => {
  if (!admin || !currentLevel) {
    console.log("Permission check failed: Missing admin or currentLevel", {
      admin,
      currentLevel,
    });
    return false;
  }

  const position = (admin.position || "").toLowerCase(); // Convert position to lowercase
  const role = (admin.role || "").toLowerCase(); // Convert role to lowercase

  console.log("Checking permissions (case-insensitive):", {
    position,
    role,
    currentLevel,
  });

  switch (currentLevel) {
    case APPROVAL_LEVELS.DEPARTMENT_HEAD:
      return (
        position.includes("head of department") ||
        position.includes("department head")
      );
    case APPROVAL_LEVELS.HR_MANAGER:
      return (
        position.includes("head of hr") ||
        position.includes("head of human resources") ||
        position.includes("hr manager") ||
        position.includes("human resources manager") ||
        position.includes("hr head")
      );
    case APPROVAL_LEVELS.FINANCE_DIRECTOR:
      // Assuming 'Head of Finance' is the specific required position
      return position === "head of finance";
    case APPROVAL_LEVELS.SUPER_ADMIN:
      // Use lowercase role check
      return role === "super_admin";
    default:
      return false;
  }
};

// Helper function to get next approval level
const getNextApprovalLevel = (currentLevel) => {
  switch (currentLevel) {
    case APPROVAL_LEVELS.DRAFT:
      return APPROVAL_LEVELS.DEPARTMENT_HEAD;
    case APPROVAL_LEVELS.DEPARTMENT_HEAD:
      return APPROVAL_LEVELS.HR_HEAD;
    case APPROVAL_LEVELS.HR_HEAD:
      return APPROVAL_LEVELS.FINANCE_DIRECTOR;
    case APPROVAL_LEVELS.FINANCE_DIRECTOR:
      return APPROVAL_LEVELS.SUPER_ADMIN;
    case APPROVAL_LEVELS.SUPER_ADMIN:
      return null;
    default:
      throw new ApiError(400, "Invalid approval level");
  }
};

// Add this function before the AdminController class
const getApproverForAllowance = async (departmentId) => {
  try {
    console.log("🔍 Finding approver for department:", departmentId);

    // First try to find a department head
    const departmentHead = await UserModel.findOne({
      department: departmentId,
      position: { $regex: /head|hod/i },
      status: "active",
    });

    if (departmentHead) {
      console.log("✅ Found department head:", departmentHead._id);
      return { approverId: departmentHead._id, approverRole: "hod" };
    }

    // If no department head, find an HR manager
    const hrManager = await UserModel.findOne({
      department: { $regex: /hr|human resources/i },
      position: { $regex: /manager|head/i },
      status: "active",
    });

    if (hrManager) {
      console.log("✅ Found HR manager:", hrManager._id);
      return { approverId: hrManager._id, approverRole: "hr" };
    }

    // If no HR manager, find a super admin
    const superAdmin = await UserModel.findOne({
      role: "SUPER_ADMIN",
      status: "active",
    });

    if (superAdmin) {
      console.log("✅ Found super admin:", superAdmin._id);
      return { approverId: superAdmin._id, approverRole: "super_admin" };
    }

    console.log("❌ No approver found");
    throw new Error("No approver found for allowance request");
  } catch (error) {
    console.error("❌ Error finding approver:", error);
    throw error;
  }
};

export class AdminController {
  // ===== User Management Methods =====
  static async getAllEmployees(req, res, next) {
    try {
      // Get the admin's department
      const admin = await UserModel.findById(req.user.id);

      // Skip department check for Super Admins
      if (admin.role !== UserRole.SUPER_ADMIN && !admin?.department) {
        throw new ApiError(400, "Admin is not assigned to any department");
      }

      // Query parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || "";
      const status = req.query.status;

      // Build query - removed role filter to get both admins and users
      const query = {
        $or: [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { employeeId: { $regex: search, $options: "i" } },
        ],
      };

      // Only filter by department for non-Super Admins
      if (admin.role !== UserRole.SUPER_ADMIN) {
        query.department = admin.department;
      }

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
      const admin = await UserModel.findById(req.user.id);
      const { department } = admin;

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

      let query = {};

      // Check if user is Finance Director
      const isFinanceDirector =
        admin.position &&
        new RegExp("head of finance|finance director|finance head", "i").test(
          admin.position
        );

      if (isFinanceDirector) {
        // For Finance Director, show payrolls that need their approval
        query = {
          status: PAYROLL_STATUS.PENDING,
          "approvalFlow.currentLevel": APPROVAL_LEVELS.FINANCE_DIRECTOR,
        };
        console.log("🔍 Fetching payrolls for Finance Director approval");
      } else {
        // For other users, show only their department's payrolls
        query = { department };
        console.log("🔍 Fetching payrolls for department:", department);
      }

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

      console.log("📊 Query:", JSON.stringify(query, null, 2));

      const payrolls = await PayrollModel.find(query)
        .populate("employee", "firstName lastName email employeeId")
        .populate("department", "name")
        .populate("approvalFlow.submittedBy", "firstName lastName")
        .populate("approvalFlow.approvedBy", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await PayrollModel.countDocuments(query);

      console.log(`✅ Found ${payrolls.length} payrolls`);

      // Log the first payroll's deductions for debugging
      if (payrolls.length > 0) {
        console.log(
          "🔍 First payroll deductions from DB:",
          payrolls[0].deductions
        );
      }

      // Add breakdown to payrolls that don't have it
      const payrollsWithBreakdown = payrolls.map((payroll) => {
        const payrollObj = payroll.toObject();

        // If deductions don't have breakdown, calculate it
        if (!payrollObj.deductions.breakdown) {
          const breakdown = [
            {
              name: "PAYE Tax",
              type: "statutory",
              amount: payrollObj.deductions.tax?.amount || 0,
              calculationMethod: "PROGRESSIVE",
            },
            {
              name: "Pension",
              type: "statutory",
              amount: payrollObj.deductions.pension?.amount || 0,
              calculationMethod: "PERCENTAGE",
            },
            {
              name: "NHF",
              type: "statutory",
              amount: payrollObj.deductions.nhf?.amount || 0,
              calculationMethod: "PERCENTAGE",
            },
            // Add any other deductions from the others array
            ...(payrollObj.deductions.others || []).map((deduction) => ({
              name: deduction.name,
              type: deduction.type || "voluntary",
              amount: deduction.amount,
              calculationMethod: deduction.calculationMethod,
              description: deduction.description,
              scope: deduction.scope,
            })),
          ];

          payrollObj.deductions.breakdown = breakdown;
        }

        return payrollObj;
      });

      return res.status(200).json({
        success: true,
        data: {
          payrolls: payrollsWithBreakdown,
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

      // Add deduction breakdown if missing (for backward compatibility)
      if (payroll.deductions && !payroll.deductions.breakdown) {
        console.log(
          "🔧 Adding missing deduction breakdown to admin payroll:",
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
          statutory: statutoryDeductions.map((deduction) => ({
            name: deduction.name,
            amount: payroll.deductions[deduction.code] || 0,
            code: deduction.code,
            description: deduction.description,
          })),
          voluntary: voluntaryDeductions.map((deduction) => ({
            name: deduction.name,
            amount: payroll.deductions[deduction.code] || 0,
            code: deduction.code,
            description: deduction.description,
          })),
        };

        console.log(
          "✅ Added deduction breakdown to admin payroll:",
          payroll._id
        );
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

      // Add deduction breakdown to each payroll record if missing (for backward compatibility)
      for (const payroll of payrolls) {
        if (payroll.deductions && !payroll.deductions.breakdown) {
          console.log(
            "🔧 Adding missing deduction breakdown to admin payroll in history:",
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
            statutory: statutoryDeductions.map((deduction) => ({
              name: deduction.name,
              amount: payroll.deductions[deduction.code] || 0,
              code: deduction.code,
              description: deduction.description,
            })),
            voluntary: voluntaryDeductions.map((deduction) => ({
              name: deduction.name,
              amount: payroll.deductions[deduction.code] || 0,
              code: deduction.code,
              description: deduction.description,
            })),
          };

          console.log(
            "✅ Added deduction breakdown to admin payroll in history:",
            payroll._id
          );
        }
      }

      res.status(200).json({
        success: true,
        data: payrolls,
      });
    } catch (error) {
      next(error);
    }
  }

  // Approve payroll
  static async approvePayroll(req, res) {
    try {
      const { payrollId } = req.params;
      const { remarks } = req.body;
      const userId = req.user._id;

      // Get the payroll
      const payroll = await PayrollModel.findById(payrollId);
      if (!payroll) {
        throw new ApiError(404, "Payroll not found");
      }

      // Get the current user's role and department
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new ApiError(404, "User not found");
      }

      // Determine the current approval level
      let currentLevel;

      // If payroll is in DRAFT status, determine the first approval level based on user's role
      if (payroll.status === "DRAFT") {
        if (user.role === "department_head") {
          currentLevel = "DEPARTMENT_HEAD";
        } else if (user.role === "hr_manager") {
          currentLevel = "HR_MANAGER";
        } else if (user.role === "finance_director") {
          currentLevel = "FINANCE_DIRECTOR";
        } else if (user.role === "super_admin") {
          currentLevel = "SUPER_ADMIN";
        } else {
          throw new ApiError(403, "You are not authorized to approve payrolls");
        }

        // Initialize the approval flow for DRAFT payrolls
        payroll.approvalFlow = {
          currentLevel: currentLevel,
          history: [],
          submittedBy: user._id,
          submittedAt: new Date(),
          remarks: remarks || "Initial payroll approval",
        };

        // Add to approval history
        payroll.approvalFlow.history.push({
          level: currentLevel,
          status: "APPROVED",
          user: user._id,
          timestamp: new Date(),
          remarks: remarks || `Approved by ${currentLevel.replace(/_/g, " ")}`,
        });

        // Determine the next approval level
        let nextLevel = null;
        switch (currentLevel) {
          case APPROVAL_LEVELS.DEPARTMENT_HEAD:
            nextLevel = APPROVAL_LEVELS.HR_MANAGER;
            break;
          case APPROVAL_LEVELS.HR_MANAGER:
            nextLevel = APPROVAL_LEVELS.FINANCE_DIRECTOR;
            break;
          case APPROVAL_LEVELS.FINANCE_DIRECTOR:
            nextLevel = APPROVAL_LEVELS.SUPER_ADMIN;
            break;
          case APPROVAL_LEVELS.SUPER_ADMIN:
            nextLevel = "COMPLETED";
            break;
          default:
            throw new ApiError(400, "Invalid approval level");
        }

        // Update payroll status
        if (nextLevel === "COMPLETED") {
          payroll.status = PAYROLL_STATUS.APPROVED;
        } else {
          payroll.status = PAYROLL_STATUS.PENDING;
          payroll.approvalFlow.currentLevel = nextLevel;
        }

        // Create audit log for approval
        await Audit.create({
          action: AuditAction.APPROVE,
          entity: AuditEntity.PAYROLL,
          entityId: payroll._id,
          performedBy: user._id,
          details: {
            status: payroll.status,
            currentLevel,
            nextLevel,
            isFinanceDirector:
              user.role === "finance_director" ||
              user.position?.toLowerCase().includes("finance director"),
            approvalFlow: {
              currentLevel: nextLevel,
              history: payroll.approvalFlow.history,
              completedAt: nextLevel === "COMPLETED" ? new Date() : null,
            },
            employeeName: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
            employeeId: payroll.employee._id,
            month: payroll.month,
            year: payroll.year,
            departmentId: payroll.department,
            remarks:
              remarks || `Approved by ${currentLevel.replace(/_/g, " ")}`,
            approvedAt: new Date(),
          },
        });

        // Set refresh header
        res.set("X-Refresh-Audit-Logs", "true");

        // Save the payroll
        await payroll.save();

        // Find the next approver
        const nextApprover = await BaseApprovalController.findNextApprover(
          currentLevel,
          payroll
        );

        // Create notification for the employee
        await NotificationService.createNotification({
          recipient: payroll.employee,
          type: "PAYROLL_APPROVED",
          title: "Payroll Approved",
          message: `Your payroll for ${payroll.month} ${payroll.year} has been approved by ${user.firstName} ${user.lastName}`,
          data: {
            payrollId: payroll._id,
            approvedBy: user._id,
            level: currentLevel,
          },
        });

        // Create notification for the next approver if there is one
        if (nextApprover) {
          await NotificationService.createNotification({
            recipient: nextApprover._id,
            type: "PAYROLL_PENDING_APPROVAL",
            title: "Payroll Pending Approval",
            message: `A payroll for ${payroll.employee.firstName} ${payroll.employee.lastName} is pending your approval`,
            data: {
              payrollId: payroll._id,
              employeeId: payroll.employee._id,
              level: nextApprover.role,
            },
          });
        }

        res.json({
          success: true,
          message: "Payroll approved successfully",
          data: payroll,
        });
      } else {
        // For non-DRAFT payrolls, use the existing approval flow
        currentLevel = payroll.approvalFlow?.currentLevel;
        if (!currentLevel) {
          throw new ApiError(
            403,
            "You are not authorized to approve this payroll"
          );
        }

        // Find the next approver
        const nextApprover = await BaseApprovalController.findNextApprover(
          currentLevel,
          payroll
        );

        // Update the payroll approval flow
        const updatedPayroll =
          await BaseApprovalController.updatePayrollApprovalFlow(
            payroll,
            currentLevel,
            true,
            remarks,
            user
          );

        // Create audit log for approval
        await Audit.create({
          action: AuditAction.APPROVE,
          entity: AuditEntity.PAYROLL,
          entityId: payroll._id,
          performedBy: user._id,
          details: {
            status: updatedPayroll.status,
            currentLevel,
            nextLevel: updatedPayroll.approvalFlow.currentLevel,
            isFinanceDirector:
              user.role === "finance_director" ||
              user.position?.toLowerCase().includes("finance director"),
            approvalFlow: {
              currentLevel: updatedPayroll.approvalFlow.currentLevel,
              history: updatedPayroll.approvalFlow.history,
              completedAt:
                updatedPayroll.status === PAYROLL_STATUS.APPROVED
                  ? new Date()
                  : null,
            },
            employeeName: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
            employeeId: payroll.employee._id,
            month: payroll.month,
            year: payroll.year,
            departmentId: payroll.department,
            remarks:
              remarks || `Approved by ${currentLevel.replace(/_/g, " ")}`,
            approvedAt: new Date(),
          },
        });

        // Set refresh header
        res.set("X-Refresh-Audit-Logs", "true");

        // Create notification for the employee
        await NotificationService.createNotification({
          recipient: payroll.employee,
          type: "PAYROLL_APPROVED",
          title: "Payroll Approved",
          message: `Your payroll for ${payroll.month} ${payroll.year} has been approved by ${user.firstName} ${user.lastName}`,
          data: {
            payrollId: payroll._id,
            approvedBy: user._id,
            level: currentLevel,
          },
        });

        // Create notification for the next approver if there is one
        if (nextApprover) {
          await NotificationService.createNotification({
            recipient: nextApprover._id,
            type: "PAYROLL_PENDING_APPROVAL",
            title: "Payroll Pending Approval",
            message: `A payroll for ${payroll.employee.firstName} ${payroll.employee.lastName} is pending your approval`,
            data: {
              payrollId: payroll._id,
              employeeId: payroll.employee._id,
              level: nextApprover.role,
            },
          });
        }

        res.json({
          success: true,
          message: "Payroll approved successfully",
          data: updatedPayroll,
        });
      }
    } catch (error) {
      console.error("Error approving payroll:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Error approving payroll",
      });
    }
  }

  // Reject payroll
  static async rejectPayroll(req, res, next) {
    try {
      const { id } = req.params;
      const { remarks } = req.body;
      const admin = req.user;

      console.log("Starting payroll rejection:", {
        payrollId: id,
        adminId: admin._id,
        adminPosition: admin.position,
        adminRole: admin.role,
        remarks: remarks,
      });

      // Get the payroll
      const payroll = await PayrollModel.findById(id)
        .populate("employee")
        .populate("department");

      if (!payroll) {
        console.log("Payroll not found:", id);
        return res.status(404).json({
          success: false,
          message: "Payroll not found",
        });
      }

      console.log("Found payroll:", {
        payrollId: payroll._id,
        currentLevel: payroll.approvalFlow.currentLevel,
        status: payroll.status,
      });

      // Check if admin has permission to reject at current level
      const hasPermission = checkApprovalPermission(
        admin,
        payroll.approvalFlow.currentLevel
      );

      console.log("Permission check result:", {
        hasPermission,
        adminPosition: admin.position,
        currentLevel: payroll.approvalFlow.currentLevel,
      });

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to reject this payroll",
        });
      }

      payroll.status = PAYROLL_STATUS.REJECTED;

      const historyEntry = {
        level: payroll.approvalFlow.currentLevel,
        status: PAYROLL_STATUS.REJECTED,
        action: "REJECT",
        user: admin._id,
        timestamp: new Date(),
        remarks: remarks || "No reason provided",
      };

      // Replace the entire history array with the new entry
      payroll.approvalFlow.history = [historyEntry];

      // Update legacy fields
      payroll.approvalFlow.rejectedBy = admin._id;
      payroll.approvalFlow.rejectedAt = new Date();

      // Save the payroll
      await payroll.save();

      console.log("Payroll rejected successfully:", {
        payrollId: payroll._id,
        status: payroll.status,
        rejectionReason: remarks,
      });

      // Create notifications
      await NotificationService.createPayrollNotification(
        payroll,
        NOTIFICATION_TYPES.PAYROLL_REJECTED,
        admin,
        remarks
      );

      // Create audit log using AuditService
      await AuditService.logAction(
        "REJECT",
        "PAYROLL",
        payroll._id,
        admin._id,
        {
          status: PAYROLL_STATUS.REJECTED,
          level: payroll.approvalFlow.currentLevel,
          employeeName: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
          month: payroll.month,
          year: payroll.year,
          remarks: remarks,
          departmentId: payroll.department._id,
        }
      );

      // Set response headers to trigger UI updates
      res.set({
        "x-refresh-payrolls": "true",
        "x-refresh-audit-logs": "true",
        "x-refresh-finance-director": "true",
      });

      return res.status(200).json({
        success: true,
        message: "Payroll rejected successfully",
        data: payroll,
      });
    } catch (error) {
      console.error("Error in rejectPayroll:", error);
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

      const isAccountantRole =
        admin.role.toLowerCase() === "accountant" ||
        admin.role.toLowerCase() === "disburser";

      const isFinancePosition =
        admin.position?.toLowerCase().includes("head of accounting") ||
        admin.position?.toLowerCase().includes("head of finance") ||
        admin.position?.toLowerCase().includes("hoacc") ||
        admin.position?.toLowerCase().includes("finance manager") ||
        admin.position?.toLowerCase().includes("senior accountant") ||
        admin.position?.toLowerCase().includes("chief accountant") ||
        admin.position?.toLowerCase().includes("accounting manager") ||
        admin.position?.toLowerCase().includes("financial controller") ||
        admin.position?.toLowerCase().includes("bursary") ||
        admin.position?.toLowerCase().includes("bursar") ||
        admin.position?.toLowerCase().includes("head of bursary") ||
        admin.position?.toLowerCase().includes("bursary manager") ||
        admin.position?.toLowerCase().includes("bursary officer");

      if (!isAccountantRole && !isFinancePosition) {
        throw new ApiError(
          403,
          "Only accountants, disbursers, or Head of Accounting/Finance/Bursary can process payments"
        );
      }

      await NotificationService.createPayrollNotification(
        admin._id,
        NOTIFICATION_TYPES.PAYROLL_PAYMENT_STARTED,
        { payrollId: id }
      );

      const payroll = await PayrollModel.findOne({
        _id: id,
        department: admin.department,
      }).populate("employee");

      if (!payroll) {
        await NotificationService.createPayrollNotification(
          admin._id,
          NOTIFICATION_TYPES.PAYROLL_PAYMENT_ERROR,
          {
            payrollId: id,
            error: "Payroll not found in your department",
          }
        );

        throw new ApiError(404, "Payroll not found in your department");
      }

      if (payroll.status !== PAYROLL_STATUS.APPROVED) {
        await NotificationService.createPayrollNotification(
          admin._id,
          NOTIFICATION_TYPES.PAYROLL_PAYMENT_ERROR,
          {
            payrollId: id,
            error: "Only approved payrolls can be processed for payment",
          }
        );

        throw new ApiError(
          400,
          "Only approved payrolls can be processed for payment"
        );
      }

      if (
        !payroll.payment?.accountName ||
        !payroll.payment?.accountNumber ||
        !payroll.payment?.bankName
      ) {
        await NotificationService.createPayrollNotification(
          admin._id,
          NOTIFICATION_TYPES.PAYROLL_PAYMENT_ERROR,
          {
            payrollId: id,
            error: "Payroll payment details are incomplete",
          }
        );

        throw new ApiError(400, "Payroll payment details are incomplete");
      }

      payroll.status = PAYROLL_STATUS.PAID;
      payroll.paymentDetails = {
        processedBy: admin._id,
        processedAt: new Date(),
        remarks: "Payment processed by Finance/Bursary Admin",
      };

      await payroll.save();

      await NotificationService.createPayrollNotification(
        payroll.employee._id,
        NOTIFICATION_TYPES.PAYROLL_PAYMENT_PROCESSED,
        payroll,
        "Your payroll payment has been processed"
      );

      await NotificationService.createPayrollNotification(
        admin._id,
        NOTIFICATION_TYPES.PAYROLL_PAYMENT_SUCCESS,
        {
          payrollId: payroll._id,
          employeeId: payroll.employee._id,
          employeeName: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
          month: payroll.month,
          year: payroll.year,
          amount: payroll.totals.netPay,
        }
      );

      res.status(200).json({
        success: true,
        message: "Payment processed successfully",
        data: {
          payroll,
          hasErrors: false,
          errorTypes: [],
          errorSummary: {},
        },
      });
    } catch (error) {
      console.error(`Error processing payment: ${error.message}`);

      if (req.user && req.user._id) {
        await NotificationService.createPayrollNotification(
          req.user._id,
          NOTIFICATION_TYPES.PAYROLL_PAYMENT_ERROR,
          {
            payrollId: req.params.id,
            error: error.message || "Unknown error occurred",
          }
        );
      }

      next(error);
    }
  }

  // Submit payroll for approval
  static async submitPayroll(req, res, next) {
    try {
      console.log("🔄 Starting payroll submission process");
      const { id } = req.params;
      const { remarks, frequency } = req.body;
      const admin = await UserModel.findById(req.user.id);
      console.log(
        `👤 Admin submitting payroll: ${admin.firstName} ${admin.lastName} (${admin._id})`
      );

      // Get the payroll
      const payroll = await PayrollModel.findOne({
        _id: id,
        department: admin.department,
      }).populate("employee");

      if (!payroll) {
        console.error("❌ Payroll not found in department");
        throw new ApiError(404, "Payroll not found in your department");
      }

      console.log(
        `📋 Found payroll: ID=${payroll._id}, Status=${payroll.status}`
      );

      if (payroll.status !== PAYROLL_STATUS.DRAFT) {
        console.error("❌ Invalid payroll status for submission");
        throw new ApiError(400, "Only draft payrolls can be submitted");
      }

      // Update frequency if provided, otherwise keep existing
      if (frequency) {
        if (!Object.values(PayrollFrequency).includes(frequency)) {
          console.error("❌ Invalid payroll frequency");
          throw new ApiError(400, "Invalid payroll frequency");
        }
        payroll.frequency = frequency;
      }

      // Get department head based on position - using a more reliable approach
      let departmentHead = await UserModel.findOne({
        department: admin.department,
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

      // If no exact match, try a more flexible approach
      if (!departmentHead) {
        console.log(
          "⚠️ No exact department head match found, trying flexible search"
        );
        const allDepartmentUsers = await UserModel.find({
          department: admin.department,
          status: "active",
        });

        // Find the first user with "head" in their position
        const potentialHead = allDepartmentUsers.find(
          (user) =>
            user.position && user.position.toLowerCase().includes("head")
        );

        if (potentialHead) {
          console.log(
            `✅ Found department head: ${potentialHead.firstName} ${potentialHead.lastName}`
          );
          departmentHead = potentialHead;
        } else {
          console.error("❌ No department head found");
          throw new ApiError(
            404,
            "No department head found for your department"
          );
        }
      }

      // Get HR Manager (Head of Human Resources) - using a more reliable approach
      const hrDepartment = await DepartmentModel.findOne({
        name: { $in: ["Human Resources", "HR"] },
        status: "active",
      });

      const hrManager = hrDepartment
        ? await UserModel.findOne({
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
          })
        : null;

      if (hrManager) {
        console.log(
          `✅ Found HR Manager: ${hrManager.firstName} ${hrManager.lastName}`
        );
      } else {
        console.log("⚠️ No HR Manager found");
      }

      const isHRDepartment =
        hrDepartment &&
        admin.department.toString() === hrDepartment._id.toString();

      const isHRManager =
        admin.position &&
        [
          "Head of Human Resources",
          "HR Manager",
          "HR Head",
          "HR Director",
          "Human Resources Manager",
          "Head of HR",
          "HR HOD",
          "HR Department Head",
        ].some((position) =>
          admin.position.toLowerCase().includes(position.toLowerCase())
        );

      // Skip department head level only if submitter is HR Manager/Head
      const initialApprovalLevel =
        isHRDepartment && isHRManager
          ? APPROVAL_LEVELS.HR_MANAGER
          : APPROVAL_LEVELS.DEPARTMENT_HEAD;

      console.log(`📊 Initial approval level: ${initialApprovalLevel}`);
      console.log(`🏢 Is HR Department: ${isHRDepartment}`);
      console.log(`👤 Is HR Manager: ${isHRManager}`);

      // Update payroll status and add to approval flow
      payroll.status = PAYROLL_STATUS.PENDING;

      payroll.approvalFlow = {
        currentLevel: initialApprovalLevel,
        history: [
          {
            level: initialApprovalLevel,
            status: PAYROLL_STATUS.PENDING,
            action: "SUBMIT",
            user: admin._id,
            timestamp: new Date(),
            remarks:
              remarks ||
              `Submitted for ${initialApprovalLevel
                .replace(/_/g, " ")
                .toLowerCase()} approval`,
          },
        ],
        submittedBy: admin._id,
        submittedAt: new Date(),
        remarks:
          remarks ||
          `Submitted for ${initialApprovalLevel
            .replace(/_/g, " ")
            .toLowerCase()} approval`,
      };

      await payroll.save();

      await Audit.create({
        action: AuditAction.SUBMIT,
        entity: AuditEntity.PAYROLL,
        entityId: payroll._id,
        performedBy: admin._id,
        details: {
          status: PAYROLL_STATUS.PENDING,
          initialLevel: initialApprovalLevel,
          isHRDepartment,
          isHRManager,
          skippedDepartmentHead: isHRDepartment && isHRManager,
          employeeName: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
          employeeId: payroll.employee._id,
          month: payroll.month,
          year: payroll.year,
          frequency: payroll.frequency,
          departmentId: payroll.department,
          remarks:
            remarks ||
            `Submitted for ${initialApprovalLevel
              .replace(/_/g, " ")
              .toLowerCase()} approval`,
          submittedAt: new Date(),
          approvalFlow: {
            currentLevel: initialApprovalLevel,
            history: payroll.approvalFlow.history,
          },
        },
      });

      // Set refresh header
      res.set("X-Refresh-Audit-Logs", "true");

      // Create notifications for all stakeholders
      console.log("🔔 Creating notifications for stakeholders");
      const notificationPromises = [];

      // Notify the employee
      console.log(
        `📬 Creating notification for employee: ${payroll.employee.firstName} ${payroll.employee.lastName}`
      );
      notificationPromises.push(
        NotificationService.createPayrollNotification(
          payroll.employee._id,
          NOTIFICATION_TYPES.PAYROLL_SUBMITTED,
          payroll,
          remarks ||
            `Submitted for ${initialApprovalLevel
              .replace(/_/g, " ")
              .toLowerCase()} approval`
        )
      );

      // Log notification creation results
      await Promise.all(notificationPromises);
      console.log("✅ Successfully sent all notifications");

      // Get the next approver based on the initial approval level
      let nextApprover = null;
      let nextApproverRole = "";

      if (initialApprovalLevel === APPROVAL_LEVELS.DEPARTMENT_HEAD) {
        nextApprover = departmentHead;
        nextApproverRole = "Department Head";
      } else if (initialApprovalLevel === APPROVAL_LEVELS.HR_MANAGER) {
        nextApprover = hrManager;
        nextApproverRole = "HR Manager";
      }

      // Check if the next approver is the same as the submitting admin
      const isSelfApproval =
        nextApprover && nextApprover._id.toString() === admin._id.toString();

      // Only notify the next approver if they're different from the submitting admin
      if (nextApprover && !isSelfApproval) {
        console.log(
          `📬 Creating notification for ${nextApproverRole}: ${nextApprover.firstName} ${nextApprover.lastName}`
        );
        notificationPromises.push(
          NotificationService.createPayrollNotification(
            payroll,
            "PAYROLL_PENDING_APPROVAL",
            nextApprover,
            `New payroll submission for ${payroll.employee.firstName} ${payroll.employee.lastName} (${payroll.employee.department.name}) for ${payroll.month}/${payroll.year} requires your approval as ${nextApproverRole}`
          )
        );
      } else if (isSelfApproval) {
        console.log(
          `ℹ️ Skipping notification for ${nextApproverRole} as they are the submitting admin`
        );
      }

      // Send all notifications
      console.log("📤 Sending notifications...");
      const results = await Promise.all(notificationPromises);
      console.log(
        "✅ Notifications sent successfully:",
        results.map((r) => r?._id)
      );

      // Create audit log for payroll submission
      await AuditService.logAction(
        AuditAction.UPDATE,
        AuditEntity.PAYROLL,
        payroll._id,
        admin._id,
        {
          status: "PENDING",
          previousStatus: "DRAFT",
          employeeId: payroll.employee._id,
          employeeName: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
          month: payroll.month,
          year: payroll.year,
          frequency: payroll.frequency,
          departmentId: payroll.department,
          message: `Submitted payroll for ${payroll.employee.firstName} ${payroll.employee.lastName}`,
          nextApprover: nextApprover
            ? `${nextApprover.firstName} ${nextApprover.lastName} (${nextApproverRole})`
            : "None",
          approvalLevel: initialApprovalLevel,
        }
      );

      res.set("X-Refresh-Audit-Logs", "true");

      return res.status(200).json({
        success: true,
        message: "Payroll submitted successfully",
        data: payroll,
      });
    } catch (error) {
      console.error(`❌ Error submitting payroll: ${error.message}`);
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

      // Get all payrolls for the department
      const payrolls = await PayrollModel.find({
        department: admin.department,
      });

      console.log(
        `Found ${payrolls.length} payrolls for department ${admin.department}`
      );

      // Log each payroll's status
      payrolls.forEach((payroll, index) => {
        console.log(
          `Payroll ${index + 1}: ID=${payroll._id}, Status=${payroll.status}`
        );
      });

      // Initialize stats object with all possible statuses
      const formattedStats = {
        DRAFT: 0,
        PENDING: 0,
        APPROVED: 0,
        REJECTED: 0,
        PAID: 0,
        CANCELLED: 0,
        total: 0,
        totalAmount: 0,
      };

      // Count payrolls by status
      payrolls.forEach((payroll) => {
        // Increment the count for this status
        formattedStats[payroll.status]++;

        // Add to total count
        formattedStats.total++;

        // Only add to total amount if payroll is PAID
        if (payroll.status === PAYROLL_STATUS.PAID) {
          formattedStats.totalAmount += payroll.totals.netPay || 0;
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

  static async getProcessingStatistics(req, res) {
    try {
      const admin = await UserModel.findById(req.user.id).select(
        "department role"
      );

      if (admin.role !== "SUPER_ADMIN" && !admin?.department) {
        throw new ApiError(400, "Admin is not assigned to any department");
      }

      const stats = await PayrollService.getProcessingStatistics(
        admin.role === "SUPER_ADMIN" ? null : admin.department
      );

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

      // Add deduction breakdown if missing (for backward compatibility)
      if (payroll.deductions && !payroll.deductions.breakdown) {
        console.log(
          "🔧 Adding missing deduction breakdown to admin payslip payroll:",
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
          statutory: statutoryDeductions.map((deduction) => ({
            name: deduction.name,
            amount: payroll.deductions[deduction.code] || 0,
            code: deduction.code,
            description: deduction.description,
          })),
          voluntary: voluntaryDeductions.map((deduction) => ({
            name: deduction.name,
            amount: payroll.deductions[deduction.code] || 0,
            code: deduction.code,
            description: deduction.description,
          })),
        };

        console.log(
          "✅ Added deduction breakdown to admin payslip payroll:",
          payroll._id
        );
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
      })
        .populate("department", "name")
        .populate("salaryGrade", "level basicSalary")
        .populate("createdBy", "firstName lastName")
        .populate("updatedBy", "firstName lastName")
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

  static async requestAllowance(req, res) {
    try {
      const {
        name,
        type,
        amount,
        description,
        calculationMethod,
        frequency,
        effectiveDate,
        scope,
      } = req.body;
      const adminId = req.user._id;

      // Log admin details
      const admin = await UserModel.findById(adminId).populate("department");
      console.log("🔍 Found admin:", JSON.stringify(admin, null, 2));

      if (!admin) {
        console.log("❌ Admin not found");
        return res.status(404).json({ message: "Admin not found" });
      }

      // Log grade level check
      console.log("📊 Checking admin grade level:", admin.gradeLevel);
      if (!admin.gradeLevel) {
        console.log("❌ No grade level found for admin");
        return res.status(400).json({ message: "Admin grade level not found" });
      }

      // Log salary grade check
      const salaryGrade = await SalaryGrade.findOne({
        level: admin.gradeLevel,
      });
      console.log(
        "💰 Found salary grade:",
        JSON.stringify(salaryGrade, null, 2)
      );
      if (!salaryGrade) {
        console.log("❌ No salary grade found for level:", admin.gradeLevel);
        return res
          .status(400)
          .json({ message: "Salary grade not found for admin's grade level" });
      }

      // Extract year and month from effectiveDate
      const effectiveDateObj = new Date(effectiveDate);
      const year = effectiveDateObj.getFullYear();
      const month = effectiveDateObj.getMonth() + 1; // JavaScript months are 0-indexed

      // Create allowance request
      const allowanceRequest = {
        name,
        type,
        amount,
        description,
        calculationMethod,
        frequency,
        effectiveDate,
        employee: adminId,
        department: admin.department._id,
        scope: "individual",
        status: "PENDING", // Use uppercase as per enum
        salaryGrade: salaryGrade._id, // Add the salary grade ID
        year, // Add the year
        month, // Add the month
        createdBy: adminId,
        updatedBy: adminId,
      };

      console.log(
        "📄 Creating allowance request:",
        JSON.stringify(allowanceRequest, null, 2)
      );
      const allowance = new Allowance(allowanceRequest);
      await allowance.save();
      console.log("✅ Allowance request created successfully:", allowance._id);

      // Get approver
      const approver = await getApproverForAllowance(admin.department._id);
      console.log("👥 Found approver:", JSON.stringify(approver, null, 2));

      res.status(201).json({
        message: "Allowance request submitted successfully",
        data: allowance,
      });
    } catch (error) {
      console.error("❌ Error in requestAllowance:", error);
      res.status(500).json({ message: error.message });
    }
  }

  static async getAllowanceHistory(req, res) {
    try {
      const adminId = req.user._id;

      // Get all allowances created by this admin
      const allowances = await Allowance.find({
        createdBy: adminId,
      })
        .sort({ createdAt: -1 })
        .populate("employee", "firstName lastName employeeId")
        .populate("department", "name")
        .populate("salaryGrade", "level");

      res.status(200).json({
        success: true,
        data: allowances,
      });
    } catch (error) {
      console.error("Error fetching admin allowance history:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
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
          department: req.user.department, // Admin can only approve allowances in their department
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

      // Update user's personal allowances array
      await User.findByIdAndUpdate(allowance.employee, {
        $pull: { personalAllowances: { allowanceId: allowance._id } }, // Remove if exists
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

      await User.findByIdAndUpdate(allowance.employee, {
        $push: { personalAllowances: personalAllowance },
      });

      res.status(200).json({
        success: true,
        data: allowance,
        message: "Allowance approved successfully",
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
      const { id } = req.params;
      const admin = req.user;

      // Find the employee
      const employee = await UserModel.findById(id)
        .populate("department")
        .populate("salaryGrade");

      if (!employee) {
        throw new ApiError(404, "Employee not found");
      }

      if (employee.department.toString() !== admin.department.toString()) {
        if (
          !PermissionChecker.hasPermission(admin, Permission.VIEW_ALL_USERS)
        ) {
          throw new ApiError(403, "Not authorized to view employee details");
        }
      }

      // Return the employee details
      res.json({
        success: true,
        data: employee,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createEmployee(req, res, next) {
    console.log("🚀 [AdminController] Starting employee creation request");
    console.log("📋 [AdminController] Request body:", {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      position: req.body.position,
      gradeLevel: req.body.gradeLevel,
      workLocation: req.body.workLocation,
      dateJoined: req.body.dateJoined,
    });
    console.log("👤 [AdminController] Request user:", {
      id: req.user.id,
      role: req.user.role,
      department: req.user.department,
    });

    try {
      console.log("🔐 [AdminController] Checking permissions...");
      if (!PermissionChecker.hasPermission(req.user, Permission.CREATE_USER)) {
        console.error(
          "❌ [AdminController] Permission denied: User lacks CREATE_USER permission"
        );
        throw new ApiError(403, "Not authorized to create employees");
      }
      console.log("✅ [AdminController] Permissions validated");

      console.log("👤 [AdminController] Fetching admin details...");
      const admin = await UserModel.findById(req.user.id);
      if (!admin?.department) {
        console.error(
          "❌ [AdminController] Admin not assigned to department:",
          {
            adminId: req.user.id,
            hasDepartment: !!admin?.department,
          }
        );
        throw new ApiError(400, "Admin is not assigned to any department");
      }
      console.log("✅ [AdminController] Admin details fetched:", {
        adminId: admin._id,
        department: admin.department,
      });

      // Generate employee ID with dynamic prefix
      console.log("🆔 [AdminController] Generating employee ID...");
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
      console.log("✅ [AdminController] Employee ID generated:", employeeId);

      // Generate invitation token
      console.log("🎫 [AdminController] Generating invitation token...");
      const invitationToken = uuidv4();
      const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      console.log(
        "✅ [AdminController] Invitation token generated:",
        invitationToken.substring(0, 8) + "..."
      );

      // Ensure the employee is created in the admin's department
      console.log("📝 [AdminController] Preparing employee data...");
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
      console.log("✅ [AdminController] Employee data prepared:", {
        employeeId: employeeData.employeeId,
        department: employeeData.department,
        role: employeeData.role,
        status: employeeData.status,
      });

      // Send the invitation email
      console.log("📧 [AdminController] Sending invitation email...");
      try {
        await EmailService.sendInvitationEmail(
          employeeData.email,
          invitationToken,
          UserRole.USER
        );
        console.log("✅ [AdminController] Invitation email sent successfully");
      } catch (emailError) {
        console.error(
          "❌ [AdminController] Failed to send invitation email:",
          emailError
        );
        console.error("❌ [AdminController] Email error details:", {
          email: employeeData.email,
          error: emailError.message,
          stack: emailError.stack,
        });
        throw new ApiError(
          500,
          "Failed to send invitation email. Employee not created."
        );
      }

      // Create the employee after successful email sending
      console.log("💾 [AdminController] Creating employee in database...");
      const employee = await UserModel.create(employeeData);
      console.log(
        "✅ [AdminController] Employee created in database:",
        employee._id
      );

      // Remove sensitive data from response
      console.log(
        "🔒 [AdminController] Removing sensitive data from response..."
      );
      const employeeResponse = employee.toObject();
      delete employeeResponse.password;
      delete employeeResponse.invitationToken;
      console.log("✅ [AdminController] Sensitive data removed");

      console.log("📤 [AdminController] Sending successful response");
      res.status(201).json({
        success: true,
        message: "Employee created successfully. Invitation sent.",
        employee: employeeResponse,
      });
      console.log(
        "✅ [AdminController] Employee creation process completed successfully"
      );
    } catch (error) {
      console.error("❌ [AdminController] Error in createEmployee:", error);
      console.error("❌ [AdminController] Error details:", {
        message: error.message,
        statusCode: error.statusCode,
        stack: error.stack,
      });
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
      console.log("🔄 Starting single employee payroll processing (Admin)");
      console.log("📝 Request data:", JSON.stringify(req.body, null, 2));

      const { employeeId, month, year, frequency, departmentId, salaryGrade } =
        req.body;

      // Initialize comprehensive summary object
      const processingSummary = {
        totalAttempted: 1,
        processed: 0,
        skipped: 0,
        failed: 0,
        errors: [],
        warnings: [],
        details: {
          employeeId,
          departmentId,
          month,
          year,
          frequency,
          employeeName: null,
          departmentName: null,
          netPay: null,
          processingTime: null,
          payrollStatus: null,
        },
      };

      const startTime = Date.now();

      // Fetch admin with full details
      const admin = await UserModel.findById(req.user.id)
        .populate("department", "name code")
        .select("+position +role +department");

      // Check if admin exists and has necessary permissions
      if (!admin) {
        const error = "Admin not found";
        processingSummary.failed = 1;
        processingSummary.errors.push({
          type: "AUTHENTICATION_ERROR",
          message: error,
          code: "ADMIN_NOT_FOUND",
        });

        console.error(`❌ ${error}`);
        return res.status(404).json({
          success: false,
          message: error,
          summary: processingSummary,
        });
      }

      // Validate department access
      const targetDepartment = departmentId || admin.department?._id;
      if (!targetDepartment) {
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

      // Check if admin has access to this department
      const hasAccess =
        admin.role === "super-admin" ||
        admin.department?._id.toString() === targetDepartment.toString();

      if (!hasAccess) {
        const error = "You don't have access to this department";
        processingSummary.failed = 1;
        processingSummary.errors.push({
          type: "PERMISSION_ERROR",
          message: error,
          code: "DEPARTMENT_ACCESS_DENIED",
          adminDepartment: admin.department?._id,
          targetDepartment,
        });

        console.error(`❌ ${error}`);
        return res.status(403).json({
          success: false,
          message: error,
          summary: processingSummary,
        });
      }

      // Get employee with proper department check
      const employee = await UserModel.findOne({
        _id: employeeId,
        department: targetDepartment,
        status: "active",
      });

      if (!employee) {
        const error = "Employee not found or not active";
        processingSummary.failed = 1;
        processingSummary.errors.push({
          type: "EMPLOYEE_ERROR",
          message: error,
          code: "EMPLOYEE_NOT_FOUND_OR_INACTIVE",
          employeeId,
          departmentId: targetDepartment,
        });

        console.error(`❌ ${error}`);
        return res.status(404).json({
          success: false,
          message: error,
          summary: processingSummary,
        });
      }

      // Update summary with employee details
      processingSummary.details.employeeName = `${employee.firstName} ${employee.lastName}`;

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
          employeeName: processingSummary.details.employeeName,
          period: `${month}/${year} (${frequency})`,
        });

        console.warn(
          `⚠️ ${error} for employee: ${processingSummary.details.employeeName}`
        );
        return res.status(400).json({
          success: false,
          message: error,
          summary: processingSummary,
        });
      }

      // Calculate payroll using PayrollService
      console.log(
        `🧮 Calculating payroll for employee: ${processingSummary.details.employeeName}`
      );
      const payrollData = await PayrollService.calculatePayroll(
        employeeId,
        salaryGrade,
        month,
        year,
        frequency,
        targetDepartment
      );

      if (!payrollData) {
        const error = "Failed to calculate payroll";
        processingSummary.failed = 1;
        processingSummary.errors.push({
          type: "CALCULATION_ERROR",
          message: error,
          code: "PAYROLL_CALCULATION_FAILED",
          employeeId,
          employeeName: processingSummary.details.employeeName,
        });

        console.error(
          `❌ ${error} for employee: ${processingSummary.details.employeeName}`
        );
        return res.status(400).json({
          success: false,
          message: error,
          summary: processingSummary,
        });
      }

      // Enhanced HR Head detection
      const isHRHead =
        (admin.position?.toLowerCase().includes("head of human resources") ||
          admin.position?.toLowerCase().includes("hr head") ||
          admin.role?.toLowerCase() === "head of hr") &&
        admin.department?.name?.toLowerCase().includes("human resources");

      console.log("🔍 Admin Details:", {
        id: admin._id,
        role: admin.role,
        position: admin.position,
        department: admin.department?.name,
        isHRHead,
        positionCheck: admin.position
          ?.toLowerCase()
          .includes("head of human resources"),
        departmentCheck: admin.department?.name
          ?.toLowerCase()
          .includes("human resources"),
      });

      // Get department name for summary
      const department = await DepartmentModel.findById(
        targetDepartment
      ).select("name");
      processingSummary.details.departmentName =
        department?.name || "Unknown Department";

      // Create payroll record
      console.log(
        `💾 Creating payroll record for employee: ${processingSummary.details.employeeName}`
      );
      const payroll = await PayrollModel.create({
        ...payrollData,
        department: targetDepartment,
        status: isHRHead ? PAYROLL_STATUS.PENDING : PAYROLL_STATUS.DRAFT,
        createdBy: admin._id,
        updatedBy: admin._id,
        processedBy: admin._id,
        payment: {
          accountName: "Pending",
          accountNumber: "Pending",
          bankName: "Pending",
        },
        approvalFlow: {
          currentLevel: isHRHead
            ? APPROVAL_LEVELS.HR_MANAGER
            : APPROVAL_LEVELS.DEPARTMENT_HEAD,
          history: [
            {
              level: isHRHead
                ? APPROVAL_LEVELS.HR_MANAGER
                : APPROVAL_LEVELS.DEPARTMENT_HEAD,
              status: "PENDING",
              action: "SUBMIT",
              user: admin._id,
              timestamp: new Date(),
              remarks: isHRHead
                ? "Payroll created and submitted by HR Head"
                : "Initial payroll creation",
            },
          ],
          submittedBy: admin._id,
          submittedAt: isHRHead ? new Date() : null,
        },
      });

      // Update summary with success details
      processingSummary.processed = 1;
      processingSummary.details.netPay = payroll.totals?.netPay;
      processingSummary.details.processingTime = Date.now() - startTime;
      processingSummary.details.payrollStatus = payroll.status;

      console.log(
        `✅ Payroll created successfully for employee: ${processingSummary.details.employeeName}`
      );
      console.log(`💰 Net Pay: ₦${payroll.totals?.netPay?.toLocaleString()}`);
      console.log(`📊 Status: ${payroll.status}`);
      console.log(
        `⏱️ Processing time: ${processingSummary.details.processingTime}ms`
      );

      // Create audit log for payroll creation
      await AuditService.logAction(
        "CREATE",
        "PAYROLL",
        payroll._id,
        admin._id,
        {
          status: isHRHead ? "PENDING" : "DRAFT",
          action: "PAYROLL_CREATED",
          employeeId: employee._id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          month,
          year,
          frequency,
          departmentId: targetDepartment,
          createdBy: admin._id,
          position: admin.position,
          role: admin.role,
          processingTime: processingSummary.details.processingTime,
        }
      );

      // Notify the creating admin
      await NotificationService.createPayrollNotification(
        payroll,
        NOTIFICATION_TYPES.PAYROLL_CREATED,
        admin,
        `You have created a ${isHRHead ? "pending" : "draft"} payroll for ${
          employee.firstName
        } ${employee.lastName} (${employee.employeeId}) for ${month}/${year}`,
        {
          approvalLevel: isHRHead
            ? APPROVAL_LEVELS.HR_MANAGER
            : APPROVAL_LEVELS.DEPARTMENT_HEAD,
          metadata: {
            payrollId: payroll._id,
            employeeId: employee._id,
            departmentId: employee.department._id,
            status: payroll.status,
          },
        }
      );

      // Notify Super Admin about new payroll creation
      const superAdmin = await UserModel.findOne({ role: "super-admin" });
      if (superAdmin) {
        await NotificationService.createPayrollNotification(
          payroll,
          NOTIFICATION_TYPES.PAYROLL_CREATED,
          admin,
          `A new ${
            isHRHead ? "pending" : "draft"
          } payroll has been created for ${employee.firstName} ${
            employee.lastName
          } (${employee.employeeId}) in ${
            admin.department.name
          } department by ${admin.firstName} ${admin.lastName} (${
            admin.position
          })`,
          {
            approvalLevel: isHRHead
              ? APPROVAL_LEVELS.HR_MANAGER
              : APPROVAL_LEVELS.DEPARTMENT_HEAD,
            metadata: {
              payrollId: payroll._id,
              employeeId: employee._id,
              departmentId: targetDepartment,
              createdBy: admin._id,
              status: isHRHead ? "PENDING" : "DRAFT",
            },
          }
        );
      }

      // Set response headers to trigger UI updates
      res.set({
        "x-refresh-payrolls": "true",
        "x-refresh-audit-logs": "true",
      });

      console.log(
        `🎉 Single employee payroll processing completed successfully!`
      );
      console.log(`📊 Summary:`, JSON.stringify(processingSummary, null, 2));

      return res.status(201).json({
        success: true,
        message: "Payroll processed successfully",
        data: payroll,
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
          employeeId: req.body?.employeeId,
          departmentId: req.body?.departmentId,
          month: req.body?.month,
          year: req.body?.year,
          frequency: req.body?.frequency,
          employeeName: null,
          departmentName: null,
          netPay: null,
          processingTime: null,
          payrollStatus: null,
        },
      };

      return res.status(500).json({
        success: false,
        message: "An unexpected error occurred while processing payroll",
        summary: errorSummary,
      });
    }
  }

  static async processMultipleEmployeesPayroll(req, res, next) {
    try {
      console.log("🔄 Starting multiple employees payroll processing (Admin)");
      console.log("📝 Request data:", JSON.stringify(req.body, null, 2));

      const { employeeIds, departmentId, month, year, frequency, userRole } =
        req.body;

      // Initialize comprehensive summary object
      const processingSummary = {
        totalAttempted: employeeIds?.length || 0,
        processed: 0,
        skipped: 0,
        failed: 0,
        errors: [],
        warnings: [],
        details: {
          departmentId,
          month,
          year,
          frequency,
          userRole,
          processingTime: null,
          totalNetPay: 0,
          departmentBreakdown: {},
          employeeDetails: [],
        },
      };

      const startTime = Date.now();

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

      console.log("Processing request:", {
        departmentId,
        month,
        year,
        frequency,
        userRole,
        employeeCount: employeeIds.length,
      });

      // Check if admin is assigned to department
      const admin = await Admin.findById(req.user._id);
      if (!admin) {
        const error = "Admin not found";
        processingSummary.failed = processingSummary.totalAttempted;
        processingSummary.errors.push({
          type: "AUTHENTICATION_ERROR",
          message: error,
          code: "ADMIN_NOT_FOUND",
          adminId: req.user._id,
        });

        console.error(`❌ ${error}:`, req.user._id);
        return res.status(404).json({
          success: false,
          message: error,
          summary: processingSummary,
        });
      }

      if (userRole !== "superadmin" && !admin.departmentId) {
        const error = "You are not assigned to any department";
        processingSummary.failed = processingSummary.totalAttempted;
        processingSummary.errors.push({
          type: "PERMISSION_ERROR",
          message: error,
          code: "NO_DEPARTMENT_ASSIGNED",
          adminId: req.user._id,
        });

        console.error(`❌ ${error}:`, req.user._id);
        return res.status(400).json({
          success: false,
          message: error,
          summary: processingSummary,
        });
      }

      if (
        userRole !== "superadmin" &&
        admin.departmentId.toString() !== departmentId
      ) {
        const error =
          "You can only process payroll for your assigned department";
        processingSummary.failed = processingSummary.totalAttempted;
        processingSummary.errors.push({
          type: "PERMISSION_ERROR",
          message: error,
          code: "DEPARTMENT_ACCESS_DENIED",
          adminDepartment: admin.departmentId,
          requestedDepartment: departmentId,
        });

        console.error(`❌ ${error}:`, {
          adminDepartment: admin.departmentId,
          requestedDepartment: departmentId,
        });
        return res.status(403).json({
          success: false,
          message: error,
          summary: processingSummary,
        });
      }

      const results = {
        total: employeeIds.length,
        processed: 0,
        skipped: 0,
        failed: 0,
        errors: [],
        successful: [],
        skippedDetails: [],
        failedDetails: [],
        processedDetails: [],
      };

      console.log("Starting to process employees");

      // Process each employee's payroll with individual error handling
      for (let i = 0; i < employeeIds.length; i++) {
        const employeeId = employeeIds[i];
        const employeeIndex = i + 1;

        try {
          console.log(
            `\n🔄 Processing employee ${employeeIndex}/${employeeIds.length}: ${employeeId}`
          );

          // Get the employee
          const employee = await UserModel.findById(employeeId);
          if (!employee) {
            const error = `Employee not found: ${employeeId}`;
            console.error(`❌ ${error}`);

            results.failed++;
            results.failedDetails.push(error);
            processingSummary.errors.push({
              type: "EMPLOYEE_ERROR",
              message: error,
              code: "EMPLOYEE_NOT_FOUND",
              employeeId,
              index: employeeIndex,
            });
            continue;
          }

          console.log(
            `✅ Found employee: ${employee.firstName} ${employee.lastName} (${employee.employeeId})`
          );

          // Check for existing payroll
          const existingPayroll = await PayrollModel.findOne({
            employee: employeeId,
            month,
            year,
            frequency,
          });

          if (existingPayroll) {
            const warning = `${employee.firstName} ${employee.lastName} (${employee.employeeId}): Payroll already exists for ${month}/${year}`;
            console.warn(`⚠️ ${warning}`);

            results.skipped++;
            results.skippedDetails.push(warning);
            processingSummary.warnings.push({
              type: "DUPLICATE_PAYROLL",
              message: warning,
              code: "PAYROLL_ALREADY_EXISTS",
              employeeId,
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
            results.failedDetails.push(error);
            processingSummary.errors.push({
              type: "GRADE_ERROR",
              message: error,
              code: "NO_GRADE_LEVEL",
              employeeId,
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
            results.failedDetails.push(error);
            processingSummary.errors.push({
              type: "GRADE_ERROR",
              message: error,
              code: "NO_ACTIVE_SALARY_GRADE",
              employeeId,
              employeeName: `${employee.firstName} ${employee.lastName}`,
              gradeLevel: employee.gradeLevel,
            });
            continue;
          }

          // Calculate payroll
          console.log(
            `🧮 Calculating payroll for ${employee.firstName} ${employee.lastName} (${employee.employeeId})`
          );
          const payrollData = await PayrollService.calculatePayroll(
            employeeId,
            salaryGrade._id,
            month,
            year,
            frequency,
            admin.department._id
          );

          if (!payrollData) {
            const error = `${employee.firstName} ${employee.lastName} (${employee.employeeId}): Failed to calculate payroll`;
            console.error(`❌ ${error}`);

            results.failed++;
            results.failedDetails.push(error);
            processingSummary.errors.push({
              type: "CALCULATION_ERROR",
              message: error,
              code: "PAYROLL_CALCULATION_FAILED",
              employeeId,
              employeeName: `${employee.firstName} ${employee.lastName}`,
            });
            continue;
          }

          console.log(
            `✅ Payroll calculation completed for ${employee.firstName} ${employee.lastName}:`,
            {
              basicSalary: payrollData.basicSalary,
              totalAllowances: payrollData.totals.totalAllowances,
              totalBonuses: payrollData.totals.totalBonuses,
              grossEarnings: payrollData.totals.grossEarnings,
              totalDeductions: payrollData.totals.totalDeductions,
              netPay: payrollData.totals.netPay,
            }
          );

          // Create payroll record
          console.log(
            `💾 Creating payroll record for ${employee.firstName} ${employee.lastName}`
          );
          const payroll = await PayrollModel.create({
            ...payrollData,
            status: PAYROLL_STATUS.DRAFT, // Start with DRAFT status for consistency
            processedBy: admin._id,
            createdBy: admin._id,
            updatedBy: admin._id,
            payment: {
              accountName: "Pending",
              accountNumber: "Pending",
              bankName: "Pending",
            },
            approvalFlow: {
              currentLevel: APPROVAL_LEVELS.DRAFT,
              history: [],
              submittedBy: admin._id,
              submittedAt: new Date(),
              status: PAYROLL_STATUS.DRAFT,
              remarks: "Initial payroll creation",
            },
          });

          // Update summary with success details
          const employeeDetail = {
            employeeId: employee._id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            employeeCode: employee.employeeId,
            departmentName: employee.department?.name || "Unknown",
            netPay: payroll.totals?.netPay,
            payrollId: payroll._id,
          };

          processingSummary.details.employeeDetails.push(employeeDetail);
          processingSummary.details.totalNetPay += payroll.totals?.netPay || 0;

          // Update department breakdown
          const deptName = employee.department?.name || "Unknown";
          if (!processingSummary.details.departmentBreakdown[deptName]) {
            processingSummary.details.departmentBreakdown[deptName] = {
              count: 0,
              totalNetPay: 0,
            };
          }
          processingSummary.details.departmentBreakdown[deptName].count++;
          processingSummary.details.departmentBreakdown[deptName].totalNetPay +=
            payroll.totals?.netPay || 0;

          console.log(`✅ Payroll created with ID: ${payroll._id}`);

          // Create notification for the employee
          console.log(`🔔 Creating notification for employee: ${employeeId}`);
          await NotificationService.createPayrollNotification(
            employeeId,
            "PAYROLL_DRAFT_CREATED",
            payroll
          );

          // Create notification for the admin
          console.log(`🔔 Creating notification for admin: ${admin._id}`);
          await NotificationService.createPayrollNotification(
            admin._id,
            "PAYROLL_DRAFT_CREATED",
            payroll
          );

          results.processed++;
          results.processedDetails.push(
            `${employee.firstName} ${employee.lastName} (${employee.employeeId})`
          );
          results.successful.push({
            employeeId,
            payrollId: payroll._id,
          });

          console.log(
            `✅ Successfully processed payroll for employee: ${employeeId}`
          );
        } catch (error) {
          console.error(
            `❌ Error processing employee ${employeeId}: ${error.message}`
          );
          const errorMessage = `Employee ID ${employeeId}: ${
            error.message || "Unknown error occurred"
          }`;

          results.failed++;
          results.failedDetails.push(errorMessage);
          processingSummary.errors.push({
            type: "PROCESSING_ERROR",
            message: errorMessage,
            code: "EMPLOYEE_PROCESSING_FAILED",
            employeeId,
            index: employeeIndex,
            originalError: error.message,
          });
        }
      }

      // Update final summary
      processingSummary.processed = results.processed;
      processingSummary.skipped = results.skipped;
      processingSummary.failed = results.failed;
      processingSummary.details.processingTime = Date.now() - startTime;

      console.log(`\n Payroll processing summary:`);
      console.log(`- Total employees: ${results.total}`);
      console.log(`- Successfully processed: ${results.processed}`);
      console.log(`- Skipped: ${results.skipped}`);
      console.log(`- Failed: ${results.failed}`);

      // Create audit log for batch payroll processing
      await AuditService.logAction(
        "CREATE",
        "PAYROLL_BATCH",
        null,
        req.user._id,
        {
          action: "BATCH_PAYROLL_PROCESSED",
          totalAttempted: results.total,
          processed: results.processed,
          skipped: results.skipped,
          failed: results.failed,
          departmentId: req.body?.departmentId,
          month: req.body?.month,
          year: req.body?.year,
          frequency: req.body?.frequency,
          userRole: req.body?.userRole,
          processingTime: processingSummary.details.processingTime,
          createdBy: req.user._id,
          position: req.user.position,
          role: req.user.role,
        }
      );

      res.status(200).json({
        success: true,
        message: "Multiple employee payrolls processed",
        data: {
          total: results.total,
          processed: results.processed,
          skipped: results.skipped,
          failed: results.failed,
          processedDetails: results.processedDetails,
          skippedDetails: results.skippedDetails,
          failedDetails: results.failedDetails,
        },
        summary: processingSummary,
      });
    } catch (error) {
      console.error(`❌ Error processing multiple payrolls: ${error.message}`);

      // Create comprehensive error summary
      const errorSummary = {
        totalAttempted: req.body?.employeeIds?.length || 0,
        processed: 0,
        skipped: 0,
        failed: req.body?.employeeIds?.length || 0,
        errors: [
          {
            type: "SYSTEM_ERROR",
            message: error.message,
            code: "BATCH_PROCESSING_FAILED",
            stack: error.stack,
          },
        ],
        warnings: [],
        details: {
          departmentId: req.body?.departmentId,
          month: req.body?.month,
          year: req.body?.year,
          frequency: req.body?.frequency,
          userRole: req.body?.userRole,
          processingTime: null,
          totalNetPay: 0,
          departmentBreakdown: {},
          employeeDetails: [],
        },
      };

      return res.status(500).json({
        success: false,
        message: "An unexpected error occurred during batch payroll processing",
        summary: errorSummary,
      });
    }
  }

  static async processDepartmentPayroll(req, res) {
    try {
      console.log("🔄 Processing department payroll:", req.body);
      console.log("📝 Request data:", JSON.stringify(req.body, null, 2));

      const { month, year, frequency, employeeSalaryGrades } = req.body;
      const adminId = req.user._id;

      // Initialize comprehensive summary object
      const processingSummary = {
        totalAttempted: employeeSalaryGrades?.length || 0,
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
          departmentName: null,
        },
      };

      const startTime = Date.now();

      // Get admin's department
      const admin = await UserModel.findById(adminId)
        .populate("department", "name code")
        .select("department");
      if (!admin?.department) {
        const error = "Admin must be assigned to a department";
        processingSummary.failed = processingSummary.totalAttempted;
        processingSummary.errors.push({
          type: "PERMISSION_ERROR",
          message: error,
          code: "NO_DEPARTMENT_ASSIGNED",
          adminId,
        });

        console.error(`❌ ${error}`);
        return res.status(400).json({
          success: false,
          message: error,
          summary: processingSummary,
        });
      }

      processingSummary.details.departmentName = admin.department.name;

      console.log(`👤 Admin processing department payroll: ${admin._id}`);
      console.log(
        `🏢 Department: ${admin.department.name} (${admin.department._id})`
      );

      // Validate input
      if (
        !employeeSalaryGrades ||
        !Array.isArray(employeeSalaryGrades) ||
        employeeSalaryGrades.length === 0
      ) {
        const error = "No employee salary grades provided or invalid format";
        processingSummary.errors.push({
          type: "VALIDATION_ERROR",
          message: error,
          code: "INVALID_EMPLOYEE_SALARY_GRADES",
        });

        console.error(`❌ ${error}`);
        return res.status(400).json({
          success: false,
          message: error,
          summary: processingSummary,
        });
      }

      // Get all active employees in the department
      const employees = await UserModel.find({
        department: admin.department._id,
        status: "active",
        role: "employee",
      }).select(
        "employeeId firstName lastName email gradeLevel bankDetails department"
      );

      if (!employees.length) {
        const error = "No active employees found in department";
        processingSummary.errors.push({
          type: "DATA_ERROR",
          message: error,
          code: "NO_ACTIVE_EMPLOYEES",
          departmentId: admin.department._id,
          departmentName: admin.department.name,
        });

        console.error(`❌ ${error}`);
        return res.status(404).json({
          success: false,
          message: error,
          summary: processingSummary,
        });
      }

      console.log(
        `👥 Found ${employees.length} active employees in department`
      );

      const results = {
        total: employeeSalaryGrades.length,
        processed: 0,
        skipped: 0,
        failed: 0,
        errors: [],
        successful: [],
        skippedDetails: [],
        failedDetails: [],
        processedDetails: [],
      };

      // Process each employee
      for (let i = 0; i < employeeSalaryGrades.length; i++) {
        const { employeeId, salaryGradeId } = employeeSalaryGrades[i];
        const employeeIndex = i + 1;

        try {
          console.log(
            `\n🔄 Processing employee ${employeeIndex}/${employeeSalaryGrades.length}: ${employeeId}`
          );

          // Find the employee in our employees array
          const employee = employees.find(
            (e) => e._id.toString() === employeeId.toString()
          );

          if (!employee) {
            const warning = `Employee ${employeeId} not found in department, skipping`;
            console.warn(`⚠️ ${warning}`);

            results.skipped++;
            results.skippedDetails.push(warning);
            processingSummary.warnings.push({
              type: "EMPLOYEE_NOT_FOUND",
              message: warning,
              code: "EMPLOYEE_NOT_IN_DEPARTMENT",
              employeeId,
              index: employeeIndex,
            });
            continue;
          }

          console.log(
            `✅ Found employee: ${employee.employeeId} (${employee.firstName} ${employee.lastName})`
          );

          // Skip if employee has no bank details
          if (
            !employee.bankDetails?.accountNumber ||
            !employee.bankDetails?.bankName
          ) {
            const warning = `Employee ${employee.employeeId} has incomplete bank details, skipping`;
            console.warn(`⚠️ ${warning}`);

            results.skipped++;
            results.skippedDetails.push(warning);
            processingSummary.warnings.push({
              type: "BANK_DETAILS_WARNING",
              message: warning,
              code: "INCOMPLETE_BANK_DETAILS",
              employeeId: employee._id,
              employeeName: `${employee.firstName} ${employee.lastName}`,
              employeeCode: employee.employeeId,
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
            const warning = `Payroll already exists for employee ${employee.employeeId} for ${month}/${year}, skipping`;
            console.warn(`⚠️ ${warning}`);

            results.skipped++;
            results.skippedDetails.push(warning);
            processingSummary.warnings.push({
              type: "DUPLICATE_PAYROLL",
              message: warning,
              code: "PAYROLL_ALREADY_EXISTS",
              employeeId: employee._id,
              employeeName: `${employee.firstName} ${employee.lastName}`,
              employeeCode: employee.employeeId,
              period: `${month}/${year}`,
            });
            continue;
          }

          // Get employee's salary grade
          if (!employee.gradeLevel) {
            const error = `${employee.firstName} ${employee.lastName} (${employee.employeeId}): No grade level assigned`;
            console.error(`❌ ${error}`);

            results.failed++;
            results.failedDetails.push(error);
            processingSummary.errors.push({
              type: "GRADE_ERROR",
              message: error,
              code: "NO_GRADE_LEVEL",
              employeeId: employee._id,
              employeeName: `${employee.firstName} ${employee.lastName}`,
              employeeCode: employee.employeeId,
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
            results.failedDetails.push(error);
            processingSummary.errors.push({
              type: "GRADE_ERROR",
              message: error,
              code: "NO_ACTIVE_SALARY_GRADE",
              employeeId: employee._id,
              employeeName: `${employee.firstName} ${employee.lastName}`,
              employeeCode: employee.employeeId,
              gradeLevel: employee.gradeLevel,
            });
            continue;
          }

          // Calculate payroll using the salary grade ID
          console.log(
            `🧮 Calculating payroll for employee ${employee.employeeId} with salary grade ID ${salaryGradeId}`
          );
          const payrollData = await PayrollService.calculatePayroll(
            employee._id,
            salaryGradeId,
            month,
            year,
            frequency,
            admin.department._id
          );

          if (!payrollData) {
            const error = `${employee.firstName} ${employee.lastName} (${employee.employeeId}): Failed to calculate payroll`;
            console.error(`❌ ${error}`);

            results.failed++;
            results.failedDetails.push(error);
            processingSummary.errors.push({
              type: "CALCULATION_ERROR",
              message: error,
              code: "PAYROLL_CALCULATION_FAILED",
              employeeId: employee._id,
              employeeName: `${employee.firstName} ${employee.lastName}`,
              employeeCode: employee.employeeId,
            });
            continue;
          }

          console.log(
            `✅ Payroll calculation completed for ${employee.firstName} ${employee.lastName}:`,
            {
              basicSalary: payrollData.basicSalary,
              totalAllowances: payrollData.totals.totalAllowances,
              totalBonuses: payrollData.totals.totalBonuses,
              grossEarnings: payrollData.totals.grossEarnings,
              totalDeductions: payrollData.totals.totalDeductions,
              netPay: payrollData.totals.netPay,
            }
          );

          // Create payroll record
          console.log(
            `💾 Creating payroll record for ${employee.firstName} ${employee.lastName}`
          );
          const payroll = await PayrollModel.create({
            ...payrollData,
            status: PAYROLL_STATUS.DRAFT,
            processedBy: adminId,
            createdBy: adminId,
            updatedBy: adminId,
            payment: {
              accountName: "Pending",
              accountNumber: "Pending",
              bankName: "Pending",
            },
            approvalFlow: {
              currentLevel: APPROVAL_LEVELS.DRAFT,
              history: [],
              submittedBy: adminId,
              submittedAt: new Date(),
              status: PAYROLL_STATUS.DRAFT,
              remarks: "Initial payroll creation",
            },
          });

          // Update summary with success details
          const employeeDetail = {
            employeeId: employee._id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            employeeCode: employee.employeeId,
            departmentName: employee.department?.name || admin.department.name,
            netPay: payroll.totals?.netPay,
            payrollId: payroll._id,
          };

          processingSummary.details.employeeDetails.push(employeeDetail);
          processingSummary.details.totalNetPay += payroll.totals?.netPay || 0;

          // Update department breakdown
          const deptName = employee.department?.name || admin.department.name;
          if (!processingSummary.details.departmentBreakdown[deptName]) {
            processingSummary.details.departmentBreakdown[deptName] = {
              count: 0,
              totalNetPay: 0,
            };
          }
          processingSummary.details.departmentBreakdown[deptName].count++;
          processingSummary.details.departmentBreakdown[deptName].totalNetPay +=
            payroll.totals?.netPay || 0;

          console.log(`✅ Payroll created with ID: ${payroll._id}`);

          // Create notification for the employee
          console.log(`🔔 Creating notification for employee: ${employee._id}`);
          await NotificationService.createPayrollNotification(
            payroll,
            NOTIFICATION_TYPES.PAYROLL_DRAFT_CREATED,
            admin,
            `A draft payroll has been created for ${month}/${year}`
          );

          // Create notification for the admin
          console.log(`🔔 Creating notification for admin: ${adminId}`);
          await NotificationService.createPayrollNotification(
            payroll,
            NOTIFICATION_TYPES.PAYROLL_DRAFT_CREATED,
            admin,
            `You have created a draft payroll for ${employee.firstName} ${employee.lastName} for ${month}/${year}`
          );

          results.processed++;
          results.processedDetails.push(
            `${employee.firstName} ${employee.lastName} (${employee.employeeId})`
          );
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
            `❌ Error processing employee ${employeeId}: ${error.message}`
          );
          const errorMessage = `Employee ID ${employeeId}: ${
            error.message || "Unknown error occurred"
          }`;

          results.failed++;
          results.failedDetails.push(errorMessage);
          processingSummary.errors.push({
            type: "PROCESSING_ERROR",
            message: errorMessage,
            code: "EMPLOYEE_PROCESSING_FAILED",
            employeeId,
            index: employeeIndex,
            originalError: error.message,
          });
        }
      }

      // Update final summary
      processingSummary.processed = results.processed;
      processingSummary.skipped = results.skipped;
      processingSummary.failed = results.failed;
      processingSummary.details.processingTime = Date.now() - startTime;

      console.log(`\n Payroll processing summary:`);
      console.log(`- Total employees: ${results.total}`);
      console.log(`- Successfully processed: ${results.processed}`);
      console.log(`- Skipped: ${results.skipped}`);
      console.log(`- Failed: ${results.failed}`);

      // Create audit log for batch payroll processing
      await AuditService.logAction(
        "CREATE",
        "PAYROLL_BATCH",
        null,
        req.user._id,
        {
          action: "BATCH_PAYROLL_PROCESSED",
          totalAttempted: results.total,
          processed: results.processed,
          skipped: results.skipped,
          failed: results.failed,
          departmentId: req.body?.departmentId,
          month: req.body?.month,
          year: req.body?.year,
          frequency: req.body?.frequency,
          userRole: req.body?.userRole,
          processingTime: processingSummary.details.processingTime,
          createdBy: req.user._id,
          position: req.user.position,
          role: req.user.role,
        }
      );

      return res.status(200).json({
        success: true,
        message: "Department payroll processed",
        data: {
          total: results.total,
          processed: results.processed,
          skipped: results.skipped,
          failed: results.failed,
          processedDetails: results.processedDetails,
          skippedDetails: results.skippedDetails,
          failedDetails: results.failedDetails,
        },
        summary: processingSummary,
      });
    } catch (error) {
      console.error(`❌ Error processing department payroll: ${error.message}`);

      // Create comprehensive error summary
      const errorSummary = {
        totalAttempted: req.body?.employeeSalaryGrades?.length || 0,
        processed: 0,
        skipped: 0,
        failed: req.body?.employeeSalaryGrades?.length || 0,
        errors: [
          {
            type: "SYSTEM_ERROR",
            message: error.message,
            code: "DEPARTMENT_PROCESSING_FAILED",
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
          departmentName: null,
        },
      };

      return res.status(500).json({
        success: false,
        message:
          "An unexpected error occurred during department payroll processing",
        summary: errorSummary,
      });
    }
  }

  static async submitDepartmentPayrolls(req, res, next) {
    try {
      console.log("🔄 Submitting department payrolls:", req.body);
      console.log("📝 Request data:", JSON.stringify(req.body, null, 2));

      const { month, year, remarks } = req.body;
      const adminId = req.user.id;

      // Initialize comprehensive summary object
      const processingSummary = {
        totalAttempted: 0,
        submitted: 0,
        skipped: 0,
        failed: 0,
        errors: [],
        warnings: [],
        details: {
          month,
          year,
          remarks,
          processingTime: null,
          departmentName: null,
          nextApprover: null,
          payrollDetails: [],
        },
      };

      const startTime = Date.now();

      const admin = await UserModel.findById(adminId).populate(
        "department",
        "name code"
      );

      if (!admin?.department) {
        const error = "Admin is not assigned to any department";
        processingSummary.errors.push({
          type: "PERMISSION_ERROR",
          message: error,
          code: "NO_DEPARTMENT_ASSIGNED",
          adminId,
        });

        console.error(`❌ ${error}`);
        return res.status(400).json({
          success: false,
          message: error,
          summary: processingSummary,
        });
      }

      processingSummary.details.departmentName = admin.department.name;

      console.log(
        `👤 Admin submitting payrolls: ${admin.firstName} ${admin.lastName} (${admin._id})`
      );
      console.log(
        `🏢 Department: ${admin.department.name} (${admin.department._id})`
      );

      // Get department head based on position - using a more reliable approach
      let departmentHead = await UserModel.findOne({
        department: admin.department._id,
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

      // If no exact match, try a more flexible approach
      if (!departmentHead) {
        const allDepartmentUsers = await UserModel.find({
          department: admin.department._id,
          status: "active",
        });

        // Find the first user with "head" in their position
        const potentialHead = allDepartmentUsers.find(
          (user) =>
            user.position && user.position.toLowerCase().includes("head")
        );

        if (potentialHead) {
          console.log(
            `Found department head: ${potentialHead.firstName} ${potentialHead.lastName}`
          );
          departmentHead = potentialHead;
        } else {
          const error = "No department head found for your department";
          processingSummary.errors.push({
            type: "APPROVAL_ERROR",
            message: error,
            code: "NO_DEPARTMENT_HEAD",
            departmentId: admin.department._id,
            departmentName: admin.department.name,
          });

          console.error(`❌ ${error}`);
          return res.status(404).json({
            success: false,
            message: error,
            summary: processingSummary,
          });
        }
      }

      processingSummary.details.nextApprover = {
        id: departmentHead._id,
        name: `${departmentHead.firstName} ${departmentHead.lastName}`,
        position: departmentHead.position,
        level: "DEPARTMENT_HEAD",
      };

      // Get HR Manager (Head of Human Resources) - using a more reliable approach
      const hrDepartment = await DepartmentModel.findOne({
        name: { $in: ["Human Resources", "HR"] },
        status: "active",
      });

      const hrManager = hrDepartment
        ? await UserModel.findOne({
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
          })
        : null;

      // Get Finance Director (Head of Finance) - using a more reliable approach
      const financeDepartment = await DepartmentModel.findOne({
        name: { $in: ["Finance", "Financial"] },
        status: "active",
      });

      const financeDirector = financeDepartment
        ? await UserModel.findOne({
            department: financeDepartment._id,
            position: {
              $in: [
                "Head of Finance",
                "Finance Director",
                "Finance Head",
                "Finance Manager",
                "Financial Manager",
              ],
            },
            status: "active",
          })
        : null;

      // Find all draft payrolls for the department in the specified month and year
      console.log(
        `🔍 Searching for draft payrolls in ${admin.department.name} for ${month}/${year}`
      );
      const draftPayrolls = await PayrollModel.find({
        department: admin.department._id,
        month,
        year,
        status: PAYROLL_STATUS.DRAFT,
      }).populate("employee", "firstName lastName employeeId");

      if (draftPayrolls.length === 0) {
        const error = "No draft payrolls found for submission";
        processingSummary.errors.push({
          type: "DATA_ERROR",
          message: error,
          code: "NO_DRAFT_PAYROLLS",
          departmentId: admin.department._id,
          departmentName: admin.department.name,
          month,
          year,
        });

        console.error(`❌ ${error}`);
        return res.status(404).json({
          success: false,
          message: error,
          summary: processingSummary,
        });
      }

      processingSummary.totalAttempted = draftPayrolls.length;
      console.log(`📋 Found ${draftPayrolls.length} draft payrolls to submit`);

      // Update all payrolls to PENDING status
      const updatedPayrolls = [];
      const failedPayrolls = [];

      for (let i = 0; i < draftPayrolls.length; i++) {
        const payroll = draftPayrolls[i];
        const payrollIndex = i + 1;

        try {
          console.log(
            `\n🔄 Updating payroll ${payrollIndex}/${draftPayrolls.length} to PENDING: ${payroll._id}`
          );
          console.log(
            `👤 Employee: ${payroll.employee?.firstName} ${payroll.employee?.lastName} (${payroll.employee?.employeeId})`
          );

          // Special case for HR department - skip Department Head level if submitter is HR Manager/Head
          const isHRDepartment =
            hrDepartment &&
            admin.department._id.toString() === hrDepartment._id.toString();

          const isHRManager =
            admin.position &&
            [
              "Head of Human Resources",
              "HR Manager",
              "HR Head",
              "HR Director",
              "Human Resources Manager",
              "Head of HR",
              "HR HOD",
              "HR Department Head",
            ].some((position) =>
              admin.position.toLowerCase().includes(position.toLowerCase())
            );

          // Skip department head level only if submitter is HR Manager/Head
          const initialApprovalLevel =
            isHRDepartment && isHRManager
              ? APPROVAL_LEVELS.HR_MANAGER
              : APPROVAL_LEVELS.DEPARTMENT_HEAD;

          // Update payroll status and add to approval flow
          payroll.status = PAYROLL_STATUS.PENDING;

          // Set approval flow with a single history entry
          payroll.approvalFlow = {
            currentLevel: initialApprovalLevel,
            history: [
              {
                level: initialApprovalLevel,
                status: PAYROLL_STATUS.PENDING,
                action: "SUBMIT",
                user: admin._id,
                timestamp: new Date(),
                remarks:
                  remarks ||
                  `Submitted for ${initialApprovalLevel
                    .replace(/_/g, " ")
                    .toLowerCase()} approval`,
              },
            ],
            submittedBy: admin._id,
            submittedAt: new Date(),
            remarks:
              remarks ||
              `Submitted for ${initialApprovalLevel
                .replace(/_/g, " ")
                .toLowerCase()} approval`,
          };

          const savedPayroll = await payroll.save();
          updatedPayrolls.push(savedPayroll);

          // Add to summary details
          processingSummary.details.payrollDetails.push({
            payrollId: savedPayroll._id,
            employeeId: savedPayroll.employee?._id,
            employeeName: `${savedPayroll.employee?.firstName} ${savedPayroll.employee?.lastName}`,
            employeeCode: savedPayroll.employee?.employeeId,
            netPay: savedPayroll.totals?.netPay,
            approvalLevel: initialApprovalLevel,
          });

          console.log(`✅ Successfully updated payroll: ${savedPayroll._id}`);
        } catch (error) {
          console.error(
            `❌ Error updating payroll ${payroll._id}: ${error.message}`
          );
          failedPayrolls.push({
            payrollId: payroll._id,
            employeeName: `${payroll.employee?.firstName} ${payroll.employee?.lastName}`,
            error: error.message,
          });

          processingSummary.errors.push({
            type: "UPDATE_ERROR",
            message: `Failed to update payroll: ${error.message}`,
            code: "PAYROLL_UPDATE_FAILED",
            payrollId: payroll._id,
            employeeName: `${payroll.employee?.firstName} ${payroll.employee?.lastName}`,
            index: payrollIndex,
          });
        }
      }

      // Update summary counts
      processingSummary.submitted = updatedPayrolls.length;
      processingSummary.failed = failedPayrolls.length;
      processingSummary.details.processingTime = Date.now() - startTime;

      console.log(`\n Payroll submission summary:`);
      console.log(`- Total payrolls: ${processingSummary.totalAttempted}`);
      console.log(`- Successfully submitted: ${processingSummary.submitted}`);
      console.log(`- Failed: ${processingSummary.failed}`);

      // Create notifications for all stakeholders
      if (updatedPayrolls.length > 0) {
        console.log(
          `🔔 Creating notifications for ${updatedPayrolls.length} payrolls`
        );
        const notificationPromises = [];

        // Notify department head
        notificationPromises.push(
          NotificationService.createBatchPayrollNotifications(
            departmentHead._id,
            NOTIFICATION_TYPES.PAYROLL_SUBMITTED,
            updatedPayrolls,
            remarks || "Submitted for department head approval"
          )
        );

        // Notify HR Manager if found
        if (hrManager) {
          notificationPromises.push(
            NotificationService.createBatchPayrollNotifications(
              hrManager._id,
              NOTIFICATION_TYPES.PAYROLL_SUBMITTED,
              updatedPayrolls,
              remarks || "Submitted for department head approval"
            )
          );
        }

        // Notify Finance Director if found
        if (financeDirector) {
          notificationPromises.push(
            NotificationService.createBatchPayrollNotifications(
              financeDirector._id,
              NOTIFICATION_TYPES.PAYROLL_SUBMITTED,
              updatedPayrolls,
              remarks || "Submitted for department head approval"
            )
          );
        }

        // Notify super admins
        const superAdmins = await UserModel.find({
          role: "SUPER_ADMIN",
          status: "active",
        });
        for (const superAdmin of superAdmins) {
          notificationPromises.push(
            NotificationService.createBatchPayrollNotifications(
              superAdmin._id,
              NOTIFICATION_TYPES.PAYROLL_SUBMITTED,
              updatedPayrolls,
              remarks || "Submitted for department head approval"
            )
          );
        }

        // Create notifications for employees
        for (const payroll of updatedPayrolls) {
          notificationPromises.push(
            NotificationService.createPayrollNotification(
              payroll.employee,
              NOTIFICATION_TYPES.PAYROLL_SUBMITTED,
              payroll,
              remarks || "Submitted for department head approval"
            )
          );
        }

        await Promise.all(notificationPromises);
        console.log(`✅ Notifications sent successfully`);
      }

      console.log(`\n Payroll submission completed!`);
      console.log(
        `📊 Final Summary:`,
        JSON.stringify(processingSummary, null, 2)
      );

      return res.status(200).json({
        success: true,
        message: "Payrolls submitted successfully for approval",
        data: {
          submitted: updatedPayrolls.length,
          failed: failedPayrolls.length,
          payrolls: updatedPayrolls,
          failedPayrolls,
          nextApprover: departmentHead,
        },
        summary: processingSummary,
      });
    } catch (error) {
      console.error(
        `❌ Error submitting department payrolls: ${error.message}`
      );
      console.error("Stack trace:", error.stack);

      // Create comprehensive error summary
      const errorSummary = {
        totalAttempted: 0,
        submitted: 0,
        skipped: 0,
        failed: 0,
        errors: [
          {
            type: "SYSTEM_ERROR",
            message: error.message,
            code: "DEPARTMENT_SUBMISSION_FAILED",
            stack: error.stack,
          },
        ],
        warnings: [],
        details: {
          month: req.body?.month,
          year: req.body?.year,
          remarks: req.body?.remarks,
          processingTime: null,
          departmentName: null,
          nextApprover: null,
          payrollDetails: [],
        },
      };

      return res.status(500).json({
        success: false,
        message:
          "An unexpected error occurred during department payroll submission",
        summary: errorSummary,
      });
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

      // Check if any payrolls are already approved at the current level
      const alreadyApprovedPayrolls = pendingPayrolls.filter((payroll) => {
        const currentLevel = payroll.approvalFlow.currentLevel;
        const lastApproval = payroll.approvalFlow.history
          .filter((h) => h.level === currentLevel)
          .sort((a, b) => b.timestamp - a.timestamp)[0];

        return lastApproval && lastApproval.status === "APPROVED";
      });

      if (alreadyApprovedPayrolls.length > 0) {
        throw new ApiError(
          400,
          "Some payrolls have already been approved at the current level"
        );
      }

      // Check if user has permission to approve at current level
      const userPosition = admin.position.toUpperCase();
      const userDepartment = admin.department.toString();
      let canApprove = false;
      let currentLevel = pendingPayrolls[0].approvalFlow.currentLevel;
      let nextLevel = null;
      let approvalMessage = "";

      // Department Head approval
      if (currentLevel === APPROVAL_LEVELS.DEPARTMENT_HEAD) {
        // Special case for HR Department Head
        const hrDepartment = await DepartmentModel.findOne({
          name: { $in: ["Human Resources", "HR"] },
          status: "active",
        });

        // If user is in HR department and has HR position, they should only approve at HR level
        if (
          hrDepartment &&
          admin.department.toString() === hrDepartment._id.toString() &&
          admin.position &&
          [
            "Head of Human Resources",
            "HR Manager",
            "HR Head",
            "Human Resources Manager",
            "HR Director",
          ].some((pos) => admin.position.includes(pos))
        ) {
          canApprove = false;
          console.log(
            "HR Department Head detected - should only approve at HR level"
          );
        } else {
          // Regular Department Head check
          canApprove =
            admin.position &&
            [
              "Head of Department",
              "Department Head",
              "Head",
              "Director",
              "Manager",
            ].some((pos) =>
              admin.position.toLowerCase().includes(pos.toLowerCase())
            );
        }
        nextLevel = APPROVAL_LEVELS.HR_MANAGER;
        approvalMessage = "Department Head";
        console.log("Department Head approval check:", {
          canApprove,
          position: admin.position,
          isHRDepartment:
            hrDepartment &&
            admin.department.toString() === hrDepartment._id.toString(),
        });
      }
      // HR Manager approval
      else if (currentLevel === APPROVAL_LEVELS.HR_MANAGER) {
        const hrDepartment = await DepartmentModel.findOne({
          name: { $in: ["Human Resources", "HR"] },
          status: "active",
        });
        canApprove =
          hrDepartment &&
          admin.department.toString() === hrDepartment._id.toString() &&
          admin.position &&
          [
            "Head of Human Resources",
            "HR Manager",
            "HR Head",
            "Human Resources Manager",
            "HR Director",
          ].some((pos) => admin.position.includes(pos));
        nextLevel = APPROVAL_LEVELS.FINANCE_DIRECTOR;
        approvalMessage = "HR Manager";
        console.log("HR Manager approval check:", {
          canApprove,
          position: admin.position,
          department: admin.department.toString(),
          hrDepartmentId: hrDepartment?._id.toString(),
        });
      }
      // Finance Director approval
      else if (currentLevel === APPROVAL_LEVELS.FINANCE_DIRECTOR) {
        const financeDepartment = await DepartmentModel.findOne({
          name: { $in: ["Finance", "Financial"] },
          status: "active",
        });
        canApprove =
          financeDepartment &&
          userDepartment === financeDepartment._id.toString() &&
          [
            "Head of Finance",
            "Finance Director",
            "Finance Head",
            "Finance Manager",
            "Financial Manager",
          ].some((pos) => userPosition.includes(pos));
        nextLevel = APPROVAL_LEVELS.SUPER_ADMIN;
        approvalMessage = "Finance Director";
      }
      // Super Admin approval
      else if (currentLevel === APPROVAL_LEVELS.SUPER_ADMIN) {
        canApprove = admin.role === "SUPER_ADMIN";
        nextLevel = null; // Final approval level
        approvalMessage = "Super Admin";
      }

      if (!canApprove) {
        throw new ApiError(
          403,
          `You don't have permission to approve at ${currentLevel} level`
        );
      }

      // Initialize approval summary
      const approvalSummary = {
        totalPayrolls: pendingPayrolls.length,
        approved: 0,
        failed: 0,
        errors: [],
        warnings: [],
        departmentInfo: {
          departmentId: admin.department.toString(),
          departmentName: admin.department,
          month,
          year,
        },
        approvalDetails: {
          currentLevel,
          nextLevel: nextLevel || "COMPLETED",
          approver: {
            id: admin._id,
            name: admin.firstName + " " + admin.lastName,
            position: admin.position,
            role: admin.role,
          },
          approvalMessage,
          timestamp: new Date(),
        },
        performance: {
          startTime: Date.now(),
          endTime: null,
          duration: null,
        },
      };

      console.log(`🚀 Starting department payroll approval process:`, {
        department: approvalSummary.departmentInfo,
        approvalLevel: currentLevel,
        totalPayrolls: approvalSummary.totalPayrolls,
        approver: approvalSummary.approvalDetails.approver,
      });

      // Update all payrolls
      const updatedPayrolls = await Promise.all(
        pendingPayrolls.map(async (payroll, index) => {
          try {
            console.log(
              `�� Processing payroll ${index + 1}/${pendingPayrolls.length}:`,
              {
                employeeId: payroll.employee._id,
                employeeName:
                  payroll.employee.firstName + " " + payroll.employee.lastName,
                currentLevel,
                nextLevel,
              }
            );

            // Add to approval history
            payroll.approvalFlow.history.push({
              level: currentLevel,
              status: "APPROVED",
              action: "APPROVE",
              user: admin._id,
              timestamp: new Date(),
              remarks: remarks || `Approved by ${approvalMessage}`,
            });

            // Update current level to next level if not final approval
            if (nextLevel) {
              payroll.approvalFlow.currentLevel = nextLevel;
            } else {
              // This is the final approval
              payroll.status = PAYROLL_STATUS.APPROVED;
              payroll.approvalFlow.currentLevel = "COMPLETED";
            }

            await payroll.save();

            // Send individual notifications to employees
            await NotificationService.createPayrollNotification(
              payroll.employee._id,
              "PAYROLL_APPROVED",
              payroll,
              remarks || `Approved by ${approvalMessage}`
            );

            approvalSummary.approved++;
            console.log(
              `✅ Successfully approved payroll for ${payroll.employee.firstName} ${payroll.employee.lastName}`
            );

            return payroll;
          } catch (error) {
            approvalSummary.failed++;
            const errorMessage = `Failed to approve payroll for ${payroll.employee.firstName} ${payroll.employee.lastName}: ${error.message}`;
            approvalSummary.errors.push(errorMessage);
            console.error(`❌ ${errorMessage}`, error);

            // Return the original payroll for error tracking
            return {
              ...payroll.toObject(),
              approvalError: error.message,
            };
          }
        })
      );

      // Calculate performance metrics
      approvalSummary.performance.endTime = Date.now();
      approvalSummary.performance.duration =
        approvalSummary.performance.endTime -
        approvalSummary.performance.startTime;

      // Send batch notification to department admin
      try {
        await NotificationService.createPayrollNotification(
          admin._id,
          "DEPARTMENT_PAYROLL_APPROVED",
          { month, year },
          remarks || `Approved by ${approvalMessage}`
        );
        console.log(`📧 Sent batch notification to department admin`);
      } catch (error) {
        const warningMessage = `Failed to send batch notification: ${error.message}`;
        approvalSummary.warnings.push(warningMessage);
        console.warn(`⚠️ ${warningMessage}`);
      }

      // Log final summary
      console.log(`�� Department Payroll Approval Summary:`, {
        department: approvalSummary.departmentInfo.departmentName,
        month: approvalSummary.departmentInfo.month,
        year: approvalSummary.departmentInfo.year,
        totalPayrolls: approvalSummary.totalPayrolls,
        approved: approvalSummary.approved,
        failed: approvalSummary.failed,
        successRate: `${(
          (approvalSummary.approved / approvalSummary.totalPayrolls) *
          100
        ).toFixed(2)}%`,
        approvalLevel: currentLevel,
        nextLevel: nextLevel || "COMPLETED",
        approver: approvalSummary.approvalDetails.approver.name,
        duration: `${approvalSummary.performance.duration}ms`,
        errors: approvalSummary.errors.length,
        warnings: approvalSummary.warnings.length,
      });

      // Log detailed errors if any
      if (approvalSummary.errors.length > 0) {
        console.error(
          `❌ Approval Errors (${approvalSummary.errors.length}):`,
          approvalSummary.errors
        );
      }

      // Log warnings if any
      if (approvalSummary.warnings.length > 0) {
        console.warn(
          `⚠️ Approval Warnings (${approvalSummary.warnings.length}):`,
          approvalSummary.warnings
        );
      }

      res.status(200).json({
        success: true,
        message: `Department payrolls approved by ${approvalMessage} successfully`,
        data: {
          approved: approvalSummary.approved,
          failed: approvalSummary.failed,
          total: approvalSummary.totalPayrolls,
          successRate: `${(
            (approvalSummary.approved / approvalSummary.totalPayrolls) *
            100
          ).toFixed(2)}%`,
          payrolls: updatedPayrolls,
          currentLevel: nextLevel || "COMPLETED",
          summary: {
            department: approvalSummary.departmentInfo,
            approvalDetails: approvalSummary.approvalDetails,
            performance: approvalSummary.performance,
            errors: approvalSummary.errors,
            warnings: approvalSummary.warnings,
          },
        },
      });
    } catch (error) {
      console.error(`�� Department Payroll Approval Failed:`, {
        error: error.message,
        stack: error.stack,
        department: admin?.department,
        month,
        year,
      });
      next(error);
    }
  }

  static async rejectDepartmentPayrolls(req, res, next) {
    try {
      const { departmentId } = req.params;
      const { remarks } = req.body;
      const admin = await UserModel.findById(req.user.id);

      if (!admin?.department) {
        throw new ApiError(400, "Admin is not assigned to any department");
      }

      // Get all pending payrolls for the department
      const payrolls = await PayrollModel.find({
        department: departmentId,
        status: PAYROLL_STATUS.PENDING,
      }).populate("employee", "firstName lastName email department");

      if (!payrolls.length) {
        throw new ApiError(404, "No pending payrolls found in the department");
      }

      // Initialize rejection summary
      const rejectionSummary = {
        totalPayrolls: payrolls.length,
        rejected: 0,
        failed: 0,
        errors: [],
        warnings: [],
        departmentInfo: {
          departmentId: departmentId,
          departmentName: admin.department,
        },
        rejectionDetails: {
          rejector: {
            id: admin._id,
            name: admin.firstName + " " + admin.lastName,
            position: admin.position,
            role: admin.role,
          },
          remarks: remarks || "Bulk rejected by HR Admin/HOD",
          timestamp: new Date(),
        },
        notificationSummary: {
          employeeNotifications: 0,
          departmentHeadNotifications: 0,
          adminNotifications: 0,
          failedNotifications: 0,
        },
        performance: {
          startTime: Date.now(),
          endTime: null,
          duration: null,
        },
      };

      console.log(`🚫 Starting department payroll rejection process:`, {
        department: rejectionSummary.departmentInfo,
        totalPayrolls: rejectionSummary.totalPayrolls,
        rejector: rejectionSummary.rejectionDetails.rejector,
        remarks: rejectionSummary.rejectionDetails.remarks,
      });

      const notificationPromises = [];

      // Update each payroll
      for (const payroll of payrolls) {
        try {
          console.log(`🔄 Processing rejection for payroll:`, {
            employeeId: payroll.employee._id,
            employeeName:
              payroll.employee.firstName + " " + payroll.employee.lastName,
            currentLevel: payroll.approvalFlow.currentLevel,
          });

          // Update payroll status and add to approval history
          payroll.status = PAYROLL_STATUS.REJECTED;
          payroll.approvalFlow.history.push({
            level: payroll.approvalFlow.currentLevel,
            status: PAYROLL_STATUS.REJECTED,
            action: "REJECT",
            user: admin._id,
            timestamp: new Date(),
            remarks: remarks || "Bulk rejected by HR Admin/HOD",
          });

          // Update legacy fields for backward compatibility
          payroll.approvalFlow.rejectedBy = admin._id;
          payroll.approvalFlow.rejectedAt = new Date();

          await payroll.save();

          // Notify each employee
          try {
            await NotificationService.createPayrollNotification(
              payroll.employee._id,
              NOTIFICATION_TYPES.PAYROLL_REJECTED,
              {
                _id: payroll._id,
                month: payroll.month,
                year: payroll.year,
                status: PAYROLL_STATUS.REJECTED,
                approvalFlow: payroll.approvalFlow,
                employee: {
                  _id: payroll.employee._id,
                  firstName: payroll.employee.firstName,
                  lastName: payroll.employee.lastName,
                  email: payroll.employee.email,
                  department: payroll.employee.department,
                },
              },
              remarks || "Bulk rejected by HR Admin/HOD"
            );
            rejectionSummary.notificationSummary.employeeNotifications++;
            console.log(
              `📧 Sent rejection notification to ${payroll.employee.firstName} ${payroll.employee.lastName}`
            );
          } catch (notificationError) {
            const warningMessage = `Failed to notify employee ${payroll.employee.firstName} ${payroll.employee.lastName}: ${notificationError.message}`;
            rejectionSummary.warnings.push(warningMessage);
            rejectionSummary.notificationSummary.failedNotifications++;
            console.warn(`⚠️ ${warningMessage}`);
          }

          rejectionSummary.rejected++;
          console.log(
            `✅ Successfully rejected payroll for ${payroll.employee.firstName} ${payroll.employee.lastName}`
          );
        } catch (error) {
          rejectionSummary.failed++;
          const errorMessage = `Failed to reject payroll for ${payroll.employee.firstName} ${payroll.employee.lastName}: ${error.message}`;
          rejectionSummary.errors.push(errorMessage);
          console.error(`❌ ${errorMessage}`, error);
        }
      }

      // Notify the department head
      try {
        const departmentHead = await UserModel.findOne({
          department: departmentId,
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

        if (
          departmentHead &&
          departmentHead._id.toString() !== admin._id.toString()
        ) {
          await NotificationService.createPayrollNotification(
            departmentHead._id,
            NOTIFICATION_TYPES.DEPARTMENT_PAYROLL_REJECTED,
            {
              department: departmentId,
              count: payrolls.length,
              month: payrolls[0].month,
              year: payrolls[0].year,
              status: PAYROLL_STATUS.REJECTED,
              approvalFlow: payrolls[0].approvalFlow,
            },
            remarks || "Bulk rejected by HR Admin/HOD"
          );
          rejectionSummary.notificationSummary.departmentHeadNotifications++;
          console.log(
            `📧 Sent rejection notification to department head: ${departmentHead.firstName} ${departmentHead.lastName}`
          );
        } else {
          console.log(
            `ℹ️ No department head found or admin is the department head`
          );
        }
      } catch (error) {
        const warningMessage = `Failed to notify department head: ${error.message}`;
        rejectionSummary.warnings.push(warningMessage);
        rejectionSummary.notificationSummary.failedNotifications++;
        console.warn(`⚠️ ${warningMessage}`);
      }

      // Notify the admin who rejected
      try {
        await NotificationService.createPayrollNotification(
          admin._id,
          NOTIFICATION_TYPES.DEPARTMENT_PAYROLL_REJECTED,
          {
            department: departmentId,
            count: payrolls.length,
            month: payrolls[0].month,
            year: payrolls[0].year,
            status: PAYROLL_STATUS.REJECTED,
            approvalFlow: payrolls[0].approvalFlow,
          },
          remarks || "Bulk rejected by HR Admin/HOD"
        );
        rejectionSummary.notificationSummary.adminNotifications++;
        console.log(`📧 Sent confirmation notification to admin`);
      } catch (error) {
        const warningMessage = `Failed to notify admin: ${error.message}`;
        rejectionSummary.warnings.push(warningMessage);
        rejectionSummary.notificationSummary.failedNotifications++;
        console.warn(`⚠️ ${warningMessage}`);
      }

      // Calculate performance metrics
      rejectionSummary.performance.endTime = Date.now();
      rejectionSummary.performance.duration =
        rejectionSummary.performance.endTime -
        rejectionSummary.performance.startTime;

      // Log final summary
      console.log(`�� Department Payroll Rejection Summary:`, {
        department: rejectionSummary.departmentInfo.departmentName,
        totalPayrolls: rejectionSummary.totalPayrolls,
        rejected: rejectionSummary.rejected,
        failed: rejectionSummary.failed,
        successRate: `${(
          (rejectionSummary.rejected / rejectionSummary.totalPayrolls) *
          100
        ).toFixed(2)}%`,
        rejector: rejectionSummary.rejectionDetails.rejector.name,
        remarks: rejectionSummary.rejectionDetails.remarks,
        duration: `${rejectionSummary.performance.duration}ms`,
        notifications: {
          employees: rejectionSummary.notificationSummary.employeeNotifications,
          departmentHead:
            rejectionSummary.notificationSummary.departmentHeadNotifications,
          admin: rejectionSummary.notificationSummary.adminNotifications,
          failed: rejectionSummary.notificationSummary.failedNotifications,
        },
        errors: rejectionSummary.errors.length,
        warnings: rejectionSummary.warnings.length,
      });

      // Log detailed errors if any
      if (rejectionSummary.errors.length > 0) {
        console.error(
          `❌ Rejection Errors (${rejectionSummary.errors.length}):`,
          rejectionSummary.errors
        );
      }

      // Log warnings if any
      if (rejectionSummary.warnings.length > 0) {
        console.warn(
          `⚠️ Rejection Warnings (${rejectionSummary.warnings.length}):`,
          rejectionSummary.warnings
        );
      }

      res.status(200).json({
        success: true,
        message: `Successfully rejected ${rejectionSummary.rejected} payrolls`,
        data: {
          rejectedCount: rejectionSummary.rejected,
          failedCount: rejectionSummary.failed,
          total: rejectionSummary.totalPayrolls,
          successRate: `${(
            (rejectionSummary.rejected / rejectionSummary.totalPayrolls) *
            100
          ).toFixed(2)}%`,
          department: departmentId,
          summary: {
            departmentInfo: rejectionSummary.departmentInfo,
            rejectionDetails: rejectionSummary.rejectionDetails,
            notificationSummary: rejectionSummary.notificationSummary,
            performance: rejectionSummary.performance,
            errors: rejectionSummary.errors,
            warnings: rejectionSummary.warnings,
          },
        },
      });
    } catch (error) {
      console.error(`�� Department Payroll Rejection Failed:`, {
        error: error.message,
        stack: error.stack,
        departmentId,
        admin: admin?._id,
      });
      next(error);
    }
  }

  static async submitBulkPayrolls(req, res, next) {
    try {
      const { payrollIds, remarks, frequency } = req.body;
      const admin = await UserModel.findById(req.user.id);

      if (!Array.isArray(payrollIds) || payrollIds.length === 0) {
        throw new ApiError(400, "Please provide an array of payroll IDs");
      }

      // Initialize submission summary
      const submissionSummary = {
        totalRequested: payrollIds.length,
        found: 0,
        submitted: 0,
        failed: 0,
        errors: [],
        warnings: [],
        departmentInfo: {
          departmentId: admin.department.toString(),
          departmentName: admin.department,
        },
        submissionDetails: {
          submitter: {
            id: admin._id,
            name: admin.firstName + " " + admin.lastName,
            position: admin.position,
            role: admin.role,
          },
          remarks: remarks || "Submitted for approval",
          frequency: frequency || "Not specified",
          timestamp: new Date(),
        },
        approvalFlow: {
          departmentHead: null,
          hrManager: null,
          financeDirector: null,
          superAdmins: 0,
          initialLevel: null,
        },
        notificationSummary: {
          departmentHead: 0,
          hrManager: 0,
          financeDirector: 0,
          superAdmins: 0,
          employees: 0,
          failed: 0,
        },
        performance: {
          startTime: Date.now(),
          endTime: null,
          duration: null,
        },
      };

      console.log(`🚀 Starting bulk payroll submission process:`, {
        totalRequested: submissionSummary.totalRequested,
        department: submissionSummary.departmentInfo,
        submitter: submissionSummary.submissionDetails.submitter,
        remarks: submissionSummary.submissionDetails.remarks,
      });

      // Get all payrolls for the admin's department
      const payrolls = await PayrollModel.find({
        _id: { $in: payrollIds },
        department: admin.department,
        status: PAYROLL_STATUS.DRAFT,
      });

      if (payrolls.length === 0) {
        throw new ApiError(404, "No draft payrolls found in your department");
      }

      submissionSummary.found = payrolls.length;
      console.log(
        `�� Found ${submissionSummary.found} draft payrolls to submit`
      );

      // Update frequency if provided
      if (frequency) {
        if (!Object.values(PayrollFrequency).includes(frequency)) {
          throw new ApiError(400, "Invalid payroll frequency");
        }
        try {
          await PayrollModel.updateMany(
            { _id: { $in: payrollIds } },
            { $set: { frequency } }
          );
          console.log(`✅ Updated frequency to ${frequency} for all payrolls`);
        } catch (error) {
          const warningMessage = `Failed to update frequency: ${error.message}`;
          submissionSummary.warnings.push(warningMessage);
          console.warn(`⚠️ ${warningMessage}`);
        }
      }

      // Get department head
      let departmentHead = await UserModel.findOne({
        department: admin.department,
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

      // If no exact match, try a more flexible approach
      if (!departmentHead) {
        const allDepartmentUsers = await UserModel.find({
          department: admin.department,
          status: "active",
        });

        const potentialHead = allDepartmentUsers.find(
          (user) =>
            user.position && user.position.toLowerCase().includes("head")
        );

        if (potentialHead) {
          console.log(
            `Found department head: ${potentialHead.firstName} ${potentialHead.lastName}`
          );
          departmentHead = potentialHead;
        } else {
          throw new ApiError(
            404,
            "No department head found for your department"
          );
        }
      }

      submissionSummary.approvalFlow.departmentHead = {
        id: departmentHead._id,
        name: departmentHead.firstName + " " + departmentHead.lastName,
        position: departmentHead.position,
      };

      // Get HR Manager
      const hrDepartment = await DepartmentModel.findOne({
        name: { $in: ["Human Resources", "HR"] },
        status: "active",
      });

      const hrManager = hrDepartment
        ? await UserModel.findOne({
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
          })
        : null;

      if (hrManager) {
        submissionSummary.approvalFlow.hrManager = {
          id: hrManager._id,
          name: hrManager.firstName + " " + hrManager.lastName,
          position: hrManager.position,
        };
      }

      // Get Finance Director
      const financeDepartment = await DepartmentModel.findOne({
        name: { $in: ["Finance", "Financial"] },
        status: "active",
      });

      const financeDirector = financeDepartment
        ? await UserModel.findOne({
            department: financeDepartment._id,
            position: {
              $in: [
                "Head of Finance",
                "Finance Director",
                "Finance Head",
                "Finance Manager",
                "Financial Manager",
              ],
            },
            status: "active",
          })
        : null;

      if (financeDirector) {
        submissionSummary.approvalFlow.financeDirector = {
          id: financeDirector._id,
          name: financeDirector.firstName + " " + financeDirector.lastName,
          position: financeDirector.position,
        };
      }

      // Update all payrolls
      const updatePromises = payrolls.map(async (payroll, index) => {
        try {
          console.log(
            `�� Processing payroll ${index + 1}/${payrolls.length}:`,
            {
              payrollId: payroll._id,
              employeeId: payroll.employee,
            }
          );

          // Special case for HR department - skip Department Head level if submitter is HR Manager/Head
          const isHRDepartment =
            hrDepartment &&
            admin.department.toString() === hrDepartment._id.toString();

          const isHRManager =
            admin.position &&
            [
              "Head of Human Resources",
              "HR Manager",
              "HR Head",
              "HR Director",
              "Human Resources Manager",
              "Head of HR",
              "HR HOD",
              "HR Department Head",
            ].some((position) =>
              admin.position.toLowerCase().includes(position.toLowerCase())
            );

          // Skip department head level only if submitter is HR Manager/Head
          const initialApprovalLevel =
            isHRDepartment && isHRManager
              ? APPROVAL_LEVELS.HR_MANAGER
              : APPROVAL_LEVELS.DEPARTMENT_HEAD;

          submissionSummary.approvalFlow.initialLevel = initialApprovalLevel;

          // Update payroll status and add to approval flow
          payroll.status = PAYROLL_STATUS.PENDING;

          // Set approval flow with a single history entry
          payroll.approvalFlow = {
            currentLevel: initialApprovalLevel,
            history: [
              {
                level: initialApprovalLevel,
                status: PAYROLL_STATUS.PENDING,
                action: "SUBMIT",
                user: admin._id,
                timestamp: new Date(),
                remarks:
                  remarks ||
                  `Submitted for ${initialApprovalLevel
                    .replace(/_/g, " ")
                    .toLowerCase()} approval`,
              },
            ],
            submittedBy: admin._id,
            submittedAt: new Date(),
            remarks:
              remarks ||
              `Submitted for ${initialApprovalLevel
                .replace(/_/g, " ")
                .toLowerCase()} approval`,
          };

          await payroll.save();
          submissionSummary.submitted++;
          console.log(`✅ Successfully submitted payroll ${payroll._id}`);

          return payroll;
        } catch (error) {
          submissionSummary.failed++;
          const errorMessage = `Failed to submit payroll ${payroll._id}: ${error.message}`;
          submissionSummary.errors.push(errorMessage);
          console.error(`❌ ${errorMessage}`, error);

          // Return the original payroll for error tracking
          return {
            ...payroll.toObject(),
            submissionError: error.message,
          };
        }
      });

      const updatedPayrolls = await Promise.all(updatePromises);
      console.log(
        `✅ Successfully updated ${submissionSummary.submitted} payrolls to PENDING status`
      );

      // Create notifications for all stakeholders
      const notificationPromises = [];

      // Notify department head
      try {
        await NotificationService.createBatchPayrollNotifications(
          departmentHead._id,
          NOTIFICATION_TYPES.PAYROLL_SUBMITTED,
          updatedPayrolls,
          remarks || "Submitted for department head approval"
        );
        submissionSummary.notificationSummary.departmentHead++;
        console.log(
          `📧 Sent notification to department head: ${departmentHead.firstName} ${departmentHead.lastName}`
        );
      } catch (error) {
        const warningMessage = `Failed to notify department head: ${error.message}`;
        submissionSummary.warnings.push(warningMessage);
        submissionSummary.notificationSummary.failed++;
        console.warn(`⚠️ ${warningMessage}`);
      }

      // Notify HR Manager if found
      if (hrManager) {
        try {
          await NotificationService.createBatchPayrollNotifications(
            hrManager._id,
            NOTIFICATION_TYPES.PAYROLL_SUBMITTED,
            updatedPayrolls,
            remarks || "Submitted for department head approval"
          );
          submissionSummary.notificationSummary.hrManager++;
          console.log(
            `📧 Sent notification to HR Manager: ${hrManager.firstName} ${hrManager.lastName}`
          );
        } catch (error) {
          const warningMessage = `Failed to notify HR Manager: ${error.message}`;
          submissionSummary.warnings.push(warningMessage);
          submissionSummary.notificationSummary.failed++;
          console.warn(`⚠️ ${warningMessage}`);
        }
      }

      // Notify Finance Director if found
      if (financeDirector) {
        try {
          await NotificationService.createBatchPayrollNotifications(
            financeDirector._id,
            NOTIFICATION_TYPES.PAYROLL_SUBMITTED,
            updatedPayrolls,
            remarks || "Submitted for department head approval"
          );
          submissionSummary.notificationSummary.financeDirector++;
          console.log(
            `📧 Sent notification to Finance Director: ${financeDirector.firstName} ${financeDirector.lastName}`
          );
        } catch (error) {
          const warningMessage = `Failed to notify Finance Director: ${error.message}`;
          submissionSummary.warnings.push(warningMessage);
          submissionSummary.notificationSummary.failed++;
          console.warn(`⚠️ ${warningMessage}`);
        }
      }

      // Notify super admins
      try {
        const superAdmins = await UserModel.find({
          role: "SUPER_ADMIN",
          status: "active",
        });

        for (const superAdmin of superAdmins) {
          try {
            await NotificationService.createBatchPayrollNotifications(
              superAdmin._id,
              NOTIFICATION_TYPES.PAYROLL_SUBMITTED,
              updatedPayrolls,
              remarks || "Submitted for department head approval"
            );
            submissionSummary.notificationSummary.superAdmins++;
            console.log(
              `📧 Sent notification to Super Admin: ${superAdmin.firstName} ${superAdmin.lastName}`
            );
          } catch (error) {
            const warningMessage = `Failed to notify Super Admin ${superAdmin.firstName} ${superAdmin.lastName}: ${error.message}`;
            submissionSummary.warnings.push(warningMessage);
            submissionSummary.notificationSummary.failed++;
            console.warn(`⚠️ ${warningMessage}`);
          }
        }

        submissionSummary.approvalFlow.superAdmins = superAdmins.length;
      } catch (error) {
        const warningMessage = `Failed to fetch or notify Super Admins: ${error.message}`;
        submissionSummary.warnings.push(warningMessage);
        submissionSummary.notificationSummary.failed++;
        console.warn(`⚠️ ${warningMessage}`);
      }

      // Create notifications for employees
      for (const payroll of updatedPayrolls) {
        try {
          await NotificationService.createPayrollNotification(
            payroll.employee,
            NOTIFICATION_TYPES.PAYROLL_SUBMITTED,
            payroll,
            remarks || "Submitted for department head approval"
          );
          submissionSummary.notificationSummary.employees++;
        } catch (error) {
          const warningMessage = `Failed to notify employee for payroll ${payroll._id}: ${error.message}`;
          submissionSummary.warnings.push(warningMessage);
          submissionSummary.notificationSummary.failed++;
          console.warn(`⚠️ ${warningMessage}`);
        }
      }

      // Calculate performance metrics
      submissionSummary.performance.endTime = Date.now();
      submissionSummary.performance.duration =
        submissionSummary.performance.endTime -
        submissionSummary.performance.startTime;

      // Log final summary
      console.log(` Bulk Payroll Submission Summary:`, {
        department: submissionSummary.departmentInfo.departmentName,
        totalRequested: submissionSummary.totalRequested,
        found: submissionSummary.found,
        submitted: submissionSummary.submitted,
        failed: submissionSummary.failed,
        successRate: `${(
          (submissionSummary.submitted / submissionSummary.found) *
          100
        ).toFixed(2)}%`,
        submitter: submissionSummary.submissionDetails.submitter.name,
        initialApprovalLevel: submissionSummary.approvalFlow.initialLevel,
        duration: `${submissionSummary.performance.duration}ms`,
        notifications: {
          departmentHead: submissionSummary.notificationSummary.departmentHead,
          hrManager: submissionSummary.notificationSummary.hrManager,
          financeDirector:
            submissionSummary.notificationSummary.financeDirector,
          superAdmins: submissionSummary.notificationSummary.superAdmins,
          employees: submissionSummary.notificationSummary.employees,
          failed: submissionSummary.notificationSummary.failed,
        },
        errors: submissionSummary.errors.length,
        warnings: submissionSummary.warnings.length,
      });

      // Log detailed errors if any
      if (submissionSummary.errors.length > 0) {
        console.error(
          `❌ Submission Errors (${submissionSummary.errors.length}):`,
          submissionSummary.errors
        );
      }

      // Log warnings if any
      if (submissionSummary.warnings.length > 0) {
        console.warn(
          `⚠️ Submission Warnings (${submissionSummary.warnings.length}):`,
          submissionSummary.warnings
        );
      }

      res.status(200).json({
        success: true,
        message: `${submissionSummary.submitted} payrolls submitted successfully for approval`,
        data: {
          submitted: submissionSummary.submitted,
          failed: submissionSummary.failed,
          total: submissionSummary.found,
          successRate: `${(
            (submissionSummary.submitted / submissionSummary.found) *
            100
          ).toFixed(2)}%`,
          payrolls: updatedPayrolls,
          summary: {
            departmentInfo: submissionSummary.departmentInfo,
            submissionDetails: submissionSummary.submissionDetails,
            approvalFlow: submissionSummary.approvalFlow,
            notificationSummary: submissionSummary.notificationSummary,
            performance: submissionSummary.performance,
            errors: submissionSummary.errors,
            warnings: submissionSummary.warnings,
          },
        },
      });
    } catch (error) {
      console.error(` Bulk Payroll Submission Failed:`, {
        error: error.message,
        stack: error.stack,
        payrollIds,
        admin: admin?._id,
      });
      next(error);
    }
  }

  static async resubmitPayroll(req, res, next) {
    try {
      const { payrollId } = req.params;
      const { salaryGrade } = req.body;

      // Fetch admin with full details
      const admin = await UserModel.findById(req.user.id)
        .populate("department", "name code")
        .select("+position +role +department");

      // Check if admin exists and has necessary permissions
      if (!admin) {
        throw new ApiError(404, "Admin not found");
      }

      // Get the existing payroll
      const existingPayroll = await PayrollModel.findOne({
        _id: payrollId,
        status: "REJECTED",
      }).populate("employee");

      if (!existingPayroll) {
        throw new ApiError(404, "Rejected payroll not found");
      }

      // Check if admin has access to this department
      const hasAccess =
        admin.role === "super-admin" ||
        admin.department?._id.toString() ===
          existingPayroll.department.toString();

      if (!hasAccess) {
        throw new ApiError(403, "You don't have access to this department");
      }

      // Enhanced HR Head detection
      const isHRHead =
        (admin.position?.toLowerCase().includes("head of human resources") ||
          admin.position?.toLowerCase().includes("hr head") ||
          admin.role?.toLowerCase() === "head of hr") &&
        admin.department?.name?.toLowerCase().includes("human resources");

      // Calculate new payroll data
      const payrollData = await PayrollService.calculatePayroll(
        existingPayroll.employee._id,
        salaryGrade || existingPayroll.employee.salaryGrade,
        existingPayroll.month,
        existingPayroll.year,
        existingPayroll.frequency,
        existingPayroll.department
      );

      if (!payrollData) {
        throw new ApiError(400, "Failed to calculate payroll");
      }

      // Update the existing payroll with new data
      existingPayroll.earnings = payrollData.earnings;
      existingPayroll.deductions = payrollData.deductions;
      existingPayroll.totals = payrollData.totals;
      existingPayroll.allowances = payrollData.allowances;
      existingPayroll.bonuses = payrollData.bonuses;
      existingPayroll.components = payrollData.components;
      existingPayroll.status = isHRHead
        ? PAYROLL_STATUS.PENDING
        : PAYROLL_STATUS.DRAFT;
      existingPayroll.approvalFlow = {
        currentLevel: isHRHead
          ? APPROVAL_LEVELS.HR_MANAGER
          : APPROVAL_LEVELS.DEPARTMENT_HEAD,
        history: [
          {
            level: isHRHead
              ? APPROVAL_LEVELS.HR_MANAGER
              : APPROVAL_LEVELS.DEPARTMENT_HEAD,
            status: isHRHead ? "PENDING" : "DRAFT",
            action: "SUBMIT",
            user: admin._id,
            timestamp: new Date(),
            remarks: isHRHead
              ? "Payroll resubmitted by HR Head"
              : "Payroll resubmitted after rejection",
          },
        ],
        submittedBy: admin._id,
        submittedAt: isHRHead ? new Date() : null,
      };
      existingPayroll.updatedBy = admin._id;
      existingPayroll.updatedAt = new Date();

      await existingPayroll.save();

      // Create audit log for payroll resubmission
      await AuditService.logAction(
        "UPDATE",
        "PAYROLL",
        existingPayroll._id,
        admin._id,
        {
          status: isHRHead ? "PENDING" : "DRAFT",
          action: "PAYROLL_RESUBMITTED",
          employeeId: existingPayroll.employee._id,
          employeeName: `${existingPayroll.employee.firstName} ${existingPayroll.employee.lastName}`,
          month: existingPayroll.month,
          year: existingPayroll.year,
          frequency: existingPayroll.frequency,
          departmentId: existingPayroll.department,
          createdBy: admin._id,
          position: admin.position,
          role: admin.role,
        }
      );

      // Notify the creating admin
      await NotificationService.createPayrollNotification(
        existingPayroll,
        NOTIFICATION_TYPES.PAYROLL_CREATED,
        admin,
        `You have created a ${isHRHead ? "pending" : "draft"} payroll for ${
          existingPayroll.employee.firstName
        } ${existingPayroll.employee.lastName} (${
          existingPayroll.employee.employeeId
        }) for ${existingPayroll.month}/${existingPayroll.year}`,
        {
          approvalLevel: isHRHead
            ? APPROVAL_LEVELS.HR_MANAGER
            : APPROVAL_LEVELS.DEPARTMENT_HEAD,
          metadata: {
            payrollId: existingPayroll._id,
            employeeId: existingPayroll.employee._id,
            departmentId: existingPayroll.department,
            status: existingPayroll.status,
          },
        }
      );

      // Notify Super Admin about payroll creation
      const superAdmin = await UserModel.findOne({ role: "super-admin" });
      if (superAdmin) {
        await NotificationService.createPayrollNotification(
          existingPayroll,
          NOTIFICATION_TYPES.PAYROLL_CREATED,
          admin,
          `A new ${
            isHRHead ? "pending" : "draft"
          } payroll has been created for ${
            existingPayroll.employee.firstName
          } ${existingPayroll.employee.lastName} (${
            existingPayroll.employee.employeeId
          }) in ${admin.department.name} department by ${admin.firstName} ${
            admin.lastName
          } (${admin.position})`,
          {
            approvalLevel: isHRHead
              ? APPROVAL_LEVELS.HR_MANAGER
              : APPROVAL_LEVELS.DEPARTMENT_HEAD,
            metadata: {
              payrollId: existingPayroll._id,
              employeeId: existingPayroll.employee._id,
              departmentId: existingPayroll.department,
              createdBy: admin._id,
              status: isHRHead ? "PENDING" : "DRAFT",
            },
          }
        );
      }

      // Set response headers to trigger UI updates
      res.set({
        "x-refresh-payrolls": "true",
        "x-refresh-audit-logs": "true",
      });

      return res.status(200).json({
        success: true,
        message: "Payroll resubmitted successfully",
        data: existingPayroll,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getSalaryGrades(req, res, next) {
    try {
      // Get all salary grades
      const salaryGrades = await SalaryGrade.find().sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        salaryGrades,
        count: salaryGrades.length,
      });
    } catch (error) {
      next(error);
    }
  }
}
