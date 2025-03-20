import mongoose, { Schema, Document, Types } from "mongoose";

// Enum for deduction types
export enum DeductionType {
  STATUTORY = "statutory",
  VOLUNTARY = "voluntary",
}

// Enum for calculation methods
export enum CalculationMethod {
  FIXED = "fixed",
  PERCENTAGE = "percentage",
  PROGRESSIVE = "progressive", // For PAYE tax brackets
}

// Interface for tax bracket (used for PAYE)
export interface TaxBracket {
  min: number;
  max: number | null; // null for the highest bracket
  rate: number; // Percentage
}

// Main deduction interface
export interface IDeduction extends Document {
  name: string;
  type: DeductionType;
  description?: string;
  calculationMethod: CalculationMethod;
  value: number; // Percentage or fixed amount
  taxBrackets?: TaxBracket[]; // Only for PAYE
  isActive: boolean;
  effectiveDate: Date;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Schema for tax brackets
const TaxBracketSchema = new Schema<TaxBracket>(
  {
    min: { type: Number, required: true },
    max: { type: Number, default: null },
    rate: { type: Number, required: true },
  },
  { _id: false }
);

// Main deduction schema
const DeductionSchema = new Schema<IDeduction>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: Object.values(DeductionType),
      required: true,
    },
    description: {
      type: String,
    },
    calculationMethod: {
      type: String,
      enum: Object.values(CalculationMethod),
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    taxBrackets: {
      type: [TaxBracketSchema],
      default: undefined,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    effectiveDate: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
DeductionSchema.index({ name: 1 }, { unique: true });
DeductionSchema.index({ type: 1 });
DeductionSchema.index({ isActive: 1 });

export default mongoose.model<IDeduction>("Deduction", DeductionSchema);
