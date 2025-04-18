import { ApiError } from "../utils/errorHandler.js";
import PayrollModel from "../models/Payroll.js";
import UserModel from "../models/User.js";
import DepartmentModel from "../models/Department.js";
import BaseApprovalController, {
  APPROVAL_LEVELS,
  PAYROLL_STATUS,
} from "./BaseApprovalController.js";
import {
  NotificationService,
  NOTIFICATION_TYPES,
} from "../services/NotificationService.js";
import AuditService from "../services/AuditService.js";
import { AuditAction, AuditEntity } from "../models/Audit.js";

class ApprovalController {
  /**
   * Approve a payroll as Department Head
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async approveAsDepartmentHead(req, res, next) {
    try {
      const { id } = req.params;
      const admin = await UserModel.findById(req.user.id);

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: "Admin not found",
        });
      }

      // Find the payroll
      const payroll = await PayrollModel.findById(id).populate("employee");

      if (!payroll) {
        return res.status(404).json({
          success: false,
          message: "Payroll not found",
        });
      }

      // Check if the payroll is in the correct status
      if (payroll.status !== PAYROLL_STATUS.PENDING) {
        return res.status(400).json({
          success: false,
          message: `Payroll is not in PENDING status. Current status: ${payroll.status}`,
        });
      }

      // Check if the payroll is at the correct approval level
      if (
        payroll.approvalFlow?.currentLevel !== APPROVAL_LEVELS.DEPARTMENT_HEAD
      ) {
        return res.status(400).json({
          success: false,
          message: `Payroll is not at DEPARTMENT_HEAD approval level. Current level: ${payroll.approvalFlow?.currentLevel}`,
        });
      }

      // Check if the admin is in the same department as the employee
      if (
        admin.department?.toString() !== payroll.employee.department?.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only approve payrolls for employees in your department",
        });
      }

      // Check if the admin has the correct position
      const adminPosition = admin.position?.toLowerCase() || "";
      const isDepartmentHead = ["head", "director", "manager"].some((pos) =>
        adminPosition.includes(pos)
      );

      if (!isDepartmentHead) {
        return res.status(403).json({
          success: false,
          message: "You must be a department head to approve at this level",
        });
      }

      // Update the payroll approval flow
      const updatedPayroll =
        await BaseApprovalController.updatePayrollApprovalFlow(
          payroll,
          APPROVAL_LEVELS.DEPARTMENT_HEAD,
          admin,
          true
        );

      // Find the next approver (HR Manager)
      const nextApprover = await BaseApprovalController.findNextApprover(
        APPROVAL_LEVELS.DEPARTMENT_HEAD,
        updatedPayroll
      );

      // Create notification for the next approver (HR Manager)
      if (nextApprover) {
        console.log("📬 Creating notification for HR Manager");
        await NotificationService.createNotification(
          nextApprover._id,
          NOTIFICATION_TYPES.PAYROLL_PENDING_APPROVAL,
          updatedPayroll.employee,
          updatedPayroll,
          "A payroll is pending your approval as HR Manager",
          {
            data: {
              currentLevel: APPROVAL_LEVELS.DEPARTMENT_HEAD,
              nextLevel: APPROVAL_LEVELS.HR_MANAGER,
              approvalLevel: APPROVAL_LEVELS.HR_MANAGER,
            },
          }
        );
      }

      // Create self-notification for the Department Head
      console.log("📬 Creating self-notification for Department Head");
      await NotificationService.createNotification(
        admin._id,
        NOTIFICATION_TYPES.PAYROLL_APPROVED,
        updatedPayroll.employee,
        updatedPayroll,
        "You have successfully approved this payroll and it is now pending HR Manager approval",
        {
          data: {
            approvalLevel: APPROVAL_LEVELS.DEPARTMENT_HEAD,
          },
        }
      );

      // Create notification for the employee
      console.log("📬 Creating notification for employee");
      await NotificationService.createNotification(
        updatedPayroll.employee._id,
        NOTIFICATION_TYPES.PAYROLL_APPROVED,
        updatedPayroll.employee,
        updatedPayroll,
        "Your payroll has been approved by Department Head and is pending HR Manager approval",
        {
          data: {
            approvalLevel: APPROVAL_LEVELS.DEPARTMENT_HEAD,
          },
        }
      );

      // Notify Super Admin about the approval
      const superAdmin = await UserModel.findOne({ role: "super-admin" });
      if (superAdmin) {
        console.log("📬 Creating notification for Super Admin");
        await NotificationService.createNotification(
          superAdmin._id,
          NOTIFICATION_TYPES.PAYROLL_APPROVED,
          updatedPayroll.employee,
          updatedPayroll,
          "A payroll has been approved by Department Head",
          {
            data: {
              approvalLevel: APPROVAL_LEVELS.DEPARTMENT_HEAD,
              nextLevel: APPROVAL_LEVELS.HR_MANAGER,
            },
          }
        );
      }

      // Set response headers to trigger UI updates
      res.set({
        "x-refresh-payrolls": "true",
        "x-refresh-audit-logs": "true",
        "x-refresh-notifications": "true",
      });

      return res.status(200).json({
        success: true,
        message: "Payroll approved successfully",
        data: {
          payroll: updatedPayroll,
          nextApprover: nextApprover
            ? {
                id: nextApprover._id,
                name: nextApprover.name,
                position: nextApprover.position,
              }
            : null,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject a payroll as Department Head
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async rejectAsDepartmentHead(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const admin = await UserModel.findById(req.user.id);

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: "Admin not found",
        });
      }

      // Find the payroll
      const payroll = await PayrollModel.findById(id).populate("employee");

      if (!payroll) {
        return res.status(404).json({
          success: false,
          message: "Payroll not found",
        });
      }

      // Check if the payroll is in the correct status
      if (payroll.status !== PAYROLL_STATUS.PENDING) {
        return res.status(400).json({
          success: false,
          message: `Payroll is not in PENDING status. Current status: ${payroll.status}`,
        });
      }

      // Check if the payroll is at the correct approval level
      if (
        payroll.approvalFlow?.currentLevel !== APPROVAL_LEVELS.DEPARTMENT_HEAD
      ) {
        return res.status(400).json({
          success: false,
          message: `Payroll is not at DEPARTMENT_HEAD approval level. Current level: ${payroll.approvalFlow?.currentLevel}`,
        });
      }

      // Check if the admin is in the same department as the employee
      if (
        admin.department?.toString() !== payroll.employee.department?.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only reject payrolls for employees in your department",
        });
      }

      // Check if the admin has the correct position
      const adminPosition = admin.position?.toLowerCase() || "";
      const isDepartmentHead = ["head", "director", "manager"].some((pos) =>
        adminPosition.includes(pos)
      );

      if (!isDepartmentHead) {
        return res.status(403).json({
          success: false,
          message: "You must be a department head to reject at this level",
        });
      }

      // Update the payroll approval flow
      const updatedPayroll =
        await BaseApprovalController.updatePayrollApprovalFlow(
          payroll,
          APPROVAL_LEVELS.DEPARTMENT_HEAD,
          admin,
          false,
          reason
        );

      // Find the HR Manager to notify
      const hrDepartment = await DepartmentModel.findOne({
        name: { $in: ["Human Resources", "HR"] },
        status: "active",
      });

      const hrManager = await UserModel.findOne({
        department: hrDepartment?._id,
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

      // Create self-notification for the Department Head
      console.log("📬 Creating self-notification for Department Head");
      await NotificationService.createNotification(
        admin._id,
        NOTIFICATION_TYPES.PAYROLL_REJECTED,
        updatedPayroll.employee,
        updatedPayroll,
        reason || "You have rejected this payroll",
        {
          data: {
            approvalLevel: APPROVAL_LEVELS.DEPARTMENT_HEAD,
            rejectionReason: reason,
          },
        }
      );

      // Create notification for the HR Manager
      console.log("📬 Creating notification for HR Manager");
      await NotificationService.createNotification(
        hrManager._id,
        NOTIFICATION_TYPES.PAYROLL_REJECTED,
        updatedPayroll.employee,
        updatedPayroll,
        reason || "A payroll has been rejected by Department Head",
        {
          data: {
            approvalLevel: APPROVAL_LEVELS.DEPARTMENT_HEAD,
            rejectionReason: reason,
          },
        }
      );

      // Set response headers to trigger UI updates
      res.set({
        "x-refresh-payrolls": "true",
        "x-refresh-audit-logs": "true",
        "x-refresh-notifications": "true",
      });

      return res.status(200).json({
        success: true,
        message: "Payroll rejected successfully",
        data: {
          payroll: updatedPayroll,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve a payroll as HR Manager
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async approveAsHRManager(req, res, next) {
    try {
      console.log(
        "🔍 Starting HR Manager approval process for payroll:",
        req.params.id
      );
      const { id } = req.params;
      const { remarks } = req.body;

      const admin = await UserModel.findById(req.user.id);

      if (!admin) {
        throw new ApiError(404, "Admin not found");
      }

      console.log("👤 Admin details:", {
        id: admin._id,
        name: `${admin.firstName} ${admin.lastName}`,
        position: admin.position,
        department: admin.department,
      });

      // Get the payroll
      const payroll = await PayrollModel.findById(id).populate("employee");

      if (!payroll) {
        throw new ApiError(404, "Payroll not found");
      }

      console.log("📊 Payroll details:", {
        id: payroll._id,
        employee: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
        status: payroll.status,
        currentLevel: payroll.approvalFlow?.currentLevel,
      });

      // Check if the payroll is in the correct status
      if (payroll.status !== PAYROLL_STATUS.PENDING) {
        throw new ApiError(400, "Only pending payrolls can be approved");
      }

      // Check if the payroll is at the correct approval level
      if (payroll.approvalFlow?.currentLevel !== APPROVAL_LEVELS.HR_MANAGER) {
        throw new ApiError(
          400,
          `Payroll is not at HR_MANAGER approval level. Current level: ${payroll.approvalFlow?.currentLevel}`
        );
      }

      // Check if the admin is in the HR department
      const hrDepartment = await DepartmentModel.findOne({
        name: { $in: ["Human Resources", "HR"] },
        status: "active",
      });

      if (!hrDepartment) {
        throw new ApiError(500, "HR department not found");
      }

      if (admin.department?.toString() !== hrDepartment._id.toString()) {
        throw new ApiError(
          403,
          "You must be in the HR department to approve at this level"
        );
      }

      // Check if the admin has the correct position
      const adminPosition = admin.position?.toLowerCase() || "";
      const isHRManager = [
        "hr manager",
        "head of hr",
        "hr head",
        "head of human resources",
        "human resources manager",
        "hr director",
      ].some((pos) => adminPosition.includes(pos));

      if (!isHRManager) {
        throw new ApiError(
          403,
          "You must be an HR Manager to approve at this level"
        );
      }

      console.log("✅ All validation checks passed, proceeding with approval");

      // Update the payroll approval flow
      const updatedPayroll =
        await BaseApprovalController.updatePayrollApprovalFlow(
          payroll,
          APPROVAL_LEVELS.HR_MANAGER,
          admin,
          true,
          remarks
        );
      console.log("✅ Payroll approval flow updated successfully");

      // Find the next approver (Finance Director)
      const nextApprover = await BaseApprovalController.findNextApprover(
        APPROVAL_LEVELS.HR_MANAGER,
        updatedPayroll
      );
      console.log(
        "👥 Next approver details:",
        nextApprover
          ? {
              id: nextApprover._id,
              name: `${nextApprover.firstName} ${nextApprover.lastName}`,
              position: nextApprover.position,
            }
          : "No next approver found"
      );

      // Create notification for the next approver (Finance Director)
      if (nextApprover) {
        console.log("📬 Creating notification for Finance Director");
        await NotificationService.createNotification(
            nextApprover._id,
          NOTIFICATION_TYPES.PAYROLL_PENDING_APPROVAL,
          updatedPayroll.employee,
            updatedPayroll,
          remarks || "A payroll is pending your approval as Finance Director",
          {
            data: {
              currentLevel: APPROVAL_LEVELS.HR_MANAGER,
              nextLevel: APPROVAL_LEVELS.FINANCE_DIRECTOR,
              approvalLevel: APPROVAL_LEVELS.FINANCE_DIRECTOR,
            },
          }
        );
      }

      // Create self-notification for the HR Manager
      console.log("📬 Creating self-notification for HR Manager");
      await NotificationService.createNotification(
          admin._id,
        NOTIFICATION_TYPES.PAYROLL_APPROVED,
          updatedPayroll.employee,
          updatedPayroll,
          remarks ||
            "You have successfully approved this payroll and it is now pending Finance Director approval",
          {
            data: {
              approvalLevel: APPROVAL_LEVELS.HR_MANAGER, 
            },
          }
      );

      // Create notification for the employee
      console.log("📬 Creating notification for employee");
      await NotificationService.createNotification(
        updatedPayroll.employee._id,
        NOTIFICATION_TYPES.PAYROLL_APPROVED,
        updatedPayroll.employee,
        updatedPayroll,
        remarks ||
          "Your payroll has been approved by HR Manager and is pending Finance Director approval",
        {
          data: {
            approvalLevel: APPROVAL_LEVELS.HR_MANAGER,
          },
        }
      );

      // Create audit log
      await AuditService.logAction(
        AuditAction.APPROVE,
        AuditEntity.PAYROLL,
        updatedPayroll._id,
        admin._id,
        {
          status: updatedPayroll.status,
          currentLevel: APPROVAL_LEVELS.HR_MANAGER,
          nextLevel: APPROVAL_LEVELS.FINANCE_DIRECTOR,
          approvalFlow: {
            currentLevel: APPROVAL_LEVELS.FINANCE_DIRECTOR,
            history: updatedPayroll.approvalFlow.history,
          },
          employeeName: `${updatedPayroll.employee.firstName} ${updatedPayroll.employee.lastName}`,
          employeeId: updatedPayroll.employee._id,
          month: updatedPayroll.month,
          year: updatedPayroll.year,
          departmentId: updatedPayroll.department,
          remarks: remarks || "Approved by HR Manager",
          approvedAt: new Date(),
        }
      );

      console.log("🎉 HR Manager approval process completed successfully");

      // Set response headers to trigger UI updates
      res.set({
        "x-refresh-payrolls": "true",
        "x-refresh-audit-logs": "true",
        "x-refresh-notifications": "true",
      });

      return res.status(200).json({
        success: true,
        message: "Payroll approved successfully",
        data: {
          payroll: updatedPayroll,
          nextApprover: nextApprover
            ? {
                id: nextApprover._id,
                name: nextApprover.name,
                position: nextApprover.position,
              }
            : null,
        },
      });
    } catch (error) {
      console.error("❌ Error in HR Manager approval process:", error);
      next(error);
    }
  }

  /**
   * Reject a payroll as HR Manager
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async rejectAsHRManager(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const admin = await UserModel.findById(req.user.id);

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: "Admin not found",
        });
      }

      // Find the payroll
      const payroll = await PayrollModel.findById(id).populate("employee");

      if (!payroll) {
        return res.status(404).json({
          success: false,
          message: "Payroll not found",
        });
      }

      // Check if the payroll is in the correct status
      if (payroll.status !== PAYROLL_STATUS.PENDING) {
        return res.status(400).json({
          success: false,
          message: `Payroll is not in PENDING status. Current status: ${payroll.status}`,
        });
      }

      // Check if the payroll is at the correct approval level
      if (payroll.approvalFlow?.currentLevel !== APPROVAL_LEVELS.HR_MANAGER) {
        return res.status(400).json({
          success: false,
          message: `Payroll is not at HR_MANAGER approval level. Current level: ${payroll.approvalFlow?.currentLevel}`,
        });
      }

      // Check if the admin is in the HR department
      const hrDepartment = await DepartmentModel.findOne({
        name: { $in: ["Human Resources", "HR"] },
        status: "active",
      });

      if (!hrDepartment) {
        return res.status(500).json({
          success: false,
          message: "HR department not found",
        });
      }

      if (admin.department?.toString() !== hrDepartment._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You must be in the HR department to reject at this level",
        });
      }

      // Check if the admin has the correct position
      const adminPosition = admin.position?.toLowerCase() || "";
      const isHRManager = [
        "hr manager",
        "head of hr",
        "hr head",
        "head of human resources",
        "human resources manager",
        "hr director",
      ].some((pos) => adminPosition.includes(pos));

      if (!isHRManager) {
        return res.status(403).json({
          success: false,
          message: "You must be an HR Manager to reject at this level",
        });
      }

      // Update the payroll approval flow
      const updatedPayroll =
        await BaseApprovalController.updatePayrollApprovalFlow(
          payroll,
          APPROVAL_LEVELS.HR_MANAGER,
          admin,
          false,
          reason
        );

      // Find the department head
      const departmentHead = await UserModel.findOne({
        department: payroll.employee.department,
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

      // Create self-notification for the HR Manager
      console.log("📬 Creating self-notification for HR Manager");
      await NotificationService.createNotification(
        admin._id,
        NOTIFICATION_TYPES.PAYROLL_REJECTED,
        updatedPayroll.employee,
        updatedPayroll,
        reason || "You have rejected this payroll",
        {
          data: {
            approvalLevel: APPROVAL_LEVELS.HR_MANAGER,
            rejectionReason: reason,
          },
        }
      );

      // Create notification for the department head
      console.log("📬 Creating notification for department head");
      await NotificationService.createNotification(
        departmentHead._id,
        NOTIFICATION_TYPES.PAYROLL_REJECTED,
        updatedPayroll.employee,
        updatedPayroll,
        reason ||
          "A payroll in your department has been rejected by HR Manager",
        {
          data: {
            approvalLevel: APPROVAL_LEVELS.HR_MANAGER,
            rejectionReason: reason,
          },
        }
      );

      // Set response headers to trigger UI updates
      res.set({
        "x-refresh-payrolls": "true",
        "x-refresh-audit-logs": "true",
        "x-refresh-notifications": "true",
      });

      return res.status(200).json({
        success: true,
        message: "Payroll rejected successfully",
        data: {
          payroll: updatedPayroll,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve a payroll as Finance Director
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async approveAsFinanceDirector(req, res, next) {
    try {
      console.log("🔍 Starting Finance Director approval process");
      const { id } = req.params;
      const { remarks } = req.body;
      const admin = await UserModel.findById(req.user.id);

      if (!admin) {
        console.log("❌ Admin not found:", req.user.id);
        throw new ApiError(404, "Admin not found");
      }

      console.log("👤 Admin details:", {
        id: admin._id,
        name: `${admin.firstName} ${admin.lastName}`,
        position: admin.position,
        department: admin.department,
      });

      // Find the payroll
      const payroll = await PayrollModel.findById(id).populate("employee");

      if (!payroll) {
        console.log("❌ Payroll not found:", id);
        throw new ApiError(404, "Payroll not found");
      }

      console.log("📊 Payroll details:", {
        id: payroll._id,
        employee: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
        status: payroll.status,
        currentLevel: payroll.approvalFlow?.currentLevel,
      });

      // Check if the payroll is in the correct status
      if (payroll.status !== PAYROLL_STATUS.PENDING) {
        console.log("❌ Invalid payroll status:", payroll.status);
        throw new ApiError(400, "Only pending payrolls can be approved");
      }

      // Check if the payroll is at the correct approval level
      if (
        payroll.approvalFlow?.currentLevel !== APPROVAL_LEVELS.FINANCE_DIRECTOR
      ) {
        console.log(
          "❌ Invalid approval level:",
          payroll.approvalFlow?.currentLevel
        );
        throw new ApiError(
          400,
          `Payroll is not at FINANCE_DIRECTOR approval level. Current level: ${payroll.approvalFlow?.currentLevel}`
        );
      }

      // Check if the admin is in the Finance department
      const financeDepartment = await DepartmentModel.findOne({
        name: { $in: ["Finance and Accounting", "Finance", "Financial"] },
        status: "active",
      });

      if (!financeDepartment) {
        console.log("❌ Finance department not found");
        throw new ApiError(500, "Finance department not found");
      }

      if (admin.department?.toString() !== financeDepartment._id.toString()) {
        console.log("❌ Admin not in Finance department:", admin.department);
        throw new ApiError(
          403,
          "You must be in the Finance department to approve at this level"
        );
      }

      // Check if the admin has the correct position
      const adminPosition = admin.position?.toLowerCase() || "";
      const isFinanceDirector = [
        "head of finance",
        "finance director",
        "finance head",
        "financial director",
        "financial head",
      ].some((pos) => adminPosition.includes(pos));

      if (!isFinanceDirector) {
        console.log("❌ Admin not a Finance Director:", adminPosition);
        throw new ApiError(
          403,
          "You must be a Finance Director to approve at this level"
        );
      }

      console.log("✅ All validation checks passed, proceeding with approval");

      // Update the payroll approval flow
      const updatedPayroll =
        await BaseApprovalController.updatePayrollApprovalFlow(
          payroll,
          APPROVAL_LEVELS.FINANCE_DIRECTOR,
          admin,
          true,
          remarks
        );
      console.log("✅ Payroll approval flow updated successfully");

      // Find the next approver (Super Admin)
      const nextApprover = await BaseApprovalController.findNextApprover(
        APPROVAL_LEVELS.FINANCE_DIRECTOR,
        updatedPayroll
      );
      console.log(
        "👥 Next approver details:",
        nextApprover
          ? {
              id: nextApprover._id,
              name: `${nextApprover.firstName} ${nextApprover.lastName}`,
              position: nextApprover.position,
            }
          : "No next approver found"
      );

      // Create notification for the next approver (Super Admin)
      if (nextApprover) {
        console.log("📬 Creating notification for Super Admin");
        await NotificationService.createNotification(
          nextApprover._id,
          NOTIFICATION_TYPES.PAYROLL_PENDING_APPROVAL,
          updatedPayroll.employee,
          updatedPayroll,
          remarks || "A payroll is pending your approval as Super Admin",
          {
            data: {
              currentLevel: APPROVAL_LEVELS.FINANCE_DIRECTOR,
              nextLevel: APPROVAL_LEVELS.SUPER_ADMIN,
              approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
            },
          }
        );
      }

      // Create self-notification for the Finance Director
      console.log("📬 Creating self-notification for Finance Director");
      await NotificationService.createNotification(
        admin._id,
        NOTIFICATION_TYPES.PAYROLL_APPROVED,
        updatedPayroll.employee,
        updatedPayroll,
        remarks ||
          "You have successfully approved this payroll and it is now pending Super Admin approval",
        {
          data: {
            approvalLevel: APPROVAL_LEVELS.FINANCE_DIRECTOR,
          },
        }
      );

      // Create notification for the employee
      console.log("📬 Creating notification for employee");
      await NotificationService.createNotification(
        updatedPayroll.employee._id,
        NOTIFICATION_TYPES.PAYROLL_APPROVED,
        updatedPayroll.employee,
        updatedPayroll,
        remarks ||
          "Your payroll has been approved by Finance Director and is pending Super Admin approval",
        {
          data: {
            approvalLevel: APPROVAL_LEVELS.FINANCE_DIRECTOR,
          },
        }
      );

      // Create audit log
      await AuditService.logAction(
        AuditAction.APPROVE,
        AuditEntity.PAYROLL,
        updatedPayroll._id,
        admin._id,
        {
          status: updatedPayroll.status,
          currentLevel: APPROVAL_LEVELS.FINANCE_DIRECTOR,
          nextLevel: APPROVAL_LEVELS.SUPER_ADMIN,
          approvalFlow: {
            currentLevel: APPROVAL_LEVELS.SUPER_ADMIN,
            history: updatedPayroll.approvalFlow.history,
          },
          employeeName: `${updatedPayroll.employee.firstName} ${updatedPayroll.employee.lastName}`,
          employeeId: updatedPayroll.employee._id,
          month: updatedPayroll.month,
          year: updatedPayroll.year,
          departmentId: updatedPayroll.department,
          remarks: remarks || "Approved by Finance Director",
          approvedAt: new Date(),
        }
      );

      console.log(
        "✅ Finance Director approval process completed successfully"
      );

      // Set response headers to trigger UI updates
      res.set({
        "x-refresh-payrolls": "true",
        "x-refresh-audit-logs": "true",
        "x-refresh-notifications": "true",
      });

      return res.status(200).json({
        success: true,
        message: "Payroll approved successfully",
        data: {
          payroll: updatedPayroll,
          nextApprover: nextApprover
            ? {
                id: nextApprover._id,
                name: `${nextApprover.firstName} ${nextApprover.lastName}`,
                position: nextApprover.position,
              }
            : null,
        },
      });
    } catch (error) {
      console.error("❌ Error in Finance Director approval process:", error);
      next(error);
    }
  }

  /**
   * Reject a payroll as Finance Director
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async rejectAsFinanceDirector(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const admin = await UserModel.findById(req.user.id);

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: "Admin not found",
        });
      }

      // Find the payroll
      const payroll = await PayrollModel.findById(id).populate("employee");

      if (!payroll) {
        return res.status(404).json({
          success: false,
          message: "Payroll not found",
        });
      }

      // Check if the payroll is in the correct status
      if (payroll.status !== PAYROLL_STATUS.PENDING) {
        return res.status(400).json({
          success: false,
          message: `Payroll is not in PENDING status. Current status: ${payroll.status}`,
        });
      }

      // Check if the payroll is at the correct approval level
      if (
        payroll.approvalFlow?.currentLevel !== APPROVAL_LEVELS.FINANCE_DIRECTOR
      ) {
        return res.status(400).json({
          success: false,
          message: `Payroll is not at FINANCE_DIRECTOR approval level. Current level: ${payroll.approvalFlow?.currentLevel}`,
        });
      }

      // Check if the admin is in the Finance department
      const financeDepartment = await DepartmentModel.findOne({
        name: { $in: ["Finance", "Financial"] },
        status: "active",
      });

      if (!financeDepartment) {
        return res.status(500).json({
          success: false,
          message: "Finance department not found",
        });
      }

      if (admin.department?.toString() !== financeDepartment._id.toString()) {
        return res.status(403).json({
          success: false,
          message:
            "You must be in the Finance department to reject at this level",
        });
      }

      // Check if the admin has the correct position
      const adminPosition = admin.position?.toLowerCase() || "";
      const isFinanceDirector = [
        "finance director",
        "director of finance",
        "head of finance",
        "finance head",
        "financial director",
        "director of financial",
      ].some((pos) => adminPosition.includes(pos));

      if (!isFinanceDirector) {
        return res.status(403).json({
          success: false,
          message: "You must be a Finance Director to reject at this level",
        });
      }

      // Update the payroll approval flow
      const updatedPayroll =
        await BaseApprovalController.updatePayrollApprovalFlow(
          payroll,
          APPROVAL_LEVELS.FINANCE_DIRECTOR,
          admin,
          false,
          reason
        );

      // Find the HR Manager
      const hrManager = await UserModel.findOne({
        position: {
          $in: [
            "HR Manager",
            "Head of HR",
            "HR Head",
            "Head of Human Resources",
            "Human Resources Manager",
            "HR Director",
          ],
        },
        status: "active",
      });

      // Create self-notification for the Finance Director
      await NotificationService.createNotification(
        admin._id,
        NOTIFICATION_TYPES.PAYROLL_REJECTED,
        updatedPayroll.employee,
        updatedPayroll,
        reason || "You have rejected this payroll",
        {
          data: {
            approvalLevel: APPROVAL_LEVELS.FINANCE_DIRECTOR,
            rejectionReason: reason,
          },
        }
      );

      // Notify the HR Manager about the rejection
      if (hrManager) {
        await NotificationService.createNotification(
          hrManager._id,
          NOTIFICATION_TYPES.PAYROLL_REJECTED,
          updatedPayroll.employee,
          updatedPayroll,
          reason || "A payroll has been rejected by Finance Director",
          {
            data: {
              approvalLevel: APPROVAL_LEVELS.FINANCE_DIRECTOR,
              rejectionReason: reason,
            },
          }
        );
      }

      // Set response headers to trigger UI updates
      res.set({
        "x-refresh-payrolls": "true",
        "x-refresh-audit-logs": "true",
        "x-refresh-notifications": "true",
      });

      return res.status(200).json({
        success: true,
        message: "Payroll rejected successfully",
        data: {
          payroll: updatedPayroll,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve a payroll as Super Admin
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async approveAsSuperAdmin(req, res, next) {
    try {
      console.log("🔍 Starting Super Admin approval process");
      const { id } = req.params;
      const { remarks } = req.body;
      const admin = await UserModel.findById(req.user.id);

      if (!admin) {
        console.log("❌ Admin not found:", req.user.id);
        throw new ApiError(404, "Admin not found");
      }

      console.log("👤 Admin details:", {
        id: admin._id,
        name: `${admin.firstName} ${admin.lastName}`,
        position: admin.position,
        role: admin.role,
      });

      // Find the payroll
      const payroll = await PayrollModel.findById(id).populate("employee");

      if (!payroll) {
        console.log("❌ Payroll not found:", id);
        throw new ApiError(404, "Payroll not found");
      }

      console.log("📊 Payroll details:", {
        id: payroll._id,
        employee: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
        status: payroll.status,
        currentLevel: payroll.approvalFlow?.currentLevel,
      });

      // Check if the payroll is in the correct status
      if (payroll.status !== PAYROLL_STATUS.PENDING) {
        console.log("❌ Invalid payroll status:", payroll.status);
        throw new ApiError(400, "Only pending payrolls can be approved");
      }

      // Check if the payroll is at the correct approval level
      if (payroll.approvalFlow?.currentLevel !== APPROVAL_LEVELS.SUPER_ADMIN) {
        console.log(
          "❌ Invalid approval level:",
          payroll.approvalFlow?.currentLevel
        );
        throw new ApiError(
          400,
          `Payroll is not at SUPER_ADMIN approval level. Current level: ${payroll.approvalFlow?.currentLevel}`
        );
      }

      // Check if the admin is a Super Admin
      if (admin.role?.toLowerCase() !== "super_admin") {
        console.log("❌ Admin not a Super Admin:", admin.role);
        throw new ApiError(
          403,
          "You must be a Super Admin to approve at this level"
        );
      }

      console.log("✅ All validation checks passed, proceeding with approval");

      // Update the payroll approval flow
      const updatedPayroll =
        await BaseApprovalController.updatePayrollApprovalFlow(
          payroll,
          APPROVAL_LEVELS.SUPER_ADMIN,
          admin,
          true,
          remarks
        );
      console.log("✅ Payroll approval flow updated successfully");

      // Create self-notification for the Super Admin
      console.log("📬 Creating self-notification for Super Admin");
      await NotificationService.createNotification(
        admin._id,
        NOTIFICATION_TYPES.PAYROLL_COMPLETED,
        updatedPayroll.employee,
        updatedPayroll,
        `You have successfully approved the payroll for ${updatedPayroll.employee.firstName} ${updatedPayroll.employee.lastName} (${updatedPayroll.employee.employeeId}). The payroll is now fully approved and ready for processing.`,
        {
          data: {
            approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
            remarks: remarks || "No remarks provided",
          },
        }
      );

      // Find HR Manager to notify
      console.log("🔍 Finding HR Manager to notify");
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
          console.log("👥 HR Manager found:", {
            id: hrManager._id,
            name: `${hrManager.firstName} ${hrManager.lastName}`,
            position: hrManager.position,
          });

          // Create notification for HR Manager
          console.log("📬 Creating notification for HR Manager");
          await NotificationService.createNotification(
            hrManager._id,
        NOTIFICATION_TYPES.PAYROLL_COMPLETED,
            updatedPayroll.employee,
        updatedPayroll,
            `The payroll for ${updatedPayroll.employee.firstName} ${updatedPayroll.employee.lastName} (${updatedPayroll.employee.employeeId}) has been fully approved by ${admin.firstName} ${admin.lastName} (${admin.position}). The payroll is now ready for processing.`,
        {
          data: {
                approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
                remarks: remarks || "No remarks provided",
          },
        }
      );
        }
      }

      // Find Finance Director to notify
      console.log("🔍 Finding Finance Director to notify");
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
          console.log("👥 Finance Director found:", {
            id: financeDirector._id,
            name: `${financeDirector.firstName} ${financeDirector.lastName}`,
            position: financeDirector.position,
          });

          // Create notification for Finance Director
          console.log("📬 Creating notification for Finance Director");
          await NotificationService.createNotification(
            financeDirector._id,
            NOTIFICATION_TYPES.PAYROLL_COMPLETED,
            updatedPayroll.employee,
            updatedPayroll,
            `The payroll for ${updatedPayroll.employee.firstName} ${updatedPayroll.employee.lastName} (${updatedPayroll.employee.employeeId}) has been fully approved by ${admin.firstName} ${admin.lastName} (${admin.position}). The payroll is now ready for processing.`,
            {
              data: {
                approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
                remarks: remarks || "No remarks provided",
              },
            }
          );
        }
      }

      // Create audit log
      await AuditService.logAction(
        AuditAction.APPROVE,
        AuditEntity.PAYROLL,
        updatedPayroll._id,
        admin._id,
        {
          status: updatedPayroll.status,
          currentLevel: APPROVAL_LEVELS.SUPER_ADMIN,
          nextLevel: null,
          approvalFlow: {
            currentLevel: null,
            history: updatedPayroll.approvalFlow.history,
          },
          employeeName: `${updatedPayroll.employee.firstName} ${updatedPayroll.employee.lastName}`,
          employeeId: updatedPayroll.employee._id,
          month: updatedPayroll.month,
          year: updatedPayroll.year,
          departmentId: updatedPayroll.department,
          remarks: remarks || "Approved by Super Admin",
          approvedAt: new Date(),
        }
      );

      console.log("✅ Super Admin approval process completed successfully");

      // Set response headers to trigger UI updates
      res.set({
        "x-refresh-payrolls": "true",
        "x-refresh-audit-logs": "true",
        "x-refresh-notifications": "true",
      });

      return res.status(200).json({
        success: true,
        message: "Payroll approved successfully",
        data: {
          payroll: updatedPayroll,
        },
      });
    } catch (error) {
      console.error("❌ Error in Super Admin approval process:", error);
      next(error);
    }
  }

  /**
   * Reject a payroll as Super Admin
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async rejectAsSuperAdmin(req, res, next) {
    try {
      console.log("🔍 Starting Super Admin rejection process");
      const { id } = req.params;
      const { reason } = req.body;
      const admin = await UserModel.findById(req.user.id);

      if (!admin) {
        console.log("❌ Admin not found:", req.user.id);
        throw new ApiError(404, "Admin not found");
      }

      console.log("👤 Admin details:", {
        id: admin._id,
        name: `${admin.firstName} ${admin.lastName}`,
        position: admin.position,
        role: admin.role,
      });

      // Find the payroll
      const payroll = await PayrollModel.findById(id).populate("employee");

      if (!payroll) {
        console.log("❌ Payroll not found:", id);
        throw new ApiError(404, "Payroll not found");
      }

      console.log("📊 Payroll details:", {
        id: payroll._id,
        employee: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
        status: payroll.status,
        currentLevel: payroll.approvalFlow?.currentLevel,
      });

      // Check if the payroll is in the correct status
      if (payroll.status !== PAYROLL_STATUS.PENDING) {
        console.log("❌ Invalid payroll status:", payroll.status);
        throw new ApiError(400, "Only pending payrolls can be rejected");
      }

      // Check if the payroll is at the correct approval level
      if (payroll.approvalFlow?.currentLevel !== APPROVAL_LEVELS.SUPER_ADMIN) {
        console.log(
          "❌ Invalid approval level:",
          payroll.approvalFlow?.currentLevel
        );
        throw new ApiError(
          400,
          `Payroll is not at SUPER_ADMIN approval level. Current level: ${payroll.approvalFlow?.currentLevel}`
        );
      }

      // Check if the admin is a Super Admin
      if (admin.role?.toLowerCase() !== "super_admin") {
        console.log("❌ Admin not a Super Admin:", admin.role);
        throw new ApiError(
          403,
          "You must be a Super Admin to reject at this level"
        );
      }

      console.log("✅ All validation checks passed, proceeding with rejection");

      // Update the payroll approval flow
      const updatedPayroll =
        await BaseApprovalController.updatePayrollApprovalFlow(
          payroll,
          APPROVAL_LEVELS.SUPER_ADMIN,
          admin,
          false,
          reason
        );
      console.log("✅ Payroll rejection flow updated successfully");

      // Create self-notification for the Super Admin
      console.log("📬 Creating self-notification for Super Admin");
      await NotificationService.createNotification(
        admin._id,
        NOTIFICATION_TYPES.PAYROLL_REJECTED,
        updatedPayroll.employee,
        updatedPayroll,
        reason || "You have rejected this payroll",
        {
          data: {
            approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
            rejectionReason: reason,
          },
        }
      );

      // Find HR Manager to notify
      console.log("🔍 Finding HR Manager to notify");
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
          console.log("👥 HR Manager found:", {
            id: hrManager._id,
            name: `${hrManager.firstName} ${hrManager.lastName}`,
            position: hrManager.position,
          });

          // Create notification for HR Manager
          console.log("📬 Creating notification for HR Manager");
          await NotificationService.createNotification(
            hrManager._id,
            NOTIFICATION_TYPES.PAYROLL_REJECTED,
            updatedPayroll.employee,
            updatedPayroll,
            reason || "A payroll has been rejected by Super Admin",
            {
              data: {
                approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
                rejectionReason: reason,
              },
            }
          );
        }
      }

      // Find Finance Director to notify
      console.log("🔍 Finding Finance Director to notify");
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
          console.log("👥 Finance Director found:", {
            id: financeDirector._id,
            name: `${financeDirector.firstName} ${financeDirector.lastName}`,
            position: financeDirector.position,
          });

          // Create notification for Finance Director
          console.log("📬 Creating notification for Finance Director");
          await NotificationService.createNotification(
            financeDirector._id,
            NOTIFICATION_TYPES.PAYROLL_REJECTED,
            updatedPayroll.employee,
            updatedPayroll,
            reason || "A payroll has been rejected by Super Admin",
            {
              data: {
                approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
                rejectionReason: reason,
              },
            }
          );
        }
      }

      // Create audit log
      await AuditService.logAction(
        AuditAction.REJECT,
        AuditEntity.PAYROLL,
        updatedPayroll._id,
        admin._id,
        {
          status: updatedPayroll.status,
          currentLevel: APPROVAL_LEVELS.SUPER_ADMIN,
          nextLevel: null,
          approvalFlow: {
            currentLevel: null,
            history: updatedPayroll.approvalFlow.history,
          },
          employeeName: `${updatedPayroll.employee.firstName} ${updatedPayroll.employee.lastName}`,
          employeeId: updatedPayroll.employee._id,
          month: updatedPayroll.month,
          year: updatedPayroll.year,
          departmentId: updatedPayroll.department,
          remarks: reason || "Rejected by Super Admin",
          rejectedAt: new Date(),
        }
      );

      console.log("✅ Super Admin rejection process completed successfully");

      // Set response headers to trigger UI updates
      res.set({
        "x-refresh-payrolls": "true",
        "x-refresh-audit-logs": "true",
        "x-refresh-notifications": "true",
      });

      return res.status(200).json({
        success: true,
        message: "Payroll rejected successfully",
        data: {
          payroll: updatedPayroll,
        },
      });
    } catch (error) {
      console.error("❌ Error in Super Admin rejection process:", error);
      next(error);
    }
  }
}

export default ApprovalController;
