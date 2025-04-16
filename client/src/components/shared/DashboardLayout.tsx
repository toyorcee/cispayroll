import { useEffect, useRef, createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { FaBars, FaMoneyCheckAlt } from "react-icons/fa";
import { useNavigation } from "../../context/NavigationContext";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { ProfileMenu } from "./PayrollMenu";
import {
  NotificationBell,
  NotificationBellRef,
} from "../notifications/NotificationBell";

interface NotificationContextType {
  checkForNewNotifications: () => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType>({
  checkForNewNotifications: async () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export default function DashboardLayout() {
  const { isSidebarOpen, setIsSidebarOpen } = useNavigation();
  const notificationBellRef = useRef<NotificationBellRef>(null);
  const navigate = useNavigate();

  // Function to check for new notifications
  const checkForNewNotifications = async () => {
    if (notificationBellRef.current) {
      await notificationBellRef.current.checkForNewNotifications();
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [setIsSidebarOpen]);

  return (
    <NotificationContext.Provider value={{ checkForNewNotifications }}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
          <div className="w-full px-0">
            <div className="flex justify-between h-16">
              {/* Left section with menu button and logo */}
              <div className="flex items-center">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-0 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500 ml-0"
                >
                  <FaBars className="h-6 w-6" />
                </button>
                <div
                  className="ml-2 flex-shrink-0 flex items-center cursor-pointer hover:bg-gray-100 rounded-md px-2 py-1 transition-colors"
                  onClick={() => navigate("/home")}
                >
                  <FaMoneyCheckAlt className="h-8 w-8 text-green-600" />
                  <span className="ml-2 text-xl font-bold text-gray-900">
                    Payroll
                  </span>
                </div>
              </div>

              {/* Right section with notifications and profile */}
              <div className="flex items-center gap-4 mr-2">
                <NotificationBell ref={notificationBellRef} />
                <ProfileMenu />
              </div>
            </div>
          </div>
        </header>

        {/* Fixed Sidebar */}
        <div className="fixed top-16 left-0 h-[calc(100vh-4rem)] z-40 shadow-lg">
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="h-full"
              >
                <Sidebar />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main content */}
        <main
          className={`pt-16 transition-all duration-300 ${
            isSidebarOpen ? "lg:pl-64" : ""
          }`}
        >
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </NotificationContext.Provider>
  );
}
