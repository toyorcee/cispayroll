import { createContext, useContext, useState, ReactNode } from "react";
import { UserRole } from "../types/auth";
import { useAuth } from "./AuthContext";
import { Permission } from "../types/auth";
import { NavigationItem } from "../types/navigation";
import {
  ChartBarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  CogIcon,
  UserIcon,
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
        "Profile",
      ];
    }

    // For Admin, check specific permissions
    if (user.role === UserRole.ADMIN) {
      // Employees - check if they have any employee-related permissions
      const employeePermissions = [
        Permission.VIEW_ALL_USERS,
        Permission.MANAGE_DEPARTMENT_USERS,
        Permission.MANAGE_ONBOARDING,
        Permission.VIEW_ONBOARDING,
        Permission.MANAGE_OFFBOARDING,
        Permission.VIEW_OFFBOARDING,
        Permission.APPROVE_OFFBOARDING,
        Permission.REQUEST_LEAVE,
        Permission.VIEW_OWN_LEAVE,
        Permission.CANCEL_OWN_LEAVE,
        Permission.VIEW_TEAM_LEAVE,
        Permission.APPROVE_LEAVE,
      ];

      if (user.permissions.some((p) => employeePermissions.includes(p))) {
        availableMenus.push("Employees");
      }

      // Payroll Management - check if they have any payroll-related permissions
      const payrollPermissions = [
        Permission.VIEW_ALL_PAYROLL,
        Permission.VIEW_DEPARTMENT_PAYROLL,
        Permission.VIEW_OWN_PAYSLIP,
        Permission.VIEW_ALLOWANCES,
        Permission.EDIT_ALLOWANCES,
        Permission.VIEW_DEDUCTIONS,
        Permission.EDIT_DEDUCTIONS,
        Permission.VIEW_OWN_ALLOWANCES,
        Permission.REQUEST_ALLOWANCES,
        Permission.VIEW_OWN_DEDUCTIONS,
        Permission.MANAGE_DEPARTMENT_DEDUCTIONS,
        Permission.VIEW_DEPARTMENT_DEDUCTIONS,
        Permission.MANAGE_DEPARTMENT_ALLOWANCES,
        Permission.VIEW_DEPARTMENT_ALLOWANCES,
        Permission.MANAGE_DEPARTMENT_BONUSES,
        Permission.VIEW_DEPARTMENT_BONUSES,
        Permission.VIEW_BONUSES,
        Permission.MANAGE_BONUSES,
        Permission.CREATE_BONUSES,
        Permission.DELETE_BONUSES,
        Permission.EDIT_BONUSES,
        Permission.CREATE_PAYROLL,
        Permission.EDIT_PAYROLL,
        Permission.GENERATE_PAYSLIP,
        Permission.VIEW_OWN_BONUS,
      ];

      if (user.permissions.some((p) => payrollPermissions.includes(p))) {
        availableMenus.push("Payroll");
      }

      // Reports
      if (
        user.permissions.some((p) =>
          [Permission.VIEW_REPORTS, Permission.VIEW_PAYROLL_REPORTS].includes(p)
        )
      ) {
        availableMenus.push("Reports");
      }

      // Profile
      if (user.permissions.includes(Permission.VIEW_PERSONAL_INFO)) {
        availableMenus.push("Profile");
      }

      // Settings - Add for Admin if they have any settings-related permissions
      const settingsPermissions = [
        Permission.MANAGE_SYSTEM_SETTINGS,
        Permission.MANAGE_DEPARTMENT_SETTINGS,
        Permission.MANAGE_USER_SETTINGS,
        Permission.MANAGE_PAYROLL_SETTINGS,
        Permission.MANAGE_LEAVE_SETTINGS,
        Permission.MANAGE_DOCUMENT_SETTINGS,
        Permission.MANAGE_NOTIFICATION_SETTINGS,
      ];
      if (user.permissions.some((p) => settingsPermissions.includes(p))) {
        availableMenus.push("Settings");
      }
    }

    if (user.role === UserRole.USER) {
      // Check for employee-related permissions
      const userEmployeePermissions = [
        Permission.REQUEST_LEAVE,
        Permission.VIEW_OWN_LEAVE,
        Permission.CANCEL_OWN_LEAVE,
      ];

      if (user.permissions.some((p) => userEmployeePermissions.includes(p))) {
        availableMenus.push("Employees");
      }

      // Check for payroll-related permissions
      const userPayrollPermissions = [
        Permission.VIEW_OWN_PAYSLIP,
        Permission.VIEW_OWN_ALLOWANCES,
        Permission.REQUEST_ALLOWANCES,
        Permission.VIEW_OWN_DEDUCTIONS,
        Permission.VIEW_OWN_BONUS,
      ];

      if (user.permissions.some((p) => userPayrollPermissions.includes(p))) {
        availableMenus.push("Payroll");
      }

      // Profile
      if (user.permissions.includes(Permission.VIEW_PERSONAL_INFO)) {
        availableMenus.push("Profile");
      }

      // Always add Settings menu for all users
      availableMenus.push("Settings");
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
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
    permissions: [Permission.VIEW_DASHBOARD],
  },
  {
    name: "Employees",
    href: "/pms/employees",
    icon: UsersIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
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
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      },
      {
        name: "Offboarding",
        href: "/pms/employees/offboarding",
        permissions: [Permission.MANAGE_OFFBOARDING],
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      },
      {
        name: "Team Leave Management",
        href: "/pms/employees/team-leave",
        permissions: [Permission.VIEW_TEAM_LEAVE, Permission.APPROVE_LEAVE],
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        requireAllPermissions: false,
      },
      {
        name: "My Leave",
        href: "/pms/employees/my-leave",
        permissions: [
          Permission.REQUEST_LEAVE,
          Permission.VIEW_OWN_LEAVE,
          Permission.CANCEL_OWN_LEAVE,
        ],
        roles: [UserRole.ADMIN, UserRole.USER],
        requireAllPermissions: false,
      },
    ],
  },
  {
    name: "Payroll",
    href: "/pms/payroll",
    icon: CurrencyDollarIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
    permissions: [
      // Super Admin
      Permission.VIEW_ALL_PAYROLL,
      // Admin
      Permission.VIEW_DEPARTMENT_PAYROLL,
      Permission.CREATE_PAYROLL,
      Permission.EDIT_PAYROLL,
      Permission.DELETE_PAYROLL,
      Permission.SUBMIT_PAYROLL,
      Permission.VIEW_DEPARTMENT_DEDUCTIONS,
      Permission.VIEW_DEPARTMENT_ALLOWANCES,
      Permission.VIEW_DEPARTMENT_BONUSES,
      // All Users (including Admin)
      Permission.VIEW_OWN_PAYSLIP,
      Permission.VIEW_OWN_ALLOWANCES,
      Permission.REQUEST_ALLOWANCES,
      Permission.VIEW_OWN_DEDUCTIONS,
    ],
    requireAllPermissions: false,
    subItems: [
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
        permissions: [
          Permission.VIEW_ALLOWANCES,
          Permission.EDIT_ALLOWANCES,
          Permission.MANAGE_DEPARTMENT_ALLOWANCES,
          Permission.VIEW_DEPARTMENT_ALLOWANCES,
        ],
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        requireAllPermissions: false,
      },
      {
        name: "Bonuses",
        href: "/pms/payroll/bonuses",
        permissions: [
          Permission.VIEW_BONUSES,
          Permission.MANAGE_BONUSES,
          Permission.MANAGE_DEPARTMENT_BONUSES,
          Permission.VIEW_DEPARTMENT_BONUSES,
          Permission.CREATE_BONUSES,
          Permission.DELETE_BONUSES,
          Permission.EDIT_BONUSES,
        ],
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        requireAllPermissions: false,
      },
      {
        name: "Deductions",
        href: "/pms/payroll/deductions",
        permissions: [
          Permission.VIEW_DEDUCTIONS,
          Permission.EDIT_DEDUCTIONS,
          Permission.MANAGE_DEPARTMENT_DEDUCTIONS,
          Permission.VIEW_DEPARTMENT_DEDUCTIONS,
        ],
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        requireAllPermissions: false,
      },
      {
        name: "Process Payment",
        href: "/pms/payroll/process",
        permissions: [
          Permission.CREATE_PAYROLL,
          Permission.EDIT_PAYROLL,
          Permission.DELETE_PAYROLL,
          Permission.SUBMIT_PAYROLL,
          Permission.VIEW_ALL_PAYROLL,
          Permission.GENERATE_PAYSLIP,
        ],
        roles: [UserRole.SUPER_ADMIN],
      },
      {
        name: "Process Department Payroll",
        href: "/pms/payroll/department-process",
        permissions: [
          Permission.CREATE_PAYROLL,
          Permission.EDIT_PAYROLL,
          Permission.DELETE_PAYROLL,
          Permission.SUBMIT_PAYROLL,
          Permission.VIEW_DEPARTMENT_PAYROLL,
          Permission.GENERATE_PAYSLIP,
        ],
        roles: [UserRole.ADMIN],
      },
      {
        name: "My Payslips",
        href: "/pms/payroll/my-payslips",
        permissions: [Permission.VIEW_OWN_PAYSLIP],
        roles: [UserRole.ADMIN, UserRole.USER],
      },
      {
        name: "My Allowances",
        href: "/pms/payroll/my-allowances",
        permissions: [
          Permission.VIEW_OWN_ALLOWANCES,
          Permission.REQUEST_ALLOWANCES,
        ],
        roles: [UserRole.ADMIN, UserRole.USER],
      },
      {
        name: "My Bonus",
        href: "/pms/payroll/my-bonus",
        permissions: [Permission.VIEW_OWN_BONUS],
        roles: [UserRole.ADMIN, UserRole.USER],
      },
      {
        name: "Processing Summary",
        href: "/pms/payroll/summaries",
        permissions: [Permission.VIEW_PAYROLL_STATS],
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      },
    ],
  },
  // {
  //   name: "Reports",
  //   href: "/pms/reports",
  //   icon: DocumentTextIcon,
  //   roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  //   permissions: [Permission.VIEW_REPORTS, Permission.VIEW_PAYROLL_REPORTS],
  //   requireAllPermissions: false,
  //   subItems: [
  //     {
  //       name: "Payroll Reports",
  //       href: "/pms/reports/payroll",
  //       permissions: [Permission.VIEW_PAYROLL_REPORTS],
  //     },
  //     {
  //       name: "Audit Logs",
  //       href: "/pms/reports/audit",
  //       roles: [UserRole.SUPER_ADMIN],
  //       permissions: [Permission.VIEW_AUDIT_LOGS],
  //     },
  //   ],
  // },
  {
    name: "Settings",
    href: "/pms/settings",
    icon: CogIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    permissions: [],
    requireAllPermissions: false,
    subItems: [
      {
        name: "General Settings",
        href: "/pms/settings",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.MANAGE_SYSTEM_SETTINGS],
      },
      {
        name: "Company Profile",
        href: "/pms/settings/company",
        roles: [UserRole.SUPER_ADMIN],
        permissions: [Permission.MANAGE_COMPANY_PROFILE],
      },
      {
        name: "Integration Settings",
        href: "/pms/settings/integrations",
        roles: [UserRole.SUPER_ADMIN],
        permissions: [Permission.MANAGE_INTEGRATION_SETTINGS],
      },
    ],
  },
  {
    name: "Profile",
    href: "/pms/profile",
    icon: UserIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
    permissions: [Permission.VIEW_PERSONAL_INFO, Permission.EDIT_PERSONAL_INFO],
  },
].map((item) => {
  return item;
});

// {
//   name: "Approvals",
//   href: "/dashboard/approvals",
//   icon: UserPlusIcon,
//   roles: [UserRole.SUPER_ADMIN],
//   permissions: [Permission.MANAGE_APPROVALS],
// },
