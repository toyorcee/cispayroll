import UserModel from "../models/User.js";
import { handleError, ApiError } from "../utils/errorHandler.js";
import jwt from "jsonwebtoken";
import { EmployeeService } from "../services/employeeService.js";
import { EmailService } from "../services/emailService.js";
import bcrypt from "bcryptjs";
import { OnboardingStatus } from "../models/User.js";

export class InvitationController {
  static async createInvitation(req, res) {
    try {
      const { email, role, departmentId } = req.body;
      const createdBy = req.user.id;

      const { employee } = await EmployeeService.createEmployee(
        {
          email,
          role,
          department: departmentId,
          onboarding: {
            status: "NOT_STARTED",
            tasks: [
              {
                name: "Welcome Meeting",
                description: "Initial orientation and welcome meeting",
                category: "orientation",
                deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
              },
              {
                name: "Department Introduction",
                description: "Meet team and understand department workflow",
                category: "orientation",
                deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
              },
              {
                name: "Document Submission",
                description: "Submit required documents",
                category: "documentation",
                deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
              },
            ],
          },
        },
        { _id: createdBy }
      );

      const invitationToken = jwt.sign(
        {
          email,
          type: "invitation",
          role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      await EmailService.sendInvitationEmail(email, invitationToken, role);

      res.status(201).json({
        success: true,
        message: "Invitation sent successfully",
        userId: employee.id,
      });
    } catch (error) {
      console.error("Create invitation error:", error);
      throw new ApiError(500, "Error creating invitation");
    }
  }

  static async verifyInvitation(req, res) {
    try {
      const { token } = req.params;
      console.log("Verifying token:", token);

      // Find user by invitationToken directly
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

  static async completeRegistration(req, res) {
    try {
      const { token, password, confirmPassword } = req.body;
      const emergencyContact = JSON.parse(req.body.emergencyContact);
      const bankDetails = JSON.parse(req.body.bankDetails);
      const profileImage = req.file?.path;

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
      user.emergencyContact = emergencyContact;
      user.bankDetails = bankDetails;

      if (profileImage) {
        user.profileImage = profileImage;
      }

      // Initialize onboarding when user becomes active
      user.onboarding = {
        status: OnboardingStatus.NOT_STARTED,
        tasks: [
          { name: "Welcome Meeting", completed: false },
          { name: "Department Introduction", completed: false },
          { name: "System Access Setup", completed: false },
          { name: "Policy Documentation Review", completed: false },
          { name: "Initial Training Session", completed: false },
        ],
        progress: 0,
        startedAt: new Date(),
      };

      // Clear invitation data
      user.invitationToken = undefined;
      user.invitationExpires = undefined;

      await user.save();

      // Generate JWT token for immediate login
      const authToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
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
