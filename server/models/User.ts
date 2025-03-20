// models/User.ts
import mongoose, { Schema, Model, Types } from "mongoose";

// Define role types
export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  USER = "USER",
}

// Define permission types with clear categorization
export enum Permission {
  // ===== User Management Permissions =====
  // Super Admin Only
  CREATE_ADMIN = "CREATE_ADMIN",
  EDIT_ADMIN = "EDIT_ADMIN",
  DELETE_ADMIN = "DELETE_ADMIN",
  VIEW_ALL_ADMINS = "VIEW_ALL_ADMINS",

  // Admin & Super Admin
  CREATE_USER = "CREATE_USER",
  EDIT_USER = "EDIT_USER",
  DELETE_USER = "DELETE_USER",
  VIEW_ALL_USERS = "VIEW_ALL_USERS",

  // ===== Department Management =====
  CREATE_DEPARTMENT = "CREATE_DEPARTMENT", // New: Super Admin only
  EDIT_DEPARTMENT = "EDIT_DEPARTMENT", // New: Super Admin only
  DELETE_DEPARTMENT = "DELETE_DEPARTMENT", // New: Super Admin only
  VIEW_ALL_DEPARTMENTS = "VIEW_ALL_DEPARTMENTS", // New: Both Admin and Super Admin
  MANAGE_DEPARTMENT_USERS = "MANAGE_DEPARTMENT_USERS", // New: Admin can manage users in their department

  // ===== Payroll Permissions =====
  CREATE_PAYROLL = "CREATE_PAYROLL", // New: Super Admin & Admin
  EDIT_PAYROLL = "EDIT_PAYROLL", // New: Super Admin & Admin
  DELETE_PAYROLL = "DELETE_PAYROLL", // New: Super Admin only
  VIEW_ALL_PAYROLL = "VIEW_ALL_PAYROLL", // New: Super Admin can view all payroll
  VIEW_DEPARTMENT_PAYROLL = "VIEW_DEPARTMENT_PAYROLL", // New: Admin can view department payroll
  APPROVE_PAYROLL = "APPROVE_PAYROLL", // New: Super Admin only
  GENERATE_PAYSLIP = "GENERATE_PAYSLIP", // New: Admin & Super Admin
  VIEW_REPORTS = "VIEW_REPORTS",

  // ===== Leave Management =====
  APPROVE_LEAVE = "APPROVE_LEAVE",
  VIEW_TEAM_LEAVE = "VIEW_TEAM_LEAVE",
  VIEW_ALL_LEAVE = "VIEW_ALL_LEAVE", // New: Super Admin can view all leave requests

  // ===== Basic User Permissions =====
  VIEW_PERSONAL_INFO = "VIEW_PERSONAL_INFO",
  REQUEST_LEAVE = "REQUEST_LEAVE",
  VIEW_OWN_LEAVE = "VIEW_OWN_LEAVE",
  CANCEL_OWN_LEAVE = "CANCEL_OWN_LEAVE",
  VIEW_OWN_PAYSLIP = "VIEW_OWN_PAYSLIP", // New: All users can view their payslip

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

  // Salary Structure Management
  MANAGE_SALARY_STRUCTURE = "MANAGE_SALARY_STRUCTURE",
  VIEW_SALARY_STRUCTURE = "VIEW_SALARY_STRUCTURE",
  EDIT_SALARY_STRUCTURE = "EDIT_SALARY_STRUCTURE",

  // Deductions Management
  MANAGE_DEDUCTIONS = "MANAGE_DEDUCTIONS",
  VIEW_DEDUCTIONS = "VIEW_DEDUCTIONS",
  EDIT_DEDUCTIONS = "EDIT_DEDUCTIONS",

  // Allowances Management
  MANAGE_ALLOWANCES = "MANAGE_ALLOWANCES",
  VIEW_ALLOWANCES = "VIEW_ALLOWANCES",
  EDIT_ALLOWANCES = "EDIT_ALLOWANCES",

  // Bonuses & Overtime Management
  MANAGE_BONUSES = "MANAGE_BONUSES",
  VIEW_BONUSES = "VIEW_BONUSES",
  EDIT_BONUSES = "EDIT_BONUSES",
  MANAGE_OVERTIME = "MANAGE_OVERTIME",

  // Reports & Analytics
  VIEW_PAYROLL_REPORTS = "VIEW_PAYROLL_REPORTS",
  VIEW_EMPLOYEE_REPORTS = "VIEW_EMPLOYEE_REPORTS",
  VIEW_TAX_REPORTS = "VIEW_TAX_REPORTS",

  // Additional System Settings
  MANAGE_TAX_CONFIG = "MANAGE_TAX_CONFIG",
  MANAGE_COMPLIANCE = "MANAGE_COMPLIANCE",
  MANAGE_NOTIFICATIONS = "MANAGE_NOTIFICATIONS",
  MANAGE_INTEGRATIONS = "MANAGE_INTEGRATIONS",
  MANAGE_DOCUMENTS = "MANAGE_DOCUMENTS",
  EDIT_PERSONAL_INFO = "EDIT_PERSONAL_INFO",
}

// Add these interfaces at the top with your other interfaces
interface OffboardingChecklist {
  exitInterview: boolean;
  assetsReturned: boolean;
  knowledgeTransfer: boolean;
  accessRevoked: boolean;
  finalSettlement: boolean;
}

interface Offboarding {
  status: "pending_exit" | "in_progress" | "completed";
  checklist: OffboardingChecklist;
  initiatedAt: Date;
  initiatedBy: Types.ObjectId;
  completedAt?: Date;
  completedBy?: Types.ObjectId;
  progress: number;
}

// Base interface for user properties
export interface IUser {
  employeeId: string;
  firstName: string;
  lastName: string;
  password?: string;
  googleId?: string;
  email: string;
  phone: string;
  role: UserRole;
  permissions: Permission[];
  department?: string;
  position: string;
  gradeLevel: string;
  workLocation: string;
  dateJoined: Date;
  status:
    | "pending" // New hire, onboarding
    | "active" // Regular employee
    | "inactive" // Temporary inactive
    | "suspended" // Disciplinary
    | "offboarding" // In process of leaving
    | "terminated"; // Employment ended (replacing archived)
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  profileImage?: string;
  reportingTo?: Types.ObjectId;
  isEmailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  invitationToken?: string;
  invitationExpires?: Date;
  createdBy?: Types.ObjectId;
  offboarding?: Offboarding;
}

// Interface for user methods
export interface IUserMethods {
  hasPermission(permission: Permission): boolean;
  hasRole(role: UserRole): boolean;
}

// Update the UserDocument interface
export interface UserDocument extends mongoose.Document {
  _id: Types.ObjectId;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password?: string;
  role: UserRole;
  permissions: Permission[];
  department?: string;
  position: string;
  gradeLevel: string;
  workLocation: string;
  dateJoined: Date;
  status:
    | "pending"
    | "active"
    | "inactive"
    | "suspended"
    | "offboarding"
    | "terminated";
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  profileImage?: string;
  reportingTo?: Types.ObjectId;
  isEmailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  invitationToken?: string;
  invitationExpires?: Date;
  createdBy?: Types.ObjectId;
  offboarding?: Offboarding;
  hasPermission(permission: Permission): boolean;
  hasRole(role: UserRole): boolean;
}

// Create the model type
export type UserModel = Model<UserDocument>;

const UserSchema = new Schema<UserDocument, UserModel>(
  {
    employeeId: {
      type: String,
      required: function () {
        // Only required for employees, not for super admin
        return this.role !== UserRole.SUPER_ADMIN;
      },
      trim: true,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: function () {
        return this.role !== UserRole.SUPER_ADMIN;
      },
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return this.status !== "pending";
      },
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
      required: true,
    },
    permissions: [
      {
        type: String,
        enum: Object.values(Permission),
      },
    ],
    department: {
      type: String,
      trim: true,
    },
    position: {
      type: String,
      required: function () {
        return this.role !== UserRole.SUPER_ADMIN;
      },
      trim: true,
    },
    gradeLevel: {
      type: String,
      required: function () {
        return this.role !== UserRole.SUPER_ADMIN;
      },
      trim: true,
    },
    workLocation: {
      type: String,
      required: function () {
        return this.role !== UserRole.SUPER_ADMIN;
      },
      trim: true,
    },
    dateJoined: {
      type: Date,
      required: function () {
        return this.role !== UserRole.SUPER_ADMIN;
      },
    },
    status: {
      type: String,
      enum: [
        "pending",
        "active",
        "inactive",
        "suspended",
        "offboarding",
        "terminated",
      ],
      default: "pending",
    },
    emergencyContact: {
      name: {
        type: String,
        required: function () {
          return this.status === "active" && this.role === UserRole.USER;
        },
      },
      relationship: {
        type: String,
        required: function () {
          return this.status === "active" && this.role === UserRole.USER;
        },
      },
      phone: {
        type: String,
        required: function () {
          return this.status === "active" && this.role === UserRole.USER;
        },
      },
    },
    bankDetails: {
      bankName: {
        type: String,
        required: function () {
          return this.status === "active" && this.role === UserRole.USER;
        },
      },
      accountNumber: {
        type: String,
        required: function () {
          return this.status === "active" && this.role === UserRole.USER;
        },
      },
      accountName: {
        type: String,
        required: function () {
          return this.status === "active" && this.role === UserRole.USER;
        },
      },
    },
    profileImage: String,
    reportingTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: Date,
    invitationToken: {
      type: String,
      index: true,
    },
    invitationExpires: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    offboarding: {
      status: {
        type: String,
        enum: ["pending_exit", "in_progress", "completed"],
        default: "pending_exit",
      },
      checklist: {
        exitInterview: { type: Boolean, default: false },
        assetsReturned: { type: Boolean, default: false },
        knowledgeTransfer: { type: Boolean, default: false },
        accessRevoked: { type: Boolean, default: false },
        finalSettlement: { type: Boolean, default: false },
      },
      initiatedAt: Date,
      initiatedBy: { type: Schema.Types.ObjectId, ref: "User" },
      completedAt: Date,
      completedBy: { type: Schema.Types.ObjectId, ref: "User" },
      progress: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Add methods
UserSchema.methods.hasPermission = function (
  this: UserDocument,
  permission: Permission
): boolean {
  return this.permissions.includes(permission);
};

UserSchema.methods.hasRole = function (
  this: UserDocument,
  role: UserRole
): boolean {
  if (this.role === UserRole.SUPER_ADMIN) return true;
  if (this.role === UserRole.ADMIN && role === UserRole.USER) return true;
  return this.role === role;
};

// Update the pre-save middleware with enhanced permissions
UserSchema.pre("save", function (this: UserDocument, next) {
  if (
    this.isModified("role") &&
    (!this.permissions || this.permissions.length === 0)
  ) {
    switch (this.role) {
      case UserRole.SUPER_ADMIN:
        this.permissions = [
          // User Management
          Permission.CREATE_ADMIN,
          Permission.EDIT_ADMIN,
          Permission.DELETE_ADMIN,
          Permission.VIEW_ALL_ADMINS,
          Permission.CREATE_USER,
          Permission.EDIT_USER,
          Permission.DELETE_USER,
          Permission.VIEW_ALL_USERS,

          // Department Management
          Permission.CREATE_DEPARTMENT,
          Permission.EDIT_DEPARTMENT,
          Permission.DELETE_DEPARTMENT,
          Permission.VIEW_ALL_DEPARTMENTS,
          Permission.MANAGE_DEPARTMENT_USERS,

          // Payroll Management
          Permission.CREATE_PAYROLL,
          Permission.EDIT_PAYROLL,
          Permission.DELETE_PAYROLL,
          Permission.VIEW_ALL_PAYROLL,
          Permission.APPROVE_PAYROLL,
          Permission.GENERATE_PAYSLIP,
          Permission.VIEW_REPORTS,

          // Leave Management
          Permission.APPROVE_LEAVE,
          Permission.VIEW_TEAM_LEAVE,
          Permission.VIEW_ALL_LEAVE,

          // Basic Permissions
          Permission.VIEW_PERSONAL_INFO,
          Permission.REQUEST_LEAVE,
          Permission.VIEW_OWN_LEAVE,
          Permission.CANCEL_OWN_LEAVE,
          Permission.VIEW_OWN_PAYSLIP,

          // Employee Lifecycle Management
          Permission.MANAGE_ONBOARDING,
          Permission.VIEW_ONBOARDING,
          Permission.MANAGE_OFFBOARDING,
          Permission.VIEW_OFFBOARDING,
          Permission.APPROVE_OFFBOARDING,

          // System Management
          Permission.VIEW_PAYROLL_STATS,
          Permission.MANAGE_SYSTEM,
          Permission.VIEW_SYSTEM_HEALTH,
          Permission.VIEW_AUDIT_LOGS,

          // Salary Structure Management
          Permission.MANAGE_SALARY_STRUCTURE,
          Permission.VIEW_SALARY_STRUCTURE,
          Permission.EDIT_SALARY_STRUCTURE,

          // Deductions Management
          Permission.MANAGE_DEDUCTIONS,
          Permission.VIEW_DEDUCTIONS,
          Permission.EDIT_DEDUCTIONS,

          // Allowances Management
          Permission.MANAGE_ALLOWANCES,
          Permission.VIEW_ALLOWANCES,
          Permission.EDIT_ALLOWANCES,

          // Bonuses & Overtime Management
          Permission.MANAGE_BONUSES,
          Permission.VIEW_BONUSES,
          Permission.EDIT_BONUSES,
          Permission.MANAGE_OVERTIME,

          // Reports & Analytics
          Permission.VIEW_PAYROLL_REPORTS,
          Permission.VIEW_EMPLOYEE_REPORTS,
          Permission.VIEW_TAX_REPORTS,

          // Additional System Settings
          Permission.MANAGE_TAX_CONFIG,
          Permission.MANAGE_COMPLIANCE,
          Permission.MANAGE_NOTIFICATIONS,
          Permission.MANAGE_INTEGRATIONS,
          Permission.MANAGE_DOCUMENTS,
          Permission.EDIT_PERSONAL_INFO,
        ];
        break;

      case UserRole.ADMIN:
        this.permissions = [
          // User Management (User-level only)
          Permission.CREATE_USER,
          Permission.EDIT_USER,
          Permission.DELETE_USER,
          Permission.VIEW_ALL_USERS,

          // Department Management
          Permission.VIEW_ALL_DEPARTMENTS,
          Permission.MANAGE_DEPARTMENT_USERS,

          // Payroll Management
          Permission.CREATE_PAYROLL,
          Permission.EDIT_PAYROLL,
          Permission.VIEW_DEPARTMENT_PAYROLL,
          Permission.GENERATE_PAYSLIP,
          Permission.VIEW_REPORTS,

          // Leave Management
          Permission.APPROVE_LEAVE,
          Permission.VIEW_TEAM_LEAVE,

          // Basic Permissions
          Permission.VIEW_PERSONAL_INFO,
          Permission.REQUEST_LEAVE,
          Permission.VIEW_OWN_LEAVE,
          Permission.CANCEL_OWN_LEAVE,
          Permission.VIEW_OWN_PAYSLIP,

          // Employee Lifecycle Management
          Permission.VIEW_ONBOARDING,
          Permission.MANAGE_ONBOARDING,
          Permission.VIEW_OFFBOARDING,
          Permission.MANAGE_OFFBOARDING,

          // Salary Structure Management
          Permission.VIEW_SALARY_STRUCTURE,
          Permission.EDIT_SALARY_STRUCTURE,
        ];
        break;

      case UserRole.USER:
        this.permissions = [
          Permission.VIEW_PERSONAL_INFO,
          Permission.REQUEST_LEAVE,
          Permission.VIEW_OWN_LEAVE,
          Permission.CANCEL_OWN_LEAVE,
          Permission.VIEW_OWN_PAYSLIP,
        ];
        break;
    }
  }
  next();
});

// Add helper methods to match ROLE_PERMISSIONS structure
UserSchema.methods.canCreateAdmin = function (this: UserDocument): boolean {
  return this.hasPermission(Permission.CREATE_ADMIN);
};

UserSchema.methods.canCreateUser = function (this: UserDocument): boolean {
  return this.hasPermission(Permission.CREATE_USER);
};

UserSchema.methods.canEditAdmin = function (this: UserDocument): boolean {
  return this.hasPermission(Permission.EDIT_ADMIN);
};

UserSchema.methods.canEditUser = function (this: UserDocument): boolean {
  return this.hasPermission(Permission.EDIT_USER);
};

UserSchema.methods.canViewAll = function (this: UserDocument): boolean {
  return this.hasPermission(Permission.VIEW_ALL_USERS);
};

UserSchema.virtual("fullName").get(function (this: UserDocument) {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.set("toJSON", {
  virtuals: true,
  transform: function (_doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

// At the bottom, AFTER all schema definitions and BEFORE model export
// Remove any existing indexes first
UserSchema.clearIndexes();

// Then add our indexes - REMOVE the bankDetails index
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ employeeId: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ department: 1 });
UserSchema.index({ status: 1 });

export default mongoose.model<UserDocument, UserModel>("User", UserSchema);
