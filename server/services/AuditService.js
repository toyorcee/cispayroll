import Audit, { AuditAction, AuditEntity } from "../models/Audit.js";
import PayrollModel from "../models/Payroll.js";

/**
 * Service for handling audit logging and retrieval
 */
class AuditService {
  /**
   * Log an audit action
   * @param {string} action - The action performed (from AuditAction enum)
   * @param {string} entity - The entity affected (from AuditEntity enum)
   * @param {string} entityId - The ID of the affected entity
   * @param {string} performedBy - The ID of the user who performed the action
   * @param {Object} details - Additional details about the action
   * @param {Object} metadata - Additional metadata (optional)
   * @param {string} ipAddress - IP address of the user (optional)
   * @param {string} userAgent - User agent of the client (optional)
   * @returns {Promise<Object>} - The created audit log
   */
  static async logAction(
    action,
    entity,
    entityId,
    performedBy,
    details = {},
    metadata = {},
    ipAddress = null,
    userAgent = null
  ) {
    try {
      // Validate action and entity
      if (!Object.values(AuditAction).includes(action)) {
        throw new Error(`Invalid action: ${action}`);
      }

      if (!Object.values(AuditEntity).includes(entity)) {
        throw new Error(`Invalid entity: ${entity}`);
      }

      // Create audit log
      const auditLog = new Audit({
        action,
        entity,
        entityId,
        performedBy,
        details,
        metadata,
        ipAddress,
        userAgent,
      });

      // Save to database
      await auditLog.save();

      return auditLog;
    } catch (error) {
      console.error("Error logging audit action:", error);
      throw error;
    }
  }

  /**
   * Get audit logs with optional filtering
   * @param {Object} filters - Filter criteria
   * @param {number} page - Page number for pagination
   * @param {number} limit - Number of records per page
   * @returns {Promise<Object>} - Paginated audit logs
   */
  static async getAuditLogs(filters = {}, page = 1, limit = 20) {
    try {
      // Build query based on filters
      const query = {};

      if (filters.action) query.action = filters.action;
      if (filters.entity) query.entity = filters.entity;
      if (filters.entityId) query.entityId = filters.entityId;
      if (filters.performedBy) query.performedBy = filters.performedBy;

      // Date range filtering
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate)
          query.createdAt.$gte = new Date(filters.startDate);
        if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query with pagination
      const [logs, total] = await Promise.all([
        Audit.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("performedBy", "firstName lastName email")
          .lean(),
        Audit.countDocuments(query),
      ]);

      return {
        logs,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Error retrieving audit logs:", error);
      throw error;
    }
  }

  /**
   * Get recent activities for dashboard
   * @param {number} limit - Maximum number of activities to return
   * @returns {Promise<Array>} - Recent activities
   */
  static async getRecentActivities(limit = 10) {
    try {
      const activities = await Audit.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("performedBy", "firstName lastName email")
        .lean();

      return activities;
    } catch (error) {
      console.error("Error retrieving recent activities:", error);
      throw error;
    }
  }

  /**
   * Get user activity
   * @param {string} userId - ID of the user
   * @param {number} limit - Maximum number of activities to return
   * @returns {Promise<Array>} - User activities
   */
  static async getUserActivity(userId, limit = 20) {
    try {
      const activities = await Audit.find({ performedBy: userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("performedBy", "firstName lastName email")
        .lean();

      return activities;
    } catch (error) {
      console.error("Error retrieving user activity:", error);
      throw error;
    }
  }

  /**
   * Get entity audit history
   * @param {string} entity - Entity type
   * @param {string} entityId - Entity ID
   * @returns {Promise<Array>} - Entity audit history
   */
  static async getEntityHistory(entity, entityId) {
    try {
      const history = await Audit.find({ entity, entityId })
        .sort({ createdAt: -1 })
        .populate("performedBy", "firstName lastName email")
        .lean();

      return history;
    } catch (error) {
      console.error("Error retrieving entity history:", error);
      throw error;
    }
  }

  /**
   * Get failed payroll summary
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Object>} - Failed payroll summary
   */
  static async getFailedPayrollSummary(filters = {}) {
    try {
      // Build query for failed payrolls
      const query = {
        entity: AuditEntity.PAYROLL,
        "details.status": "FAILED",
      };

      // Add date range if provided
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate)
          query.createdAt.$gte = new Date(filters.startDate);
        if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
      }

      // Get failed payrolls
      const failedPayrolls = await Audit.find(query)
        .sort({ createdAt: -1 })
        .populate("performedBy", "firstName lastName email")
        .lean();

      // Analyze error patterns
      const errorPatterns = {};
      failedPayrolls.forEach((audit) => {
        const errorType = audit.details.errorType || "Unknown";
        if (!errorPatterns[errorType]) {
          errorPatterns[errorType] = {
            count: 0,
            examples: [],
          };
        }
        errorPatterns[errorType].count++;
        if (errorPatterns[errorType].examples.length < 3) {
          errorPatterns[errorType].examples.push({
            message: audit.details.errorMessage,
            timestamp: audit.createdAt,
            entityId: audit.entityId,
          });
        }
      });

      return {
        totalFailed: failedPayrolls.length,
        errorPatterns,
        recentFailures: failedPayrolls.slice(0, 10),
      };
    } catch (error) {
      console.error("Error generating failed payroll summary:", error);
      throw error;
    }
  }

  /**
   * Check for duplicate payroll with a simple lock mechanism
   * @param {string} employeeId - Employee ID
   * @param {string} departmentId - Department ID
   * @param {number} month - Payroll month
   * @param {number} year - Payroll year
   * @param {string} frequency - Payroll frequency
   * @returns {Promise<Object|null>} - Existing payroll if found, null otherwise
   */
  static async checkDuplicatePayroll(
    employeeId,
    departmentId,
    month,
    year,
    frequency
  ) {
    try {
      // Create a unique key for this payroll
      const lockKey = `payroll:${employeeId}:${departmentId}:${month}:${year}:${frequency}`;

      // Check if we're already processing this payroll
      const isProcessing = await this.isProcessingPayroll(lockKey);
      if (isProcessing) {
        console.warn(
          `⚠️ Payroll is already being processed for key: ${lockKey}`
        );
        return { isProcessing: true };
      }

      // Set the processing flag
      await this.setProcessingPayroll(lockKey);

      // Check for existing payroll
      const existingPayroll = await PayrollModel.findOne({
        employee: employeeId,
        department: departmentId,
        month,
        year,
        frequency: frequency.toLowerCase(),
        status: { $nin: ["REJECTED", "CANCELLED"] },
      });

      // Clear the processing flag
      await this.clearProcessingPayroll(lockKey);

      return {
        isProcessing: false,
        exists: !!existingPayroll,
        payroll: existingPayroll,
      };
    } catch (error) {
      console.error("Error checking for duplicate payroll:", error);
      throw error;
    }
  }

  /**
   * Check if a payroll is currently being processed
   * @param {string} lockKey - Unique key for the payroll
   * @returns {Promise<boolean>} - True if processing, false otherwise
   */
  static async isProcessingPayroll(lockKey) {
    try {
      // Use a simple in-memory cache or Redis if available
      // For now, we'll use a simple Map
      if (!global.payrollProcessingLocks) {
        global.payrollProcessingLocks = new Map();
      }

      return global.payrollProcessingLocks.has(lockKey);
    } catch (error) {
      console.error("Error checking payroll processing status:", error);
      return false;
    }
  }

  /**
   * Set a payroll as being processed
   * @param {string} lockKey - Unique key for the payroll
   * @returns {Promise<void>}
   */
  static async setProcessingPayroll(lockKey) {
    try {
      if (!global.payrollProcessingLocks) {
        global.payrollProcessingLocks = new Map();
      }

      global.payrollProcessingLocks.set(lockKey, Date.now());

      // Set a timeout to clear the lock after 30 seconds (in case of errors)
      setTimeout(() => {
        this.clearProcessingPayroll(lockKey);
      }, 30000);
    } catch (error) {
      console.error("Error setting payroll processing status:", error);
    }
  }

  /**
   * Clear a payroll processing flag
   * @param {string} lockKey - Unique key for the payroll
   * @returns {Promise<void>}
   */
  static async clearProcessingPayroll(lockKey) {
    try {
      if (!global.payrollProcessingLocks) {
        global.payrollProcessingLocks = new Map();
      }

      global.payrollProcessingLocks.delete(lockKey);
    } catch (error) {
      console.error("Error clearing payroll processing status:", error);
    }
  }

  /**
   * Create payroll with transaction handling to prevent race conditions
   * @param {Object} payrollData - Payroll data to create
   * @param {string} employeeId - Employee ID
   * @param {string} departmentId - Department ID
   * @param {number} month - Payroll month
   * @param {number} year - Payroll year
   * @param {string} frequency - Payroll frequency
   * @param {Date} periodStart - Period start date
   * @param {Date} periodEnd - Period end date
   * @param {string} createdBy - User ID who created the payroll
   * @returns {Promise<Object>} - Created payroll
   */
  static async createPayrollWithTransaction(
    payrollData,
    employeeId,
    departmentId,
    month,
    year,
    frequency,
    periodStart,
    periodEnd,
    createdBy
  ) {
    const session = await PayrollModel.startSession();
    session.startTransaction();

    try {
      // Check for existing payroll within the transaction
      const existingPayroll = await PayrollModel.findOne({
        employee: employeeId,
        department: departmentId,
        month,
        year,
        frequency: frequency.toLowerCase(),
        periodStart,
        periodEnd,
        status: { $nin: ["REJECTED", "CANCELLED"] },
      }).session(session);

      if (existingPayroll) {
        await session.abortTransaction();
        return { exists: true, payroll: existingPayroll };
      }

      // Create payroll record within the transaction
      const payroll = new PayrollModel({
        ...payrollData,
        employee: employeeId,
        department: departmentId,
        month,
        year,
        frequency: frequency.toLowerCase(),
        periodStart,
        periodEnd,
        status: "PROCESSING",
        processedBy: createdBy,
        createdBy,
        updatedBy: createdBy,
        payment: {
          accountName: "Pending",
          accountNumber: "Pending",
          bankName: "Pending",
        },
        approvalFlow: {
          currentLevel: "PROCESSING",
          history: [],
          submittedBy: createdBy,
          submittedAt: new Date(),
          status: "PROCESSING",
          remarks: "Initial payroll creation",
        },
      });

      await payroll.save({ session });

      // Create audit log for successful payroll creation
      await AuditService.logAction(
        AuditAction.CREATE,
        AuditEntity.PAYROLL,
        payroll._id,
        createdBy,
        {
          status: "SUCCESS",
          action: "PAYROLL_CREATED",
          employeeId,
          month,
          year,
          frequency,
          netPay: payrollData.totals.netPay,
          departmentId,
        }
      );

      await session.commitTransaction();
      return { exists: false, payroll };
    } catch (error) {
      await session.abortTransaction();
      console.error("Error in createPayrollWithTransaction:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }
}

export default AuditService;
