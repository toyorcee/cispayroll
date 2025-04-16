import { motion } from "framer-motion";
import { IconType } from "react-icons";
import { Link } from "react-router-dom";

interface StatCardProps {
  name: string;
  value: string | number;
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
    blue: "border-blue-500 hover:border-blue-600 bg-blue-50",
    green: "border-green-500 hover:border-green-600 bg-green-50",
    red: "border-red-500 hover:border-red-600 bg-red-50",
    yellow: "border-yellow-500 hover:border-yellow-600 bg-yellow-50",
  };

  const iconColorClasses = {
    blue: "text-blue-600 bg-blue-100",
    green: "text-green-600 bg-green-100",
    red: "text-red-600 bg-red-100",
    yellow: "text-yellow-600 bg-yellow-100",
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
      className="w-full"
    >
      <Link to={href} className="block w-full">
        <div
          className={`p-6 rounded-xl shadow-sm border-l-4 ${colorClasses[color]} flex items-center justify-between w-full h-32`}
        >
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800">{name}</h3>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-600">{subtext}</p>
          </div>
          <div className={`p-3 rounded-full ${iconColorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default StatCard;
