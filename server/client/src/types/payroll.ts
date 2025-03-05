import { Employee } from "./employee";

export interface PayrollPeriod {
  id: string;
  month: number;
  year: number;
  status: "draft" | "processing" | "approved" | "paid";
  processedDate?: Date;
  approvedBy?: string;
  approvedDate?: Date;
  totalEmployees?: number;
  totalBasicSalary?: number;
  totalAllowances?: number;
  totalDeductions?: number;
  totalNetSalary?: number;
  isThirteenthMonth?: boolean;
  complianceChecks: {
    payeCalculated: boolean;
    pensionDeducted: boolean;
    nhfDeducted: boolean;
    taxReportGenerated: boolean;
  };
}

export interface PayrollEntry {
  id: string;
  periodId: string;
  employeeId: string;
  employee: Employee;
  basicSalary: number;
  grossAllowances: number;
  grossDeductions: number;
  netSalary: number;
  tax: number;
  pension: number;
  nhf: number;
  otherDeductions: number;
  overtime?: {
    hours: number;
    rate: number;
    amount: number;
  };
  bonus?: {
    type: string;
    amount: number;
  };
  arrears?: {
    description: string;
    amount: number;
  };
  paymentStatus: "pending" | "paid" | "failed";
  paymentDate?: Date;
  paymentReference?: string;
  ippisReference?: string;
  tsaReference?: string;
}

export interface PayrollSummary {
  periodId: string;
  totalEmployees: number;
  totalBasicSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  totalNetSalary: number;
  totalTax: number;
  totalPension: number;
  totalNHF: number;
  totalOvertime?: number;
  totalBonuses?: number;
  totalArrears?: number;
  departmentBreakdown?: {
    [department: string]: {
      employees: number;
      totalCost: number;
    };
  };
  complianceStatus: {
    payeSubmitted: boolean;
    pensionRemitted: boolean;
    nhfRemitted: boolean;
  };
}

export interface PaymentBatch {
  id: string;
  periodId: string;
  batchNumber: string;
  totalAmount: number;
  status: "pending" | "processing" | "completed" | "failed";
  entries: PayrollEntry[];
  createdAt: Date;
  processedAt?: Date;
  ippisStatus?: string;
  tsaStatus?: string;
  bankReference?: string;
}

export interface DeductionSummary {
  id: string;
  name: string;
  type: "Statutory" | "Voluntary";
  calculation: string;
  totalAmount: number;
  employees: number;
  employeeIds: Set<string>;
  status: "Active" | "Inactive" | "Pending";
  lastUpdated: string;
}
