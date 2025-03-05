export type Status = "active" | "inactive" | "suspended";

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface Allowance {
  id: string;
  type: string;
  amount: number;
  description: string;
}

export interface Deduction {
  id: string;
  type: string;
  amount: number;
  description: string;
}
