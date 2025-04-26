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

const AllowanceSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Allowance name is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["TRANSPORT", "HOUSING", "MEAL", "MEDICAL", "OTHER"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    rejectedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    documents: [
      {
        name: String,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    employee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    calculationMethod: {
      type: String,
      enum: Object.values(CalculationMethod),
      required: [true, "Calculation method is required"],
      default: CalculationMethod.FIXED,
    },
    baseAmount: {
      type: Number,
      required: function () {
        return this.calculationMethod === CalculationMethod.PERCENTAGE;
      },
      min: [0, "Base amount cannot be negative"],
    },
    frequency: {
      type: String,
      enum: Object.values(PayrollFrequency),
      required: [true, "Frequency is required"],
      default: PayrollFrequency.MONTHLY,
    },
    taxable: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    effectiveDate: {
      type: Date,
      required: [true, "Effective date is required"],
    },
    expiryDate: Date,
    // Reference to salary grade
    salaryGrade: {
      type: Schema.Types.ObjectId,
      ref: "SalaryGrade",
      required: [true, "Salary grade is required"],
    },
    // Scope of the allowance
    scope: {
      type: String,
      enum: ["department", "grade", "individual"],
      required: [true, "Scope is required"],
    },
    // Department reference for department-wide allowances
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: function () {
        return this.scope === "department";
      },
    },
    // Priority level for calculation order
    priority: {
      type: Number,
      enum: Object.values(AllowancePriority),
      required: [true, "Priority is required"],
      default: function () {
        switch (this.scope) {
          case "department":
            return AllowancePriority.DEPARTMENT;
          case "grade":
            return AllowancePriority.GRADE;
          case "individual":
            return AllowancePriority.INDIVIDUAL;
          default:
            return AllowancePriority.DEPARTMENT;
        }
      },
    },
    // For performance-based allowances
    performanceRating: {
      type: Number,
      min: [0, "Rating cannot be negative"],
      max: [5, "Rating cannot exceed 5"],
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
    attachments: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

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
