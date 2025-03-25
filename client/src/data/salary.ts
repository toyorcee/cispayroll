import { SalaryStructure, Department, SalaryStructureSummary } from '../types/salary';

export const departments: Department[] = [
  { id: '1', name: 'All Departments', code: 'all' },
  { id: '2', name: 'Engineering', code: 'engineering' },
  { id: '3', name: 'Marketing', code: 'marketing' },
  { id: '4', name: 'Sales', code: 'sales' },
  { id: '5', name: 'HR', code: 'hr' },
];

export const salaryStructures: SalaryStructure[] = [
  {
    id: 1,
    grade: "L1",
    title: "Entry Level",
    basicSalary: 250000,
    housingAllowance: 50000,
    transportAllowance: 30000,
    medicalAllowance: 20000,
    totalPackage: 350000,
    department: "All Departments",
    employees: 12,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: 2,
    grade: "L2",
    title: "Junior Level",
    basicSalary: 400000,
    housingAllowance: 80000,
    transportAllowance: 50000,
    medicalAllowance: 30000,
    totalPackage: 560000,
    department: "All Departments",
    employees: 15,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: 3,
    grade: "M1",
    title: "Mid Level",
    basicSalary: 600000,
    housingAllowance: 120000,
    transportAllowance: 75000,
    medicalAllowance: 45000,
    totalPackage: 840000,
    department: "All Departments",
    employees: 8,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: 4,
    grade: "S1",
    title: "Senior Level",
    basicSalary: 1000000,
    housingAllowance: 200000,
    transportAllowance: 100000,
    medicalAllowance: 75000,
    totalPackage: 1375000,
    department: "All Departments",
    employees: 7,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

export const calculateSalarySummary = (): SalaryStructureSummary => {
  const totalGradeLevels = salaryStructures.length;
  const uniqueDepartments = new Set(salaryStructures.map(s => s.department));
  const averagePackage = salaryStructures.reduce((acc, curr) => acc + curr.totalPackage, 0) / totalGradeLevels;

  return {
    totalGradeLevels,
    departmentsCovered: uniqueDepartments.size,
    averagePackage,
  };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};