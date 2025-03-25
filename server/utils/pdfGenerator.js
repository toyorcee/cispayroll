import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Generates a PDF payslip
 * @param {Object} payrollData - The payroll data to generate the payslip from
 * @param {string} payrollData.month - The month of the payslip
 * @param {number} payrollData.year - The year of the payslip
 * @param {Date} payrollData.paymentDate - The payment date
 * @param {number} [payrollData.basicSalary] - The basic salary amount
 * @param {Object} [payrollData.allowances] - Allowance amounts
 * @param {number} [payrollData.allowances.housing] - Housing allowance
 * @param {number} [payrollData.allowances.transport] - Transport allowance
 * @param {number} [payrollData.allowances.meal] - Meal allowance
 * @param {number} [payrollData.allowances.other] - Other allowances
 * @param {Object} [payrollData.deductions] - Deduction amounts
 * @param {number} [payrollData.deductions.tax] - Tax deduction
 * @param {number} [payrollData.deductions.pension] - Pension deduction
 * @param {number} [payrollData.deductions.loan] - Loan deduction
 * @param {number} [payrollData.deductions.other] - Other deductions
 * @param {number} [payrollData.netPay] - Net pay amount
 * @returns {jsPDF} The generated PDF document
 */
const generatePayslipPDF = async (payrollData) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text("Company Name", 105, 15, { align: "center" });
  doc.setFontSize(16);
  doc.text("Payslip", 105, 25, { align: "center" });

  // Pay period
  doc.setFontSize(12);
  doc.text(`Pay Period: ${payrollData.month} ${payrollData.year}`, 20, 40);
  doc.text(
    `Payment Date: ${payrollData.paymentDate.toLocaleDateString()}`,
    20,
    48
  );

  // Earnings table
  const earningsData = [
    ["Basic Salary", `₦${(payrollData.basicSalary || 0).toLocaleString()}`],
    [
      "Housing Allowance",
      `₦${(payrollData.allowances?.housing || 0).toLocaleString()}`,
    ],
    [
      "Transport Allowance",
      `₦${(payrollData.allowances?.transport || 0).toLocaleString()}`,
    ],
    [
      "Meal Allowance",
      `₦${(payrollData.allowances?.meal || 0).toLocaleString()}`,
    ],
    [
      "Other Allowances",
      `₦${(payrollData.allowances?.other || 0).toLocaleString()}`,
    ],
  ];

  autoTable(doc, {
    head: [["Earnings", "Amount"]],
    body: earningsData,
    startY: 60,
    theme: "grid",
    headStyles: { fillColor: [76, 175, 80] },
  });

  // Calculate totals
  const totalEarnings =
    (payrollData.basicSalary || 0) +
    Object.values(payrollData.allowances || {}).reduce(
      (sum, val) => sum + (val || 0),
      0
    );

  const totalDeductions = Object.values(payrollData.deductions || {}).reduce(
    (sum, val) => sum + (val || 0),
    0
  );

  // Summary table
  const summaryData = [
    ["Total Earnings", `₦${totalEarnings.toLocaleString()}`],
    ["Total Deductions", `₦${totalDeductions.toLocaleString()}`],
    [
      "Net Pay",
      `₦${(
        payrollData.netPay || totalEarnings - totalDeductions
      ).toLocaleString()}`,
    ],
  ];

  autoTable(doc, {
    head: [["Summary", "Amount"]],
    body: summaryData,
    startY: doc.lastAutoTable.finalY + 10,
    theme: "grid",
    headStyles: { fillColor: [76, 175, 80] },
  });

  return doc;
};

export default generatePayslipPDF;
