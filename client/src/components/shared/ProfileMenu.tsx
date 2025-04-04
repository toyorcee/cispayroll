import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { FaUserCircle, FaUserCog, FaSignOutAlt } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

interface ProfileMenuProps {
  variant?: "header" | "sidebar";
  isOpen?: boolean;
  onToggle?: () => void;
}

export function ProfileMenu({
  variant = "header",
  isOpen,
  onToggle,
}: ProfileMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [isLocalOpen, setIsLocalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on route change
  useEffect(() => {
    if (isLocalOpen) {
      setIsLocalOpen(false);
    }
    if (onToggle && isOpen) {
      onToggle();
    }
  }, [location.pathname]);

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsLocalOpen(false);
        if (onToggle) onToggle();
      }
    }

    if (isLocalOpen || isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isLocalOpen, isOpen, onToggle]);

  // console.log("User data in ProfileMenu:", user);

  // Add this console log near the top of your component to debug
  console.log("User profile image:", user?.profileImage);

  // Get initials from username
  const getInitials = () => {
    if (!user) return "??";
    const firstInitial = user.firstName?.[0] || "";
    const lastInitial = user.lastName?.[0] || "";
    return firstInitial + lastInitial || "??";
  };

  // Get display name
  const getFullName = () => {
    if (!user) return "Loading...";
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    return fullName || "Loading...";
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Successfully signed out!", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          backgroundColor: "#ffffff",
          color: "#1f2937",
          border: "1px solid #e5e7eb",
          borderRadius: "0.5rem",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        },
      });

      setTimeout(() => {
        navigate("/", { replace: true });
      }, 100);
    } catch (error) {
      toast.error("Failed to sign out", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          backgroundColor: "#ffffff",
          color: "#1f2937",
          border: "1px solid #e5e7eb",
          borderRadius: "0.5rem",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        },
      });
    }
  };

  const isMenuOpen = typeof isOpen === "boolean" ? isOpen : isLocalOpen;
  const toggleMenu = onToggle || (() => setIsLocalOpen(!isLocalOpen));

  return (
    <div className="relative" id="profile-menu" ref={menuRef}>
      <button
        onClick={toggleMenu}
        className={`flex items-center gap-3 p-2 hover:bg-green-50 rounded-lg transition-all duration-300 
                   transform hover:-translate-y-1 hover:shadow-lg
                   cursor-pointer focus:outline-none focus:ring-0 ${
                     variant === "sidebar" ? "w-full" : ""
                   }`}
      >
        <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center overflow-hidden">
          {user?.profileImage ? (
            <img
              src={`${import.meta.env.VITE_API_URL}/${user.profileImage.replace(
                /\\/g,
                "/"
              )}`}
              alt={getFullName()}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent) {
                  const existingFallback = parent.querySelector("span");
                  if (existingFallback) {
                    parent.removeChild(existingFallback);
                  }
                  const fallback = document.createElement("span");
                  fallback.className = "text-sm font-medium text-green-600";
                  fallback.textContent = getInitials();
                  parent.appendChild(fallback);
                }
              }}
            />
          ) : (
            <span className="text-sm font-medium text-green-600">
              {getInitials()}
            </span>
          )}
        </div>
        <div className={variant === "sidebar" ? "block" : "hidden sm:block"}>
          <p className="text-sm font-medium text-gray-700 text-left">
            {getFullName()}
          </p>
          <p className="text-xs text-gray-500">{user?.role}</p>
        </div>
      </button>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className={`${
              variant === "sidebar" ? "w-full" : "absolute right-0 w-48"
            } mt-2 bg-white rounded-lg shadow-lg py-1 z-50`}
          >
            <Link
              to="/pms/profile"
              className="w-full flex items-center gap-2 px-4 py-2 text-sm !text-gray-700 hover:!bg-green-50 hover:!text-green-600
                       transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg
                       cursor-pointer focus:outline-none focus:ring-0"
            >
              <FaUserCircle className="h-4 w-4" />
              View Profile
            </Link>

            <Link
              to="/pms/settings"
              className="w-full flex items-center gap-2 px-4 py-2 text-sm !text-gray-700 hover:!bg-green-50 hover:!text-green-600
                       transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg
                       cursor-pointer focus:outline-none focus:ring-0"
            >
              <FaUserCog className="h-4 w-4" />
              Account Settings
            </Link>

            <hr className="my-1" />

            <Link
              to="/"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm !text-red-600 hover:!bg-red-50
                       transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg
                       cursor-pointer focus:outline-none focus:ring-0"
            >
              <FaSignOutAlt className="h-4 w-4" />
              Sign out
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
