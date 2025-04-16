import { Payslip } from "../types/payslip";

export const mockPayslips: Payslip[] = [
  {
    id: "PS001",
    employeeId: "EMP001",
    month: "March",
    year: 2024,
    basicSalary: 250000,
    allowances: [
      { type: "Housing", amount: 50000 },
      { type: "Transport", amount: 25000 },
    ],
    deductions: [
      { type: "Tax", amount: 30000 },
      { type: "Pension", amount: 25000 },
    ],
    totals: {
      grossEarnings: 325000,
      totalDeductions: 55000,
      netPay: 270000,
    },
    status: "paid",
    paymentDate: new Date("2024-03-25"),
    createdAt: new Date("2024-03-24"),
  },
  {
    id: "PS002",
    employeeId: "EMP002",
    month: "March",
    year: 2024,
    basicSalary: 180000,
    allowances: [
      { type: "Housing", amount: 40000 },
      { type: "Transport", amount: 20000 },
    ],
    deductions: [
      { type: "Tax", amount: 25000 },
      { type: "Pension", amount: 20000 },
    ],
    totals: {
      grossEarnings: 240000,
      totalDeductions: 45000,
      netPay: 195000,
    },
    status: "processed",
    paymentDate: new Date("2024-03-25"),
    createdAt: new Date("2024-03-24"),
  },
  {
    id: "PS003",
    employeeId: "EMP003",
    month: "March",
    year: 2024,
    basicSalary: 200000,
    allowances: [
      { type: "Housing", amount: 45000 },
      { type: "Transport", amount: 22000 },
    ],
    deductions: [
      { type: "Tax", amount: 27000 },
      { type: "Pension", amount: 22000 },
    ],
    totals: {
      grossEarnings: 267000,
      totalDeductions: 49000,
      netPay: 218000,
    },
    status: "pending",
    paymentDate: null,
    createdAt: new Date("2024-03-24"),
  },
  {
    id: "PS004",
    employeeId: "EMP001",
    month: "February",
    year: 2024,
    basicSalary: 250000,
    allowances: [
      { type: "Housing", amount: 50000 },
      { type: "Transport", amount: 25000 },
    ],
    deductions: [
      { type: "Tax", amount: 30000 },
      { type: "Pension", amount: 25000 },
    ],
    totals: {
      grossEarnings: 325000,
      totalDeductions: 55000,
      netPay: 270000,
    },
    status: "paid",
    paymentDate: new Date("2024-02-25"),
    createdAt: new Date("2024-02-24"),
  },
  {
    id: "PS005",
    employeeId: "EMP002",
    month: "February",
    year: 2024,
    basicSalary: 180000,
    allowances: [
      { type: "Housing", amount: 40000 },
      { type: "Transport", amount: 20000 },
    ],
    deductions: [
      { type: "Tax", amount: 25000 },
      { type: "Pension", amount: 20000 },
    ],
    totals: {
      grossEarnings: 240000,
      totalDeductions: 45000,
      netPay: 195000,
    },
    status: "paid",
    paymentDate: new Date("2024-02-25"),
    createdAt: new Date("2024-02-24"),
  },
];
