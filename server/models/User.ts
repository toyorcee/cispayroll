// models/User.ts
import mongoose, { Schema, Model, Types } from "mongoose";

// Define role types
export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  USER = "USER",
}

// Define permission types
export enum Permission {
  MANAGE_USERS = "MANAGE_USERS",
  MANAGE_ADMINS = "MANAGE_ADMINS",
  MANAGE_PAYROLL = "MANAGE_PAYROLL",
  VIEW_REPORTS = "VIEW_REPORTS",
  MANAGE_DEPARTMENTS = "MANAGE_DEPARTMENTS",
  APPROVE_LEAVE = "APPROVE_LEAVE",
  VIEW_PERSONAL_INFO = "VIEW_PERSONAL_INFO",
  // Add new leave-related permissions
  REQUEST_LEAVE = "REQUEST_LEAVE",
  VIEW_OWN_LEAVE = "VIEW_OWN_LEAVE",
  CANCEL_OWN_LEAVE = "CANCEL_OWN_LEAVE",
  VIEW_TEAM_LEAVE = "VIEW_TEAM_LEAVE",
  // Add more permissions as needed
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

// Update the pre-save middleware
UserSchema.pre("save", function (this: UserDocument, next) {
  if (
    this.isModified("role") &&
    (!this.permissions || this.permissions.length === 0)
  ) {
    switch (this.role) {
      case UserRole.SUPER_ADMIN:
        this.permissions = Object.values(Permission);
        break;
      case UserRole.ADMIN:
        this.permissions = [
          Permission.MANAGE_USERS,
          Permission.MANAGE_PAYROLL,
          Permission.VIEW_REPORTS,
          Permission.MANAGE_DEPARTMENTS,
          Permission.APPROVE_LEAVE,
          Permission.VIEW_PERSONAL_INFO,
          Permission.VIEW_TEAM_LEAVE,
          Permission.REQUEST_LEAVE,
          Permission.VIEW_OWN_LEAVE,
          Permission.CANCEL_OWN_LEAVE,
        ];
        break;
      case UserRole.USER:
        this.permissions = [
          Permission.VIEW_PERSONAL_INFO,
          Permission.REQUEST_LEAVE,
          Permission.VIEW_OWN_LEAVE,
          Permission.CANCEL_OWN_LEAVE,
        ];
        break;
    }
  }
  next();
});

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
