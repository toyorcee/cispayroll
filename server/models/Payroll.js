import mongoose from "mongoose";
const { Schema } = mongoose;

// Constants
export const PAYROLL_STATUS = {
  DRAFT: "DRAFT", // Initial state when creating payroll
  PENDING: "PENDING", // Submitted for approval
  PROCESSING: "PROCESSING", // Being reviewed by admin
  APPROVED: "APPROVED", // Approved by admin
  REJECTED: "REJECTED", // Rejected by admin
  PAID: "PAID", // Payment processed
  CANCELLED: "CANCELLED", // Cancelled by admin
  FAILED: "FAILED", // Payment failed
  ARCHIVED: "ARCHIVED", // Archived after completion
};

export const PayrollFrequency = {
  WEEKLY: "weekly",
  BIWEEKLY: "biweekly",
  MONTHLY: "monthly",
  QUARTERLY: "quarterly",
  ANNUAL: "annual",
};

// Approval levels and related constants
export const APPROVAL_LEVELS = {
  DEPARTMENT_HEAD: "DEPARTMENT_HEAD",
  HR_MANAGER: "HR_MANAGER",
  FINANCE_DIRECTOR: "FINANCE_DIRECTOR",
  SUPER_ADMIN: "SUPER_ADMIN",
};

export const APPROVAL_ORDER = [
  APPROVAL_LEVELS.DEPARTMENT_HEAD,
  APPROVAL_LEVELS.HR_MANAGER,
  APPROVAL_LEVELS.FINANCE_DIRECTOR,
  APPROVAL_LEVELS.SUPER_ADMIN,
];

// Helper function to get next approval level
export const getNextApprovalLevel = (currentLevel) => {
  const currentIndex = APPROVAL_ORDER.indexOf(currentLevel);
  if (currentIndex === -1 || currentIndex === APPROVAL_ORDER.length - 1) {
    return null;
  }
  return APPROVAL_ORDER[currentIndex + 1];
};

// Schema Definition
const PayrollSchema = new Schema(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Employee is required"],
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
    },
    salaryGrade: {
      type: Schema.Types.ObjectId,
      ref: "SalaryGrade",
      required: [true, "Salary grade is required"],
    },
    month: {
      type: Number,
      required: [true, "Month is required"],
      min: [1, "Month must be between 1 and 12"],
      max: [12, "Month must be between 1 and 12"],
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
    },
    basicSalary: {
      type: Number,
      required: [true, "Basic salary is required"],
      min: [0, "Basic salary cannot be negative"],
    },
    components: [
      {
        name: { type: String, required: [true, "Component name is required"] },
        type: { type: String, required: [true, "Component type is required"] },
        value: {
          type: Number,
          required: [true, "Component value is required"],
        },
        amount: {
          type: Number,
          required: [true, "Component amount is required"],
        },
      },
    ],
    earnings: {
      overtime: {
        hours: { type: Number, default: 0 },
        rate: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
      },
      bonus: [
        {
          description: {
            type: String,
            required: [true, "Bonus description is required"],
          },
          amount: {
            type: Number,
            required: [true, "Bonus amount is required"],
          },
        },
      ],
      totalEarnings: {
        type: Number,
        required: [true, "Total earnings is required"],
      },
    },
    deductions: {
      tax: {
        taxableAmount: { type: Number, default: 0 },
        taxRate: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
      },
      pension: {
        pensionableAmount: { type: Number, default: 0 },
        rate: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
      },
      nhf: {
        pensionableAmount: { type: Number, default: 0 },
        rate: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
      },
      loans: [
        {
          description: {
            type: String,
            required: [true, "Loan description is required"],
          },
          amount: { type: Number, required: [true, "Loan amount is required"] },
        },
      ],
      others: [
        {
          description: {
            type: String,
            required: [true, "Deduction description is required"],
          },
          amount: {
            type: Number,
            required: [true, "Deduction amount is required"],
          },
        },
      ],
      departmentSpecific: [
        {
          name: {
            type: String,
            required: [true, "Deduction name is required"],
          },
          type: {
            type: String,
            enum: ["STATUTORY", "VOLUNTARY"],
            required: [true, "Deduction type is required"],
          },
          description: String,
          amount: {
            type: Number,
            required: [true, "Deduction amount is required"],
          },
          calculationMethod: {
            type: String,
            enum: ["FIXED", "PERCENTAGE", "PROGRESSIVE"],
            required: [true, "Calculation method is required"],
          },
        },
      ],
      totalDeductions: {
        type: Number,
        required: [true, "Total deductions is required"],
      },
    },
    totals: {
      basicSalary: {
        type: Number,
        required: [true, "Basic salary total is required"],
      },
      totalAllowances: {
        type: Number,
        required: [true, "Total allowances is required"],
      },
      totalBonuses: {
        type: Number,
        required: [true, "Total bonuses is required"],
      },
      grossEarnings: {
        type: Number,
        required: [true, "Gross earnings is required"],
      },
      totalDeductions: {
        type: Number,
        required: [true, "Total deductions is required"],
      },
      netPay: { type: Number, required: [true, "Net pay is required"] },
    },
    status: {
      type: String,
      enum: Object.values(PAYROLL_STATUS),
      default: PAYROLL_STATUS.DRAFT,
      required: [true, "Status is required"],
    },
    // Enhanced approval flow with multi-level support
    approvalFlow: {
      // Current approval level
      currentLevel: {
        type: String,
        enum: Object.values(APPROVAL_LEVELS),
      },
      // History of all approval actions
      history: [
        {
          level: {
            type: String,
            enum: Object.values(APPROVAL_LEVELS),
            required: true,
          },
          status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED"],
            required: true,
          },
          action: {
            type: String,
            enum: ["SUBMIT", "APPROVE", "REJECT", "RETURN"],
            required: true,
          },
          user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          timestamp: {
            type: Date,
            default: Date.now,
          },
          remarks: String,
        },
      ],
      // Legacy fields for backward compatibility
      submittedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      submittedAt: Date,
      processingStartedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      processingStartedAt: Date,
      approvedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      approvedAt: Date,
      rejectedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      rejectedAt: Date,
      cancelledBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      cancelledAt: Date,
      paidBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      paidAt: Date,
      failedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      failedAt: Date,
      archivedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      archivedAt: Date,
      remarks: String,
    },
    payment: {
      bankName: { type: String, required: [true, "Bank name is required"] },
      accountNumber: {
        type: String,
        required: [true, "Account number is required"],
      },
      accountName: {
        type: String,
        required: [true, "Account name is required"],
      },
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Processor is required"],
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
    comments: String,
    frequency: {
      type: String,
      enum: Object.values(PayrollFrequency),
      default: PayrollFrequency.MONTHLY,
      required: [true, "Frequency is required"],
    },
    periodStart: {
      type: Date,
      required: [true, "Period start date is required"],
    },
    periodEnd: {
      type: Date,
      required: [true, "Period end date is required"],
    },
    allowances: {
      gradeAllowances: [
        {
          name: {
            type: String,
            required: [true, "Allowance name is required"],
          },
          type: {
            type: String,
            required: [true, "Allowance type is required"],
          },
          value: {
            type: Number,
            required: [true, "Allowance value is required"],
          },
          amount: {
            type: Number,
            required: [true, "Allowance amount is required"],
          },
        },
      ],
      additionalAllowances: [
        {
          name: {
            type: String,
            required: [true, "Additional allowance name is required"],
          },
          type: {
            type: String,
            required: [true, "Additional allowance type is required"],
          },
          value: {
            type: Number,
            required: [true, "Additional allowance value is required"],
          },
          amount: {
            type: Number,
            required: [true, "Additional allowance amount is required"],
          },
          frequency: {
            type: String,
            required: [true, "Additional allowance frequency is required"],
          },
        },
      ],
      totalAllowances: {
        type: Number,
        required: [true, "Total allowances is required"],
      },
    },
    bonuses: {
      items: [
        {
          type: { type: String, required: [true, "Bonus type is required"] },
          description: {
            type: String,
            required: [true, "Bonus description is required"],
          },
          amount: {
            type: Number,
            required: [true, "Bonus amount is required"],
          },
        },
      ],
      totalBonuses: {
        type: Number,
        required: [true, "Total bonuses is required"],
      },
    },
  },
  {
    timestamps: true,
  }
);

// Methods
PayrollSchema.methods.calculateTotals = function () {
  // Calculate earnings
  const overtimeEarnings = this.earnings.overtime.amount;
  const bonusEarnings = this.earnings.bonus.reduce(
    (sum, bonus) => sum + bonus.amount,
    0
  );
  const totalEarnings = overtimeEarnings + bonusEarnings;

  // Calculate deductions
  const taxDeductions = this.deductions.tax.amount;
  const pensionDeductions = this.deductions.pension.amount;
  const nhfDeductions = this.deductions.nhf?.amount || 0;
  const loanDeductions = this.deductions.loans.reduce(
    (sum, loan) => sum + loan.amount,
    0
  );
  const otherDeductions = this.deductions.others.reduce(
    (sum, other) => sum + other.amount,
    0
  );
  const departmentSpecificDeductions =
    this.deductions.departmentSpecific.reduce(
      (sum, deduction) => sum + deduction.amount,
      0
    );
  const totalDeductions =
    taxDeductions +
    pensionDeductions +
    nhfDeductions +
    loanDeductions +
    otherDeductions +
    departmentSpecificDeductions;

  // Update totals
  this.totals = {
    basicSalary: this.basicSalary,
    totalAllowances: this.allowances.totalAllowances,
    totalBonuses: this.bonuses.totalBonuses,
    grossEarnings:
      this.basicSalary +
      this.allowances.totalAllowances +
      this.bonuses.totalBonuses +
      totalEarnings,
    totalDeductions,
    netPay:
      this.basicSalary +
      this.allowances.totalAllowances +
      this.bonuses.totalBonuses +
      totalEarnings -
      totalDeductions,
  };

  return this.totals;
};

// New methods for approval flow
PayrollSchema.methods.submitForApproval = function (user, remarks) {
  if (this.status !== PAYROLL_STATUS.DRAFT) {
    throw new Error("Only draft payrolls can be submitted for approval");
  }

  this.status = PAYROLL_STATUS.PENDING;
  this.approvalFlow.currentLevel = APPROVAL_LEVELS.DEPARTMENT_HEAD;

  // Add to approval history
  this.approvalFlow.history.push({
    level: APPROVAL_LEVELS.DEPARTMENT_HEAD,
    status: "PENDING",
    action: "SUBMIT",
    user: user._id,
    timestamp: new Date(),
    remarks: remarks || "Submitted for department head approval",
  });

  // Update legacy fields
  this.approvalFlow.submittedBy = user._id;
  this.approvalFlow.submittedAt = new Date();
  this.approvalFlow.remarks = remarks;

  return this;
};

PayrollSchema.methods.approve = function (user, remarks) {
  if (this.status !== PAYROLL_STATUS.PENDING) {
    throw new Error("Only pending payrolls can be approved");
  }

  const currentLevel = this.approvalFlow.currentLevel;
  const nextLevel = getNextApprovalLevel(currentLevel);

  // Add current approval to history
  this.approvalFlow.history.push({
    level: currentLevel,
    status: "APPROVED",
    action: "APPROVE",
    user: user._id,
    timestamp: new Date(),
    remarks,
  });

  if (nextLevel) {
    // Move to next approval level
    this.approvalFlow.currentLevel = nextLevel;
  } else {
    // Final approval
    this.status = PAYROLL_STATUS.APPROVED;
    this.approvalFlow.approvedBy = user._id;
    this.approvalFlow.approvedAt = new Date();
  }

  return this;
};

PayrollSchema.methods.reject = function (user, remarks) {
  if (this.status !== PAYROLL_STATUS.PENDING) {
    throw new Error("Only pending payrolls can be rejected");
  }

  this.status = PAYROLL_STATUS.REJECTED;

  // Add rejection to history
  this.approvalFlow.history.push({
    level: this.approvalFlow.currentLevel,
    status: "REJECTED",
    action: "REJECT",
    user: user._id,
    timestamp: new Date(),
    remarks,
  });

  // Update legacy fields
  this.approvalFlow.rejectedBy = user._id;
  this.approvalFlow.rejectedAt = new Date();

  return this;
};

PayrollSchema.methods.returnForRevision = function (user, remarks) {
  if (this.status !== PAYROLL_STATUS.PENDING) {
    throw new Error("Only pending payrolls can be returned for revision");
  }

  // Add return action to history
  this.approvalFlow.history.push({
    level: this.approvalFlow.currentLevel,
    status: "PENDING",
    action: "RETURN",
    user: user._id,
    timestamp: new Date(),
    remarks,
  });

  // Move back to draft status
  this.status = PAYROLL_STATUS.DRAFT;
  this.approvalFlow.currentLevel = null;

  return this;
};

// Indexes
PayrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });
PayrollSchema.index({ department: 1 });
PayrollSchema.index({ status: 1 });
PayrollSchema.index({ createdAt: 1 });

export default mongoose.model("Payroll", PayrollSchema);
