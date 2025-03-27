import { AuthService } from "../services/authService.js";
import { handleError } from "../utils/errorHandler.js";
import { UserRole } from "../models/User.js";

export class AuthController {
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const { user, token } = await AuthService.loginUser({ email, password });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, 
      });

      res.status(200).json({
        success: true,
        message: "Login successful",
        user,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async superAdminSignup(req, res) {
    try {
      const userData = {
        ...req.body,
        role: UserRole.SUPER_ADMIN,
        isEmailVerified: true,
      };

      const { user, token } = await AuthService.createUser(userData);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        success: true,
        message: "Super Admin created successfully",
        user,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async adminSignup(req, res) {
    try {
      const userData = {
        ...req.body,
        role: UserRole.ADMIN,
        isEmailVerified: true,
      };

      const { user } = await AuthService.createUser(userData);

      res.status(201).json({
        success: true,
        message: "Admin created successfully",
        user,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async signup(req, res) {
    try {
      const userData = {
        ...req.body,
        role: UserRole.USER,
        isEmailVerified: false,
      };

      const { user, token } = await AuthService.createUser(userData);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        user,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async getCurrentUser(req, res) {
    try {
      const user = await AuthService.getCurrentUser(req.user.id);

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async logout(req, res) {
    try {
      res.clearCookie("token");
      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }
}