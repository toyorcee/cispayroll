import { PayrollPeriod, PayrollEntry, PayrollSummary, PaymentBatch } from "../types/payroll";
import { Employee } from "../types/employee";
import { employees } from "./employees";
import { Allowance, Deduction } from "../types/common";

const calculateAllowances = (employee: Employee): number => 
  employee.salary.allowances.reduce((sum: number, a: Allowance) => sum + a.amount, 0);

const calculateDeductions = (employee: Employee): number => 
  employee.salary.deductions.reduce((sum: number, d: Deduction) => sum + d.amount, 0);

const findDeductionAmount = (employee: Employee, type: string): number => 
  employee.salary.deductions.find(d => d.type === type)?.amount || 0;

export const currentPayrollEntries: PayrollEntry[] = employees.map(employee => ({
  id: `PE-${employee.employeeId}-2024-03`,
  periodId: "PAY-2024-03",
  employeeId: employee.employeeId,
  employee: employee,
  basicSalary: employee.salary.basic,
  grossAllowances: calculateAllowances(employee),
  grossDeductions: calculateDeductions(employee),
  netSalary: employee.salary.basic + calculateAllowances(employee) - calculateDeductions(employee),
  tax: findDeductionAmount(employee, "Tax"),
  pension: findDeductionAmount(employee, "Pension"),
  nhf: employee.nhfNumber ? findDeductionAmount(employee, "NHF") : 0,
  otherDeductions: 0,
  overtime: employee.overtime ? {
    hours: employee.overtime.hoursWorked,
    rate: employee.overtime.rate,
    amount: employee.overtime.hoursWorked * employee.overtime.rate * employee.salary.basic / 160
  } : undefined,
  paymentStatus: "pending"
}));

export const payrollPeriods: PayrollPeriod[] = [
  {
    id: "PAY-2024-03",
    month: 3,
    year: 2024,
    status: "processing",
    totalEmployees: employees.length,
    totalBasicSalary: currentPayrollEntries.reduce((sum, entry) => sum + entry.basicSalary, 0),
    totalAllowances: currentPayrollEntries.reduce((sum, entry) => sum + entry.grossAllowances, 0),
    totalDeductions: currentPayrollEntries.reduce((sum, entry) => sum + entry.grossDeductions, 0),
    totalNetSalary: currentPayrollEntries.reduce((sum, entry) => sum + entry.netSalary, 0),
    isThirteenthMonth: false,
    complianceChecks: {
      payeCalculated: true,
      pensionDeducted: true,
      nhfDeducted: true,
      taxReportGenerated: false
    }
  },
  {
    id: "PAY-2024-02",
    month: 2,
    year: 2024,
    status: "paid",
    processedDate: new Date("2024-03-05"),
    approvedBy: "Aisha Ibrahim",
    approvedDate: new Date("2024-03-03"),
    totalEmployees: employees.length,
    totalBasicSalary: 12000000,
    totalAllowances: 2800000,
    totalDeductions: 1750000,
    totalNetSalary: 13050000,
    isThirteenthMonth: false,
    complianceChecks: {
      payeCalculated: true,
      pensionDeducted: true,
      nhfDeducted: true,
      taxReportGenerated: true
    }
  },
  {
    id: "PAY-2024-01",
    month: 1,
    year: 2024,
    status: "paid",
    processedDate: new Date("2024-02-05"),
    approvedBy: "Aisha Ibrahim",
    approvedDate: new Date("2024-02-03"),
    totalEmployees: employees.length,
    totalBasicSalary: 11500000,
    totalAllowances: 2700000,
    totalDeductions: 1650000,
    totalNetSalary: 12550000,
    isThirteenthMonth: false,
    complianceChecks: {
      payeCalculated: true,
      pensionDeducted: true,
      nhfDeducted: true,
      taxReportGenerated: true
    }
  }
];

export const paymentBatches: PaymentBatch[] = [
  {
    id: "PB-2024-03-001",
    periodId: "PAY-2024-03",
    batchNumber: "B001",
    totalAmount: currentPayrollEntries.reduce((sum, entry) => sum + entry.netSalary, 0),
    status: "pending",
    entries: currentPayrollEntries,
    createdAt: new Date(),
    ippisStatus: "pending",
    tsaStatus: "pending"
  },
  {
    id: "PB-2024-02-001",
    periodId: "PAY-2024-02",
    batchNumber: "B001",
    totalAmount: 13050000,
    status: "completed",
    entries: currentPayrollEntries.map(entry => ({
      ...entry,
      periodId: "PAY-2024-02",
      paymentStatus: "paid",
      paymentDate: new Date("2024-03-05"),
      paymentReference: `PAY-REF-${entry.employeeId}-02`,
      ippisReference: `IPPIS-${entry.employeeId}-02`,
      tsaReference: `TSA-${entry.employeeId}-02`
    })),
    createdAt: new Date("2024-03-03"),
    processedAt: new Date("2024-03-05"),
    ippisStatus: "completed",
    tsaStatus: "completed",
    bankReference: "BANK-REF-2024-02"
  }
];

export const payrollSummaries: PayrollSummary[] = [
  {
    periodId: "PAY-2024-03",
    totalEmployees: employees.length,
    totalBasicSalary: currentPayrollEntries.reduce((sum, entry) => sum + entry.basicSalary, 0),
    totalAllowances: currentPayrollEntries.reduce((sum, entry) => sum + entry.grossAllowances, 0),
    totalDeductions: currentPayrollEntries.reduce((sum, entry) => sum + entry.grossDeductions, 0),
    totalNetSalary: currentPayrollEntries.reduce((sum, entry) => sum + entry.netSalary, 0),
    totalTax: currentPayrollEntries.reduce((sum, entry) => sum + entry.tax, 0),
    totalPension: currentPayrollEntries.reduce((sum, entry) => sum + entry.pension, 0),
    totalNHF: currentPayrollEntries.reduce((sum, entry) => sum + entry.nhf, 0),
    totalOvertime: 0,
    totalBonuses: 0,
    totalArrears: 0,
    departmentBreakdown: employees.reduce((acc, emp) => {
      const dept = emp.department;
      if (!acc[dept]) {
        acc[dept] = { employees: 0, totalCost: 0 };
      }
      acc[dept].employees += 1;
      acc[dept].totalCost += emp.salary.basic + calculateAllowances(emp);
      return acc;
    }, {} as Record<string, { employees: number; totalCost: number }>),
    complianceStatus: {
      payeSubmitted: false,
      pensionRemitted: false,
      nhfRemitted: false
    }
  }
];