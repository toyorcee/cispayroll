import express from "express";
import { NotificationPreferenceController } from "../controllers/NotificationPreferenceController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Get user's notification preferences
router.get("/", NotificationPreferenceController.getPreferences);

// Update user's notification preferences
router.put("/", NotificationPreferenceController.updatePreferences);

// Reset user's notification preferences to defaults
router.post("/reset", NotificationPreferenceController.resetPreferences);

// Toggle specific notification type
router.post(
  "/toggle-type",
  NotificationPreferenceController.toggleNotificationType
);

// Toggle notification channel (inApp or email)
router.post("/toggle-channel", NotificationPreferenceController.toggleChannel);

export default router;
