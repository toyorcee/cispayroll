import mongoose, { Schema, Document, Types } from "mongoose";

export enum BonusType {
  PERFORMANCE = "performance",
  THIRTEENTH_MONTH = "thirteenth_month",
  SPECIAL = "special",
  ACHIEVEMENT = "achievement",
  RETENTION = "retention",
  PROJECT = "project",
}

export interface IBonus extends Document {
  employee: Types.ObjectId;
  type: BonusType;
  amount: number;
  description?: string;
  paymentDate: Date;
  approvalStatus: "pending" | "approved" | "rejected";
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  department?: Types.ObjectId;
  taxable: boolean;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BonusSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: Object.values(BonusType),
      required: true,
    },
    amount: { type: Number, required: true },
    description: { type: String },
    paymentDate: { type: Date, required: true },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    department: { type: Schema.Types.ObjectId, ref: "Department" },
    taxable: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IBonus>("Bonus", BonusSchema);
