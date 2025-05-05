import mongoose from "mongoose";
const { Schema } = mongoose;

// Constants
export const BonusType = {
  PERSONAL: "personal",
  PERFORMANCE: "performance",
  THIRTEENTH_MONTH: "thirteenth_month",
  SPECIAL: "special",
  ACHIEVEMENT: "achievement",
  RETENTION: "retention",
  PROJECT: "project",
};

export const ApprovalStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

const BonusSchema = new Schema(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Employee is required"],
    },
    type: {
      type: String,
      enum: Object.values(BonusType),
      required: [true, "Bonus type is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
    },
    reason: {
      type: String,
      required: [true, "Reason is required"],
    },
    paymentDate: {
      type: Date,
      required: [true, "Payment date is required"],
    },
    approvalStatus: {
      type: String,
      enum: Object.values(ApprovalStatus),
      default: ApprovalStatus.PENDING,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: Date,
    rejectionComment: {
      type: String,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
    },
    taxable: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Updater is required"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Bonus", BonusSchema);
