import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import {
  FaMoneyCheckAlt,
  FaUserPlus,
  FaExchangeAlt,
  // FaIdCard,
  // FaChartLine,
  FaUserMinus,
  // FaGraduationCap,
  // FaClock,
  // FaChartBar,
  // FaExclamationTriangle,
  // FaUserCog,
  // FaCheckDouble,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { Permission } from "../types/auth";

interface ModuleItem {
  title: string;
  description: string;
  path: string;
  icon: React.ReactElement;
  isReady: boolean;
  requiredPermissions?: Permission[];
  requiredRoles?: string[];
}

const allModules: ModuleItem[] = [
  {
    title: "Personnel Onboarding",
    description:
      "Streamline new hire processes with digital forms and workflows",
    icon: <FaUserPlus className="w-full h-full text-green-600" />,
    path: "/pms/employees/onboarding",
    isReady: true,
    requiredPermissions: [Permission.MANAGE_ONBOARDING],
    requiredRoles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    title: "Payroll & Benefits",
    description:
      "Manage salaries, deductions, and employee benefits seamlessly",
    icon: <FaMoneyCheckAlt className="w-full h-full text-green-600" />,
    path: "/pms/dashboard",
    isReady: true,
    requiredPermissions: [Permission.VIEW_DASHBOARD],
    requiredRoles: ["SUPER_ADMIN", "ADMIN", "USER"],
  },
  {
    title: "Offboarding",
    description: "Manage exit processes and final settlements efficiently",
    icon: <FaUserMinus className="w-full h-full text-green-600" />,
    path: "/pms/employees/offboarding",
    isReady: true,
    requiredPermissions: [Permission.MANAGE_OFFBOARDING],
    requiredRoles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    title: "Transfer Management",
    description: "Handle employee transfers and track departmental changes",
    icon: <FaExchangeAlt className="w-full h-full text-green-600" />,
    path: "/pms/employees/transfers",
    isReady: false,
    requiredPermissions: [],
    requiredRoles: ["SUPER_ADMIN", "ADMIN"],
  },
  // {
  //   title: "ID System",
  //   description: "Secure personnel identification and verification portal",
  //   icon: <FaIdCard className="w-full h-full text-green-600" />,
  //   path: "/pms/employees/identification",
  //   isReady: false,
  // },
  // {
  //   title: "Performance",
  //   description: "Track goals, feedback, and employee development",
  //   icon: <FaChartLine className="w-full h-full text-green-600" />,
  //   path: "/pms/employees/performance",
  //   isReady: false,
  // },
  // {
  //   title: "Skills & Competency",
  //   description: "Map and develop workforce capabilities",
  //   icon: <FaGraduationCap className="w-full h-full text-green-600" />,
  //   path: "/pms/employees/skills",
  //   isReady: false,
  // },
  // {
  //   title: "Time & Attendance",
  //   description: "Monitor work hours, shifts, and leave management",
  //   icon: <FaClock className="w-full h-full text-green-600" />,
  //   path: "/pms/employees/attendance",
  //   isReady: false,
  // },
  // {
  //   title: "Reports & Feedback",
  //   description: "Generate insights and collect employee input",
  //   icon: <FaChartBar className="w-full h-full text-green-600" />,
  //   path: "/pms/reports",
  //   isReady: true,
  // },
  // {
  //   title: "Disciplinary",
  //   description: "Handle incidents and maintain policy compliance",
  //   icon: <FaExclamationTriangle className="w-full h-full text-green-600" />,
  //   path: "/pms/disciplinary/general",
  //   isReady: true,
  // },
  // {
  //   title: "Self-Service",
  //   description: "Employee portal for profile and request management",
  //   icon: <FaUserCog className="w-full h-full text-green-600" />,
  //   path: "/pms/profile",
  //   isReady: false,
  // },
  // {
  //   title: "Approvals",
  //   description: "Multi-level approval workflows and tracking",
  //   icon: <FaCheckDouble className="w-full h-full text-green-600" />,
  //   path: "/pms/approvals",
  //   isReady: false,
  // },
];

function ModuleSelectorLanding() {
  const navigate = useNavigate();
  const { user, hasPermission, hasRole } = useAuth();
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [direction, setDirection] = React.useState(0);

  // Filter modules based on user permissions and roles
  const modules = React.useMemo(() => {
    if (!user) return [];

    return allModules.filter((module) => {
      // Check if user has required role
      if (module.requiredRoles && module.requiredRoles.length > 0) {
        const hasRequiredRole = module.requiredRoles.some((role) =>
          hasRole(role as any)
        );
        if (!hasRequiredRole) return false;
      }

      // Check if user has required permissions
      if (module.requiredPermissions && module.requiredPermissions.length > 0) {
        const hasRequiredPermission = module.requiredPermissions.some(
          (permission) => hasPermission(permission)
        );
        if (!hasRequiredPermission) return false;
      }

      return true;
    });
  }, [user, hasPermission, hasRole]);

  // Reset current index if it's out of bounds after filtering
  React.useEffect(() => {
    if (currentIndex >= modules.length && modules.length > 0) {
      setCurrentIndex(0);
    }
  }, [modules.length, currentIndex]);

  const getVisibleModules = () => {
    const visibleIndexes = [];
    for (let i = -2; i <= 2; i++) {
      const index = (currentIndex + i + modules.length) % modules.length;
      visibleIndexes.push({ index, offset: i });
    }
    return visibleIndexes;
  };

  const navigateSlide = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prev) => {
      const nextIndex = prev + newDirection;
      if (nextIndex < 0) return modules.length - 1;
      if (nextIndex >= modules.length) return 0;
      return nextIndex;
    });
  };

  const handleModuleNavigation = (module: ModuleItem) => {
    if (module.isReady) {
      navigate(module.path);
    } else {
      navigate(`/coming-soon/${encodeURIComponent(module.title)}`);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.5,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.5,
    }),
  };

  return (
    <div className="h-screen w-full bg-white flex flex-col items-center justify-center overflow-hidden">
      <h1 className="text-3xl font-bold text-gray-800 mb-10">
        CHOOSE A MODULE
      </h1>

      <div className="relative w-full max-w-5xl flex items-center justify-center">
        <button
          onClick={() => navigateSlide(-1)}
          className="absolute left-0 z-30 p-3 rounded-full bg-white shadow-lg"
        >
          <ChevronLeftIcon className="h-6 w-6 text-green-600" />
        </button>

        <div className="relative flex items-center justify-center w-full h-[500px] overflow-hidden">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            {getVisibleModules().map(({ index, offset }) => {
              const module = modules[index];
              const xOffset = offset * 320;
              const zIndex = 20 - Math.abs(offset);
              const opacity = offset === 0 ? 1 : 0.5;
              const scale = offset === 0 ? 1 : 0.9;

              return (
                <motion.div
                  key={`${module.title}-${offset}`}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate={{
                    x: xOffset,
                    scale,
                    opacity,
                    zIndex,
                  }}
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 },
                    scale: { duration: 0.2 },
                  }}
                  className={`absolute w-[350px] h-[450px] bg-white 
                    shadow-xl rounded-2xl p-6 flex flex-col items-center 
                    justify-center border border-gray-100
                    ${offset === 0 ? "ring-2 ring-green-500" : ""}`}
                >
                  <div
                    className="w-32 h-32 mb-6 rounded-full bg-gray-100 
                    flex items-center justify-center"
                  >
                    {module.icon}
                  </div>
                  <h2 className="text-2xl font-semibold text-green-600 mb-3">
                    {module.title}
                  </h2>
                  <p className="text-base text-gray-600 text-center mb-8">
                    {module.description}
                  </p>
                  <button
                    onClick={() => handleModuleNavigation(module)}
                    className="w-full max-w-[200px] py-3 rounded-lg
                    bg-green-600 text-white text-base font-medium 
                    hover:bg-green-700 transition-colors"
                  >
                    {module.isReady ? "Enter" : "Coming Soon"}
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <button
          onClick={() => navigateSlide(1)}
          className="absolute right-0 z-30 p-3 rounded-full bg-white shadow-lg"
        >
          <ChevronRightIcon className="h-6 w-6 text-green-600" />
        </button>
      </div>

      <footer className="absolute bottom-4 text-center">
        <div className="text-base font-medium text-green-600">
          Powered by Century Information Systems
        </div>
        <div className="text-xs text-gray-500">
          All rights Reserved • Version 1.0
        </div>
      </footer>
    </div>
  );
}

export default ModuleSelectorLanding;
