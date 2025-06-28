import api from "./api";

// Base URL for notifications API
const BASE_URL = `/api`;

// Fetch unread notification count
export const getUnreadNotificationCount = async () => {
  try {
    const response = await api.get(`${BASE_URL}/notifications/unread-count`);
    return response.data.data.unreadCount;
  } catch (error) {
    console.error("Error fetching unread notification count:", error);
    throw error;
  }
};

// Fetch all notifications
export const getNotifications = async () => {
  try {
    // console.log("🔔 [notificationService] Fetching notifications from API...");
    const response = await api.get(`${BASE_URL}/notifications`);
    // console.log("🔔 [notificationService] API response:", {
    //   status: response.status,
    //   data: response.data,
    //   notificationsCount: response.data?.data?.notifications?.length,
    //   unreadCount: response.data?.data?.unreadCount,
    // });
    return response.data;
  } catch (error) {
    console.error(
      "🔔 [notificationService] Error fetching notifications:",
      error
    );
    throw error;
  }
};

export const notificationService = {
  markAsRead: async (notificationId: string) => {
    try {
      const response = await api.patch(
        `${BASE_URL}/notifications/${notificationId}/read`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      throw error;
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await api.patch(
        `${BASE_URL}/notifications/mark-all-read`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      throw error;
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      const response = await api.delete(
        `${BASE_URL}/notifications/${notificationId}`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to delete notification:", error);
      throw error;
    }
  },
};
