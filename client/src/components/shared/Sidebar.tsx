import React from "react";
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
import { menuItems } from "../../context/NavigationContext";
import {
  NavigationItem,
  NavigationSubItem,
  IconType,
} from "../../types/navigation";
import { FaUsers, FaUserPlus, FaUserMinus } from "react-icons/fa";

// Updated icon mapping to include all sections
const iconMap: Record<string, IconType> = {
  Dashboard: ChartBarIcon,
  Employees: UsersIcon,
  Payroll: CurrencyDollarIcon,
  Reports: DocumentTextIcon,
  Settings: CogIcon,
  "My Profile": UserPlusIcon,
  "My Leave": ArrowRightOnRectangleIcon,
  "My Payslips": DocumentTextIcon,
};

export function Sidebar() {
  const { hasPermission, hasRole, user } = useAuth();
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const { setActiveMenuText, isSidebarOpen, setIsSidebarOpen } =
    useNavigation();

  useEffect(() => {
    const activeMainItem = menuItems.find(
      (item) =>
        item.href === location.pathname ||
        item.subItems?.some((sub: NavigationSubItem) =>
          location.pathname.includes(sub.href)
        )
    );

    if (activeMainItem) {
      setActiveMenuText(activeMainItem.name);
    } else if (location.pathname === "/dashboard") {
      setActiveMenuText("Dashboard");
    }
  }, [location.pathname, setActiveMenuText]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (window.innerWidth < 1024) {
      // lg breakpoint
      setIsSidebarOpen(false);
    }
  }, [location.pathname, setIsSidebarOpen]);

  const filteredNavigation = menuItems.filter((item: NavigationItem) => {
    // Super Admin sees everything
    if (hasRole(UserRole.SUPER_ADMIN)) {
      return true;
    }

    // Check roles
    if (item.roles && !item.roles.some((role) => hasRole(role))) {
      return false;
    }

    // Check permissions
    if (item.permissions) {
      return item.permissions.some((permission) => hasPermission(permission));
    }

    return true;
  });

  const getFilteredChildren = (subItems: NavigationSubItem[] | undefined) => {
    if (!subItems) return [];

    return subItems.filter((subItem: NavigationSubItem) => {
      // Super Admin sees all subitems
      if (hasRole(UserRole.SUPER_ADMIN)) {
        return true;
      }

      // Check roles
      if (subItem.roles && !subItem.roles.some((role) => hasRole(role))) {
        return false;
      }

      // Check permissions
      if (subItem.permissions) {
        return subItem.permissions.some((permission) =>
          hasPermission(permission)
        );
      }

      return true;
    });
  };

  const handleItemClick = (e: React.MouseEvent, item: NavigationItem) => {
    if (item.subItems) {
      e.preventDefault();
      setOpenSubmenu(openSubmenu === item.name ? null : item.name);
    }
  };

  // Updated employee items with proper permission checks
  const employeeItems = [
    {
      name: "All Employees",
      path: "/dashboard/employees/list",
      icon: FaUsers,
      permissions: [Permission.VIEW_ALL_USERS],
    },
    {
      name: "Onboarding",
      path: "/dashboard/employees/onboarding",
      icon: FaUserPlus,
      permissions: [Permission.MANAGE_ONBOARDING],
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    },
    {
      name: "Offboarding",
      path: "/dashboard/employees/offboarding",
      icon: FaUserMinus,
      permissions: [Permission.MANAGE_OFFBOARDING],
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    },
    {
      name: "Leave Management",
      path: "/dashboard/employees/leave",
      icon: DocumentTextIcon,
      permissions: [Permission.APPROVE_LEAVE, Permission.VIEW_TEAM_LEAVE],
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    },
  ];

  const filteredEmployeeItems = employeeItems.filter((item) => {
    // Super Admin sees everything
    if (hasRole(UserRole.SUPER_ADMIN)) {
      return true;
    }

    // Check roles
    if (item.roles && !item.roles.some((role) => hasRole(role))) {
      return false;
    }

    // Check permissions
    if (item.permissions) {
      return item.permissions.some((permission) => hasPermission(permission));
    }

    return true;
  });

  const payrollItems = [
    {
      name: "Salary Structure",
      path: "/dashboard/payroll/structure",
      icon: CurrencyDollarIcon,
      permissions: [Permission.VIEW_SALARY_STRUCTURE],
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    },
    {
      name: "Allowances",
      path: "/dashboard/payroll/allowances",
      icon: CurrencyDollarIcon,
      permissions: [Permission.VIEW_ALLOWANCES, Permission.MANAGE_ALLOWANCES],
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    },
    {
      name: "Bonuses",
      path: "/dashboard/payroll/bonuses",
      icon: CurrencyDollarIcon,
      permissions: [Permission.VIEW_BONUSES, Permission.MANAGE_BONUSES],
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    },
    {
      name: "Deductions",
      path: "/dashboard/payroll/deductions",
      icon: CurrencyDollarIcon,
      permissions: [Permission.VIEW_DEDUCTIONS, Permission.MANAGE_DEDUCTIONS],
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    },
    {
      name: "Process Payroll",
      path: "/dashboard/payroll/process",
      icon: CurrencyDollarIcon,
      permissions: [Permission.CREATE_PAYROLL, Permission.EDIT_PAYROLL],
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    },
  ];

  const filteredPayrollItems = payrollItems.filter((item) => {
    // Super Admin sees everything
    if (hasRole(UserRole.SUPER_ADMIN)) {
      return true;
    }

    // Check roles
    if (item.roles && !item.roles.some((role) => hasRole(role))) {
      return false;
    }

    // Check permissions
    if (item.permissions) {
      return item.permissions.some((permission) => hasPermission(permission));
    }

    return true;
  });

  // Close sidebar handler
  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    // Optionally close any open submenus
    setOpenSubmenu(null);
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 transition-opacity lg:hidden z-30"
          onClick={handleCloseSidebar}
        />
      )}

      <aside
        id="sidebar"
        className={`${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 h-[calc(100vh-4rem)] top-16`}
      >
        {/* Close button */}
        <div className="lg:hidden absolute right-2 top-2 p-2">
          <button
            onClick={handleCloseSidebar}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Close sidebar"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <nav className="h-full flex flex-col relative z-10">
          <div className="flex-1 px-4 py-6 lg:py-4 overflow-y-auto">
            {filteredNavigation.map((item: NavigationItem) => {
              // Only render items that the user has permission to see
              const filteredSubItems = getFilteredChildren(item.subItems);

              // Don't render items with no accessible subitems
              if (item.subItems && filteredSubItems.length === 0) {
                return null;
              }

              return (
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
                    {iconMap[item.name] && (
                      <div
                        className={`h-5 w-5 mr-3 lg:mr-2 transition-colors ${
                          location.pathname === item.href
                            ? "text-green-700"
                            : "text-green-600 group-hover:text-green-700"
                        }`}
                      >
                        {React.createElement(iconMap[item.name])}
                      </div>
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
                          {(() => {
                            const filteredSubItems = getFilteredChildren(
                              item.subItems
                            );
                            return filteredSubItems.map(
                              (subItem: NavigationSubItem) => (
                                <Link
                                  key={subItem.name}
                                  to={subItem.href}
                                  className={`nav-link block px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 ${
                                    location.pathname === subItem.href
                                      ? "active bg-green-50"
                                      : "hover:bg-green-50/50"
                                  }`}
                                >
                                  <span className="text-current">
                                    {subItem.name}
                                  </span>
                                </Link>
                              )
                            );
                          })()}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              );
            })}
            {openSubmenu === "Payroll" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="pl-8 mt-2 space-y-1"
              >
                {filteredPayrollItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`nav-link block px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 ${
                      location.pathname === item.path
                        ? "active bg-green-50"
                        : "hover:bg-green-50/50"
                    }`}
                  >
                    <span className="text-current">{item.name}</span>
                  </Link>
                ))}
              </motion.div>
            )}
          </div>
          <div className="p-4 border-t border-gray-200 bg-gray-50/50">
            <ProfileMenu variant="sidebar" />
          </div>
        </nav>
      </aside>
    </>
  );
}
