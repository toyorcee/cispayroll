import { createContext, useContext, useState, ReactNode } from "react";
import { UserRole } from "../types/auth";
import { useAuth } from "./AuthContext";
import { Permission } from "../types/auth";
import { NavigationItem } from "../types/navigation";
import {
  ChartBarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";

type NavigationContextType = {
  activeMenuText: string;
  setActiveMenuText: (text: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  getAvailableMenus: () => string[];
};

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [activeMenuText, setActiveMenuText] = useState("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();

  const getAvailableMenus = () => {
    console.log("=== DEBUG: getAvailableMenus ===");
    console.log("Current user:", user);
    console.log("User role:", user?.role);
    console.log("User permissions:", user?.permissions);

    if (!user || !user.permissions) {
      console.log("No user or permissions found");
      return ["Dashboard"];
    }

    // For Super Admin, show all main menus
    if (user.role === UserRole.SUPER_ADMIN) {
      console.log("User is SUPER_ADMIN, returning all menus");
      return ["Dashboard", "Employees", "Payroll", "Reports", "Settings"];
    }

    // For other roles, check permissions
    if (user.permissions.includes(Permission.VIEW_ALL_USERS)) {
      return ["Employees"];
    }

    if (
      user.permissions.includes(Permission.CREATE_PAYROLL) ||
      user.permissions.includes(Permission.VIEW_DEPARTMENT_PAYROLL)
    ) {
      return ["Payroll"];
    }

    if (user.permissions.includes(Permission.VIEW_REPORTS)) {
      return ["Reports"];
    }

    if (user.permissions.includes(Permission.MANAGE_SYSTEM)) {
      return ["Settings"];
    }

    return ["Dashboard"];
  };

  const setMainMenuOnly = (text: string) => {
    const availableMenus = getAvailableMenus();
    if (availableMenus.includes(text)) {
      setActiveMenuText(text);
    }
  };

  return (
    <NavigationContext.Provider
      value={{
        activeMenuText,
        setActiveMenuText: setMainMenuOnly,
        isSidebarOpen,
        setIsSidebarOpen,
        getAvailableMenus,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}

export const menuItems: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: ChartBarIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
  },
  {
    name: "Employees",
    href: "/dashboard/employees/list",
    icon: UsersIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    permissions: [Permission.VIEW_ALL_USERS],
    subItems: [
      {
        name: "All Employees",
        href: "/dashboard/employees/list",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.VIEW_ALL_USERS],
      },
      {
        name: "Onboarding",
        href: "/dashboard/employees/onboarding",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.MANAGE_ONBOARDING, Permission.VIEW_ONBOARDING],
      },
      {
        name: "Offboarding",
        href: "/dashboard/employees/offboarding",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [
          Permission.MANAGE_OFFBOARDING,
          Permission.VIEW_OFFBOARDING,
        ],
      },
      {
        name: "Leave Management",
        href: "/dashboard/employees/leave",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.APPROVE_LEAVE, Permission.VIEW_TEAM_LEAVE],
      },
    ],
  },
  {
    name: "Payroll",
    href: "/dashboard/payroll",
    icon: CurrencyDollarIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    permissions: [Permission.CREATE_PAYROLL, Permission.EDIT_PAYROLL],
    subItems: [
      {
        name: "Process Payroll",
        href: "/dashboard/payroll/process",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.CREATE_PAYROLL, Permission.GENERATE_PAYSLIP],
      },
      {
        name: "Salary Structure",
        href: "/dashboard/payroll/structure",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.CREATE_PAYROLL, Permission.EDIT_PAYROLL],
      },
      {
        name: "Deductions",
        href: "/dashboard/payroll/deductions",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.CREATE_PAYROLL, Permission.EDIT_PAYROLL],
      },
    ],
  },
  {
    name: "Reports",
    href: "/dashboard/reports",
    icon: DocumentTextIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    permissions: [Permission.VIEW_REPORTS],
    subItems: [
      {
        name: "Payroll Reports",
        href: "/dashboard/reports/payroll",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [
          Permission.VIEW_DEPARTMENT_PAYROLL,
          Permission.VIEW_REPORTS,
        ],
      },
      {
        name: "Employee Reports",
        href: "/dashboard/reports/employees",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.VIEW_ALL_USERS, Permission.VIEW_REPORTS],
      },
      {
        name: "Tax Reports",
        href: "/dashboard/reports/tax",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.VIEW_REPORTS],
      },
      {
        name: "Audit Logs",
        href: "/dashboard/reports/audit",
        roles: [UserRole.SUPER_ADMIN],
        permissions: [Permission.VIEW_REPORTS],
      },
    ],
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: CogIcon,
    roles: [UserRole.SUPER_ADMIN],
    subItems: [
      {
        name: "General Settings",
        href: "/dashboard/settings/general",
        roles: [UserRole.SUPER_ADMIN],
      },
      {
        name: "Company Profile",
        href: "/dashboard/settings/company",
        roles: [UserRole.SUPER_ADMIN],
      },
      {
        name: "Department Management",
        href: "/dashboard/settings/departments",
        roles: [UserRole.SUPER_ADMIN],
        permissions: [
          Permission.CREATE_DEPARTMENT,
          Permission.EDIT_DEPARTMENT,
          Permission.VIEW_ALL_DEPARTMENTS,
        ],
      },
      {
        name: "Tax Configuration",
        href: "/dashboard/settings/tax",
        roles: [UserRole.SUPER_ADMIN],
      },
      {
        name: "Compliance",
        href: "/dashboard/settings/compliance",
        roles: [UserRole.SUPER_ADMIN],
      },
      {
        name: "User Management",
        href: "/dashboard/settings/users",
        roles: [UserRole.SUPER_ADMIN],
        permissions: [Permission.CREATE_USER, Permission.EDIT_USER],
      },
      {
        name: "Notifications",
        href: "/dashboard/settings/notifications",
        roles: [UserRole.SUPER_ADMIN],
      },
      {
        name: "Integrations",
        href: "/dashboard/settings/integrations",
        roles: [UserRole.SUPER_ADMIN],
      },
    ],
  },
].map((item) => {
  console.log(`Menu item ${item.name}:`, {
    roles: item.roles,
    permissions: item.permissions,
  });
  return item;
});
