import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PayrollSummary } from "../services/payrollSummaryService";

// Currency formatter function (always use NGN prefix)
const formatCurrency = (amount: number) => {
  return `NGN ${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// Helper to format filters for display
function formatFilters(filters: any): string {
  if (!filters) return "None";
  const parts: string[] = [];
  if (filters.frequency && filters.frequency !== "")
    parts.push(`Frequency: ${capitalize(filters.frequency)}`);
  if (filters.month) parts.push(`Month: ${filters.month}`);
  if (filters.year) parts.push(`Year: ${filters.year}`);
  if (filters.page) parts.push(`Page: ${filters.page}`);
  if (filters.limit) parts.push(`Limit: ${filters.limit}`);
  // Add more as needed
  return parts.length > 0 ? parts.join(" | ") : "None";
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function generatePayrollSummaryPDF(
  summaries: PayrollSummary[],
  filters: any,
  userRole: string
) {
  const doc = new jsPDF("landscape");
  const now = new Date();
  const pageWidth = doc.internal.pageSize.getWidth();

  // PMS Logo/Branding at the top (centered)
  doc.setFontSize(32);
  doc.setTextColor(34, 197, 94); // Green color
  doc.text("PMS", pageWidth / 2, 18, { align: "center" });

  // Subtitle under PMS (centered)
  doc.setFontSize(14);
  doc.setTextColor(107, 114, 128); // Gray color
  doc.text("Payroll Management System", pageWidth / 2, 26, { align: "center" });

  // Payroll Processing Summary (centered, bold, colored)
  doc.setFontSize(20);
  doc.setTextColor(34, 197, 94);
  doc.text("Payroll Processing Summary", pageWidth / 2, 38, {
    align: "center",
  });

  // Divider line
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.8);
  doc.line(14, 42, pageWidth - 14, 42);

  // Export info (centered, small)
  doc.setFontSize(10);
  doc.setTextColor(55, 65, 81);
  doc.text(
    `Exported: ${now.toLocaleString()} | Role: ${userRole} | Filters: ${formatFilters(
      filters
    )}`,
    pageWidth / 2,
    48,
    { align: "center" }
  );

  // Table headers
  const headers = [
    "Batch ID",
    "Period",
    "Frequency",
    "Processed",
    "Skipped",
    "Failed",
    "Total Amount",
    "Processing Time",
    "Created At",
  ];

  // Table rows as 2D array
  const rows = summaries.map((s) => [
    s.batchId,
    `${s.month}/${s.year}`,
    s.frequency,
    s.processed.toString(),
    s.skipped.toString(),
    s.failed.toString(),
    formatCurrency(s.totalNetPay),
    s.processingTime < 1000
      ? `${s.processingTime}ms`
      : `${(s.processingTime / 1000).toFixed(1)}s`,
    new Date(s.createdAt).toLocaleString(),
  ]);

  // Table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 54,
    theme: "grid",
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 11,
    },
    bodyStyles: {
      fontSize: 10,
    },
    margin: { left: 14, right: 14 },
  });

  // Summary section (totals)
  const totalProcessed = summaries.reduce((sum, s) => sum + s.processed, 0);
  const totalSkipped = summaries.reduce((sum, s) => sum + s.skipped, 0);
  const totalFailed = summaries.reduce((sum, s) => sum + s.failed, 0);
  const totalAmount = summaries.reduce((sum, s) => sum + s.totalNetPay, 0);
  const avgProcessingTime =
    summaries.length > 0
      ? summaries.reduce((sum, s) => sum + s.processingTime, 0) /
        summaries.length /
        1000
      : 0;

  // Add more vertical spacing and style the summary row
  doc.setFontSize(14);
  doc.setTextColor(34, 197, 94);
  doc.text(
    `Total Processed: ${totalProcessed}  |  Total Skipped: ${totalSkipped}  |  Total Failed: ${totalFailed}  |  Total Amount: ${formatCurrency(
      totalAmount
    )}  |  Avg Processing Time: ${avgProcessingTime.toFixed(1)}s`,
    pageWidth / 2,
    (doc as any).lastAutoTable.finalY + 20,
    { align: "center" }
  );

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(
    `Powered by Century Information Systems | Generated on ${now.toLocaleString()}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: "center" }
  );

  doc.save(
    `payroll-summaries-${now.toISOString().split("T")[0]}-${userRole}.pdf`
  );
}
