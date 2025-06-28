// server/controllers/PayrollSummaryController.js
import PayrollSummaryService from "../services/PayrollSummaryService.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/authMiddleware.js";

export class PayrollSummaryController {
  // Get all summaries with filtering and pagination
  static async getAllSummaries(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        month,
        year,
        frequency,
        department,
      } = req.query;

      const filters = {
        month: month ? parseInt(month) : null,
        year: year ? parseInt(year) : null,
        frequency,
        department,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        limit: parseInt(limit),
        page: parseInt(page),
      };

      const summaries = await PayrollSummaryService.getAllSummaries(
        req.user,
        filters
      );

      res.status(200).json({
        success: true,
        data: summaries,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: summaries.length,
        },
      });
    } catch (error) {
      console.error("❌ Error fetching summaries:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch payroll summaries",
        error: error.message,
      });
    }
  }

  // Get summary by batch ID
  static async getSummaryByBatchId(req, res) {
    try {
      const { batchId } = req.params;

      const summary = await PayrollSummaryService.getSummaryByBatchId(
        batchId,
        req.user
      );

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      console.error("❌ Error fetching summary:", error);
      res.status(404).json({
        success: false,
        message: "Payroll summary not found or access denied",
        error: error.message,
      });
    }
  }

  // Get processing statistics
  static async getProcessingStatistics(req, res) {
    try {
      const stats = await PayrollSummaryService.getProcessingStatistics(
        req.user
      );

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("❌ Error fetching statistics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch processing statistics",
        error: error.message,
      });
    }
  }

  // Get recent summaries for dashboard
  static async getRecentSummaries(req, res) {
    try {
      const { limit = 5 } = req.query;

      const summaries = await PayrollSummaryService.getRecentSummaries(
        req.user,
        parseInt(limit)
      );

      res.status(200).json({
        success: true,
        data: summaries,
      });
    } catch (error) {
      console.error("❌ Error fetching recent summaries:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch recent summaries",
        error: error.message,
      });
    }
  }

  // Get summary analytics for charts
  static async getSummaryAnalytics(req, res) {
    try {
      const { month, year, department } = req.query;

      const filters = {
        month: month ? parseInt(month) : null,
        year: year ? parseInt(year) : null,
        department,
      };

      const analytics = await PayrollSummaryService.getSummaryAnalytics(
        req.user,
        filters
      );

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      console.error("❌ Error fetching analytics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch summary analytics",
        error: error.message,
      });
    }
  }

  // Delete summary (Super Admin only)
  static async deleteSummary(req, res) {
    try {
      const { batchId } = req.params;

      const result = await PayrollSummaryService.deleteSummary(
        batchId,
        req.user
      );

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error("❌ Error deleting summary:", error);
      res.status(403).json({
        success: false,
        message: "Failed to delete summary",
        error: error.message,
      });
    }
  }
}
