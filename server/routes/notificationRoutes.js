import express from "express";
import NotificationController from "../controllers/NotificationController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all notifications for the current user
router.get("/", requireAuth, NotificationController.getNotifications);

// Mark a notification as read
router.patch(
  "/:notificationId/read",
  requireAuth,
  NotificationController.markAsRead
);

// Mark all notifications as read
router.patch("/read-all", requireAuth, NotificationController.markAllAsRead);

// Create a new notification (admin only)
router.post("/", requireAuth, NotificationController.createNotification);

export default router;
