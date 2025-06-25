import { Router } from "express";
import { EmailService } from "../services/emailService.js";
import {
  requireAuth,
  requireSuperAdmin,
} from "../middleware/authMiddleware.js";

const router = Router();

router.post("/test-email", async (req, res) => {
  try {
    await EmailService.sendInvitationEmail(req.body.email, "test-token-123");
    res.json({ success: true, message: "Test email sent" });
  } catch (error) {
    console.error("Email test failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send email",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Test email configuration endpoint
router.get(
  "/email-config",
  requireAuth,
  requireSuperAdmin,
  async (req, res) => {
    try {
      console.log("🧪 [TestRoute] Testing email configuration...");
      const result = await EmailService.testEmailConfiguration();

      res.json({
        success: true,
        message: "Email configuration test completed",
        result,
      });
    } catch (error) {
      console.error("❌ [TestRoute] Email configuration test failed:", error);
      res.status(500).json({
        success: false,
        message: "Email configuration test failed",
        error: error.message,
      });
    }
  }
);

export default router;
