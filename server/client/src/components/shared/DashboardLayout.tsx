import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { FaBell, FaBars, FaMoneyCheckAlt, FaSearch } from "react-icons/fa";
import { useNavigation } from "../../context/NavigationContext";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { ProfileMenu } from "./ProfileMenu";

export default function DashboardLayout() {
  const { isSidebarOpen, setIsSidebarOpen } = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [setIsSidebarOpen]);

  return (
    <div className="min-h-screen h-screen bg-gray-50 overflow-hidden">
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm h-16 z-50">
        <div className="flex items-center justify-between px-4 h-full max-w-8xl mx-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-green-50 rounded-lg md:hidden"
              aria-label="Toggle sidebar"
            >
              <FaBars className="w-6 h-6 text-green-600" />
            </button>
            <div className="flex items-center gap-2">
              <FaMoneyCheckAlt className="h-8 w-8 text-green-600" />
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="text-xl font-bold text-green-600">
                  PAYROLL
                </span>
                <span className="text-xs text-gray-600">Management System</span>
              </div>
            </div>
          </div>

          {/* Center section with search only - removed active menu text */}
          <div className="hidden md:flex flex-1 items-center justify-center px-8">
            <div className="relative max-w-md w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg
                         bg-gray-50 focus:outline-none focus:ring-1 focus:ring-green-500
                         focus:border-green-500 sm:text-sm transition-all duration-200"
              />
            </div>
          </div>

          {/* Right section with notifications and profile */}
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 hover:bg-green-50 rounded-full">
              <FaSearch className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-green-50 rounded-full relative">
              <FaBell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <ProfileMenu />
          </div>
        </div>
      </header>

      {/* Fixed Sidebar */}
      <div className="fixed top-16 left-0 h-[calc(100vh-4rem)] z-40">
        <Sidebar />
      </div>

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-gray-900/50 lg:hidden z-30"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Scrollable Main Content */}
      <main
        className={`fixed top-16 right-0 bottom-0 ${
          isSidebarOpen ? "left-64" : "left-0"
        } overflow-y-auto transition-all duration-150 ease-in-out bg-gray-50`}
      >
        <div className="container mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
