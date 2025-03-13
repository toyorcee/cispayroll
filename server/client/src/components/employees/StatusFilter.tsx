import { motion } from "framer-motion";
import { Status } from "../../types/common";

interface StatusFilterProps {
  currentStatus: Status | undefined;
  onStatusChange: (status: Status | undefined) => void;
}

export const StatusFilter = ({
  currentStatus,
  onStatusChange,
}: StatusFilterProps) => {
  const statuses: (Status | "all")[] = [
    "all",
    "active",
    "inactive",
    "suspended",
    "terminated",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-2"
    >
      {statuses.map((status) => (
        <button
          key={status}
          onClick={() =>
            onStatusChange(status === "all" ? undefined : (status as Status))
          }
          className={`px-4 py-2 rounded-lg transition-all duration-300 ${
            (status === "all" && !currentStatus) || status === currentStatus
              ? "!bg-green-600 !text-white hover:!bg-green-700"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </button>
      ))}
    </motion.div>
  );
};
