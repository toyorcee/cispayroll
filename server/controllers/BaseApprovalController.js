import { ApiError } from "../utils/errorHandler.js";
import PayrollModel from "../models/Payroll.js";
import UserModel from "../models/User.js";
import DepartmentModel from "../models/Department.js";
import {
  NotificationService,
  NOTIFICATION_TYPES,
} from "../services/NotificationService.js";
import NotificationModel from "../models/Notification.js";

// Approval levels enum
export const APPROVAL_LEVELS = {
  DEPARTMENT_HEAD: "DEPARTMENT_HEAD",
  HR_MANAGER: "HR_MANAGER",
  FINANCE_DIRECTOR: "FINANCE_DIRECTOR",
  SUPER_ADMIN: "SUPER_ADMIN",
};

// Payroll status enum
export const PAYROLL_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  COMPLETED: "COMPLETED",
};

class BaseApprovalController {
  /**
   * Find the next approver based on the current approval level
   * @param {string} currentLevel - Current approval level
   * @param {Object} payroll - Payroll object
   * @returns {Promise<Object>} - Next approver user object
   */
  static async findNextApprover(currentLevel, payroll) {
    try {
      let nextApprover = null;
      let nextLevel = null;

      // Determine the next approval level
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
          // No next level, this is the final approval
          return null;
        default:
          throw new ApiError(400, "Invalid approval level");
      }

      console.log(`🔍 Looking for next approver at level: ${nextLevel}`);

      // Find the next approver based on the next level
      if (nextLevel === APPROVAL_LEVELS.HR_MANAGER) {
        // Find HR department
        const hrDepartment = await DepartmentModel.findOne({
          name: { $in: ["Human Resources", "HR"] },
          status: "active",
        });

        if (hrDepartment) {
          console.log(
            `✅ Found HR department: ${hrDepartment.name} (${hrDepartment._id})`
          );

          // Find HR Manager in this department
          nextApprover = await UserModel.findOne({
            department: hrDepartment._id,
            position: {
              $regex: "hr manager|head of hr|hr head",
              $options: "i",
            },
            status: "active",
          });

          if (nextApprover) {
            console.log(
              `✅ Found HR Manager: ${nextApprover.firstName} ${nextApprover.lastName} (${nextApprover._id})`
            );
          } else {
            console.log("❌ No HR Manager found in HR department");
          }
        } else {
          console.log("❌ HR department not found");
        }
      } else if (nextLevel === APPROVAL_LEVELS.FINANCE_DIRECTOR) {
        // Find Finance department
        const financeDepartment = await DepartmentModel.findOne({
          name: { $in: ["Finance", "Finance and Accounting", "Accounting"] },
          status: "active",
        });

        if (financeDepartment) {
          console.log(
            `✅ Found Finance department: ${financeDepartment.name} (${financeDepartment._id})`
          );

          // Find Finance Director in this department
          nextApprover = await UserModel.findOne({
            department: financeDepartment._id,
            position: {
              $regex: "finance director|head of finance|finance head",
              $options: "i",
            },
            status: "active",
          });

          if (nextApprover) {
            console.log(
              `✅ Found Finance Director: ${nextApprover.firstName} ${nextApprover.lastName} (${nextApprover._id})`
            );
          } else {
            console.log("❌ No Finance Director found in Finance department");
          }
        } else {
          console.log("❌ Finance department not found");
        }
      } else if (nextLevel === APPROVAL_LEVELS.SUPER_ADMIN) {
        // Find Super Admin
        nextApprover = await UserModel.findOne({
          role: { $regex: new RegExp("^super_admin$", "i") },
          status: "active",
        });

        if (nextApprover) {
          console.log(
            `✅ Found Super Admin: ${nextApprover.firstName} ${nextApprover.lastName} (${nextApprover._id})`
          );
        } else {
          console.log("❌ No Super Admin found");
        }
      }

      return nextApprover;
    } catch (error) {
      console.error("❌ Error finding next approver:", error);
      throw error;
    }
  }

  /**
   * Create a notification for the next approver
   * @param {Object} nextApprover - Next approver user object
   * @param {Object} payroll - Payroll object
   * @param {string} currentLevel - Current approval level
   * @returns {Promise<Object>} - Created notification object
   */
  static async createApprovalNotification(nextApprover, payroll, currentLevel) {
    try {
      console.log(
        "🔔 Creating payroll notification for next approver:",
        nextApprover._id
      );
      console.log("📊 Payroll data:", JSON.stringify(payroll, null, 2));

      // Use the NotificationService instead of direct model creation
      const notification = await NotificationService.createPayrollNotification(
        payroll,
        NOTIFICATION_TYPES.PAYROLL_SUBMITTED,
        nextApprover,
        `Your payroll requires ${currentLevel} approval`
      );

      console.log("✅ Notification created with ID:", notification?._id);
      console.log("📨 Notification saved for user:", nextApprover._id);
      return notification;
    } catch (error) {
      console.error("❌ Error creating approval notification:", error);
      throw error;
    }
  }

  /**
   * Create a rejection notification
   * @param {Object} payroll - Payroll object
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>} - Created notification object
   */
  static async createRejectionNotification(employee, payroll, reason) {
    try {
      console.log(
        "🔔 Creating rejection notification for employee:",
        employee._id
      );
      console.log("📊 Payroll data:", JSON.stringify(payroll, null, 2));

      // Use the NotificationService instead of direct model creation
      const notification = await NotificationService.createPayrollNotification(
        payroll,
        NOTIFICATION_TYPES.PAYROLL_REJECTED,
        employee,
        reason
      );

      console.log(
        "✅ Rejection notification created with ID:",
        notification?._id
      );
      console.log("📨 Rejection notification saved for user:", employee._id);
      return notification;
    } catch (error) {
      console.error("❌ Error creating rejection notification:", error);
      throw error;
    }
  }

  /**
   * Update the payroll approval flow
   * @param {Object} payroll - Payroll object
   * @param {string} currentLevel - Current approval level
   * @param {Object} admin - Admin user object
   * @param {boolean} isApproved - Whether the payroll was approved or rejected
   * @param {string} reason - Rejection reason (if applicable)
   * @returns {Promise<Object>} - Updated payroll object
   */
  static async updatePayrollApprovalFlow(
    payroll,
    currentLevel,
    admin,
    isApproved,
    reason = ""
  ) {
    try {
      // Determine the next approval level
      let nextLevel = null;
      if (isApproved) {
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
      }

      // Create detailed status message
      const statusMessage = isApproved
        ? `Pending ${nextLevel.replace(/_/g, " ")} Approval`
        : "Rejected";

      // Update payroll status and approval flow
      const updatedPayroll = await PayrollModel.findByIdAndUpdate(
        payroll._id,
        {
          $set: {
            status: isApproved
              ? nextLevel === "COMPLETED"
                ? PAYROLL_STATUS.COMPLETED
                : PAYROLL_STATUS.PENDING
              : PAYROLL_STATUS.REJECTED,
            "approvalFlow.currentLevel": nextLevel,
            "approvalFlow.statusMessage": statusMessage,
            "approvalFlow.nextApprovalLevel":
              nextLevel === "COMPLETED" ? null : nextLevel,
            [`approvalFlow.${currentLevel}`]: {
              status: isApproved ? "APPROVED" : "REJECTED",
              approvedBy: admin._id,
              approvedAt: new Date(),
              reason: reason,
            },
          },
          $push: {
            "approvalFlow.history": {
              level: currentLevel,
              status: isApproved ? "APPROVED" : "REJECTED",
              approvedBy: admin._id,
              approvedAt: new Date(),
              reason: reason,
            },
          },
        },
        { new: true }
      ).populate("employee");

      if (!updatedPayroll) {
        throw new ApiError(404, "Payroll not found");
      }

      console.log(
        `✅ Updated payroll ${
          payroll._id
        } status to ${statusMessage} and level to ${nextLevel || "REJECTED"}`
      );

      // Create enhanced notifications
      const notificationPromises = [];

      // Notify the employee
      notificationPromises.push(
        NotificationService.createPayrollNotification(
          payroll,
          isApproved ? "PAYROLL_APPROVED" : "PAYROLL_REJECTED",
          payroll.employee,
          isApproved
            ? `Your payroll has been ${statusMessage.toLowerCase()}`
            : `Your payroll was rejected by ${currentLevel.replace(
                /_/g,
                " "
              )}: ${reason}`
        )
      );

      // If there's a next level, notify the next approver with detailed information
      if (nextLevel && nextLevel !== "COMPLETED") {
        const nextApprover = await this.findNextApprover(nextLevel, payroll);
        if (nextApprover) {
          notificationPromises.push(
            NotificationService.createPayrollNotification(
              payroll,
              "PAYROLL_PENDING_APPROVAL",
              nextApprover,
              `New payroll pending your approval as ${nextLevel.replace(
                /_/g,
                " "
              )}. Employee: ${payroll.employee.firstName} ${
                payroll.employee.lastName
              }, Amount: ₦${payroll.totals.netPay.toLocaleString()}`
            )
          );
        }
      }

      // If payroll is completed, create a completion notification
      if (nextLevel === "COMPLETED") {
        notificationPromises.push(
          NotificationService.createPayrollNotification(
            payroll,
            "PAYROLL_COMPLETED",
            payroll.employee,
            `Your payroll for ${payroll.month} ${
              payroll.year
            } has been fully approved and is ready for processing. Net Amount: ₦${payroll.totals.netPay.toLocaleString()}`
          )
        );
      }

      // Send all notifications
      await Promise.all(notificationPromises);

      return updatedPayroll;
    } catch (error) {
      console.error("Error updating payroll approval flow:", error);
      throw new ApiError(500, "Error updating payroll approval flow");
    }
  }
}

export default BaseApprovalController;
