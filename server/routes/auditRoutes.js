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

router.get("/recent", requireAuth, AuditController.getRecentActivities);

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
