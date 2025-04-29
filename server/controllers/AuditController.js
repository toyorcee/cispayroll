import Audit from "../models/Audit.js";
import { ApiError } from "../utils/errorHandler.js";
import User from "../models/User.js";

class AuditController {
  /**
   * Get audit logs with filtering and pagination
   */
  static async getAuditLogs(req, res, next) {
    try {
      const {
        action,
        entity,
        entityId,
        performedBy,
        startDate,
        endDate,
        page = 1,
        limit = 20,
      } = req.query;

      // Get current user's role and department
      const currentUser = await User.findById(req.user._id);
      if (!currentUser) {
        throw new ApiError(404, "User not found");
      }

      const filters = {};

      // Apply role-based filtering
      if (currentUser.role !== "SUPERADMIN") {
        // For non-superadmin users, only show:
        // 1. Logs from their department
        // 2. Logs where they are the performer
        // 3. Logs related to entities in their department
        filters.$or = [
          { "details.departmentId": currentUser.department },
          { performedBy: currentUser._id },
          { "details.department": currentUser.department },
        ];
      }

      // Apply additional filters from query
      if (action) filters.action = action;
      if (entity) filters.entity = entity;
      if (entityId) filters.entityId = entityId;
      if (performedBy) filters.performedBy = performedBy;
      if (startDate && endDate) {
        filters.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [logs, total] = await Promise.all([
        Audit.find(filters)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate("performedBy", "firstName lastName email role department")
          .lean(),
        Audit.countDocuments(filters),
      ]);

      res.status(200).json({
        success: true,
        data: logs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recent activities for dashboard
   */
  static async getRecentActivities(req, res, next) {
    try {
      const { limit = 10 } = req.query;
      const userId = req.user._id;
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000); 

      const activities = await Audit.find({
        performedBy: userId,
        createdAt: { $gte: since },
      })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .populate("performedBy", "firstName lastName email role department")
        .lean();

      res.status(200).json({
        success: true,
        data: activities,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user activity
   */
  static async getUserActivity(req, res, next) {
    try {
      const { userId } = req.params;
      const { limit = 20 } = req.query;

      if (!userId) {
        throw new ApiError(400, "User ID is required");
      }

      // Get current user's role and department
      const currentUser = await User.findById(req.user._id);
      if (!currentUser) {
        throw new ApiError(404, "User not found");
      }

      const filters = { performedBy: userId };

      // Apply role-based filtering for non-superadmin users
      if (currentUser.role !== "SUPERADMIN") {
        // Only allow viewing own activity or activity of users in same department
        const targetUser = await User.findById(userId);
        if (
          !targetUser ||
          targetUser.department.toString() !== currentUser.department.toString()
        ) {
          throw new ApiError(
            403,
            "You don't have permission to view this user's activity"
          );
        }
      }

      const activities = await Audit.find(filters)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .populate("performedBy", "firstName lastName email role department")
        .lean();

      res.status(200).json({
        success: true,
        data: activities,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get entity audit history
   */
  static async getEntityHistory(req, res, next) {
    try {
      const { entity, entityId } = req.params;

      if (!entity || !entityId) {
        throw new ApiError(400, "Entity and entity ID are required");
      }

      // Get current user's role and department
      const currentUser = await User.findById(req.user._id);
      if (!currentUser) {
        throw new ApiError(404, "User not found");
      }

      const filters = {
        entity,
        entityId,
      };

      // Apply role-based filtering for non-superadmin users
      if (currentUser.role !== "SUPERADMIN") {
        filters.$or = [
          { "details.departmentId": currentUser.department },
          { performedBy: currentUser._id },
          { "details.department": currentUser.department },
        ];
      }

      const history = await Audit.find(filters)
        .sort({ createdAt: -1 })
        .populate("performedBy", "firstName lastName email role department")
        .lean();

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get failed payroll summary
   */
  static async getFailedPayrollSummary(req, res, next) {
    try {
      const { startDate, endDate } = req.query;

      // Get current user's role and department
      const currentUser = await User.findById(req.user._id);
      if (!currentUser) {
        throw new ApiError(404, "User not found");
      }

      const filters = {
        entity: "PAYROLL",
        "details.status": "failed",
      };

      // Apply role-based filtering for non-superadmin users
      if (currentUser.role !== "SUPERADMIN") {
        filters.$or = [
          { "details.departmentId": currentUser.department },
          { performedBy: currentUser._id },
          { "details.department": currentUser.department },
        ];
      }

      if (startDate && endDate) {
        filters.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      const [total, recentFailures] = await Promise.all([
        Audit.countDocuments(filters),
        Audit.find(filters)
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("performedBy", "firstName lastName email role department")
          .lean(),
      ]);

      res.status(200).json({
        success: true,
        data: {
          total,
          recentFailures,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AuditController;
