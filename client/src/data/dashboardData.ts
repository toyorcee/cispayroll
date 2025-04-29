import { UserRole } from "../types/auth";
import {
  FaUserShield,
  FaMoneyBillWave,
  FaCalendarCheck,
  FaUserPlus,
  FaUserMinus,
  FaFileAlt,
  FaUsers,
  FaBuilding,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaUserTie,
  FaUserFriends,
} from "react-icons/fa";
import { IconType } from "react-icons";

// Type definitions
export type ActivityType =
  | "payroll"
  | "leave"
  | "onboarding"
  | "offboarding"
  | "report"
  | "department"
  | "attendance"
  | "system"
  | "team"
  | "compliance";

export type ActivityStatus =
  | "successful"
  | "approved"
  | "pending"
  | "completed"
  | "failed"
  | "rejected"
  | "announcement";

export interface DashboardStats {
  employees: {
    total: number;
    active: number;
    pending: number;
    byRole: {
      superAdmin: number;
      admin: number;
      user: number;
    };
  };
  departments: {
    total: number;
    hodCount: number;
  };
  departmentSize?: number;
  activeColleagues?: number;
  departmentName?: string;
  teamMembers?: number;
  recentActivities?: number;
  unreadNotifications?: number;
}

export interface UserDashboardStats {
  departmentSize?: number;
  activeColleagues?: number;
  departmentName?: string;
  teamMembers?: number;
  recentActivities?: number;
  unreadNotifications?: number;
}

// Interfaces
export interface StatItem {
  name: string;
  value: string;
  subtext: string;
  icon: IconType;
  href: string;
  color?: "blue" | "green" | "red" | "yellow";
}

export interface ActivityItem {
  id: number;
  type: ActivityType;
  action: string;
  time: string;
  icon: IconType;
  name?: string;
  department?: string;
  status?: ActivityStatus;
  details?: string;
  period?: string;
  duration?: string;
  count?: string;
}

export const getRoleStats = (
  role: UserRole,
  stats: DashboardStats | UserDashboardStats | undefined
): StatItem[] => {
  if (!stats) return [];

  switch (role) {
    case UserRole.SUPER_ADMIN:
      if ("employees" in stats) {
        return [
          {
            name: "Total Users",
            value: stats.employees.total.toString(),
            subtext: `${stats.employees.byRole.admin} Admins • ${stats.employees.byRole.user} Users`,
            icon: FaUserShield,
            href: "/settings/users",
            color: "blue",
          },
          {
            name: "Departments",
            value: stats.departments.total.toString(),
            subtext: `${stats.departments.hodCount} HODs`,
            icon: FaBuilding,
            href: "/departments",
            color: "green",
          },
          {
            name: "Pending Approvals",
            value: stats.employees.pending.toString(),
            subtext: "New Employees",
            icon: FaUserPlus,
            href: "/employees/pending",
            color: "yellow",
          },
          {
            name: "Active Employees",
            value: stats.employees.active.toString(),
            subtext: "Currently Working",
            icon: FaUsers,
            href: "/employees",
            color: "blue",
          },
          {
            name: "Recent Activities",
            value: stats.recentActivities?.toString() || "0",
            subtext: "In the last 24 hours",
            icon: FaClock,
            color: "yellow",
            href: "",
          },
        ];
      }
      return [];

    case UserRole.ADMIN:
      if ("employees" in stats) {
        return [
          {
            name: "Department Staff",
            value: stats.employees.byRole.user.toString(),
            subtext: `${stats.employees.pending} Pending`,
            icon: FaUserTie,
            href: "/employees",
            color: "blue",
          },
          {
            name: "Departments",
            value: stats.departments.total.toString(),
            subtext: `${stats.departments.hodCount} HODs`,
            icon: FaBuilding,
            href: "/departments",
            color: "green",
          },
          {
            name: "Pending Approvals",
            value: stats.employees.pending.toString(),
            subtext: "New Employees",
            icon: FaUserPlus,
            href: "/employees/pending",
            color: "yellow",
          },
          {
            name: "Active Staff",
            value: stats.employees.active.toString(),
            subtext: "Currently Working",
            icon: FaUsers,
            href: "/employees",
            color: "blue",
          },
          {
            name: "Recent Activities",
            value: stats.recentActivities?.toString() || "0",
            subtext: "In the last 24 hours",
            icon: FaClock,
            color: "yellow",
            href: "",
          },
        ];
      }
      return [];

    case UserRole.USER:
      if ("departmentName" in stats) {
        return [
          {
            name: "Active Colleagues",
            value: stats.activeColleagues?.toString() || "0",
            subtext: "Currently Working",
            icon: FaUsers,
            color: "green",
            href: "",
          },
          {
            name: "Recent Activities",
            value: stats.recentActivities?.toString() || "0",
            subtext: "In the last 24 hours",
            icon: FaClock,
            color: "yellow",
            href: "",
          },
          {
            name: "Team Members",
            value: stats.teamMembers?.toString() || "0",
            subtext: "In Your Department",
            icon: FaUserFriends,
            color: "blue",
            href: "",
          },
        ];
      }
      return [];

    default:
      return [];
  }
};

export const getRoleActivities = (role?: UserRole): ActivityItem[] => {
  const allActivities: ActivityItem[] = [
    {
      id: 1,
      type: "payroll",
      action: "Processed monthly payroll",
      time: "2 hours ago",
      icon: FaMoneyBillWave,
      name: "John Doe",
      department: "Engineering",
      status: "successful",
      details: "Processed payroll for 50 employees",
    },
    {
      id: 2,
      type: "leave",
      action: "Leave request approved",
      time: "4 hours ago",
      icon: FaCalendarCheck,
      name: "Jane Smith",
      department: "Marketing",
      status: "approved",
      details: "Approved 2-week vacation request",
    },
    {
      id: 3,
      type: "onboarding",
      action: "New employee onboarded",
      time: "1 day ago",
      icon: FaUserPlus,
      name: "Mike Johnson",
      department: "Sales",
      status: "successful",
      details: "Completed onboarding process",
    },
    {
      id: 4,
      type: "offboarding",
      action: "Employee offboarding completed",
      time: "1 day ago",
      icon: FaUserMinus,
      name: "Sarah Williams",
      department: "HR",
      status: "successful",
      details: "Exit process completed successfully",
    },
    {
      id: 5,
      type: "report",
      action: "Monthly report generated",
      time: "2 days ago",
      icon: FaFileAlt,
      name: "System",
      department: "All Departments",
      status: "successful",
      details: "Generated comprehensive monthly performance report",
    },
    {
      id: 6,
      type: "department",
      action: "Department restructured",
      time: "3 days ago",
      icon: FaBuilding,
      name: "Admin Team",
      department: "Operations",
      status: "successful",
      details: "Updated department hierarchy and roles",
    },
    {
      id: 7,
      type: "attendance",
      action: "Attendance anomaly detected",
      time: "3 days ago",
      icon: FaClock,
      name: "System Alert",
      department: "IT",
      status: "pending",
      details: "Multiple late check-ins detected",
    },
    {
      id: 8,
      type: "system",
      action: "System maintenance",
      time: "4 days ago",
      icon: FaExclamationTriangle,
      name: "System Admin",
      department: "IT",
      status: "successful",
      details: "Completed scheduled system maintenance",
    },
    {
      id: 9,
      type: "payroll",
      action: "Bonus payments processed",
      time: "5 days ago",
      icon: FaMoneyBillWave,
      name: "Finance Team",
      department: "Finance",
      status: "successful",
      details: "Quarterly bonus payments completed",
    },
    {
      id: 10,
      type: "team",
      action: "Team performance review",
      time: "1 week ago",
      icon: FaUsers,
      name: "Management",
      department: "All Departments",
      status: "completed",
      details: "Quarterly team performance assessment completed",
    },
    {
      id: 11,
      type: "compliance",
      action: "Policy update",
      time: "1 week ago",
      icon: FaCheckCircle,
      name: "Legal Team",
      department: "Legal",
      status: "successful",
      details: "Updated workplace safety policies",
    },
    {
      id: 12,
      type: "leave",
      action: "Leave policy updated",
      time: "1 week ago",
      icon: FaCalendarCheck,
      name: "HR Team",
      department: "HR",
      status: "successful",
      details: "Annual leave policy revision completed",
    },
  ];

  if (!role) {
    return allActivities.filter(
      (activity) => activity.status === "announcement"
    );
  }

  switch (role) {
    case UserRole.SUPER_ADMIN:
      return allActivities;

    case UserRole.ADMIN:
      return allActivities.filter(
        (activity) => !["system"].includes(activity.type)
      );

    case UserRole.USER:
      return allActivities.filter(
        (activity) =>
          ["leave", "attendance", "team"].includes(activity.type) ||
          activity.status === "announcement"
      );

    default:
      return allActivities.filter(
        (activity) => activity.status === "announcement"
      );
  }
};

export const departmentPieData = {
  labels: [
    "Engineering",
    "Finance",
    "HR",
    "Marketing",
    "Sales",
    "Operations",
    "Legal",
  ],
  datasets: [
    {
      label: "Department Distribution",
      data: [42, 28, 15, 22, 35, 18, 12],
      backgroundColor: [
        "rgba(59, 130, 246, 0.8)", // Blue
        "rgba(16, 185, 129, 0.8)", // Green
        "rgba(245, 158, 11, 0.8)", // Yellow
        "rgba(239, 68, 68, 0.8)", // Red
        "rgba(139, 92, 246, 0.8)", // Purple
        "rgba(14, 165, 233, 0.8)", // Sky
        "rgba(236, 72, 153, 0.8)", // Pink
      ],
      borderColor: [
        "rgb(59, 130, 246)",
        "rgb(16, 185, 129)",
        "rgb(245, 158, 11)",
        "rgb(239, 68, 68)",
        "rgb(139, 92, 246)",
        "rgb(14, 165, 233)",
        "rgb(236, 72, 153)",
      ],
      borderWidth: 1,
    },
  ],
};

export const payrollData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: [
    {
      label: "Total Payroll (Millions ₦)",
      data: [150.5, 155.2, 152.8, 148.9, 152.4, 155.7],
      borderColor: "rgb(59, 130, 246)",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      tension: 0.4,
    },
    {
      label: "Average Per Employee (Thousands ₦)",
      data: [450, 460, 455, 445, 452, 458],
      borderColor: "rgb(16, 185, 129)",
      backgroundColor: "rgba(16, 185, 129, 0.1)",
      tension: 0.4,
    },
  ],
};

export const departmentData = {
  labels: [
    "Engineering",
    "Finance",
    "HR",
    "Marketing",
    "Sales",
    "Operations",
    "Legal",
  ],
  datasets: [
    {
      label: "Employee Count",
      data: [42, 28, 15, 22, 35, 18, 12],
      backgroundColor: [
        "rgba(59, 130, 246, 0.6)",
        "rgba(16, 185, 129, 0.6)",
        "rgba(245, 158, 11, 0.6)",
        "rgba(239, 68, 68, 0.6)",
        "rgba(139, 92, 246, 0.6)",
        "rgba(14, 165, 233, 0.6)",
        "rgba(236, 72, 153, 0.6)",
      ],
      borderColor: [
        "rgb(59, 130, 246)",
        "rgb(16, 185, 129)",
        "rgb(245, 158, 11)",
        "rgb(239, 68, 68)",
        "rgb(139, 92, 246)",
        "rgb(14, 165, 233)",
        "rgb(236, 72, 153)",
      ],
      borderWidth: 1,
    },
  ],
};
