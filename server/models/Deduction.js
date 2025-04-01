import mongoose from "mongoose";
const { Schema } = mongoose;

// Constants
export const DeductionType = {
  STATUTORY: "STATUTORY",
  VOLUNTARY: "VOLUNTARY",
};

// Add new enum for core statutory deductions
export const CoreStatutoryDeduction = {
  PAYE: "PAYE Tax",
  PENSION: "Pension",
  NHF: "NHF",
};

export const CalculationMethod = {
  FIXED: "fixed",
  PERCENTAGE: "percentage",
  PROGRESSIVE: "progressive",
};

export const ApplicabilityType = {
  GLOBAL: "global",
  INDIVIDUAL: "individual",
};

export const DeductionCategory = {
  TAX: "tax",
  PENSION: "pension",
  HOUSING: "housing",
  LOAN: "loan",
  TRANSPORT: "transport",
  COOPERATIVE: "cooperative",
  GENERAL: "general",
  OTHER: "other",
};

export const DeductionScope = {
  COMPANY_WIDE: "company_wide",
  DEPARTMENT: "department",
  INDIVIDUAL: "individual",
};

export const AssignmentAction = {
  ASSIGNED: "ASSIGNED",
  REMOVED: "REMOVED",
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
    isCustom: {
      type: Boolean,
      default: false,
    },
    applicability: {
      type: String,
      enum: Object.values(ApplicabilityType),
      default: function () {
        return this.type === DeductionType.STATUTORY
          ? ApplicabilityType.GLOBAL
          : ApplicabilityType.INDIVIDUAL;
      },
    },
    assignedEmployees: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: function () {
        return this.type === DeductionType.VOLUNTARY ? [] : undefined;
      },
    },
    category: {
      type: String,
      enum: Object.values(DeductionCategory),
      default: DeductionCategory.GENERAL,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: function () {
        return this.scope === DeductionScope.DEPARTMENT;
      },
    },
    scope: {
      type: String,
      enum: Object.values(DeductionScope),
      default: DeductionScope.COMPANY_WIDE,
      required: true,
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
    assignmentHistory: [
      {
        employee: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        action: {
          type: String,
          enum: Object.values(AssignmentAction),
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        by: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        reason: String, // Optional reason for the change
      },
    ],
    isMandatory: {
      type: Boolean,
      default: function () {
        // PAYE, Pension, and NHF are mandatory by default
        return [
          CoreStatutoryDeduction.PAYE,
          CoreStatutoryDeduction.PENSION,
          CoreStatutoryDeduction.NHF,
        ].includes(this.name);
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add virtual for assigned employees count
DeductionSchema.virtual("assignedEmployeesCount").get(function () {
  return this.assignedEmployees?.length || 0;
});

// Pre-save middleware to enforce business rules
DeductionSchema.pre("save", function (next) {
  // If statutory, ensure it's global
  if (this.type === DeductionType.STATUTORY) {
    this.applicability = ApplicabilityType.GLOBAL;
  }

  // If global, clear assignedEmployees
  if (this.applicability === ApplicabilityType.GLOBAL) {
    this.assignedEmployees = undefined;
  }

  // Set appropriate category for default statutory deductions
  if (this.type === DeductionType.STATUTORY && !this.isCustom) {
    if (this.name === "PAYE Tax") this.category = DeductionCategory.TAX;
    else if (this.name === "Pension") this.category = DeductionCategory.PENSION;
    else if (this.name === "NHF") this.category = DeductionCategory.HOUSING;
  }

  next();
});

// Indexes
DeductionSchema.index({ name: 1 }, { unique: true });
DeductionSchema.index({ type: 1 });
DeductionSchema.index({ isActive: 1 });
DeductionSchema.index({ applicability: 1 });
DeductionSchema.index({ assignedEmployees: 1 });
DeductionSchema.index({ category: 1 });
DeductionSchema.index({ type: 1, isCustom: 1 });

export default mongoose.model("Deduction", DeductionSchema);
