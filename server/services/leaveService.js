import Leave, { LEAVE_STATUS, LEAVE_TYPE } from "../models/Leave.js";
import { Types } from "mongoose";

export class LeaveService {
  // Core leave operations
  static async createLeave(user, leaveData) {
    const leave = await Leave.create({
      user: user._id,
      ...leaveData,
      status: LEAVE_STATUS.PENDING,
    });
    return leave;
  }

  static async getUserLeaves(userId) {
    return Leave.find({ user: userId }).sort({ createdAt: -1 });
  }

  static async approveLeave(leaveId, approver, notes) {
    const leave = await Leave.findByIdAndUpdate(
      leaveId,
      {
        status: LEAVE_STATUS.APPROVED,
        approvedBy: approver._id,
        approvalDate: new Date(),
        approvalNotes: notes,
      },
      { new: true }
    );
    if (!leave) throw new Error("Leave request not found");
    return leave;
  }

  static async rejectLeave(leaveId, approver, notes) {
    const leave = await Leave.findByIdAndUpdate(
      leaveId,
      {
        status: LEAVE_STATUS.REJECTED,
        approvedBy: approver._id,
        approvalDate: new Date(),
        approvalNotes: notes,
      },
      { new: true }
    );
    if (!leave) throw new Error("Leave request not found");
    return leave;
  }

  static async cancelLeave(leaveId, userId) {
    const leave = await Leave.findOne({ _id: leaveId, user: userId });
    if (!leave) throw new Error("Leave request not found");
    if (leave.status !== LEAVE_STATUS.PENDING) {
      throw new Error("Only pending leaves can be cancelled");
    }

    leave.status = LEAVE_STATUS.CANCELLED;
    await leave.save();
    return leave;
  }
}
