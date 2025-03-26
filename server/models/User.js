import mongoose from "mongoose";
const { Schema, Types } = mongoose;

// Enums
export const UserRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  USER: "USER",
};

export const Permission = {
  // ===== User Management Permissions =====
  // Super Admin Only
  CREATE_ADMIN: "CREATE_ADMIN",
  EDIT_ADMIN: "EDIT_ADMIN",
  DELETE_ADMIN: "DELETE_ADMIN",
  VIEW_ALL_ADMINS: "VIEW_ALL_ADMINS",

  // Admin & Super Admin
  CREATE_USER: "CREATE_USER",
  EDIT_USER: "EDIT_USER",
  DELETE_USER: "DELETE_USER",
  VIEW_ALL_USERS: "VIEW_ALL_USERS",

  // ===== Department Management =====
  CREATE_DEPARTMENT: "CREATE_DEPARTMENT",
  EDIT_DEPARTMENT: "EDIT_DEPARTMENT",
  DELETE_DEPARTMENT: "DELETE_DEPARTMENT",
  VIEW_ALL_DEPARTMENTS: "VIEW_ALL_DEPARTMENTS",
  MANAGE_DEPARTMENT_USERS: "MANAGE_DEPARTMENT_USERS",

  // ===== Payroll Permissions =====
  CREATE_PAYROLL: "CREATE_PAYROLL",
  EDIT_PAYROLL: "EDIT_PAYROLL",
  DELETE_PAYROLL: "DELETE_PAYROLL",
  VIEW_ALL_PAYROLL: "VIEW_ALL_PAYROLL",
  VIEW_DEPARTMENT_PAYROLL: "VIEW_DEPARTMENT_PAYROLL",
  APPROVE_PAYROLL: "APPROVE_PAYROLL",
  GENERATE_PAYSLIP: "GENERATE_PAYSLIP",
  VIEW_REPORTS: "VIEW_REPORTS",

  // ===== Leave Management =====
  APPROVE_LEAVE: "APPROVE_LEAVE",
  VIEW_TEAM_LEAVE: "VIEW_TEAM_LEAVE",
  VIEW_ALL_LEAVE: "VIEW_ALL_LEAVE",

  // ===== Basic User Permissions =====
  VIEW_PERSONAL_INFO: "VIEW_PERSONAL_INFO",
  REQUEST_LEAVE: "REQUEST_LEAVE",
  VIEW_OWN_LEAVE: "VIEW_OWN_LEAVE",
  CANCEL_OWN_LEAVE: "CANCEL_OWN_LEAVE",
  VIEW_OWN_PAYSLIP: "VIEW_OWN_PAYSLIP",

  // Employee Lifecycle Management
  MANAGE_ONBOARDING: "MANAGE_ONBOARDING",
  VIEW_ONBOARDING: "VIEW_ONBOARDING",
  MANAGE_OFFBOARDING: "MANAGE_OFFBOARDING",
  VIEW_OFFBOARDING: "VIEW_OFFBOARDING",
  APPROVE_OFFBOARDING: "APPROVE_OFFBOARDING",

  // System Management
  VIEW_PAYROLL_STATS: "VIEW_PAYROLL_STATS",
  MANAGE_SYSTEM: "MANAGE_SYSTEM",
  VIEW_SYSTEM_HEALTH: "VIEW_SYSTEM_HEALTH",
  VIEW_AUDIT_LOGS: "VIEW_AUDIT_LOGS",

  // Salary Structure Management
  MANAGE_SALARY_STRUCTURE: "MANAGE_SALARY_STRUCTURE",
  VIEW_SALARY_STRUCTURE: "VIEW_SALARY_STRUCTURE",
  EDIT_SALARY_STRUCTURE: "EDIT_SALARY_STRUCTURE",

  // Deductions Management
  MANAGE_DEDUCTIONS: "MANAGE_DEDUCTIONS",
  VIEW_DEDUCTIONS: "VIEW_DEDUCTIONS",
  EDIT_DEDUCTIONS: "EDIT_DEDUCTIONS",

  // Allowances Management
  MANAGE_ALLOWANCES: "MANAGE_ALLOWANCES",
  VIEW_ALLOWANCES: "VIEW_ALLOWANCES",
  EDIT_ALLOWANCES: "EDIT_ALLOWANCES",
  CREATE_ALLOWANCES: "CREATE_ALLOWANCES",
  DELETE_ALLOWANCES: "DELETE_ALLOWANCES",
  APPROVE_ALLOWANCES: "APPROVE_ALLOWANCES",
  REQUEST_ALLOWANCES: "REQUEST_ALLOWANCES",
  VIEW_OWN_ALLOWANCES: "VIEW_OWN_ALLOWANCES",

  // Bonuses & Overtime Management
  MANAGE_BONUSES: "MANAGE_BONUSES",
  VIEW_BONUSES: "VIEW_BONUSES",
  EDIT_BONUSES: "EDIT_BONUSES",
  MANAGE_OVERTIME: "MANAGE_OVERTIME",

  // Reports & Analytics
  VIEW_PAYROLL_REPORTS: "VIEW_PAYROLL_REPORTS",
  VIEW_EMPLOYEE_REPORTS: "VIEW_EMPLOYEE_REPORTS",
  VIEW_TAX_REPORTS: "VIEW_TAX_REPORTS",

  // Additional System Settings
  MANAGE_TAX_CONFIG: "MANAGE_TAX_CONFIG",
  MANAGE_COMPLIANCE: "MANAGE_COMPLIANCE",
  MANAGE_NOTIFICATIONS: "MANAGE_NOTIFICATIONS",
  MANAGE_INTEGRATIONS: "MANAGE_INTEGRATIONS",
  MANAGE_DOCUMENTS: "MANAGE_DOCUMENTS",
  EDIT_PERSONAL_INFO: "EDIT_PERSONAL_INFO",
  VIEW_OWN_DEDUCTIONS: "VIEW_OWN_DEDUCTIONS",

  // ===== Disciplinary =====
  VIEW_DISCIPLINARY_RECORDS: "VIEW_DISCIPLINARY_RECORDS",
  MANAGE_DISCIPLINARY_ACTIONS: "MANAGE_DISCIPLINARY_ACTIONS",
};

export const OnboardingStatus = {
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
};

// Schema Definition
const UserSchema = new Schema(
  {
    employeeId: {
      type: String,
      required: function () {
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
    invitationExpires: Date,
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
    onboarding: {
      status: {
        type: String,
        enum: Object.values(OnboardingStatus),
        default: OnboardingStatus.NOT_STARTED,
      },
      tasks: [
        {
          name: { type: String, required: true },
          completed: { type: Boolean, default: false },
          completedAt: Date,
        },
      ],
      progress: { type: Number, default: 0 },
      startedAt: Date,
      completedAt: Date,
    },
    salaryGrade: {
      type: Schema.Types.ObjectId,
      ref: "SalaryGrade",
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Methods
UserSchema.methods.hasPermission = function (permission) {
  return this.permissions.includes(permission);
};

UserSchema.methods.hasRole = function (role) {
  if (this.role === UserRole.SUPER_ADMIN) return true;
  if (this.role === UserRole.ADMIN && role === UserRole.USER) return true;
  return this.role === role;
};

// Add helper methods to match ROLE_PERMISSIONS structure
UserSchema.methods.canCreateAdmin = function () {
  return this.hasPermission(Permission.CREATE_ADMIN);
};

UserSchema.methods.canCreateUser = function () {
  return this.hasPermission(Permission.CREATE_USER);
};

UserSchema.methods.canEditAdmin = function () {
  return this.hasPermission(Permission.EDIT_ADMIN);
};

UserSchema.methods.canEditUser = function () {
  return this.hasPermission(Permission.EDIT_USER);
};

UserSchema.methods.canViewAll = function () {
  return this.hasPermission(Permission.VIEW_ALL_USERS);
};

// Virtuals
UserSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware for permissions
UserSchema.pre("save", function (next) {
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
          Permission.CREATE_ALLOWANCES,
          Permission.DELETE_ALLOWANCES,
          Permission.APPROVE_ALLOWANCES,
          Permission.REQUEST_ALLOWANCES,
          Permission.VIEW_OWN_ALLOWANCES,

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

          Permission.VIEW_DISCIPLINARY_RECORDS,
          Permission.MANAGE_DISCIPLINARY_ACTIONS,
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

          // Allowances Management
          Permission.VIEW_ALLOWANCES,
          Permission.APPROVE_ALLOWANCES,
          Permission.VIEW_OWN_ALLOWANCES,
          Permission.REQUEST_ALLOWANCES,

          // Deductions Management
          Permission.VIEW_DEDUCTIONS,
          Permission.EDIT_DEDUCTIONS,
        ];
        break;

      case UserRole.USER:
        this.permissions = [
          Permission.VIEW_PERSONAL_INFO,
          Permission.REQUEST_LEAVE,
          Permission.VIEW_OWN_LEAVE,
          Permission.CANCEL_OWN_LEAVE,
          Permission.VIEW_OWN_PAYSLIP,
          Permission.VIEW_OWN_ALLOWANCES,
          Permission.REQUEST_ALLOWANCES,
          Permission.VIEW_OWN_DEDUCTIONS,
        ];
        break;
    }
  }
  next();
});

// JSON Transform
UserSchema.set("toJSON", {
  virtuals: true,
  transform: function (_doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

// Clear existing indexes and add new ones
UserSchema.clearIndexes();
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ employeeId: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ department: 1 });
UserSchema.index({ status: 1 });

export default mongoose.model("User", UserSchema);
