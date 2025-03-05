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
