import mongoose from "mongoose";
const { Schema } = mongoose;

// Enums
export const ComponentType = {
  ALLOWANCE: "allowance",
  DEDUCTION: "deduction",
};

export const CalculationMethod = {
  FIXED: "fixed",
  PERCENTAGE: "percentage",
};

// Schema for salary components
const SalaryComponentSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Component name is required"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Component type is required"],
      enum: Object.values(ComponentType),
    },
    calculationMethod: {
      type: String,
      required: [true, "Calculation method is required"],
      enum: Object.values(CalculationMethod),
    },
    value: {
      type: Number,
      required: [true, "Value is required"],
      min: [0, "Value cannot be negative"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
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
  { _id: true }
);

// Schema for salary grade
const SalaryGradeSchema = new Schema(
  {
    level: {
      type: String,
      required: [true, "Grade level is required"],
      unique: true,
      trim: true,
    },
    basicSalary: {
      type: Number,
      required: [true, "Basic salary is required"],
      min: [0, "Basic salary cannot be negative"],
    },
    frequency: {
      type: String,
      enum: ["weekly", "biweekly", "monthly", "quarterly", "annual"],
      default: "monthly",
    },
    components: [SalaryComponentSchema],
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: false,
    },
    departmentName: {
      type: String,
      trim: true,
      required: false,
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
  {
    timestamps: true,
  }
);

// Methods
SalaryGradeSchema.methods.calculateTotalAllowances = function () {
  return this.components
    .filter(
      (component) =>
        component.type === ComponentType.ALLOWANCE && component.isActive
    )
    .reduce((total, component) => {
      if (component.calculationMethod === CalculationMethod.FIXED) {
        return total + component.value;
      }
      return total + (this.basicSalary * component.value) / 100;
    }, 0);
};

SalaryGradeSchema.methods.calculateTotalDeductions = function () {
  return this.components
    .filter(
      (component) =>
        component.type === ComponentType.DEDUCTION && component.isActive
    )
    .reduce((total, component) => {
      if (component.calculationMethod === CalculationMethod.FIXED) {
        return total + component.value;
      }
      return total + (this.basicSalary * component.value) / 100;
    }, 0);
};

SalaryGradeSchema.methods.calculateNetSalary = function () {
  const totalAllowances = this.calculateTotalAllowances();
  const totalDeductions = this.calculateTotalDeductions();
  return this.basicSalary + totalAllowances - totalDeductions;
};

// Indexes
SalaryGradeSchema.index({ level: 1 });
SalaryGradeSchema.index({ department: 1 });
SalaryGradeSchema.index({ isActive: 1 });
SalaryGradeSchema.index({ "components.type": 1 });

export default mongoose.model("SalaryGrade", SalaryGradeSchema);
