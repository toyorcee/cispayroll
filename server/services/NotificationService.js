import Notification from "../models/Notification.js";
import UserModel from "../models/User.js";

// Define notification types as constants
export const NOTIFICATION_TYPES = {
  PAYROLL_CREATED: "PAYROLL_CREATED",
  PAYROLL_SUBMITTED: "PAYROLL_SUBMITTED",
  PAYROLL_APPROVED: "PAYROLL_APPROVED",
  PAYROLL_REJECTED: "PAYROLL_REJECTED",
  PAYROLL_PAID: "PAYROLL_PAID",
  BANK_DETAILS_REQUIRED: "BANK_DETAILS_REQUIRED",
  DEPARTMENT_PAYROLL_APPROVED: "DEPARTMENT_PAYROLL_APPROVED",
  DEPARTMENT_PAYROLL_REJECTED: "DEPARTMENT_PAYROLL_REJECTED",
  DEPARTMENT_PAYROLL_REJECTION_STARTED: "DEPARTMENT_PAYROLL_REJECTION_STARTED",
  DEPARTMENT_PAYROLL_REJECTION_SUMMARY: "DEPARTMENT_PAYROLL_REJECTION_SUMMARY",
  PAYROLL_DRAFT_CREATED: "PAYROLL_DRAFT_CREATED",
  BULK_PAYROLL_PROCESSED: "BULK_PAYROLL_PROCESSED",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  PAYMENT_CANCELLED: "PAYMENT_CANCELLED",
  PAYMENT_ARCHIVED: "PAYMENT_ARCHIVED",

  // New notification types for more comprehensive coverage
  PAYROLL_PROCESSING_STARTED: "PAYROLL_PROCESSING_STARTED",
  PAYROLL_PROCESSING_COMPLETED: "PAYROLL_PROCESSING_COMPLETED",
  PAYROLL_PROCESSING_FAILED: "PAYROLL_PROCESSING_FAILED",
  PAYROLL_PROCESSING_WARNING: "PAYROLL_PROCESSING_WARNING",
  PAYROLL_PROCESSING_ERROR: "PAYROLL_PROCESSING_ERROR",
  PAYROLL_PROCESSING_SKIPPED: "PAYROLL_PROCESSING_SKIPPED",
  PAYROLL_PROCESSING_SUMMARY: "PAYROLL_PROCESSING_SUMMARY",

  // Department payroll specific notifications
  DEPARTMENT_PAYROLL_PROCESSING_STARTED:
    "DEPARTMENT_PAYROLL_PROCESSING_STARTED",
  DEPARTMENT_PAYROLL_PROCESSING_COMPLETED:
    "DEPARTMENT_PAYROLL_PROCESSING_COMPLETED",
  DEPARTMENT_PAYROLL_PROCESSING_FAILED: "DEPARTMENT_PAYROLL_PROCESSING_FAILED",
  DEPARTMENT_PAYROLL_PROCESSING_WARNING:
    "DEPARTMENT_PAYROLL_PROCESSING_WARNING",
  DEPARTMENT_PAYROLL_PROCESSING_ERROR: "DEPARTMENT_PAYROLL_PROCESSING_ERROR",
  DEPARTMENT_PAYROLL_PROCESSING_SKIPPED:
    "DEPARTMENT_PAYROLL_PROCESSING_SKIPPED",
  DEPARTMENT_PAYROLL_PROCESSING_SUMMARY:
    "DEPARTMENT_PAYROLL_PROCESSING_SUMMARY",

  // Multiple employee payroll specific notifications
  MULTIPLE_PAYROLL_PROCESSING_STARTED: "MULTIPLE_PAYROLL_PROCESSING_STARTED",
  MULTIPLE_PAYROLL_PROCESSING_COMPLETED:
    "MULTIPLE_PAYROLL_PROCESSING_COMPLETED",
  MULTIPLE_PAYROLL_PROCESSING_FAILED: "MULTIPLE_PAYROLL_PROCESSING_FAILED",
  MULTIPLE_PAYROLL_PROCESSING_WARNING: "MULTIPLE_PAYROLL_PROCESSING_WARNING",
  MULTIPLE_PAYROLL_PROCESSING_ERROR: "MULTIPLE_PAYROLL_PROCESSING_ERROR",
  MULTIPLE_PAYROLL_PROCESSING_SKIPPED: "MULTIPLE_PAYROLL_PROCESSING_SKIPPED",
  MULTIPLE_PAYROLL_PROCESSING_SUMMARY: "MULTIPLE_PAYROLL_PROCESSING_SUMMARY",

  // Error specific notifications
  PAYROLL_ERROR_NO_GRADE_LEVEL: "PAYROLL_ERROR_NO_GRADE_LEVEL",
  PAYROLL_ERROR_INCOMPLETE_BANK_DETAILS:
    "PAYROLL_ERROR_INCOMPLETE_BANK_DETAILS",
  PAYROLL_ERROR_DUPLICATE_PAYROLL: "PAYROLL_ERROR_DUPLICATE_PAYROLL",
  PAYROLL_ERROR_CALCULATION_FAILED: "PAYROLL_ERROR_CALCULATION_FAILED",
  PAYROLL_ERROR_PERMISSION_DENIED: "PAYROLL_ERROR_PERMISSION_DENIED",
  PAYROLL_ERROR_SYSTEM_ERROR: "PAYROLL_ERROR_SYSTEM_ERROR",
};

// Message templates for different notification types
const notificationMessages = {
  [NOTIFICATION_TYPES.PAYROLL_CREATED]: (employee, payroll) =>
    `Your payroll for ${payroll.month}/${payroll.year} has been created`,
  [NOTIFICATION_TYPES.PAYROLL_SUBMITTED]: (employee, payroll) => {
    // Check if the employee is the one who submitted
    const isSubmitter =
      employee._id.toString() === payroll.approvalFlow?.submittedBy?.toString();

    if (isSubmitter) {
      return `Your payroll for ${payroll.month}/${payroll.year} has been submitted for approval`;
    } else {
      return `New payroll submission for ${employee.firstName} ${
        employee.lastName
      } (${employee.department?.name || "No Department"}) for ${
        payroll.month
      }/${payroll.year} requires your approval`;
    }
  },
  [NOTIFICATION_TYPES.PAYROLL_APPROVED]: (employee, payroll, remarks) =>
    `Your payroll for ${payroll.month}/${payroll.year} has been approved${
      remarks ? `: ${remarks}` : ""
    }`,
  [NOTIFICATION_TYPES.PAYROLL_REJECTED]: (employee, payroll, remarks) =>
    `Your payroll for ${payroll.month}/${payroll.year} has been rejected. Reason: ${remarks}`,
  [NOTIFICATION_TYPES.PAYROLL_PAID]: (employee, payroll) =>
    `Your payroll for ${payroll.month}/${payroll.year} has been processed for payment`,
  [NOTIFICATION_TYPES.BANK_DETAILS_REQUIRED]: (employee, payroll) =>
    `Your bank details are required for payroll approval. Please update your bank details in your profile.`,
  [NOTIFICATION_TYPES.DEPARTMENT_PAYROLL_APPROVED]: (
    employee,
    payroll,
    remarks
  ) =>
    `All department payrolls for ${payroll.month}/${
      payroll.year
    } have been approved${remarks ? `: ${remarks}` : ""}`,
  [NOTIFICATION_TYPES.DEPARTMENT_PAYROLL_REJECTED]: (
    employee,
    payroll,
    remarks
  ) =>
    `Department payrolls for ${payroll.month}/${payroll.year} have been rejected. Reason: ${remarks}`,
  [NOTIFICATION_TYPES.DEPARTMENT_PAYROLL_REJECTION_STARTED]: (employee, data) =>
    `Started rejecting department payrolls for ${data.month}/${data.year}${
      data.remarks ? `: ${data.remarks}` : ""
    }`,
  [NOTIFICATION_TYPES.DEPARTMENT_PAYROLL_REJECTION_SUMMARY]: (employee, data) =>
    `Department payroll rejection summary for ${data.month}/${data.year}: ${data.rejected} rejected successfully, ${data.failed} failed. ${data.summary}`,
  [NOTIFICATION_TYPES.PAYROLL_DRAFT_CREATED]: (employee, payroll) =>
    `A draft payroll for ${payroll.month}/${payroll.year} has been created for your review`,
  [NOTIFICATION_TYPES.BULK_PAYROLL_PROCESSED]: (employee, payroll) =>
    `Bulk payroll processing for ${payroll.month}/${payroll.year} has been completed`,
  [NOTIFICATION_TYPES.PAYMENT_FAILED]: (employee, payroll, notes) =>
    `Payment for your payroll (${payroll.month}/${payroll.year}) has failed.${
      notes ? ` Reason: ${notes}` : ""
    }`,
  [NOTIFICATION_TYPES.PAYMENT_CANCELLED]: (employee, payroll, notes) =>
    `Payment for your payroll (${payroll.month}/${
      payroll.year
    }) has been cancelled.${notes ? ` Reason: ${notes}` : ""}`,
  [NOTIFICATION_TYPES.PAYMENT_ARCHIVED]: (employee, payroll) =>
    `Payment record for your payroll (${payroll.month}/${payroll.year}) has been archived`,
};

export class NotificationService {
  static async createPayrollNotification(
    userId,
    type,
    payrollData,
    remarks = ""
  ) {
    try {
      console.log(
        `🔔 Creating payroll notification: ${type} for user ${userId}`
      );
      console.log(`📊 Payroll data:`, JSON.stringify(payrollData, null, 2));

      // Get employee details with department
      const user = await UserModel.findById(userId).populate(
        "department",
        "name code"
      );
      if (!user) {
        console.error(`❌ User not found for notification: ${userId}`);
        return null;
      }

      const departmentName = user.department?.name || "Not assigned";
      const departmentCode = user.department?.code || "N/A";

      console.log(
        `👤 Employee details for notification: ${user.firstName} ${user.lastName} (${userId})`
      );
      console.log(`🏢 Department: ${departmentName}`);

      // Get the current approval level from payroll data
      const currentLevel = payrollData.approvalFlow?.currentLevel || "PENDING";
      const levelDisplay = currentLevel
        .split("_")
        .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
        .join(" ");

      // Get message from template or use default
      const message = notificationMessages[type]
        ? notificationMessages[type](user, payrollData, remarks)
        : `New payroll submission for ${user.firstName} ${user.lastName} (${departmentName}) for ${payrollData.month}/${payrollData.year} requires ${levelDisplay} approval`;

      const notificationData = {
        recipient: userId,
        type: "payroll",
        title: `Payroll ${type.replace(/_/g, " ").toLowerCase()}`,
        data: {
          payrollId: payrollData._id,
          month: payrollData.month,
          year: payrollData.year,
          status: payrollData.status,
          remarks,
          employeeName: `${user.firstName} ${user.lastName}`,
          departmentName,
          departmentCode,
          currentLevel: levelDisplay,
        },
        read: false,
        message,
      };

      console.log(
        "📝 Notification data:",
        JSON.stringify(notificationData, null, 2)
      );

      const notification = await Notification.create(notificationData);
      console.log(`✅ Notification created with ID: ${notification._id}`);
      console.log(`📨 Notification saved for user: ${userId}`);

      return notification;
    } catch (error) {
      console.error("❌ Error creating notification:", error);
      return null;
    }
  }

  static async createBatchPayrollNotifications(
    userIds,
    type,
    payroll,
    remarks = ""
  ) {
    console.log(
      `🔔 Creating batch payroll notifications: ${type} for ${userIds.length} users`
    );

    // Get all employees with their departments in one query
    const employees = await UserModel.find({ _id: { $in: userIds } })
      .populate("department", "name code")
      .lean();

    console.log(
      `👥 Found ${employees.length} employees for batch notifications`
    );

    // Create a map for quick lookup
    const employeeMap = {};
    employees.forEach((emp) => {
      employeeMap[emp._id.toString()] = emp;
    });

    const notifications = userIds.map((userId) => {
      const employee = employeeMap[userId.toString()];
      if (!employee) {
        console.warn(`⚠️ Employee not found for ID: ${userId}`);
        return this.createPayrollNotification(userId, type, payroll, remarks);
      }

      console.log(
        `👤 Processing notification for: ${employee.firstName} ${employee.lastName} (${employee._id})`
      );
      console.log(
        `🏢 Department: ${employee.department?.name || "Not assigned"}`
      );

      return this.createPayrollNotification(userId, type, payroll, remarks);
    });

    return await Promise.all(notifications);
  }
}
