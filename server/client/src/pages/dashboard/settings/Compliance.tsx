import { useState } from "react";
import {
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaClipboardCheck,
} from "react-icons/fa";
import {
  complianceItems,
  complianceStats,
  complianceSettings,
} from "../../../data/settings";

const statusColors = {
  Upcoming: "bg-yellow-100 text-yellow-800",
  Pending: "bg-orange-100 text-orange-800",
  Completed: "bg-green-100 text-green-800",
  Overdue: "bg-red-100 text-red-800",
} as const;

export default function Compliance() {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const filteredItems =
    selectedStatus === "all"
      ? complianceItems
      : complianceItems.filter(
          (item) => item.status.toLowerCase() === selectedStatus.toLowerCase()
        );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg transition-all duration-200 hover:shadow-md">
          <div className="p-4 md:p-5">
            <div className="flex items-center">
              <FaCheckCircle className="h-5 w-5 md:h-6 md:w-6 text-green-400" />
              <div className="ml-4 md:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs md:text-sm font-medium text-gray-500 truncate">
                    Compliant Items
                  </dt>
                  <dd className="text-base md:text-lg font-medium text-gray-900">
                    {complianceStats.compliant}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg transition-all duration-200 hover:shadow-md">
          <div className="p-4 md:p-5">
            <div className="flex items-center">
              <FaClock className="h-5 w-5 md:h-6 md:w-6 text-yellow-400" />
              <div className="ml-4 md:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs md:text-sm font-medium text-gray-500 truncate">
                    Pending Items
                  </dt>
                  <dd className="text-base md:text-lg font-medium text-gray-900">
                    {complianceStats.pending}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg transition-all duration-200 hover:shadow-md">
          <div className="p-4 md:p-5">
            <div className="flex items-center">
              <FaExclamationTriangle className="h-5 w-5 md:h-6 md:w-6 text-red-400" />
              <div className="ml-4 md:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs md:text-sm font-medium text-gray-500 truncate">
                    Overdue Items
                  </dt>
                  <dd className="text-base md:text-lg font-medium text-gray-900">
                    {complianceStats.overdue}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg transition-all duration-200 hover:shadow-md">
          <div className="p-4 md:p-5">
            <div className="flex items-center">
              <FaClipboardCheck className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
              <div className="ml-4 md:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs md:text-sm font-medium text-gray-500 truncate">
                    Total Requirements
                  </dt>
                  <dd className="text-base md:text-lg font-medium text-gray-900">
                    {complianceStats.total}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg transition-all duration-200 hover:shadow-md">
        <div className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-base md:text-lg font-medium text-gray-900">
              Compliance Requirements
            </h2>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full sm:w-48 pl-3 pr-10 py-2 text-sm !bg-green-600 !text-white 
                       rounded-lg focus:outline-none focus:ring-0
                       transition-colors duration-200 cursor-pointer 
                       hover:!bg-green-700"
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requirement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Frequency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Authority
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.frequency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.nextDue}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          statusColors[item.status as keyof typeof statusColors]
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.authority}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg transition-all duration-200 hover:shadow-md">
        <div className="p-4 md:p-6">
          <h2 className="text-base md:text-lg font-medium text-gray-900 mb-4">
            Reminder Settings
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Email Notifications
                </h3>
                <p className="text-sm text-gray-500">
                  Receive reminders for upcoming compliance deadlines
                </p>
              </div>
              <div className="flex items-center">
                <select
                  defaultValue={complianceSettings.emailNotificationDays}
                  className="block w-32 pl-3 pr-10 py-2 text-sm !bg-green-600 !text-white 
                           rounded-lg focus:outline-none focus:ring-0
                           transition-colors duration-200 cursor-pointer 
                           hover:!bg-green-700"
                >
                  <option>7 days</option>
                  <option>14 days</option>
                  <option>30 days</option>
                </select>
                <span className="ml-2 text-sm text-gray-500">before due</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Dashboard Alerts
                </h3>
                <p className="text-sm text-gray-500">
                  Show compliance alerts on dashboard
                </p>
              </div>
              <div className="flex items-center">
                <select
                  defaultValue={complianceSettings.dashboardAlerts}
                  className="block w-32 pl-3 pr-10 py-2 text-sm !bg-green-600 !text-white 
                           rounded-lg focus:outline-none focus:ring-0
                           transition-colors duration-200 cursor-pointer 
                           hover:!bg-green-700"
                >
                  <option>Always</option>
                  <option>When due</option>
                  <option>Never</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
