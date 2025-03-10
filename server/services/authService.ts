import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { UserDocument } from "../models/User.js";
import { UserRole, Permission } from "../models/User.js";

// Define the User model type
const UserModel = mongoose.model("User");

// Define interface for user document
interface IUserDocument extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  employeeId: string;
  isEmailVerified: boolean;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

// Define the response type
interface AuthResponse {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    permissions: Permission[];
  };
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface CreateUserData extends SignupData {
  role?: UserRole;
  department?: string;
}

class AuthService {
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  static async comparePasswords(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static generateToken(user: UserDocument | IUserDocument): string {
    return jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
        permissions: user.permissions,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" }
    );
  }

  static formatUserResponse(user: UserDocument | IUserDocument) {
    return {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    };
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): boolean {
    return password.length >= 6;
  }

  static getUserPermissions(role: UserRole): Permission[] {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return Object.values(Permission);
      case UserRole.ADMIN:
        return [
          // User Management
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
      case UserRole.USER:
        return [
          Permission.VIEW_PERSONAL_INFO,
          Permission.REQUEST_LEAVE,
          Permission.VIEW_OWN_LEAVE,
          Permission.CANCEL_OWN_LEAVE,
          Permission.VIEW_OWN_PAYSLIP,
        ];
    }
  }

  static async handleLogin(
    credentials: LoginCredentials
  ): Promise<AuthResponse> {
    // Validate email format
    if (!this.validateEmail(credentials.email)) {
      throw new Error("Invalid email format");
    }

    const user = (await UserModel.findOne({ email: credentials.email })
      .select("+password")
      .exec()) as UserDocument;

    if (!user) {
      throw new Error("Invalid credentials");
    }

    if (!user.isEmailVerified) {
      throw new Error("Email not verified");
    }

    if (!user.password) {
      throw new Error("Invalid login method");
    }

    const isMatch = await this.comparePasswords(
      credentials.password,
      user.password
    );
    if (!isMatch) {
      throw new Error("Invalid credentials");
    }

    const token = this.generateToken(user);
    return {
      token,
      user: this.formatUserResponse(user),
    };
  }

  static async createUser(
    userData: Partial<UserDocument | IUserDocument>
  ): Promise<AuthResponse> {
    try {
      if (userData.password) {
        const salt = await bcrypt.genSalt(10);
        userData.password = await bcrypt.hash(userData.password, salt);
      }

      const user = (await UserModel.create(userData)) as UserDocument;
      const token = this.generateToken(user);

      return {
        user: this.formatUserResponse(user),
        token,
      };
    } catch (error) {
      throw error;
    }
  }
}

// Export the class itself instead of an instance
export { AuthService };
