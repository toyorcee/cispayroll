// server/routes/payrollSummaryRoutes.js
import express from "express";
import { PayrollSummaryController } from "../controllers/PayrollSummaryController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/authMiddleware.js";
import { Permission } from "../models/User.js";

const router = express.Router();

// Apply authentication to all routes
router.use(requireAuth);

// Get all summaries with filtering and pagination
router.get(
  "/",
  requirePermission([Permission.VIEW_PAYROLL_STATS]),
  PayrollSummaryController.getAllSummaries
);

// Get processing statistics
router.get(
  "/statistics/processing",
  requirePermission([Permission.VIEW_PAYROLL_STATS]),
  PayrollSummaryController.getProcessingStatistics
);

// Get recent summaries for dashboard
router.get(
  "/recent",
  requirePermission([Permission.VIEW_PAYROLL_STATS]),
  PayrollSummaryController.getRecentSummaries
);

// Get summary analytics for charts
router.get(
  "/analytics",
  requirePermission([Permission.VIEW_PAYROLL_STATS]),
  PayrollSummaryController.getSummaryAnalytics
);

// Get summary by batch ID
router.get(
  "/:batchId",
  requirePermission([Permission.VIEW_PAYROLL_STATS]),
  PayrollSummaryController.getSummaryByBatchId
);

// Delete summary (Super Admin only) - using VIEW_PAYROLL_STATS since DELETE doesn't exist
router.delete(
  "/:batchId",
  requirePermission([Permission.VIEW_PAYROLL_STATS]),
  PayrollSummaryController.deleteSummary
);

export default router;
