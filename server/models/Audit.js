import mongoose from "mongoose";
const { Schema } = mongoose;

export const AuditAction = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  PROCESS: "PROCESS",
  APPROVE: "APPROVE",
  REJECT: "REJECT",
  SUBMIT: "SUBMIT",
  VIEW: "VIEW",
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  OTHER: "OTHER",
};

export const AuditEntity = {
  PAYROLL: "PAYROLL",
  PAYMENT: "PAYMENT",
  USER: "USER",
  DEPARTMENT: "DEPARTMENT",
  DEDUCTION: "DEDUCTION",
  ALLOWANCE: "ALLOWANCE",
  BONUS: "BONUS",
  LEAVE: "LEAVE",
  SYSTEM: "SYSTEM",
  OTHER: "OTHER",
};

const AuditSchema = new Schema(
  {
    action: {
      type: String,
      enum: Object.values(AuditAction),
      required: true,
    },
    entity: {
      type: String,
      enum: Object.values(AuditEntity),
      required: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    details: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    ipAddress: String,
    userAgent: String,
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
AuditSchema.index({ action: 1 });
AuditSchema.index({ entity: 1 });
AuditSchema.index({ entityId: 1 });
AuditSchema.index({ performedBy: 1 });
AuditSchema.index({ createdAt: 1 });

export default mongoose.model("Audit", AuditSchema);
