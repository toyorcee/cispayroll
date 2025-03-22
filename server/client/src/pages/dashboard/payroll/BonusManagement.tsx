import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaPlus, FaEdit, FaClock, FaTrophy, FaChartLine } from "react-icons/fa";
import { toast } from "react-toastify";
import { employeeService } from "../../../services/employeeService";

interface Bonus {
  id: string;
  employee: string;
  type: BonusType;
  amount: number;
  description?: string;
  paymentDate: Date;
  approvalStatus: "pending" | "approved" | "rejected";
  department?: string;
  taxable: boolean;
}

// Add bonus type options
const bonusTypeOptions = [
  { value: "performance", label: "Performance Bonus" },
  { value: "thirteenth_month", label: "13th Month" },
  { value: "special", label: "Special Bonus" },
  { value: "achievement", label: "Achievement Bonus" },
  { value: "retention", label: "Retention Bonus" },
  { value: "project", label: "Project Bonus" },
];

export default function BonusManagement() {
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("all");

  useEffect(() => {
    fetchBonuses();
  }, []);

  const fetchBonuses = async () => {
    try {
      const data = await employeeService.getBonuses();
      setBonuses(data);
    } catch (error) {
      toast.error("Failed to fetch bonuses");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <FaTrophy className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Total Bonuses
              </h3>
              <p className="text-3xl font-bold text-green-600 mt-2">
                ₦
                {bonuses
                  .reduce((acc, bonus) => acc + bonus.amount, 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>
        {/* Add more stat cards */}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <h2 className="text-xl font-semibold text-gray-800">
              Bonus & Overtime Management
            </h2>
            <div className="flex space-x-4">
              <select
                className="rounded-lg border-gray-300 focus:border-green-500 focus:ring-green-500"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="performance">Performance</option>
                <option value="thirteenthMonth">13th Month</option>
                <option value="other">Other</option>
              </select>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700
                         transition-all duration-300 flex items-center space-x-2"
              >
                <FaPlus />
                <span>Add Bonus</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bonus Cards */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bonuses.map((bonus) => (
            <motion.div
              key={bonus.id}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-lg shadow-sm border p-6 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {bonus.employeeName}
                  </h3>
                  <p className="text-sm text-gray-500">{bonus.department}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    bonus.status === "approved"
                      ? "bg-green-100 text-green-800"
                      : bonus.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {bonus.status}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="text-xl font-bold text-green-600">
                    ₦{bonus.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="text-sm font-medium text-gray-800">
                    {bonus.type}
                  </p>
                </div>
              </div>

              <div className="flex items-center text-sm text-gray-500">
                <FaClock className="mr-2" />
                <span>{new Date(bonus.date).toLocaleDateString()}</span>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button className="text-green-600 hover:text-green-900">
                  <FaEdit />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
