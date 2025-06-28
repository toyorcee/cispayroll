import { motion } from "framer-motion";
import { IconType } from "react-icons";
import { Link } from "react-router-dom";
import React from "react";

interface StatCardProps {
  name: string;
  value: React.ReactNode;
  subtext: string;
  icon: IconType;
  href: string;
  color?: "blue" | "green" | "red" | "yellow" | "purple";
  customGradient?: string;
}

const StatCard = ({
  name,
  value,
  subtext,
  icon: Icon,
  href,
  color = "blue",
  customGradient,
}: StatCardProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // const colorClasses = {
  //   blue: "border-blue-500 hover:border-blue-600 bg-blue-50",
  //   green: "border-green-500 hover:border-green-600 bg-green-50",
  //   red: "border-red-500 hover:border-red-600 bg-red-50",
  //   yellow: "border-yellow-500 hover:border-yellow-600 bg-yellow-50",
  //   purple:
  //     "border-purple-500 hover:border-pink-600 bg-gradient-to-br from-purple-100 via-pink-100 to-pink-200",
  // };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // const iconColorClasses = {
  //   blue: "text-blue-600 bg-blue-100",
  //   green: "text-green-600 bg-green-100",
  //   red: "text-red-600 bg-red-100",
  //   yellow: "text-yellow-600 bg-yellow-100",
  //   purple: "text-purple-600 bg-purple-100",
  // };

  return (
    <motion.div
      whileHover={{ scale: 1.04, rotateY: 6 }}
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 18,
      }}
      className="w-full"
    >
      <Link to={href} className="block w-full h-full">
        <div
          className={`relative p-7 rounded-2xl shadow-xl border-0 ${
            customGradient
              ? `bg-gradient-to-br ${customGradient}`
              : `bg-gradient-to-br from-white via-${color}-50 to-${color}-100 hover:from-${color}-100 hover:to-white`
          } transition-all duration-300 w-full h-36 group overflow-hidden flex flex-col justify-between`}
        >
          <div className="flex flex-col items-start z-10 pt-1 pr-2">
            <h3 className="text-base font-semibold text-gray-700 mb-1 opacity-90 tracking-wide whitespace-nowrap truncate w-40 sm:w-48 md:w-56 lg:w-64 xl:w-72">
              {name}
            </h3>
            <motion.div
              className="text-4xl font-extrabold text-gray-900 mb-1 drop-shadow-lg"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              {value}
            </motion.div>
            <p className="text-sm text-gray-500 opacity-80 whitespace-nowrap truncate w-40 sm:w-48 md:w-56 lg:w-64 xl:w-72">
              {subtext}
            </p>
          </div>
          <motion.div
            className={`absolute top-5 right-6 p-4 rounded-full ${
              color === "purple"
                ? "bg-gradient-to-br from-purple-500 to-pink-600"
                : `bg-gradient-to-br from-${color}-400 to-${color}-600`
            } shadow-lg z-0 group-hover:scale-110 transition-transform duration-300`}
            initial={{ rotate: -10, scale: 0.95 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 180 }}
          >
            <Icon className="w-8 h-8 text-white drop-shadow" />
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
};

export default StatCard;
