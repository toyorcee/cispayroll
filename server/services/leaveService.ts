import Leave, {
  LeaveDocument,
  LeaveStatus,
  LeaveType,
} from "../models/Leave.js";
import { UserDocument } from "../models/User.js";
import { Types } from "mongoose";

export interface CreateLeaveRequest {
  startDate: Date;
  endDate: Date;
  type: LeaveType;
  reason: string;
  attachments?: string[];
}

export class LeaveService {
  static async createLeave(
    user: UserDocument,
    leaveData: CreateLeaveRequest
  ): Promise<LeaveDocument> {
    const leave = await Leave.create({
      user: user._id,
      ...leaveData,
      status: LeaveStatus.PENDING,
    });
    return leave;
  }

  static async getUserLeaves(userId: Types.ObjectId): Promise<LeaveDocument[]> {
    return Leave.find({ user: userId }).sort({ createdAt: -1 });
  }

  static async approveLeave(
    leaveId: Types.ObjectId,
    approver: UserDocument,
    notes?: string
  ): Promise<LeaveDocument> {
    const leave = await Leave.findByIdAndUpdate(
      leaveId,
      {
        status: LeaveStatus.APPROVED,
        approvedBy: approver._id,
        approvalDate: new Date(),
        approvalNotes: notes,
      },
      { new: true }
    );
    if (!leave) throw new Error("Leave request not found");
    return leave;
  }

  static async rejectLeave(
    leaveId: Types.ObjectId,
    approver: UserDocument,
    notes?: string
  ): Promise<LeaveDocument> {
    const leave = await Leave.findByIdAndUpdate(
      leaveId,
      {
        status: LeaveStatus.REJECTED,
        approvedBy: approver._id,
        approvalDate: new Date(),
        approvalNotes: notes,
      },
      { new: true }
    );
    if (!leave) throw new Error("Leave request not found");
    return leave;
  }

  static async cancelLeave(
    leaveId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<LeaveDocument> {
    const leave = await Leave.findOne({ _id: leaveId, user: userId });
    if (!leave) throw new Error("Leave request not found");
    if (leave.status !== LeaveStatus.PENDING) {
      throw new Error("Only pending leaves can be cancelled");
    }

    leave.status = LeaveStatus.CANCELLED;
    await leave.save();
    return leave;
  }
}
