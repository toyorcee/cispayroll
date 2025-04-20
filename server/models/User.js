import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
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
  VIEW_DEPARTMENT_STATS: "VIEW_DEPARTMENT_STATS",

  // ===== Payroll Permissions =====
  CREATE_PAYROLL: "CREATE_PAYROLL",
  EDIT_PAYROLL: "EDIT_PAYROLL",
  DELETE_PAYROLL: "DELETE_PAYROLL",
  VIEW_ALL_PAYROLL: "VIEW_ALL_PAYROLL",
  VIEW_DEPARTMENT_PAYROLL: "VIEW_DEPARTMENT_PAYROLL",
  APPROVE_PAYROLL: "APPROVE_PAYROLL",
  GENERATE_PAYSLIP: "GENERATE_PAYSLIP",
  VIEW_REPORTS: "VIEW_REPORTS",
  PROCESS_PAYMENT: "PROCESS_PAYMENT",
  MARK_PAYMENT_FAILED: "MARK_PAYMENT_FAILED",
  VIEW_PAYMENT_HISTORY: "VIEW_PAYMENT_HISTORY",
  MANAGE_PAYMENT_METHODS: "MANAGE_PAYMENT_METHODS",

  // New specific payslip permissions
  VIEW_ALL_PAYSLIPS: "VIEW_ALL_PAYSLIPS",
  VIEW_DEPARTMENT_PAYSLIPS: "VIEW_DEPARTMENT_PAYSLIPS",
  VIEW_OWN_PAYSLIP: "VIEW_OWN_PAYSLIP",

  // ===== Leave Management =====
  APPROVE_LEAVE: "APPROVE_LEAVE",
  VIEW_TEAM_LEAVE: "VIEW_TEAM_LEAVE",
  VIEW_ALL_LEAVE: "VIEW_ALL_LEAVE",

  // ===== Basic User Permissions =====
  VIEW_PERSONAL_INFO: "VIEW_PERSONAL_INFO",
  REQUEST_LEAVE: "REQUEST_LEAVE",
  VIEW_OWN_LEAVE: "VIEW_OWN_LEAVE",
  CANCEL_OWN_LEAVE: "CANCEL_OWN_LEAVE",

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
  CREATE_BONUSES: "CREATE_BONUSES",
  DELETE_BONUSES: "DELETE_BONUSES",
  MANAGE_OVERTIME: "MANAGE_OVERTIME",
  VIEW_OWN_BONUS: "VIEW_OWN_BONUS",

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

  // Dashboard Access
  VIEW_DASHBOARD: "VIEW_DASHBOARD",

  // New permissions
  MANAGE_DEPARTMENT_DEDUCTIONS: "MANAGE_DEPARTMENT_DEDUCTIONS",
  VIEW_DEPARTMENT_DEDUCTIONS: "VIEW_DEPARTMENT_DEDUCTIONS",

  // Settings Management
  MANAGE_COMPANY_PROFILE: "MANAGE_COMPANY_PROFILE",
  MANAGE_DEPARTMENT_SETTINGS: "MANAGE_DEPARTMENT_SETTINGS",
  MANAGE_SYSTEM_SETTINGS: "MANAGE_SYSTEM_SETTINGS",
  MANAGE_USER_SETTINGS: "MANAGE_USER_SETTINGS",
  MANAGE_PAYROLL_SETTINGS: "MANAGE_PAYROLL_SETTINGS",
  MANAGE_LEAVE_SETTINGS: "MANAGE_LEAVE_SETTINGS",
  MANAGE_DOCUMENT_SETTINGS: "MANAGE_DOCUMENT_SETTINGS",
  MANAGE_NOTIFICATION_SETTINGS: "MANAGE_NOTIFICATION_SETTINGS",
  MANAGE_INTEGRATION_SETTINGS: "MANAGE_INTEGRATION_SETTINGS",
  MANAGE_TAX_SETTINGS: "MANAGE_TAX_SETTINGS",
  MANAGE_COMPLIANCE_SETTINGS: "MANAGE_COMPLIANCE_SETTINGS",

  // Add these new permissions
  MANAGE_DEPARTMENT_ALLOWANCES: "MANAGE_DEPARTMENT_ALLOWANCES",
  VIEW_DEPARTMENT_ALLOWANCES: "VIEW_DEPARTMENT_ALLOWANCES",
  MANAGE_DEPARTMENT_BONUSES: "MANAGE_DEPARTMENT_BONUSES",
  VIEW_DEPARTMENT_BONUSES: "VIEW_DEPARTMENT_BONUSES",

  // Personal Information
  UPDATE_PROFILE: "UPDATE_PROFILE",
  CHANGE_PASSWORD: "CHANGE_PASSWORD",

  // Document Management
  VIEW_OWN_DOCUMENTS: "VIEW_OWN_DOCUMENTS",
  UPLOAD_DOCUMENTS: "UPLOAD_DOCUMENTS",

  // Notifications
  VIEW_NOTIFICATIONS: "VIEW_NOTIFICATIONS",
  MARK_NOTIFICATIONS_READ: "MARK_NOTIFICATIONS_READ",

  // Feedback
  SUBMIT_FEEDBACK: "SUBMIT_FEEDBACK",
  VIEW_OWN_FEEDBACK: "VIEW_OWN_FEEDBACK",
  MANAGE_FEEDBACK: "MANAGE_FEEDBACK",

  // New permission for ADMIN role
  SUBMIT_PAYROLL: "SUBMIT_PAYROLL",
};

export const UserLifecycleState = {
  PENDING: "PENDING", // Just invited
  ONBOARDING: "ONBOARDING", // Setting up profile
  ACTIVE: "ACTIVE", // Fully onboarded
  OFFBOARDING: "OFFBOARDING", // Leaving process
  TERMINATED: "TERMINATED", // No longer active
};

export const OnboardingStatus = {
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
};

// Update the status enum to match lifecycle states
export const UserStatus = {
  PENDING: "pending",
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
  OFFBOARDING: "offboarding",
  TERMINATED: "terminated",
};

export const OffboardingType = {
  VOLUNTARY_RESIGNATION: "voluntary_resignation",
  INVOLUNTARY_TERMINATION: "involuntary_termination",
  RETIREMENT: "retirement",
  CONTRACT_END: "contract_end",
};

// Add this enum definition
export const OffboardingStatus = {
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

// Add new enum for deduction opt-out reasons
export const DeductionOptOutReason = {
  PERSONAL_CHOICE: "personal_choice",
  ALTERNATIVE_PLAN: "alternative_plan",
  TEMPORARY_SUSPENSION: "temporary_suspension",
  OTHER: "other",
};

// Add new enum for offboarding task categories
export const OffboardingTaskCategory = {
  DOCUMENTATION: "documentation",
  EQUIPMENT_RETURN: "equipment_return",
  ACCESS_REVOCATION: "access_revocation",
  FINANCIAL: "financial",
  EXIT_INTERVIEW: "exit_interview",
  KNOWLEDGE_TRANSFER: "knowledge_transfer",
  OTHER: "other",
};

// Add new enum for default offboarding tasks
export const DefaultOffboardingTasks = {
  EXIT_INTERVIEW: "exit_interview",
  EQUIPMENT_RETURN: "equipment_return",
  ACCESS_REVOCATION: "access_revocation",
  DOCUMENTATION_HANDOVER: "documentation_handover",
  KNOWLEDGE_TRANSFER: "knowledge_transfer",
  FINAL_PAYROLL: "final_payroll_processing",
  BENEFITS_TERMINATION: "benefits_termination",
  CLEARANCE_FORM: "clearance_form_completion",
};

// Schema Definition
const UserSchema = new Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
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
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: function () {
        return this.role !== UserRole.SUPER_ADMIN;
      },
    },
    position: {
      type: String,
      required: true,
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
      enum: Object.values(UserStatus),
      default: UserStatus.PENDING,
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
    profileImage: {
      type: String,
      default: null,
    },
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
    },
    invitationExpires: Date,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    // Update lifecycle tracking
    lifecycle: {
      currentState: {
        type: String,
        enum: Object.values(UserLifecycleState),
        default: UserLifecycleState.PENDING,
      },
      history: [
        {
          state: {
            type: String,
            enum: Object.values(UserLifecycleState),
          },
          timestamp: Date,
          updatedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
          },
          notes: String,
        },
      ],
      onboarding: {
        status: {
          type: String,
          enum: Object.values(OnboardingStatus),
          default: OnboardingStatus.NOT_STARTED,
        },
        supervisor: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        startedAt: Date,
        expectedCompletionDate: Date,
        completedAt: Date,
        tasks: [
          {
            name: {
              type: String,
              required: true,
              enum: [
                "Welcome Meeting",
                "Department Introduction",
                "System Access Setup",
                "Policy Documentation Review",
                "Initial Training Session",
              ],
            },
            description: String,
            category: {
              type: String,
              enum: [
                "orientation",
                "documentation",
                "training",
                "setup",
                "compliance",
              ],
            },
            deadline: Date,
            completed: { type: Boolean, default: false },
            completedAt: Date,
            completedBy: {
              type: Schema.Types.ObjectId,
              ref: "User",
            },
            notes: String,
          },
        ],
        progress: { type: Number, default: 0 },
      },
    },
    // Consolidate invitation fields
    invitation: {
      token: String,
      expiresAt: Date,
      sentAt: Date,
      lastResendAt: Date,
      resendCount: { type: Number, default: 0 },
    },
    // Enhanced onboarding tracking
    onboarding: {
      status: {
        type: String,
        enum: Object.values(OnboardingStatus),
        default: OnboardingStatus.NOT_STARTED,
      },
      supervisor: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      startedAt: Date,
      expectedCompletionDate: Date,
      completedAt: Date,
      tasks: [
        {
          name: {
            type: String,
            required: true,
            enum: [
              "Welcome Meeting",
              "Department Introduction",
              "System Access Setup",
              "Policy Documentation Review",
              "Initial Training Session",
            ],
          },
          description: String,
          category: {
            type: String,
            enum: [
              "orientation",
              "documentation",
              "training",
              "setup",
              "compliance",
            ],
          },
          deadline: Date,
          completed: { type: Boolean, default: false },
          completedAt: Date,
          completedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
          },
          notes: String,
        },
      ],
      progress: { type: Number, default: 0 },
    },
    // Enhanced offboarding tracking
    offboarding: {
      status: {
        type: String,
        enum: Object.values(OffboardingStatus),
        default: OffboardingStatus.NOT_STARTED,
      },
      type: {
        type: String,
        enum: Object.values(OffboardingType),
        required: function () {
          return this.status !== OffboardingStatus.NOT_STARTED;
        },
      },
      reason: {
        type: String,
        required: function () {
          return this.status !== OffboardingStatus.NOT_STARTED;
        },
      },
      initiatedAt: Date,
      initiatedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      targetExitDate: {
        type: Date,
        required: function () {
          return this.status !== OffboardingStatus.NOT_STARTED;
        },
      },
      actualExitDate: Date,
      tasks: [
        {
          name: {
            type: String,
            required: true,
            enum: Object.values(DefaultOffboardingTasks),
          },
          description: String,
          category: {
            type: String,
            enum: Object.values(OffboardingTaskCategory),
            required: true,
          },
          deadline: {
            type: Date,
            required: true,
          },
          completed: {
            type: Boolean,
            default: false,
          },
          completedAt: Date,
          completedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
          },
          notes: String,
          attachments: [
            {
              name: String,
              url: String,
              uploadedAt: Date,
              uploadedBy: {
                type: Schema.Types.ObjectId,
                ref: "User",
              },
            },
          ],
        },
      ],
      progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      exitInterview: {
        completed: {
          type: Boolean,
          default: false,
        },
        conductedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        date: Date,
        notes: String,
        feedback: {
          rating: {
            type: Number,
            min: 1,
            max: 5,
          },
          comments: String,
          suggestions: String,
        },
      },
      rehireEligible: {
        status: Boolean,
        notes: String,
        decidedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        decidedAt: Date,
      },
      checklist: [
        {
          item: String,
          completed: Boolean,
          completedAt: Date,
          completedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
          },
        },
      ],
    },
    salaryGrade: {
      type: Schema.Types.ObjectId,
      ref: "SalaryGrade",
      required: false,
    },
    passwordLastChanged: {
      type: Date,
      default: Date.now,
    },
    passwordAttempts: {
      type: Number,
      default: 0,
    },
    lastPasswordAttempt: {
      type: Date,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    deductionPreferences: {
      statutory: {
        // Default statutory deductions
        defaultStatutory: {
          "paye tax": {
            opted: { type: Boolean, default: true },
            optedAt: Date,
            optedBy: { type: Schema.Types.ObjectId, ref: "User" },
            reason: {
              type: String,
              enum: Object.values(DeductionOptOutReason),
            },
            notes: String,
          },
          pension: {
            opted: { type: Boolean, default: true },
            optedAt: Date,
            optedBy: { type: Schema.Types.ObjectId, ref: "User" },
            reason: {
              type: String,
              enum: Object.values(DeductionOptOutReason),
            },
            notes: String,
          },
          nhf: {
            opted: { type: Boolean, default: true },
            optedAt: Date,
            optedBy: { type: Schema.Types.ObjectId, ref: "User" },
            reason: {
              type: String,
              enum: Object.values(DeductionOptOutReason),
            },
            notes: String,
          },
        },

        customStatutory: [
          {
            deduction: {
              type: Schema.Types.ObjectId,
              ref: "Deduction",
              required: true,
            },
            opted: { type: Boolean, default: false },
            optedAt: Date,
            optedBy: { type: Schema.Types.ObjectId, ref: "User" },
            approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
            approvedAt: Date,
            reason: {
              type: String,
              enum: Object.values(DeductionOptOutReason),
            },
            notes: String,
          },
        ],
      },

      voluntary: {
        standardVoluntary: [
          {
            deduction: {
              type: Schema.Types.ObjectId,
              ref: "Deduction",
              required: true,
            },
            opted: { type: Boolean, default: false },
            startDate: { type: Date, required: true },
            endDate: Date,
            optedAt: Date,
            optedBy: { type: Schema.Types.ObjectId, ref: "User" },
            approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
            approvedAt: Date,
            amount: Number,
            percentage: Number,
            notes: String,
          },
        ],

        // Custom voluntary deductions
        customVoluntary: [
          {
            deduction: {
              type: Schema.Types.ObjectId,
              ref: "Deduction",
              required: true,
            },
            opted: { type: Boolean, default: false },
            startDate: { type: Date, required: true },
            endDate: Date,
            optedAt: Date,
            optedBy: { type: Schema.Types.ObjectId, ref: "User" },
            approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
            approvedAt: Date,
            amount: Number,
            percentage: Number,
            notes: String,
          },
        ],
      },
    },
    personalAllowances: [
      {
        allowance: {
          type: Schema.Types.ObjectId,
          ref: "Allowance",
        },
        assignedAt: Date,
        assignedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["PENDING", "APPROVED", "REJECTED"],
          default: "PENDING",
        },
      },
    ],
    personalBonuses: [
      {
        bonus: {
          type: Schema.Types.ObjectId,
          ref: "Bonus",
        },
        assignedAt: Date,
        assignedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["PENDING", "APPROVED", "REJECTED"],
          default: "PENDING",
        },
      },
    ],
    // Fields to be filled during registration
    personalDetails: {
      middleName: String,
      dateOfBirth: Date,
      gender: String,
      maritalStatus: String,
      nationality: String,
      stateOfOrigin: String,
      lga: String,
      address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String,
      },
      nextOfKin: {
        name: String,
        relationship: String,
        phone: String,
        address: {
          street: String,
          city: String,
          state: String,
          zipCode: String,
          country: String,
        },
      },
      qualifications: [
        {
          highestEducation: String,
          institution: String,
          yearGraduated: String,
        },
      ],
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
      address: String,
    },
    bankDetails: {
      bankName: String,
      accountNumber: String,
      accountName: String,
      bankCode: String,
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
          // Dashboard Access
          Permission.VIEW_DASHBOARD,
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
          Permission.VIEW_DEPARTMENT_STATS,

          // Payroll Management
          Permission.CREATE_PAYROLL,
          Permission.EDIT_PAYROLL,
          Permission.DELETE_PAYROLL,
          Permission.VIEW_ALL_PAYROLL,
          Permission.VIEW_DEPARTMENT_PAYROLL,
          Permission.SUBMIT_PAYROLL,
          Permission.APPROVE_PAYROLL,
          Permission.GENERATE_PAYSLIP,
          Permission.VIEW_REPORTS,
          Permission.VIEW_ALL_PAYSLIPS,
          Permission.VIEW_DEPARTMENT_PAYSLIPS,
          Permission.PROCESS_PAYMENT,
          Permission.MARK_PAYMENT_FAILED,
          Permission.VIEW_PAYMENT_HISTORY,
          Permission.MANAGE_PAYMENT_METHODS,

          // Leave Management
          Permission.APPROVE_LEAVE,
          Permission.VIEW_TEAM_LEAVE,
          Permission.VIEW_ALL_LEAVE,

          // Basic Permissions
          Permission.VIEW_PERSONAL_INFO,
          Permission.EDIT_PERSONAL_INFO,
          Permission.REQUEST_LEAVE,
          Permission.VIEW_OWN_LEAVE,
          Permission.CANCEL_OWN_LEAVE,

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
          Permission.CREATE_BONUSES,
          Permission.DELETE_BONUSES,
          Permission.MANAGE_OVERTIME,
          Permission.VIEW_OWN_BONUS,

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
          Permission.UPDATE_PROFILE,
          Permission.CHANGE_PASSWORD,

          Permission.VIEW_DISCIPLINARY_RECORDS,
          Permission.MANAGE_DISCIPLINARY_ACTIONS,

          // New permissions
          Permission.MANAGE_DEPARTMENT_DEDUCTIONS,
          Permission.VIEW_DEPARTMENT_DEDUCTIONS,

          // Settings Management
          Permission.MANAGE_COMPANY_PROFILE,
          Permission.MANAGE_DEPARTMENT_SETTINGS,
          Permission.MANAGE_SYSTEM_SETTINGS,
          Permission.MANAGE_USER_SETTINGS,
          Permission.MANAGE_PAYROLL_SETTINGS,
          Permission.MANAGE_LEAVE_SETTINGS,
          Permission.MANAGE_DOCUMENT_SETTINGS,
          Permission.MANAGE_NOTIFICATION_SETTINGS,
          Permission.MANAGE_INTEGRATION_SETTINGS,
          Permission.MANAGE_TAX_SETTINGS,
          Permission.MANAGE_COMPLIANCE_SETTINGS,

          // Add the new department-specific permissions
          Permission.MANAGE_DEPARTMENT_ALLOWANCES,
          Permission.VIEW_DEPARTMENT_ALLOWANCES,
          Permission.MANAGE_DEPARTMENT_BONUSES,
          Permission.VIEW_DEPARTMENT_BONUSES,
        ];
        break;

      case UserRole.ADMIN:
        this.permissions = [
          // Dashboard Access
          Permission.VIEW_DASHBOARD,
          // User Management (User-level only)
          Permission.CREATE_USER,
          Permission.EDIT_USER,
          Permission.DELETE_USER,
          Permission.VIEW_ALL_USERS,

          // Department Management
          Permission.VIEW_ALL_DEPARTMENTS,
          Permission.MANAGE_DEPARTMENT_USERS,
          Permission.VIEW_DEPARTMENT_STATS,

          // Payroll Management
          Permission.CREATE_PAYROLL,
          Permission.EDIT_PAYROLL,
          Permission.DELETE_PAYROLL,
          Permission.SUBMIT_PAYROLL,
          Permission.APPROVE_PAYROLL,
          Permission.VIEW_DEPARTMENT_PAYROLL,
          Permission.GENERATE_PAYSLIP,
          Permission.VIEW_REPORTS,
          Permission.VIEW_DEPARTMENT_PAYSLIPS,
          Permission.PROCESS_PAYMENT,
          Permission.MARK_PAYMENT_FAILED,
          Permission.VIEW_PAYMENT_HISTORY,
          Permission.MANAGE_PAYMENT_METHODS,
          Permission.VIEW_PAYROLL_STATS,

          // Leave Management
          Permission.APPROVE_LEAVE,
          Permission.VIEW_TEAM_LEAVE,

          // Basic Permissions
          Permission.VIEW_PERSONAL_INFO,
          Permission.EDIT_PERSONAL_INFO,
          Permission.REQUEST_LEAVE,
          Permission.VIEW_OWN_LEAVE,
          Permission.CANCEL_OWN_LEAVE,

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
          Permission.EDIT_ALLOWANCES,
          Permission.CREATE_ALLOWANCES,
          Permission.DELETE_ALLOWANCES,
          Permission.APPROVE_ALLOWANCES,
          Permission.VIEW_OWN_ALLOWANCES,
          Permission.REQUEST_ALLOWANCES,

          // Deductions Management
          Permission.VIEW_DEDUCTIONS,
          Permission.EDIT_DEDUCTIONS,

          // Bonuses Management
          Permission.MANAGE_BONUSES,
          Permission.VIEW_BONUSES,
          Permission.EDIT_BONUSES,
          Permission.CREATE_BONUSES,
          Permission.DELETE_BONUSES,
          Permission.MANAGE_OVERTIME,
          Permission.VIEW_OWN_BONUS,

          // Reports & Analytics
          Permission.VIEW_PAYROLL_REPORTS,
          Permission.VIEW_EMPLOYEE_REPORTS,
          Permission.VIEW_TAX_REPORTS,

          // New permissions
          Permission.MANAGE_DEPARTMENT_DEDUCTIONS,
          Permission.VIEW_DEPARTMENT_DEDUCTIONS,

          // Settings Management (Limited)
          Permission.MANAGE_DEPARTMENT_SETTINGS,
          Permission.MANAGE_USER_SETTINGS,
          Permission.MANAGE_NOTIFICATION_SETTINGS,
          Permission.MANAGE_LEAVE_SETTINGS,

          // Add the new department-specific permissions
          Permission.MANAGE_DEPARTMENT_ALLOWANCES,
          Permission.VIEW_DEPARTMENT_ALLOWANCES,
          Permission.MANAGE_DEPARTMENT_BONUSES,
          Permission.VIEW_DEPARTMENT_BONUSES,

          // Additional System Settings
          Permission.MANAGE_SYSTEM_SETTINGS,
          Permission.MANAGE_PAYROLL_SETTINGS,
          Permission.MANAGE_DOCUMENT_SETTINGS,

          // Audit Logs
          Permission.VIEW_AUDIT_LOGS,
        ];
        break;

      case UserRole.USER:
        this.permissions = [
          // Dashboard Access
          Permission.VIEW_DASHBOARD,

          // Personal Information
          Permission.VIEW_PERSONAL_INFO,
          Permission.EDIT_PERSONAL_INFO,

          // Leave Management
          Permission.REQUEST_LEAVE,
          Permission.VIEW_OWN_LEAVE,
          Permission.CANCEL_OWN_LEAVE,

          // Payroll Access
          Permission.VIEW_OWN_PAYSLIP,
          Permission.VIEW_OWN_ALLOWANCES,
          Permission.REQUEST_ALLOWANCES,
          Permission.VIEW_OWN_DEDUCTIONS,
          Permission.VIEW_OWN_BONUS,

          // Document Management
          Permission.VIEW_OWN_DOCUMENTS,
          Permission.UPLOAD_DOCUMENTS,

          // Notifications
          Permission.VIEW_NOTIFICATIONS,
          Permission.MARK_NOTIFICATIONS_READ,
          Permission.MANAGE_NOTIFICATION_SETTINGS,

          // Profile Management
          Permission.UPDATE_PROFILE,
          Permission.CHANGE_PASSWORD,

          // Feedback
          Permission.SUBMIT_FEEDBACK,
          Permission.VIEW_OWN_FEEDBACK,
          Permission.MANAGE_FEEDBACK,

          // Audit Logs
          Permission.VIEW_AUDIT_LOGS,
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

// JSON Transform
UserSchema.set("toJSON", {
  virtuals: true,
  transform: function (_doc, ret) {
    if (ret.profileImage) {
      ret.profileImageUrl = `${process.env.BASE_URL}/${ret.profileImage}`;
    } else {
      ret.profileImageUrl = `${process.env.BASE_URL}/uploads/profiles/default-avatar.png`;
    }
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

// Add lifecycle state management method
UserSchema.methods.updateLifecycleState = async function (
  newState,
  updatedBy,
  notes
) {
  const oldState = this.lifecycle.currentState;

  // Update current state
  this.lifecycle.currentState = newState;

  // Add to history
  this.lifecycle.history.push({
    state: newState,
    timestamp: new Date(),
    updatedBy,
    notes: notes || `State changed from ${oldState} to ${newState}`,
  });

  // Update status and other fields based on state
  switch (newState) {
    case UserLifecycleState.INVITED:
      this.status = UserStatus.PENDING;
      this.lifecycle.onboarding.status = OnboardingStatus.NOT_STARTED;
      break;
    case UserLifecycleState.REGISTERED:
      this.isEmailVerified = true;
      break;
    case UserLifecycleState.ONBOARDING:
      this.status = UserStatus.ACTIVE;
      this.lifecycle.onboarding.status = OnboardingStatus.IN_PROGRESS;
      if (!this.lifecycle.onboarding.startedAt) {
        this.lifecycle.onboarding.startedAt = new Date();
      }
      break;
    case UserLifecycleState.ACTIVE:
      this.status = UserStatus.ACTIVE;
      this.lifecycle.onboarding.status = OnboardingStatus.COMPLETED;
      this.lifecycle.onboarding.completedAt = new Date();
      break;
    case UserLifecycleState.OFFBOARDING:
      this.status = UserStatus.OFFBOARDING;
      break;
    case UserLifecycleState.TERMINATED:
      this.status = UserStatus.TERMINATED;
      break;
  }

  await this.save();
  return this;
};

// Add method to check if user can transition to a state
UserSchema.methods.canTransitionTo = function (newState) {
  const validTransitions = {
    [UserLifecycleState.INVITED]: [],
    [UserLifecycleState.REGISTERED]: [UserLifecycleState.INVITED],
    [UserLifecycleState.ONBOARDING]: [UserLifecycleState.REGISTERED],
    [UserLifecycleState.ACTIVE]: [UserLifecycleState.ONBOARDING],
    [UserLifecycleState.OFFBOARDING]: [UserLifecycleState.ACTIVE],
    [UserLifecycleState.TERMINATED]: [UserLifecycleState.OFFBOARDING],
    [UserLifecycleState.PENDING_REONBOARDING]: [UserLifecycleState.TERMINATED],
  };

  return validTransitions[newState].includes(this.lifecycle.currentState);
};

// Add method to check if user can manage deductions
UserSchema.methods.canManageDeductions = function () {
  return (
    this.role === "SUPER_ADMIN" ||
    (this.role === "ADMIN" &&
      this.permissions.includes("MANAGE_DEPARTMENT_DEDUCTIONS"))
  );
};

// Add method to check if user can view deductions
UserSchema.methods.canViewDeductions = function () {
  return (
    this.role === "SUPER_ADMIN" ||
    this.permissions.includes("VIEW_DEDUCTIONS") ||
    this.permissions.includes("VIEW_DEPARTMENT_DEDUCTIONS")
  );
};

// Add helper methods for deduction management
UserSchema.methods.hasDeduction = function (deductionId) {
  const allDeductions = [
    ...this.deductionPreferences.statutory.customStatutory,
    ...this.deductionPreferences.voluntary.standardVoluntary,
    ...this.deductionPreferences.voluntary.customVoluntary,
  ];
  return allDeductions.some(
    (d) => d.deduction.toString() === deductionId.toString()
  );
};

UserSchema.methods.isOptedIntoDeduction = function (deductionId) {
  const allDeductions = [
    ...this.deductionPreferences.statutory.customStatutory,
    ...this.deductionPreferences.voluntary.standardVoluntary,
    ...this.deductionPreferences.voluntary.customVoluntary,
  ];
  const deduction = allDeductions.find(
    (d) => d.deduction.toString() === deductionId.toString()
  );
  return deduction ? deduction.opted : false;
};

UserSchema.methods.getActiveDeductions = function () {
  const now = new Date();
  return {
    statutory: {
      default: {
        pension:
          this.deductionPreferences.statutory.defaultStatutory.pension.opted,
        nhf: this.deductionPreferences.statutory.defaultStatutory.nhf.opted,
      },
      custom: this.deductionPreferences.statutory.customStatutory.filter(
        (d) => d.opted
      ),
    },
    voluntary: {
      standard: this.deductionPreferences.voluntary.standardVoluntary.filter(
        (d) => d.opted && d.startDate <= now && (!d.endDate || d.endDate >= now)
      ),
      custom: this.deductionPreferences.voluntary.customVoluntary.filter(
        (d) => d.opted && d.startDate <= now && (!d.endDate || d.endDate >= now)
      ),
    },
  };
};

// Add the comparePassword method to the UserSchema
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcryptjs.compare(candidatePassword, this.password);
};

// Add the generateAuthToken method
UserSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    {
      id: this._id.toString(),
      role: this.role,
      permissions: this.permissions,
    },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
};

// Add methods for offboarding management
UserSchema.methods.getDefaultOffboardingTasks = function (type) {
  // Default tasks for all offboarding types
  const defaultTasks = [
    {
      name: DefaultOffboardingTasks.EXIT_INTERVIEW,
      category: OffboardingTaskCategory.EXIT_INTERVIEW,
      deadline: new Date(),
      completed: false,
    },
    {
      name: DefaultOffboardingTasks.EQUIPMENT_RETURN,
      category: OffboardingTaskCategory.EQUIPMENT_RETURN,
      deadline: new Date(),
      completed: false,
    },
    {
      name: DefaultOffboardingTasks.ACCESS_REVOCATION,
      category: OffboardingTaskCategory.ACCESS_REVOCATION,
      deadline: new Date(),
      completed: false,
    },
    {
      name: DefaultOffboardingTasks.DOCUMENTATION_HANDOVER,
      category: OffboardingTaskCategory.DOCUMENTATION,
      deadline: new Date(),
      completed: false,
    },
    {
      name: DefaultOffboardingTasks.KNOWLEDGE_TRANSFER,
      category: OffboardingTaskCategory.KNOWLEDGE_TRANSFER,
      deadline: new Date(),
      completed: false,
    },
    {
      name: DefaultOffboardingTasks.FINAL_PAYROLL,
      category: OffboardingTaskCategory.FINANCIAL,
      deadline: new Date(),
      completed: false,
    },
  ];

  return defaultTasks;
};

UserSchema.methods.initiateOffboarding = async function (data) {
  // Set default tasks based on offboarding type
  const defaultTasks = this.getDefaultOffboardingTasks(data.type);

  // Set the deadline for all tasks to the target exit date
  defaultTasks.forEach((task) => {
    task.deadline = data.targetExitDate;
  });

  // Update offboarding status and details
  this.offboarding = {
    status: OffboardingStatus.IN_PROGRESS,
    type: data.type,
    reason: data.reason,
    initiatedAt: new Date(),
    targetExitDate: data.targetExitDate,
    tasks: defaultTasks,
    progress: 0,
    initiatedBy: data.initiatedBy,
  };

  // Update lifecycle state
  this.lifecycle.onboarding.status = "completed";
  this.lifecycle.currentState = UserLifecycleState.OFFBOARDING;

  await this.save();
  return this;
};

UserSchema.methods.completeOffboardingTask = async function (
  taskName,
  completedBy
) {
  const task = this.offboarding.tasks.find((t) => t.name === taskName);
  if (!task) {
    throw new Error(`Task ${taskName} not found`);
  }

  task.completed = true;
  task.completedAt = new Date();
  task.completedBy = completedBy;

  // Calculate progress
  const completedTasks = this.offboarding.tasks.filter(
    (t) => t.completed
  ).length;
  this.offboarding.progress =
    (completedTasks / this.offboarding.tasks.length) * 100;

  // If all tasks are completed, update status
  if (this.offboarding.progress === 100) {
    this.offboarding.status = OffboardingStatus.COMPLETED;
    this.offboarding.actualExitDate = new Date();

    // Update lifecycle state to TERMINATED
    await this.updateLifecycleState(
      UserLifecycleState.TERMINATED,
      completedBy,
      "Offboarding process completed"
    );
  }

  return this.save();
};

UserSchema.methods.cancelOffboarding = async function (reason, cancelledBy) {
  this.offboarding.status = OffboardingStatus.CANCELLED;

  // Update lifecycle state back to ACTIVE
  await this.updateLifecycleState(
    UserLifecycleState.ACTIVE,
    cancelledBy,
    `Offboarding cancelled - ${reason}`
  );

  return this.save();
};

export default mongoose.model("User", UserSchema);
