import Notification from "../models/Notification.js";
import { ApiError, asyncHandler } from "../utils/errorHandler.js";

class NotificationController {
  // Get all notifications for the current user
  static getNotifications = asyncHandler(async (req, res) => {
    console.log(`🔍 Fetching notifications for user: ${req.user._id}`);

    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    console.log(
      `📬 Found ${notifications.length} notifications for user ${req.user._id}`
    );
    console.log(`📭 Unread notifications: ${unreadCount}`);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  });

  // Mark a notification as read
  static markAsRead = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: req.user._id,
    });

    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }

    notification.read = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  });

  // Mark all notifications as read
  static markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  });

  // Create a new notification
  static createNotification = asyncHandler(async (req, res) => {
    const { recipient, type, title, message, data } = req.body;

    const notification = await Notification.create({
      recipient,
      type,
      title,
      message,
      data,
    });

    res.status(201).json({
      success: true,
      data: { notification },
    });
  });

  // Method to get unread notification count
  static getUnreadCount = asyncHandler(async (req, res) => {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    res.status(200).json({
      success: true,
      data: { unreadCount },
    });
  });
}

export default NotificationController;
