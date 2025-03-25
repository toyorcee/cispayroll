export type ActivityType = "employee" | "payroll" | "leave" | "compliance";

export interface Activity {
  id: number;
  type: ActivityType;
  action: string;
  name?: string;
  department?: string;
  period?: string;
  amount?: string;
  duration?: string;
  status?: string;
  time: string;
}
