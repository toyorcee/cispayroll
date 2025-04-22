import express from "express";
import AuditController from "../controllers/AuditController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/authMiddleware.js";
import { Permission } from "../models/User.js";
import User from "../models/User.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Get audit logs with filtering and pagination
// Requires VIEW_AUDIT_LOGS permission
router.get(
  "/logs",
  requirePermission([Permission.VIEW_AUDIT_LOGS]),
  AuditController.getAuditLogs
);

router.get("/recent", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Regular users can view their own activities
    if (user.role === "USER") {
      return AuditController.getRecentActivities(req, res, next);
    }

    // For admins and super admins, require VIEW_AUDIT_LOGS permission
    if (!user.permissions.includes(Permission.VIEW_AUDIT_LOGS)) {
      return res.status(403).json({ message: "Permission denied" });
    }

    return AuditController.getRecentActivities(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Get user activity
// Requires VIEW_AUDIT_LOGS permission
router.get(
  "/user/:userId",
  requirePermission([Permission.VIEW_AUDIT_LOGS]),
  AuditController.getUserActivity
);

// Get entity audit history
// Requires VIEW_AUDIT_LOGS permission
router.get(
  "/entity/:entity/:entityId",
  requirePermission([Permission.VIEW_AUDIT_LOGS]),
  AuditController.getEntityHistory
);

// Get failed payroll summary
// Requires VIEW_AUDIT_LOGS permission
router.get(
  "/failed-payrolls",
  requirePermission([Permission.VIEW_AUDIT_LOGS]),
  AuditController.getFailedPayrollSummary
);

export default router;
