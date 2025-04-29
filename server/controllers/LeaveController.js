import { LeaveService } from "../services/leaveService.js";
import User from "../models/User.js";
import { Types } from "mongoose";
import { LEAVE_STATUS } from "../models/Leave.js";
import Leave from "../models/Leave.js";
import Department from "../models/Department.js";
import AuditService from "../services/AuditService.js";
import { AuditAction, AuditEntity } from "../models/Audit.js";

export class LeaveController {
  /**
   * Request a new leave
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async requestLeave(req, res, next) {
    try {
      const userId = req.user.id;
      console.log(`[LeaveController] ====== LEAVE REQUEST INITIATED ======`);
      console.log(`[LeaveController] User ${userId} is requesting a leave`);
      console.log(
        `[LeaveController] Request body:`,
        JSON.stringify(req.body, null, 2)
      );

      const user = await User.findById(userId);

      // Log the user requesting the leave
      console.log(`[LeaveController] ====== USER DETAILS ======`);
      console.log("[LeaveController] Leave Request - User Details:", {
        userId: userId,
        userEmail: user?.email,
        userName: user ? `${user.firstName} ${user.lastName}` : "Unknown",
        userRole: user?.role,
        userDepartment: user?.department,
        userPosition: user?.position,
      });

      // Log the leave request data
      console.log(`[LeaveController] ====== LEAVE REQUEST DATA ======`);
      console.log("[LeaveController] Leave Request - Request Data:", {
        type: req.body.type,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        reason: req.body.reason,
        attachments: req.body.attachments ? "Present" : "None",
      });

      if (!user) {
        console.log(`[LeaveController] User ${userId} not found`);
        return res.status(404).json({ message: "User not found" });
      }

      console.log(`[LeaveController] ====== CALLING LEAVE SERVICE ======`);
      console.log(
        `[LeaveController] Calling LeaveService.createLeave for user ${user._id}`
      );
      const leave = await LeaveService.createLeave(user, req.body).catch(
        (error) => {
          console.error(
            "[LeaveController] Error creating leave request:",
            error
          );
          throw error;
        }
      );

      // Log the created leave
      console.log(`[LeaveController] ====== LEAVE REQUEST CREATED ======`);
      console.log("[LeaveController] Leave Request - Created Leave:", {
        leaveId: leave._id,
        status: leave.status,
        createdAt: leave.createdAt,
        type: leave.type,
        startDate: leave.startDate,
        endDate: leave.endDate,
        department: leave.department,
      });

      console.log(
        `[LeaveController] ====== LEAVE REQUEST PROCESS COMPLETED ======`
      );
      res.status(201).json({ message: "Leave request created", leave });
    } catch (error) {
      console.error("[LeaveController] ====== ERROR IN LEAVE REQUEST ======");
      console.error("[LeaveController] Leave Request - Error:", error);
      const message = error instanceof Error ? error.message : "Server error";
      res.status(400).json({ message });
    }
  }

  /**
   * Get user's own leaves
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getMyLeaves(req, res, next) {
    try {
      const userId = req.user.id;
      console.log(`[LeaveController] User ${userId} is fetching their leaves`);

      const user = await User.findById(userId);

      if (!user) {
        console.log(`[LeaveController] User ${userId} not found`);
        return res.status(404).json({ message: "User not found" });
      }

      // Only return leaves where the user field matches the current user's ID
      const leaves = await Leave.find({ user: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .populate("user", "firstName lastName email department");

      console.log(
        `[LeaveController] Found ${leaves.length} leaves for user ${userId}`
      );
      res.json({ leaves });
    } catch (error) {
      console.error("[LeaveController] Error fetching leaves:", error);
      res.status(500).json({ message: "Error fetching leaves" });
    }
  }

  /**
   * Get team leaves (for admins and super admins)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getTeamLeaves(req, res, next) {
    try {
      const userId = req.user.id;
      console.log(`[LeaveController] User ${userId} is fetching team leaves`);

      const user = await User.findById(userId);
      if (!user) {
        console.log(`[LeaveController] User ${userId} not found`);
        return res.status(404).json({ message: "User not found" });
      }

      console.log(
        `[LeaveController] User role: ${user.role}, Department: ${user.department}`
      );

      let query = {};

      // Add status filter if provided
      if (req.query.status) {
        query.status = req.query.status;
      }

      // Add date range filter if provided
      if (req.query.startDate && req.query.endDate) {
        query.$or = [
          {
            startDate: { $gte: new Date(req.query.startDate) },
            endDate: { $lte: new Date(req.query.endDate) },
          },
          {
            startDate: { $lte: new Date(req.query.endDate) },
            endDate: { $gte: new Date(req.query.startDate) },
          },
        ];
      }

      console.log(`[LeaveController] Query for team leaves:`, query);

      // Use the LeaveService to get team leaves with proper role-based access
      const leaves = await LeaveService.getTeamLeaves(query, user);

      console.log(`[LeaveController] Found ${leaves.length} team leaves`);

      res.json({
        leaves,
        userRole: user.role,
        department: user.department,
      });
    } catch (error) {
      console.error("[LeaveController] Error fetching team leaves:", error);
      next(error);
    }
  }

  /**
   * Approve a leave request (for admins and super admins)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async approveLeave(req, res, next) {
    try {
      const { leaveId } = req.params;
      const { notes } = req.body;
      const approver = req.user;

      console.log(
        `[LeaveController] User ${approver._id} is approving leave ${leaveId}`
      );

      const leave = await Leave.findById(leaveId);
      if (!leave) {
        return res.status(404).json({
          success: false,
          message: "Leave request not found",
        });
      }

      // Check if leave is already approved or rejected
      if (leave.status !== LEAVE_STATUS.PENDING) {
        return res.status(400).json({
          success: false,
          message: `Leave request is already ${leave.status.toLowerCase()}`,
        });
      }

      // Use the LeaveService to handle the approval logic
      try {
        const updatedLeave = await LeaveService.approveLeave(
          new Types.ObjectId(leaveId),
          approver._id,
          notes
        );

        console.log(
          `[LeaveController] Leave ${leaveId} approved by ${approver._id}`
        );

        res.json({
          success: true,
          message: "Leave request approved successfully",
          data: updatedLeave,
        });
      } catch (serviceError) {
        console.error(
          `[LeaveController] Error in LeaveService.approveLeave:`,
          serviceError
        );
        return res.status(400).json({
          success: false,
          message: serviceError.message || "Failed to approve leave request",
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject a leave request (for admins and super admins)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async rejectLeave(req, res, next) {
    try {
      const { leaveId } = req.params;
      const { comment } = req.body;
      const rejectorId = req.user.id;

      console.log(
        `[LeaveController] User ${rejectorId} is rejecting leave ${leaveId}`
      );

      const rejector = await User.findById(rejectorId);
      if (!rejector) {
        console.log(`[LeaveController] Rejector ${rejectorId} not found`);
        return res.status(404).json({ message: "Rejector not found" });
      }

      const leave = await Leave.findById(leaveId).populate("user");
      if (!leave) {
        console.log(`[LeaveController] Leave ${leaveId} not found`);
        return res.status(404).json({ message: "Leave request not found" });
      }

      // Check if leave is already approved or rejected
      if (leave.status !== LEAVE_STATUS.PENDING) {
        console.log(
          `[LeaveController] Leave ${leaveId} is already ${leave.status}`
        );
        return res.status(400).json({
          message: `Leave request is already ${leave.status.toLowerCase()}`,
        });
      }

      // Use the LeaveService to handle the rejection logic
      try {
        const updatedLeave = await LeaveService.rejectLeave(
          leaveId,
          rejector,
          comment
        );

        console.log(
          `[LeaveController] Leave ${leaveId} rejected by ${rejectorId}`
        );

        res.json({
          message: "Leave request rejected successfully",
          leave: updatedLeave,
        });
      } catch (serviceError) {
        console.error(
          `[LeaveController] Error in LeaveService.rejectLeave:`,
          serviceError
        );
        return res.status(400).json({
          message: serviceError.message || "Failed to reject leave request",
        });
      }
    } catch (error) {
      console.error("[LeaveController] Error rejecting leave:", error);
      next(error);
    }
  }

  /**
   * Cancel own leave request (if pending)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async cancelLeave(req, res, next) {
    try {
      const { leaveId } = req.params;
      const userId = req.user.id;

      console.log(
        `[LeaveController] User ${userId} is cancelling leave ${leaveId}`
      );

      console.log("[LeaveController] Leave Cancellation - Details:", {
        leaveId,
        userId,
      });

      console.log(
        `[LeaveController] Calling LeaveService.cancelLeave for leave ${leaveId}`
      );
      const leave = await LeaveService.cancelLeave(
        new Types.ObjectId(leaveId),
        new Types.ObjectId(userId)
      ).catch((error) => {
        console.error(
          "[LeaveController] Error cancelling leave request:",
          error
        );
        throw error;
      });

      console.log("[LeaveController] Leave Cancellation - Success:", {
        leaveId: leave._id,
        status: leave.status,
      });

      res.json({ message: "Leave cancelled", leave });
    } catch (error) {
      console.error("[LeaveController] Leave Cancellation - Error:", error);
      const message = error instanceof Error ? error.message : "Server error";
      res.status(400).json({ message });
    }
  }

  /**
   * Update leave status (approve/reject)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async updateLeaveStatus(req, res, next) {
    try {
      const { leaveId } = req.params;
      const { status, notes } = req.body;
      const userId = req.user.id;

      const approver = await User.findById(userId);
      if (!approver) {
        return res.status(404).json({ message: "Approver not found" });
      }

      let leave;
      if (status === LEAVE_STATUS.APPROVED) {
        leave = await LeaveService.approveLeave(
          new Types.ObjectId(leaveId),
          approver._id,
          notes
        );
      } else if (status === LEAVE_STATUS.REJECTED) {
        leave = await LeaveService.rejectLeave(
          new Types.ObjectId(leaveId),
          approver,
          notes
        );
      } else {
        return res.status(400).json({ message: "Invalid status" });
      }

      res.json({ message: `Leave ${status.toLowerCase()}`, leave });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";
      res.status(400).json({ message });
    }
  }

  /**
   * Delete own leave request (if pending)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async deleteLeave(req, res, next) {
    try {
      const { leaveId } = req.params;
      const userId = req.user.id;

      const leave = await LeaveService.deleteLeave(
        new Types.ObjectId(leaveId),
        new Types.ObjectId(userId)
      );

      res.json({ message: "Leave deleted", leave });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";
      res.status(400).json({ message });
    }
  }

  /**
   * Get leave statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getLeaveStatistics(req, res, next) {
    try {
      const userId = req.user.id;
      console.log(
        `[LeaveController] User ${userId} is fetching leave statistics`
      );

      const user = await User.findById(userId);
      if (!user) {
        console.log(`[LeaveController] User ${userId} not found`);
        return res.status(404).json({ message: "User not found" });
      }

      let query = {};

      // For regular admins, only show statistics from their department
      if (user.role === "ADMIN") {
        query.department = user.department;
      }
      // For super admins, show all statistics (no department filter)

      const [pendingRequests, approvedRequests, rejectedRequests] =
        await Promise.all([
          Leave.countDocuments({ ...query, status: LEAVE_STATUS.PENDING }),
          Leave.countDocuments({ ...query, status: LEAVE_STATUS.APPROVED }),
          Leave.countDocuments({ ...query, status: LEAVE_STATUS.REJECTED }),
        ]);

      // Calculate total leave days for approved leaves
      const approvedLeaves = await Leave.find({
        ...query,
        status: LEAVE_STATUS.APPROVED,
      });
      const totalLeaveDays = approvedLeaves.reduce((total, leave) => {
        const days =
          Math.ceil(
            (new Date(leave.endDate) - new Date(leave.startDate)) /
              (1000 * 60 * 60 * 24)
          ) + 1;
        return total + days;
      }, 0);

      const statistics = {
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        totalLeaveDays,
      };

      console.log(
        `[LeaveController] Statistics for user ${userId}:`,
        statistics
      );
      res.json({ statistics });
    } catch (error) {
      console.error(
        "[LeaveController] Error fetching leave statistics:",
        error
      );
      next(error);
    }
  }
}
