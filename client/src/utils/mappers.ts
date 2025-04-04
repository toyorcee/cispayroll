import { Employee, EmployeeDetails, Department } from "../types/employee";

export const mapEmployeeToDetails = (employee: Employee): EmployeeDetails => {
  return {
    ...employee,
    fullName: `${employee.firstName} ${employee.lastName}`,
    department:
      typeof employee.department === "string"
        ? employee.department
        : (employee.department as Department)._id,
    createdAt: new Date(employee.createdAt),
    updatedAt: new Date(employee.updatedAt),
    lastLogin: employee.lastLogin ? new Date(employee.lastLogin) : undefined,
  };
};
