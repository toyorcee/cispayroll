import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Generates a PDF payslip
 * @param {Object} payrollData - The payroll data
 * @returns {jsPDF} The generated PDF document
 */
const generatePayslipPDF = async (payrollData) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text("Neovarsity", 105, 15, { align: "center" });
  doc.setFontSize(16);
  doc.text("Payslip", 105, 25, { align: "center" });

  // Employee Details
  doc.setFontSize(12);
  doc.text(
    `Employee: ${payrollData.employee?.firstName} ${payrollData.employee?.lastName}`,
    20,
    35
  );
  doc.text(`Employee ID: ${payrollData.employee?.employeeId}`, 20, 42);
  doc.text(
    `Department: ${payrollData.employee?.department?.name || "N/A"}`,
    20,
    49
  );

  // Pay period
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
    56
  );
  doc.text(
    `Payment Date: ${new Date(
      payrollData.paymentDetails.paymentDate
    ).toLocaleDateString()}`,
    20,
    63
  );

  // Earnings table
  const earningsData = [
    ["Basic Salary", `₦${payrollData.basicSalary.toLocaleString()}`],
  ];

  // Add overtime if exists
  if (payrollData.earnings.overtime.amount > 0) {
    earningsData.push([
      `Overtime (${payrollData.earnings.overtime.hours}hrs)`,
      `₦${payrollData.earnings.overtime.amount.toLocaleString()}`,
    ]);
  }

  // Add bonuses if any
  if (payrollData.earnings.bonus && payrollData.earnings.bonus.length > 0) {
    payrollData.earnings.bonus.forEach((bonus) => {
      earningsData.push([
        bonus.description,
        `₦${bonus.amount.toLocaleString()}`,
      ]);
    });
  }

  autoTable(doc, {
    head: [["Earnings", "Amount"]],
    body: earningsData,
    startY: 70,
    theme: "grid",
    headStyles: { fillColor: [76, 175, 80] },
  });

  // Deductions table
  const deductionsData = [
    ["PAYE Tax", `₦${payrollData.deductions.tax.amount.toLocaleString()}`],
    ["Pension", `₦${payrollData.deductions.pension.amount.toLocaleString()}`],
    ["NHF", `₦${payrollData.deductions.nhf.amount.toLocaleString()}`],
  ];

  // Add loans if any
  if (payrollData.deductions.loans && payrollData.deductions.loans.length > 0) {
    payrollData.deductions.loans.forEach((loan) => {
      deductionsData.push([
        loan.description,
        `₦${loan.amount.toLocaleString()}`,
      ]);
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
        `₦${deduction.amount.toLocaleString()}`,
      ]);
    });
  }

  autoTable(doc, {
    head: [["Deductions", "Amount"]],
    body: deductionsData,
    startY: doc.lastAutoTable.finalY + 10,
    theme: "grid",
    headStyles: { fillColor: [244, 67, 54] },
  });

  // Summary table
  const summaryData = [
    ["Total Earnings", `₦${payrollData.totals.grossEarnings.toLocaleString()}`],
    [
      "Total Deductions",
      `₦${payrollData.totals.totalDeductions.toLocaleString()}`,
    ],
    ["Net Pay", `₦${payrollData.totals.netPay.toLocaleString()}`],
  ];

  autoTable(doc, {
    head: [["Summary", "Amount"]],
    body: summaryData,
    startY: doc.lastAutoTable.finalY + 10,
    theme: "grid",
    headStyles: { fillColor: [33, 150, 243] },
  });

  // Footer
  const footerY = doc.lastAutoTable.finalY + 20;
  doc.setFontSize(10);
  doc.text("Generated on: " + new Date().toLocaleString(), 20, footerY);
  doc.text("This is a computer generated document", 20, footerY + 7);

  return doc;
};

export default generatePayslipPDF;
