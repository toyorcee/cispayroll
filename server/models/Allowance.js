import mongoose from "mongoose";
const { Schema } = mongoose;

// Constants
export const AllowanceType = {
  FIXED: "fixed",
  PERCENTAGE: "percentage",
  PERFORMANCE_BASED: "performance_based",
};

export const CalculationMethod = {
  FIXED: "fixed",
  PERCENTAGE: "percentage",
};

export const PayrollFrequency = {
  WEEKLY: "weekly",
  BIWEEKLY: "biweekly",
  MONTHLY: "monthly",
  QUARTERLY: "quarterly",
  ANNUAL: "annual",
};

const AllowanceSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Allowance name is required"],
    },
    type: {
      type: String,
      enum: Object.values(AllowanceType),
      required: [true, "Allowance type is required"],
    },
    value: {
      type: Number,
      required: [true, "Value is required"],
    },
    calculationMethod: {
      type: String,
      enum: Object.values(CalculationMethod),
      required: [true, "Calculation method is required"],
      default: CalculationMethod.FIXED,
    },
    baseAmount: Number,
    frequency: {
      type: String,
      enum: Object.values(PayrollFrequency),
      required: [true, "Frequency is required"],
      default: PayrollFrequency.MONTHLY,
    },
    description: String,
    taxable: {
      type: Boolean,
      default: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    effectiveDate: {
      type: Date,
      required: [true, "Effective date is required"],
    },
    expiryDate: Date,
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
    },
    employee: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    gradeLevel: String,
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
AllowanceSchema.index({ name: 1 });
AllowanceSchema.index({ type: 1 });
AllowanceSchema.index({ department: 1 });
AllowanceSchema.index({ employee: 1 });
AllowanceSchema.index({ active: 1 });

export default mongoose.model("Allowance", AllowanceSchema);
