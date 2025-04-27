import React, { createContext, useContext, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { toast } from "react-toastify";

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
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "https://payrollapi.digitalentshub.net"
        }/api/notifications/unread`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();

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
