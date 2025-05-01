// Enums
export enum PayrollStatus {
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  PAID = "PAID",
  CANCELLED = "CANCELLED",
  FAILED = "FAILED",
  ARCHIVED = "ARCHIVED",
  COMPLETED = "COMPLETED",
  PENDING_PAYMENT = "PENDING_PAYMENT",
}

export interface AllowanceWithId extends ISalaryComponent {
  _id: string;
  isActive: boolean;
  lastModified?: Date;
  departmentsApplied?: string;
  employeesAffected?: number;
}

export enum AllowanceType {
  HOUSING = "housing",
  TRANSPORT = "transport",
  MEAL = "meal",
  HAZARD = "hazard",
  OTHER = "other",
}

export enum DeductionType {
  TAX = "tax",
  PENSION = "pension",
  NHF = "nhf",
  LOAN = "loan",
  UNION_DUES = "unionDues",
  OTHER = "other",
}

export enum BonusType {
  PERFORMANCE = "performance",
  THIRTEENTH_MONTH = "thirteenth_month",
  SPECIAL = "special",
  ACHIEVEMENT = "achievement",
  RETENTION = "retention",
  PROJECT = "project",
}

export enum PayrollFrequency {
  DAILY = "daily",
  WEEKLY = "weekly",
  BI_WEEKLY = "bi-weekly",
  SEMI_MONTHLY = "semi-monthly",
  MONTHLY = "monthly",
  YEARLY = "yearly",
}

// Interfaces
export interface IDeduction {
  type: DeductionType;
  percentage?: number;
  amount: number;
  description?: string;
}

export interface IBonus {
  _id: string;
  employee: string;
  type: BonusType;
  amount: number;
  description?: string;
  frequency: PayrollFrequency;
  paymentDate: Date;
  effectiveDate: Date;
  expiryDate?: Date;
  approvalStatus: "pending" | "approved" | "rejected";
  approvedBy?: string;
  approvedAt?: Date;
  department?: string;
  gradeLevel?: string;
  taxable: boolean;
  active: boolean;
}

export interface IOvertime {
  hours: number;
  rate: number;
  amount: number;
  description?: string;
}

export interface IBankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
  ippisNumber?: string;
  tsaReference?: string;
}

export interface ISalaryComponent {
  name: string;
  type: "allowance" | "deduction";
  calculationMethod: "fixed" | "percentage";
  value: number;
  isActive: boolean;
  description?: string;
}

export interface IPayrollAllowance {
  name: string;
  type: string;
  value: number;
  amount: number;
}

export interface IBonusFilters {
  employee?: string;
  department?: string;
  approvalStatus?: string;
  type?: BonusType;
  active?: boolean;
}

export interface IAllowanceFilters {
  active?: boolean;
  department?: string;
  gradeLevel?: string;
  employee?: string;
}

export interface IPayrollComponent {
  name: string;
  type: "fixed" | "percentage";
  value: number;
  amount: number;
  componentId: string;
}

export interface IPayrollCalculationResult {
  employee: {
    _id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
  };
  department: string;
  salaryGrade: string;
  month: number;
  year: number;
  periodStart: Date;
  periodEnd: Date;
  basicSalary: number;
  components: ISalaryComponent[];
  allowances: {
    gradeAllowances: Array<{
      name: string;
      type: string;
      value: number;
      amount: number;
    }>;
    additionalAllowances: Array<{
      name: string;
      amount: number;
    }>;
    totalAllowances: number;
  };
  bonuses: {
    items: Array<{
      type: string;
      description: string;
      amount: number;
    }>;
    totalBonuses: number;
  };
  earnings: {
    overtime: IOvertime;
    bonus: Array<{
      type: string;
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
    basicSalary: number;
    totalAllowances: number;
    totalBonuses: number;
    grossEarnings: number;
    totalDeductions: number;
    netPay: number;
  };
  status: PayrollStatus;
  frequency: PayrollFrequency;
}

export interface IPayroll {
  _id: string;
  employee: string;
  department: string;
  salaryGrade: string;
  payPeriod: {
    type: PayrollFrequency;
    startDate: Date;
    endDate: Date;
    month: number;
    year: number;
  };
  basicSalary: number;
  components: IPayrollComponent[];
  earnings: {
    overtime: IOvertime;
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
      loanId: string;
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
  payment: IBankDetails;
  processedBy?: string;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISalaryGrade {
  _id: string;
  level: string;
  basicSalary: number;
  components: ISalaryComponent[];
  description?: string;
  isActive: boolean;
  department?: string;
  departmentName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollPeriod {
  _id: string;
  month: number;
  year: number;
  status: PayrollStatus;
  totalNetSalary?: number;
  totalEmployees?: number;
  processedDate?: string;
  employee?: string;
}

export interface PayrollStats {
  totalNetSalary: number;
  totalEmployees: number;
  pendingReviews: number;
}

export interface PayrollData {
  _id: string;
  employee: {
    _id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    fullName: string;
  };
  department: {
    _id: string;
    name: string;
    code: string;
  };
  salaryGrade: {
    level: string;
    description: string;
  };
  month: number;
  year: number;
  status: PayrollStatus;
  allowances: {
    gradeAllowances: Array<{
      name: string;
      type: string;
      value: number;
      amount: number;
      _id: string;
    }>;
    additionalAllowances: Array<{
      name: string;
      amount: number;
    }>;
    totalAllowances: number;
  };
  earnings: {
    overtime: {
      hours: number;
      rate: number;
      amount: number;
    };
    bonus: Array<{
      type: string;
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
    nhf: {
      rate: number;
      amount: number;
    };
    others: Array<{
      name: string;
      amount: number;
    }>;
    totalDeductions: number;
  };
  totals: {
    basicSalary: number;
    totalAllowances: number;
    totalBonuses: number;
    grossEarnings: number;
    totalDeductions: number;
    netPay: number;
  };
  approvalFlow: {
    submittedBy?: string;
    submittedAt?: string;
    approvedBy?: string;
    approvedAt?: string;
    rejectedBy?: string;
    rejectedAt?: string;
    paidBy?: string;
    paidAt?: string;
    remarks?: string;
    currentLevel?: string;
    history?: Array<{
      level: string;
      status: string;
      action: string;
      user: string;
      timestamp: string;
      remarks: string;
    }>;
  };
  createdAt: string;
  updatedAt: string;
  processedDate?: string;
  periodStart: string;
  periodEnd: string;
  basicSalary: number;
  bonuses: {
    items: Array<{
      type: string;
      description: string;
      amount: number;
    }>;
    totalBonuses: number;
  };
  processedBy?: string;
  payment: IBankDetails;
}

export interface PayrollCalculationRequest {
  employee: string;
  salaryGrade: string;
  month: number;
  year: number;
  frequency?: PayrollFrequency;
}

export interface PeriodPayrollResponse {
  success: boolean;
  message: string;
  data: {
    payslipId: string;
    employee: {
      id: string;
      name: string;
      employeeId: string;
      department: string;
      salaryGrade: string;
    };
    paymentDetails: {
      bankName: string;
      accountNumber: string;
      accountName: string;
    };
    period: {
      month: number;
      year: number;
      startDate: string;
      endDate: string;
      frequency: string;
    };
    earnings: {
      basicSalary: number;
      overtime: {
        hours: number;
        rate: number;
        amount: number;
      };
      bonus: any[];
      allowances: {
        gradeAllowances: Array<{
          name: string;
          type: string;
          value: number;
          amount: number;
          _id: string;
        }>;
        additionalAllowances: any[];
        totalAllowances: number;
      };
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
      nhf: {
        pensionableAmount: number;
        rate: number;
        amount: number;
      };
      loans: any[];
      others: any[];
      totalDeductions: number;
    };
    totals: {
      basicSalary: number;
      totalAllowances: number;
      totalBonuses: number;
      grossEarnings: number;
      totalDeductions: number;
      netPay: number;
    };
    components: Array<{
      name: string;
      type: string;
      value: number;
      amount: number;
      _id: string;
    }>;
    status: PayrollStatus;
    approvalFlow: {
      submittedBy: {
        id: string;
        name: string;
      };
      submittedAt: string;
      approvedBy: {
        id: string;
        name: string;
      };
      approvedAt: string;
      remarks: string;
    };
    processedBy: {
      id: string;
      name: string;
    };
    createdBy: {
      id: string;
      name: string;
    };
    updatedBy: {
      id: string;
      name: string;
    };
    timestamps: {
      createdAt: string;
      updatedAt: string;
    };
  };
}

export interface BonusItem {
  type: string;
  description: string;
  amount: number;
  _id?: string;
}

export interface Payslip {
  _id: string;
  payslipId: string;
  employee: {
    id: string;
    name: string;
    employeeId: string;
    department: string;
    salaryGrade: string;
  };
  period: {
    month: number;
    year: number;
    startDate: string;
    endDate: string;
  };
  allowances: {
    gradeAllowances: Array<{
      name: string;
      type: string;
      value: number;
      amount: number;
      _id?: string;
    }>;
    additionalAllowances: Array<{
      name: string;
      amount: number;
      _id?: string;
    }>;
    totalAllowances: number;
  };
  earnings: {
    basicSalary: number;
    allowances: {
      gradeAllowances: Array<{
        name: string;
        type: string;
        value: number;
        amount: number;
        _id: string;
      }>;
      additionalAllowances: any[];
      totalAllowances: number;
    };
    bonuses: {
      items: BonusItem[];
      totalBonuses: number;
    };
    totalEarnings: number;
  };
  bonuses: {
    items: BonusItem[];
    totalBonuses: number;
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
    nhf: {
      pensionableAmount: number;
      rate: number;
      amount: number;
    };
    loans: any[];
    others: any[];
    totalDeductions: number;
  };
  totals: {
    grossEarnings: number;
    totalDeductions: number;
    netPay: number;
    totalAllowances?: number;
    totalBonuses?: number;
  };
  status: string;
  processedAt?: string;
}

export interface PayrollFilters {
  dateRange?: string;
  department?: string;
  frequency?: string;
  status?: string;
  month?: number;
  year?: number;
  employee?: string;
  page: number;
  limit: number;
  search?: string;
}

export interface LineChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  tension: number;
}

export interface LineChartData {
  labels: string[];
  datasets: LineChartDataset[];
}

export interface PayrollResponse {
  success: boolean;
  data: {
    payrolls: PayrollData[];
    pagination: {
      total: number;
      page: number;
      pages: number;
    };
    summary: {
      frequencyTotals: Array<{
        _id: string;
        totalNetPay: number;
        totalGrossPay: number;
        totalDeductions: number;
        count: number;
        paidCount: number;
        approvedCount: number;
        pendingCount: number;
      }>;
      statusBreakdown: Array<{
        _id: string;
        count: number;
        totalNetPay: number;
      }>;
      departmentBreakdown: Array<{
        _id: string;
        count: number;
        totalNetPay: number;
        departmentName: string;
      }>;
    };
  };
}
