import { Employee, EmployeeDetails } from "../types/employee";

export const mapEmployeeToDetails = (employee: Employee): EmployeeDetails => {
  return {
    id: employee.id,
    employeeId: employee.employeeId,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    phone: employee.phone,
    role: employee.role,
    position: employee.position,
    gradeLevel: employee.gradeLevel,
    workLocation: employee.workLocation || "Not specified",
    department: employee.department,
    status: employee.status,
    dateJoined: employee.dateJoined,
    lastLogin: employee.lastLogin?.toString(),
    profileImage: employee.profileImage,
    createdAt: employee.createdAt.toString(),
    updatedAt: employee.updatedAt.toString(),
    emergencyContact: employee.emergencyContact || {
      name: "Not specified",
      relationship: "Not specified",
      phone: "Not specified",
    },
  };
};
