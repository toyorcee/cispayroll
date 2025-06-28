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

// Type guard for breakdown
const hasBreakdown = (
  deductions: any
): deductions is { breakdown: { statutory: any[]; voluntary: any[] } } => {
  return (
    deductions &&
    typeof deductions === "object" &&
    "breakdown" in deductions &&
    deductions.breakdown
  );
};

export const generatePayslipPDF = async (payslip: Payslip) => {
  // Debug log: show all payslip details and bonuses
  // console.log("[PDF GENERATOR] payslip:", payslip);
  // console.log(
  //   "[PDF GENERATOR] payslip.earnings.bonus:",
  //   (payslip.earnings as any)?.bonus
  // );

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

  // --- DETAILED EARNINGS BREAKDOWN (EXACTLY LIKE PAYSLIPDETAIL.TSX) ---
  const earningsBody: (string | number)[][] = [];

  // Basic Salary
  earningsBody.push([
    "Basic Salary",
    formatAmount(payslip.earnings?.basicSalary),
  ]);

  // Grade Allowances section
  const gradeAllowances = payslip.earnings?.allowances?.gradeAllowances || [];
  if (gradeAllowances.length > 0) {
    earningsBody.push([
      {
        content: "Grade Allowances",
        colSpan: 2,
        styles: { fontStyle: "bold" },
      } as any,
    ]);
    gradeAllowances.forEach((a) => {
      let label = a.name;
      if (a.type === "percentage") {
        label += ` (${a.value}%)`;
      }
      earningsBody.push([label, formatAmount(a.amount)]);
    });
  }

  // Personal Allowances section
  const additionalAllowances =
    payslip.earnings?.allowances?.additionalAllowances || [];
  if (additionalAllowances.length > 0) {
    earningsBody.push([
      {
        content: "Personal Allowances",
        colSpan: 2,
        styles: { fontStyle: "bold" },
      } as any,
    ]);
    additionalAllowances.forEach((a) => {
      earningsBody.push([a.name, formatAmount(a.amount)]);
    });
  }

  // Personal Bonuses section (using bonuses.items like in PayslipDetail.tsx)
  // Handle both possible structures: earnings.bonus (actual data) and earnings.bonuses (type definition)
  const bonuses =
    (payslip.earnings as any)?.bonus ||
    (payslip.earnings as any)?.bonuses?.items ||
    [];
  if (bonuses.length > 0) {
    earningsBody.push([
      {
        content: "Personal Bonuses",
        colSpan: 2,
        styles: { fontStyle: "bold" },
      } as any,
    ]);
    bonuses.forEach((b: any) => {
      earningsBody.push([
        b.description || "Personal Bonus",
        formatAmount(b.amount),
      ]);
    });
  }

  // Totals (exactly like PayslipDetail.tsx)
  if (gradeAllowances.length > 0 || additionalAllowances.length > 0) {
    earningsBody.push([
      "Total Allowances",
      formatAmount(payslip.earnings?.allowances?.totalAllowances),
    ]);
  }
  if (bonuses.length > 0) {
    earningsBody.push([
      "Total Bonuses",
      formatAmount(payslip.totals?.totalBonuses),
    ]);
  }

  const earningsTable: TableConfig = {
    startY: yPos,
    head: [["Earnings", "Amount"]],
    body: earningsBody,
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

  // --- DETAILED DEDUCTION BREAKDOWN (EXACTLY LIKE PAYSLIPDETAIL.TSX) ---
  const deductionsBody: (string | number)[][] = [];

  // Use type guard like in PayslipDetail.tsx
  if (hasBreakdown(payslip.deductions)) {
    // Statutory Deductions section
    if (payslip.deductions.breakdown.statutory?.length > 0) {
      deductionsBody.push([
        {
          content: "Statutory Deductions",
          colSpan: 2,
          styles: { fontStyle: "bold" },
        } as any,
      ]);
      payslip.deductions.breakdown.statutory.forEach(
        (ded: any, _idx: number) => {
          let label = ded.name;
          if (ded.name === "PAYE Tax") {
            label += ` (${payslip.deductions?.tax?.taxRate ?? "Progressive"}%)`;
          } else if (
            ded.calculationMethod &&
            ded.calculationMethod !== "fixed"
          ) {
            if (
              ded.calculationMethod === "percentage" ||
              ded.calculationMethod === "PERCENTAGE"
            ) {
              label += ` (${ded.rate || ded.value || ""}%)`;
            } else if (ded.calculationMethod === "progressive") {
              label += ` (Progressive)`;
            }
          }
          deductionsBody.push([label, formatAmount(ded.amount)]);
        }
      );
    }

    // Voluntary Deductions section
    if (payslip.deductions.breakdown.voluntary?.length > 0) {
      deductionsBody.push([
        {
          content: "Voluntary Deductions",
          colSpan: 2,
          styles: { fontStyle: "bold" },
        } as any,
      ]);
      payslip.deductions.breakdown.voluntary.forEach(
        (ded: any, _idx: number) => {
          let label = ded.name;
          if (ded.calculationMethod && ded.calculationMethod !== "fixed") {
            if (
              ded.calculationMethod === "percentage" ||
              ded.calculationMethod === "PERCENTAGE"
            ) {
              label += ` (${ded.rate || ded.value || ""}%)`;
            } else if (ded.calculationMethod === "progressive") {
              label += ` (Progressive)`;
            }
          }
          deductionsBody.push([label, formatAmount(ded.amount)]);
        }
      );
    }
  } else {
    // Fallback for legacy fields if breakdown is missing
    if (payslip.deductions?.tax) {
      deductionsBody.push([
        `PAYE Tax (${payslip.deductions?.tax?.taxRate?.toFixed(2)}%)`,
        formatAmount(payslip.deductions?.tax?.amount),
      ]);
    }
    if (payslip.deductions?.pension) {
      deductionsBody.push([
        `Pension (${payslip.deductions?.pension?.rate}%)`,
        formatAmount(payslip.deductions?.pension?.amount),
      ]);
    }
    if (payslip.deductions?.nhf) {
      deductionsBody.push([
        `NHF (${payslip.deductions?.nhf?.rate}%)`,
        formatAmount(payslip.deductions?.nhf?.amount),
      ]);
    }
    if (payslip.deductions?.loans && payslip.deductions.loans.length > 0) {
      payslip.deductions.loans.forEach((loan) => {
        deductionsBody.push([loan.description, formatAmount(loan.amount)]);
      });
    }
    if (payslip.deductions?.others && payslip.deductions.others.length > 0) {
      payslip.deductions.others.forEach((other) => {
        deductionsBody.push([other.description, formatAmount(other.amount)]);
      });
    }
  }

  const deductionsTable: TableConfig = {
    startY: yPos,
    head: [["Deductions", "Amount"]],
    body: deductionsBody,
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
