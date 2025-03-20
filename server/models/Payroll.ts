import mongoose, { Schema, Document, Types } from "mongoose";

export enum PayrollStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface IPayroll extends Document {
  employee: Types.ObjectId;
  department: Types.ObjectId;
  salaryGrade: Types.ObjectId;
  month: number;
  year: number;
  basicSalary: number;
  components: Array<{
    name: string;
    type: string;
    value: number;
    amount: number;
  }>;
  earnings: {
    overtime: {
      hours: number;
      rate: number;
      amount: number;
    };
    bonus: Array<{
      description: string;
      amount: number;
    }>;
    totalEarnings: number;
  };
  deductions: {
    tax: {
      taxableAmount: number;
      taxRate: number;
      amount: number;
    };
    pension: {
      pensionableAmount: number;
      rate: number;
      amount: number;
    };
    loans: Array<{
      description: string;
      amount: number;
    }>;
    others: Array<{
      description: string;
      amount: number;
    }>;
    totalDeductions: number;
  };
  totals: {
    grossEarnings: number;
    totalDeductions: number;
    netPay: number;
  };
  status: PayrollStatus;
  approvalFlow: {
    submittedBy: Types.ObjectId;
    submittedAt: Date;
    approvedBy?: Types.ObjectId;
    approvedAt?: Date;
  };
  payment: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  processedBy: Types.ObjectId;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PayrollSchema = new Schema<IPayroll>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    salaryGrade: {
      type: Schema.Types.ObjectId,
      ref: "SalaryGrade",
      required: true,
    },
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
    basicSalary: {
      type: Number,
      required: true,
    },
    components: [
      {
        name: { type: String, required: true },
        type: { type: String, required: true },
        value: { type: Number, required: true },
        amount: { type: Number, required: true },
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
          description: String,
          amount: Number,
        },
      ],
      totalEarnings: { type: Number, required: true },
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
      loans: [
        {
          description: String,
          amount: Number,
        },
      ],
      others: [
        {
          description: String,
          amount: Number,
        },
      ],
      totalDeductions: { type: Number, required: true },
    },
    totals: {
      grossEarnings: { type: Number, required: true },
      totalDeductions: { type: Number, required: true },
      netPay: { type: Number, required: true },
    },
    status: {
      type: String,
      enum: Object.values(PayrollStatus),
      default: PayrollStatus.PENDING,
      required: true,
    },
    approvalFlow: {
      submittedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
      submittedAt: { type: Date, required: true },
      approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
      approvedAt: Date,
    },
    payment: {
      bankName: { type: String, required: true },
      accountNumber: { type: String, required: true },
      accountName: { type: String, required: true },
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    comments: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
PayrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });
PayrollSchema.index({ department: 1 });
PayrollSchema.index({ status: 1 });
PayrollSchema.index({ createdAt: 1 });

const PayrollModel = mongoose.model<IPayroll>("Payroll", PayrollSchema);
export default PayrollModel;
