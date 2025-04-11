import axios from "axios";

// Base URL for notifications API
const BASE_URL = `${
  import.meta.env.VITE_API_URL || "https://payrollapi.digitalentshub.net"
}/api/notifications`;

// Fetch unread notification count
export const getUnreadNotificationCount = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/unread-count`, {
      withCredentials: true,
    });
    return response.data.data.unreadCount;
  } catch (error) {
    console.error("Error fetching unread notification count:", error);
    throw error;
  }
};
