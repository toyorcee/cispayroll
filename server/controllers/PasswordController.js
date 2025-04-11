import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import { EmailService } from "../services/EmailService.js";

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
      const user = await User.findById(userId);
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
        console.log("❌ Backend: Email is missing in request");
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

      // Save the token to the user
      await user.save({ validateBeforeSave: false });

      // Send email
      const emailService = new EmailService();
      const emailSent = await emailService.sendPasswordResetEmail(
        user.email,
        resetToken
      );

      if (emailSent) {
        return res.status(200).json({
          message: "Password reset email sent successfully",
        });
      } else {
        return res.status(500).json({
          message: "Failed to send password reset email",
        });
      }
    } catch (error) {
      console.warn("❌ Backend: Forgot password error:", error);
      return res.status(500).json({ message: "Error processing request" });
    }
  }

  static async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;
      console.log("🔍 Reset Password Request:", {
        token: token ? "Token provided" : "No token",
        newPassword: newPassword ? "Password provided" : "No password",
      });

      if (!token || !newPassword) {
        console.log("❌ Missing required fields:", { token, newPassword });
        return res.status(400).json({
          message: "Reset token and new password are required",
        });
      }

      // Find user with valid reset token - FIXED: Search for the specific token
      console.log("🔍 Searching for user with reset token:", token);

      // First, find all users with reset tokens to debug
      const allUsersWithTokens = await User.find({
        resetPasswordToken: { $exists: true },
      });
      console.log(`Found ${allUsersWithTokens.length} users with reset tokens`);

      // Log details of all users with tokens for debugging
      allUsersWithTokens.forEach((user, index) => {
        console.log(`User ${index + 1} with token:`, {
          userId: user._id,
          email: user.email,
          token: user.resetPasswordToken,
          tokenExpiry: user.resetPasswordExpires,
          isExpired: user.resetPasswordExpires < Date.now(),
        });
      });

      // Try to find the user with the exact token
      let user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });

      // If not found, try a more lenient search without expiration check
      if (!user) {
        console.log(
          "⚠️ User not found with exact token match, trying without expiration check"
        );
        user = await User.findOne({ resetPasswordToken: token });

        if (user) {
          console.log("⚠️ Found user with token but it may be expired:", {
            userId: user._id,
            email: user.email,
            tokenExpiry: user.resetPasswordExpires,
            currentTime: Date.now(),
            isExpired: user.resetPasswordExpires < Date.now(),
          });

          // If token is expired, return error
          if (user.resetPasswordExpires < Date.now()) {
            console.log("❌ Token is expired");
            return res.status(400).json({
              message: "Password reset token has expired",
            });
          }
        }
      }

      if (!user) {
        console.log("❌ No user found with this specific reset token");
        return res.status(400).json({
          message: "Password reset token is invalid or has expired",
        });
      }

      console.log("✅ User found with reset token:", {
        userId: user._id,
        email: user.email,
        tokenExpiry: user.resetPasswordExpires,
        currentTime: Date.now(),
        timeRemaining: user.resetPasswordExpires - Date.now(),
      });

      // Update password - No need to verify token since we found the user with the exact token
      console.log("✅ Token verified, updating password...");
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      user.passwordLastChanged = new Date();
      await user.save();

      console.log("✅ Password successfully reset for user:", user._id);
      res.json({ message: "Password has been reset" });
    } catch (error) {
      console.error("❌ Reset password error:", error);
      res.status(500).json({ message: "Error resetting password" });
    }
  }
}
