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

// Route to get unread notification count
router.get("/unread-count", requireAuth, NotificationController.getUnreadCount);

export default router;
