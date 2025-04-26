import mongoose from "mongoose";
const { Schema, Types } = mongoose;

export const PaymentStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
};

export const PaymentMethod = {
  BANK_TRANSFER: "BANK_TRANSFER",
  CASH: "CASH",
  CHECK: "CHECK",
  MOBILE_MONEY: "MOBILE_MONEY",
  OTHER: "OTHER",
};

const PaymentSchema = new Schema(
  {
    payrollId: {
      type: Schema.Types.ObjectId,
      ref: "Payroll",
      required: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
    bankDetails: {
      bankName: String,
      accountNumber: String,
      accountName: String,
      branch: String,
    },
    notes: String,
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Payment", PaymentSchema);
