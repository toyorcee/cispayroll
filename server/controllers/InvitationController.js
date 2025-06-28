import UserModel from "../models/User.js";
import { handleError, ApiError } from "../utils/errorHandler.js";
import jwt from "jsonwebtoken";
import { EmployeeService } from "../services/employeeService.js";
import { EmailService } from "../services/emailService.js";
import bcrypt from "bcryptjs";
import { OnboardingStatus } from "../models/User.js";
import {
  getOnboardingTasks,
  getOffboardingTasks,
} from "../utils/defaultTasks.js";

export class InvitationController {
  static async createInvitation(req, res) {
    try {
      const { email, role, departmentId } = req.body;
      const createdBy = req.user.id;

      // Get default onboarding tasks
      const onboardingTasks = getOnboardingTasks();

      const { employee } = await EmployeeService.createEmployee(
        {
          email,
          role,
          department: departmentId,
          onboarding: {
            status: "NOT_STARTED",
            tasks: onboardingTasks,
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
      const user = await UserModel.findOne({
        invitationToken: token,
        invitationExpires: { $gt: new Date() },
        status: "pending",
      })
        .select(
          "email firstName lastName department employeeId position gradeLevel workLocation dateJoined"
        )
        .populate("department", "name code");

      if (user) {
        console.log("[verifyInvitation] User details:", {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          employeeId: user.employeeId,
          position: user.position,
          department: user.department,
          gradeLevel: user.gradeLevel,
          workLocation: user.workLocation,
          dateJoined: user.dateJoined,
        });
      }

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired invitation token",
        });
      }

      res.status(200).json({
        success: true,
        message: "Invitation token is valid",
        user: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          employeeId: user.employeeId,
          position: user.position,
          department: user.department,
          gradeLevel: user.gradeLevel,
          workLocation: user.workLocation,
          dateJoined: user.dateJoined,
        },
      });
    } catch (error) {
      console.error("[verifyInvitation] Error:", error);
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async completeRegistration(req, res) {
    try {
      const { token, password, confirmPassword } = req.body;

      // Parse nested objects
      const personalDetails = JSON.parse(req.body.personalDetails);
      const emergencyContact = JSON.parse(req.body.emergencyContact);
      const bankDetails = JSON.parse(req.body.bankDetails);
      const profileImage = req.file?.path;

      // Validate password
      if (password !== confirmPassword) {
        throw new ApiError(400, "Passwords do not match");
      }

      if (password.length < 8) {
        throw new ApiError(400, "Password must be at least 8 characters long");
      }

      // Find and validate user
      const user = await UserModel.findOne({
        invitationToken: token,
        invitationExpires: { $gt: new Date() },
        status: "pending",
      }).populate("department", "name code");

      if (!user) {
        throw new ApiError(400, "Invalid or expired invitation token");
      }

      // Update user data
      user.password = await bcrypt.hash(password, 10);
      user.status = "active";
      user.isEmailVerified = true;

      // Update nested objects
      user.personalDetails = {
        ...user.personalDetails,
        ...personalDetails,
        address: {
          ...user.personalDetails?.address,
          ...personalDetails.address,
        },
        nextOfKin: {
          ...user.personalDetails?.nextOfKin,
          ...personalDetails.nextOfKin,
          address: {
            ...user.personalDetails?.nextOfKin?.address,
            ...personalDetails.nextOfKin?.address,
          },
        },
        qualifications: personalDetails.qualifications || [],
      };

      user.emergencyContact = {
        ...user.emergencyContact,
        ...emergencyContact,
      };

      user.bankDetails = {
        ...user.bankDetails,
        ...bankDetails,
      };

      // Handle profile image
      if (profileImage) {
        user.profileImage = profileImage.replace(/\\/g, "/");
      }

      // Get default onboarding tasks
      const onboardingTasks = getOnboardingTasks();
      // Get default offboarding tasks
      const offboardingTasks = getOffboardingTasks();

      // Initialize onboarding
      user.onboarding = {
        status: OnboardingStatus.NOT_STARTED,
        tasks: onboardingTasks,
        progress: 0,
        startedAt: new Date(),
      };

      // Initialize offboarding if missing or reset to default
      if (!user.offboarding || typeof user.offboarding !== "object") {
        user.offboarding = {
          status: "not_started",
          tasks: offboardingTasks,
          progress: 0,
        };
      }

      // Clear invitation data
      user.invitationToken = undefined;
      user.invitationExpires = undefined;

      await user.save();

      // Generate JWT token
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
          department: {
            _id: user.department._id,
            name: user.department.name,
            code: user.department.code,
          },
        },
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }
}
