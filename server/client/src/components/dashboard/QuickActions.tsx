import { motion } from "framer-motion";
import { UserRole, Permission } from "../../types/auth";
import { FaPlus, FaUserPlus, FaFileAlt, FaCalendarPlus } from "react-icons/fa";
import { Link } from "react-router-dom";
import { IconType } from "react-icons";

interface Action {
  label: string;
  icon: IconType;
  href?: string;
  color: string;
  onClick?: () => void;
}

interface QuickActionsProps {
  role?: UserRole;
  permissions?: Permission[];
  onAddAdmin: () => void;
}

const QuickActions = ({
  role,
  permissions = [],
  onAddAdmin,
}: QuickActionsProps) => {
  const actions: Record<UserRole, Action[]> = {
    [UserRole.SUPER_ADMIN]: [
      {
        label: "Add Admin",
        icon: FaUserPlus,
        onClick: onAddAdmin,
        color: "blue",
      },
      {
        label: "Create Department",
        icon: FaPlus,
        href: "/settings/departments/new",
        color: "green",
      },
    ],
    [UserRole.ADMIN]: [
      {
        label: "Add Employee",
        icon: FaUserPlus,
        href: "/employees/new",
        color: "green",
      },
      {
        label: "Process Payroll",
        icon: FaFileAlt,
        href: "/payroll/process",
        color: "blue",
      },
    ],
    [UserRole.USER]: [
      {
        label: "Request Leave",
        icon: FaCalendarPlus,
        href: "/my-leave/request",
        color: "green",
      },
      {
        label: "View Payslip",
        icon: FaFileAlt,
        href: "/my-payslips",
        color: "blue",
      },
    ],
  };

  const currentActions = role ? actions[role] : [];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {currentActions.map((action, index) => (
        <motion.div
          key={action.label}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          {action.onClick ? (
            <button
              onClick={action.onClick}
              className={`flex items-center w-full p-4 bg-white rounded-lg shadow-md 
                       border-l-4 border-${action.color}-500 hover:shadow-lg transition-all duration-300`}
            >
              <action.icon
                className={`h-6 w-6 text-${action.color}-500 mr-3`}
              />
              <span className="text-sm font-medium text-gray-700">
                {action.label}
              </span>
            </button>
          ) : action.href ? (
            <Link
              to={action.href}
              className={`flex items-center p-4 bg-white rounded-lg shadow-md 
                       border-l-4 border-${action.color}-500 hover:shadow-lg transition-all duration-300`}
            >
              <action.icon
                className={`h-6 w-6 text-${action.color}-500 mr-3`}
              />
              <span className="text-sm font-medium text-gray-700">
                {action.label}
              </span>
            </Link>
          ) : null}
        </motion.div>
      ))}
    </div>
  );
};

export default QuickActions;
