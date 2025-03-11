import { UserRole } from "../types/auth";
import {
  FaUserShield,
  FaMoneyBill,
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
  FaCalendar,
  FaFileInvoiceDollar,
  FaBriefcase,
  FaChartLine,
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

export const getRoleStats = (role?: UserRole): StatItem[] => {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return [
        {
          name: "Total Users",
          value: "156",
          subtext: "12 Admins • 144 Users",
          icon: FaUserShield,
          href: "/settings/users",
          color: "blue",
        },
        {
          name: "Monthly Payroll",
          value: "₦152.4M",
          subtext: "March 2024",
          icon: FaMoneyBill,
          href: "/payroll",
          color: "green",
        },
        {
          name: "System Alerts",
          value: "3",
          subtext: "Critical Issues",
          icon: FaExclamationTriangle,
          href: "/settings/system",
          color: "red",
        },
        {
          name: "Performance",
          value: "98.5%",
          subtext: "System Uptime",
          icon: FaChartLine,
          href: "/reports/system",
          color: "yellow",
        },
      ];
    case UserRole.ADMIN:
      return [
        {
          name: "Department Staff",
          value: "42",
          subtext: "3 New This Month",
          icon: FaUserTie,
          href: "/employees",
          color: "blue",
        },
        {
          name: "Leave Requests",
          value: "5",
          subtext: "Pending Approval",
          icon: FaCalendar,
          href: "/employees/leave",
          color: "yellow",
        },
        {
          name: "Payroll Status",
          value: "Active",
          subtext: "Next: March 25",
          icon: FaFileInvoiceDollar,
          href: "/payroll",
          color: "green",
        },
        {
          name: "Tasks",
          value: "8",
          subtext: "Due This Week",
          icon: FaBriefcase,
          href: "/tasks",
          color: "red",
        },
      ];
    case UserRole.USER:
      return [
        {
          name: "My Leave Balance",
          value: "15",
          subtext: "Days Available",
          icon: FaCalendar,
          href: "/my-leave",
          color: "green",
        },
        {
          name: "Next Payslip",
          value: "25th",
          subtext: "March 2024",
          icon: FaFileAlt,
          href: "/my-payslips",
          color: "blue",
        },
        {
          name: "Tasks",
          value: "3",
          subtext: "Pending Actions",
          icon: FaClock,
          href: "/my-tasks",
          color: "yellow",
        },
        {
          name: "Documents",
          value: "2",
          subtext: "Need Review",
          icon: FaFileAlt,
          href: "/my-documents",
          color: "red",
        },
      ];
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

export const payrollData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: [
    {
      label: "Total Payroll (Millions)",
      data: [150, 155, 152, 148, 152, 155],
      borderColor: "rgb(59, 130, 246)",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      tension: 0.4,
    },
  ],
};

export const departmentData = {
  labels: ["Engineering", "Finance", "HR", "Marketing", "Sales"],
  datasets: [
    {
      label: "Employee Count",
      data: [42, 28, 15, 22, 35],
      backgroundColor: [
        "rgba(59, 130, 246, 0.6)",
        "rgba(16, 185, 129, 0.6)",
        "rgba(245, 158, 11, 0.6)",
        "rgba(239, 68, 68, 0.6)",
        "rgba(139, 92, 246, 0.6)",
      ],
      borderColor: [
        "rgb(59, 130, 246)",
        "rgb(16, 185, 129)",
        "rgb(245, 158, 11)",
        "rgb(239, 68, 68)",
        "rgb(139, 92, 246)",
      ],
      borderWidth: 1,
    },
  ],
};