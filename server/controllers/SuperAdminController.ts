import { Response, NextFunction } from "express";
import { AuthService } from "../services/authService.js";
import { UserRole, Permission } from "../models/User.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import UserModel from "../models/User.js";
import DepartmentModel, { DepartmentStatus } from "../models/Department.js";
import PayrollModel, { PayrollStatus } from "../models/Payroll.js";
import { PermissionChecker } from "../utils/permissionUtils.js";
import { handleError, ApiError } from "../utils/errorHandler.js";
import Leave from "../models/Leave.js";
import { LeaveStatus } from "../models/Leave.js";
import { PayrollService } from "../services/PayrollService.js";
import SalaryGrade, { ISalaryComponent } from "../models/SalaryStructure.js";
import { Types } from "mongoose";
import mongoose from "mongoose";

interface PayrollAllowances {
  housing: number;
  transport: number;
  meal: number;
  other: number;
}

interface PayrollDeductions {
  tax: number;
  pension: number;
  loan: number;
  other: number;
}

// Add type assertion helper
const asObjectId = (id: string): Types.ObjectId => new Types.ObjectId(id);

export class SuperAdminController {
  // ===== Base CRUD Operations =====
  private static async findById(Model: any, id: string, populate?: any[]) {
    const query = Model.findById(id);
    if (populate) {
      populate.forEach((field) => query.populate(field));
    }
    return query.select("-password");
  }

  // ===== Admin Management =====
  static async getAllAdmins(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
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

  static async getAdminById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
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

  static async createAdmin(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userData = {
        ...req.body,
        role: UserRole.ADMIN,
        isEmailVerified: true,
        createdBy: req.user.id,
        status: "pending",
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

  static async updateAdmin(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
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

  static async deleteAdmin(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
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
  static async getAllUsers(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const users = await UserModel.find({ role: UserRole.USER })
        .select("-password")
        .populate("department", "name code")
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

  static async getUserById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
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

  static async createUser(req: AuthenticatedRequest, res: Response) {
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

  static async updateUser(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
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

  static async deleteUser(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
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
  static async getAllDepartments(req: AuthenticatedRequest, res: Response) {
    try {
      console.log("🔍 Fetching all departments");
      const departments = await DepartmentModel.find({ status: "active" })
        .select("name code")
        .sort({ name: 1 });

      console.log(`📋 Found ${departments.length} departments`);

      res.status(200).json({
        success: true,
        data: departments,
      });
    } catch (error) {
      console.error("❌ Error fetching departments:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({
        success: false,
        message: message || "Failed to fetch departments",
      });
    }
  }

  static async createDepartment(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const headOfDept = await UserModel.findById(req.body.headOfDepartment);
      if (!headOfDept || headOfDept.role !== UserRole.ADMIN) {
        throw new ApiError(
          400,
          "Invalid head of department. Must be an existing admin."
        );
      }

      const department = await DepartmentModel.create({
        ...req.body,
        createdBy: req.user.id,
        updatedBy: req.user.id,
        status: DepartmentStatus.ACTIVE,
      });

      await department.populate([
        { path: "headOfDepartment", select: "firstName lastName email" },
        { path: "createdBy", select: "firstName lastName" },
      ]);

      res.status(201).json({
        success: true,
        message: "Department created successfully",
        department,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async updateDepartment(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (req.body.headOfDepartment) {
        const newHead = await UserModel.findById(req.body.headOfDepartment);
        if (!newHead || newHead.role !== UserRole.ADMIN) {
          throw new ApiError(
            400,
            "Invalid head of department. Must be an existing admin."
          );
        }
      }

      const department = await DepartmentModel.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          updatedBy: req.user.id,
        },
        { new: true, runValidators: true }
      ).populate([
        { path: "headOfDepartment", select: "firstName lastName email" },
        { path: "createdBy", select: "firstName lastName" },
        { path: "updatedBy", select: "firstName lastName" },
      ]);

      if (!department) {
        throw new ApiError(404, "Department not found");
      }

      res.status(200).json({
        success: true,
        message: "Department updated successfully",
        department,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async deleteDepartment(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const department = await DepartmentModel.findById(req.params.id);

      if (!department) {
        throw new ApiError(404, "Department not found");
      }

      const employeeCount = await UserModel.countDocuments({
        department: department._id,
      });

      if (employeeCount > 0) {
        throw new ApiError(
          400,
          "Cannot delete department with existing employees"
        );
      }

      await department.deleteOne();

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
  static async getAllPayroll(req: AuthenticatedRequest, res: Response) {
    try {
      console.log("🔍 Fetching all payroll records");

      const payroll = await PayrollModel.find()
        .populate([
          { path: "employee", select: "firstName lastName employeeId" },
          { path: "department", select: "name code" },
          { path: "approvedBy", select: "firstName lastName" },
        ])
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: payroll,
        count: payroll.length,
      });
    } catch (error) {
      console.error("❌ Error fetching payroll records:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async getPayrollById(req: AuthenticatedRequest, res: Response) {
    try {
      console.log("🔍 Fetching payroll record:", req.params.id);

      const payroll = await PayrollModel.findById(req.params.id).populate([
        { path: "employee", select: "firstName lastName employeeId" },
        { path: "department", select: "name code" },
        { path: "approvedBy", select: "firstName lastName" },
      ]);

      if (!payroll) {
        throw new ApiError(404, "Payroll record not found");
      }

      res.status(200).json({
        success: true,
        data: payroll,
      });
    } catch (error) {
      console.error("❌ Error fetching payroll record:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async createPayroll(req: AuthenticatedRequest, res: Response) {
    try {
      console.log("📝 Creating new payroll record");

      const {
        employee,
        department,
        month,
        year,
        basicSalary,
        allowances = {
          housing: 0,
          transport: 0,
          meal: 0,
          other: 0,
        },
        deductions = {
          pension: 0,
          loan: 0,
          other: 0,
        },
      } = req.body;

      // Calculate payroll using service
      const { employeeData, calculations } =
        await PayrollService.calculatePayroll({
          employee,
          month,
          year,
          basicSalary,
          allowances,
          deductions,
        });

      // Create payroll record
      const payroll = await PayrollModel.create({
        employee,
        department: employeeData.department,
        month,
        year,
        ...calculations,
        bankDetails: employeeData.bankDetails,
        createdBy: req.user.id,
        updatedBy: req.user.id,
        status: PayrollStatus.PENDING,
      });

      await payroll.populate([
        {
          path: "employee",
          select: "firstName lastName employeeId bankDetails",
        },
        {
          path: "department",
          select: "name code",
        },
      ]);

      console.log("✅ Payroll record created successfully");

      res.status(201).json({
        success: true,
        message: "Payroll record created successfully",
        data: payroll,
      });
    } catch (error) {
      console.error("❌ Error creating payroll record:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async updatePayroll(req: AuthenticatedRequest, res: Response) {
    try {
      console.log("📝 Updating payroll record:", req.params.id);

      const payroll = await PayrollModel.findById(req.params.id);
      if (!payroll) {
        throw new ApiError(404, "Payroll record not found");
      }

      if (payroll.status === PayrollStatus.APPROVED) {
        throw new ApiError(400, "Cannot update approved payroll record");
      }

      const updatedPayroll = await PayrollModel.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          updatedBy: req.user.id,
        },
        { new: true }
      ).populate([
        { path: "employee", select: "firstName lastName employeeId" },
        { path: "department", select: "name code" },
      ]);

      res.status(200).json({
        success: true,
        message: "Payroll record updated successfully",
        data: updatedPayroll,
      });
    } catch (error) {
      console.error("❌ Error updating payroll record:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async approvePayroll(req: AuthenticatedRequest, res: Response) {
    try {
      console.log("✅ Approving payroll record:", req.params.id);

      const payroll = await PayrollModel.findByIdAndUpdate(
        req.params.id,
        {
          status: PayrollStatus.APPROVED,
          approvedBy: req.user.id,
          approvedAt: new Date(),
        },
        { new: true }
      ).populate([
        { path: "employee", select: "firstName lastName employeeId" },
        { path: "department", select: "name code" },
        { path: "approvedBy", select: "firstName lastName" },
      ]);

      if (!payroll) {
        throw new ApiError(404, "Payroll record not found");
      }

      res.status(200).json({
        success: true,
        message: "Payroll approved successfully",
        data: payroll,
      });
    } catch (error) {
      console.error("❌ Error approving payroll:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async generatePayslip(req: AuthenticatedRequest, res: Response) {
    try {
      console.log("📄 Generating payslip for:", req.params.id);

      const payroll = await PayrollModel.findById(req.params.id).populate([
        {
          path: "employee",
          select: "firstName lastName employeeId bankDetails",
        },
        { path: "department", select: "name code" },
      ]);

      if (!payroll) {
        throw new ApiError(404, "Payroll record not found");
      }

      // Payslip generation logic will go here
      // This will be implemented when we set up the payroll calculation service

      res.status(200).json({
        success: true,
        message: "Payslip generated successfully",
        data: payroll,
      });
    } catch (error) {
      console.error("❌ Error generating payslip:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async getEmployeePayrollHistory(
    req: AuthenticatedRequest,
    res: Response
  ) {
    try {
      console.log(
        "🔍 Fetching payroll history for employee:",
        req.params.employeeId
      );

      const payrollHistory = await PayrollModel.find({
        employee: req.params.employeeId,
      })
        .populate([
          { path: "employee", select: "firstName lastName employeeId" },
          { path: "department", select: "name code" },
          { path: "approvedBy", select: "firstName lastName" },
        ])
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: payrollHistory,
        count: payrollHistory.length,
      });
    } catch (error) {
      console.error("❌ Error fetching employee payroll history:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async getDepartmentPayroll(req: AuthenticatedRequest, res: Response) {
    try {
      console.log(
        "🔍 Fetching payroll for department:",
        req.params.departmentId
      );

      const departmentPayroll = await PayrollModel.find({
        department: req.params.departmentId,
      })
        .populate([
          { path: "employee", select: "firstName lastName employeeId" },
          { path: "department", select: "name code" },
          { path: "approvedBy", select: "firstName lastName" },
        ])
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: departmentPayroll,
        count: departmentPayroll.length,
      });
    } catch (error) {
      console.error("❌ Error fetching department payroll:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async getPayrollStats(req: AuthenticatedRequest, res: Response) {
    try {
      console.log("📊 Generating payroll statistics");

      // Basic statistics calculation
      const stats = await PayrollModel.aggregate([
        {
          $group: {
            _id: "$department",
            totalAmount: { $sum: "$netPay" },
            count: { $sum: 1 },
          },
        },
      ]);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("❌ Error generating payroll statistics:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async deletePayroll(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (
        !PermissionChecker.hasPermission(req.user, Permission.DELETE_PAYROLL)
      ) {
        throw new ApiError(403, "Not authorized to delete payroll records");
      }

      const payroll = await PayrollModel.findById(req.params.id);

      if (!payroll) {
        throw new ApiError(404, "Payroll not found");
      }

      if (payroll.status === PayrollStatus.APPROVED) {
        throw new ApiError(400, "Cannot delete approved payroll");
      }

      await payroll.deleteOne();

      res.status(200).json({
        success: true,
        message: "Payroll deleted successfully",
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async getOnboardingEmployees(
    req: AuthenticatedRequest,
    res: Response
  ) {
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

  static async getOffboardingEmployees(
    req: AuthenticatedRequest,
    res: Response
  ) {
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

  static async initiateOffboarding(req: AuthenticatedRequest, res: Response) {
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

  static async revertToOnboarding(req: AuthenticatedRequest, res: Response) {
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

  static async updateOffboardingStatus(
    req: AuthenticatedRequest,
    res: Response
  ) {
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

  static async archiveEmployee(req: AuthenticatedRequest, res: Response) {
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
  static async getAllLeaves(req: AuthenticatedRequest, res: Response) {
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

  static async approveLeave(req: AuthenticatedRequest, res: Response) {
    try {
      console.log("✍️ Processing leave approval for:", req.params.id);

      const leave = await Leave.findByIdAndUpdate(
        req.params.id,
        {
          status: LeaveStatus.APPROVED,
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

  static async rejectLeave(req: AuthenticatedRequest, res: Response) {
    try {
      console.log("✍️ Processing leave rejection for:", req.params.id);

      const leave = await Leave.findByIdAndUpdate(
        req.params.id,
        {
          status: LeaveStatus.REJECTED,
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
  static async createSalaryGrade(req: AuthenticatedRequest, res: Response) {
    try {
      console.log("📝 Creating new salary grade");
      const { level, basicSalary, components, description, department } =
        req.body;

      // Debug user info
      console.log("👤 User info:", {
        id: req.user?.id,
        _id: req.user?._id,
        fullUser: req.user,
      });

      // Check for existing grade first
      const existingGrade = await SalaryGrade.findOne({ level });
      if (existingGrade) {
        throw new ApiError(
          400,
          `Salary grade with level '${level}' already exists`
        );
      }

      // Create salary grade
      const salaryGrade = await SalaryGrade.create({
        level,
        basicSalary: Number(basicSalary),
        description: description || "",
        department: department ? new Types.ObjectId(department) : null,
        components: components.map((comp: any) => ({
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

      // Populate and return
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

  static async getAllSalaryGrades(req: AuthenticatedRequest, res: Response) {
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

  static async updateSalaryGrade(req: AuthenticatedRequest, res: Response) {
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

      // Update basic fields
      Object.assign(salaryGrade, {
        ...updateData,
        department: department || null,
        updatedBy: userId,
      });

      // Update components if provided
      if (components) {
        salaryGrade.components = components.map((comp: any) => ({
          name: comp.name,
          type: comp.type,
          value: Number(comp.value),
          isActive: comp.isActive,
          _id: comp._id ? new Types.ObjectId(comp._id) : new Types.ObjectId(),
          createdBy: userId, // Use userId directly instead of trying to convert existing
          updatedBy: userId,
        }));
      }

      await salaryGrade.save();

      // Populate department details in response
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

  static async addSalaryComponent(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = new mongoose.Types.ObjectId(req.user.id);
      const gradeId = req.params.id;

      const salaryGrade = await SalaryGrade.findById(gradeId);
      if (!salaryGrade) {
        throw new ApiError(404, "Salary grade not found");
      }

      const newComponent: ISalaryComponent = {
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

  static async updateSalaryComponent(req: AuthenticatedRequest, res: Response) {
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

  static async getSalaryGrade(req: AuthenticatedRequest, res: Response) {
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

  static async deleteSalaryGrade(req: AuthenticatedRequest, res: Response) {
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
}
