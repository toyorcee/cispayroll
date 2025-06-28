import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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

// Format date for display
const formatDate = (date: string | Date | undefined) => {
  if (!date) return "N/A";
  try {
    return new Date(date).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
};

// Format task status (clean, no symbols)
const formatTaskStatus = (completed: boolean | undefined) =>
  completed ? "Completed" : "Pending";

const safe = (val: any, fallback = "N/A") =>
  val === undefined || val === null || val === "" ? fallback : val;

// Helper to sanitize and trim all string fields
const clean = (val: any) =>
  typeof val === "string" ? val.trim().replace(/[^\w\s]/gi, "") : val;

// Helper to format category or name (capitalize, remove underscores/hyphens)
const formatCategoryOrName = (str: string) =>
  str ? str.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";

export const generateOffboardingPDF = async (offboardingData: any) => {
  const doc = new jsPDF();
  let yPos = 20;

  // Add company branding
  doc.setFontSize(24);
  doc.setTextColor(22, 163, 74); // text-green-600
  doc.text("PMS", 105, yPos, { align: "center" });

  yPos += 10;
  doc.setFontSize(12);
  doc.text("Payroll Management System", 105, yPos, { align: "center" });

  // Employee Information
  doc.setTextColor(0);
  doc.setFontSize(14);

  const employeeInfoTable: TableConfig = {
    startY: yPos + 10,
    head: [["Employee Information"]],
    body: [
      [
        `Employee ID: ${safe(
          offboardingData.employee?.employeeId
        )}\nName: ${safe(offboardingData.employee?.firstName)} ${safe(
          offboardingData.employee?.lastName
        )}\nDepartment: ${safe(
          offboardingData.employee?.department?.name
        )}\nPosition: ${safe(offboardingData.employee?.position)}`,
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

  // Offboarding Details
  const offboarding = offboardingData.offboarding || {};
  const tasks = Array.isArray(offboarding.tasks) ? offboarding.tasks : [];
  const completedTasks = tasks.filter((task: any) => task.completed).length;
  const progress = tasks.length
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0;
  const offboardingInfoTable: TableConfig = {
    startY: yPos,
    head: [["Offboarding Information"]],
    body: [
      [
        `Initiated Date: ${formatDate(
          String(offboarding.initiatedDate ?? "")
        )}\nTarget Exit Date: ${formatDate(
          String(offboarding.targetExitDate ?? "")
        )}\nStatus: ${safe(
          String(offboarding.status ?? ""),
          "In Progress"
        )}\nProgress: ${progress}%`,
      ],
    ],
    theme: "grid",
    headStyles: {
      fillColor: [22, 163, 74],
      fontSize: 12,
    },
  };

  autoTable(doc, offboardingInfoTable);
  const offboardingInfoLastAutoTable = (
    doc as jsPDF & { lastAutoTable: { finalY: number } }
  ).lastAutoTable;
  yPos = offboardingInfoLastAutoTable.finalY + 10;

  // Tasks Table (no Due Date)
  if (tasks.length > 0) {
    const tasksTable: TableConfig = {
      startY: yPos,
      head: [["Task Category", "Task Name", "Status"]],
      body: tasks.map((task: any) => [
        formatCategoryOrName(clean(safe(task.category, "General"))),
        formatCategoryOrName(clean(safe(task.name))),
        formatTaskStatus(!!task.completed),
      ]),
      theme: "grid",
      headStyles: {
        fillColor: [22, 163, 74],
        fontSize: 12,
      },
      bodyStyles: {
        fontSize: 10,
      },
    };

    autoTable(doc, tasksTable);
    const tasksLastAutoTable = (
      doc as jsPDF & { lastAutoTable: { finalY: number } }
    ).lastAutoTable;
    yPos = tasksLastAutoTable.finalY + 10;
  }

  // Summary Table
  const totalTasks = tasks.length;
  // completedTasks already calculated above
  // progress already calculated above
  const summaryTable: TableConfig = {
    startY: yPos,
    head: [["Summary", "Count"]],
    body: [
      ["Total Tasks", totalTasks.toString()],
      ["Completed Tasks", completedTasks.toString()],
      ["Pending Tasks", (totalTasks - completedTasks).toString()],
      ["Progress", `${progress}%`],
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
  doc.setTextColor(107, 114, 128);
  doc.text(
    `Powered by Century Information Systems | Generated on ${new Date().toLocaleString()}`,
    105,
    pageHeight - 10,
    { align: "center" }
  );

  // Save the PDF
  doc.save(
    `offboarding-${safe(offboardingData.employee?.employeeId)}-${
      new Date().toISOString().split("T")[0]
    }.pdf`
  );
};

export const exportOffboardingToCSV = (offboardingData: any) => {
  const offboarding = offboardingData.offboarding || {};
  const tasks = Array.isArray(offboarding.tasks) ? offboarding.tasks : [];
  if (tasks.length === 0) return;

  const headers = [
    "Employee ID",
    "Employee Name",
    "Department",
    "Position",
    "Initiated Date",
    "Target Exit Date",
    "Status",
    "Progress",
    "Task Category",
    "Task Name",
    "Task Status",
    // No Due Date
  ];

  const completedTasks = tasks.filter((task: any) => task.completed).length;
  const progress = tasks.length
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0;

  const rows = tasks.map((task: any) => [
    safe(String(offboardingData.employee?.employeeId)),
    `${safe(String(offboardingData.employee?.firstName))} ${safe(
      String(offboardingData.employee?.lastName)
    )}`.trim(),
    safe(String(offboardingData.employee?.department?.name)),
    safe(String(offboardingData.employee?.position)),
    formatDate(String(offboarding.initiatedDate ?? "")),
    formatDate(String(offboarding.targetExitDate ?? "")),
    safe(String(offboarding.status ?? ""), "In Progress"),
    `${progress}%`,
    formatCategoryOrName(clean(safe(task.category, "General"))),
    formatCategoryOrName(clean(safe(task.name))),
    formatTaskStatus(!!task.completed),
    // No Due Date
  ]);

  const csvContent = [headers, ...rows]
    .map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `offboarding-${safe(offboardingData.employee?.employeeId)}-${
    new Date().toISOString().split("T")[0]
  }.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const printOffboardingPDF = async (offboardingData: any) => {
  // Just call the PDF generator and open in a new tab for printing
  // (Reuse the same logic as generateOffboardingPDF, but open for print)
  // For brevity, you can call generateOffboardingPDF and let the user print from the PDF viewer
  await generateOffboardingPDF(offboardingData);
};

// Helper function to convert settlement details to CSV format
export const settlementToCSV = (settlement: any) => {
  const headers = ["Component", "Amount"];
  const rows = [
    ["Basic Salary", settlement.basicSalary],
    ["Gratuity", settlement.gratuity],
    ["Unused Leave Days", settlement.unusedLeaveDays],
    ["Unused Leave Payment", settlement.unusedLeavePayment],
    ["Bonuses", settlement.totalBonuses],
    ["Allowances", settlement.totalAllowances],
    ["Deductions", settlement.totalDeductions],
    ["Total Settlement", settlement.totalSettlement],
  ];
  return [headers, ...rows].map((row) => row.join(",")).join("\n");
};
