import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUsers,
  FaUserPlus,
  FaUserMinus,
  FaUserClock,
  FaUserCog,
  FaChartBar,
} from "react-icons/fa";

const EmployeeDashboard: React.FC = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: "All Employees",
      description: "View and manage all employees",
      icon: <FaUsers className="w-6 h-6" />,
      path: "/employees/list",
      color: "bg-blue-500",
    },
    {
      title: "Onboarding",
      description: "Manage new employee onboarding",
      icon: <FaUserPlus className="w-6 h-6" />,
      path: "/employees/onboarding",
      color: "bg-green-500",
    },
    {
      title: "Offboarding",
      description: "Handle employee exit processes",
      icon: <FaUserMinus className="w-6 h-6" />,
      path: "/employees/offboarding",
      color: "bg-red-500",
    },
    {
      title: "Leave Management",
      description: "Manage employee leave requests",
      icon: <FaUserClock className="w-6 h-6" />,
      path: "/employees/leave",
      color: "bg-yellow-500",
    },
    {
      title: "Employee Settings",
      description: "Configure employee-related settings",
      icon: <FaUserCog className="w-6 h-6" />,
      path: "/employees/settings",
      color: "bg-purple-500",
    },
    {
      title: "Reports",
      description: "View employee-related reports",
      icon: <FaChartBar className="w-6 h-6" />,
      path: "/employees/reports",
      color: "bg-indigo-500",
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Employee Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickActions.map((action) => (
          <div
            key={action.title}
            className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(action.path)}
          >
            <div
              className={`${action.color} w-12 h-12 rounded-full flex items-center justify-center text-white mb-4`}
            >
              {action.icon}
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              {action.title}
            </h2>
            <p className="text-gray-600">{action.description}</p>
          </div>
        ))}
      </div>

      {/* Add more dashboard content here */}
    </div>
  );
};

export default EmployeeDashboard;
