import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import {
  FaMoneyCheckAlt,
  FaUserPlus,
  FaExchangeAlt,
  FaIdCard,
  FaChartLine,
  FaUserMinus,
  FaClock,
  FaChartBar,
  FaExclamationTriangle,
  FaUserCog,
  FaCheckDouble,
  FaGraduationCap,
} from "react-icons/fa";

interface ModuleItem {
  title: string;
  description: string;
  path: string;
  isComponent?: boolean;
  icon: string | React.ReactElement;
}

const modules: ModuleItem[] = [
  {
    title: "Payroll & Benefits",
    description:
      "Manage salaries, deductions, and employee benefits seamlessly",
    icon: <FaMoneyCheckAlt className="w-full h-full text-green-600" />,
    path: "/dashboard",
    isComponent: true,
  },
  {
    title: "Personnel Onboarding",
    description:
      "Streamline new hire processes with digital forms and workflows",
    icon: <FaUserPlus className="w-full h-full text-green-600" />,
    path: "/dashboard/employees/onboarding",
    isComponent: true,
  },
  {
    title: "Transfer Management",
    description: "Handle employee transfers and track departmental changes",
    icon: <FaExchangeAlt className="w-full h-full text-green-600" />,
    path: "/dashboard/employees/transfers",
    isComponent: true,
  },
  {
    title: "ID System",
    description: "Secure personnel identification and verification portal",
    icon: <FaIdCard className="w-full h-full text-green-600" />,
    path: "/dashboard/employees/identification",
    isComponent: true,
  },
  {
    title: "Performance",
    description: "Track goals, feedback, and employee development",
    icon: <FaChartLine className="w-full h-full text-green-600" />,
    path: "/dashboard/employees/performance",
    isComponent: true,
  },
  {
    title: "Offboarding",
    description: "Manage exit processes and final settlements efficiently",
    icon: <FaUserMinus className="w-full h-full text-green-600" />,
    path: "/dashboard/employees/offboarding",
    isComponent: true,
  },
  {
    title: "Skills & Competency",
    description: "Map and develop workforce capabilities",
    icon: <FaGraduationCap className="w-full h-full text-green-600" />,
    path: "/dashboard/employees/skills",
    isComponent: true,
  },
  {
    title: "Time & Attendance",
    description: "Monitor work hours, shifts, and leave management",
    icon: <FaClock className="w-full h-full text-green-600" />,
    path: "/dashboard/employees/attendance",
    isComponent: true,
  },
  {
    title: "Reports & Feedback",
    description: "Generate insights and collect employee input",
    icon: <FaChartBar className="w-full h-full text-green-600" />,
    path: "/dashboard/reports",
    isComponent: true,
  },
  {
    title: "Disciplinary",
    description: "Handle incidents and maintain policy compliance",
    icon: <FaExclamationTriangle className="w-full h-full text-green-600" />,
    path: "/dashboard/employees/disciplinary",
    isComponent: true,
  },
  {
    title: "Self-Service",
    description: "Employee portal for profile and request management",
    icon: <FaUserCog className="w-full h-full text-green-600" />,
    path: "/dashboard/profile",
    isComponent: true,
  },
  {
    title: "Approvals",
    description: "Multi-level approval workflows and tracking",
    icon: <FaCheckDouble className="w-full h-full text-green-600" />,
    path: "/dashboard/approvals",
    isComponent: true,
  },
];

function Landing() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = React.useState(1);
  const [direction, setDirection] = React.useState(0);

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
    <div className="h-screen w-full bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex flex-col overflow-hidden">
      <div className="h-full w-full max-w-[1600px] mx-auto flex flex-col items-center px-4 py-6 md:py-8 lg:py-10">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-800 mb-6 md:mb-8 lg:mb-10 relative inline-flex flex-col items-center">
          CHOOSE A MODULE
          <span className="mt-2 h-0.5 w-16 bg-green-600/60 rounded-full"></span>
        </h1>

        <div className="relative w-full flex-1 flex items-center justify-center">
          <button
            onClick={() => navigateSlide(-1)}
            className="absolute left-2 md:left-8 lg:left-20 z-30 p-2 md:p-3 rounded-full bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 hover:bg-gray-50 group"
          >
            <ChevronLeftIcon className="h-5 w-5 md:h-6 md:w-6 text-green-600 group-hover:text-green-700" />
          </button>

          <div className="relative flex items-center justify-center w-full h-[calc(100vh-220px)] md:h-[calc(100vh-240px)] lg:h-[calc(100vh-260px)] overflow-hidden">
            <AnimatePresence
              initial={false}
              custom={direction}
              mode="popLayout"
            >
              {getVisibleModules().map(({ index, offset }) => {
                const module = modules[index];
                const xOffset = offset * (window.innerWidth < 768 ? 260 : 320);
                const zIndex = 20 - Math.abs(offset);
                const opacity = offset === 0 ? 1 : 0.65;
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
                    style={{
                      position: "absolute",
                      boxShadow:
                        offset === 0
                          ? "0 4px 20px rgba(0, 0, 0, 0.1)"
                          : "0 2px 10px rgba(0, 0, 0, 0.05)",
                    }}
                    className={`w-[260px] md:w-[300px] h-[min(340px,60vh)] md:h-[min(380px,65vh)] lg:h-[min(400px,70vh)] 
                              bg-white/90 backdrop-blur-xl shadow-2xl rounded-xl p-6 md:p-8 
                              flex flex-col items-center justify-center transform
                              ${
                                offset === 0 ? "ring-1 ring-green-500/30" : ""
                              }`}
                  >
                    <div
                      className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 mb-4 md:mb-6 
                                  rounded-full bg-gray-50/80 flex items-center justify-center p-5"
                    >
                      {module.isComponent ? (
                        module.icon
                      ) : (
                        <img
                          src={module.icon as string}
                          alt={module.title}
                          className="w-full h-full object-contain"
                          style={{
                            filter:
                              "brightness(0) saturate(100%) invert(48%) sepia(82%) saturate(1095%) hue-rotate(121deg) brightness(97%) contrast(101%)",
                          }}
                        />
                      )}
                    </div>
                    <h2 className="text-xl md:text-2xl font-semibold text-green-600 mb-2 md:mb-3">
                      {module.title}
                    </h2>
                    <p className="text-sm md:text-base text-gray-600 text-center mb-6 md:mb-8">
                      {module.description}
                    </p>
                    <button
                      onClick={() => navigate(module.path)}
                      className="w-full flex justify-center py-2 md:py-2.5 px-4 rounded-lg
                               bg-green-600 text-white text-sm md:text-base font-medium 
                               hover:bg-green-700 focus:outline-none focus:ring-2 
                               focus:ring-green-500 focus:ring-offset-2 
                               transition-colors max-w-[160px] md:max-w-[180px]"
                    >
                      Enter
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <button
            onClick={() => navigateSlide(1)}
            className="absolute right-2 md:right-8 lg:right-20 z-30 p-2 md:p-3 rounded-full bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 hover:bg-gray-50 group"
          >
            <ChevronRightIcon className="h-5 w-5 md:h-6 md:w-6 text-green-600 group-hover:text-green-700" />
          </button>
        </div>

        <footer className="w-full text-center space-y-0.5 py-4">
          <div className="text-sm md:text-base font-medium text-green-600/90">
            Powered by Century Information Systems
          </div>
          <div className="text-xs text-gray-500">
            All rights Reserved • Version 1.0
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Landing;
