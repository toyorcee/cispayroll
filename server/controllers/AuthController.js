import { AuthService } from "../services/authService.js";
import { handleError } from "../utils/errorHandler.js";
import { UserRole } from "../models/User.js";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export class AuthController {
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }

      const { user, token } = await AuthService.loginUser({ email, password });

      // Debug log
      console.log("User data:", {
        id: user._id,
        email: user.email,
        department: user.department,
      });

      // Set cookie options based on environment
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
        path: "/",
      };

      res.cookie("token", token, cookieOptions);

      res.status(200).json({
        success: true,
        message: "Login successful",
        user,
      });
    } catch (error) {
      console.error("Login error:", error);
      const statusCode = error.statusCode || 500;
      const message = error.message || "Internal server error";

      res.status(statusCode).json({
        success: false,
        message,
      });
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
        secure: true,
        sameSite: "none",
        maxAge: 24 * 60 * 60 * 1000,
        domain: ".digitalentshub.net",
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
        secure: true,
        sameSite: "none",
        maxAge: 24 * 60 * 60 * 1000,
        domain: ".digitalentshub.net",
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
      console.log(
        "🔍 [AuthController] Getting current user for ID:",
        req.user._id
      );
      const user = await User.findById(req.user._id)
        .select("-password")
        .populate("department", "name code")
        .populate("reportingTo", "firstName lastName employeeId");

      if (!user) {
        console.log("❌ [AuthController] User not found for ID:", req.user._id);
        return res.status(404).json({ message: "User not found" });
      }

      console.log("✅ [AuthController] Current user found:", {
        id: user._id,
        email: user.email,
        role: user.role,
        department: user.department?.name,
      });

      res.json({
        success: true,
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
          department: user.department,
          firstName: user.firstName,
          lastName: user.lastName,
          employeeId: user.employeeId,
          position: user.position,
          gradeLevel: user.gradeLevel,
          workLocation: user.workLocation,
          dateJoined: user.dateJoined,
          status: user.status,
          profileImage: user.profileImage,
          profileImageUrl: user.profileImageUrl,
          reportingTo: user.reportingTo,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          personalDetails: user.personalDetails,
          emergencyContact: user.emergencyContact,
          bankDetails: user.bankDetails,
        },
      });
    } catch (error) {
      console.error("❌ [AuthController] Error getting current user:", error);
      res.status(500).json({ message: "Error getting current user" });
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

  static async refreshToken(req, res) {
    try {
      console.log("🔄 [AuthController] Starting token refresh process");
      const { refreshToken } = req.body;

      if (!refreshToken) {
        console.log("❌ [AuthController] No refresh token provided");
        return res.status(400).json({ message: "Refresh token is required" });
      }

      console.log("🔍 [AuthController] Verifying refresh token");
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      console.log(
        "✅ [AuthController] Refresh token verified for user:",
        decoded.userId
      );

      const user = await User.findById(decoded.userId);
      if (!user) {
        console.log("❌ [AuthController] User not found for refresh token");
        return res.status(404).json({ message: "User not found" });
      }

      console.log(
        "🔑 [AuthController] Generating new access token for user:",
        user._id
      );
      const accessToken = user.generateAuthToken();
      console.log(
        "✅ [AuthController] New access token generated successfully"
      );

      res.json({
        success: true,
        accessToken,
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
          department: user.department,
          firstName: user.firstName,
          lastName: user.lastName,
          employeeId: user.employeeId,
          position: user.position,
          gradeLevel: user.gradeLevel,
          workLocation: user.workLocation,
          dateJoined: user.dateJoined,
          status: user.status,
          profileImage: user.profileImage,
          profileImageUrl: user.profileImageUrl,
          reportingTo: user.reportingTo,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          personalDetails: user.personalDetails,
          emergencyContact: user.emergencyContact,
          bankDetails: user.bankDetails,
        },
      });
      console.log("✅ [AuthController] Token refresh completed successfully");
    } catch (error) {
      console.error("❌ [AuthController] Token refresh failed:", error);
      res.status(401).json({ message: "Invalid refresh token" });
    }
  }
}
