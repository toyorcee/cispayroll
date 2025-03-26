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
import { FaGavel } from "react-icons/fa6";


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
    if (!user || !user.permissions) {
      return ["Dashboard"];
    }

    // For Super Admin, show ALL main menus (not submenus)
    if (user.role === UserRole.SUPER_ADMIN) {
<<<<<<< HEAD
      return ["Dashboard", "Employees", "Payroll", "Reports", "Settings", "Disciplinary"];
=======
      return ["Dashboard", "Employees", "Payroll", "Reports", "Settings" , "Feedback", "Approvals"];
>>>>>>> 57b374b1b0a961de56f44daa05cca8bc72acdc1a
    }

    // For other roles, check specific permissions
    const availableMenus = ["Dashboard"];

    // Employee menu and its submenus
    if (
      user.permissions.some((p) =>
        [
          Permission.VIEW_ALL_USERS,
          Permission.MANAGE_DEPARTMENT_USERS,
          Permission.VIEW_ONBOARDING,
          Permission.MANAGE_ONBOARDING,
          Permission.VIEW_OFFBOARDING,
          Permission.MANAGE_OFFBOARDING,
        ].includes(p)
      )
    ) {
      availableMenus.push("Employees");
    }

    if (user.permissions.some((p) => p.includes("PAYROLL"))) {
      availableMenus.push("Payroll");
    }

    if (user.permissions.includes(Permission.VIEW_REPORTS)) {
      availableMenus.push("Reports");
    }

    if (user.permissions.includes(Permission.MANAGE_SYSTEM)) {
      availableMenus.push("Settings");
    }
    if (user.permissions.includes(Permission.MANAGE_FEEDBACK)) {
      availableMenus.push("Feedback");
    }

    return availableMenus;
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
  },
  {
    name: "Employees",
    href: "/dashboard/employees",
    icon: UsersIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    permissions: [Permission.VIEW_ALL_USERS],
    subItems: [
      {
        name: "All Employees",
        href: "/dashboard/employees/list",
        permissions: [Permission.VIEW_ALL_USERS],
      },
      {
        name: "Onboarding",
        href: "/dashboard/employees/onboarding",
        permissions: [Permission.MANAGE_ONBOARDING],
      },
      {
        name: "Offboarding",
        href: "/dashboard/employees/offboarding",
        permissions: [Permission.MANAGE_OFFBOARDING],
      },
      {
        name: "Leave Management",
        href: "/dashboard/employees/leave",
        permissions: [Permission.APPROVE_LEAVE, Permission.VIEW_TEAM_LEAVE],
      },
    ],
  },
  {
    name: "Payroll",
    href: "/dashboard/payroll",
    icon: CurrencyDollarIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    permissions: [
      Permission.VIEW_ALL_PAYROLL,
      Permission.VIEW_DEPARTMENT_PAYROLL,
    ],
    subItems: [
      {
        name: "Salary Structure",
        href: "/dashboard/payroll/structure",
        permissions: [Permission.VIEW_SALARY_STRUCTURE],
      },
      {
        name: "Allowances",
        href: "/dashboard/payroll/allowances",
        permissions: [Permission.VIEW_ALLOWANCES, Permission.MANAGE_ALLOWANCES],
      },
      {
        name: "Bonuses",
        href: "/dashboard/payroll/bonuses",
        permissions: [Permission.VIEW_BONUSES, Permission.MANAGE_BONUSES],
      },
      {
        name: "Deductions",
        href: "/dashboard/payroll/deductions",
        permissions: [Permission.VIEW_DEDUCTIONS, Permission.MANAGE_DEDUCTIONS],
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      },
      {
        name: "Process Payroll",
        href: "/dashboard/payroll/process",
        permissions: [Permission.CREATE_PAYROLL, Permission.EDIT_PAYROLL],
      },
    ],
  },
  {
    name: "Reports",
    href: "/dashboard/reports",
    icon: DocumentTextIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    permissions: [
      Permission.VIEW_REPORTS,
      Permission.VIEW_AUDIT_LOGS,
      Permission.VIEW_PAYROLL_REPORTS,
      Permission.VIEW_EMPLOYEE_REPORTS,
      Permission.VIEW_TAX_REPORTS,
    ],
    requireAllPermissions: false,
    subItems: [
      {
        name: "Payroll Reports",
        href: "/dashboard/reports/payroll",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.VIEW_PAYROLL_REPORTS],
        requireAllPermissions: false,
      },
      {
        name: "Employee Reports",
        href: "/dashboard/reports/employees",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.VIEW_EMPLOYEE_REPORTS],
        requireAllPermissions: false,
      },
      {
        name: "Tax Reports",
        href: "/dashboard/reports/tax",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.VIEW_TAX_REPORTS],
        requireAllPermissions: false,
      },
      {
        name: "Audit Logs",
        href: "/dashboard/reports/audit",
        roles: [UserRole.SUPER_ADMIN],
        permissions: [Permission.VIEW_AUDIT_LOGS],
        requireAllPermissions: false,
      },
    ],
  },
  {
    name: "Settings",
    href: "/dashboard/settings/general",
    icon: CogIcon,
    roles: [UserRole.SUPER_ADMIN],
    permissions: [
      Permission.MANAGE_SYSTEM,
      Permission.MANAGE_COMPANY_PROFILE,
      Permission.MANAGE_TAX_CONFIG,
      Permission.MANAGE_COMPLIANCE,
      Permission.MANAGE_NOTIFICATIONS,
      Permission.MANAGE_INTEGRATIONS,
    ],
    requireAllPermissions: false,
    subItems: [
      {
        name: "General Settings",
        href: "/dashboard/settings/general",
        roles: [UserRole.SUPER_ADMIN],
        permissions: [Permission.MANAGE_SYSTEM],
        requireAllPermissions: false,
      },
      {
        name: "Company Profile",
        href: "/dashboard/settings/company",
        roles: [UserRole.SUPER_ADMIN],
        permissions: [Permission.MANAGE_COMPANY_PROFILE],
        requireAllPermissions: false,
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
        requireAllPermissions: false,
      },
      {
        name: "Tax Configuration",
        href: "/dashboard/settings/tax",
        roles: [UserRole.SUPER_ADMIN],
        permissions: [Permission.MANAGE_TAX_CONFIG],
        requireAllPermissions: false,
      },
      {
        name: "Compliance",
        href: "/dashboard/settings/compliance",
        roles: [UserRole.SUPER_ADMIN],
        permissions: [Permission.MANAGE_COMPLIANCE],
        requireAllPermissions: false,
      },
      {
        name: "User Management",
        href: "/dashboard/settings/users",
        roles: [UserRole.SUPER_ADMIN],
        permissions: [
          Permission.CREATE_USER,
          Permission.EDIT_USER,
          Permission.VIEW_ALL_USERS,
        ],
        requireAllPermissions: false,
      },
      {
        name: "Notifications",
        href: "/dashboard/settings/notifications",
        roles: [UserRole.SUPER_ADMIN],
        permissions: [Permission.MANAGE_NOTIFICATIONS],
        requireAllPermissions: false,
      },
      {
        name: "Integrations",
        href: "/dashboard/settings/integrations",
        roles: [UserRole.SUPER_ADMIN],
        permissions: [Permission.MANAGE_INTEGRATIONS],
        requireAllPermissions: false,
      },
    ],
  },
  {
<<<<<<< HEAD
    name: "Disciplinary",
    href: "/dashboard/disciplinary/general",
    icon: FaGavel,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    permissions: [
      Permission.MANAGE_DISCIPLINARY_ACTIONS,
      Permission.VIEW_DISCIPLINARY_RECORDS,
    ],
    requireAllPermissions: false,
  },
].map((item) => {
  console.log(`Menu item ${item.name}:`, {
    roles: item.roles,
    permissions: item.permissions,
  });
  return item;
});
=======
    name: "Feedback",
    href: "/dashboard/feedback",
    icon: DocumentTextIcon,
    roles: [UserRole.SUPER_ADMIN],
    permissions: [Permission.MANAGE_FEEDBACK],
  },
  // {
  //   name: "Approvals",
  //   href: "/dashboard/approvals",
  //   icon: UserPlusIcon,
  //   roles: [UserRole.SUPER_ADMIN],
  //   permissions: [Permission.MANAGE_APPROVALS],
  // },
];
>>>>>>> 57b374b1b0a961de56f44daa05cca8bc72acdc1a
