export interface UserDocument {
  id: string;
  employeeId: string;
  title: string;
  type: "tax" | "payslip" | "contract" | "id" | "other";
  fileUrl: string;
  status: "pending" | "approved" | "rejected";
  uploadedAt: Date;
  description?: string;
  expiryDate?: Date;
  isRequired: boolean;
}
