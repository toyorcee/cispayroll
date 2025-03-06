import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UserModel, { IUser, UserDocument } from "../models/User.js";
import { Types } from "mongoose";

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    username?: string;
    isAdmin: boolean;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}

export class AuthService {
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

  static generateToken(
    user: UserDocument | (IUser & { _id: Types.ObjectId })
  ): string {
    return jwt.sign(
      {
        id: user._id.toString(),
        isAdmin: user.isAdmin,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" }
    );
  }

  static formatUserResponse(
    user: UserDocument | (IUser & { _id: Types.ObjectId })
  ) {
    return {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin,
    };
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): boolean {
    return password.length >= 6;
  }

  static async handleLogin(
    credentials: LoginCredentials
  ): Promise<AuthResponse> {
    const user = await UserModel.findOne({ email: credentials.email })
      .select("+password")
      .exec();

    if (!user) {
      throw new Error("User not found");
    }

    const isMatch = await this.comparePasswords(
      credentials.password,
      user.password!
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

  static async handleSignup(data: SignupData): Promise<AuthResponse> {
    if (!this.validateEmail(data.email)) {
      throw new Error("Invalid email format");
    }

    if (!this.validatePassword(data.password)) {
      throw new Error("Password must be at least 6 characters");
    }

    const hashedPassword = await this.hashPassword(data.password);
    const user = await new UserModel({
      ...data,
      password: hashedPassword,
      isAdmin: false,
      isEmailVerified: false,
    }).save();

    const token = this.generateToken(user);
    return {
      token,
      user: this.formatUserResponse(user),
    };
  }
}
