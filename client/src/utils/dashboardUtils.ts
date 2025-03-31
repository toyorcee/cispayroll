import { UserRole } from "../types/auth";
import { FaUsers, FaUserTie, FaBuilding, FaUserClock } from "react-icons/fa";

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
}

export const getRoleSpecificWelcomeMessage = (role?: UserRole): string => {
  const timeOfDay = new Date().getHours();
  const greeting =
    timeOfDay < 12
      ? "Good morning"
      : timeOfDay < 18
      ? "Good afternoon"
      : "Good evening";

  switch (role) {
    case UserRole.SUPER_ADMIN:
      return `${greeting}! Here's your system overview for today.`;
    case UserRole.ADMIN:
      return `${greeting}! Your department's activities await your attention.`;
    case UserRole.USER:
      return `${greeting}! Here's your personal workspace.`;
    default:
      return `${greeting}! Welcome to the dashboard.`;
  }
};

export const getRoleStats = (role?: UserRole, stats?: DashboardStats) => {
  if (!stats) return [];

  const superAdminStats = [
    {
      name: "Total Employees",
      value: stats.employees.total,
      subtext: "Total registered employees",
      icon: FaUsers,
      href: "/employees",
      color: "blue",
    },
    {
      name: "Active Employees",
      value: stats.employees.active,
      subtext: "Currently active employees",
      icon: FaUserTie,
      href: "/employees/active",
      color: "green",
    },
    {
      name: "Pending Employees",
      value: stats.employees.pending,
      subtext: "Awaiting onboarding",
      icon: FaUserClock,
      href: "/employees/pending",
      color: "yellow",
    },
    {
      name: "Departments",
      value: stats.departments.total,
      subtext: `Including ${stats.departments.hodCount} HODs`,
      icon: FaBuilding,
      href: "/departments",
      color: "red",
    },
  ];

  switch (role) {
    case UserRole.SUPER_ADMIN:
      return superAdminStats;
    case UserRole.ADMIN:
      return superAdminStats.slice(0, 3); // Exclude departments for admin
    case UserRole.USER:
      return superAdminStats.slice(0, 2); // Only show total and active for users
    default:
      return [];
  }
};
