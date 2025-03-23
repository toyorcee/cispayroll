import mongoose, { Schema, Document, Types } from "mongoose";
import { PayrollFrequency } from "../types/payroll.js";

export enum AllowanceType {
  FIXED = "fixed",
  PERCENTAGE = "percentage",
  PERFORMANCE_BASED = "performance_based",
}

export interface IAllowance extends Document {
  _id: Types.ObjectId;
  name: string;
  type: AllowanceType;
  value: number;
  calculationMethod: "fixed" | "percentage";
  baseAmount?: number;
  frequency: PayrollFrequency;
  description?: string;
  taxable?: boolean;
  active?: boolean;
  effectiveDate: Date;
  expiryDate?: Date;
  department?: Types.ObjectId;
  employee?: Types.ObjectId;
  gradeLevel?: string;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AllowanceSchema = new Schema<IAllowance>(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(AllowanceType),
      required: true,
    },
    value: { type: Number, required: true },
    calculationMethod: {
      type: String,
      enum: ["fixed", "percentage"],
      required: true,
      default: "fixed",
    },
    baseAmount: { type: Number },
    frequency: {
      type: String,
      enum: Object.values(PayrollFrequency),
      required: true,
      default: PayrollFrequency.MONTHLY,
    },
    description: { type: String },
    taxable: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
    effectiveDate: { type: Date, required: true },
    expiryDate: { type: Date },
    department: { type: Schema.Types.ObjectId, ref: "Department" },
    employee: { type: Schema.Types.ObjectId, ref: "User" },
    gradeLevel: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IAllowance>("Allowance", AllowanceSchema);
