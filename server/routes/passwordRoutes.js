import { Router } from "express";
import { PasswordController } from "../controllers/PasswordController.js";
import {
  requireAuth,
  passwordAttemptLimiter,
  requirePasswordChange,
} from "../middleware/authMiddleware.js";
import { EmailService } from "../services/EmailService.js";

const router = Router();

// Test email service directly
router.post("/test-email", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    console.log("Testing email service with:", email);
    console.log("Email configuration:", {
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      user: process.env.EMAIL_USER,
      from: process.env.EMAIL_FROM,
    });

    // Create instance of EmailService
    const emailService = new EmailService();
    const testToken = "test-token-123";
    const emailSent = await emailService.sendPasswordResetEmail(
      email,
      testToken
    );

    if (!emailSent) {
      return res.status(500).json({ message: "Error sending test email" });
    }

    res.json({ message: "Test email sent successfully" });
  } catch (error) {
    console.error("Test email error:", error);
    res
      .status(500)
      .json({ message: "Error processing request", error: error.message });
  }
});

router.post("/direct-reset", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    console.log("Direct password reset request for:", email);

    // Create instance of EmailService
    const emailService = new EmailService();
    const testToken = "test-token-123";

    console.log(`📨 Sending password reset email to ${email}...`);
    const emailSent = await emailService.sendPasswordResetEmail(
      email,
      testToken
    );

    if (emailSent) {
      console.log("✅ Password reset email sent successfully!");
      res.json({ message: "Password reset email sent successfully" });
    } else {
      console.error("❌ Failed to send password reset email");
      res.status(500).json({ message: "Failed to send password reset email" });
    }
  } catch (error) {
    console.error("❌ Password reset error:", error);
    res
      .status(500)
      .json({ message: "Error processing request", error: error.message });
  }
});

// ===== Password Management Routes =====
// Update password (protected)
router.post(
  "/update",
  requireAuth,
  passwordAttemptLimiter,
  PasswordController.updatePassword
);

// Check password status (protected)
router.get("/status", requireAuth, requirePasswordChange, (req, res) => {
  res.json({
    requiresChange: false,
  });
});

// ===== Password Reset Routes =====
// Rate limiting middleware for forgot password
const rateLimitForgotPassword = (req, res, next) => {
  console.log("🔍 Backend: Rate limiting middleware called");
  console.log("🔍 Backend: Session object:", req.session);

  // Initialize session if it doesn't exist
  if (!req.session) {
    console.log("⚠️ Backend: Session is undefined, creating empty session");
    req.session = {};
  }

  const attempts = req.session.passwordResetAttempts || 0;
  console.log("🔍 Backend: Current password reset attempts:", attempts);

  if (attempts > 5) {
    console.log("❌ Backend: Too many password reset attempts");
    return res.status(429).json({
      message: "Too many password reset attempts. Please try again later.",
    });
  }

  req.session.passwordResetAttempts = attempts + 1;
  console.log(
    "✅ Backend: Incremented password reset attempts to:",
    req.session.passwordResetAttempts
  );
  next();
};

// Forgot password (public)
router.post("/forgot", rateLimitForgotPassword, async (req, res, next) => {
  console.log("🔍 Backend: Forgot password route handler called");
  console.log("🔍 Backend: Request body:", req.body);

  try {
    await PasswordController.forgotPassword(req, res);
    console.log("✅ Backend: Password reset email sent successfully");
  } catch (error) {
    console.error("❌ Backend: Error in forgot password handler:", error);
    next(error);
  }
});

// Reset password (public)
router.post("/reset", PasswordController.resetPassword);

export default router;
