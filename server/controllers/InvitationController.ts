import { Request, Response } from "express";
import UserModel from "../models/User.js";
import bcrypt from "bcryptjs";
import { handleError, ApiError } from "../utils/errorHandler.js";
import jwt from "jsonwebtoken";

// Define a custom Request type that extends Express.Request
interface CompleteRegistrationRequest extends Request {
  file?: Express.Multer.File;
  body: {
    token: string;
    password: string;
    confirmPassword: string;
    emergencyContact: string;
    bankDetails: string;
  };
}

export class InvitationController {
  static async verifyInvitation(req: Request, res: Response) {
    try {
      const { token } = req.params;
      console.log("Verifying token:", token);

      const user = await UserModel.findOne({
        invitationToken: token,
        invitationExpires: { $gt: new Date() },
        status: "pending",
      });

      if (!user) {
        console.log("No user found with token");
        return res.status(400).json({
          success: false,
          message: "Invalid or expired invitation token",
        });
      }

      console.log("User found:", user.email);
      res.status(200).json({
        success: true,
        userData: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          employeeId: user.employeeId,
          position: user.position,
          department: user.department,
        },
      });
    } catch (error) {
      console.error("Verification error:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async completeRegistration(
    req: CompleteRegistrationRequest,
    res: Response
  ) {
    try {
      const {
        token,
        password,
        confirmPassword,
        emergencyContact,
        bankDetails,
      } = req.body;
      const profileImage = req.file?.path;

      // Parse JSON strings
      const parsedEmergencyContact = JSON.parse(emergencyContact);
      const parsedBankDetails = JSON.parse(bankDetails);

      if (password !== confirmPassword) {
        throw new ApiError(400, "Passwords do not match");
      }

      if (password.length < 8) {
        throw new ApiError(400, "Password must be at least 8 characters long");
      }

      const user = await UserModel.findOne({
        invitationToken: token,
        invitationExpires: { $gt: new Date() },
        status: "pending",
      });

      if (!user) {
        throw new ApiError(400, "Invalid or expired invitation token");
      }

      // Update user with all fields
      user.password = await bcrypt.hash(password, 10);
      user.status = "active";
      user.isEmailVerified = true;
      user.emergencyContact = parsedEmergencyContact;
      user.bankDetails = parsedBankDetails;

      if (profileImage) {
        user.profileImage = profileImage;
      }

      user.invitationToken = undefined;
      user.invitationExpires = undefined;

      await user.save();

      // Generate JWT token for immediate login
      const authToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: "1d" }
      );

      res.status(200).json({
        success: true,
        message: "Registration completed successfully",
        token: authToken,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          employeeId: user.employeeId,
          role: user.role,
        },
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }
}
