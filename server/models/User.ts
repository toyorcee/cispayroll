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
  VIEW_ALL_ADMINS = "VIEW_ALL_ADMINS", // New: For Super Admin to view admin list

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
  status: "active" | "inactive" | "suspended";
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
  status: "active" | "inactive" | "suspended";
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
  hasPermission(permission: Permission): boolean;
  hasRole(role: UserRole): boolean;
}

// Create the model type
export type UserModel = Model<UserDocument>;

const UserSchema = new Schema<UserDocument, UserModel>(
  {
    employeeId: {
      type: String,
      required: [true, "Employee ID is required"],
      unique: true,
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
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    password: {
      type: String,
      select: false,
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
      required: [true, "Position is required"],
      trim: true,
    },
    gradeLevel: {
      type: String,
      required: [true, "Grade level is required"],
      trim: true,
    },
    workLocation: {
      type: String,
      required: [true, "Work location is required"],
      trim: true,
    },
    dateJoined: {
      type: Date,
      required: [true, "Date joined is required"],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    emergencyContact: {
      name: {
        type: String,
        required: [true, "Emergency contact name is required"],
      },
      relationship: {
        type: String,
        required: [true, "Emergency contact relationship is required"],
      },
      phone: {
        type: String,
        required: [true, "Emergency contact phone is required"],
      },
    },
    bankDetails: {
      bankName: {
        type: String,
        required: [true, "Bank name is required"],
      },
      accountNumber: {
        type: String,
        required: [true, "Account number is required"],
      },
      accountName: {
        type: String,
        required: [true, "Account name is required"],
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

UserSchema.index({ role: 1 });

export default mongoose.model<UserDocument, UserModel>("User", UserSchema);
