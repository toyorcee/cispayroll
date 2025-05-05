import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Generates a PDF payslip
 * @param {Object} payrollData
 * @returns {jsPDF}
 */
const generatePayslipPDF = async (payrollData) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Set watermark with reduced opacity and size
  doc.setGState(new doc.GState({ opacity: 0.05 }));
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(100);

  // Calculate the center of the page
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Position watermark
  doc.text("PMS", pageWidth / 2, pageHeight / 2, {
    align: "center",
    angle: 30,
    renderingMode: "fill",
  });

  // Reset opacity for rest of the content
  doc.setGState(new doc.GState({ opacity: 1 }));

  // Header
  doc.setTextColor(22, 163, 74); // Green color
  doc.setFontSize(24);
  doc.text("PMS", 105, 20, { align: "center" });

  doc.setTextColor(0, 0, 0); // Reset to black
  doc.setFontSize(18);
  doc.text("Payslip", 105, 30, { align: "center" });

  // Employee Details
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100); // Dark gray
  doc.text(
    `Employee: ${payrollData.employee?.firstName} ${payrollData.employee?.lastName}`,
    20,
    45
  );
  doc.text(`Employee ID: ${payrollData.employee?.employeeId}`, 20, 52);
  doc.text(`Department: ${payrollData.department?.name || "N/A"}`, 20, 59);

  // Pay period with better styling
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  doc.text(
    `Period: ${monthNames[payrollData.month - 1]} ${payrollData.year}`,
    20,
    66
  );
  doc.text(
    `Payment Date: ${new Date(
      payrollData.paymentDetails.paymentDate
    ).toLocaleDateString()}`,
    20,
    73
  );

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return `NGN ${amount.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Merge and deduplicate bonuses
  const allBonuses = [
    ...(payrollData.earnings.bonus || []),
    ...(payrollData.personalBonuses || []),
  ];
  const uniqueBonuses = [];
  const seenBonusDescriptions = new Set();
  allBonuses.forEach((bonus) => {
    if (!seenBonusDescriptions.has(bonus.description)) {
      uniqueBonuses.push(bonus);
      seenBonusDescriptions.add(bonus.description);
    }
  });

  // Merge all allowances
  const allAllowances = [
    ...(payrollData.gradeAllowances || []),
    ...(payrollData.additionalAllowances || []),
  ];

  // Earnings table
  const earningsData = [
    ["Basic Salary", formatCurrency(payrollData.basicSalary)],
  ];

  // Add overtime if exists
  if (payrollData.earnings.overtime.amount > 0) {
    earningsData.push([
      `Overtime (${payrollData.earnings.overtime.hours}hrs)`,
      formatCurrency(payrollData.earnings.overtime.amount),
    ]);
  }

  // Add unique bonuses
  uniqueBonuses.forEach((bonus) => {
    earningsData.push([bonus.description, formatCurrency(bonus.amount)]);
  });

  // Add all allowances
  allAllowances.forEach((allowance) => {
    earningsData.push([allowance.name, formatCurrency(allowance.amount)]);
  });

  autoTable(doc, {
    head: [["Earnings", "Amount"]],
    body: earningsData,
    startY: 80,
    theme: "grid",
    headStyles: {
      fillColor: [22, 163, 74],
      fontSize: 10,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: "auto" },
      1: { halign: "right", cellWidth: "auto" },
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { left: 20, right: 20 },
  });

  // Deductions table
  const deductionsData = [
    ["PAYE Tax", formatCurrency(payrollData.deductions.tax.amount)],
    ["Pension", formatCurrency(payrollData.deductions.pension.amount)],
    ["NHF", formatCurrency(payrollData.deductions.nhf.amount)],
  ];

  // Add loans if any
  if (payrollData.deductions.loans && payrollData.deductions.loans.length > 0) {
    payrollData.deductions.loans.forEach((loan) => {
      deductionsData.push([loan.description, formatCurrency(loan.amount)]);
    });
  }

  // Add other deductions if any
  if (
    payrollData.deductions.others &&
    payrollData.deductions.others.length > 0
  ) {
    payrollData.deductions.others.forEach((deduction) => {
      deductionsData.push([
        deduction.description,
        formatCurrency(deduction.amount),
      ]);
    });
  }

  autoTable(doc, {
    head: [["Deductions", "Amount"]],
    body: deductionsData,
    startY: doc.lastAutoTable.finalY + 10,
    theme: "grid",
    headStyles: {
      fillColor: [22, 163, 74],
      fontSize: 10,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: "auto" },
      1: { halign: "right", cellWidth: "auto" },
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { left: 20, right: 20 },
  });

  // Summary table
  const summaryData = [
    ["Total Earnings", formatCurrency(payrollData.totals.grossEarnings)],
    ["Total Deductions", formatCurrency(payrollData.totals.totalDeductions)],
    ["Net Pay", formatCurrency(payrollData.totals.netPay)],
  ];

  autoTable(doc, {
    body: summaryData,
    startY: doc.lastAutoTable.finalY + 10,
    theme: "grid",
    styles: {
      fontSize: 10,
      fontStyle: "bold",
      textColor: [22, 163, 74],
      cellPadding: 3,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: "auto" },
      1: { halign: "right", cellWidth: "auto" },
    },
    margin: { left: 20, right: 20 },
  });

  // Footer with improved styling
  const footerY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text("Generated on: " + new Date().toLocaleString(), 20, footerY);
  doc.setFontSize(7);
  doc.text("This is a computer generated document", 20, footerY + 5);
  doc.text(
    "© " + new Date().getFullYear() + " Century Information Systems",
    20,
    footerY + 10
  );

  return doc;
};

export default generatePayslipPDF;
