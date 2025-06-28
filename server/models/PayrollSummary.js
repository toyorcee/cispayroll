import mongoose from "mongoose";
const { Schema } = mongoose;

// Constants
export const ProcessingStatus = {
  SUCCESS: "success",
  FAILED: "failed",
  SKIPPED: "skipped",
  PENDING: "pending",
};

export const SummaryType = {
  PROCESSING: "processing",
  APPROVAL: "approval",
  REJECTION: "rejection",
  SUBMISSION: "submission",
  GENERAL: "general",
};

const PayrollSummarySchema = new Schema(
  {
    batchId: {
      type: String,
      required: true,
      unique: true,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: false,
    },
    month: {
      type: Number,
      required: true,
      min: [1, "Month must be between 1 and 12"],
      max: [12, "Month must be between 1 and 12"],
    },
    year: {
      type: Number,
      required: true,
    },
    frequency: {
      type: String,
      required: true,
      enum: ["weekly", "biweekly", "monthly", "quarterly", "annual"],
    },
    processingTime: {
      type: Number,
      required: true,
      min: [0, "Processing time cannot be negative"],
    },
    totalAttempted: {
      type: Number,
      required: true,
      min: [0, "Total attempted cannot be negative"],
    },
    processed: {
      type: Number,
      required: true,
      min: [0, "Processed count cannot be negative"],
    },
    skipped: {
      type: Number,
      required: true,
      min: [0, "Skipped count cannot be negative"],
    },
    failed: {
      type: Number,
      required: true,
      min: [0, "Failed count cannot be negative"],
    },
    totalNetPay: {
      type: Number,
      required: true,
      min: [0, "Total net pay cannot be negative"],
    },
    totalGrossPay: {
      type: Number,
      required: true,
      min: [0, "Total gross pay cannot be negative"],
    },
    totalDeductions: {
      type: Number,
      required: true,
      min: [0, "Total deductions cannot be negative"],
    },
    departmentBreakdown: {
      type: Map,
      of: {
        departmentId: Schema.Types.ObjectId,
        departmentName: String,
        employeeCount: Number,
        totalNetPay: Number,
        totalGrossPay: Number,
        totalDeductions: Number,
        processed: Number,
        skipped: Number,
        failed: Number,
      },
    },
    employeeDetails: [
      {
        employeeId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        status: {
          type: String,
          enum: Object.values(ProcessingStatus),
          required: true,
        },
        netPay: {
          type: Number,
          required: true,
          min: [0, "Net pay cannot be negative"],
        },
        grossPay: {
          type: Number,
          required: true,
          min: [0, "Gross pay cannot be negative"],
        },
        totalDeductions: {
          type: Number,
          required: true,
          min: [0, "Total deductions cannot be negative"],
        },
        department: {
          type: Schema.Types.ObjectId,
          ref: "Department",
          required: true,
        },
        departmentName: {
          type: String,
          required: true,
        },
        reason: {
          type: String,
          required: false,
        },
        payrollId: {
          type: Schema.Types.ObjectId,
          ref: "Payroll",
          required: false,
        },
      },
    ],
    processingErrors: [
      {
        type: {
          type: String,
          required: true,
        },
        message: {
          type: String,
          required: true,
        },
        code: {
          type: String,
          required: false,
        },
        employeeId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: false,
        },
        employeeName: {
          type: String,
          required: false,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    warnings: [
      {
        type: {
          type: String,
          required: true,
        },
        message: {
          type: String,
          required: true,
        },
        code: {
          type: String,
          required: false,
        },
        employeeId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: false,
        },
        employeeName: {
          type: String,
          required: false,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    summaryType: {
      type: String,
      enum: Object.values(SummaryType),
      default: SummaryType.PROCESSING,
      required: true,
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
PayrollSummarySchema.index({ processedBy: 1 });
PayrollSummarySchema.index({ department: 1 });
PayrollSummarySchema.index({ month: 1, year: 1 });
PayrollSummarySchema.index({ createdAt: -1 });
PayrollSummarySchema.index({ "employeeDetails.employeeId": 1 });

// Methods
PayrollSummarySchema.methods.calculateSuccessRate = function () {
  if (this.totalAttempted === 0) return 0;
  return Math.round((this.processed / this.totalAttempted) * 100);
};

PayrollSummarySchema.methods.calculateFailureRate = function () {
  if (this.totalAttempted === 0) return 0;
  return Math.round((this.failed / this.totalAttempted) * 100);
};

PayrollSummarySchema.methods.calculateSkipRate = function () {
  if (this.totalAttempted === 0) return 0;
  return Math.round((this.skipped / this.totalAttempted) * 100);
};

PayrollSummarySchema.methods.addError = function (error) {
  this.processingErrors.push({
    type: error.type || "PROCESSING_ERROR",
    message: error.message,
    code: error.code,
    employeeId: error.employeeId,
    employeeName: error.employeeName,
    timestamp: new Date(),
  });
  this.failed += 1;
  return this;
};

PayrollSummarySchema.methods.addWarning = function (warning) {
  this.warnings.push({
    type: warning.type || "PROCESSING_WARNING",
    message: warning.message,
    code: warning.code,
    employeeId: warning.employeeId,
    employeeName: warning.employeeName,
    timestamp: new Date(),
  });
  return this;
};

PayrollSummarySchema.methods.addEmployeeDetail = function (employeeDetail) {
  this.employeeDetails.push(employeeDetail);

  // Update totals
  if (employeeDetail.status === ProcessingStatus.SUCCESS) {
    this.processed += 1;
    this.totalNetPay += employeeDetail.netPay;
    this.totalGrossPay += employeeDetail.grossPay;
    this.totalDeductions += employeeDetail.totalDeductions;
  } else if (employeeDetail.status === ProcessingStatus.SKIPPED) {
    this.skipped += 1;
  } else if (employeeDetail.status === ProcessingStatus.FAILED) {
    this.failed += 1;
  }

  return this;
};

PayrollSummarySchema.methods.updateDepartmentBreakdown = function (
  departmentId,
  departmentName,
  employeeDetail
) {
  if (!this.departmentBreakdown.has(departmentId.toString())) {
    this.departmentBreakdown.set(departmentId.toString(), {
      departmentId,
      departmentName,
      employeeCount: 0,
      totalNetPay: 0,
      totalGrossPay: 0,
      totalDeductions: 0,
      processed: 0,
      skipped: 0,
      failed: 0,
    });
  }

  const breakdown = this.departmentBreakdown.get(departmentId.toString());
  breakdown.employeeCount += 1;

  if (employeeDetail.status === ProcessingStatus.SUCCESS) {
    breakdown.processed += 1;
    breakdown.totalNetPay += employeeDetail.netPay;
    breakdown.totalGrossPay += employeeDetail.grossPay;
    breakdown.totalDeductions += employeeDetail.totalDeductions;
  } else if (employeeDetail.status === ProcessingStatus.SKIPPED) {
    breakdown.skipped += 1;
  } else if (employeeDetail.status === ProcessingStatus.FAILED) {
    breakdown.failed += 1;
  }

  return this;
};

// Static methods
PayrollSummarySchema.statics.findByBatchId = function (batchId) {
  return this.findOne({ batchId }).populate(
    "processedBy",
    "firstName lastName email"
  );
};

PayrollSummarySchema.statics.findByDepartment = function (
  departmentId,
  month,
  year
) {
  return this.find({
    department: departmentId,
    month,
    year,
  }).populate("processedBy", "firstName lastName email");
};

PayrollSummarySchema.statics.findByDateRange = function (
  startDate,
  endDate,
  departmentId = null
) {
  const query = {
    createdAt: {
      $gte: startDate,
      $lte: endDate,
    },
  };

  if (departmentId) {
    query.department = departmentId;
  }

  return this.find(query).populate("processedBy", "firstName lastName email");
};

PayrollSummarySchema.statics.getProcessingStatistics = function (
  role,
  departmentId = null
) {
  const query = {};

  if (role === "ADMIN" && departmentId) {
    query.department = departmentId;
  }

  return this.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalBatches: { $sum: 1 },
        totalEmployees: { $sum: "$totalAttempted" },
        totalProcessed: { $sum: "$processed" },
        totalSkipped: { $sum: "$skipped" },
        totalFailed: { $sum: "$failed" },
        totalNetPay: { $sum: "$totalNetPay" },
        totalGrossPay: { $sum: "$totalGrossPay" },
        totalDeductions: { $sum: "$totalDeductions" },
        avgProcessingTime: { $avg: "$processingTime" },
      },
    },
  ]);
};

export default mongoose.model("PayrollSummary", PayrollSummarySchema);
