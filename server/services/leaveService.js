import Leave from "../models/Leave.js";
import { LEAVE_STATUS, APPROVAL_LEVEL } from "../models/Leave.js";
import { Types } from "mongoose";
import User from "../models/User.js";
import {
  NotificationService,
  NOTIFICATION_TYPES,
} from "./NotificationService.js";
import Department from "../models/Department.js";
import AuditService from "./AuditService.js";
import { AuditAction, AuditEntity } from "../models/Audit.js";

export class LeaveService {
  /**
   * Create a new leave request
   * @param {Types.ObjectId} userId - User ID
   * @param {Object} leaveData - Leave request data
   * @returns {Promise<Object>} Created leave request
   */
  static async createLeave(userId, leaveData) {
    try {
      console.log(`[LeaveService] Creating leave request for user ${userId}`);
      console.log(`[LeaveService] Leave data:`, leaveData);

      // Get the user to access their department
      const user = await User.findById(userId);
      if (!user) {
        console.error(`[LeaveService] User not found with ID: ${userId}`);
        throw new Error("User not found");
      }

      console.log(
        `[LeaveService] Found user: ${user.firstName} ${user.lastName} (${user._id})`
      );
      console.log(`[LeaveService] User department: ${user.department}`);

      // Create the leave request with the user's department
      const leave = await Leave.create({
        user: userId,
        department: user.department,
        ...leaveData,
      });

      console.log(`[LeaveService] Created leave request with ID: ${leave._id}`);
      console.log(`[LeaveService] Leave details:`, {
        type: leave.type,
        startDate: leave.startDate,
        endDate: leave.endDate,
        status: leave.status,
        department: leave.department,
      });

      // Notify the user who created the leave request
      console.log(`[LeaveService] Notifying leave requester: ${user._id}`);
      try {
        const notification = await NotificationService.createNotification(
          user._id,
          "LEAVE_REQUESTED_INFO",
          user,
          leave
        );
        console.log(
          `[LeaveService] Notification sent to leave requester: ${notification._id}`
        );
      } catch (notificationError) {
        console.error(
          `[LeaveService] Error notifying leave requester:`,
          notificationError
        );
      }

      // Find and notify super admins
      console.log(`[LeaveService] Finding super admins to notify`);
      const superAdmins = await User.find({
        role: "SUPER_ADMIN",
        status: "active",
      });

      for (const superAdmin of superAdmins) {
        console.log(`[LeaveService] Notifying super admin: ${superAdmin._id}`);
        try {
          const notification = await NotificationService.createNotification(
            superAdmin._id,
            "LEAVE_REQUESTED",
            user,
            leave
          );
          console.log(
            `[LeaveService] Notification sent to super admin: ${notification._id}`
          );
        } catch (notificationError) {
          console.error(
            `[LeaveService] Error notifying super admin:`,
            notificationError
          );
        }
      }

      // Find department head and HR manager to notify
      console.log(
        `[LeaveService] Finding department head for department: ${user.department}`
      );

      // Find department head using position titles
      const departmentHead = await User.findOne({
        department: user.department,
        position: {
          $regex: "head of department|department head|head|director|manager",
          $options: "i",
        },
        status: "active",
      });

      if (departmentHead) {
        console.log(
          `[LeaveService] Found department head: ${departmentHead.firstName} ${departmentHead.lastName} (${departmentHead._id})`
        );
      } else {
        console.log(
          `[LeaveService] No department head found for department: ${user.department}`
        );
      }

      console.log(`[LeaveService] Finding HR manager`);
      // Find HR department
      const hrDepartment = await Department.findOne({
        name: { $in: ["Human Resources", "HR"] },
        status: "active",
      });

      let hrManager = null;
      if (hrDepartment) {
        console.log(
          `[LeaveService] Found HR department: ${hrDepartment.name} (${hrDepartment._id})`
        );

        // Find HR Manager in this department
        hrManager = await User.findOne({
          department: hrDepartment._id,
          position: {
            $regex:
              "hr manager|head of hr|hr head|head of human resources|human resources manager|hr director",
            $options: "i",
          },
          status: "active",
        });

        if (hrManager) {
          console.log(
            `[LeaveService] Found HR manager: ${hrManager.firstName} ${hrManager.lastName} (${hrManager._id})`
          );
        } else {
          console.log(`[LeaveService] No HR manager found in HR department`);
        }
      } else {
        console.log(`[LeaveService] HR department not found`);
      }

      // Notify department head
      if (departmentHead) {
        console.log(
          `[LeaveService] Notifying department head: ${departmentHead._id}`
        );
        try {
          const notification = await NotificationService.createNotification(
            departmentHead._id,
            "LEAVE_REQUESTED",
            user,
            leave
          );
          console.log(
            `[LeaveService] Notification sent to department head: ${notification._id}`
          );
        } catch (notificationError) {
          console.error(
            `[LeaveService] Error notifying department head:`,
            notificationError
          );
        }
      }

      // Notify HR manager
      if (hrManager) {
        console.log(`[LeaveService] Notifying HR manager: ${hrManager._id}`);
        try {
          const notification = await NotificationService.createNotification(
            hrManager._id,
            "LEAVE_REQUESTED",
            user,
            leave
          );
          console.log(
            `[LeaveService] Notification sent to HR manager: ${notification._id}`
          );
        } catch (notificationError) {
          console.error(
            `[LeaveService] Error notifying HR manager:`,
            notificationError
          );
        }
      }

      // Create audit log entry
      try {
        console.log(`[LeaveService] Creating audit log for leave request`);
        await AuditService.logAction(
          AuditAction.CREATE,
          AuditEntity.LEAVE,
          leave._id,
          userId,
          {
            leaveType: leaveData.type,
            startDate: leaveData.startDate,
            endDate: leaveData.endDate,
            reason: leaveData.reason,
            status: LEAVE_STATUS.PENDING,
            department: user.department,
            approvalLevel: 1,
          }
        );
        console.log(`[LeaveService] Audit log created for leave request`);
      } catch (auditError) {
        console.error(`[LeaveService] Error creating audit log:`, auditError);
      }

      console.log(
        `[LeaveService] Leave request process completed successfully`
      );
      return leave;
    } catch (error) {
      console.error(`[LeaveService] Error creating leave request:`, error);
      throw error;
    }
  }

  /**
   * Get leaves for a specific user
   * @param {Types.ObjectId} userId - User ID
   * @returns {Promise<Array>} List of leaves
   */
  static async getUserLeaves(userId) {
    return Leave.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("user", "firstName lastName email department");
  }

  /**
   * Get team leaves based on query
   * @param {Object} query - Query parameters
   * @param {Object} user - User object making the request
   * @returns {Promise<Array>} List of team leaves
   */
  static async getTeamLeaves(query = {}, user) {
    console.log(
      `[LeaveService] Getting team leaves for user: ${user._id} (${user.firstName} ${user.lastName})`
    );
    console.log(
      `[LeaveService] User role: ${user.role}, Department: ${user.department}`
    );

    // If user is SUPER_ADMIN, they can see all leaves
    if (user.role === "SUPER_ADMIN") {
      console.log(`[LeaveService] User is SUPER_ADMIN, returning all leaves`);
      return Leave.find()
        .sort({ createdAt: -1 })
        .populate("user", "firstName lastName email department")
        .populate("approvedBy", "firstName lastName");
    }

    // If user is ADMIN, they can only see leaves from their department
    if (user.role === "ADMIN") {
      // Check if the user is the department head
      const department = await Department.findById(user.department);
      if (!department) {
        console.log(`[LeaveService] Department not found for user`);
        return [];
      }

      const isDepartmentHead =
        department.headOfDepartment &&
        department.headOfDepartment.toString() === user._id.toString();

      console.log(
        `[LeaveService] User is ADMIN, isDepartmentHead: ${isDepartmentHead}`
      );

      if (!isDepartmentHead) {
        console.log(
          `[LeaveService] User is not the department head, cannot view team leaves`
        );
        return [];
      }

      // Find all users in the department
      const usersInDepartment = await User.find({
        department: user.department,
      }).select("_id");
      const userIds = usersInDepartment.map((user) => user._id);

      console.log(
        `[LeaveService] Found ${userIds.length} users in department ${user.department}`
      );

      // Find leaves for these users
      return Leave.find({ user: { $in: userIds } })
        .sort({ createdAt: -1 })
        .populate("user", "firstName lastName email department")
        .populate("approvedBy", "firstName lastName");
    }

    // If regular user, return no leaves
    console.log(`[LeaveService] User is regular user, cannot view team leaves`);
    return [];
  }

  /**
   * Approve a leave request
   * @param {Types.ObjectId} leaveId - Leave ID
   * @param {Object} approver - Approver user object
   * @param {string} notes - Approval notes
   * @returns {Promise<Object>} Updated leave request
   */
  static async approveLeave(leaveId, approver, notes) {
    console.log(`[LeaveService] Approving leave request: ${leaveId}`);
    console.log(
      `[LeaveService] Approver: ${approver._id} (${approver.firstName} ${approver.lastName}), Role: ${approver.role}`
    );

    const leave = await Leave.findById(leaveId).populate("user");
    if (!leave) {
      console.error(`[LeaveService] Leave request not found: ${leaveId}`);
      throw new Error("Leave request not found");
    }

    if (leave.status !== LEAVE_STATUS.PENDING) {
      console.error(
        `[LeaveService] Leave request is not in pending status: ${leave.status}`
      );
      throw new Error("Leave request is not in pending status");
    }

    // Check if the approver is the department head of the leave requester's department
    const department = await Department.findById(leave.user.department);
    if (!department) {
      console.error(
        `[LeaveService] Department not found for user: ${leave.user._id}`
      );
      throw new Error("Department not found for the leave requester");
    }

    // Check if the approver is the department head or has SUPER_ADMIN role
    const isDepartmentHead =
      department.headOfDepartment &&
      department.headOfDepartment.toString() === approver._id.toString();
    const isSuperAdmin = approver.role === "SUPER_ADMIN";

    console.log(`[LeaveService] Approval check:`, {
      departmentId: department._id,
      departmentName: department.name,
      departmentHeadId: department.headOfDepartment,
      isDepartmentHead,
      isSuperAdmin,
      approverRole: approver.role,
    });

    // If super admin is approving, handle it differently
    if (isSuperAdmin) {
      console.log(`[LeaveService] Super admin approval detected`);

      // Update leave status directly to APPROVED
      leave.status = LEAVE_STATUS.APPROVED;
      leave.approvedBy = approver._id;
      leave.approvalDate = new Date();
      leave.approvalNotes = notes;

      // Add to approval history
      const approvalEntry = {
        level: "SUPER_ADMIN",
        approver: approver._id,
        status: LEAVE_STATUS.APPROVED,
        notes: notes,
        date: new Date(),
      };

      if (!leave.approvalHistory) {
        leave.approvalHistory = [];
      }
      leave.approvalHistory.push(approvalEntry);

      // Notify the leave requester
      console.log(
        `[LeaveService] Notifying leave requester about super admin approval`
      );
      await NotificationService.createNotification(
        leave.user._id,
        NOTIFICATION_TYPES.LEAVE_APPROVED,
        leave.user,
        null,
        notes,
        { leave, approver }
      ).catch((error) => {
        console.error(`[LeaveService] Error notifying leave requester:`, error);
      });

      // Notify department head
      if (department.headOfDepartment) {
        console.log(
          `[LeaveService] Notifying department head about super admin approval`
        );
        await NotificationService.createNotification(
          department.headOfDepartment,
          NOTIFICATION_TYPES.LEAVE_APPROVED,
          leave.user,
          null,
          notes,
          { leave, approver }
        ).catch((error) => {
          console.error(
            `[LeaveService] Error notifying department head:`,
            error
          );
        });
      }

      // Create audit log
      try {
        console.log(
          `[LeaveService] Creating audit log for super admin approval`
        );
        await AuditService.logAction(
          AuditAction.UPDATE,
          AuditEntity.LEAVE,
          leave._id,
          approver._id,
          {
            action: "APPROVE",
            previousStatus: LEAVE_STATUS.PENDING,
            newStatus: LEAVE_STATUS.APPROVED,
            approverRole: "SUPER_ADMIN",
            notes: notes,
          }
        );
        console.log(
          `[LeaveService] Audit log created for super admin approval`
        );
      } catch (auditError) {
        console.error(`[LeaveService] Error creating audit log:`, auditError);
      }

      await leave.save();
      console.log(
        `[LeaveService] Leave request approved by super admin. New status: ${leave.status}`
      );
      return leave;
    }

    // Regular approval flow for department head
    // Check if the approver is authorized to approve at the current level
    if (
      leave.currentApprover === APPROVAL_LEVEL.DEPARTMENT_HEAD &&
      !isDepartmentHead &&
      !isSuperAdmin
    ) {
      throw new Error(
        "Only the department head or super admin can approve leave requests at this level"
      );
    }

    if (
      leave.currentApprover === APPROVAL_LEVEL.HR_MANAGER &&
      approver.role !== "SUPER_ADMIN"
    ) {
      throw new Error(
        "Only HR manager can approve leave requests at this level"
      );
    }

    // Add to approval history
    const approvalEntry = {
      level: leave.approvalLevel,
      approver: approver._id,
      status: LEAVE_STATUS.APPROVED,
      notes: notes,
      date: new Date(),
    };

    if (!leave.approvalHistory) {
      leave.approvalHistory = [];
    }
    leave.approvalHistory.push(approvalEntry);

    // Update approval level and current approver based on who is approving
    if (leave.currentApprover === APPROVAL_LEVEL.DEPARTMENT_HEAD) {
      // Department head has approved, move to HR approval
      leave.approvalLevel = 2;
      leave.currentApprover = APPROVAL_LEVEL.HR_MANAGER;
      leave.status = LEAVE_STATUS.PENDING; // Keep as pending until HR approves

      // Find HR manager to notify
      console.log(
        `[LeaveService] Finding HR manager for approval notification`
      );

      // Find HR department
      const hrDepartment = await Department.findOne({
        name: { $in: ["Human Resources", "HR"] },
        status: "active",
      });

      let hrManager = null;
      if (hrDepartment) {
        console.log(
          `[LeaveService] Found HR department: ${hrDepartment.name} (${hrDepartment._id})`
        );

        // Find HR Manager in this department
        hrManager = await User.findOne({
          department: hrDepartment._id,
          position: {
            $regex:
              "hr manager|head of hr|hr head|head of human resources|human resources manager|hr director",
            $options: "i",
          },
          status: "active",
        });

        if (hrManager) {
          console.log(
            `[LeaveService] Found HR manager: ${hrManager.firstName} ${hrManager.lastName} (${hrManager._id})`
          );
        } else {
          console.log(`[LeaveService] No HR manager found in HR department`);
        }
      } else {
        console.log(`[LeaveService] HR department not found`);
      }

      if (hrManager) {
        console.log(
          `[LeaveService] Notifying HR manager for approval: ${hrManager.firstName} ${hrManager.lastName}`
        );
        await NotificationService.createNotification(
          hrManager._id,
          NOTIFICATION_TYPES.LEAVE_PENDING_HR_APPROVAL,
          leave.user,
          null,
          notes,
          { leave, approver }
        ).catch((error) => {
          console.error(`[LeaveService] Error notifying HR manager:`, error);
        });
      }

      // Notify the leave requester that their request is pending HR approval
      console.log(
        `[LeaveService] Notifying leave requester about HR approval pending`
      );
      await NotificationService.createNotification(
        leave.user._id,
        NOTIFICATION_TYPES.LEAVE_PENDING_HR_APPROVAL,
        leave.user,
        null,
        notes,
        { leave, approver }
      ).catch((error) => {
        console.error(`[LeaveService] Error notifying leave requester:`, error);
      });
    } else if (leave.currentApprover === APPROVAL_LEVEL.HR_MANAGER) {
      // HR has approved, leave is fully approved
      leave.status = LEAVE_STATUS.APPROVED;
      leave.approvedBy = approver._id;
      leave.approvalDate = new Date();
      leave.approvalNotes = notes;

      // Notify the leave requester
      console.log(`[LeaveService] Notifying leave requester about HR approval`);
      await NotificationService.createNotification(
        leave.user._id,
        NOTIFICATION_TYPES.LEAVE_HR_APPROVED,
        leave.user,
        null,
        notes,
        { leave, approver }
      ).catch((error) => {
        console.error(`[LeaveService] Error notifying leave requester:`, error);
      });
    }

    await leave.save();
    console.log(
      `[LeaveService] Leave request updated. New status: ${leave.status}, Approval level: ${leave.approvalLevel}`
    );

    return leave;
  }

  /**
   * Reject a leave request
   * @param {Types.ObjectId} leaveId - Leave ID
   * @param {Object} rejector - Rejector user object
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>} Updated leave request
   */
  static async rejectLeave(leaveId, rejector, reason) {
    console.log(`[LeaveService] Rejecting leave request: ${leaveId}`);
    console.log(
      `[LeaveService] Rejector: ${rejector._id} (${rejector.firstName} ${rejector.lastName}), Role: ${rejector.role}`
    );

    const leave = await Leave.findById(leaveId).populate("user");
    if (!leave) {
      throw new Error("Leave request not found");
    }

    if (leave.status !== LEAVE_STATUS.PENDING) {
      throw new Error("Leave request is not in pending status");
    }

    // Check if the rejector is the department head of the leave requester's department
    const department = await Department.findById(leave.user.department);
    if (!department) {
      throw new Error("Department not found for the leave requester");
    }

    // Check if the rejector is the department head or has SUPER_ADMIN role
    const isDepartmentHead =
      department.headOfDepartment &&
      department.headOfDepartment.toString() === rejector._id.toString();
    const isSuperAdmin = rejector.role === "SUPER_ADMIN";

    // If not found by headOfDepartment field, check by position title
    if (!isDepartmentHead) {
      const departmentHeadByPosition = await User.findOne({
        department: department._id,
        position: {
          $regex: "head of department|department head|head|director|manager",
          $options: "i",
        },
        status: "active",
      });

      if (
        departmentHeadByPosition &&
        departmentHeadByPosition._id.toString() === rejector._id.toString()
      ) {
        isDepartmentHead = true;
      }
    }

    console.log(`[LeaveService] Rejection check:`, {
      departmentId: department._id,
      departmentName: department.name,
      departmentHeadId: department.headOfDepartment,
      isDepartmentHead,
      isSuperAdmin,
    });

    // Check if the rejector is authorized to reject at the current level
    if (
      leave.currentApprover === APPROVAL_LEVEL.DEPARTMENT_HEAD &&
      !isDepartmentHead &&
      !isSuperAdmin
    ) {
      throw new Error(
        "Only the department head or super admin can reject leave requests at this level"
      );
    }

    // For HR level, find HR manager by position
    if (leave.currentApprover === APPROVAL_LEVEL.HR_MANAGER) {
      // Find HR department
      const hrDepartment = await Department.findOne({
        name: { $in: ["Human Resources", "HR"] },
        status: "active",
      });

      if (hrDepartment) {
        // Find HR Manager in this department
        const hrManager = await User.findOne({
          department: hrDepartment._id,
          position: {
            $regex:
              "hr manager|head of hr|hr head|head of human resources|human resources manager|hr director",
            $options: "i",
          },
          status: "active",
        });

        if (
          !hrManager ||
          hrManager._id.toString() !== rejector._id.toString()
        ) {
          throw new Error(
            "Only HR manager can reject leave requests at this level"
          );
        }
      } else {
        throw new Error("HR department not found");
      }
    }

    // Add to approval history
    const rejectionEntry = {
      level: leave.approvalLevel,
      approver: rejector._id,
      status: LEAVE_STATUS.REJECTED,
      notes: reason,
      date: new Date(),
    };

    if (!leave.approvalHistory) {
      leave.approvalHistory = [];
    }
    leave.approvalHistory.push(rejectionEntry);

    // Update leave status
    leave.status = LEAVE_STATUS.REJECTED;
    leave.rejectedBy = rejector._id;
    leave.rejectionDate = new Date();
    leave.rejectionReason = reason;

    // Notify the leave requester
    console.log(`[LeaveService] Notifying leave requester about rejection`);
    await NotificationService.createNotification(
      leave.user._id,
      leave.currentApprover === APPROVAL_LEVEL.HR_MANAGER
        ? NOTIFICATION_TYPES.LEAVE_HR_REJECTED
        : NOTIFICATION_TYPES.LEAVE_REJECTED,
      leave.user,
      null,
      reason,
      { leave, rejector }
    ).catch((error) => {
      console.error(`[LeaveService] Error notifying leave requester:`, error);
    });

    await leave.save();
    console.log(
      `[LeaveService] Leave request rejected. New status: ${leave.status}`
    );

    return leave;
  }

  /**
   * Cancel a leave request
   * @param {Types.ObjectId} leaveId - Leave ID
   * @param {Types.ObjectId} userId - User ID
   * @returns {Promise<Object>} Updated leave request
   */
  static async cancelLeave(leaveId, userId) {
    console.log(`[LeaveService] Cancelling leave request: ${leaveId}`);
    console.log(`[LeaveService] User cancelling: ${userId}`);

    const leave = await Leave.findOne({ _id: leaveId, user: userId }).populate(
      "user"
    );
    if (!leave) {
      throw new Error("Leave request not found");
    }

    if (leave.status !== LEAVE_STATUS.PENDING) {
      throw new Error("Only pending leaves can be cancelled");
    }

    leave.status = LEAVE_STATUS.CANCELLED;
    await leave.save();
    console.log(
      `[LeaveService] Leave request cancelled. New status: ${leave.status}`
    );

    // Find department head and HR manager to notify
    const [departmentHead, hrManager] = await Promise.all([
      User.findOne({ department: leave.user.department, role: "ADMIN" }),
      User.findOne({ role: "SUPER_ADMIN" }),
    ]);

    console.log(`[LeaveService] Notification recipients found:`, {
      departmentHead: departmentHead
        ? `${departmentHead.firstName} ${departmentHead.lastName} (${departmentHead._id})`
        : "None",
      hrManager: hrManager
        ? `${hrManager.firstName} ${hrManager.lastName} (${hrManager._id})`
        : "None",
    });

    // Notify department head
    if (departmentHead) {
      console.log(
        `[LeaveService] Notifying department head: ${departmentHead.firstName} ${departmentHead.lastName}`
      );
      await NotificationService.createNotification(
        departmentHead._id,
        NOTIFICATION_TYPES.LEAVE_CANCELLED,
        leave.user,
        leave
      ).catch((error) => {
        console.error(`[LeaveService] Error notifying department head:`, error);
      });
    }

    // Notify HR manager
    if (hrManager) {
      console.log(
        `[LeaveService] Notifying HR manager: ${hrManager.firstName} ${hrManager.lastName}`
      );
      await NotificationService.createNotification(
        hrManager._id,
        NOTIFICATION_TYPES.LEAVE_CANCELLED,
        leave.user,
        leave
      ).catch((error) => {
        console.error(`[LeaveService] Error notifying HR manager:`, error);
      });
    }

    return leave;
  }

  /**
   * Delete a leave request (only for pending leaves)
   * @param {Types.ObjectId} leaveId - Leave ID
   * @param {Types.ObjectId} userId - User ID
   * @returns {Promise<Object>} Deleted leave request
   */
  static async deleteLeave(leaveId, userId) {
    const leave = await Leave.findOne({ _id: leaveId, user: userId });
    if (!leave) {
      throw new Error("Leave request not found");
    }

    if (leave.status !== LEAVE_STATUS.PENDING) {
      throw new Error("Only pending leaves can be deleted");
    }

    await leave.deleteOne();
    return leave;
  }

  /**
   * Get leave statistics for a user
   * @param {Types.ObjectId} userId - User ID
   * @returns {Promise<Object>} Leave statistics
   */
  static async getLeaveStatistics(userId) {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31);

    const stats = await Leave.aggregate([
      {
        $match: {
          user: new Types.ObjectId(userId),
          startDate: { $gte: startOfYear, $lte: endOfYear },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalDays: {
            $sum: {
              $divide: [
                { $subtract: ["$endDate", "$startDate"] },
                1000 * 60 * 60 * 24,
              ],
            },
          },
        },
      },
    ]);

    return stats.reduce((acc, curr) => {
      acc[curr._id] = {
        count: curr.count,
        totalDays: Math.round(curr.totalDays),
      };
      return acc;
    }, {});
  }
}
