import mongoose from "mongoose";
const { Schema } = mongoose;

// Constants
export const DeductionType = {
  STATUTORY: "statutory",
  VOLUNTARY: "voluntary",
};

export const CalculationMethod = {
  FIXED: "fixed",
  PERCENTAGE: "percentage",
  PROGRESSIVE: "progressive",
};

// Schema for tax brackets
const TaxBracketSchema = new Schema(
  {
    min: { type: Number, required: true },
    max: { type: Number, default: null },
    rate: { type: Number, required: true },
  },
  { _id: false }
);

// Main deduction schema
const DeductionSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Deduction name is required"],
      unique: true,
    },
    type: {
      type: String,
      enum: Object.values(DeductionType),
      required: [true, "Deduction type is required"],
    },
    description: String,
    calculationMethod: {
      type: String,
      enum: Object.values(CalculationMethod),
      required: [true, "Calculation method is required"],
    },
    value: {
      type: Number,
      required: [true, "Value is required"],
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
      required: [true, "Creator is required"],
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Updater is required"],
    },
  },
  { timestamps: true }
);

// Indexes
DeductionSchema.index({ name: 1 }, { unique: true });
DeductionSchema.index({ type: 1 });
DeductionSchema.index({ isActive: 1 });

export default mongoose.model("Deduction", DeductionSchema);
