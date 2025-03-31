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

// Interface for updating a salary grade
export interface UpdateSalaryGradeInput {
  level?: string;
  basicSalary?: number;
  description?: string;
  department?: string;
  components?: ISalaryComponentInput[];
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
export interface ISalaryComponent {
  _id: string;
  name: string;
  type: "allowance" | "deduction";
  calculationMethod: "fixed" | "percentage";
  value: number;
  isActive: boolean;
  description?: string;
  createdBy: string;
  updatedBy: string;
}

export interface SalaryComponent {
  _id: string;
  name: string;
  type: "allowance" | "deduction";
  calculationMethod: "percentage" | "fixed";
  value: number;
  isActive: boolean;
}

export interface ISalaryGrade {
  _id: string;
  level: string;
  basicSalary: number;
  description: string;
  isActive: boolean;
  department?: {
    _id: string;
    name: string;
  } | null;
  departmentName?: string;
  components: ISalaryComponent[];
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  totalAllowances?: number;
  grossSalary?: number;
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
