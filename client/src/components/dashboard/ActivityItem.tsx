import { motion } from "framer-motion";
import { IconType } from "react-icons";

interface ActivityItemProps {
  activity: {
    id: number;
    type: string;
    action: string;
    time: string;
    icon: IconType;
    description?: string; 
    name?: string;
    department?: string;
    status?: string;
    details?: string;
    period?: string;
    duration?: string;
    count?: string;
  };
  index: number;
}

const ActivityItem = ({ activity, index }: ActivityItemProps) => {
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "successful":
      case "approved":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "failed":
      case "rejected":
        return "text-red-600 bg-red-100";
      default:
        return "text-blue-600 bg-blue-100";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200"
    >
      <div className={`p-2 rounded-full ${getStatusColor(activity.status)}`}>
        <activity.icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900">{activity.action}</p>
          <span className="text-xs text-gray-500">{activity.time}</span>
        </div>
        {activity.name && (
          <p className="text-sm text-gray-600 mt-1">
            {activity.name}
            {activity.department && ` • ${activity.department}`}
          </p>
        )}
        {activity.details && (
          <p className="text-sm text-gray-500 mt-1">{activity.details}</p>
        )}
        {activity.status && (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${getStatusColor(
              activity.status
            )}`}
          >
            {activity.status}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default ActivityItem;
