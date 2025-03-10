import { Response, NextFunction } from "express";
import { AuthService } from "../services/authService.js";
import { UserRole, Permission } from "../models/User.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import UserModel from "../models/User.js";
import DepartmentModel, { DepartmentStatus } from "../models/Department.js";
import PayrollModel, { PayrollStatus } from "../models/Payroll.js";
import { PermissionChecker } from "../utils/permissionUtils.js";
import { handleError, ApiError } from "../utils/errorHandler.js";

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

  static async createUser(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (req.body.department) {
        const department = await DepartmentModel.findById(req.body.department);
        if (!department) {
          throw new ApiError(400, "Invalid department ID");
        }
      }

      const userData = {
        ...req.body,
        role: UserRole.USER,
        isEmailVerified: true,
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
  static async getAllDepartments(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const departments = await DepartmentModel.find()
        .populate([
          { path: "headOfDepartment", select: "firstName lastName email" },
          { path: "createdBy", select: "firstName lastName" },
          { path: "updatedBy", select: "firstName lastName" },
        ])
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        departments,
        count: departments.length,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
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
  static async getAllPayroll(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (
        !PermissionChecker.hasPermission(req.user, Permission.VIEW_ALL_PAYROLL)
      ) {
        throw new ApiError(403, "Not authorized to view all payroll records");
      }

      const payroll = await PayrollModel.find()
        .populate([
          { path: "employee", select: "firstName lastName employeeId" },
          { path: "department", select: "name code" },
          { path: "approvedBy", select: "firstName lastName" },
        ])
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        payroll,
        count: payroll.length,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async createPayroll(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (
        !PermissionChecker.hasPermission(req.user, Permission.CREATE_PAYROLL)
      ) {
        throw new ApiError(403, "Not authorized to create payroll records");
      }

      const employee = await UserModel.findById(req.body.employee);
      if (!employee) {
        throw new ApiError(400, "Invalid employee ID");
      }

      const department = await DepartmentModel.findById(req.body.department);
      if (!department) {
        throw new ApiError(400, "Invalid department ID");
      }

      const payroll = await PayrollModel.create({
        ...req.body,
        createdBy: req.user.id,
        updatedBy: req.user.id,
        status: PayrollStatus.PENDING,
      });

      await payroll.populate([
        { path: "employee", select: "firstName lastName employeeId" },
        { path: "department", select: "name code" },
      ]);

      res.status(201).json({
        success: true,
        message: "Payroll created successfully",
        payroll,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async approvePayroll(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (
        !PermissionChecker.hasPermission(req.user, Permission.APPROVE_PAYROLL)
      ) {
        throw new ApiError(403, "Not authorized to approve payroll records");
      }

      const payroll = await PayrollModel.findById(req.params.id);

      if (!payroll) {
        throw new ApiError(404, "Payroll not found");
      }

      if (payroll.status === PayrollStatus.APPROVED) {
        throw new ApiError(400, "Payroll is already approved");
      }

      const updatedPayroll = await PayrollModel.findByIdAndUpdate(
        req.params.id,
        {
          status: PayrollStatus.APPROVED,
          approvedBy: req.user.id,
          approvedAt: new Date(),
          updatedBy: req.user.id,
        },
        { new: true }
      ).populate([
        { path: "employee", select: "firstName lastName employeeId" },
        { path: "department", select: "name code" },
        { path: "approvedBy", select: "firstName lastName" },
      ]);

      res.status(200).json({
        success: true,
        message: "Payroll approved successfully",
        payroll: updatedPayroll,
      });
    } catch (error) {
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
}
