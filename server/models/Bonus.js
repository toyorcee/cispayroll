import mongoose from "mongoose";
const { Schema } = mongoose;

// Constants
export const BonusType = {
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
    description: String,
    paymentDate: {
      type: Date,
      required: [true, "Payment date is required"],
    },
    approvalStatus: {
      type: String,
      enum: Object.values(ApprovalStatus),
      default: ApprovalStatus.PENDING,
      required: [true, "Approval status is required"],
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: Date,
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

// Indexes
BonusSchema.index({ employee: 1, type: 1 });
BonusSchema.index({ department: 1 });
BonusSchema.index({ approvalStatus: 1 });

export default mongoose.model("Bonus", BonusSchema);
