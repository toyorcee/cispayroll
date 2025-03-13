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

// Map icons to menu items
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

  const filteredNavigation = menuItems.filter((item: NavigationItem) => {
    if (item.name === "Employees") {
      console.log("2. Processing Employees menu:");
      console.log("- User role:", user?.role);
      console.log("- Required roles:", item.roles);
      console.log("- Required permissions:", item.permissions);

      const roleCheck = hasRole(UserRole.SUPER_ADMIN);
      console.log("- Is SUPER_ADMIN?", roleCheck);

      if (roleCheck) {
        console.log("- SUPER_ADMIN bypass activated");
        return true;
      }
    }
    return true;
  });

  // Add this before rendering
  const employeesInFiltered = filteredNavigation.find(
    (item) => item.name === "Employees"
  );
  console.log("3. Employees in filtered results:", !!employeesInFiltered);

  const getFilteredChildren = (subItems: NavigationSubItem[] | undefined) => {
    if (!subItems) return [];

    return subItems.filter((subItem: NavigationSubItem) => {
      // For SUPER_ADMIN, show all employee-related items
      if (
        hasRole(UserRole.SUPER_ADMIN) &&
        subItem.href.startsWith("/employees")
      ) {
        return true;
      }

      const hasValidRole =
        !subItem.roles || subItem.roles.some((role) => hasRole(role));

      const hasValidPermission =
        !subItem.permissions ||
        subItem.permissions.some((permission) => hasPermission(permission));

      return hasValidRole && hasValidPermission;
    });
  };

  const handleItemClick = (e: React.MouseEvent, item: NavigationItem) => {
    if (item.subItems) {
      e.preventDefault();
      setOpenSubmenu(openSubmenu === item.name ? null : item.name);
    }
  };

  console.log("5. Sidebar props:", {
    isSidebarOpen,
    location: location.pathname,
    itemCount: filteredNavigation.length,
  });

  // Add debug logging
  useEffect(() => {
    if (user) {
      console.log("Current user role:", user.role);
      console.log("Current user permissions:", user.permissions);
    }
  }, [user]);

  // Add these to your navigation items
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
      permissions: [Permission.MANAGE_ONBOARDING, Permission.VIEW_ONBOARDING],
      requireAllPermissions: false,
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    },
    {
      name: "Offboarding",
      path: "/dashboard/employees/offboarding",
      icon: FaUserMinus,
      permissions: [Permission.MANAGE_OFFBOARDING, Permission.VIEW_OFFBOARDING],
      requireAllPermissions: false,
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    },
    // ... other items
  ];

  const filteredEmployeeItems = employeeItems.filter((item) => {
    if (item.roles && !item.roles.includes(user?.role as UserRole)) {
      return false;
    }
    if (item.permissions) {
      if (item.requireAllPermissions) {
        return item.permissions.every((p) => user?.permissions?.includes(p));
      }
      return item.permissions.some((p) => user?.permissions?.includes(p));
    }
    return true;
  });

  return (
    <aside
      id="sidebar"
      className={`${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:static lg:transform-none h-[calc(100vh-4rem)] top-16`}
    >
      <button
        onClick={() => setIsSidebarOpen(false)}
        className="lg:hidden absolute right-4 top-4 p-2 hover:bg-green-50 rounded-lg text-gray-800 hover:text-green-700 transition-colors"
      >
        <FaTimes className="w-5 h-5" />
      </button>

      <nav className="h-full flex flex-col">
        <div className="flex-1 px-4 py-6 lg:py-4 overflow-y-auto">
          {filteredNavigation.map((item: NavigationItem) => {
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
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50/50">
          <ProfileMenu variant="sidebar" />
        </div>
      </nav>
    </aside>
  );
}
