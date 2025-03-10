import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { UserRole } from "../../types/auth";
import {
  FaUserShield,
  FaMoneyBill,
  FaClock,
  FaExclamationTriangle,
  FaCalendar,
  FaFileInvoiceDollar,
  FaUserTie,
  FaChartLine,
  FaFileAlt,
  FaBriefcase,
  FaSync,
  FaDatabase,
  FaShieldAlt,
  FaUserPlus,
  FaCalendarCheck,
  FaExclamation,
  FaUserEdit,
  FaChartBar,
} from "react-icons/fa";
import { IconType } from "react-icons";
import { Permission } from "../../types/auth";

interface StatItem {
  name: string;
  value: string;
  subtext: string;
  icon: IconType;
  href: string;
}

interface ActivityItem {
  id: number;
  type:
    | "admin"
    | "integration"
    | "compliance"
    | "system"
    | "audit"
    | "employee"
    | "leave"
    | "payroll"
    | "document"
    | "department"
    | "payslip"
    | "profile";
  action: string;
  time: string;
  icon: IconType;
  name?: string;
  department?: string;
  status?: string;
  details?: string;
  period?: string;
  duration?: string;
  count?: string;
}

const getRoleStats = (
  role: UserRole,
  hasPermission: (permission: Permission) => boolean
): StatItem[] => {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return [
        {
          name: "System Users",
          value: "156",
          subtext: "12 Admins • 144 Users",
          icon: FaUserShield,
          href: "/settings/users",
        },
        {
          name: "Monthly Payroll",
          value: "₦152.4M",
          subtext: "March 2024",
          icon: FaMoneyBill,
          href: "/payroll",
        },
        {
          name: "System Health",
          value: "3",
          subtext: "Critical Alerts",
          icon: FaExclamationTriangle,
          href: "/settings/compliance",
        },
        {
          name: "Integration Status",
          value: "Active",
          subtext: "IPPIS • TSA • FIRS",
          icon: FaChartLine,
          href: "/settings/integrations",
        },
      ].filter((stat) => {
        if (
          stat.name === "Monthly Payroll" &&
          !hasPermission(Permission.MANAGE_PAYROLL)
        )
          return false;
        if (
          stat.name === "System Health" &&
          !hasPermission(Permission.MANAGE_ADMINS)
        )
          return false;
        return true;
      });
    case UserRole.ADMIN:
      return [
        {
          name: "Department Staff",
          value: "42",
          subtext: "3 Pending Onboarding",
          icon: FaUserTie,
          href: "/employees",
        },
        {
          name: "Leave Requests",
          value: "5",
          subtext: "Pending Approval",
          icon: FaCalendar,
          href: "/leave",
        },
        {
          name: "Payroll Status",
          value: "Pending",
          subtext: "Due: March 25",
          icon: FaFileInvoiceDollar,
          href: "/payroll",
        },
        {
          name: "Department Tasks",
          value: "4",
          subtext: "2 High Priority",
          icon: FaBriefcase,
          href: "/dashboard",
        },
      ].filter((stat) => {
        if (
          stat.name === "Monthly Payroll" &&
          !hasPermission(Permission.MANAGE_PAYROLL)
        )
          return false;
        if (
          stat.name === "System Health" &&
          !hasPermission(Permission.MANAGE_ADMINS)
        )
          return false;
        return true;
      });
    case UserRole.USER:
      return [
        {
          name: "Leave Balance",
          value: "15",
          subtext: "Days Available",
          icon: FaCalendar,
          href: "/leave",
        },
        {
          name: "Next Payslip",
          value: "25th",
          subtext: "March 2024",
          icon: FaFileAlt,
          href: "/payroll",
        },
        {
          name: "Pending Actions",
          value: "2",
          subtext: "Documents Required",
          icon: FaClock,
          href: "/dashboard",
        },
        {
          name: "Tax Documents",
          value: "Ready",
          subtext: "2023 Available",
          icon: FaFileInvoiceDollar,
          href: "/documents",
        },
      ].filter((stat) => {
        if (
          stat.name === "Monthly Payroll" &&
          !hasPermission(Permission.MANAGE_PAYROLL)
        )
          return false;
        if (
          stat.name === "System Health" &&
          !hasPermission(Permission.MANAGE_ADMINS)
        )
          return false;
        return true;
      });
    default:
      return [];
  }
};

const getRoleActivities = (role: UserRole): ActivityItem[] => {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return [
        {
          id: 1,
          type: "admin",
          action: "New admin account created",
          name: "Oluwaseun Adebayo",
          department: "Finance",
          time: "2 hours ago",
          icon: FaUserShield,
        },
        {
          id: 2,
          type: "integration",
          action: "IPPIS Integration Updated",
          status: "Successful",
          details: "March 2024 Payroll Sync",
          time: "3 hours ago",
          icon: FaSync,
        },
        {
          id: 3,
          type: "compliance",
          action: "Tax Compliance Report Generated",
          period: "Q1 2024",
          status: "Submitted to FIRS",
          time: "1 day ago",
          icon: FaFileAlt,
        },
        {
          id: 4,
          type: "system",
          action: "System Backup Completed",
          details: "All databases synchronized",
          time: "1 day ago",
          icon: FaDatabase,
        },
        {
          id: 5,
          type: "audit",
          action: "Audit Log Review",
          details: "Monthly security audit completed",
          time: "2 days ago",
          icon: FaShieldAlt,
        },
      ];

    case UserRole.ADMIN:
      return [
        {
          id: 1,
          type: "employee",
          action: "New employee onboarding",
          name: "Chioma Okafor",
          department: "Engineering",
          time: "1 hour ago",
          icon: FaUserPlus,
        },
        {
          id: 2,
          type: "leave",
          action: "Leave Request Pending",
          name: "Akin Babatunde",
          duration: "5 days",
          time: "2 hours ago",
          icon: FaCalendar,
        },
        {
          id: 3,
          type: "payroll",
          action: "Payroll Review Required",
          details: "March 2024 Processing",
          time: "3 hours ago",
          icon: FaMoneyBill,
        },
        {
          id: 4,
          type: "document",
          action: "Documents Pending Review",
          count: "3 new submissions",
          time: "1 day ago",
          icon: FaFileAlt,
        },
        {
          id: 5,
          type: "department",
          action: "Department Report Generated",
          period: "February 2024",
          time: "1 day ago",
          icon: FaChartBar,
        },
      ];

    case UserRole.USER:
      return [
        {
          id: 1,
          type: "payslip",
          action: "Payslip Available",
          period: "February 2024",
          time: "1 day ago",
          icon: FaFileInvoiceDollar,
        },
        {
          id: 2,
          type: "leave",
          action: "Leave Request Status",
          status: "Approved",
          details: "Annual Leave - 5 days",
          time: "2 days ago",
          icon: FaCalendarCheck,
        },
        {
          id: 3,
          type: "document",
          action: "Document Action Required",
          details: "Tax Declaration Form Pending",
          time: "2 days ago",
          icon: FaExclamation,
        },
        {
          id: 4,
          type: "profile",
          action: "Profile Update Reminder",
          details: "Update emergency contact",
          time: "3 days ago",
          icon: FaUserEdit,
        },
      ];

    default:
      return [];
  }
};

export default function Dashboard() {
  const { user, hasPermission } = useAuth();

  if (!user) return null;

  const canManagePayroll = hasPermission(Permission.MANAGE_PAYROLL);
  const canViewReports = hasPermission(Permission.VIEW_REPORTS);

  const stats = getRoleStats(user.role as UserRole, hasPermission);
  const activities = getRoleActivities(user.role as UserRole);

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back, {user.firstName}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {user.role === UserRole.SUPER_ADMIN &&
            "Monitor and manage system-wide operations and compliance."}
          {user.role === UserRole.ADMIN &&
            "Manage your department's payroll and personnel activities."}
          {user.role === UserRole.USER &&
            "Access your payroll information and self-service features."}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            to={stat.href}
            className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden
                     transform transition-all duration-300 
                     hover:scale-105 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
          >
            <dt>
              <div
                className="absolute bg-green-600 rounded-md p-3 
                           transition-all duration-300 hover:bg-green-700"
              >
                <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                {stat.name}
              </p>
            </dt>
            <dd className="ml-16 pb-6">
              <p className="text-2xl font-semibold text-gray-900">
                {stat.value}
              </p>
              <p className="text-sm text-gray-500 mt-1">{stat.subtext}</p>
            </dd>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Recent Activity
            </h2>
            {user.role === UserRole.SUPER_ADMIN && (
              <Link
                to="/settings/audit-logs"
                className="text-sm text-green-600 hover:text-green-700"
              >
                View Audit Logs
              </Link>
            )}
          </div>
          <div className="mt-6 flow-root">
            <ul className="-my-5 divide-y divide-gray-200">
              {activities.map((activity) => (
                <li
                  key={activity.id}
                  className="py-5 transform transition-all duration-200 
                           hover:bg-gray-50 hover:-translate-y-0.5 hover:shadow-sm
                           rounded-lg cursor-pointer px-3"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <activity.icon
                        className="h-6 w-6 text-green-600"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.action}
                      </p>
                      <p className="text-sm text-gray-500">
                        {activity.details ||
                          (activity.type === "admin" &&
                            activity.name &&
                            activity.department &&
                            `${activity.name} - ${activity.department}`) ||
                          (activity.type === "integration" &&
                            activity.status &&
                            `${activity.status}${
                              activity.details ? ` - ${activity.details}` : ""
                            }`) ||
                          (activity.type === "leave" &&
                            activity.name &&
                            activity.duration &&
                            `${activity.name} - ${activity.duration}`) ||
                          (activity.type === "payslip" && activity.period) ||
                          ""}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
