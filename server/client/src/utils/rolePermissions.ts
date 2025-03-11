import { UserRole, Permission } from "../types/auth";

// Define all available permissions
export const ALL_PERMISSIONS = {
  // Super Admin specific
  MANAGE_ADMINS: "manage_admins",
  MANAGE_DEPARTMENTS: "manage_departments",
  MANAGE_SYSTEM_SETTINGS: "manage_system_settings",

  // Admin level
  MANAGE_DEPARTMENT_USERS: "manage_department_users",
  MANAGE_DEPARTMENT_PAYROLL: "manage_department_payroll",
  VIEW_DEPARTMENT_REPORTS: "view_department_reports",
  APPROVE_LEAVE: "approve_leave",

  // User level
  VIEW_PERSONAL_INFO: "view_personal_info",
  VIEW_OWN_PAYSLIPS: "view_own_payslips",
  REQUEST_LEAVE: "request_leave",
  UPDATE_PROFILE: "update_profile",
} as const;

// Define role-based permissions
export const rolePermissions = {
  [UserRole.SUPER_ADMIN]: [
    ALL_PERMISSIONS.MANAGE_ADMINS,
    ALL_PERMISSIONS.MANAGE_DEPARTMENTS,
    ALL_PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
    ALL_PERMISSIONS.MANAGE_DEPARTMENT_USERS,
    ALL_PERMISSIONS.MANAGE_DEPARTMENT_PAYROLL,
    ALL_PERMISSIONS.VIEW_DEPARTMENT_REPORTS,
    ALL_PERMISSIONS.APPROVE_LEAVE,
    // Super Admin has all permissions
    ...Object.values(ALL_PERMISSIONS),
  ],
  [UserRole.ADMIN]: [
    ALL_PERMISSIONS.MANAGE_DEPARTMENT_USERS,
    ALL_PERMISSIONS.MANAGE_DEPARTMENT_PAYROLL,
    ALL_PERMISSIONS.VIEW_DEPARTMENT_REPORTS,
    ALL_PERMISSIONS.APPROVE_LEAVE,
    // Admin also has user permissions
    ALL_PERMISSIONS.VIEW_PERSONAL_INFO,
    ALL_PERMISSIONS.VIEW_OWN_PAYSLIPS,
    ALL_PERMISSIONS.REQUEST_LEAVE,
    ALL_PERMISSIONS.UPDATE_PROFILE,
  ],
  [UserRole.USER]: [
    ALL_PERMISSIONS.VIEW_PERSONAL_INFO,
    ALL_PERMISSIONS.VIEW_OWN_PAYSLIPS,
    ALL_PERMISSIONS.REQUEST_LEAVE,
    ALL_PERMISSIONS.UPDATE_PROFILE,
  ],
};
