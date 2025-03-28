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

export const generatePayslipPDF = async (payslip: Payslip) => {
  const doc = new jsPDF();
  let yPos = 20;

  // Add company branding
  doc.setFontSize(24);
  doc.setTextColor(22, 163, 74); // text-green-600
  doc.text("PEOPLEMAX", 105, yPos, { align: "center" });

  yPos += 10;
  doc.setFontSize(12);
  doc.text("Payroll Management System", 105, yPos, { align: "center" });

  // Employee & Payment Info
  doc.setTextColor(0);
  doc.setFontSize(14);

  // Use the TableConfig type for all table configurations
  const employeeInfoTable: TableConfig = {
    startY: yPos + 10,
    head: [["Employee Information", "Payment Details"]],
    body: [
      [
        `Employee ID: ${payslip.employeeId}\nName: ${payslip.employeeName}`,
        `Period: ${payslip.month}/${payslip.year}\nStatus: ${payslip.status}`,
      ],
    ],
    theme: "grid",
    headStyles: {
      fillColor: [22, 163, 74],
      fontSize: 12,
    },
  };

  autoTable(doc, employeeInfoTable);
  const employeeInfoLastAutoTable = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable;
  yPos = employeeInfoLastAutoTable.finalY + 10;

  // Earnings Table
  const earningsTable: TableConfig = {
    startY: yPos,
    head: [["Earnings", "Amount"]],
    body: [
      ["Basic Salary", `₦${payslip.basicSalary.toLocaleString()}`],
      ...payslip.allowances.map((a) => [
        a.type,
        `₦${a.amount.toLocaleString()}`,
      ]),
    ],
    theme: "grid",
    headStyles: {
      fillColor: [22, 163, 74],
      fontSize: 12,
    },
  };

  autoTable(doc, earningsTable);
  const earningsLastAutoTable = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable;
  yPos = earningsLastAutoTable.finalY + 10;

  // Deductions Table
  const deductionsTable: TableConfig = {
    startY: yPos,
    head: [["Deductions", "Amount"]],
    body: payslip.deductions.map((d) => [
      d.type,
      `₦${d.amount.toLocaleString()}`,
    ]),
    theme: "grid",
    headStyles: {
      fillColor: [22, 163, 74],
      fontSize: 12,
    },
  };

  autoTable(doc, deductionsTable);
  const deductionsLastAutoTable = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable;
  yPos = deductionsLastAutoTable.finalY + 10;

  // Summary Table
  const summaryTable: TableConfig = {
    startY: yPos,
    head: [["Summary", "Amount"]],
    body: [
      [
        "Total Earnings",
        `₦${
          payslip.basicSalary +
          payslip.allowances.reduce((sum, a) => sum + a.amount, 0)
        }`,
      ],
      [
        "Total Deductions",
        `₦${payslip.deductions.reduce((sum, d) => sum + d.amount, 0)}`,
      ],
      ["Net Pay", `₦${payslip.netPay.toLocaleString()}`],
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
    `Powered by Century Information Systems | Generated on ${new Date().toLocaleDateString()}`,
    105,
    pageHeight - 10,
    { align: "center" }
  );

  // Save the PDF
  doc.save(
    `payslip-${payslip.employeeId}-${payslip.month}-${payslip.year}.pdf`
  );
};
