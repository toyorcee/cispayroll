import {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { FaBell, FaUser, FaBuilding, FaCalendarAlt } from "react-icons/fa";
import { format } from "date-fns";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  data?: {
    payrollId: string;
    month: number;
    year: number;
    status: string;
    remarks?: string;
    employeeName?: string;
    departmentName?: string;
    departmentCode?: string;
    forceRefresh?: boolean;
  };
  createdAt: string;
  read: boolean;
}

export interface NotificationBellRef {
  checkForNewNotifications: () => Promise<void>;
}

export const NotificationBell = forwardRef<NotificationBellRef, {}>(
  (_, ref) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const pollingInterval = useRef<number | null>(null);

    useImperativeHandle(ref, () => ({
      checkForNewNotifications: async () => {
        await fetchNotifications();
      },
    }));

    useEffect(() => {
      fetchNotifications();

      pollingInterval.current = window.setInterval(() => {
        fetchNotifications();
      }, 10000);

      return () => {
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current);
        }
      };
    }, []);

    const fetchNotifications = async () => {
      if (isLoading) return;

      try {
        setIsLoading(true);

        const apiUrl =
          import.meta.env.VITE_API_URL ||
          "http://localhost:5000";
        const response = await fetch(`${apiUrl}/api/notifications`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          console.error(
            `❌ API error: ${response.status} ${response.statusText}`
          );
          const text = await response.text();
          console.error("Response body:", text);
          throw new Error(
            `API error: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();

        if (data.success) {
          const newUnreadCount = data.data.unreadCount;

          if (data.data.notifications.length > 0) {
            data.data.notifications.forEach(
              (notification: Notification, index: number) => {
                console.log(`📝 Notification #${index + 1}:`, {
                  id: notification._id,
                  type: notification.type,
                  title: notification.title,
                  message: notification.message,
                  read: notification.read,
                  createdAt: notification.createdAt,
                  data: notification.data,
                });

                // Special logging for payroll notifications
                if (
                  notification.type === "PAYROLL_DRAFT_CREATED" ||
                  notification.type === "PAYROLL_UPDATED" ||
                  notification.type === "PAYROLL_APPROVED" ||
                  notification.type === "PAYROLL_REJECTED"
                ) {
                  console.log(`💰 Payroll notification details:`, {
                    payrollId: notification.data?.payrollId,
                    month: notification.data?.month,
                    year: notification.data?.year,
                    status: notification.data?.status,
                    employeeName: notification.data?.employeeName,
                    departmentName: notification.data?.departmentName,
                  });
                }
              }
            );
          } else {
            console.log("⚠️ No notifications found");
          }

          if (newUnreadCount > unreadCount) {
            if (!isOpen) {
              console.log(
                `🔔 New notification! Unread count increased from ${unreadCount} to ${newUnreadCount}`
              );
            }
          }

          setNotifications(data.data.notifications);
          setUnreadCount(newUnreadCount);
        } else {
          console.error("❌ Failed to fetch notifications:", data.message);
        }
      } catch (error) {
        console.error("❌ Error fetching notifications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const markAsRead = async (notificationId: string) => {
      try {
        const apiUrl =
          import.meta.env.VITE_API_URL ||
          "http://localhost:5000";
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
        const apiUrl =
          import.meta.env.VITE_API_URL ||
          "http://localhost:5000";
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

    // Get status badge color
    const getStatusColor = (status: string) => {
      switch (status?.toLowerCase()) {
        case "draft":
          return "bg-gray-100 text-gray-800";
        case "pending":
          return "bg-yellow-100 text-yellow-800";
        case "approved":
          return "bg-green-100 text-green-800";
        case "rejected":
          return "bg-red-100 text-red-800";
        case "paid":
          return "bg-blue-100 text-blue-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    };

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-2 hover:bg-green-50 rounded-full relative cursor-pointer ${
            unreadCount > 0 ? "animate-pulse" : ""
          }`}
        >
          <FaBell className="w-5 h-5 text-gray-600 cursor-pointer" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-green-600 hover:text-green-800"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  No notifications
                </p>
              ) : (
                <div className="divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer ${
                        !notification.read ? "bg-green-50" : ""
                      }`}
                      onClick={() => markAsRead(notification._id)}
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-gray-800">
                          {notification.title}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {format(
                            new Date(notification.createdAt),
                            "MMM d, h:mm a"
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>

                      {notification.data && (
                        <div className="mt-3 space-y-2">
                          {/* Employee and Department Info */}
                          {(notification.data.employeeName ||
                            notification.data.departmentName) && (
                            <div className="flex flex-wrap gap-2 text-xs">
                              {notification.data.employeeName && (
                                <div className="flex items-center bg-gray-100 px-2 py-1 rounded">
                                  <FaUser className="mr-1 text-gray-500" />
                                  <span>{notification.data.employeeName}</span>
                                </div>
                              )}
                              {notification.data.departmentName && (
                                <div className="flex items-center bg-gray-100 px-2 py-1 rounded">
                                  <FaBuilding className="mr-1 text-gray-500" />
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
                              <div className="flex items-center text-xs bg-gray-100 px-2 py-1 rounded w-fit">
                                <FaCalendarAlt className="mr-1 text-gray-500" />
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
                                className={`px-2 py-1 rounded ${getStatusColor(
                                  notification.data.status
                                )}`}
                              >
                                {notification.data.status}
                              </span>
                            </div>
                          )}

                          {/* Remarks if any */}
                          {notification.data.remarks && (
                            <div className="text-xs text-gray-600 mt-1 italic">
                              "{notification.data.remarks}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);
