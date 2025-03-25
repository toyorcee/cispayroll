import { UserDocument } from "../types/document";

export const mockDocuments: UserDocument[] = [
  {
    id: "1",
    employeeId: "EMP001",
    title: "Tax Clearance Certificate",
    type: "tax",
    fileUrl: "/documents/tax-clearance-2024.pdf",
    status: "approved",
    uploadedAt: new Date("2024-01-15"),
    description: "Annual tax clearance certificate for 2024",
    expiryDate: new Date("2024-12-31"),
    isRequired: true,
  },
  // Add more mock documents...
];
