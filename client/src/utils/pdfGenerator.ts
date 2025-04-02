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
        `Employee ID: ${payslip.employee?.employeeId}\nName: ${payslip.employee?.name}\nDept: ${payslip.employee?.department}\nGrade: ${payslip.employee?.salaryGrade}`,
        `Bank: ${payslip.paymentDetails?.bankName}\nAccount: ${payslip.paymentDetails?.accountNumber}\nName: ${payslip.paymentDetails?.accountName}`,
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
        ).toLocaleDateString()}\nFrequency: ${
          payslip.period?.frequency
        }\nStatus: ${payslip.status}`,
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
      [
        "Basic Salary",
        `₦${payslip.earnings?.basicSalary?.toLocaleString() || "0"}`,
      ],
      ...(payslip.earnings?.allowances?.gradeAllowances?.map((a) => [
        `${a.name} ${a.type === "percentage" ? `(${a.value}%)` : ""}`,
        `₦${a.amount.toLocaleString()}`,
      ]) || []),
      ...(payslip.earnings?.overtime?.amount > 0
        ? [
            [
              `Overtime (${payslip.earnings.overtime.hours}hrs @ ₦${payslip.earnings.overtime.rate}/hr)`,
              `₦${payslip.earnings.overtime.amount.toLocaleString()}`,
            ],
          ]
        : []),
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
        `₦${payslip.deductions?.tax?.amount?.toLocaleString() || "0"}`,
      ],
      [
        `Pension (${payslip.deductions?.pension?.rate}%)`,
        `₦${payslip.deductions?.pension?.amount?.toLocaleString() || "0"}`,
      ],
      [
        `NHF (${payslip.deductions?.nhf?.rate}%)`,
        `₦${payslip.deductions?.nhf?.amount?.toLocaleString() || "0"}`,
      ],
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
      [
        "Total Earnings",
        `₦${payslip.totals?.grossEarnings?.toLocaleString() || "0"}`,
      ],
      [
        "Total Deductions",
        `₦${payslip.deductions?.totalDeductions?.toLocaleString() || "0"}`,
      ],
      ["Net Pay", `₦${payslip.totals?.netPay?.toLocaleString() || "0"}`],
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

  // Approval Information
  const approvalInfoTable: TableConfig = {
    startY:
      (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY + 10,
    head: [["Approval Information"]],
    body: [
      [
        `Submitted by: ${
          payslip.approvalFlow?.submittedBy?.name
        }\nDate: ${new Date(
          payslip.approvalFlow?.submittedAt
        ).toLocaleString()}\n\nApproved by: ${
          payslip.approvalFlow?.approvedBy?.name
        }\nDate: ${new Date(
          payslip.approvalFlow?.approvedAt
        ).toLocaleString()}\n\nRemarks: ${
          payslip.approvalFlow?.remarks || "None"
        }`,
      ],
    ],
    theme: "grid",
    headStyles: {
      fillColor: [22, 163, 74],
      fontSize: 12,
    },
  };

  autoTable(doc, approvalInfoTable);

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
