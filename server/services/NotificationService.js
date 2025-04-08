import Notification from "../models/Notification.js";
import UserModel from "../models/User.js";

export class NotificationService {
  static async createPayrollNotification(userId, type, payroll, remarks = "") {
    console.log(`🔔 Creating payroll notification: ${type} for user ${userId}`);
    console.log(`📊 Payroll data: ${JSON.stringify(payroll, null, 2)}`);

    // Get employee details
    const employee = await UserModel.findById(userId).populate(
      "department",
      "name code"
    );
    console.log(
      `👤 Employee details for notification: ${employee.firstName} ${employee.lastName} (${employee._id})`
    );
    console.log(
      `🏢 Department: ${employee.department?.name || "Not assigned"}`
    );

    const notificationData = {
      recipient: userId,
      type: "payroll",
      title: `Payroll ${type.replace(/_/g, " ").toLowerCase()}`,
      data: {
        payrollId: payroll._id,
        month: payroll.month,
        year: payroll.year,
        status: payroll.status,
        remarks,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        departmentName: employee.department?.name || "Not assigned",
        departmentCode: employee.department?.code || "N/A",
      },
      read: false,
    };

    switch (type) {
      case "PAYROLL_CREATED":
        notificationData.message = `Your payroll for ${payroll.month}/${payroll.year} has been created`;
        break;
      case "PAYROLL_SUBMITTED":
        notificationData.message = `New payroll submission for ${
          employee.firstName
        } ${employee.lastName} (${
          employee.department?.name || "No Department"
        }) for ${payroll.month}/${payroll.year} requires your approval`;
        break;
      case "PAYROLL_APPROVED":
        notificationData.message = `Your payroll for ${payroll.month}/${
          payroll.year
        } has been approved${remarks ? `: ${remarks}` : ""}`;
        break;
      case "PAYROLL_REJECTED":
        notificationData.message = `Your payroll for ${payroll.month}/${payroll.year} has been rejected. Reason: ${remarks}`;
        break;
      case "DEPARTMENT_PAYROLL_APPROVED":
        notificationData.message = `All department payrolls for ${payroll.month}/${payroll.year} have been approved`;
        break;
      case "DEPARTMENT_PAYROLL_REJECTED":
        notificationData.message = `Department payrolls for ${payroll.month}/${payroll.year} have been rejected. Reason: ${remarks}`;
        break;
      case "PAYROLL_PAID":
        notificationData.message = `Your payroll for ${payroll.month}/${payroll.year} has been processed for payment`;
        break;
      default:
        notificationData.message = `Payroll update: ${type}`;
    }

    console.log(
      `📝 Notification data:`,
      JSON.stringify(notificationData, null, 2)
    );

    const notification = await Notification.create(notificationData);
    console.log(`✅ Notification created with ID: ${notification._id}`);
    console.log(`📨 Notification sent to user: ${userId}`);

    return notification;
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
