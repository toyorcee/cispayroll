import { Response, NextFunction } from "express";
import mongoose from "mongoose";
import { AuthService } from "../services/authService.js";
import { UserRole } from "../models/User.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";

// Fix: Get the User model from mongoose instead of importing UserModel type
const User = mongoose.model("User");

export class SuperAdminController {
  // Get all users (SUPER_ADMIN only)
  static async getAllUsers(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const users = await User.find({})
        .select("-password")
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        users,
        count: users.length,
      });
    } catch (error) {
      next(error);
    }
  }

  // Create admin user (SUPER_ADMIN only)
  static async createAdmin(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userData = {
        ...req.body,
        role: UserRole.ADMIN,
        isEmailVerified: true,
      };

      const { user } = await AuthService.createUser(userData);
      res.status(201).json({
        success: true,
        message: "Admin user created successfully",
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update any user (SUPER_ADMIN only)
  static async updateUser(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      // Prevent role update if not allowed
      if (req.body.role === UserRole.SUPER_ADMIN) {
        return res.status(403).json({
          success: false,
          message: "Cannot update to SUPER_ADMIN role",
        });
      }

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true }
      ).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "User updated successfully",
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete any user (SUPER_ADMIN only)
  static async deleteUser(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      // Prevent deleting SUPER_ADMIN
      const userToDelete = await User.findById(req.params.id);
      if (userToDelete?.role === UserRole.SUPER_ADMIN) {
        return res.status(403).json({
          success: false,
          message: "Cannot delete SUPER_ADMIN user",
        });
      }

      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}
