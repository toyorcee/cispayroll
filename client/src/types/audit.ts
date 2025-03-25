export interface AuditLog {
  id: number;
  action: string;
  module: "Payroll" | "Employee" | "Tax" | "Leave" | "Settings";
  description: string;
  performedBy: string;
  ipAddress: string;
  timestamp: Date;
  status: "Success" | "Failed" | "Warning";
  details?: string;
}

export type AuditPeriod = "all" | "today" | "week" | "month";
