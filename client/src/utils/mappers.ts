import { Employee, EmployeeDetails, Department } from "../types/employee";

export const mapEmployeeToDetails = (employee: Employee): EmployeeDetails => {
  if (!employee) {
    throw new Error("Cannot map undefined employee to details");
  }

  return {
    ...employee,
    fullName: `${employee.firstName || ""} ${employee.lastName || ""}`.trim(),
    department:
      typeof employee.department === "string"
        ? ({ _id: employee.department, name: "", code: "" } as Department)
        : (employee.department as Department),
    createdAt: employee.createdAt ? new Date(employee.createdAt) : new Date(),
    updatedAt: employee.updatedAt ? new Date(employee.updatedAt) : new Date(),
    lastLogin: employee.lastLogin ? new Date(employee.lastLogin) : undefined,
  };
};
