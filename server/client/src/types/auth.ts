export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  USER = "USER",
}

export enum Permission {
  MANAGE_USERS = "MANAGE_USERS",
  MANAGE_ADMINS = "MANAGE_ADMINS",
  MANAGE_PAYROLL = "MANAGE_PAYROLL",
  VIEW_REPORTS = "VIEW_REPORTS",
  MANAGE_DEPARTMENTS = "MANAGE_DEPARTMENTS",
  APPROVE_LEAVE = "APPROVE_LEAVE",
  VIEW_PERSONAL_INFO = "VIEW_PERSONAL_INFO",
  REQUEST_LEAVE = "REQUEST_LEAVE",
  VIEW_OWN_LEAVE = "VIEW_OWN_LEAVE",
  CANCEL_OWN_LEAVE = "CANCEL_OWN_LEAVE",
  VIEW_TEAM_LEAVE = "VIEW_TEAM_LEAVE",
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface User {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  permissions: Permission[];
  department?: string;
  position: string;
  gradeLevel: string;
  workLocation: string;
  dateJoined: Date;
  status: "active" | "inactive" | "suspended";
  emergencyContact: EmergencyContact;
  bankDetails: BankDetails;
  profileImage?: string;
  reportingTo?: {
    id: string;
    name: string;
    position: string;
  };
  isEmailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}
