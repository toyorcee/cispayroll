import { motion } from "framer-motion";
import { IconType } from "react-icons";
import { Link } from "react-router-dom";

interface StatCardProps {
  name: string;
  value: string;
  subtext: string;
  icon: IconType;
  href: string;
  color?: "blue" | "green" | "red" | "yellow";
}

const StatCard = ({
  name,
  value,
  subtext,
  icon: Icon,
  href,
  color = "blue",
}: StatCardProps) => {
  const colorClasses = {
    blue: "border-blue-500 hover:border-blue-600",
    green: "border-green-500 hover:border-green-600",
    red: "border-red-500 hover:border-red-600",
    yellow: "border-yellow-500 hover:border-yellow-600",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, rotateY: 5 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
    >
      <Link to={href}>
        <div
          className={`bg-white p-6 rounded-xl shadow-lg border-l-4 ${colorClasses[color]} 
                        transform transition-all duration-300 hover:shadow-2xl`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-sm font-medium text-gray-600">{name}</h2>
              <div className="mt-2 flex items-baseline">
                <p className="text-3xl font-semibold text-gray-900">{value}</p>
              </div>
              <p className="mt-1 text-sm text-gray-500">{subtext}</p>
            </div>
            <div className={`p-3 rounded-full bg-${color}-100`}>
              <Icon className={`h-6 w-6 text-${color}-600`} />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default StatCard;
