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
const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Format task status
const formatTaskStatus = (completed: boolean) => {
  return completed ? "✅ Completed" : "⏳ Pending";
};

export const generateOnboardingPDF = async (onboardingData: any) => {
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
        `Employee ID: ${onboardingData.employee?.employeeId}\nName: ${
          onboardingData.employee?.firstName
        } ${onboardingData.employee?.lastName}\nDepartment: ${
          onboardingData.employee?.department?.name || "N/A"
        }\nPosition: ${onboardingData.employee?.position || "N/A"}`,
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

  // Onboarding Details
  const onboardingInfoTable: TableConfig = {
    startY: yPos,
    head: [["Onboarding Information"]],
    body: [
      [
        `Start Date: ${formatDate(
          onboardingData.onboarding?.startDate
        )}\nExpected Completion: ${formatDate(
          onboardingData.onboarding?.expectedCompletionDate
        )}\nStatus: ${
          onboardingData.onboarding?.status || "In Progress"
        }\nProgress: ${onboardingData.onboarding?.progress || 0}%`,
      ],
    ],
    theme: "grid",
    headStyles: {
      fillColor: [22, 163, 74],
      fontSize: 12,
    },
  };

  autoTable(doc, onboardingInfoTable);
  const onboardingInfoLastAutoTable = (
    doc as jsPDF & { lastAutoTable: { finalY: number } }
  ).lastAutoTable;
  yPos = onboardingInfoLastAutoTable.finalY + 10;

  // Tasks Table
  if (
    onboardingData.onboarding?.tasks &&
    onboardingData.onboarding.tasks.length > 0
  ) {
    const tasksTable: TableConfig = {
      startY: yPos,
      head: [["Task Category", "Task Name", "Status", "Due Date"]],
      body: onboardingData.onboarding.tasks.map((task: any) => [
        task.category || "General",
        task.name,
        formatTaskStatus(task.completed),
        task.dueDate ? formatDate(task.dueDate) : "N/A",
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
  const totalTasks = onboardingData.onboarding?.tasks?.length || 0;
  const completedTasks =
    onboardingData.onboarding?.tasks?.filter((task: any) => task.completed)
      .length || 0;
  const progress =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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
  doc.setTextColor(107, 114, 128); // text-gray-500
  doc.text(
    `Powered by Century Information Systems | Generated on ${new Date().toLocaleString()}`,
    105,
    pageHeight - 10,
    { align: "center" }
  );

  // Save the PDF
  doc.save(
    `onboarding-${onboardingData.employee?.employeeId}-${
      new Date().toISOString().split("T")[0]
    }.pdf`
  );
};

export const exportOnboardingToCSV = (onboardingData: any) => {
  if (
    !onboardingData.onboarding?.tasks ||
    onboardingData.onboarding.tasks.length === 0
  ) {
    return;
  }

  const headers = [
    "Employee ID",
    "Employee Name",
    "Department",
    "Position",
    "Start Date",
    "Expected Completion",
    "Status",
    "Progress",
    "Task Category",
    "Task Name",
    "Task Status",
    "Due Date",
  ];

  const rows = onboardingData.onboarding.tasks.map((task: any) => [
    onboardingData.employee?.employeeId || "N/A",
    `${onboardingData.employee?.firstName || ""} ${
      onboardingData.employee?.lastName || ""
    }`.trim(),
    onboardingData.employee?.department?.name || "N/A",
    onboardingData.employee?.position || "N/A",
    formatDate(onboardingData.onboarding?.startDate),
    formatDate(onboardingData.onboarding?.expectedCompletionDate),
    onboardingData.onboarding?.status || "In Progress",
    `${onboardingData.onboarding?.progress || 0}%`,
    task.category || "General",
    task.name,
    task.completed ? "Completed" : "Pending",
    task.dueDate ? formatDate(task.dueDate) : "N/A",
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell: string | number) => `"${cell}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `onboarding-${onboardingData.employee?.employeeId}-${
    new Date().toISOString().split("T")[0]
  }.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const printOnboardingPDF = async (onboardingData: any) => {
  const doc = new jsPDF();
  let yPos = 20;

  // Add company branding
  doc.setFontSize(24);
  doc.setTextColor(22, 163, 74);
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
        `Employee ID: ${onboardingData.employee?.employeeId}\nName: ${
          onboardingData.employee?.firstName
        } ${onboardingData.employee?.lastName}\nDepartment: ${
          onboardingData.employee?.department?.name || "N/A"
        }\nPosition: ${onboardingData.employee?.position || "N/A"}`,
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

  // Onboarding Details
  const onboardingInfoTable: TableConfig = {
    startY: yPos,
    head: [["Onboarding Information"]],
    body: [
      [
        `Start Date: ${formatDate(
          onboardingData.onboarding?.startDate
        )}\nExpected Completion: ${formatDate(
          onboardingData.onboarding?.expectedCompletionDate
        )}\nStatus: ${
          onboardingData.onboarding?.status || "In Progress"
        }\nProgress: ${onboardingData.onboarding?.progress || 0}%`,
      ],
    ],
    theme: "grid",
    headStyles: {
      fillColor: [22, 163, 74],
      fontSize: 12,
    },
  };

  autoTable(doc, onboardingInfoTable);
  const onboardingInfoLastAutoTable = (
    doc as jsPDF & { lastAutoTable: { finalY: number } }
  ).lastAutoTable;
  yPos = onboardingInfoLastAutoTable.finalY + 10;

  // Tasks Table
  if (
    onboardingData.onboarding?.tasks &&
    onboardingData.onboarding.tasks.length > 0
  ) {
    const tasksTable: TableConfig = {
      startY: yPos,
      head: [["Task Category", "Task Name", "Status", "Due Date"]],
      body: onboardingData.onboarding.tasks.map((task: any) => [
        task.category || "General",
        task.name,
        formatTaskStatus(task.completed),
        task.dueDate ? formatDate(task.dueDate) : "N/A",
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
  const totalTasks = onboardingData.onboarding?.tasks?.length || 0;
  const completedTasks =
    onboardingData.onboarding?.tasks?.filter((task: any) => task.completed)
      .length || 0;
  const progress =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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

  // Open in new tab for printing
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  const printWindow = window.open(pdfUrl);

  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};
