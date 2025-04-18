import { ApiError } from "../utils/errorHandler.js";
import PayrollModel from "../models/Payroll.js";
import UserModel from "../models/User.js";
import DepartmentModel from "../models/Department.js";
import {
  NotificationService,
  NOTIFICATION_TYPES,
} from "../services/NotificationService.js";
import Audit from "../models/Audit.js";
import { AuditAction, AuditEntity } from "../models/Audit.js";

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
      console.log("🔍 Finding next approver for level:", currentLevel);
      console.log("📊 Payroll data:", JSON.stringify(payroll, null, 2));

      // This method is now just for finding the next approver
      // Notifications are handled in ApprovalController
      return nextApprover;
    } catch (error) {
      console.error("❌ Error finding next approver:", error);
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
      console.log("🔍 Processing rejection for employee:", employee._id);
      console.log("📊 Payroll data:", JSON.stringify(payroll, null, 2));

      // This method is now just for processing the rejection
      // Notifications are handled in ApprovalController
      return { employee, payroll, reason };
    } catch (error) {
      console.error("❌ Error processing rejection:", error);
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
        : "Returned to Department Head for Review";

      // Create the history entry for this action
      const historyEntry = {
        level: currentLevel,
        status: isApproved ? "APPROVED" : "REJECTED",
        action: isApproved ? "APPROVE" : "REJECT",
        user: admin._id,
        timestamp: new Date(),
        remarks: reason,
      };

      // If rejected, we'll preserve the history but reset the approval flow
      const updateQuery = isApproved
        ? {
            $set: {
              status:
                nextLevel === "COMPLETED"
                  ? PAYROLL_STATUS.COMPLETED
                  : PAYROLL_STATUS.PENDING,
              "approvalFlow.currentLevel": nextLevel,
              "approvalFlow.statusMessage": statusMessage,
              "approvalFlow.nextApprovalLevel":
                nextLevel === "COMPLETED" ? null : nextLevel,
              [`approvalFlow.${currentLevel}`]: {
                status: "APPROVED",
                approvedBy: admin._id,
                approvedAt: new Date(),
                reason: reason,
              },
            },
            $push: {
              "approvalFlow.history": historyEntry,
            },
          }
        : {
            $set: {
              status: PAYROLL_STATUS.REJECTED,
              "approvalFlow.currentLevel": APPROVAL_LEVELS.DEPARTMENT_HEAD,
              "approvalFlow.statusMessage": statusMessage,
              "approvalFlow.nextApprovalLevel": null,
              "approvalFlow.rejectedAt": new Date(),
              "approvalFlow.rejectedBy": admin._id,
              "approvalFlow.rejectedAtLevel": currentLevel,
              "approvalFlow.rejectionReason": reason || "No reason provided",
              // Reset approval levels but keep history
              "approvalFlow.DEPARTMENT_HEAD": null,
              "approvalFlow.HR_MANAGER": null,
              "approvalFlow.FINANCE_DIRECTOR": null,
              "approvalFlow.SUPER_ADMIN": null,
              // Track rejection state
              "approvalFlow.rejectionState": {
                level: currentLevel,
                timestamp: new Date(),
                reason: reason || "No reason provided",
                rejectedBy: admin._id,
                departmentHeadId: payroll.employee.department,
                needsReview: true,
              },
              // Increment rejection count
              "approvalFlow.rejectionCount": {
                $cond: {
                  if: { $exists: ["$approvalFlow.rejectionCount"] },
                  then: { $add: ["$approvalFlow.rejectionCount", 1] },
                  else: 1,
                },
              },
            },
            $push: {
              "approvalFlow.history": historyEntry,
            },
          };

      // Update payroll status and approval flow
      const updatedPayroll = await PayrollModel.findByIdAndUpdate(
        payroll._id,
        updateQuery,
        { new: true }
      ).populate("employee");

      // If rejected, notify the department head
      if (!isApproved) {
        const departmentHead = await UserModel.findOne({
          department: payroll.employee.department,
          position: { $regex: "head|director|manager", $options: "i" },
        });

        if (departmentHead) {
          await NotificationService.createNotification(
            departmentHead._id,
            NOTIFICATION_TYPES.PAYROLL_REJECTED,
            updatedPayroll.employee,
            updatedPayroll,
            `Payroll rejected by ${currentLevel.replace(
              /_/g,
              " "
            )}. Please review and resubmit.`,
            {
              data: {
                rejectionLevel: currentLevel,
                reason: reason || "No reason provided",
                needsReview: true,
              },
            }
          );
        }
      }

      // Create audit log
      await Audit.create({
        action: isApproved ? AuditAction.APPROVE : AuditAction.REJECT,
        entity: AuditEntity.PAYROLL,
        entityId: payroll._id,
        performedBy: admin._id,
        details: {
          status: updatedPayroll.status,
          currentLevel,
          nextLevel: isApproved ? nextLevel : null,
          approvalFlow: {
            currentLevel: isApproved
              ? nextLevel
              : APPROVAL_LEVELS.DEPARTMENT_HEAD,
            history: updatedPayroll.approvalFlow.history,
            completedAt: nextLevel === "COMPLETED" ? new Date() : null,
            rejectedAt: !isApproved ? new Date() : null,
            rejectionReason: !isApproved ? reason : null,
          },
          employeeName: `${updatedPayroll.employee.firstName} ${updatedPayroll.employee.lastName}`,
          employeeId: updatedPayroll.employee._id,
          month: updatedPayroll.month,
          year: updatedPayroll.year,
          departmentId: updatedPayroll.department,
          remarks:
            reason ||
            `${isApproved ? "Approved" : "Rejected"} by ${currentLevel.replace(
              /_/g,
              " "
            )}`,
          approvedAt: isApproved ? new Date() : null,
        },
      });

      return updatedPayroll;
    } catch (error) {
      console.error("Error updating payroll approval flow:", error);
      throw new ApiError(500, "Error updating payroll approval flow");
    }
  }
}

export default BaseApprovalController;
