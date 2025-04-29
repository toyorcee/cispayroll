import Leave from "../models/Leave.js";
import { LEAVE_STATUS } from "../models/Leave.js";
import { Types } from "mongoose";
import User from "../models/User.js";
import {
  NotificationService,
  NOTIFICATION_TYPES,
} from "./NotificationService.js";
import Department from "../models/Department.js";
import AuditService from "./AuditService.js";
import { AuditAction, AuditEntity } from "../models/Audit.js";
import { format } from "date-fns";

export class LeaveService {
  /**
   * Create a new leave request
   * @param {Types.ObjectId} userId - User ID
   * @param {Object} leaveData - Leave request data
   * @returns {Promise<Object>} Created leave request
   */
  static async createLeave(userId, leaveData) {
    try {
      console.log(`[LeaveService] ====== LEAVE REQUEST PROCESS STARTED ======`);
      console.log(`[LeaveService] Creating leave request for user ${userId}`);
      console.log(
        `[LeaveService] Leave data:`,
        JSON.stringify(leaveData, null, 2)
      );

      // Get the user to access their department
      const user = await User.findById(userId);
      if (!user) {
        console.error(`[LeaveService] User not found with ID: ${userId}`);
        throw new Error("User not found");
      }

      console.log(`[LeaveService] ====== USER INFORMATION ======`);
      console.log(
        `[LeaveService] Found user: ${user.firstName} ${user.lastName} (${user._id})`
      );
      console.log(`[LeaveService] User email: ${user.email}`);
      console.log(`[LeaveService] User role: ${user.role}`);
      console.log(`[LeaveService] User department: ${user.department}`);
      console.log(`[LeaveService] User position: ${user.position}`);

      // Create the leave request with the user's department
      console.log(`[LeaveService] ====== CREATING LEAVE RECORD ======`);
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
        reason: leave.reason,
      });

      // Notify the user who created the leave request
      console.log(`[LeaveService] ====== NOTIFYING LEAVE REQUESTER ======`);
      console.log(`[LeaveService] Notifying leave requester: ${user._id}`);
      try {
        const notification = await NotificationService.createNotification(
          user._id,
          NOTIFICATION_TYPES.LEAVE_REQUESTED_INFO,
          user,
          null,
          null,
          {
            leave: {
              type: leave.type,
              startDate: leave.startDate,
              endDate: leave.endDate,
              reason: leave.reason,
              status: leave.status,
            },
          }
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
      console.log(`[LeaveService] ====== FINDING SUPER ADMINS ======`);
      const superAdmins = await User.find({
        role: "SUPER_ADMIN",
        status: "active",
      });

      console.log(
        `[LeaveService] Found ${superAdmins.length} super admins to notify`
      );

      for (const superAdmin of superAdmins) {
        console.log(
          `[LeaveService] Notifying super admin: ${superAdmin._id} (${superAdmin.firstName} ${superAdmin.lastName})`
        );
        try {
          const notification = await NotificationService.createNotification(
            superAdmin._id,
            NOTIFICATION_TYPES.LEAVE_REQUESTED,
            user,
            null,
            null,
            {
              leave: {
                type: leave.type,
                startDate: leave.startDate,
                endDate: leave.endDate,
                reason: leave.reason,
                status: leave.status,
              },
            }
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
      console.log(`[LeaveService] ====== FINDING DEPARTMENT HEAD ======`);
      console.log(
        `[LeaveService] Finding department head for department: ${user.department}`
      );

      // Find department head using the Department model's headOfDepartment field
      const department = await Department.findById(user.department);
      let departmentHead = null;

      console.log(
        `[LeaveService] Department found: ${
          department ? department.name : "Not found"
        }`
      );

      if (department && department.headOfDepartment) {
        console.log(
          `[LeaveService] Department has headOfDepartment field set: ${department.headOfDepartment}`
        );
        // Use the headOfDepartment field from the Department model
        departmentHead = await User.findById(department.headOfDepartment);

        // Verify the user is still active
        if (!departmentHead || departmentHead.status !== "active") {
          console.log(
            `[LeaveService] Department head from headOfDepartment field is not active or not found`
          );
          departmentHead = null;
        } else {
          console.log(
            `[LeaveService] Found department head from headOfDepartment field: ${departmentHead.firstName} ${departmentHead.lastName} (${departmentHead._id})`
          );
        }
      } else {
        console.log(
          `[LeaveService] Department does not have headOfDepartment field set`
        );
      }

      // If no department head found using the field, fall back to position title search
      if (!departmentHead) {
        console.log(
          `[LeaveService] Falling back to position title search for department head`
        );
        departmentHead = await User.findOne({
          department: user.department,
          position: {
            $regex: "head of department|department head|head|director|manager",
            $options: "i",
          },
          status: "active",
        });

        if (departmentHead) {
          console.log(
            `[LeaveService] Found department head from position title search: ${departmentHead.firstName} ${departmentHead.lastName} (${departmentHead._id})`
          );
          console.log(
            `[LeaveService] Department head position: ${departmentHead.position}`
          );
        } else {
          console.log(
            `[LeaveService] No department head found from position title search`
          );
        }
      }

      if (departmentHead) {
        console.log(
          `[LeaveService] Final department head: ${departmentHead.firstName} ${departmentHead.lastName} (${departmentHead._id})`
        );
      } else {
        console.log(
          `[LeaveService] No department head found for department: ${user.department}`
        );
      }

      console.log(`[LeaveService] ====== FINDING HR MANAGER ======`);
      // Find HR department
      const hrDepartment = await Department.findOne({
        name: { $in: ["Human Resources", "HR"] },
        status: "active",
      });

      console.log(
        `[LeaveService] HR Department found: ${
          hrDepartment ? hrDepartment.name : "Not found"
        }`
      );

      let hrManager = null;

      if (hrDepartment && hrDepartment.headOfDepartment) {
        console.log(
          `[LeaveService] HR Department has headOfDepartment field set: ${hrDepartment.headOfDepartment}`
        );
        // Use the headOfDepartment field from the Department model
        hrManager = await User.findById(hrDepartment.headOfDepartment);

        // Verify the user is still active
        if (!hrManager || hrManager.status !== "active") {
          console.log(
            `[LeaveService] HR manager from headOfDepartment field is not active or not found`
          );
          hrManager = null;
        } else {
          console.log(
            `[LeaveService] Found HR manager from headOfDepartment field: ${hrManager.firstName} ${hrManager.lastName} (${hrManager._id})`
          );
        }
      } else {
        console.log(
          `[LeaveService] HR Department does not have headOfDepartment field set`
        );
      }

      // If no HR manager found using the field, fall back to position title search
      if (!hrManager && hrDepartment) {
        console.log(
          `[LeaveService] Falling back to position title search for HR manager`
        );
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
            `[LeaveService] Found HR manager from position title search: ${hrManager.firstName} ${hrManager.lastName} (${hrManager._id})`
          );
          console.log(
            `[LeaveService] HR manager position: ${hrManager.position}`
          );
        } else {
          console.log(
            `[LeaveService] No HR manager found from position title search`
          );
        }
      }

      // If still no HR manager found, consider any user in the HR department with an appropriate role
      if (!hrManager && hrDepartment) {
        console.log(
          `[LeaveService] Falling back to role search for HR manager`
        );
        hrManager = await User.findOne({
          department: hrDepartment._id,
          role: { $in: ["ADMIN", "HR_MANAGER"] },
          status: "active",
        });

        if (hrManager) {
          console.log(
            `[LeaveService] Found HR manager from role search: ${hrManager.firstName} ${hrManager.lastName} (${hrManager._id})`
          );
          console.log(`[LeaveService] HR manager role: ${hrManager.role}`);
        } else {
          console.log(`[LeaveService] No HR manager found from role search`);
        }
      }

      if (hrManager) {
        console.log(
          `[LeaveService] Final HR manager: ${hrManager.firstName} ${hrManager.lastName} (${hrManager._id})`
        );
      } else {
        console.log(`[LeaveService] No HR manager found`);
      }

      // Notify department head
      if (departmentHead) {
        console.log(`[LeaveService] ====== NOTIFYING DEPARTMENT HEAD ======`);
        console.log(
          `[LeaveService] Notifying department head: ${departmentHead._id}`
        );
        try {
          const notification = await NotificationService.createNotification(
            departmentHead._id,
            NOTIFICATION_TYPES.LEAVE_REQUESTED,
            user,
            null,
            null,
            {
              leave: {
                type: leave.type,
                startDate: leave.startDate,
                endDate: leave.endDate,
                reason: leave.reason,
                status: leave.status,
              },
            }
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
        console.log(`[LeaveService] ====== NOTIFYING HR MANAGER ======`);
        console.log(`[LeaveService] Notifying HR manager: ${hrManager._id}`);
        try {
          const notification = await NotificationService.createNotification(
            hrManager._id,
            NOTIFICATION_TYPES.LEAVE_REQUESTED,
            user,
            null,
            null,
            {
              leave: {
                type: leave.type,
                startDate: leave.startDate,
                endDate: leave.endDate,
                reason: leave.reason,
                status: leave.status,
              },
            }
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
      console.log(`[LeaveService] ====== CREATING AUDIT LOG ======`);
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
          }
        );
        console.log(`[LeaveService] Audit log created for leave request`);
      } catch (auditError) {
        console.error(`[LeaveService] Error creating audit log:`, auditError);
      }

      console.log(
        `[LeaveService] ====== LEAVE REQUEST PROCESS COMPLETED SUCCESSFULLY ======`
      );
      return leave;
    } catch (error) {
      console.error(
        `[LeaveService] ====== ERROR IN LEAVE REQUEST PROCESS ======`
      );
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

    // Check if user is SUPER_ADMIN or HR_MANAGER
    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const isHRManager =
      user.role === "HR_MANAGER" ||
      (user.position &&
        user.position.toLowerCase().includes("head of human resources"));

    console.log(`[LeaveService] Role checks:`, {
      isSuperAdmin,
      isHRManager,
      userRole: user.role,
      userPosition: user.position,
    });

    // If user is SUPER_ADMIN or HR_MANAGER, they can see all leaves
    if (isSuperAdmin || isHRManager) {
      console.log(
        `[LeaveService] User is ${
          isSuperAdmin ? "SUPER_ADMIN" : "HR_MANAGER"
        }, returning all leaves`
      );
      return Leave.find(query)
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

      // If not found by headOfDepartment field, check by position title
      if (!isDepartmentHead) {
        const departmentHeadByPosition = await User.findOne({
          department: user.department,
          position: {
            $regex: "head of department|department head|head|director|manager",
            $options: "i",
          },
          status: "active",
        });

        if (
          departmentHeadByPosition &&
          departmentHeadByPosition._id.toString() === user._id.toString()
        ) {
          isDepartmentHead = true;
        }
      }

      console.log(
        `[LeaveService] User is ADMIN, isDepartmentHead: ${isDepartmentHead}`
      );

      if (!isDepartmentHead) {
        console.log(
          `[LeaveService] User is not department head, returning empty list`
        );
        return [];
      }

      // Add department filter to query
      query.department = user.department;
      console.log(`[LeaveService] Added department filter: ${user.department}`);

      return Leave.find(query)
        .sort({ createdAt: -1 })
        .populate("user", "firstName lastName email department")
        .populate("approvedBy", "firstName lastName");
    }

    // For other roles, return empty list
    console.log(
      `[LeaveService] User role ${user.role} not authorized to view team leaves`
    );
    return [];
  }

  /**
   * Approve a leave request
   * @param {Types.ObjectId} leaveId - Leave ID
   * @param {Types.ObjectId} approverId - Approver user ID
   * @returns {Promise<Object>} Updated leave request
   */
  static async approveLeave(leaveId, approverId) {
    console.log(
      `[LeaveService] Approving leave ${leaveId} by approver ${approverId}`
    );

    // Get leave request with user details
    const leave = await Leave.findById(leaveId).populate("user");
    if (!leave) {
      console.log(`[LeaveService] Leave request not found: ${leaveId}`);
      throw new Error("Leave request not found");
    }

    // Get approver details
    const approver = await User.findById(approverId);
    if (!approver) {
      console.log(`[LeaveService] Approver not found: ${approverId}`);
      throw new Error("Approver not found");
    }

    console.log(`[LeaveService] Approver details:`, {
      id: approver._id,
      name: `${approver.firstName} ${approver.lastName}`,
      role: approver.role,
      position: approver.position,
      department: approver.department,
    });

    // Check if leave is already approved
    if (leave.status === LEAVE_STATUS.APPROVED) {
      console.log(`[LeaveService] Leave is already approved`);
      throw new Error("Leave request is already approved");
    }

    // Check if leave is in pending status
    if (leave.status.toUpperCase() !== "PENDING") {
      console.log(
        `[LeaveService] Leave is not in pending status: ${leave.status}`
      );
      throw new Error("Leave request is not in pending status");
    }

    // Check if approver has permission to approve
    const isSuperAdmin = approver.role === "SUPER_ADMIN";
    const isHRManager =
      approver.role === "HR_MANAGER" ||
      (approver.position &&
        approver.position.toLowerCase().includes("head of human resources"));

    console.log(`[LeaveService] Role checks:`, {
      isSuperAdmin,
      isHRManager,
      approverRole: approver.role,
      approverPosition: approver.position,
    });

    // If not SUPER_ADMIN or HR_MANAGER, check if department head
    if (!isSuperAdmin && !isHRManager) {
      if (approver.role !== "ADMIN") {
        console.log(
          `[LeaveService] Approver is not SUPER_ADMIN, HR_MANAGER, or ADMIN`
        );
        throw new Error(
          "You do not have permission to approve this leave request"
        );
      }

      // Check if approver is the head of the leave requester's department
      const department = await Department.findById(leave.user.department);
      if (!department) {
        console.log(`[LeaveService] Department not found for leave requester`);
        throw new Error("Department not found for leave requester");
      }

      const isDepartmentHead =
        department.headOfDepartment &&
        department.headOfDepartment.toString() === approver._id.toString();

      // If not found by headOfDepartment field, check by position title
      if (!isDepartmentHead) {
        const departmentHeadByPosition = await User.findOne({
          department: leave.user.department,
          position: {
            $regex: "head of department|department head|head|director|manager",
            $options: "i",
          },
          status: "active",
        });

        if (
          departmentHeadByPosition &&
          departmentHeadByPosition._id.toString() === approver._id.toString()
        ) {
          isDepartmentHead = true;
        }
      }

      console.log(
        `[LeaveService] Approver is ADMIN, isDepartmentHead: ${isDepartmentHead}`
      );

      if (!isDepartmentHead) {
        console.log(
          `[LeaveService] Approver is not the department head for leave requester's department`
        );
        throw new Error(
          "You do not have permission to approve this leave request"
        );
      }
    }

    // Update leave status
    leave.status = LEAVE_STATUS.APPROVED;
    leave.approvedBy = approverId;
    leave.approvedAt = new Date();
    await leave.save();

    console.log(`[LeaveService] Leave approved successfully`);

    // Notify employee about approval
    try {
      await NotificationService.createNotification(
        leave.user._id,
        "LEAVE_APPROVED",
        leave.user,
        null,
        null,
        {
        leave: {
          id: leave._id,
          type: leave.type,
          startDate: leave.startDate,
          endDate: leave.endDate,
          status: leave.status,
        },
        }
      );
      console.log(
        `[LeaveService] Notification sent to employee about approval`
      );
    } catch (notificationError) {
      console.error(
        `[LeaveService] Error notifying employee about approval:`,
        notificationError
      );
      // Don't throw the error, just log it
    }

    // Notify department head (if not the approver)
    if (department) {
      console.log(
        `[LeaveService] Finding department head to notify about approval`
      );

      let departmentHead = null;

      // Check if department has a head assigned
      if (department.headOfDepartment) {
        departmentHead = await User.findById(department.headOfDepartment);

        // Verify the user is still active
        if (!departmentHead || departmentHead.status !== "active") {
          departmentHead = null;
        }
      }

      // If no department head found using the field, fall back to position title search
      if (!departmentHead) {
        departmentHead = await User.findOne({
          department: leave.department,
          position: {
            $regex: "head of department|department head|head|director|manager",
            $options: "i",
          },
          status: "active",
        });
      }

      // Only notify if department head exists and is not the approver
      if (
        departmentHead &&
        departmentHead._id.toString() !== approver._id.toString()
      ) {
        console.log(
          `[LeaveService] Notifying department head about approval:`,
          {
            id: departmentHead._id,
            name: `${departmentHead.firstName} ${departmentHead.lastName}`,
          }
        );

        try {
          await NotificationService.createNotification(
            departmentHead._id,
            "LEAVE_APPROVED_INFO",
            leave.user,
            null,
            null,
            {
              leave: {
                id: leave._id,
                type: leave.type,
                startDate: leave.startDate,
                endDate: leave.endDate,
                status: leave.status,
              },
              approver: {
                firstName: approver.firstName,
                lastName: approver.lastName,
                role: approver.role,
              },
            }
          );
          console.log(`[LeaveService] Notification sent to department head`);
        } catch (notificationError) {
          console.error(
            `[LeaveService] Error notifying department head:`,
            notificationError
          );
          // Don't throw the error, just log it
        }
      }
    }

    // Notify HR manager (if approver is not HR)
    if (!isHRManager) {
      console.log(`[LeaveService] Finding HR manager to notify about approval`);

      // Find HR department
      const hrDepartment = await Department.findOne({
        name: { $in: ["Human Resources", "HR"] },
        status: "active",
      });

      if (hrDepartment) {
        // Find HR manager
        let hrManager = null;

        // Check if HR department has a head assigned
        if (hrDepartment.headOfDepartment) {
          hrManager = await User.findById(hrDepartment.headOfDepartment);

          // Verify the user is still active
          if (!hrManager || hrManager.status !== "active") {
            hrManager = null;
          }
        }

        // If no HR manager found using the field, fall back to position title search
        if (!hrManager) {
          hrManager = await User.findOne({
            department: hrDepartment._id,
            position: {
              $regex:
                "hr manager|head of hr|hr head|head of human resources|human resources manager|hr director",
              $options: "i",
            },
            status: "active",
          });
        }

        // If still no HR manager found, consider any user in the HR department with an appropriate role
        if (!hrManager) {
          hrManager = await User.findOne({
            department: hrDepartment._id,
            role: { $in: ["ADMIN", "HR_MANAGER"] },
            status: "active",
          });
        }

        if (hrManager) {
          console.log(`[LeaveService] Notifying HR manager about approval:`, {
            id: hrManager._id,
            name: `${hrManager.firstName} ${hrManager.lastName}`,
          });

          try {
            await NotificationService.createNotification(
              hrManager._id,
              "LEAVE_APPROVED_INFO",
              leave.user,
              null,
              null,
              {
                leave: {
                  id: leave._id,
                  type: leave.type,
                  startDate: leave.startDate,
                  endDate: leave.endDate,
                  status: leave.status,
                },
                approver: {
                  firstName: approver.firstName,
                  lastName: approver.lastName,
                  role: approver.role,
                },
              }
            );
            console.log(`[LeaveService] Notification sent to HR manager`);
          } catch (notificationError) {
            console.error(
              `[LeaveService] Error notifying HR manager:`,
              notificationError
            );
            // Don't throw the error, just log it
          }
        }
      }
    }

    // If approver is HR, notify other HR managers
    if (isHRManager) {
      console.log(
        `[LeaveService] Finding other HR managers to notify about approval`
      );

      // Find HR department
      const hrDepartment = await Department.findOne({
        name: { $in: ["Human Resources", "HR"] },
        status: "active",
      });

      if (hrDepartment) {
        // Find all HR managers in the department
        const hrManagers = await User.find({
          department: hrDepartment._id,
          _id: { $ne: approver._id }, // Exclude the approver
          $or: [
            { role: "HR_MANAGER" },
            {
              position: {
                $regex:
                  "hr manager|head of hr|hr head|head of human resources|human resources manager|hr director",
                $options: "i",
              },
            },
          ],
          status: "active",
        });

        console.log(
          `[LeaveService] Found ${hrManagers.length} other HR managers to notify`
        );

        for (const hrManager of hrManagers) {
          console.log(`[LeaveService] Notifying HR manager about approval:`, {
            id: hrManager._id,
            name: `${hrManager.firstName} ${hrManager.lastName}`,
          });

          try {
            await NotificationService.createNotification(
              hrManager._id,
              "LEAVE_APPROVED_INFO",
              leave.user,
              null,
              null,
              {
                leave: {
                  id: leave._id,
                  type: leave.type,
                  startDate: leave.startDate,
                  endDate: leave.endDate,
                  status: leave.status,
                },
                approver: {
                  firstName: approver.firstName,
                  lastName: approver.lastName,
                  role: approver.role,
                },
              }
            );
            console.log(`[LeaveService] Notification sent to HR manager`);
          } catch (notificationError) {
            console.error(
              `[LeaveService] Error notifying HR manager:`,
              notificationError
            );
            // Don't throw the error, just log it
          }
        }
      }
    }

    console.log(
      `[LeaveService] ====== LEAVE APPROVAL PROCESS COMPLETED ======`
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
    const isSuperAdmin = rejector.role === "SUPER_ADMIN";
    const isHRManager = rejector.role === "HR_MANAGER";

    let isDepartmentHead = false;

    if (department && department.headOfDepartment) {
      isDepartmentHead =
        department.headOfDepartment.toString() === rejector._id.toString();
    }

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
      isHRManager,
    });

    // Super Admin and HR Manager can reject any leave
    // Department Head can only reject leaves from their department
    if (!isSuperAdmin && !isHRManager && !isDepartmentHead) {
      throw new Error(
        "You do not have permission to reject this leave request"
      );
    }

    // For department heads, they can only reject leaves from their department
    if (
      isDepartmentHead &&
      leave.department.toString() !== rejector.department.toString()
    ) {
      throw new Error("You can only reject leaves from your department");
    }

    // Add to approval history
    const rejectionEntry = {
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
    try {
    await NotificationService.createNotification(
      leave.user._id,
      "LEAVE_REJECTED",
      leave.user,
      null,
      reason,
      {
        leave: {
          type: leave.type,
          startDate: leave.startDate,
          endDate: leave.endDate,
          reason: leave.reason,
          status: leave.status,
        },
        rejector: {
          firstName: rejector.firstName,
          lastName: rejector.lastName,
          role: rejector.role,
        },
      }
      );
      console.log(`[LeaveService] Notification sent to leave requester`);
    } catch (notificationError) {
      console.error(
        `[LeaveService] Error notifying leave requester:`,
        notificationError
      );
      // Don't throw the error, just log it
    }

    await leave.save();
    console.log(`[LeaveService] Leave rejected successfully`);

    // Notify the employee about the rejection
    const employee = await User.findById(leave.user);
    if (employee) {
      console.log(`[LeaveService] Notifying employee about rejection:`, {
        id: employee._id,
        name: `${employee.firstName} ${employee.lastName}`,
      });

      try {
      await NotificationService.createNotification(
        employee._id,
        "LEAVE_REJECTED",
        employee,
        null,
        reason,
        {
          leave: {
            type: leave.type,
            startDate: leave.startDate,
            endDate: leave.endDate,
            reason: leave.reason,
            status: leave.status,
          },
          rejector: {
            firstName: rejector.firstName,
            lastName: rejector.lastName,
            role: rejector.role,
          },
        }
      );
      console.log(`[LeaveService] Notification sent to employee`);
      } catch (notificationError) {
        console.error(
          `[LeaveService] Error notifying employee:`,
          notificationError
        );
        // Don't throw the error, just log it
      }
    }

    // Notify department head (if not the rejector)
    if (department) {
      console.log(
        `[LeaveService] Finding department head to notify about rejection`
      );

      let departmentHead = null;

      // Check if department has a head assigned
      if (department.headOfDepartment) {
        departmentHead = await User.findById(department.headOfDepartment);

        // Verify the user is still active
        if (!departmentHead || departmentHead.status !== "active") {
          departmentHead = null;
        }
      }

      // If no department head found using the field, fall back to position title search
      if (!departmentHead) {
        departmentHead = await User.findOne({
          department: leave.department,
          position: {
            $regex: "head of department|department head|head|director|manager",
            $options: "i",
          },
          status: "active",
        });
      }

      // Only notify if department head exists and is not the rejector
      if (
        departmentHead &&
        departmentHead._id.toString() !== rejector._id.toString()
      ) {
        console.log(
          `[LeaveService] Notifying department head about rejection:`,
          {
            id: departmentHead._id,
            name: `${departmentHead.firstName} ${departmentHead.lastName}`,
          }
        );

        try {
        await NotificationService.createNotification(
          departmentHead._id,
          "LEAVE_REJECTED_INFO",
          employee,
          null,
          reason,
          {
            leave: {
              type: leave.type,
              startDate: leave.startDate,
              endDate: leave.endDate,
              reason: leave.reason,
              status: leave.status,
            },
            rejector: {
              firstName: rejector.firstName,
              lastName: rejector.lastName,
              role: rejector.role,
            },
          }
        );
        console.log(`[LeaveService] Notification sent to department head`);
        } catch (notificationError) {
          console.error(
            `[LeaveService] Error notifying department head:`,
            notificationError
          );
          // Don't throw the error, just log it
        }
      }
    }

    // Notify other HR managers (if rejector is HR)
    if (isHRManager) {
      console.log(
        `[LeaveService] Finding other HR managers to notify about rejection`
      );

      // Find HR department
      const hrDepartment = await Department.findOne({
        name: { $in: ["Human Resources", "HR"] },
        status: "active",
      });

      if (hrDepartment) {
        // Find all HR managers in the department
        const hrManagers = await User.find({
          department: hrDepartment._id,
          _id: { $ne: rejector._id }, // Exclude the rejector
          $or: [
            { role: "HR_MANAGER" },
            {
              position: {
                $regex:
                  "hr manager|head of hr|hr head|head of human resources|human resources manager|hr director",
                $options: "i",
              },
            },
          ],
          status: "active",
        });

        console.log(
          `[LeaveService] Found ${hrManagers.length} other HR managers to notify`
        );

        for (const hrManager of hrManagers) {
          console.log(`[LeaveService] Notifying HR manager about rejection:`, {
            id: hrManager._id,
            name: `${hrManager.firstName} ${hrManager.lastName}`,
          });

          try {
          await NotificationService.createNotification(
            hrManager._id,
            "LEAVE_REJECTED_INFO",
            employee,
            null,
            reason,
            {
              leave: {
                type: leave.type,
                startDate: leave.startDate,
                endDate: leave.endDate,
                reason: leave.reason,
                status: leave.status,
              },
              rejector: {
                firstName: rejector.firstName,
                lastName: rejector.lastName,
                role: rejector.role,
              },
            }
          );
          console.log(`[LeaveService] Notification sent to HR manager`);
          } catch (notificationError) {
            console.error(
              `[LeaveService] Error notifying HR manager:`,
              notificationError
            );
            // Don't throw the error, just log it
          }
        }
      }
    }

    console.log(
      `[LeaveService] ====== LEAVE REJECTION PROCESS COMPLETED ======`
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
        null,
        null,
        {
          leave: {
            type: leave.type,
            startDate: leave.startDate,
            endDate: leave.endDate,
            reason: leave.reason,
            status: leave.status,
          },
        }
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
        null,
        null,
        {
          leave: {
            type: leave.type,
            startDate: leave.startDate,
            endDate: leave.endDate,
            reason: leave.reason,
            status: leave.status,
          },
        }
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
