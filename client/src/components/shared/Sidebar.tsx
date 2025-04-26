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
  CalendarIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { ProfileMenu } from "./ProfileMenu";
import { useAuth } from "../../context/AuthContext";
import { UserRole } from "../../types/auth";
import { menuItems } from "../../context/NavigationContext";
import {
  NavigationItem,
  NavigationSubItem,
  IconType,
} from "../../types/navigation";
import { FaGavel } from "react-icons/fa6";

const iconMap: Record<string, IconType> = {
  Dashboard: ChartBarIcon,
  Employees: UsersIcon,
  Payroll: CurrencyDollarIcon,
  Reports: DocumentTextIcon,
  Settings: CogIcon,
  Profile: UserCircleIcon,
  "Leave Management": CalendarIcon,
  Disciplinary: FaGavel,
  Feedback: DocumentTextIcon,
  "My Profile": UserPlusIcon,
  "My Leave": ArrowRightOnRectangleIcon,
  "My Payslips": DocumentTextIcon,
};

export function Sidebar() {
  const { hasPermission, hasRole } = useAuth();
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const { setActiveMenuText, getAvailableMenus } = useNavigation();

  // Get the list of available menus from the NavigationContext
  const availableMenus = getAvailableMenus();

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
    } else if (location.pathname === "/pms/dashboard") {
      setActiveMenuText("Dashboard");
    }
  }, [location.pathname, setActiveMenuText]);

  const filteredNavigation = menuItems.filter((item: NavigationItem) => {
    // Check if the menu is in the available menus list
    if (availableMenus.includes(item.name)) {
      return true;
    }

    return false;
  });

  const getFilteredChildren = (subItems: NavigationSubItem[] | undefined) => {
    if (!subItems) return [];

    return subItems.filter((subItem: NavigationSubItem) => {
      // For submenu items, we still need to check permissions directly
      // since they're not included in the availableMenus list
      if (hasRole(UserRole.SUPER_ADMIN)) {
        // Hide personal views for super admin
        if (
          subItem.name === "My Allowances" ||
          subItem.name === "My Deductions" ||
          subItem.name === "My Bonus" ||
          subItem.name === "My Payslips"
        ) {
          return false;
        }
        return true;
      }

      // For non-SUPER_ADMIN users, check roles and permissions
      if (subItem.roles && !subItem.roles.some((role) => hasRole(role))) {
        return false;
      }

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

  return (
    <aside className="w-64 bg-white border-r border-gray-200 shadow-lg h-[calc(100vh-4rem)]">
      <nav className="h-full flex flex-col">
        <div className="flex-1 px-2 py-4 overflow-y-auto">
          {filteredNavigation.map((item: NavigationItem) => {
            // Only render items that the user has permission to see
            const filteredSubItems = getFilteredChildren(item.subItems);

            // Don't render items with no accessible subitems
            if (item.subItems && filteredSubItems.length === 0) {
              return null;
            }

            return (
              <div key={item.name} className="mb-1">
                <Link
                  to={item.href}
                  className={`nav-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-150 ${
                    location.pathname === item.href
                      ? "active bg-green-50 text-green-700"
                      : "hover:bg-green-50/50 text-gray-700 hover:text-green-700"
                  }`}
                  onClick={(e) => handleItemClick(e, item)}
                >
                  {iconMap[item.name] && (
                    <div
                      className={`h-5 w-5 mr-3 transition-colors ${
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
                        className="pl-6 mt-1 space-y-1"
                      >
                        {filteredSubItems.map((subItem: NavigationSubItem) => (
                          <Link
                            key={subItem.name}
                            to={subItem.href}
                            className={`nav-link block px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 ${
                              location.pathname === subItem.href
                                ? "active bg-green-50 text-green-700"
                                : "hover:bg-green-50/50 text-gray-700 hover:text-green-700"
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
