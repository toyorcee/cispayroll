export interface Payslip {
  id: string;
  employeeId: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: Array<{
    type: string;
    amount: number;
  }>;
  deductions: Array<{
    type: string;
    amount: number;
  }>;
  netPay: number;
  status: "pending" | "processed" | "paid";
  paymentDate: Date | null;
  createdAt: Date;
}
