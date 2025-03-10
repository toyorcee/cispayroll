export interface Payslip {
  id: string;
  employeeId: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: {
    type: string;
    amount: number;
  }[];
  deductions: {
    type: string;
    amount: number;
  }[];
  netPay: number;
  status: "pending" | "processed" | "paid";
  paymentDate?: Date;
  createdAt: Date;
}
