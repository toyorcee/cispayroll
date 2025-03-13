import { Request, Response } from "express";
import UserModel from "../models/User.js";
import bcrypt from "bcryptjs";
import { handleError } from "../utils/errorHandler.js";

interface RegistrationCompletion {
  token: string;
  password: string;
  confirmPassword: string;
  profileImage?: string;
}

export class InvitationController {
  static async verifyInvitation(req: Request, res: Response) {
    try {
      const { token } = req.params;

      const user = await UserModel.findOne({
        invitationToken: token,
        invitationExpires: { $gt: new Date() },
        status: "pending", // Only verify pending invitations
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired invitation token",
        });
      }

      res.status(200).json({
        success: true,
        userData: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          employeeId: user.employeeId,
          position: user.position,
          department: user.department?.toString(),
        },
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async completeRegistration(req: Request, res: Response) {
    try {
      const { token, password, confirmPassword } = req.body;

      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: "Passwords do not match",
        });
      }

      const user = await UserModel.findOne({
        invitationToken: token,
        invitationExpires: { $gt: new Date() },
        status: "pending",
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired invitation token",
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update user
      user.password = hashedPassword;
      user.status = "active";
      user.isEmailVerified = true;
      user.invitationToken = undefined;
      user.invitationExpires = undefined;

      await user.save();

      res.status(200).json({
        success: true,
        message: "Registration completed successfully",
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }
}
