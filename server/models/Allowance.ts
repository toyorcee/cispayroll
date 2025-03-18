import mongoose, { Schema, Document } from "mongoose";

export enum AllowanceType {
  PERCENTAGE = "percentage",
  FIXED = "fixed",
}

export interface IAllowance extends Document {
  name: string;
  type: AllowanceType;
  value: number;
  description?: string;
  active: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AllowanceSchema = new Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(AllowanceType),
      required: true,
    },
    value: { type: Number, required: true },
    description: { type: String },
    active: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IAllowance>("Allowance", AllowanceSchema);
