import { Employee, EmployeeDetails } from "../types/employee";

export const mapEmployeeToDetails = (employee: Employee): EmployeeDetails => {
  return {
    ...employee,
    workLocation: employee.workLocation || "Not specified",
    emergencyContact: {
      name: "Not specified",
      relationship: "Not specified",
      phone: "Not specified",
    },
    socialLinks: {},
    skills: [],
    documents: {},
  };
};
