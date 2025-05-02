import React, { createContext, useContext, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { toast } from "react-toastify";
import axios from "axios";

interface NotificationContextType {
  checkForNewNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();

  const checkForNewNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/notifications/unread`,
        {
          withCredentials: true,
        }
      );
      const data = response.data;

      // Show toast for new notifications
      data.notifications.forEach((notification: any) => {
        toast.info(notification.message, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      });
    } catch (error) {
      console.error("Error checking notifications:", error);
    }
  }, [user]);

  return (
    <NotificationContext.Provider value={{ checkForNewNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};
