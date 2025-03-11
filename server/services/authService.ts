import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { UserDocument } from "../models/User.js";
import { UserRole, Permission } from "../models/User.js";
import { ApiError } from "../utils/errorHandler.js";
import UserModel from "../models/User.js";

// Enhanced interfaces
interface IUserDocument extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  employeeId: string;
  phone: string;
  position: string;
  gradeLevel: string;
  workLocation: string;
  dateJoined: Date;
  department?: string;
  isEmailVerified: boolean;
  permissions: Permission[];
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
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date;
}

interface AuthResponse {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    permissions: Permission[];
    employeeId: string;
    position: string;
    gradeLevel: string;
    workLocation: string;
    department?: string;
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
  phone: string;
  employeeId: string;
  position: string;
  gradeLevel: string;
  workLocation: string;
  dateJoined: Date;
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
}

export interface CreateUserData extends SignupData {
  role?: UserRole;
  department?: string;
  isEmailVerified?: boolean;
}

export class AuthService {
  // Enhanced password validation
  static validatePassword(password: string): { isValid: boolean; message: string } {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);

    if (password.length < minLength) {
      return { isValid: false, message: "Password must be at least 8 characters long" };
    }
    if (!hasUpperCase) {
      return { isValid: false, message: "Password must contain at least one uppercase letter" };
    }
    if (!hasLowerCase) {
      return { isValid: false, message: "Password must contain at least one lowercase letter" };
    }
    if (!hasNumbers) {
      return { isValid: false, message: "Password must contain at least one number" };
    }
    if (!hasSpecialChar) {
      return { isValid: false, message: "Password must contain at least one special character (!@#$%^&*)" };
    }

    return { isValid: true, message: "Password is valid" };
  }

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
      { expiresIn: "24h" }
    );
  }

  static formatUserResponse(user: UserDocument | IUserDocument): AuthResponse["user"] {
    return {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      employeeId: user.employeeId,
      position: user.position,
      gradeLevel: user.gradeLevel,
      workLocation: user.workLocation,
      ...(user.role !== UserRole.SUPER_ADMIN && { department: user.department }),
    };
  }

  static validateEmail(email: string): boolean {
    // Enhanced email regex for better validation
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return emailRegex.test(email);
  }

  static async loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
    const user = await UserModel.findOne({ email: credentials.email })
      .select("+password")
      .exec();
    
    if (!user) {
      throw new ApiError(401, "Invalid credentials");
    }

    if (!user.isEmailVerified) {
      throw new ApiError(401, "Please verify your email before logging in");
    }

    if (user.status === "inactive" || user.status === "suspended") {
      throw new ApiError(401, "Your account is not active. Please contact administrator");
    }

    const isMatch = await this.comparePasswords(credentials.password, user.password!);
    if (!isMatch) {
      throw new ApiError(401, "Invalid credentials");
    }

    const token = this.generateToken(user);
    user.lastLogin = new Date();
    await user.save();

    return { 
      user: this.formatUserResponse(user),
      token 
    };
  }

  static async createUser(userData: CreateUserData): Promise<AuthResponse> {
    // Validate email
    if (!this.validateEmail(userData.email)) {
      throw new ApiError(400, "Invalid email format");
    }

    // Validate password
    const passwordValidation = this.validatePassword(userData.password);
    if (!passwordValidation.isValid) {
      throw new ApiError(400, passwordValidation.message);
    }

    // Check required fields
    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "password",
      "phone",
      "employeeId",
      "position",
      "gradeLevel",
      "workLocation",
      "dateJoined",
      "emergencyContact",
      "bankDetails",
    ] as const;

    for (const field of requiredFields) {
      if (!userData[field]) {
        throw new ApiError(400, `${field} is required`);
      }
    }

    // Validate emergency contact
    if (!userData.emergencyContact?.name || !userData.emergencyContact?.phone || !userData.emergencyContact?.relationship) {
      throw new ApiError(400, "Complete emergency contact details are required");
    }

    // Validate bank details
    if (!userData.bankDetails?.bankName || !userData.bankDetails?.accountNumber || !userData.bankDetails?.accountName) {
      throw new ApiError(400, "Complete bank details are required");
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({
      $or: [
        { email: userData.email },
        { employeeId: userData.employeeId },
        { "bankDetails.accountNumber": userData.bankDetails.accountNumber }
      ]
    });

    if (existingUser) {
      if (existingUser.email === userData.email) {
        throw new ApiError(400, "Email already in use");
      }
      if (existingUser.employeeId === userData.employeeId) {
        throw new ApiError(400, "Employee ID already in use");
      }
      if (existingUser.bankDetails.accountNumber === userData.bankDetails.accountNumber) {
        throw new ApiError(400, "Bank account number already in use");
      }
    }

    // Hash password
    userData.password = await this.hashPassword(userData.password);

    // Create user
    const user = await UserModel.create(userData);
    const token = this.generateToken(user);

    return {
      user: this.formatUserResponse(user),
      token
    };
  }

  static async getCurrentUser(userId: string): Promise<AuthResponse["user"]> {
    const user = await UserModel.findById(userId).select("-password");
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    return this.formatUserResponse(user);
  }
}