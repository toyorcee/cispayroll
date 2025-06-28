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

  // Employee Details
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100); // Dark gray
  const employeeDetails = [
    `ID: ${employee.employeeId}`,
    `Name: ${employee.firstName} ${employee.lastName}`,
    `Dept: ${employee.department?.name || "N/A"}`,
    `Position: ${employee.position || "N/A"}`,
    `Grade Level: ${employee.gradeLevel || "N/A"}`,
  ];
  doc.text(employeeDetails, 20, 55);

  // Date information
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120); // Lighter gray
  doc.text(`Settlement Date: ${new Date().toLocaleDateString()}`, 20, 85);
  if (employee.offboarding?.actualExitDate) {
    doc.text(
      `Exit Date: ${new Date(
        employee.offboarding.actualExitDate
      ).toLocaleDateString()}`,
      20,
      95
    );
  }

  // Offboarding Status
  const statusY = employee.offboarding?.actualExitDate ? 110 : 100;
  doc.setFontSize(14);
  doc.setTextColor(22, 163, 74); // Green color
  doc.text("Offboarding Status", 20, statusY);

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
    startY: statusY + 5,
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
        textColor: [22, 163, 74],
        fontStyle: "bold",
      },
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  // Detailed Allowances Breakdown
  const allowancesY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setTextColor(22, 163, 74);
  doc.text("Allowances Breakdown", 20, allowancesY);

  // Use payrollData.allowances for the breakdown
  const allowancesArr = settlementDetails.payrollData?.allowances || [];
  if (allowancesArr.length > 0) {
    const allowanceData = allowancesArr.map((allowance) => [
      allowance.name,
      `NGN ${(allowance.amount ?? allowance.value ?? 0).toLocaleString()}`,
      allowance.calculationMethod === "percentage"
        ? `Percentage (${allowance.value}%)`
        : "Fixed",
    ]);

    autoTable(doc, {
      head: [["Allowance", "Amount (NGN)", "Type"]],
      body: allowanceData,
      startY: allowancesY + 5,
      theme: "grid",
      headStyles: {
        fillColor: [22, 163, 74],
        fontSize: 11,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { fontStyle: "bold" },
        1: { halign: "right" },
        2: { halign: "center" },
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    // Total Allowances
    const totalAllowancesY = doc.lastAutoTable.finalY + 5;
    autoTable(doc, {
      body: [
        [
          "Total Allowances",
          `NGN ${settlementDetails.totalAllowances?.toLocaleString() || "0"}`,
        ],
      ],
      startY: totalAllowancesY,
      theme: "grid",
      styles: {
        fontSize: 12,
        fontStyle: "bold",
        fillColor: [240, 249, 235],
      },
      columnStyles: {
        0: { fontStyle: "bold" },
        1: { halign: "right", fontStyle: "bold" },
      },
    });
  }

  // Detailed Deductions Breakdown
  const deductionsY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setTextColor(22, 163, 74);
  doc.text("Deductions Breakdown", 20, deductionsY);

  const deductionData = [];

  // Statutory Deductions
  if (settlementDetails.payrollData?.deductions?.statutory) {
    settlementDetails.payrollData.deductions.statutory.forEach((deduction) => {
      deductionData.push([
        deduction.name,
        "Statutory",
        `NGN ${deduction.amount?.toLocaleString() || "0"}`,
      ]);
    });
  }

  // Voluntary Deductions
  if (settlementDetails.payrollData?.deductions?.voluntary) {
    settlementDetails.payrollData.deductions.voluntary.forEach((deduction) => {
      deductionData.push([
        deduction.name,
        "Voluntary",
        `NGN ${deduction.amount?.toLocaleString() || "0"}`,
      ]);
    });
  }

  if (deductionData.length > 0) {
    autoTable(doc, {
      head: [["Deduction", "Type", "Amount"]],
      body: deductionData,
      startY: deductionsY + 5,
      theme: "grid",
      headStyles: {
        fillColor: [22, 163, 74],
        fontSize: 11,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { fontStyle: "bold" },
        1: { halign: "center" },
        2: { halign: "right" },
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    // Total Deductions
    const totalDeductionsY = doc.lastAutoTable.finalY + 5;
    autoTable(doc, {
      body: [
        [
          "Total Deductions",
          `NGN ${settlementDetails.totalDeductions?.toLocaleString() || "0"}`,
        ],
      ],
      startY: totalDeductionsY,
      theme: "grid",
      styles: {
        fontSize: 12,
        fontStyle: "bold",
        fillColor: [254, 242, 242],
      },
      columnStyles: {
        0: { fontStyle: "bold" },
        1: { halign: "right", fontStyle: "bold" },
      },
    });
  }

  // Calculation Summary
  const summaryY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setTextColor(22, 163, 74);
  doc.text("Final Settlement Calculation", 20, summaryY);

  const calculationData = [
    [
      "Basic Salary",
      `NGN ${settlementDetails.basicSalary?.toLocaleString() || "0"}`,
    ],
    [
      "+ Total Allowances",
      `NGN ${settlementDetails.totalAllowances?.toLocaleString() || "0"}`,
    ],
    [
      "= Gross Salary",
      `NGN ${
        settlementDetails.payrollData?.grossSalary?.toLocaleString() || "0"
      }`,
    ],
    [
      "- Total Deductions",
      `NGN ${settlementDetails.totalDeductions?.toLocaleString() || "0"}`,
    ],
    [
      "= Net Salary",
      `NGN ${
        settlementDetails.payrollData?.netSalary?.toLocaleString() || "0"
      }`,
    ],
    [
      "+ Gratuity (10%)",
      `NGN ${settlementDetails.gratuity?.toLocaleString() || "0"}`,
    ],
    [
      "+ Unused Leave Payment",
      `NGN ${settlementDetails.unusedLeavePayment?.toLocaleString() || "0"}`,
    ],
  ];

  autoTable(doc, {
    head: [["Calculation Step", "Amount (NGN)"]],
    body: calculationData,
    startY: summaryY + 5,
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

  // Final Total
  const finalTotalY = doc.lastAutoTable.finalY + 10;
  autoTable(doc, {
    body: [
      [
        "TOTAL FINAL SETTLEMENT",
        `NGN ${settlementDetails.totalSettlement?.toLocaleString() || "0"}`,
      ],
    ],
    startY: finalTotalY,
    theme: "grid",
    styles: {
      fontSize: 16,
      fontStyle: "bold",
      fillColor: [22, 163, 74],
      textColor: [255, 255, 255],
    },
    columnStyles: {
      0: { fontStyle: "bold" },
      1: { halign: "right", fontStyle: "bold" },
    },
  });

  // Footer
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
