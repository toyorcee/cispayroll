import PayrollSummary from "../models/PayrollSummary.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import { ProcessingStatus, SummaryType } from "../models/PayrollSummary.js";

class PayrollSummaryService {
  /**
   * Create a new payroll processing summary
   */
  static async createSummary(summaryData) {
    try {
      const summary = new PayrollSummary(summaryData);
      await summary.save();
      return summary;
    } catch (error) {
      console.error("❌ Error creating payroll summary:", error);
      throw error;
    }
  }

  /**
   * Get payroll summary by batch ID with role-based access control
   */
  static async getSummaryByBatchId(batchId, user) {
    try {
      let query = { batchId };

      // Role-based filtering
      if (user.role === "ADMIN") {
        const userDepartment =
          typeof user.department === "object"
            ? user.department._id
            : user.department;
        query.department = userDepartment;
      }

      const summary = await PayrollSummary.findOne(query)
        .populate("processedBy", "firstName lastName email")
        .populate("department", "name code")
        .populate(
          "employeeDetails.employeeId",
          "firstName lastName email employeeId"
        )
        .populate("employeeDetails.department", "name code");

      if (!summary) {
        throw new Error("Payroll summary not found or access denied");
      }

      return summary;
    } catch (error) {
      console.error("❌ Error getting payroll summary:", error);
      throw error;
    }
  }

  /**
   * Get all payroll summaries with role-based access control
   */
  static async getAllSummaries(user, filters = {}) {
    try {
      let query = {};

      // Role-based filtering
      if (user.role === "ADMIN") {
        const userDepartment =
          typeof user.department === "object"
            ? user.department._id
            : user.department;
        query.department = userDepartment;
      }

      // Apply additional filters
      if (filters.month) query.month = filters.month;
      if (filters.year) query.year = filters.year;
      if (filters.frequency) query.frequency = filters.frequency;
      if (filters.summaryType) query.summaryType = filters.summaryType;

      // Date range filter
      if (filters.startDate && filters.endDate) {
        query.createdAt = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate),
        };
      }

      const summaries = await PayrollSummary.find(query)
        .populate("processedBy", "firstName lastName email")
        .populate("department", "name code")
        .sort({ createdAt: -1 })
        .limit(filters.limit || 50);

      return summaries;
    } catch (error) {
      console.error("❌ Error getting all payroll summaries:", error);
      throw error;
    }
  }

  /**
   * Get processing statistics with role-based access control
   */
  static async getProcessingStatistics(user) {
    try {
      let departmentId = null;

      if (user.role === "ADMIN") {
        departmentId =
          typeof user.department === "object"
            ? user.department._id
            : user.department;
      }

      const stats = await PayrollSummary.getProcessingStatistics(
        user.role,
        departmentId
      );
      return (
        stats[0] || {
          totalBatches: 0,
          totalEmployees: 0,
          totalProcessed: 0,
          totalSkipped: 0,
          totalFailed: 0,
          totalNetPay: 0,
          totalGrossPay: 0,
          totalDeductions: 0,
          avgProcessingTime: 0,
        }
      );
    } catch (error) {
      console.error("❌ Error getting processing statistics:", error);
      throw error;
    }
  }

  /**
   * Get recent processing summaries for dashboard
   */
  static async getRecentSummaries(user, limit = 5) {
    try {
      let query = {};

      if (user.role === "ADMIN") {
        const userDepartment =
          typeof user.department === "object"
            ? user.department._id
            : user.department;
        query.department = userDepartment;
      }

      const summaries = await PayrollSummary.find(query)
        .populate("processedBy", "firstName lastName email")
        .populate("department", "name code")
        .sort({ createdAt: -1 })
        .limit(limit);

      return summaries;
    } catch (error) {
      console.error("❌ Error getting recent summaries:", error);
      throw error;
    }
  }

  /**
   * Update payroll summary with new employee details
   */
  static async updateSummaryWithEmployee(batchId, employeeDetail, user) {
    try {
      const summary = await PayrollSummary.findOne({ batchId });

      if (!summary) {
        throw new Error("Payroll summary not found");
      }

      // Role-based access check
      if (user.role === "ADMIN") {
        const userDepartment =
          typeof user.department === "object"
            ? user.department._id
            : user.department;
        if (
          summary.department &&
          summary.department.toString() !== userDepartment.toString()
        ) {
          throw new Error(
            "Access denied: You can only update summaries for your department"
          );
        }
      }

      // Add employee detail
      summary.addEmployeeDetail(employeeDetail);

      // Update department breakdown
      if (employeeDetail.department) {
        summary.updateDepartmentBreakdown(
          employeeDetail.department,
          employeeDetail.departmentName,
          employeeDetail
        );
      }

      await summary.save();
      return summary;
    } catch (error) {
      console.error("❌ Error updating summary with employee:", error);
      throw error;
    }
  }

  /**
   * Add error to payroll summary
   */
  static async addErrorToSummary(batchId, error, user) {
    try {
      const summary = await PayrollSummary.findOne({ batchId });

      if (!summary) {
        throw new Error("Payroll summary not found");
      }

      // Role-based access check
      if (user.role === "ADMIN") {
        const userDepartment =
          typeof user.department === "object"
            ? user.department._id
            : user.department;
        if (
          summary.department &&
          summary.department.toString() !== userDepartment.toString()
        ) {
          throw new Error(
            "Access denied: You can only update summaries for your department"
          );
        }
      }

      summary.addError(error);
      await summary.save();
      return summary;
    } catch (error) {
      console.error("❌ Error adding error to summary:", error);
      throw error;
    }
  }

  /**
   * Add warning to payroll summary
   */
  static async addWarningToSummary(batchId, warning, user) {
    try {
      const summary = await PayrollSummary.findOne({ batchId });

      if (!summary) {
        throw new Error("Payroll summary not found");
      }

      // Role-based access check
      if (user.role === "ADMIN") {
        const userDepartment =
          typeof user.department === "object"
            ? user.department._id
            : user.department;
        if (
          summary.department &&
          summary.department.toString() !== userDepartment.toString()
        ) {
          throw new Error(
            "Access denied: You can only update summaries for your department"
          );
        }
      }

      summary.addWarning(warning);
      await summary.save();
      return summary;
    } catch (error) {
      console.error("❌ Error adding warning to summary:", error);
      throw error;
    }
  }

  /**
   * Delete payroll summary (Super Admin only)
   */
  static async deleteSummary(batchId, user) {
    try {
      if (user.role !== "SUPER_ADMIN") {
        throw new Error(
          "Access denied: Only Super Admins can delete summaries"
        );
      }

      const summary = await PayrollSummary.findOneAndDelete({ batchId });

      if (!summary) {
        throw new Error("Payroll summary not found");
      }

      return { message: "Payroll summary deleted successfully" };
    } catch (error) {
      console.error("❌ Error deleting summary:", error);
      throw error;
    }
  }

  /**
   * Get summary analytics for charts
   */
  static async getSummaryAnalytics(user, filters = {}) {
    try {
      let matchQuery = {};

      if (user.role === "ADMIN") {
        const userDepartment =
          typeof user.department === "object"
            ? user.department._id
            : user.department;
        matchQuery.department = userDepartment;
      }

      if (filters.month) matchQuery.month = filters.month;
      if (filters.year) matchQuery.year = filters.year;

      const analytics = await PayrollSummary.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              month: "$month",
              year: "$year",
              department: "$department",
            },
            totalBatches: { $sum: 1 },
            totalEmployees: { $sum: "$totalAttempted" },
            totalProcessed: { $sum: "$processed" },
            totalSkipped: { $sum: "$skipped" },
            totalFailed: { $sum: "$failed" },
            totalNetPay: { $sum: "$totalNetPay" },
            totalGrossPay: { $sum: "$totalGrossPay" },
            totalDeductions: { $sum: "$totalDeductions" },
            avgProcessingTime: { $avg: "$processingTime" },
          },
        },
        {
          $lookup: {
            from: "departments",
            localField: "_id.department",
            foreignField: "_id",
            as: "department",
          },
        },
        {
          $unwind: {
            path: "$department",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            month: "$_id.month",
            year: "$_id.year",
            departmentName: "$department.name",
            departmentCode: "$department.code",
            totalBatches: 1,
            totalEmployees: 1,
            totalProcessed: 1,
            totalSkipped: 1,
            totalFailed: 1,
            totalNetPay: 1,
            totalGrossPay: 1,
            totalDeductions: 1,
            avgProcessingTime: 1,
          },
        },
        { $sort: { year: -1, month: -1 } },
      ]);

      return analytics;
    } catch (error) {
      console.error("❌ Error getting summary analytics:", error);
      throw error;
    }
  }
}

export default PayrollSummaryService;
