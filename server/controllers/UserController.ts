import { Response, NextFunction, RequestHandler } from "express";
import { UserRole } from "../models/User.js";
import { AuthService } from "../services/authService.js";
import mongoose from "mongoose";
import {
  AuthenticatedRequest,
  JWTPayload,
} from "../middleware/authMiddleware.js";

// Import the model directly from mongoose
const User = mongoose.model("User");

export class UserController {
  // Get all users (ADMIN access)
  static getAllUsers: RequestHandler<any, any, any, any, { user: JWTPayload }> =
    async (req, res: Response, next: NextFunction) => {
      try {
        const users = await User.find({ role: UserRole.USER })
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
    };

  // Create regular user (ADMIN access)
  static createUser: RequestHandler<any, any, any, any, { user: JWTPayload }> =
    async (req, res: Response, next: NextFunction) => {
      try {
        const userData = {
          ...req.body,
          role: UserRole.USER,
          isEmailVerified: true,
        };

        const { user, token } = await AuthService.createUser(userData);
        res.status(201).json({
          success: true,
          message: "User created successfully",
          user,
          token,
        });
      } catch (error) {
        next(error);
      }
    };

  // Update user (ADMIN access)
  static updateUser: RequestHandler<any, any, any, any, { user: JWTPayload }> =
    async (req, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Prevent role escalation
        if (req.body.role && req.body.role !== UserRole.USER) {
          res.status(403).json({
            success: false,
            message: "Cannot change user role to higher privilege",
          });
          return;
        }

        const user = await User.findByIdAndUpdate(
          req.params.id,
          { $set: req.body },
          { new: true }
        ).select("-password");

        if (!user) {
          res.status(404).json({
            success: false,
            message: "User not found",
          });
          return;
        }

        res.status(200).json({
          success: true,
          message: "User updated successfully",
          user,
        });
      } catch (error) {
        next(error);
      }
    };

  // Delete user (ADMIN access)
  static deleteUser: RequestHandler<any, any, any, any, { user: JWTPayload }> =
    async (req, res: Response, next: NextFunction): Promise<void> => {
      try {
        const userToDelete = await User.findById(req.params.id);

        if (!userToDelete) {
          res.status(404).json({
            success: false,
            message: "User not found",
          });
          return;
        }

        // Prevent deleting non-USER roles
        if (userToDelete.role !== UserRole.USER) {
          res.status(403).json({
            success: false,
            message: "Can only delete regular users",
          });
          return;
        }

        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({
          success: true,
          message: "User deleted successfully",
        });
      } catch (error) {
        next(error);
      }
    };
}
