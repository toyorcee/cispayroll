import mongoose, { Schema, Document, Types } from "mongoose";

export enum AllowanceType {
  FIXED = "fixed",
  PERCENTAGE = "percentage",
  PERFORMANCE_BASED = "performance_based",
}

export enum AllowanceFrequency {
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  ANNUAL = "annual",
  ONE_TIME = "one_time",
}

export interface IAllowance extends Document {
  _id: Types.ObjectId;
  name: string;
  type: AllowanceType;
  value: number;
  frequency: AllowanceFrequency;
  description?: string;
  taxable?: boolean;
  active?: boolean;
  effectiveDate: Date;
  expiryDate?: Date;
  department?: Types.ObjectId;
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
    frequency: {
      type: String,
      enum: Object.values(AllowanceFrequency),
      required: true,
      default: AllowanceFrequency.MONTHLY,
    },
    description: { type: String },
    taxable: { type: Boolean, default: true },
    effectiveDate: { type: Date, required: true },
    expiryDate: { type: Date },
    department: { type: Schema.Types.ObjectId, ref: "Department" },
    gradeLevel: { type: String },
    active: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IAllowance>("Allowance", AllowanceSchema);
