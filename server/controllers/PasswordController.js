import bcrypt from "bcryptjs";
import crypto from "crypto";
import UserModel from "../models/User.js";
import { EmailService } from "../services/emailService.js";

export class PasswordController {
  static async updatePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Validate input
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          message: "Current password and new password are required",
        });
      }

      // Get user
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        // Increment password attempt counter
        if (req.passwordAttemptInfo) {
          await req.passwordAttemptInfo.incrementAttempt();
        }
        return res
          .status(401)
          .json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password and reset attempts
      user.password = hashedPassword;
      user.passwordLastChanged = new Date();
      user.passwordAttempts = 0;
      await user.save();

      const emailService = new EmailService();
      await emailService.sendPasswordChangedEmail(user.email);

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Password update error:", error);
      res.status(500).json({ message: "Error updating password" });
    }
  }

  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await UserModel.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = await bcrypt.hash(resetToken, 10);

      // Save hashed token to user
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
      await user.save();

      // Fix: Create instance of EmailService
      const emailService = new EmailService();
      const emailSent = await emailService.sendPasswordResetEmail(
        email,
        resetToken
      );
      if (!emailSent) {
        return res.status(500).json({ message: "Error sending reset email" });
      }

      res.json({ message: "Password reset email sent" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Error processing request" });
    }
  }

  static async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({
          message: "Reset token and new password are required",
        });
      }

      // Find user with valid reset token
      const user = await UserModel.findOne({
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({
          message: "Password reset token is invalid or has expired",
        });
      }

      // Verify token
      const isValidToken = await bcrypt.compare(token, user.resetPasswordToken);
      if (!isValidToken) {
        return res.status(400).json({ message: "Invalid reset token" });
      }

      // Update password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      user.passwordLastChanged = new Date();
      await user.save();

      res.json({ message: "Password has been reset" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Error resetting password" });
    }
  }
}
