import mongoose from "mongoose";
const { Schema } = mongoose;

// Constants
export const PAYROLL_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

export const PayrollFrequency = {
  WEEKLY: "weekly",
  BIWEEKLY: "biweekly",
  MONTHLY: "monthly",
  QUARTERLY: "quarterly",
  ANNUAL: "annual",
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
      default: PAYROLL_STATUS.PENDING,
      required: [true, "Status is required"],
    },
    approvalFlow: {
      submittedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Submitter is required"],
      },
      submittedAt: {
        type: Date,
        required: [true, "Submission date is required"],
      },
      approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
      approvedAt: Date,
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
  const totalDeductions =
    taxDeductions +
    pensionDeductions +
    nhfDeductions +
    loanDeductions +
    otherDeductions;

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

// Indexes
PayrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });
PayrollSchema.index({ department: 1 });
PayrollSchema.index({ status: 1 });
PayrollSchema.index({ createdAt: 1 });

export default mongoose.model("Payroll", PayrollSchema);
