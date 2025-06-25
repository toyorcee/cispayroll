import mongoose from "mongoose";
const { Schema } = mongoose;

// Constants
export const DeductionType = {
  STATUTORY: "STATUTORY",
  VOLUNTARY: "VOLUNTARY",
};

// Core statutory deductions that are mandatory
export const CoreStatutoryDeduction = {
  PAYE: "PAYE Tax",
  PENSION: "Pension",
  NHF: "NHF",
};

export const CalculationMethod = {
  FIXED: "FIXED",
  PERCENTAGE: "PERCENTAGE",
  PROGRESSIVE: "PROGRESSIVE",
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

// Simplified scope - this determines who the deduction applies to
export const DeductionScope = {
  COMPANY_WIDE: "company_wide", // Everyone in the company
  DEPARTMENT: "department", // Specific department only
  INDIVIDUAL: "individual", // Specific employees only
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
    // Scope determines who this deduction applies to
    scope: {
      type: String,
      enum: Object.values(DeductionScope),
      default: DeductionScope.COMPANY_WIDE,
      required: true,
    },
    // For department-specific deductions
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: function () {
        return this.scope === DeductionScope.DEPARTMENT;
      },
    },
    // For individual-specific deductions
    assignedEmployees: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: function () {
        return this.scope === DeductionScope.INDIVIDUAL ? [] : undefined;
      },
    },
    category: {
      type: String,
      enum: Object.values(DeductionCategory),
      default: DeductionCategory.GENERAL,
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
    // Track assignment history for audit
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
        reason: String,
      },
    ],
    // Core statutory deductions are mandatory
    isMandatory: {
      type: Boolean,
      default: function () {
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
  // Statutory deductions are always company-wide
  if (this.type === DeductionType.STATUTORY) {
    this.scope = DeductionScope.COMPANY_WIDE;
    this.assignedEmployees = undefined;
  }

  // Set appropriate category for default statutory deductions
  if (this.type === DeductionType.STATUTORY) {
    if (this.name === "PAYE Tax") this.category = DeductionCategory.TAX;
    else if (this.name === "Pension") this.category = DeductionCategory.PENSION;
    else if (this.name === "NHF") this.category = DeductionCategory.HOUSING;
  }

  // Clear assignedEmployees if not individual scope
  if (this.scope !== DeductionScope.INDIVIDUAL) {
    this.assignedEmployees = undefined;
  }

  // Clear department if not department scope
  if (this.scope !== DeductionScope.DEPARTMENT) {
    this.department = undefined;
  }

  next();
});

export default mongoose.model("Deduction", DeductionSchema);
