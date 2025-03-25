import { Types } from "mongoose";
import { DepartmentBasic } from "./employee";

export interface ISalaryComponentInput {
  name: string;
  type: "fixed" | "percentage";
  value: number;
  isActive: boolean;
}

export interface ISalaryComponent extends ISalaryComponentInput {
  _id: string;
  createdBy: string;
  updatedBy: string;
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
