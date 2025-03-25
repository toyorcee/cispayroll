import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const generateExitLetter = async (employee: any) => {
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

export const generateClearanceForm = async (employee: any) => {
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

export const generateExperienceLetter = async (employee: any) => {
  const doc = new jsPDF();
  // ... implement experience letter generation
  return doc;
};

export const generateFinalSettlementReport = async (employee: any) => {
  const doc = new jsPDF();
  // ... implement final settlement report generation
  return doc;
};
