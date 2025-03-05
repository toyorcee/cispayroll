import { EmployeeReport, PayrollReport, TaxReport } from "../types/reports";

export const departments = [
  { id: "1", name: "All Departments", code: "all" },
  { id: "2", name: "Engineering", code: "engineering" },
  { id: "3", name: "Marketing", code: "marketing" },
  { id: "4", name: "Sales", code: "sales" },
  { id: "5", name: "Human Resources", code: "hr" },
];

export const employeeReports: EmployeeReport[] = [
  {
    id: 1,
    name: "Employee Headcount Analysis",
    type: "Demographics",
    date: "Apr 1, 2024",
    department: "All Departments",
    insights: "15% YoY Growth",
    size: "2.3 MB",
    downloadUrl: "/reports/headcount-2024-q1.pdf",
  },
  {
    id: 2,
    name: "Department Distribution",
    type: "Structure",
    date: "Mar 31, 2024",
    department: "All Departments",
    insights: "3 New Positions",
    size: "1.8 MB",
    downloadUrl: "/reports/dept-dist-2024-q1.pdf",
  },
  {
    id: 3,
    name: "Leave & Attendance Summary",
    type: "Attendance",
    date: "Mar 31, 2024",
    department: "All Departments",
    insights: "98% Attendance Rate",
    size: "1.5 MB",
    downloadUrl: "/reports/attendance-mar-2024.pdf",
  },
  {
    id: 4,
    name: "Performance Reviews Q1",
    type: "Performance",
    date: "Mar 30, 2024",
    department: "All Departments",
    insights: "12 Promotions",
    size: "3.2 MB",
    downloadUrl: "/reports/performance-2024-q1.pdf",
  },
];

export const payrollReports: PayrollReport[] = [
  {
    id: 1,
    name: "March 2024 Payroll Summary",
    type: "Monthly Summary",
    date: "Mar 31, 2024",
    status: "Generated",
    size: "1.2 MB",
    downloadUrl: "/reports/payroll-mar-2024.pdf",
  },
  {
    id: 2,
    name: "Q1 2024 Tax Deductions",
    type: "Quarterly Tax",
    date: "Mar 31, 2024",
    status: "Generated",
    size: "856 KB",
    downloadUrl: "/reports/tax-2024-q1.pdf",
  },
  {
    id: 3,
    name: "February 2024 Payroll Summary",
    type: "Monthly Summary",
    date: "Feb 29, 2024",
    status: "Generated",
    size: "1.1 MB",
    downloadUrl: "/reports/payroll-feb-2024.pdf",
  },
  {
    id: 4,
    name: "January 2024 Payroll Summary",
    type: "Monthly Summary",
    date: "Jan 31, 2024",
    status: "Generated",
    size: "1.1 MB",
    downloadUrl: "/reports/payroll-jan-2024.pdf",
  },
];

export const taxReports: TaxReport[] = [
  {
    id: 1,
    name: "PAYE Monthly Returns",
    type: "Monthly Tax",
    date: "Mar 31, 2024",
    status: "Filed",
    compliance: "Compliant",
    amount: 2450000,
    downloadUrl: "/reports/paye-mar-2024.pdf",
  },
  {
    id: 2,
    name: "Q1 2024 Tax Summary",
    type: "Quarterly Tax",
    date: "Mar 31, 2024",
    status: "Filed",
    compliance: "Compliant",
    amount: 7250000,
    downloadUrl: "/reports/tax-2024-q1.pdf",
  },
  {
    id: 3,
    name: "Annual Tax Forecast",
    type: "Annual Projection",
    date: "Mar 15, 2024",
    status: "Generated",
    compliance: "Review Required",
    amount: 28900000,
    downloadUrl: "/reports/tax-forecast-2024.pdf",
  },
  {
    id: 4,
    name: "WHT Deductions Report",
    type: "Monthly Tax",
    date: "Mar 31, 2024",
    status: "Filed",
    compliance: "Compliant",
    amount: 380000,
    downloadUrl: "/reports/wht-mar-2024.pdf",
  },
];

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
