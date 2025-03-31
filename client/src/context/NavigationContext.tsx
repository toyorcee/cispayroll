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
      return [];
    }

    // Check for dashboard access first
    if (!user.permissions.includes(Permission.VIEW_DASHBOARD)) {
      return [];
    }

    const availableMenus = ["Dashboard"];

    // For Super Admin, show ALL main menus (not submenus)
    if (user.role === UserRole.SUPER_ADMIN) {
      return [
        "Dashboard",
        "Employees",
        "Payroll",
        "Reports",
        "Settings",
        "Disciplinary",
        "Leave",
        "Profile",
        "Feedback",
      ];
    }

    // For Admin, check specific permissions
    if (user.role === UserRole.ADMIN) {
      // Employee Management
      if (
        user.permissions.some((p) =>
          [
            Permission.VIEW_ALL_USERS,
            Permission.MANAGE_DEPARTMENT_USERS,
            Permission.MANAGE_ONBOARDING,
            Permission.VIEW_ONBOARDING,
            Permission.MANAGE_OFFBOARDING,
            Permission.VIEW_OFFBOARDING,
          ].includes(p)
        )
      ) {
        availableMenus.push("Employees");
      }

      // Payroll Management
      if (
        user.permissions.some((p) =>
          [
            Permission.VIEW_ALL_PAYROLL,
            Permission.VIEW_DEPARTMENT_PAYROLL,
            Permission.CREATE_PAYROLL,
            Permission.EDIT_PAYROLL,
            Permission.VIEW_SALARY_STRUCTURE,
            Permission.EDIT_SALARY_STRUCTURE,
            Permission.VIEW_ALLOWANCES,
            Permission.EDIT_ALLOWANCES,
            Permission.VIEW_DEDUCTIONS,
            Permission.EDIT_DEDUCTIONS,
          ].includes(p)
        )
      ) {
        availableMenus.push("Payroll");
      }

      // Reports
      if (
        user.permissions.some((p) =>
          [
            Permission.VIEW_REPORTS,
            Permission.VIEW_PAYROLL_REPORTS,
            Permission.VIEW_EMPLOYEE_REPORTS,
            Permission.VIEW_TAX_REPORTS,
          ].includes(p)
        )
      ) {
        availableMenus.push("Reports");
      }

      // Disciplinary
      if (
        user.permissions.some((p) =>
          [
            Permission.MANAGE_DISCIPLINARY_ACTIONS,
            Permission.VIEW_DISCIPLINARY_RECORDS,
          ].includes(p)
        )
      ) {
        availableMenus.push("Disciplinary");
      }

      // Leave Management
      if (
        user.permissions.some((p) =>
          [
            Permission.APPROVE_LEAVE,
            Permission.VIEW_TEAM_LEAVE,
            Permission.REQUEST_LEAVE,
            Permission.VIEW_OWN_LEAVE,
            Permission.CANCEL_OWN_LEAVE,
          ].includes(p)
        )
      ) {
        availableMenus.push("Leave");
      }

      // Profile
      if (user.permissions.includes(Permission.VIEW_PERSONAL_INFO)) {
        availableMenus.push("Profile");
      }

      // Feedback
      if (user.permissions.includes(Permission.MANAGE_FEEDBACK)) {
        availableMenus.push("Feedback");
      }
    }

    // For User, only show basic menus
    if (user.role === UserRole.USER) {
      // Payroll Section
      if (
        user.permissions.some((p) =>
          [
            Permission.VIEW_OWN_PAYSLIP,
            Permission.VIEW_OWN_ALLOWANCES,
            Permission.REQUEST_ALLOWANCES,
            Permission.VIEW_OWN_DEDUCTIONS,
          ].includes(p)
        )
      ) {
        availableMenus.push("Payroll");
      }

      // Leave Management
      if (
        user.permissions.some((p) =>
          [
            Permission.REQUEST_LEAVE,
            Permission.VIEW_OWN_LEAVE,
            Permission.CANCEL_OWN_LEAVE,
          ].includes(p)
        )
      ) {
        availableMenus.push("Leave");
      }

      // Profile
      if (user.permissions.includes(Permission.VIEW_PERSONAL_INFO)) {
        availableMenus.push("Profile");
      }

      // Feedback
      if (user.permissions.includes(Permission.MANAGE_FEEDBACK)) {
        availableMenus.push("Feedback");
      }
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
    href: "/pms/dashboard",
    icon: ChartBarIcon,
  },
  {
    name: "Employees",
    href: "/pms/employees",
    icon: UsersIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    permissions: [Permission.VIEW_ALL_USERS],
    subItems: [
      {
        name: "All Employees",
        href: "/pms/employees/list",
        permissions: [Permission.VIEW_ALL_USERS],
      },
      {
        name: "Onboarding",
        href: "/pms/employees/onboarding",
        permissions: [Permission.MANAGE_ONBOARDING],
      },
      {
        name: "Offboarding",
        href: "/pms/employees/offboarding",
        permissions: [Permission.MANAGE_OFFBOARDING],
      },
      {
        name: "Leave Management",
        href: "/pms/employees/leave",
        permissions: [Permission.APPROVE_LEAVE, Permission.VIEW_TEAM_LEAVE],
      },
    ],
  },
  {
    name: "Payroll",
    href: "/pms/payroll",
    icon: CurrencyDollarIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
    permissions: [
      Permission.VIEW_ALL_PAYROLL,
      Permission.VIEW_DEPARTMENT_PAYROLL,
      Permission.VIEW_OWN_PAYSLIP,
      Permission.VIEW_OWN_ALLOWANCES,
      Permission.REQUEST_ALLOWANCES,
      Permission.VIEW_OWN_DEDUCTIONS,
    ],
    requireAllPermissions: false,
    subItems: [
      // Admin-only items
      {
        name: "Salary Structure",
        href: "/pms/payroll/structure",
        permissions: [
          Permission.VIEW_SALARY_STRUCTURE,
          Permission.EDIT_SALARY_STRUCTURE,
        ],
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      },
      {
        name: "Allowances",
        href: "/pms/payroll/allowances",
        permissions: [Permission.VIEW_ALLOWANCES, Permission.EDIT_ALLOWANCES],
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      },
      {
        name: "Bonuses",
        href: "/pms/payroll/bonuses",
        permissions: [Permission.VIEW_BONUSES, Permission.MANAGE_BONUSES],
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      },
      {
        name: "Deductions",
        href: "/pms/payroll/deductions",
        permissions: [Permission.VIEW_DEDUCTIONS, Permission.EDIT_DEDUCTIONS],
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      },
      {
        name: "Process Payroll",
        href: "/pms/payroll/process",
        permissions: [Permission.CREATE_PAYROLL, Permission.EDIT_PAYROLL],
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      },
      // User-accessible items
      {
        name: "My Payslips",
        href: "/pms/payroll/my-payslips",
        permissions: [Permission.VIEW_OWN_PAYSLIP],
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
      },
      {
        name: "My Allowances",
        href: "/pms/payroll/my-allowances",
        permissions: [
          Permission.VIEW_OWN_ALLOWANCES,
          Permission.REQUEST_ALLOWANCES,
        ],
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
      },
      {
        name: "My Deductions",
        href: "/pms/payroll/my-deductions",
        permissions: [Permission.VIEW_OWN_DEDUCTIONS],
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
      },
    ],
  },
  {
    name: "Reports",
    href: "/pms/reports",
    icon: DocumentTextIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    permissions: [
      Permission.VIEW_REPORTS,
      Permission.VIEW_PAYROLL_REPORTS,
      Permission.VIEW_EMPLOYEE_REPORTS,
      Permission.VIEW_TAX_REPORTS,
    ],
    requireAllPermissions: false,
    subItems: [
      {
        name: "Payroll Reports",
        href: "/pms/reports/payroll",
        permissions: [Permission.VIEW_PAYROLL_REPORTS],
      },
      {
        name: "Employee Reports",
        href: "/pms/reports/employees",
        permissions: [Permission.VIEW_EMPLOYEE_REPORTS],
      },
      {
        name: "Tax Reports",
        href: "/pms/reports/tax",
        permissions: [Permission.VIEW_TAX_REPORTS],
      },
      {
        name: "Audit Logs",
        href: "/pms/reports/audit",
        roles: [UserRole.SUPER_ADMIN],
        permissions: [Permission.VIEW_AUDIT_LOGS],
      },
    ],
  },
  {
    name: "Settings",
    href: "/pms/settings/general",
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
        href: "/pms/settings/general",
        permissions: [Permission.MANAGE_SYSTEM],
      },
      {
        name: "Company Profile",
        href: "/pms/settings/company",
        permissions: [Permission.MANAGE_COMPANY_PROFILE],
      },
      {
        name: "Department Management",
        href: "/pms/settings/departments",
        permissions: [
          Permission.CREATE_DEPARTMENT,
          Permission.EDIT_DEPARTMENT,
          Permission.DELETE_DEPARTMENT,
          Permission.VIEW_ALL_DEPARTMENTS,
        ],
      },
      {
        name: "Tax Configuration",
        href: "/pms/settings/tax",
        permissions: [Permission.MANAGE_TAX_CONFIG],
      },
      {
        name: "Compliance",
        href: "/pms/settings/compliance",
        permissions: [Permission.MANAGE_COMPLIANCE],
      },
      {
        name: "User Management",
        href: "/pms/settings/users",
        permissions: [
          Permission.CREATE_USER,
          Permission.EDIT_USER,
          Permission.VIEW_ALL_USERS,
        ],
      },
      {
        name: "Notifications",
        href: "/pms/settings/notifications",
        permissions: [Permission.MANAGE_NOTIFICATIONS],
      },
      {
        name: "Integrations",
        href: "/pms/settings/integrations",
        permissions: [Permission.MANAGE_INTEGRATIONS],
      },
    ],
  },
  {
    name: "Disciplinary",
    href: "/pms/disciplinary",
    icon: FaGavel,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    permissions: [
      Permission.MANAGE_DISCIPLINARY_ACTIONS,
      Permission.VIEW_DISCIPLINARY_RECORDS,
    ],
    requireAllPermissions: false,
  },
  {
    name: "Leave",
    href: "/pms/leave",
    icon: DocumentTextIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
    permissions: [
      Permission.REQUEST_LEAVE,
      Permission.VIEW_OWN_LEAVE,
      Permission.CANCEL_OWN_LEAVE,
      Permission.APPROVE_LEAVE,
      Permission.VIEW_TEAM_LEAVE,
    ],
    requireAllPermissions: false,
  },
  {
    name: "Profile",
    href: "/pms/profile",
    icon: DocumentTextIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
    permissions: [Permission.VIEW_PERSONAL_INFO],
    requireAllPermissions: true,
  },
  {
    name: "Feedback",
    href: "/pms/feedback",
    icon: DocumentTextIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
    permissions: [Permission.MANAGE_FEEDBACK],
    requireAllPermissions: true,
  },
].map((item) => {
  console.log(`Menu item ${item.name}:`, {
    roles: item.roles,
    permissions: item.permissions,
  });
  return item;
});

// {
//   name: "Approvals",
//   href: "/dashboard/approvals",
//   icon: UserPlusIcon,
//   roles: [UserRole.SUPER_ADMIN],
//   permissions: [Permission.MANAGE_APPROVALS],
// },
