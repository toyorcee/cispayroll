import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigation } from "../../context/NavigationContext";
import {
  ChartBarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  CogIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { ProfileMenu } from "./ProfileMenu";

export const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: ChartBarIcon,
  },
  {
    name: "Employees",
    href: "#",
    icon: UsersIcon,
    subItems: [
      { name: "All Employees", href: "/dashboard/employees" },
      { name: "Onboarding", href: "/dashboard/employees/onboarding" },
      { name: "Leave Management", href: "/dashboard/employees/leave" },
    ],
  },
  {
    name: "Payroll",
    href: "#",
    icon: CurrencyDollarIcon,
    subItems: [
      { name: "Process Payroll", href: "/dashboard/payroll" },
      { name: "Salary Structure", href: "/dashboard/payroll/structure" },
      { name: "Deductions", href: "/dashboard/payroll/deductions" },
    ],
  },
  {
    name: "Reports",
    href: "#",
    icon: DocumentTextIcon,
    subItems: [
      { name: "Payroll Reports", href: "/dashboard/reports/payroll" },
      { name: "Employee Reports", href: "/dashboard/reports/employees" },
      { name: "Tax Reports", href: "/dashboard/reports/tax" },
      { name: "Audit Logs", href: "/dashboard/reports/audit" },
    ],
  },
  {
    name: "Settings",
    href: "#",
    icon: CogIcon,
    subItems: [
      { name: "General", href: "/dashboard/settings" },
      { name: "Company Profile", href: "/dashboard/settings/company" },
      { name: "Tax Configuration", href: "/dashboard/settings/tax" },
      { name: "Compliance", href: "/dashboard/settings/compliance" },
      { name: "User Management", href: "/dashboard/settings/users" },
      { name: "Notifications", href: "/dashboard/settings/notifications" },
      { name: "Integrations", href: "/dashboard/settings/integrations" },
    ],
  },
];

export function Sidebar() {
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

  const handleItemClick = (
    e: React.MouseEvent,
    item: (typeof navigation)[0]
  ) => {
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
          {navigation.map((item) => (
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
                      {item.subItems.map((subItem) => (
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
