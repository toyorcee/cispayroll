export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  USER = "USER",
}

export enum Permission {
  // User Management Permissions
  CREATE_ADMIN = "CREATE_ADMIN",
  EDIT_ADMIN = "EDIT_ADMIN",
  DELETE_ADMIN = "DELETE_ADMIN",
  VIEW_ALL_ADMINS = "VIEW_ALL_ADMINS",
  CREATE_USER = "CREATE_USER",
  EDIT_USER = "EDIT_USER",
  DELETE_USER = "DELETE_USER",
  VIEW_ALL_USERS = "VIEW_ALL_USERS",

  // Department Management
  CREATE_DEPARTMENT = "CREATE_DEPARTMENT",
  EDIT_DEPARTMENT = "EDIT_DEPARTMENT",
  DELETE_DEPARTMENT = "DELETE_DEPARTMENT",
  VIEW_ALL_DEPARTMENTS = "VIEW_ALL_DEPARTMENTS",
  MANAGE_DEPARTMENT_USERS = "MANAGE_DEPARTMENT_USERS",
  ASSIGN_DEPARTMENT_ADMIN = "ASSIGN_DEPARTMENT_ADMIN",

  // Payroll Permissions
  CREATE_PAYROLL = "CREATE_PAYROLL",
  EDIT_PAYROLL = "EDIT_PAYROLL",
  DELETE_PAYROLL = "DELETE_PAYROLL",
  VIEW_ALL_PAYROLL = "VIEW_ALL_PAYROLL",
  VIEW_DEPARTMENT_PAYROLL = "VIEW_DEPARTMENT_PAYROLL",
  APPROVE_PAYROLL = "APPROVE_PAYROLL",
  GENERATE_PAYSLIP = "GENERATE_PAYSLIP",
  VIEW_REPORTS = "VIEW_REPORTS",

  // Leave Management
  APPROVE_LEAVE = "APPROVE_LEAVE",
  VIEW_TEAM_LEAVE = "VIEW_TEAM_LEAVE",
  VIEW_ALL_LEAVE = "VIEW_ALL_LEAVE",

  // Basic User Permissions
  VIEW_PERSONAL_INFO = "VIEW_PERSONAL_INFO",
  REQUEST_LEAVE = "REQUEST_LEAVE",
  VIEW_OWN_LEAVE = "VIEW_OWN_LEAVE",
  CANCEL_OWN_LEAVE = "CANCEL_OWN_LEAVE",
  VIEW_OWN_PAYSLIP = "VIEW_OWN_PAYSLIP",

  // Employee Lifecycle Management
  MANAGE_ONBOARDING = "MANAGE_ONBOARDING",
  VIEW_ONBOARDING = "VIEW_ONBOARDING",
  MANAGE_OFFBOARDING = "MANAGE_OFFBOARDING",
  VIEW_OFFBOARDING = "VIEW_OFFBOARDING",
  APPROVE_OFFBOARDING = "APPROVE_OFFBOARDING",

  // System Management
  VIEW_PAYROLL_STATS = "VIEW_PAYROLL_STATS",
  MANAGE_SYSTEM = "MANAGE_SYSTEM",
  VIEW_SYSTEM_HEALTH = "VIEW_SYSTEM_HEALTH",
  VIEW_AUDIT_LOGS = "VIEW_AUDIT_LOGS",
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
