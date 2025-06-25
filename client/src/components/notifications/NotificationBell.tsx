import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { FaBell, FaUser, FaBuilding, FaCalendarAlt } from "react-icons/fa";
import { format } from "date-fns";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { getNotifications } from "../../services/notificationService";

interface Notification {
  _id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: {
    employeeName?: string;
    departmentName?: string;
    month?: number;
    year?: number;
    status?: string;
    remarks?: string;
    forceRefresh?: boolean;
  };
}

export interface NotificationBellRef {
  checkForNewNotifications: () => void;
}

export const NotificationBell = forwardRef<NotificationBellRef>(
  (_props, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const queryClient = useQueryClient();

    const {
      data: notificationsData,
      isLoading,
      refetch,
    } = useQuery({
      queryKey: ["notifications"],
      queryFn: async () => {
        const response = await getNotifications();
        return response.data;
      },
      refetchInterval: 30000,
    });

    useImperativeHandle(ref, () => ({
      checkForNewNotifications: () => {
        refetch();
      },
    }));

    useEffect(() => {
      if (notificationsData && Array.isArray(notificationsData.notifications)) {
        setNotifications(notificationsData.notifications);
        setUnreadCount(notificationsData.unreadCount || 0);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    }, [notificationsData]);

    const markAsRead = async (notificationId: string) => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        await fetch(`${apiUrl}/api/notifications/${notificationId}/read`, {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        setNotifications(
          notifications.map((n) =>
            n._id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    };

    const markAllAsRead = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        await fetch(`${apiUrl}/api/notifications/read-all`, {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        setNotifications(notifications.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      } catch (error) {
        console.error("Error marking all notifications as read:", error);
      }
    };

    // Format month number to month name
    const getMonthName = (month: number) => {
      const date = new Date();
      date.setMonth(month - 1);
      return date.toLocaleString("default", { month: "long" });
    };

    return (
      <div className="relative">
        <button
          onClick={() => {
            setIsOpen(!isOpen);
          }}
          className={`p-2 hover:bg-green-50 rounded-full relative cursor-pointer ${
            unreadCount > 0 ? "animate-pulse" : ""
          }`}
        >
          <FaBell
            className={`w-5 h-5 text-gray-600 cursor-pointer ${
              isLoading ? "animate-spin" : ""
            }`}
          />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="fixed top-16 left-0 right-0 w-full max-w-xs mx-auto sm:absolute sm:top-auto sm:mt-2 sm:right-0 sm:left-auto sm:w-96 bg-green-600 text-white rounded-lg shadow-lg border border-green-700 z-50">
            <div className="p-4 border-b border-green-700 flex justify-between items-center">
              <h3 className="font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-green-100 hover:text-white"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-200 mx-auto"></div>
                  <p className="mt-2 text-xs text-green-100">
                    Updating notifications...
                  </p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-center text-green-100 py-4">
                    No notifications
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-green-700/60">
                  {notifications.map((notification, index) => {
                    return (
                      <div
                        key={notification._id}
                        className={`p-4 bg-green-700/80 rounded mb-2 cursor-pointer ${
                          !notification.read ? "ring-2 ring-green-200" : ""
                        }`}
                        onClick={() => markAsRead(notification._id)}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-white">
                            {notification.title}
                          </h4>
                          <span className="text-xs text-green-100">
                            {format(
                              new Date(notification.createdAt),
                              "MMM d, h:mm a"
                            )}
                          </span>
                        </div>
                        <p className="text-sm text-green-100 mt-1">
                          {notification.message}
                        </p>

                        {notification.data && (
                          <div className="mt-3 space-y-2">
                            {/* Employee and Department Info */}
                            {(notification.data.employeeName ||
                              notification.data.departmentName) && (
                              <div className="flex flex-wrap gap-2 text-xs">
                                {notification.data.employeeName && (
                                  <div className="flex items-center bg-green-800/80 px-2 py-1 rounded">
                                    <FaUser className="mr-1 text-green-200" />
                                    <span>
                                      {notification.data.employeeName}
                                    </span>
                                  </div>
                                )}
                                {notification.data.departmentName && (
                                  <div className="flex items-center bg-green-800/80 px-2 py-1 rounded">
                                    <FaBuilding className="mr-1 text-green-200" />
                                    <span>
                                      {notification.data.departmentName}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Payroll Period */}
                            {notification.data.month &&
                              notification.data.year && (
                                <div className="flex items-center text-xs bg-green-800/80 px-2 py-1 rounded w-fit">
                                  <FaCalendarAlt className="mr-1 text-green-200" />
                                  <span>
                                    {getMonthName(notification.data.month)}{" "}
                                    {notification.data.year}
                                  </span>
                                </div>
                              )}

                            {/* Status Badge */}
                            {notification.data.status && (
                              <div className="flex items-center text-xs mt-1">
                                <span
                                  className={`px-2 py-1 rounded bg-green-900 text-green-100`}
                                >
                                  {notification.data.status}
                                </span>
                              </div>
                            )}

                            {/* Remarks if any */}
                            {notification.data.remarks && (
                              <div className="text-xs text-green-100 mt-1 italic">
                                "{notification.data.remarks}"
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);
