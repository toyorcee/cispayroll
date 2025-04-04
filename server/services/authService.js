import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRole } from "../models/User.js";
import { ApiError } from "../utils/errorHandler.js";
import UserModel from "../models/User.js";
import { AppError } from "../utils/errorHandler.js";

export class AuthService {
  static validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);

    if (password.length < minLength) {
      return {
        isValid: false,
        message: "Password must be at least 8 characters long",
      };
    }
    if (!hasUpperCase) {
      return {
        isValid: false,
        message: "Password must contain at least one uppercase letter",
      };
    }
    if (!hasLowerCase) {
      return {
        isValid: false,
        message: "Password must contain at least one lowercase letter",
      };
    }
    if (!hasNumbers) {
      return {
        isValid: false,
        message: "Password must contain at least one number",
      };
    }
    if (!hasSpecialChar) {
      return {
        isValid: false,
        message:
          "Password must contain at least one special character (!@#$%^&*)",
      };
    }

    return { isValid: true, message: "Password is valid" };
  }

  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  static async comparePasswords(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static generateToken(user) {
    return jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
        permissions: user.permissions,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
  }

  static formatUserResponse(user) {
    // Ensure department data is properly formatted
    const department = user.department
      ? {
          _id: user.department._id || "",
          name: user.department.name || "",
          code: user.department.code || "",
        }
      : {
          _id: "",
          name: "",
          code: "",
        };

    return {
      _id: user._id.toString(),
      employeeId: user.employeeId || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "user",
      permissions: Array.isArray(user.permissions) ? user.permissions : [],
      department,
      position: user.position || "",
      status: user.status || "active",
      gradeLevel: user.gradeLevel || "",
      workLocation: user.workLocation || "",
      dateJoined: user.dateJoined || new Date(),
      emergencyContact: {
        name: user.emergencyContact?.name || "",
        relationship: user.emergencyContact?.relationship || "",
        phone: user.emergencyContact?.phone || "",
      },
      bankDetails: {
        bankName: user.bankDetails?.bankName || "",
        accountNumber: user.bankDetails?.accountNumber || "",
        accountName: user.bankDetails?.accountName || "",
      },
      profileImage: user.profileImage || "",
      reportingTo: user.reportingTo || null,
      isEmailVerified: Boolean(user.isEmailVerified),
      lastLogin: user.lastLogin || undefined,
      createdAt: user.createdAt || new Date(),
      updatedAt: user.updatedAt || new Date(),
    };
  }

  static validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return emailRegex.test(email);
  }

  static async loginUser({ email, password }) {
    try {
      const user = await UserModel.findOne({ email })
        .populate({
          path: "department",
          select: "_id name code",
        })
        .select("+password");

      if (!user) {
        throw new AppError("Invalid credentials", 401);
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new AppError("Invalid credentials", 401);
      }

      // For now, let's just check if user exists and password is valid
      // We'll handle department validation separately
      const token = user.generateAuthToken();
      user.password = undefined;

      return { user, token };
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  static async createUser(userData) {
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
    ];

    for (const field of requiredFields) {
      if (!userData[field]) {
        throw new ApiError(400, `${field} is required`);
      }
    }

    // Validate emergency contact
    if (
      !userData.emergencyContact?.name ||
      !userData.emergencyContact?.phone ||
      !userData.emergencyContact?.relationship
    ) {
      throw new ApiError(
        400,
        "Complete emergency contact details are required"
      );
    }

    // Validate bank details
    if (
      !userData.bankDetails?.bankName ||
      !userData.bankDetails?.accountNumber ||
      !userData.bankDetails?.accountName
    ) {
      throw new ApiError(400, "Complete bank details are required");
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({
      $or: [
        { email: userData.email },
        { employeeId: userData.employeeId },
        { "bankDetails.accountNumber": userData.bankDetails.accountNumber },
      ],
    });

    if (existingUser) {
      if (existingUser.email === userData.email) {
        throw new ApiError(400, "Email already in use");
      }
      if (existingUser.employeeId === userData.employeeId) {
        throw new ApiError(400, "Employee ID already in use");
      }
      if (
        existingUser.bankDetails.accountNumber ===
        userData.bankDetails.accountNumber
      ) {
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
      token,
    };
  }

  static async getCurrentUser(userId) {
    const user = await UserModel.findById(userId).select("-password");
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    return this.formatUserResponse(user);
  }
}
