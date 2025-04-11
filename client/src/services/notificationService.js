import axios from "axios";

// Fetch unread notification count
export const getUnreadNotificationCount = async () => {
  try {
    const response = await axios.get("/api/notifications/unread-count");
    return response.data.data.unreadCount;
  } catch (error) {
    console.error("Error fetching unread notification count:", error);
    throw error;
  }
};
