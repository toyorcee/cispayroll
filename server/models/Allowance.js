import mongoose from "mongoose";
const { Schema } = mongoose;

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

export const AllowanceStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

export const AllowancePriority = {
  DEPARTMENT: 1, // Department-wide allowances
  GRADE: 2, // Grade-specific allowances
  INDIVIDUAL: 3, // Individual allowances
};

const AllowanceSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  reason: { type: String, required: true },
  paymentDate: { type: Date, required: true },
  department: { type: Schema.Types.ObjectId, ref: "Department" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  approvalStatus: { type: String, default: "approved" },
  approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  approvedAt: { type: Date },
});

// Methods
AllowanceSchema.methods.calculateValue = function (baseSalary) {
  if (this.calculationMethod === CalculationMethod.FIXED) {
    return this.amount;
  }
  return (baseSalary * this.amount) / 100;
};

AllowanceSchema.methods.isValidForPeriod = function (startDate, endDate) {
  return (
    this.isActive &&
    this.status === AllowanceStatus.APPROVED &&
    this.effectiveDate <= endDate &&
    (!this.expiryDate || this.expiryDate >= startDate)
  );
};

// Static method to get all valid allowances for an employee
AllowanceSchema.statics.getEmployeeAllowances = async function (
  employeeId,
  salaryGradeId,
  departmentId,
  startDate,
  endDate
) {
  // Get department-wide allowances
  const departmentAllowances = await this.find({
    scope: "department",
    department: departmentId,
    salaryGrade: salaryGradeId,
    isActive: true,
    status: AllowanceStatus.APPROVED,
    effectiveDate: { $lte: endDate },
    $or: [{ expiryDate: null }, { expiryDate: { $gte: startDate } }],
  }).sort({ priority: 1 });

  // Get grade-specific allowances
  const gradeAllowances = await this.find({
    scope: "grade",
    salaryGrade: salaryGradeId,
    isActive: true,
    status: AllowanceStatus.APPROVED,
    effectiveDate: { $lte: endDate },
    $or: [{ expiryDate: null }, { expiryDate: { $gte: startDate } }],
  }).sort({ priority: 1 });

  // Get individual allowances
  const individualAllowances = await this.find({
    scope: "individual",
    employee: employeeId,
    salaryGrade: salaryGradeId,
    isActive: true,
    status: AllowanceStatus.APPROVED,
    effectiveDate: { $lte: endDate },
    $or: [{ expiryDate: null }, { expiryDate: { $gte: startDate } }],
  }).sort({ priority: 1 });

  // Combine all allowances, with individual allowances taking precedence
  const allAllowances = [
    ...departmentAllowances,
    ...gradeAllowances,
    ...individualAllowances,
  ];

  // Remove duplicates based on name, keeping the highest priority (individual) version
  const uniqueAllowances = allAllowances.reduce((acc, current) => {
    const existingIndex = acc.findIndex((a) => a.name === current.name);
    if (
      existingIndex === -1 ||
      acc[existingIndex].priority < current.priority
    ) {
      if (existingIndex !== -1) {
        acc.splice(existingIndex, 1);
      }
      acc.push(current);
    }
    return acc;
  }, []);

  return uniqueAllowances;
};

// Virtual for formatted amount
AllowanceSchema.virtual("formattedAmount").get(function () {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(this.amount);
});

// Pre-save validation
AllowanceSchema.pre("save", function (next) {
  if (
    this.calculationMethod === CalculationMethod.PERCENTAGE &&
    !this.baseAmount
  ) {
    next(
      new Error("Base amount is required for percentage-based calculations")
    );
  }
  if (this.scope === "department" && !this.department) {
    next(new Error("Department is required for department-wide allowances"));
  }
  if (this.scope === "individual" && !this.employee) {
    next(new Error("Employee is required for individual allowances"));
  }
  const currentDate = new Date();
  if (
    this.year < currentDate.getFullYear() - 1 ||
    this.year > currentDate.getFullYear() + 1
  ) {
    next(new Error("Invalid year"));
  }
  next();
});

export default mongoose.model("Allowance", AllowanceSchema);