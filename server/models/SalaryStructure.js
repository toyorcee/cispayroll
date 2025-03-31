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

export const PayrollFrequency = {
  WEEKLY: "weekly",
  BIWEEKLY: "biweekly",
  MONTHLY: "monthly",
  QUARTERLY: "quarterly",
  ANNUAL: "annual",
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
    components: [SalaryComponentSchema],
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
SalaryGradeSchema.methods.calculateGrossSalary = async function (
  employeeId,
  startDate,
  endDate
) {
  // Get all applicable allowances for this employee
  const Allowance = mongoose.model("Allowance");
  const allowances = await Allowance.getEmployeeAllowances(
    employeeId,
    this._id,
    this.department,
    startDate,
    endDate
  );

  // Calculate total allowances
  const totalAllowances = allowances.reduce((total, allowance) => {
    return total + allowance.calculateValue(this.basicSalary);
  }, 0);

  return this.basicSalary + totalAllowances;
};

SalaryGradeSchema.methods.calculateNetSalary = async function (
  employeeId,
  startDate,
  endDate,
  deductions
) {
  const grossSalary = await this.calculateGrossSalary(
    employeeId,
    startDate,
    endDate
  );

  // Calculate total deductions
  const totalDeductions = deductions.reduce((total, deduction) => {
    if (deduction.calculationMethod === CalculationMethod.FIXED) {
      return total + deduction.value;
    }
    return total + (grossSalary * deduction.value) / 100;
  }, 0);

  return grossSalary - totalDeductions;
};

// Static method to get salary details for an employee
SalaryGradeSchema.statics.getEmployeeSalaryDetails = async function (
  employeeId,
  departmentId,
  startDate,
  endDate
) {
  // Find the employee's salary grade
  const salaryGrade = await this.findOne({
    department: departmentId,
    isActive: true,
  });

  if (!salaryGrade) {
    throw new Error("No active salary grade found for this department");
  }

  // Get all applicable allowances
  const Allowance = mongoose.model("Allowance");
  const allowances = await Allowance.getEmployeeAllowances(
    employeeId,
    salaryGrade._id,
    departmentId,
    startDate,
    endDate
  );

  // Calculate gross salary
  const grossSalary = await salaryGrade.calculateGrossSalary(
    employeeId,
    startDate,
    endDate
  );

  // Get deductions (you'll need to implement this based on your Deduction model)
  const Deduction = mongoose.model("Deduction");
  const deductions = await Deduction.find({
    employee: employeeId,
    isActive: true,
    effectiveDate: { $lte: endDate },
    $or: [{ expiryDate: null }, { expiryDate: { $gte: startDate } }],
  });

  // Calculate net salary
  const netSalary = await salaryGrade.calculateNetSalary(
    employeeId,
    startDate,
    endDate,
    deductions
  );

  return {
    salaryGrade,
    basicSalary: salaryGrade.basicSalary,
    allowances,
    deductions,
    grossSalary,
    netSalary,
    calculationPeriod: {
      startDate,
      endDate,
    },
  };
};

// Indexes
SalaryGradeSchema.index({ level: 1 });
SalaryGradeSchema.index({ department: 1 });
SalaryGradeSchema.index({ isActive: 1 });
SalaryGradeSchema.index({ "defaultAllowances.name": 1 });

export default mongoose.model("SalaryGrade", SalaryGradeSchema);
