import { Link } from "react-router-dom";
import {
  FaUsers,
  FaMoneyBill,
  FaClock,
  FaExclamationTriangle,
} from "react-icons/fa";

const stats = [
  { name: "Total Employees", value: "42", icon: FaUsers, href: "/employees" },
  {
    name: "Monthly Payroll",
    value: "₦15.2M",
    icon: FaMoneyBill,
    href: "/payroll",
  },
  {
    name: "Pending Reviews",
    value: "8",
    icon: FaClock,
    href: "/payroll",
  },
  {
    name: "Compliance Alerts",
    value: "3",
    icon: FaExclamationTriangle,
    href: "/settings/compliance",
  },
];

const recentActivities = [
  {
    id: 1,
    type: "employee",
    action: "New employee added",
    name: "Ayodele Adeyemi",
    department: "Engineering",
    time: "2 hours ago",
  },
  {
    id: 2,
    type: "payroll",
    action: "Payroll processed",
    period: "March 2024",
    amount: "₦5.2M",
    time: "1 day ago",
  },
  {
    id: 3,
    type: "leave",
    action: "Leave request approved",
    name: "Chiamaka Okoro",
    duration: "5 days",
    time: "2 days ago",
  },
  {
    id: 4,
    type: "compliance",
    action: "Tax filing completed",
    period: "Q1 2024",
    status: "Success",
    time: "3 days ago",
  },
  {
    id: 5,
    type: "employee",
    action: "New employee added",
    name: "Aisha Bello",
    department: "Marketing",
    time: "4 hours ago",
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            to={stat.href}
            className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden
                     transform transition-all duration-300 
                     hover:scale-105 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
          >
            <dt>
              <div
                className="absolute bg-green-600 rounded-md p-3 
                           transition-all duration-300 hover:bg-green-700"
              >
                <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                {stat.name}
              </p>
            </dt>
            <dd className="ml-16 pb-6 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">
                {stat.value}
              </p>
            </dd>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div
        className="bg-white shadow rounded-lg transform transition-all duration-300 
                    hover:shadow-lg"
      >
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
          <div className="mt-6 flow-root">
            <ul className="-my-5 divide-y divide-gray-200">
              {recentActivities.map((activity) => (
                <li
                  key={activity.id}
                  className="py-5 transform transition-all duration-200 
                             hover:bg-gray-50 hover:-translate-y-0.5 hover:shadow-sm
                             rounded-lg cursor-pointer px-3"
                >
                  <div className="relative focus-within:ring-2 focus-within:ring-green-600">
                    <h3 className="text-sm md:text-base font-semibold text-gray-800">
                      {activity.action}
                    </h3>
                    <p className="mt-1 text-sm md:text-base text-gray-600 line-clamp-2">
                      {activity.type === "employee" &&
                        `${activity.name} - ${activity.department}`}
                      {activity.type === "payroll" &&
                        `Period: ${activity.period} - Amount: ${activity.amount}`}
                      {activity.type === "leave" &&
                        `${activity.name} - ${activity.duration}`}
                      {activity.type === "compliance" &&
                        `${activity.period} - ${activity.status}`}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {activity.time}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6">
            <Link
              to="/reports"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg !bg-green-600 !text-white hover:bg-green-700 active:bg-green-600 
             transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg 
             font-medium whitespace-nowrap w-full focus:outline-none focus:ring-0"
            >
              View All Activity
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
