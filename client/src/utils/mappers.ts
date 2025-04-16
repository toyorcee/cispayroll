import { Employee, EmployeeDetails, Department } from "../types/employee";

export const mapEmployeeToDetails = (employee: Employee): EmployeeDetails => {
  return {
    ...employee,
    fullName: `${employee.firstName} ${employee.lastName}`,
    department: typeof employee.department === "string" 
      ? { _id: employee.department, name: "", code: "" } as Department
      : employee.department as Department,
    createdAt: new Date(employee.createdAt),
    updatedAt: new Date(employee.updatedAt),
    lastLogin: employee.lastLogin ? new Date(employee.lastLogin) : undefined,
  };
};