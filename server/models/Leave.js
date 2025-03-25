import mongoose from "mongoose";
const { Schema } = mongoose;

// Define the constants first
export const LEAVE_TYPE = {
  ANNUAL: "annual",
  SICK: "sick",
  MATERNITY: "maternity",
  PATERNITY: "paternity",
  STUDY: "study",
  UNPAID: "unpaid",
  OTHER: "other",
};

export const LEAVE_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
};

const LeaveSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User is required"],
  },
  type: {
    type: String,
    enum: Object.values(LEAVE_TYPE),
    required: [true, "Leave type is required"],
  },
  startDate: {
    type: Date,
    required: [true, "Start date is required"],
  },
  endDate: {
    type: Date,
    required: [true, "End date is required"],
  },
  reason: {
    type: String,
    required: [true, "Reason is required"],
  },
  status: {
    type: String,
    enum: Object.values(LEAVE_STATUS),
    default: LEAVE_STATUS.PENDING,
  },
  attachments: [String],
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  approvalDate: Date,
  approvalNotes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add validation for dates
LeaveSchema.pre("save", function (next) {
  if (this.startDate > this.endDate) {
    next(new Error("End date cannot be before start date"));
  }
  next();
});

// Indexes
LeaveSchema.index({ user: 1, startDate: 1 });
LeaveSchema.index({ status: 1 });
LeaveSchema.index({ department: 1 });

export default mongoose.model("Leave", LeaveSchema);
