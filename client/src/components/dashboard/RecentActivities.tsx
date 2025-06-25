import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, Typography, Chip } from "@mui/material";
import {
  auditService,
  RecentActivity,
  RECENT_ACTIVITIES_QUERY_KEY,
} from "../../services/auditService";
import { formatDistanceToNow } from "date-fns";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaClock,
  FaFileAlt,
  FaCog,
  FaHistory,
  FaPlus,
  FaEdit,
  FaTrash,
  FaUpload,
  FaDownload,
  FaSync,
  FaLock,
  FaUnlock,
  FaUserPlus,
  FaUserMinus,
  FaUserEdit,
  FaFileUpload,
  FaFileAlt as FaFile,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Action icons with distinct colors
const actionIcons: Record<string, React.ReactElement> = {
  CREATE: <FaPlus className="text-green-500" />,
  UPDATE: <FaEdit className="text-blue-500" />,
  DELETE: <FaTrash className="text-red-500" />,
  UPLOAD: <FaUpload className="text-indigo-500" />,
  DOWNLOAD: <FaDownload className="text-cyan-500" />,
  PROCESS: <FaSync className="text-orange-500" />,
  LOCK: <FaLock className="text-gray-700" />,
  UNLOCK: <FaUnlock className="text-gray-500" />,
  ADD: <FaUserPlus className="text-teal-500" />,
  REMOVE: <FaUserMinus className="text-red-500" />,
  EDIT: <FaUserEdit className="text-blue-500" />,
  SUBMIT: <FaFileUpload className="text-indigo-500" />,
  APPROVE: <FaCheckCircle className="text-green-500" />,
  REJECT: <FaTimesCircle className="text-red-500" />,
  ARCHIVE: <FaFile className="text-gray-500" />,
  default: <FaFile className="text-blue-500" />,
};

// Status configuration with distinct colors
const statusConfig: Record<
  string,
  { color: string; icon: React.ReactElement; bgColor: string }
> = {
  success: {
    color: "!text-green-600",
    icon: <FaCheckCircle className="text-lg !text-green-600" />,
    bgColor: "!bg-green-50",
  },
  error: {
    color: "!text-rose-600",
    icon: <FaTimesCircle className="text-lg !text-rose-600" />,
    bgColor: "!bg-rose-50",
  },
  warning: {
    color: "!text-yellow-600",
    icon: <FaExclamationTriangle className="text-lg !text-yellow-600" />,
    bgColor: "!bg-yellow-50",
  },
  pending: {
    color: "!text-violet-600",
    icon: <FaClock className="text-lg !text-violet-600" />,
    bgColor: "!bg-violet-50",
  },
  processing: {
    color: "!text-sky-600",
    icon: <FaCog className="text-lg animate-spin !text-sky-600" />,
    bgColor: "!bg-sky-50",
  },
  failed: {
    color: "!text-red-600",
    icon: <FaTimesCircle className="text-lg !text-red-600" />,
    bgColor: "!bg-red-50",
  },
  draft: {
    color: "!text-gray-600",
    icon: <FaFileAlt className="text-lg !text-gray-600" />,
    bgColor: "!bg-gray-50",
  },
  approved: {
    color: "!text-emerald-600",
    icon: <FaCheckCircle className="text-lg !text-emerald-600" />,
    bgColor: "!bg-emerald-50",
  },
  rejected: {
    color: "!text-red-600",
    icon: <FaTimesCircle className="text-lg !text-red-600" />,
    bgColor: "!bg-red-50",
  },
  submitted: {
    color: "!text-blue-600",
    icon: <FaFileUpload className="text-lg !text-blue-600" />,
    bgColor: "!bg-blue-50",
  },
  completed: {
    color: "!text-teal-600",
    icon: <FaCheckCircle className="text-lg !text-teal-600" />,
    bgColor: "!bg-teal-50",
  },
};

// Add this mapping right after the actionIcons
const actionDisplayNames: Record<string, string> = {
  CREATE: "Created",
  UPDATE: "Updated",
  DELETE: "Deleted",
  APPROVE: "Approved",
  REJECT: "Rejected",
  TOGGLE_STATUS: "Status Changed",
  BATCH_PAYMENT_INITIATION: "Initiated Batch Payment",
  PROCESS: "Processed",
  SUBMIT: "Submitted",
  ARCHIVE: "Archived",
  LOCK: "Locked",
  UNLOCK: "Unlocked",
  ADD: "Added",
  REMOVE: "Removed",
  EDIT: "Edited",
  UPLOAD: "Uploaded",
  DOWNLOAD: "Downloaded",
};

const getActionIcon = (action: string) => {
  return actionIcons[action] || actionIcons.default;
};

const getStatusConfig = (status: string | undefined) => {
  if (!status) return statusConfig.pending;
  return statusConfig[status.toLowerCase()] || statusConfig.pending;
};

const formatActivityDescription = (activity: RecentActivity) => {
  const { action, entity, details } = activity;
  const displayAction = actionDisplayNames[action] || action;

  switch (entity) {
    case "PAYROLL":
      return `${displayAction} payroll for ${
        details.employeeName || "employee"
      }`;
    case "EMPLOYEE":
      return `${displayAction} employee ${details.employeeName || ""}`;
    case "DEPARTMENT":
      return `${displayAction} department ${details.departmentName || ""}`;
    case "SETTINGS":
      return `${displayAction} system settings`;
    default:
      return `${displayAction} ${entity.toLowerCase()}`;
  }
};

export const RecentActivities: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Use React Query to fetch and automatically refresh recent activities
  const { data: activities = [], isLoading } = useQuery({
    queryKey: [RECENT_ACTIVITIES_QUERY_KEY],
    queryFn: () => auditService.getRecentActivities(10),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  useEffect(() => {
    auditService.setUserRole(user?.role);
    auditService.setQueryClient(queryClient);
  }, [user?.role, queryClient]);

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 shadow-lg">
        <CardHeader className="border-b border-emerald-100 bg-white/80 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaHistory className="text-emerald-600 text-xl" />
              <Typography variant="h6" className="text-gray-800 font-semibold">
                Recent Activities
              </Typography>
            </div>
            <Chip
              label={`${activities.length} Activities`}
              size="small"
              className="bg-emerald-100 text-emerald-700 shadow-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 p-4">
            {[1, 2, 3].map((index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-md animate-pulse"
              >
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 shadow-lg">
      <CardHeader className="border-b border-emerald-100 bg-white/80 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaHistory className="text-emerald-600 text-xl" />
            <Typography variant="h6" className="text-gray-800 font-semibold">
              Recent Activities
            </Typography>
          </div>
          <Chip
            label={`${activities.length} Activities`}
            size="small"
            className="bg-emerald-100 text-emerald-700 shadow-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="p-8 text-center bg-white/50">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 mb-4 shadow-md">
              <FaHistory className="text-4xl text-emerald-400" />
            </div>
            <Typography variant="h6" className="text-gray-600 mb-2">
              No Recent Activities
            </Typography>
            <Typography variant="body2" className="text-gray-500">
              New activities will appear here as they occur
            </Typography>
          </div>
        ) : (
          <div className="divide-y divide-emerald-100">
            {activities.map((activity) => {
              const status = getStatusConfig(activity.details?.status);
              const actionIcon = getActionIcon(activity.action);

              return (
                <div
                  key={activity._id}
                  className="p-4 hover:bg-emerald-50/80 transition-colors duration-200 bg-white/70 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-full ${status.bgColor} shadow-md`}
                    >
                      <div className={status.color}>{actionIcon}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Typography
                          variant="subtitle2"
                          className="text-gray-800 font-medium"
                        >
                          {formatActivityDescription(activity)}
                        </Typography>
                        <Chip
                          icon={status.icon}
                          label={activity.details.status}
                          size="small"
                          className={`${status.bgColor} ${status.color} border border-current/20 shadow-sm`}
                        />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50/50 px-3 py-1.5 rounded-full">
                        <span className="font-medium">
                          {activity.performedBy.firstName}{" "}
                          {activity.performedBy.lastName}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span>
                          {formatDistanceToNow(new Date(activity.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
