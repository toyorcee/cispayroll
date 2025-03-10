import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Payslip } from "../types/payslip";

export const generatePayslipPDF = async (payslip: Payslip) => {
  // Create new document
  const doc = new jsPDF();

  // Add company logo/header
  doc.setFontSize(20);
  doc.text("Company Name", 105, 15, { align: "center" });

  doc.setFontSize(16);
  doc.text("Payslip", 105, 25, { align: "center" });

  // Add pay period
  doc.setFontSize(12);
  doc.text(`Pay Period: ${payslip.month} ${payslip.year}`, 20, 40);
  doc.text(
    `Payment Date: ${payslip.paymentDate?.toLocaleDateString()}`,
    20,
    48
  );

  // Add earnings table
  const earningsData = [
    ["Basic Salary", `₦${payslip.basicSalary.toLocaleString()}`],
    ...payslip.allowances.map((a) => [a.type, `₦${a.amount.toLocaleString()}`]),
  ];

  autoTable(doc, {
    head: [["Earnings", "Amount"]],
    body: earningsData,
    startY: 60,
    theme: "grid",
    headStyles: { fillColor: [76, 175, 80] },
  });

  // Add deductions table
  const deductionsData = payslip.deductions.map((d) => [
    d.type,
    `₦${d.amount.toLocaleString()}`,
  ]);

  autoTable(doc, {
    head: [["Deductions", "Amount"]],
    body: deductionsData,
    startY: (doc as any).lastAutoTable.finalY + 10,
    theme: "grid",
    headStyles: { fillColor: [76, 175, 80] },
  });

  // Add summary
  const totalEarnings =
    payslip.basicSalary +
    payslip.allowances.reduce((sum, a) => sum + a.amount, 0);
  const totalDeductions = payslip.deductions.reduce(
    (sum, d) => sum + d.amount,
    0
  );

  autoTable(doc, {
    head: [["Summary", "Amount"]],
    body: [
      ["Total Earnings", `₦${totalEarnings.toLocaleString()}`],
      ["Total Deductions", `₦${totalDeductions.toLocaleString()}`],
      ["Net Pay", `₦${payslip.netPay.toLocaleString()}`],
    ],
    startY: (doc as any).lastAutoTable.finalY + 10,
    theme: "grid",
    headStyles: { fillColor: [76, 175, 80] },
  });

  // Save the PDF
  doc.save(`payslip-${payslip.month}-${payslip.year}.pdf`);
};
