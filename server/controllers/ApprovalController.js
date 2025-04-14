import { ApiError } from "../utils/errorHandler.js";
import PayrollModel from "../models/Payroll.js";
import UserModel from "../models/User.js";
// import NotificationModel from "../models/Notification.js";
import DepartmentModel from "../models/Department.js";
import BaseApprovalController, {
  APPROVAL_LEVELS,
  PAYROLL_STATUS,
} from "./BaseApprovalController.js";
import {
  NotificationService,
  NOTIFICATION_TYPES,
} from "../services/NotificationService.js";

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

      // Create notification for the next approver
      if (nextApprover) {
        await BaseApprovalController.createApprovalNotification(
          nextApprover,
          updatedPayroll,
          APPROVAL_LEVELS.DEPARTMENT_HEAD
        );
      }

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

      // Create notification for the employee
      await BaseApprovalController.createRejectionNotification(
        updatedPayroll,
        reason
      );

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
      const { id } = req.params;
      const { remarks } = req.body;
      console.log("🔍 Starting HR Manager approval process for payroll:", id);
      console.log("📝 Remarks:", remarks);

      const admin = await UserModel.findById(req.user.id);
      console.log("👤 Admin details:", {
        id: admin._id,
        name: `${admin.firstName} ${admin.lastName}`,
        position: admin.position,
        department: admin.department,
      });

      if (!admin) {
        throw new ApiError(404, "Admin not found");
      }

      // Get the payroll
      const payroll = await PayrollModel.findById(id).populate("employee");
      console.log("📊 Payroll details:", {
        id: payroll._id,
        employee: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
        status: payroll.status,
        currentLevel: payroll.approvalFlow?.currentLevel,
      });

      if (!payroll) {
        throw new ApiError(404, "Payroll not found");
      }

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

      // Create notifications for all stakeholders
      const notificationPromises = [];

      // 1. Notify the employee
      notificationPromises.push(
        NotificationService.createNotification(
          updatedPayroll.employee,
          "PAYROLL_APPROVED",
          updatedPayroll.employee,
          updatedPayroll,
          remarks || "Your payroll has been approved by HR Manager",
          { currentLevel: APPROVAL_LEVELS.HR_MANAGER }
        )
      );

      // 2. Notify the next approver (Finance Director)
      if (nextApprover) {
        notificationPromises.push(
          NotificationService.createNotification(
            nextApprover._id,
            "PAYROLL_SUBMITTED",
            admin,
            updatedPayroll,
            remarks || "New payroll pending your approval as Finance Director"
          )
        );
      }

      // 3. Notify the HR Manager (self-notification)
      console.log("🔍 Creating HR Manager self-notification with options:", {
        currentLevel: APPROVAL_LEVELS.HR_MANAGER,
        employee: updatedPayroll.employee,
        payroll: updatedPayroll,
      });
      notificationPromises.push(
        NotificationService.createNotification(
          admin._id,
          "PAYROLL_APPROVED",
          updatedPayroll.employee,
          updatedPayroll,
          remarks ||
            "You have successfully approved this payroll and it is now pending Finance Director approval",
          {
            data: {
              approvalLevel: APPROVAL_LEVELS.HR_MANAGER, 
            },
          }
        )
      );

      // Send all notifications
      await Promise.all(notificationPromises);

      console.log("🎉 HR Manager approval process completed successfully");

      res.status(200).json({
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
        name: "Human Resources",
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

      // Create notification for the employee
      await BaseApprovalController.createRejectionNotification(
        updatedPayroll,
        reason
      );

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
      const { id } = req.params;
      const { remarks } = req.body;
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
        name: { $in: ["Finance and Accounting", "Finance", "Financial"] },
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
            "You must be in the Finance department to approve at this level",
        });
      }

      // Check if the admin has the correct position
      const adminPosition = admin.position?.toLowerCase() || "";
      const isFinanceDirector = [
        "head of finance",
        "finance director",
        "finance head",
      ].some((pos) => adminPosition.includes(pos));

      if (!isFinanceDirector) {
        return res.status(403).json({
          success: false,
          message: "You must be a Finance Director to approve at this level",
        });
      }

      // Update the payroll approval flow
      const updatedPayroll =
        await BaseApprovalController.updatePayrollApprovalFlow(
          payroll,
          APPROVAL_LEVELS.FINANCE_DIRECTOR,
          admin,
          true,
          remarks
        );

      // Find the next approver (Super Admin)
      const nextApprover = await BaseApprovalController.findNextApprover(
        APPROVAL_LEVELS.FINANCE_DIRECTOR,
        updatedPayroll
      );

      // Create notification for the next approver
      if (nextApprover) {
        await BaseApprovalController.createApprovalNotification(
          nextApprover,
          updatedPayroll,
          APPROVAL_LEVELS.FINANCE_DIRECTOR
        );

        // Also create a notification for the employee
        await NotificationService.createPayrollNotification(
          payroll.employee._id,
          NOTIFICATION_TYPES.PAYROLL_APPROVED,
          updatedPayroll,
          remarks || "Your payroll has been approved by Finance Director"
        );
      }

      // Create self-notification for the Finance Director
      console.log(
        "🔍 Creating Finance Director self-notification with options:",
        {
          currentLevel: APPROVAL_LEVELS.FINANCE_DIRECTOR,
          employee: updatedPayroll.employee,
          payroll: updatedPayroll,
        }
      );
      await NotificationService.createNotification(
        admin._id,
        "PAYROLL_APPROVED",
        updatedPayroll.employee,
        updatedPayroll,
        remarks ||
          "You have successfully approved this payroll and it is now pending Super Admin approval",
        {
          data: {
            approvalLevel: APPROVAL_LEVELS.FINANCE_DIRECTOR, // Hard-code as FINANCE_DIRECTOR
          },
        }
      );

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
        name: "Finance and Accounting",
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
        "head of finance",
        "finance director",
        "finance head",
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

      // Create notification for the employee
      await BaseApprovalController.createRejectionNotification(
        updatedPayroll,
        reason
      );

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
      const { id } = req.params;
      const { remarks } = req.body;
      const admin = await UserModel.findById(req.user.id);

      console.log("Super Admin Approval - User Role:", admin.role);
      console.log("Super Admin Approval - User ID:", admin._id);
      console.log("Super Admin Approval - User Name:", admin.name);

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: "Admin not found",
        });
      }

      // Find the payroll
      const payroll = await PayrollModel.findById(id).populate("employee");

      console.log("Super Admin Approval - Payroll ID:", id);
      console.log("Super Admin Approval - Payroll Status:", payroll?.status);
      console.log(
        "Super Admin Approval - Current Level:",
        payroll?.approvalFlow?.currentLevel
      );

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
      if (payroll.approvalFlow?.currentLevel !== APPROVAL_LEVELS.SUPER_ADMIN) {
        return res.status(400).json({
          success: false,
          message: `Payroll is not at SUPER_ADMIN approval level. Current level: ${payroll.approvalFlow?.currentLevel}`,
        });
      }

      // Check if the admin is a Super Admin
      if (admin.role?.toLowerCase() !== "super_admin") {
        console.log("Super Admin Approval - Role Check Failed:", {
          expected: "super_admin",
          actual: admin.role,
        });
        return res.status(403).json({
          success: false,
          message: "You must be a Super Admin to approve at this level",
        });
      }

      // Update the payroll approval flow
      const updatedPayroll =
        await BaseApprovalController.updatePayrollApprovalFlow(
          payroll,
          APPROVAL_LEVELS.SUPER_ADMIN,
          admin,
          true
        );

      // Create notification for the employee using NotificationService
      await NotificationService.createPayrollNotification(
        payroll.employee._id,
        NOTIFICATION_TYPES.PAYROLL_COMPLETED,
        updatedPayroll,
        remarks ||
          "Your payroll has been fully approved and is ready for processing."
      );

      // Create notification for the Super Admin about their own action
      console.log("🔍 Creating Super Admin self-notification with options:", {
        currentLevel: APPROVAL_LEVELS.SUPER_ADMIN,
        employee: updatedPayroll.employee,
        payroll: updatedPayroll,
      });
      await NotificationService.createPayrollNotification(
        admin._id,
        NOTIFICATION_TYPES.PAYROLL_COMPLETED,
        updatedPayroll,
        remarks || "You approved this payroll as the final approver.",
        {
          data: {
            approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN, // Hard-code as SUPER_ADMIN
          },
        }
      );

      return res.status(200).json({
        success: true,
        message: "Payroll approved successfully",
        data: {
          payroll: updatedPayroll,
        },
      });
    } catch (error) {
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
      if (payroll.approvalFlow?.currentLevel !== APPROVAL_LEVELS.SUPER_ADMIN) {
        return res.status(400).json({
          success: false,
          message: `Payroll is not at SUPER_ADMIN approval level. Current level: ${payroll.approvalFlow?.currentLevel}`,
        });
      }

      // Check if the admin is a Super Admin
      if (admin.role !== "super_admin") {
        return res.status(403).json({
          success: false,
          message: "You must be a Super Admin to reject at this level",
        });
      }

      // Update the payroll approval flow
      const updatedPayroll =
        await BaseApprovalController.updatePayrollApprovalFlow(
          payroll,
          APPROVAL_LEVELS.SUPER_ADMIN,
          admin,
          false,
          reason
        );

      // Create notification for the employee
      await BaseApprovalController.createRejectionNotification(
        updatedPayroll,
        reason
      );

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
}

export default ApprovalController;
