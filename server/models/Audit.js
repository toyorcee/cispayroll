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
  TOGGLE: "TOGGLE",
  TOGGLE_STATUS: "TOGGLE_STATUS",
  ASSIGN: "ASSIGN",
  REMOVE: "REMOVE",
  TRANSFER: "TRANSFER",
  ARCHIVE: "ARCHIVE",
  RESTORE: "RESTORE",
  PAYMENT_PROCESSED: "PAYMENT_PROCESSED",
  PAYSLIP_SENT: "PAYSLIP_SENT",
  BATCH_OPERATION: "BATCH_OPERATION",
  REPORT_GENERATED: "REPORT_GENERATED",
  REPORT_DOWNLOADED: "REPORT_DOWNLOADED",
  REPORT_EMAILED: "REPORT_EMAILED",
  REPORT_VIEWED: "REPORT_VIEWED",
  OTHER: "OTHER",
};

export const AuditEntity = {
  PAYROLL: "PAYROLL",
  PAYMENT: "PAYMENT",
  USER: "USER",
  EMPLOYEE: "EMPLOYEE",
  DEPARTMENT: "DEPARTMENT",
  DEDUCTION: "DEDUCTION",
  ALLOWANCE: "ALLOWANCE",
  BONUS: "BONUS",
  LEAVE: "LEAVE",
  SALARY_GRADE: "SALARY_GRADE",
  SALARY_COMPONENT: "SALARY_COMPONENT",
  SYSTEM: "SYSTEM",
  REPORT: "REPORT",
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

export default mongoose.model("Audit", AuditSchema);
