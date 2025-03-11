import mongoose, { Schema, Document, Types } from "mongoose";

export enum LeaveStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export enum LeaveType {
  ANNUAL = "ANNUAL",
  SICK = "SICK",
  MATERNITY = "MATERNITY",
  PATERNITY = "PATERNITY",
  UNPAID = "UNPAID",
  OTHER = "OTHER",
}

export interface ILeave extends Document {
  employee: Types.ObjectId;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: LeaveStatus;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveSchema = new Schema<ILeave>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    leaveType: {
      type: String,
      enum: Object.values(LeaveType),
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(LeaveStatus),
      default: LeaveStatus.PENDING,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: Date,
    rejectionReason: String,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add validation for dates
LeaveSchema.pre("save", function (next) {
  if (this.startDate > this.endDate) {
    next(new Error("End date cannot be before start date"));
  }
  next();
});

// Add these indexes at the bottom before export
LeaveSchema.index({ employee: 1, startDate: 1 });
LeaveSchema.index({ status: 1 });
LeaveSchema.index({ department: 1 }); // If you track department

export default mongoose.model<ILeave>("Leave", LeaveSchema);
