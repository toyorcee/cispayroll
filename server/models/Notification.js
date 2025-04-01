import mongoose from "mongoose";
const { Schema } = mongoose;

const NotificationSchema = new Schema({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      "PAYROLL_APPROVED",
      "PAYROLL_REJECTED",
      "PAYROLL_CREATED",
      "PAYROLL_SUBMITTED",
      "PAYSLIP_GENERATED",
      "SALARY_UPDATED",
      "ALLOWANCE_ADDED",
      "DEDUCTION_ADDED",
      "PAYMENT_PROCESSED",
    ],
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  data: {
    type: Schema.Types.Mixed,
    default: {},
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  readAt: {
    type: Date,
  },
});

// Indexes for better query performance
NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ type: 1 });

// Example notification creation method
NotificationSchema.statics.createPayrollNotification = async function (
  recipientId,
  type,
  payrollData,
  remarks = ""
) {
  const titles = {
    PAYROLL_APPROVED: "Payroll Approved",
    PAYROLL_REJECTED: "Payroll Rejected",
    PAYROLL_CREATED: "New Payroll Created",
    PAYROLL_SUBMITTED: "Payroll Submitted for Approval",
    PAYMENT_PROCESSED: "Payment Processed",
  };

  const messages = {
    PAYROLL_APPROVED: `Your payroll for ${payrollData.month}/${payrollData.year} has been approved.`,
    PAYROLL_REJECTED: `Your payroll for ${payrollData.month}/${payrollData.year} has been rejected. Reason: ${remarks}`,
    PAYROLL_CREATED: `A new payroll has been created for ${payrollData.month}/${payrollData.year}.`,
    PAYROLL_SUBMITTED: `Your payroll for ${payrollData.month}/${payrollData.year} has been submitted for approval.`,
    PAYMENT_PROCESSED: `Your payment for ${payrollData.month}/${payrollData.year} has been processed successfully.`,
  };

  return this.create({
    recipient: recipientId,
    type,
    title: titles[type],
    message: messages[type],
    data: {
      payrollId: payrollData._id,
      period: `${payrollData.month}/${payrollData.year}`,
      amount: payrollData.totals.netPay,
      remarks,
    },
  });
};

// Method to mark notification as read
NotificationSchema.methods.markAsRead = async function () {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

export default mongoose.model("Notification", NotificationSchema);
