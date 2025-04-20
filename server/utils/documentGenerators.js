import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const generateExitLetter = async (employee) => {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text("Exit Letter", 105, 20, { align: "center" });

  doc.setFontSize(12);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 40);
  doc.text(`Employee Name: ${employee.firstName} ${employee.lastName}`, 20, 50);
  doc.text(`Employee ID: ${employee.employeeId}`, 20, 60);
  doc.text(`Department: ${employee.department.name}`, 20, 70);
  doc.text(
    `Last Working Day: ${employee.offboarding.lastWorkingDay.toLocaleDateString()}`,
    20,
    80
  );

  return doc;
};

export const generateClearanceForm = async (employee) => {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text("Clearance Form", 105, 20, { align: "center" });

  const checklistItems = [
    [
      "Exit Interview",
      employee.offboarding.checklist.exitInterview ? "✓" : "✗",
    ],
    [
      "Assets Returned",
      employee.offboarding.checklist.assetsReturned ? "✓" : "✗",
    ],
    [
      "Knowledge Transfer",
      employee.offboarding.checklist.knowledgeTransfer ? "✓" : "✗",
    ],
    [
      "Access Revoked",
      employee.offboarding.checklist.accessRevoked ? "✓" : "✗",
    ],
    [
      "Final Settlement",
      employee.offboarding.checklist.finalSettlement ? "✓" : "✗",
    ],
  ];

  autoTable(doc, {
    head: [["Item", "Status"]],
    body: checklistItems,
    startY: 40,
    theme: "grid",
  });

  return doc;
};

export const generateExperienceLetter = async (employee) => {
  const doc = new jsPDF();
  // ... implement experience letter generation
  return doc;
};

export const generateFinalSettlementReport = async (
  employee,
  settlementDetails
) => {
  const doc = new jsPDF();

  // Add watermark - centered behind tables
  doc.setGState(new doc.GState({ opacity: 0.07 })); // Subtle transparency
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(150); // Large enough to span across the page

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
  doc.text("Final Settlement Report", 105, 40, { align: "center" });

  // Employee Details - More concise
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100); // Dark gray
  const employeeDetails = [
    `ID: ${employee.employeeId}`,
    `Name: ${employee.firstName} ${employee.lastName}`,
    `Dept: ${employee.department?.name || "N/A"}`,
  ];
  doc.text(employeeDetails, 20, 55);

  // Date information with better formatting
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120); // Lighter gray
  doc.text(`Settlement Date: ${new Date().toLocaleDateString()}`, 20, 75);

  // Offboarding Status
  doc.setFontSize(14);
  doc.setTextColor(22, 163, 74); // Green color
  doc.text("Offboarding Status", 20, 90);

  const checklistItems = [
    ["Exit Interview", "Completed"],
    ["Assets Returned", "Completed"],
    ["Knowledge Transfer", "Completed"],
    ["Access Revoked", "Completed"],
    ["Final Settlement", "Completed"],
  ];

  autoTable(doc, {
    head: [["Task", "Status"]],
    body: checklistItems,
    startY: 95,
    theme: "grid",
    headStyles: {
      fillColor: [22, 163, 74],
      fontSize: 12,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { fontStyle: "bold" },
      1: {
        halign: "center",
        cellWidth: 60,
        fontStyle: function (cell) {
          return cell.raw === "Completed" ? "bold" : "normal";
        },
        textColor: function (cell) {
          return cell.raw === "Completed" ? [22, 163, 74] : [180, 0, 0];
        },
      },
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  // Settlement Details
  const settlementY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setTextColor(22, 163, 74);
  doc.text("Settlement Details", 20, settlementY);

  const settlementData = [
    ["Basic Salary", `NGN ${settlementDetails.basicSalary.toLocaleString()}`],
    ["Gratuity (10%)", `NGN ${settlementDetails.gratuity.toLocaleString()}`],
    [
      "Unused Leave Payment",
      `NGN ${settlementDetails.unusedLeavePayment.toLocaleString()}`,
    ],
  ];

  autoTable(doc, {
    head: [["Component", "Amount"]],
    body: settlementData,
    startY: settlementY + 5,
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

  // Summary with enhanced styling
  const summaryY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setTextColor(22, 163, 74);
  doc.text("Summary", 20, summaryY);

  const summaryData = [
    [
      "Total Settlement",
      `NGN ${settlementDetails.totalSettlement.toLocaleString()}`,
    ],
  ];

  autoTable(doc, {
    body: summaryData,
    startY: summaryY + 5,
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
