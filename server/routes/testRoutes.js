import { Router } from "express";
import { EmailService } from "../services/EmailService.js";

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

export default router;
