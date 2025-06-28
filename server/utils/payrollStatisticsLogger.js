import Audit from "../models/Audit.js";
import { AuditAction, AuditEntity } from "../models/Audit.js";
import PayrollModel from "../models/Payroll.js";

export class PayrollStatisticsLogger {
  /**
   * Unified logger for all payroll actions (create, update, approve, pay, etc.)
   * This replaces multiple audit/stat logs with a single, rich entry per user action.
   *
   * @param {Object} params
   *   - action: AuditAction (e.g., CREATE, UPDATE, APPROVE, PAYMENT_PROCESSED, etc.)
   *   - payrollId: Payroll _id
   *   - userId: User performing the action
   *   - status: Payroll status after the action (e.g., DRAFT, COMPLETED, PAID)
   *   - details: Additional details (employee, department, remarks, etc.)
   */
  static async logPayrollAction({
    action,
    payrollId,
    userId,
    status,
    details = {},
  }) {
    try {
      // Get payroll details for richer context if not provided
      let payroll = null;
      if (
        !details.employeeId ||
        !details.departmentId ||
        !details.employeeName ||
        !details.departmentName
      ) {
        payroll = await PayrollModel.findById(payrollId).populate(
          "employee department"
        );
      }
      const employeeId = details.employeeId || payroll?.employee?._id;
      const departmentId = details.departmentId || payroll?.department?._id;
      const employeeName = details.employeeName || payroll?.employee?.fullName;
      const departmentName =
        details.departmentName || payroll?.department?.name;
      const netPay = details.netPay || payroll?.totals?.netPay;

      // Create a single audit log entry
      await Audit.create({
        action,
        entity: AuditEntity.PAYROLL,
        entityId: payrollId,
        performedBy: userId,
        details: {
          ...details,
          employeeId,
          departmentId,
          employeeName,
          departmentName,
          netPay,
          status,
        },
        timestamp: new Date(),
      });

      // Log statistics change (optional, only for certain actions)
      if (
        [
          AuditAction.CREATE,
          AuditAction.UPDATE,
          AuditAction.PAYMENT_PROCESSED,
          AuditAction.PAYSLIP_SENT,
          AuditAction.APPROVE,
          AuditAction.REJECT,
        ].includes(action)
      ) {
        await this.logStatisticsChange(action, {
          payrollId,
          userId,
          status,
          employeeId,
          departmentId,
          ...details,
        });
      }
    } catch (error) {
      console.error("❌ Error in unified payroll logger:", error);
    }
  }

  /**
   * Log payroll creation and update statistics
   */
  static async logPayrollCreated(
    payrollId,
    employeeId,
    departmentId,
    userId,
    details = {}
  ) {
    return this.logPayrollAction({
      action: AuditAction.CREATE,
      payrollId,
      userId,
      status: details.status || "DRAFT",
      details: { employeeId, departmentId, ...details },
    });
  }

  /**
   * Log payroll status change and update statistics
   */
  static async logPayrollStatusChange(
    payrollId,
    previousStatus,
    newStatus,
    userId,
    details = {}
  ) {
    return this.logPayrollAction({
      action: AuditAction.UPDATE,
      payrollId,
      userId,
      status: newStatus,
      details: { previousStatus, newStatus, ...details },
    });
  }

  /**
   * Log payment processing
   */
  static async logPaymentProcessed(
    payrollId,
    paymentStatus,
    userId,
    details = {}
  ) {
    return this.logPayrollAction({
      action: AuditAction.PAYMENT_PROCESSED,
      payrollId,
      userId,
      status: paymentStatus,
      details,
    });
  }

  /**
   * Log payslip sent
   */
  static async logPayslipSent(payrollId, userId, recipientEmail, details = {}) {
    return this.logPayrollAction({
      action: AuditAction.PAYSLIP_SENT,
      payrollId,
      userId,
      status: "PAYSLIP_SENT",
      details: { recipientEmail, ...details },
    });
  }

  /**
   * Log batch operations
   */
  static async logBatchOperation(
    operationType,
    payrollIds,
    userId,
    details = {}
  ) {
    try {
      // For batch operations, we need to handle multiple payroll IDs
      // Create separate audit entries for each payroll ID
      if (Array.isArray(payrollIds) && payrollIds.length > 0) {
        for (const payrollId of payrollIds) {
          await Audit.create({
            action: AuditAction.BATCH_OPERATION,
            entity: AuditEntity.PAYROLL,
            entityId: payrollId,
            performedBy: userId,
            details: {
              ...details,
              operationType,
              batchSize: payrollIds.length,
              processingTime: details.processingTime,
            },
            timestamp: new Date(),
          });
        }
      } else {
        // Fallback for single payroll ID or invalid input
        await Audit.create({
          action: AuditAction.BATCH_OPERATION,
          entity: AuditEntity.PAYROLL,
          entityId: Array.isArray(payrollIds) ? payrollIds[0] : payrollIds,
          performedBy: userId,
          details: {
            ...details,
            operationType,
            batchSize: Array.isArray(payrollIds) ? payrollIds.length : 1,
            processingTime: details.processingTime,
          },
          timestamp: new Date(),
        });
      }

      // Log statistics change for batch operations
      await this.logStatisticsChange(AuditAction.BATCH_OPERATION, {
        operationType,
        batchSize: Array.isArray(payrollIds) ? payrollIds.length : 1,
        ...details,
      });
    } catch (error) {
      console.error("❌ Error in batch operation logger:", error);
    }
  }

  /**
   * Log statistics change for dashboard tracking
   */
  static async logStatisticsChange(changeType, details) {
    try {
      const stats = await this.getCurrentStatistics();

      console.log(`📊 [STATS] Statistics updated - ${changeType}:`, {
        changeType,
        details,
        currentStats: {
          totalPayrolls: stats.totalPayrolls,
          processingPayrolls: stats.processingPayrolls,
          completedPayrolls: stats.completedPayrolls,
          paidPayrolls: stats.paidPayrolls,
          pendingPaymentPayrolls: stats.pendingPaymentPayrolls,
          totalAmountPaid: stats.totalAmountPaid,
          totalAmountPendingPayment: stats.totalAmountPendingPayment,
        },
      });
    } catch (error) {
      console.error("❌ Error logging statistics change:", error);
    }
  }

  /**
   * Get current statistics for comparison
   */
  static async getCurrentStatistics() {
    try {
      const totalPayrolls = await PayrollModel.countDocuments();
      const processingPayrolls = await PayrollModel.countDocuments({
        status: "PROCESSING",
      });
      const completedPayrolls = await PayrollModel.countDocuments({
        status: "COMPLETED",
      });
      const paidPayrolls = await PayrollModel.countDocuments({
        status: "PAID",
      });
      const pendingPaymentPayrolls = await PayrollModel.countDocuments({
        status: "PENDING_PAYMENT",
      });

      const totalAmountPaid = await PayrollModel.aggregate([
        { $match: { status: "PAID" } },
        { $group: { _id: null, total: { $sum: "$totals.netPay" } } },
      ]);

      const totalAmountPendingPayment = await PayrollModel.aggregate([
        { $match: { status: "PENDING_PAYMENT" } },
        { $group: { _id: null, total: { $sum: "$totals.netPay" } } },
      ]);

      return {
        totalPayrolls,
        processingPayrolls,
        completedPayrolls,
        paidPayrolls,
        pendingPaymentPayrolls,
        totalAmountPaid: totalAmountPaid[0]?.total || 0,
        totalAmountPendingPayment: totalAmountPendingPayment[0]?.total || 0,
      };
    } catch (error) {
      console.error("❌ Error getting current statistics:", error);
      return {};
    }
  }

  /**
   * Get recent activity for dashboard
   */
  static async getRecentActivity(limit = 10, departmentId = null) {
    try {
      const query = {
        entity: AuditEntity.PAYROLL,
        ...(departmentId && { "details.departmentId": departmentId }),
      };

      const recentActivity = await Audit.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate("userId", "fullName email")
        .lean();

      return recentActivity.map((activity) => ({
        id: activity._id,
        action: activity.action,
        timestamp: activity.timestamp,
        user: activity.userId,
        details: activity.details,
        entityId: activity.entityId,
      }));
    } catch (error) {
      console.error("❌ Error getting recent activity:", error);
      return [];
    }
  }

  /**
   * Log report generation
   */
  static async logReportGenerated(
    reportId,
    userId,
    format,
    period,
    filters = {},
    details = {}
  ) {
    return this.logPayrollAction({
      action: AuditAction.REPORT_GENERATED,
      payrollId: reportId,
      userId,
      status: "GENERATED",
      details: {
        format,
        period,
        filters,
        reportType: "PAYROLL_REPORT",
        ...details,
      },
    });
  }

  /**
   * Log report download
   */
  static async logReportDownloaded(
    reportId,
    userId,
    format,
    period,
    filters = {},
    details = {}
  ) {
    return this.logPayrollAction({
      action: AuditAction.REPORT_DOWNLOADED,
      payrollId: reportId,
      userId,
      status: "DOWNLOADED",
      details: {
        format,
        period,
        filters,
        reportType: "PAYROLL_REPORT",
        ...details,
      },
    });
  }

  /**
   * Log report email sent
   */
  static async logReportEmailed(
    reportId,
    userId,
    recipientEmail,
    formats,
    period,
    filters = {},
    details = {}
  ) {
    return this.logPayrollAction({
      action: AuditAction.REPORT_EMAILED,
      payrollId: reportId,
      userId,
      status: "EMAILED",
      details: {
        recipientEmail,
        formats,
        period,
        filters,
        reportType: "PAYROLL_REPORT",
        ...details,
      },
    });
  }

  /**
   * Log report viewed
   */
  static async logReportViewed(
    reportId,
    userId,
    format,
    period,
    filters = {},
    details = {}
  ) {
    return this.logPayrollAction({
      action: AuditAction.REPORT_VIEWED,
      payrollId: reportId,
      userId,
      status: "VIEWED",
      details: {
        format,
        period,
        filters,
        reportType: "PAYROLL_REPORT",
        ...details,
      },
    });
  }

  /**
   * Get report generation statistics
   */
  static async getReportStatistics(limit = 30) {
    try {
      const reportActions = await Audit.find({
        action: {
          $in: [
            AuditAction.REPORT_GENERATED,
            AuditAction.REPORT_DOWNLOADED,
            AuditAction.REPORT_EMAILED,
            AuditAction.REPORT_VIEWED,
          ],
        },
        entity: AuditEntity.REPORT,
      })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate("performedBy", "fullName email")
        .lean();

      return reportActions.map((action) => ({
        id: action._id,
        action: action.action,
        timestamp: action.timestamp,
        user: action.performedBy,
        details: action.details,
        entityId: action.entityId,
      }));
    } catch (error) {
      console.error("❌ Error getting report statistics:", error);
      return [];
    }
  }

  /**
   * Log deduction actions (create, update, delete, toggle, etc.)
   * For backward compatibility with existing controller code
   */
  static async logDeductionAction({
    action,
    deductionId,
    userId,
    details = {},
  }) {
    try {
      // Create audit log entry for deduction actions
      await Audit.create({
        action,
        entity: AuditEntity.DEDUCTION,
        entityId: deductionId,
        performedBy: userId,
        details: {
          ...details,
          deductionId,
        },
        timestamp: new Date(),
      });

      console.log(`📊 [DEDUCTION] Action logged - ${action}:`, {
        action,
        deductionId,
        userId,
        details,
      });
    } catch (error) {
      console.error("❌ Error in deduction logger:", error);
    }
  }

  /**
   * Log deduction preference actions (user preferences, opt-in/opt-out)
   * For backward compatibility with existing controller code
   */
  static async logDeductionPreferenceAction({
    action,
    userId,
    targetUserId,
    details = {},
  }) {
    try {
      // Create audit log entry for deduction preference actions
      await Audit.create({
        action,
        entity: AuditEntity.DEDUCTION,
        entityId: targetUserId, // Using targetUserId as entityId for preferences
        performedBy: userId,
        details: {
          ...details,
          targetUserId,
          preferenceType: "DEDUCTION_PREFERENCE",
        },
        timestamp: new Date(),
      });

      console.log(`📊 [DEDUCTION_PREFERENCE] Action logged - ${action}:`, {
        action,
        userId,
        targetUserId,
        details,
      });
    } catch (error) {
      console.error("❌ Error in deduction preference logger:", error);
    }
  }

  /**
   * Log employee actions (create, update, delete, transfer, etc.)
   * For backward compatibility with existing controller code
   */
  static async logEmployeeAction({ action, employeeId, userId, details = {} }) {
    try {
      // Create audit log entry for employee actions
      await Audit.create({
        action,
        entity: AuditEntity.EMPLOYEE,
        entityId: employeeId,
        performedBy: userId,
        details: {
          ...details,
          employeeId,
        },
        timestamp: new Date(),
      });

      console.log(`📊 [EMPLOYEE] Action logged - ${action}:`, {
        action,
        employeeId,
        userId,
        details,
      });
    } catch (error) {
      console.error("❌ Error in employee logger:", error);
    }
  }

  /**
   * Log department actions (create, update, delete, etc.)
   * For backward compatibility with existing controller code
   */
  static async logDepartmentAction({
    action,
    departmentId,
    userId,
    details = {},
  }) {
    try {
      // Create audit log entry for department actions
      await Audit.create({
        action,
        entity: AuditEntity.DEPARTMENT,
        entityId: departmentId,
        performedBy: userId,
        details: {
          ...details,
          departmentId,
        },
        timestamp: new Date(),
      });

      console.log(`📊 [DEPARTMENT] Action logged - ${action}:`, {
        action,
        departmentId,
        userId,
        details,
      });
    } catch (error) {
      console.error("❌ Error in department logger:", error);
    }
  }

  /**
   * Log leave actions (approve, reject, etc.)
   * For backward compatibility with existing controller code
   */
  static async logLeaveAction({ action, leaveId, userId, details = {} }) {
    try {
      // Create audit log entry for leave actions
      await Audit.create({
        action,
        entity: AuditEntity.LEAVE,
        entityId: leaveId,
        performedBy: userId,
        details: {
          ...details,
          leaveId,
        },
        timestamp: new Date(),
      });

      console.log(`📊 [LEAVE] Action logged - ${action}:`, {
        action,
        leaveId,
        userId,
        details,
      });
    } catch (error) {
      console.error("❌ Error in leave logger:", error);
    }
  }

  /**
   * Log salary grade actions (create, update, delete, etc.)
   * For backward compatibility with existing controller code
   */
  static async logSalaryGradeAction({
    action,
    salaryGradeId,
    userId,
    details = {},
  }) {
    try {
      // Create audit log entry for salary grade actions
      await Audit.create({
        action,
        entity: AuditEntity.SALARY_GRADE,
        entityId: salaryGradeId,
        performedBy: userId,
        details: {
          ...details,
          salaryGradeId,
        },
        timestamp: new Date(),
      });

      console.log(`📊 [SALARY_GRADE] Action logged - ${action}:`, {
        action,
        salaryGradeId,
        userId,
        details,
      });
    } catch (error) {
      console.error("❌ Error in salary grade logger:", error);
    }
  }

  /**
   * Log salary component actions (add, update, delete, etc.)
   * For backward compatibility with existing controller code
   */
  static async logSalaryComponentAction({
    action,
    componentId,
    salaryGradeId,
    userId,
    details = {},
  }) {
    try {
      // Create audit log entry for salary component actions
      await Audit.create({
        action,
        entity: AuditEntity.SALARY_COMPONENT,
        entityId: componentId,
        performedBy: userId,
        details: {
          ...details,
          componentId,
          salaryGradeId,
        },
        timestamp: new Date(),
      });

      console.log(`📊 [SALARY_COMPONENT] Action logged - ${action}:`, {
        action,
        componentId,
        salaryGradeId,
        userId,
        details,
      });
    } catch (error) {
      console.error("❌ Error in salary component logger:", error);
    }
  }

  /**
   * Log bonus actions (create, update, delete, approve, etc.)
   * For backward compatibility with existing controller code
   */
  static async logBonusAction({
    action,
    bonusId,
    bonusIds,
    userId,
    details = {},
    statisticsDetails = {},
    auditDetails = {},
  }) {
    try {
      // Handle both single bonusId and multiple bonusIds
      const entityIds = bonusIds || (bonusId ? [bonusId] : []);

      // Create audit log entry for bonus actions
      await Audit.create({
        action,
        entity: AuditEntity.BONUS,
        entityId: entityIds[0] || bonusId, // Use first ID or single ID
        performedBy: userId,
        details: {
          ...details,
          ...auditDetails,
          bonusId: bonusId || entityIds[0],
          bonusIds: entityIds,
          statisticsDetails,
        },
        timestamp: new Date(),
      });

      console.log(`📊 [BONUS] Action logged - ${action}:`, {
        action,
        bonusId: bonusId || entityIds[0],
        bonusIds: entityIds,
        userId,
        details,
        statisticsDetails,
        auditDetails,
      });
    } catch (error) {
      console.error("❌ Error in bonus logger:", error);
    }
  }

  /**
   * Log allowance actions (create, update, delete, approve, etc.)
   * For backward compatibility with existing controller code
   */
  static async logAllowanceAction({
    action,
    allowanceId,
    allowanceIds,
    userId,
    details = {},
    statisticsDetails = {},
    auditDetails = {},
  }) {
    try {
      // Handle both single allowanceId and multiple allowanceIds
      const entityIds = allowanceIds || (allowanceId ? [allowanceId] : []);

      // Create audit log entry for allowance actions
      await Audit.create({
        action,
        entity: AuditEntity.ALLOWANCE,
        entityId: entityIds[0] || allowanceId, // Use first ID or single ID
        performedBy: userId,
        details: {
          ...details,
          ...auditDetails,
          allowanceId: allowanceId || entityIds[0],
          allowanceIds: entityIds,
          statisticsDetails,
        },
        timestamp: new Date(),
      });

      console.log(`📊 [ALLOWANCE] Action logged - ${action}:`, {
        action,
        allowanceId: allowanceId || entityIds[0],
        allowanceIds: entityIds,
        userId,
        details,
        statisticsDetails,
        auditDetails,
      });
    } catch (error) {
      console.error("❌ Error in allowance logger:", error);
    }
  }
}

export default PayrollStatisticsLogger;
