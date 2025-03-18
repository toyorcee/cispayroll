import mongoose, { Schema, Document } from "mongoose";

export enum DeductionType {
  PERCENTAGE = "percentage",
  FIXED = "fixed",
  TAX = "tax",
  PENSION = "pension",
}

export interface IDeduction extends Document {
  name: string;
  type: DeductionType;
  value: number;
  description?: string;
  active: boolean;
  mandatory: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DeductionSchema = new Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(DeductionType),
      required: true,
    },
    value: { type: Number, required: true },
    description: { type: String },
    active: { type: Boolean, default: true },
    mandatory: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IDeduction>("Deduction", DeductionSchema);
