import mongoose, { Schema, Document, Types } from "mongoose";

export enum PayrollStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface IPayroll extends Document {
  employee: Types.ObjectId;
  department: Types.ObjectId;
  month: number;
  year: number;
  basicSalary: number;
  allowances: {
    housing: number;
    transport: number;
    meal: number;
    other: number;
  };
  deductions: {
    tax: number;
    pension: number;
    loan: number;
    other: number;
  };
  grossSalary: number;
  netSalary: number;
  status: PayrollStatus;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  comments?: string;
  paymentDate?: Date;
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
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
    allowances: {
      housing: { type: Number, default: 0 },
      transport: { type: Number, default: 0 },
      meal: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    deductions: {
      tax: { type: Number, default: 0 },
      pension: { type: Number, default: 0 },
      loan: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    grossSalary: {
      type: Number,
      required: true,
    },
    netSalary: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PayrollStatus),
      default: PayrollStatus.PENDING,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: Date,
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
    paymentDate: Date,
    bankDetails: {
      bankName: { type: String, required: true },
      accountNumber: { type: String, required: true },
      accountName: { type: String, required: true },
    },
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

// Calculate gross and net salary before save
PayrollSchema.pre("save", function (next) {
  const allowanceTotal = Object.values(this.allowances).reduce(
    (a, b) => a + b,
    0
  );
  const deductionTotal = Object.values(this.deductions).reduce(
    (a, b) => a + b,
    0
  );

  this.grossSalary = this.basicSalary + allowanceTotal;
  this.netSalary = this.grossSalary - deductionTotal;

  next();
});

const PayrollModel = mongoose.model<IPayroll>("Payroll", PayrollSchema);
export default PayrollModel;