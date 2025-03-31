import { motion } from "framer-motion";
import { Status } from "../../types/common";

interface StatusFilterProps {
  currentStatus: Status | undefined;
  onStatusChange: (status: Status | undefined) => void;
  className?: string;
  buttonClassName?: string;
}

export const StatusFilter = ({
  currentStatus,
  onStatusChange,
  className = "",
  buttonClassName = "",
}: StatusFilterProps) => {
  const statuses: (Status | "all")[] = [
    "all",
    "active",
    "inactive",
    "suspended",
    "pending",
    "offboarding",
    "terminated",
  ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "active":
        return "!bg-green-600 !text-white hover:!bg-green-700";
      case "pending":
        return "!bg-blue-600 !text-white hover:!bg-blue-700";
      case "offboarding":
        return "!bg-orange-600 !text-white hover:!bg-orange-700";
      case "suspended":
        return "!bg-yellow-600 !text-white hover:!bg-yellow-700";
      case "terminated":
        return "!bg-red-600 !text-white hover:!bg-red-700";
      case "inactive":
        return "!bg-gray-600 !text-white hover:!bg-gray-700";
      default:
        return "bg-gray-100 text-gray-700 hover:bg-gray-200";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-wrap gap-2 ${className}`}
    >
      {statuses.map((status) => (
        <button
          key={status}
          onClick={() =>
            onStatusChange(status === "all" ? undefined : (status as Status))
          }
          className={`${buttonClassName} transition-all duration-300 ${
            (status === "all" && !currentStatus) || status === currentStatus
              ? getStatusStyle(status)
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </button>
      ))}
    </motion.div>
  );
};
