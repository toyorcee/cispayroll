export interface DepartmentBasic {
  _id: string;
  id: string;
  name: string;
  code: string;
  employeeCount?: number;
}

export interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  location?: string;
  headOfDepartment: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  status: "active" | "inactive";
  employeeCounts: {
    total: number;
    admins: number;
    regularUsers: number;
  };
}

export interface DepartmentFormData {
  name: string;
  code: string;
  description?: string;
  location?: string;
  headOfDepartment?: string;
  status?: string;
}
