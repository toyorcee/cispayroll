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

export interface ILeave {
  user: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  type: LeaveType;
  reason: string;
  status: LeaveStatus;
  approvedBy?: Types.ObjectId;
  approvalDate?: Date;
  approvalNotes?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaveDocument extends Document, ILeave {}

const LeaveSchema = new Schema<LeaveDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
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
    type: {
      type: String,
      enum: Object.values(LeaveType),
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
    approvalDate: Date,
    approvalNotes: String,
    attachments: [String],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<LeaveDocument>("Leave", LeaveSchema);
