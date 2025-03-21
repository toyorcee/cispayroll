export interface DepartmentBasic {
  _id: string;
  id: string;
  name: string;
  code: string;
  employeeCount?: number;
}

export interface Department extends DepartmentBasic {
  description: string;
  location: string;
  headOfDepartment: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
  employeeCounts: {
    total: number;
    admins: number;
    regularUsers: number;
  };
}

export interface DepartmentFormData {
  id?: string;
  name: string;
  code: string;
  description: string;
  location: string;
  headOfDepartment: string;
  status: "active" | "inactive";
}
