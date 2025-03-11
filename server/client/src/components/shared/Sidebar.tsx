import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigation } from "../../context/NavigationContext";
import {
  ChartBarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { ProfileMenu } from "./ProfileMenu";
import { useAuth } from "../../context/AuthContext";
import { UserRole, Permission } from "../../types/auth";
import { NavigationItem, NavigationSubItem } from "../../types/navigation";

export const navigation: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: ChartBarIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
  },
  {
    name: "Employees",
    href: "#",
    icon: UsersIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    permissions: [
      Permission.VIEW_ALL_USERS,
      Permission.MANAGE_DEPARTMENT_USERS,
    ],
    subItems: [
      {
        name: "All Employees",
        href: "/dashboard/employees",
        permissions: [Permission.VIEW_ALL_USERS],
      },
      {
        name: "Onboarding",
        href: "/dashboard/employees/onboarding",
        permissions: [Permission.MANAGE_ONBOARDING, Permission.VIEW_ONBOARDING],
      },
      {
        name: "Offboarding",
        href: "/dashboard/employees/offboarding",
        permissions: [
          Permission.MANAGE_OFFBOARDING,
          Permission.VIEW_OFFBOARDING,
        ],
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
    href: "#",
    icon: CurrencyDollarIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    permissions: [Permission.CREATE_PAYROLL, Permission.EDIT_PAYROLL],
    subItems: [
      {
        name: "Process Payroll",
        href: "/dashboard/payroll",
        permissions: [Permission.CREATE_PAYROLL, Permission.GENERATE_PAYSLIP],
      },
      {
        name: "Salary Structure",
        href: "/dashboard/payroll/structure",
        permissions: [Permission.CREATE_PAYROLL, Permission.EDIT_PAYROLL],
      },
      {
        name: "Deductions",
        href: "/dashboard/payroll/deductions",
        permissions: [Permission.CREATE_PAYROLL, Permission.EDIT_PAYROLL],
      },
    ],
  },
  {
    name: "Reports",
    href: "#",
    icon: DocumentTextIcon,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    permissions: [Permission.VIEW_REPORTS],
    subItems: [
      {
        name: "Payroll Reports",
        href: "/dashboard/reports/payroll",
        permissions: [
          Permission.VIEW_DEPARTMENT_PAYROLL,
          Permission.VIEW_REPORTS,
        ],
      },
      {
        name: "Employee Reports",
        href: "/dashboard/reports/employees",
        permissions: [Permission.VIEW_ALL_USERS, Permission.VIEW_REPORTS],
      },
      {
        name: "Tax Reports",
        href: "/dashboard/reports/tax",
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
    href: "#",
    icon: CogIcon,
    roles: [UserRole.SUPER_ADMIN],
    subItems: [
      {
        name: "Department Management",
        href: "/dashboard/settings/departments",
        permissions: [
          Permission.CREATE_DEPARTMENT,
          Permission.EDIT_DEPARTMENT,
          Permission.VIEW_ALL_DEPARTMENTS,
        ],
      },
      {
        name: "Company Profile",
        href: "/dashboard/settings/company",
        roles: [UserRole.SUPER_ADMIN],
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
  // User-specific routes
  {
    name: "My Profile",
    href: "/dashboard/profile",
    icon: UserPlusIcon,
    roles: [UserRole.USER],
    permissions: [Permission.VIEW_PERSONAL_INFO],
  },
  {
    name: "My Leave",
    href: "/dashboard/my-leave",
    icon: ArrowRightOnRectangleIcon,
    roles: [UserRole.USER],
    permissions: [
      Permission.REQUEST_LEAVE,
      Permission.VIEW_OWN_LEAVE,
      Permission.CANCEL_OWN_LEAVE,
    ],
  },
  {
    name: "My Payslips",
    href: "/dashboard/my-payslips",
    icon: DocumentTextIcon,
    roles: [UserRole.USER],
    permissions: [Permission.VIEW_OWN_PAYSLIP],
  },
];

export function Sidebar() {
  const { hasPermission, hasRole } = useAuth();
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const { setActiveMenuText, isSidebarOpen, setIsSidebarOpen } =
    useNavigation();

  useEffect(() => {
    const activeMainItem = navigation.find(
      (item) =>
        item.href === location.pathname ||
        item.subItems?.some((sub) => location.pathname === sub.href)
    );

    if (activeMainItem) {
      setActiveMenuText(activeMainItem.name);
    } else if (location.pathname === "/dashboard") {
      setActiveMenuText("Dashboard");
    }
  }, [location.pathname, setActiveMenuText]);

  const filteredNavigation = navigation.filter((item) => {
    // Check roles first
    if (item.roles && !item.roles.some((role) => hasRole(role))) {
      return false;
    }

    // Then check permissions
    const hasRequiredPermission =
      !item.permissions ||
      item.permissions.some((permission) => hasPermission(permission));

    return hasRequiredPermission;
  });

  const getFilteredSubItems = (subItems: NavigationSubItem[] | undefined) => {
    if (!subItems) return [];

    return subItems.filter((subItem) => {
      // Check roles first
      if (subItem.roles && !subItem.roles.some((role) => hasRole(role))) {
        return false;
      }

      // Then check permissions
      const hasRequiredPermission =
        !subItem.permissions ||
        subItem.permissions.some((permission) => hasPermission(permission));

      return hasRequiredPermission;
    });
  };

  const handleItemClick = (e: React.MouseEvent, item: NavigationItem) => {
    if (item.subItems) {
      e.preventDefault();
      setOpenSubmenu(openSubmenu === item.name ? null : item.name);
    }
  };

  return (
    <aside
      id="sidebar"
      className={`${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:static lg:transform-none h-[calc(100vh-4rem)] top-16`}
    >
      {/* Close button - only show on mobile */}
      <button
        onClick={() => setIsSidebarOpen(false)}
        className="lg:hidden absolute right-4 top-4 p-2 hover:bg-green-50 rounded-lg text-gray-800 hover:text-green-700 transition-colors"
      >
        <FaTimes className="w-5 h-5" />
      </button>

      <nav className="h-full flex flex-col">
        {/* Add padding-top to account for close button */}
        <div className="flex-1 px-4 py-6 lg:py-4 overflow-y-auto">
          {filteredNavigation.map((item) => (
            <div key={item.name} className="mb-2">
              <Link
                to={item.href}
                className={`nav-link group flex items-center px-3 py-3 lg:py-2 text-sm font-medium rounded-md transition-all duration-150 ${
                  location.pathname === item.href
                    ? "active bg-green-50"
                    : "hover:bg-green-50/50"
                }`}
                onClick={(e) => handleItemClick(e, item)}
              >
                {item.icon && (
                  <item.icon
                    aria-hidden="true"
                    className={`h-5 w-5 mr-3 lg:mr-2 transition-colors ${
                      location.pathname === item.href
                        ? "text-green-700"
                        : "text-green-600 group-hover:text-green-700"
                    }`}
                  />
                )}
                <span className="text-current">{item.name}</span>
              </Link>
              {item.subItems && (
                <AnimatePresence>
                  {openSubmenu === item.name && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="pl-8 mt-2 space-y-1"
                    >
                      {getFilteredSubItems(item.subItems).map((subItem) => (
                        <Link
                          key={subItem.name}
                          to={subItem.href}
                          className={`nav-link block px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 ${
                            location.pathname === subItem.href
                              ? "active bg-green-50"
                              : "hover:bg-green-50/50"
                          }`}
                        >
                          <span className="text-current">{subItem.name}</span>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50/50">
          <ProfileMenu variant="sidebar" />
        </div>
      </nav>
    </aside>
  );
}
