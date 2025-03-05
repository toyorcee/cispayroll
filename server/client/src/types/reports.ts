export interface EmployeeReport {
  id: number;
  name: string;
  type: "Demographics" | "Structure" | "Attendance" | "Performance";
  date: string;
  department: string;
  insights: string;
  size: string;
  downloadUrl?: string;
}

export type ReportDepartment =
  | "all"
  | "engineering"
  | "marketing"
  | "sales"
  | "hr";

export interface PayrollReport {
  id: number;
  name: string;
  type: "Monthly Summary" | "Quarterly Tax";
  date: string;
  status: "Generated" | "Processing" | "Failed";
  size: string;
  downloadUrl?: string;
}

export type ReportPeriod = "all" | "month" | "quarter" | "year";

export interface TaxReport {
  id: number;
  name: string;
  type: "Monthly Tax" | "Quarterly Tax" | "Annual Projection";
  date: string;
  status: "Filed" | "Generated" | "Pending";
  compliance: "Compliant" | "Review Required" | "Non-Compliant";
  amount: number;
  downloadUrl?: string;
}
