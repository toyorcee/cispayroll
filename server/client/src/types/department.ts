export interface DepartmentBasic {
  _id: string; // MongoDB id
  id: string; // Add this for frontend compatibility
  name: string;
  code: string;
  employeeCount?: number;
}

export interface Department extends DepartmentBasic {
  description?: string;
  headOfDepartment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DepartmentFormData {
  id?: string; // Optional for create/update operations
  name: string;
  code: string;
  description: string;
  status: "active" | "inactive";
}
