import { DepartmentBasic } from "./employee";

// Define the possible types as constants
export type ComponentType = "allowance" | "deduction";
export type CalculationMethod = "fixed" | "percentage";

// Interface for creating a new component
export interface ISalaryComponentInput {
  name: string;
  type: ComponentType;
  calculationMethod: CalculationMethod;
  value: number;
  isActive: boolean;
}

// Interface for creating a new salary grade
export interface CreateSalaryGradeDTO {
  level: string;
  basicSalary: number;
  description: string;
  department: string | null;
  components: ISalaryComponentInput[];
}

// Interface for a component in the response
export interface ISalaryComponent extends ISalaryComponentInput {
  _id: string;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    fullName: string;
    id: string;
  };
  updatedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    fullName: string;
    id: string;
  };
}

export interface ISalaryGrade {
  _id: string;
  level: string;
  basicSalary: number;
  components: ISalaryComponent[];
  description?: string;
  isActive: boolean;
  department?: DepartmentBasic;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalaryStructure {
  id: number;
  grade: string;
  title: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  medicalAllowance: number;
  totalPackage: number;
  department: string;
  employees: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface SalaryStructureSummary {
  totalGradeLevels: number;
  departmentsCovered: number;
  averagePackage: number;
}
