import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface PayrollData {
  month: string;
  year: number;
  paymentDate: Date;
  basicSalary?: number;
  allowances?: {
    housing: number;
    transport: number;
    meal: number;
    other: number;
  };
  deductions?: {
    tax: number;
    pension: number;
    loan: number;
    other: number;
  };
  netPay?: number;
}

const generatePayslipPDF = async (payrollData: PayrollData) => {
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
    startY: (doc as any).lastAutoTable.finalY + 10,
    theme: "grid",
    headStyles: { fillColor: [76, 175, 80] },
  });

  return doc;
};

export default generatePayslipPDF;
