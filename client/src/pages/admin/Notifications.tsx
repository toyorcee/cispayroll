import { useState, useEffect } from "react";
import {
  FaBell,
  FaUser,
  FaBuilding,
  FaCalendarAlt,
  FaCheck,
  FaMoneyBillWave,
} from "react-icons/fa";
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
  };
  createdAt: string;
  read: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, unread, read
  const [typeFilter, setTypeFilter] = useState("all"); // all, payroll, etc.

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notifications", {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data.notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
        credentials: "include",
      });
      setNotifications(
        notifications.map((n) =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/read-all", {
        method: "PATCH",
        credentials: "include",
      });
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
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

  // Get notification type icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "payroll":
        return <FaMoneyBillWave className="w-5 h-5 text-green-600" />;
      default:
        return <FaBell className="w-5 h-5 text-gray-600" />;
    }
  };

  // Filter notifications based on read status and type
  const filteredNotifications = notifications.filter((notification) => {
    const matchesReadFilter =
      filter === "all" ||
      (filter === "read" && notification.read) ||
      (filter === "unread" && !notification.read);

    const matchesTypeFilter =
      typeFilter === "all" || notification.type === typeFilter;

    return matchesReadFilter && matchesTypeFilter;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
        <div className="flex space-x-4">
          <div className="flex items-center">
            <label htmlFor="filter" className="mr-2 text-sm text-gray-600">
              Status:
            </label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
          <div className="flex items-center">
            <label htmlFor="typeFilter" className="mr-2 text-sm text-gray-600">
              Type:
            </label>
            <select
              id="typeFilter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="all">All</option>
              <option value="payroll">Payroll</option>
            </select>
          </div>
          <button
            onClick={markAllAsRead}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded-md text-sm"
          >
            Mark all as read
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FaBell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No notifications found
          </h3>
          <p className="text-gray-500">
            There are no notifications matching your current filters.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-6 hover:bg-gray-50 transition-colors duration-150 ${
                  !notification.read ? "bg-green-50" : ""
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {format(
                            new Date(notification.createdAt),
                            "MMM d, yyyy h:mm a"
                          )}
                        </span>
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="text-green-600 hover:text-green-800"
                            title="Mark as read"
                          >
                            <FaCheck className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {notification.data && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Employee and Department Info */}
                        {(notification.data.employeeName ||
                          notification.data.departmentName) && (
                          <div className="flex flex-wrap gap-2">
                            {notification.data.employeeName && (
                              <div className="flex items-center bg-gray-100 px-3 py-1.5 rounded-md">
                                <FaUser className="mr-2 text-gray-500" />
                                <span className="text-sm">
                                  {notification.data.employeeName}
                                </span>
                              </div>
                            )}
                            {notification.data.departmentName && (
                              <div className="flex items-center bg-gray-100 px-3 py-1.5 rounded-md">
                                <FaBuilding className="mr-2 text-gray-500" />
                                <span className="text-sm">
                                  {notification.data.departmentName}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Payroll Period and Status */}
                        <div className="flex flex-wrap gap-2">
                          {notification.data.month &&
                            notification.data.year && (
                              <div className="flex items-center bg-gray-100 px-3 py-1.5 rounded-md">
                                <FaCalendarAlt className="mr-2 text-gray-500" />
                                <span className="text-sm">
                                  {getMonthName(notification.data.month)}{" "}
                                  {notification.data.year}
                                </span>
                              </div>
                            )}
                          {notification.data.status && (
                            <div className="flex items-center">
                              <span
                                className={`px-3 py-1.5 rounded-md text-sm ${getStatusColor(
                                  notification.data.status
                                )}`}
                              >
                                {notification.data.status}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Remarks if any */}
                        {notification.data.remarks && (
                          <div className="col-span-1 md:col-span-2 text-sm text-gray-600 mt-1 bg-gray-50 p-3 rounded-md">
                            <span className="font-medium">Remarks:</span> "
                            {notification.data.remarks}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
 