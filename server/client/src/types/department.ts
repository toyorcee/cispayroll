export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  adminId?: string;
  adminName?: string;
  employeeCount?: number;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

export interface DepartmentFormData {
  name: string;
  code: string;
  description: string;
  adminId?: string;
  status: "active" | "inactive";
}
