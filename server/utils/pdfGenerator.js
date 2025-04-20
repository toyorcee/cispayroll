import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Generates a PDF payslip
 * @param {Object} payrollData 
 * @returns {jsPDF} 
 */
const generatePayslipPDF = async (payrollData) => {
  const doc = new jsPDF();

  doc.setGState(new doc.GState({ opacity: 0.07 })); 
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(150); 

  // Calculate the center of the page
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Position in the true center of the page
  doc.text("PMS", pageWidth / 2, pageHeight / 2, {
    align: "center",
    angle: 30,
    renderingMode: "fill",
  });

  // Reset opacity for rest of the content
  doc.setGState(new doc.GState({ opacity: 1 }));

  // Header
  doc.setTextColor(22, 163, 74); // Green color
  doc.setFontSize(28);
  doc.text("PMS", 105, 25, { align: "center" });

  doc.setTextColor(0, 0, 0); // Reset to black
  doc.setFontSize(20);
  doc.text("Payslip", 105, 40, { align: "center" });

  // Employee Details
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100); // Dark gray
  doc.text(
    `Employee: ${payrollData.employee?.firstName} ${payrollData.employee?.lastName}`,
    20,
    55
  );
  doc.text(`Employee ID: ${payrollData.employee?.employeeId}`, 20, 62);
  doc.text(
    `Department: ${payrollData.employee?.department?.name || "N/A"}`,
    20,
    69
  );

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
    76
  );
  doc.text(
    `Payment Date: ${new Date(
      payrollData.paymentDetails.paymentDate
    ).toLocaleDateString()}`,
    20,
    83
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
    startY: 90,
    theme: "grid",
    headStyles: {
      fillColor: [22, 163, 74],
      fontSize: 12,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { fontStyle: "bold" },
      1: { halign: "right" },
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
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
    headStyles: {
      fillColor: [22, 163, 74],
      fontSize: 12,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { fontStyle: "bold" },
      1: { halign: "right" },
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
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
    body: summaryData,
    startY: doc.lastAutoTable.finalY + 10,
    theme: "grid",
    styles: {
      fontSize: 14,
      fontStyle: "bold",
      textColor: [22, 163, 74],
    },
    columnStyles: {
      0: { fontStyle: "bold" },
      1: { halign: "right" },
    },
  });

  // Footer with improved styling
  const footerY = doc.lastAutoTable.finalY + 20;
  doc.setFontSize(9);
  doc.setTextColor(130, 130, 130);
  doc.text("Generated on: " + new Date().toLocaleString(), 20, footerY);
  doc.setFontSize(8);
  doc.text("This is a computer generated document", 20, footerY + 5);
  doc.text(
    "© " + new Date().getFullYear() + " Century Information Systems",
    20,
    footerY + 10
  );

  return doc;
};

export default generatePayslipPDF;
