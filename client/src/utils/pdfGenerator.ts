import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Payslip } from "../types/payroll";

// Define the type inline since the import isn't working correctly
type TableConfig = {
  startY?: number;
  head?: string[][];
  body: (string | number)[][];
  theme?: string;
  headStyles?: {
    fillColor?: number[];
    fontSize?: number;
  };
  bodyStyles?: {
    fontSize?: number;
  };
  styles?: {
    halign?: "left" | "center" | "right";
  };
};

// Format amount with proper Naira symbol and decimal places
const formatAmount = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null) return "NGN 0.00";
  const formattedNumber = new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `NGN ${formattedNumber}`;
};

export const generatePayslipPDF = async (payslip: Payslip) => {
  const doc = new jsPDF();
  let yPos = 20;

  // Add company branding
  doc.setFontSize(24);
  doc.setTextColor(22, 163, 74); // text-green-600
  doc.text("PMS", 105, yPos, { align: "center" });

  yPos += 10;
  doc.setFontSize(12);
  doc.text("Payroll Management System", 105, yPos, { align: "center" });

  // Employee & Payment Info
  doc.setTextColor(0);
  doc.setFontSize(14);

  // Use the TableConfig type for all table configurations
  const employeeInfoTable: TableConfig = {
    startY: yPos + 10,
    head: [["Employee Information"]],
    body: [
      [
        `Employee ID: ${payslip.employee?.employeeId}\nName: ${payslip.employee?.name}\nDept: ${payslip.employee?.department}\nGrade: ${payslip.employee?.salaryGrade}`,
      ],
    ],
    theme: "grid",
    headStyles: {
      fillColor: [22, 163, 74],
      fontSize: 12,
    },
  };

  autoTable(doc, employeeInfoTable);
  const employeeInfoLastAutoTable = (
    doc as jsPDF & { lastAutoTable: { finalY: number } }
  ).lastAutoTable;
  yPos = employeeInfoLastAutoTable.finalY + 10;

  // Pay Period Info
  const periodInfoTable: TableConfig = {
    startY: yPos,
    head: [["Pay Period Information"]],
    body: [
      [
        `Period: ${new Date(
          payslip.period?.startDate
        ).toLocaleDateString()} - ${new Date(
          payslip.period?.endDate
        ).toLocaleDateString()}\nStatus: ${payslip.status}`,
      ],
    ],
    theme: "grid",
    headStyles: {
      fillColor: [22, 163, 74],
      fontSize: 12,
    },
  };

  autoTable(doc, periodInfoTable);
  const periodInfoLastAutoTable = (
    doc as jsPDF & { lastAutoTable: { finalY: number } }
  ).lastAutoTable;
  yPos = periodInfoLastAutoTable.finalY + 10;

  // Earnings Table
  const earningsTable: TableConfig = {
    startY: yPos,
    head: [["Earnings", "Amount"]],
    body: [
      ["Basic Salary", formatAmount(payslip.earnings?.basicSalary)],
      ...(payslip.earnings?.allowances?.gradeAllowances?.map((a) => [
        `${a.name} ${a.type === "percentage" ? `(${a.value}%)` : ""}`,
        formatAmount(a.amount),
      ]) || []),
      [
        "Total Allowances",
        formatAmount(payslip.earnings?.allowances?.totalAllowances),
      ],
      ["Total Bonuses", formatAmount(payslip.earnings?.bonuses?.totalBonuses)],
    ],
    theme: "grid",
    headStyles: {
      fillColor: [22, 163, 74],
      fontSize: 12,
    },
  };

  autoTable(doc, earningsTable);
  const earningsLastAutoTable = (
    doc as jsPDF & { lastAutoTable: { finalY: number } }
  ).lastAutoTable;
  yPos = earningsLastAutoTable.finalY + 10;

  // Deductions Table
  const deductionsTable: TableConfig = {
    startY: yPos,
    head: [["Deductions", "Amount"]],
    body: [
      [
        `PAYE Tax (${payslip.deductions?.tax?.taxRate?.toFixed(2)}%)`,
        formatAmount(payslip.deductions?.tax?.amount),
      ],
      [
        `Pension (${payslip.deductions?.pension?.rate}%)`,
        formatAmount(payslip.deductions?.pension?.amount),
      ],
      [
        `NHF (${payslip.deductions?.nhf?.rate}%)`,
        formatAmount(payslip.deductions?.nhf?.amount),
      ],
      ...(payslip.deductions?.loans?.map((loan) => [
        loan.description,
        formatAmount(loan.amount),
      ]) || []),
      ...(payslip.deductions?.others?.map((other) => [
        other.description,
        formatAmount(other.amount),
      ]) || []),
    ],
    theme: "grid",
    headStyles: {
      fillColor: [22, 163, 74],
      fontSize: 12,
    },
  };

  autoTable(doc, deductionsTable);
  const deductionsLastAutoTable = (
    doc as jsPDF & { lastAutoTable: { finalY: number } }
  ).lastAutoTable;
  yPos = deductionsLastAutoTable.finalY + 10;

  // Summary Table
  const summaryTable: TableConfig = {
    startY: yPos,
    head: [["Summary", "Amount"]],
    body: [
      ["Total Earnings", formatAmount(payslip.totals?.grossEarnings)],
      ["Total Deductions", formatAmount(payslip.deductions?.totalDeductions)],
      ["Net Pay", formatAmount(payslip.totals?.netPay)],
    ],
    theme: "grid",
    headStyles: {
      fillColor: [22, 163, 74],
      fontSize: 12,
    },
    bodyStyles: {
      fontSize: 12,
    },
  };

  autoTable(doc, summaryTable);

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128); // text-gray-500
  doc.text(
    `Powered by Century Information Systems | Generated on ${new Date().toLocaleString()}`,
    105,
    pageHeight - 10,
    { align: "center" }
  );

  // Save the PDF
  doc.save(
    `payslip-${payslip.employee?.employeeId}-${new Date(
      payslip.period?.startDate
    ).toLocaleDateString()}.pdf`
  );
};

export const generateFinalSettlementPDF = async (
  employee: any,
  settlementDetails: any
) => {
  const doc = new jsPDF();
  let yPos = 20;

  // Add company branding
  doc.setFontSize(24);
  doc.setTextColor(22, 163, 74); // text-green-600
  doc.text("PMS", 105, yPos, { align: "center" });

  yPos += 10;
  doc.setFontSize(12);
  doc.text("Payroll Management System", 105, yPos, { align: "center" });

  // Employee & Settlement Info
  doc.setTextColor(0);
  doc.setFontSize(14);

  const employeeInfoTable: TableConfig = {
    startY: yPos + 10,
    head: [["Employee Information"]],
    body: [
      [
        `Employee ID: ${employee.employeeId}\nName: ${employee.firstName} ${
          employee.lastName
        }\nDept: ${
          employee.department?.name || "N/A"
        }\nLast Working Day: ${new Date().toLocaleDateString()}`,
      ],
    ],
    theme: "grid",
    headStyles: {
      fillColor: [22, 163, 74],
      fontSize: 12,
    },
  };

  autoTable(doc, employeeInfoTable);
  const employeeInfoLastAutoTable = (
    doc as jsPDF & { lastAutoTable: { finalY: number } }
  ).lastAutoTable;
  yPos = employeeInfoLastAutoTable.finalY + 10;

  // Settlement Components Table
  const settlementTable: TableConfig = {
    startY: yPos,
    head: [["Settlement Component", "Amount"]],
    body: [
      ["Basic Salary", formatAmount(settlementDetails.basicSalary)],
      ["Gratuity (10%)", formatAmount(settlementDetails.gratuity)],
      [
        "Unused Leave Payment",
        formatAmount(settlementDetails.unusedLeavePayment),
      ],
    ],
    theme: "grid",
    headStyles: {
      fillColor: [22, 163, 74],
      fontSize: 12,
    },
  };

  autoTable(doc, settlementTable);
  const settlementLastAutoTable = (
    doc as jsPDF & { lastAutoTable: { finalY: number } }
  ).lastAutoTable;
  yPos = settlementLastAutoTable.finalY + 10;

  // Summary Table
  const summaryTable: TableConfig = {
    startY: yPos,
    head: [["Summary", "Amount"]],
    body: [
      ["Total Settlement", formatAmount(settlementDetails.totalSettlement)],
    ],
    theme: "grid",
    headStyles: {
      fillColor: [22, 163, 74],
      fontSize: 12,
    },
    bodyStyles: {
      fontSize: 12,
    },
  };

  autoTable(doc, summaryTable);

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128); // text-gray-500
  doc.text(
    `Powered by Century Information Systems | Generated on ${new Date().toLocaleString()}`,
    105,
    pageHeight - 10,
    { align: "center" }
  );

  // Save the PDF
  doc.save(
    `final-settlement-${
      employee.employeeId
    }-${new Date().toLocaleDateString()}.pdf`
  );
};
