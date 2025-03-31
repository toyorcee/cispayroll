import { useState } from "react";
import { FaFileDownload, FaFilter, FaClock } from "react-icons/fa";
import { auditLogs, formatDateTime } from "../../../data/audit";
import type { AuditPeriod } from "../../../types/audit";
import { Link } from "react-router-dom";

const statusColors = {
  Success: "bg-green-100 text-green-800",
  Failed: "bg-red-100 text-red-800",
  Warning: "bg-yellow-100 text-yellow-800",
};

export default function AuditLogs() {
  const [selectedPeriod, setSelectedPeriod] = useState<AuditPeriod>("all");

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link
          to="/dashboard/reports/audit/export"
          className="inline-flex items-center px-4 py-2 !bg-green-600 !text-white rounded-lg hover:bg-green-700 
                   transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg
                   animate-bounce-slow cursor-pointer focus:outline-none focus:ring-0"
        >
          <FaFileDownload className="h-5 w-5 mr-2" />
          Export Logs
        </Link>
      </div>

      <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4 items-center">
        <div className="flex items-center">
          <FaFilter className="h-4 w-4 text-green-600 mr-2" />
          <select
            className="text-sm md:text-base border-gray-300 rounded-lg shadow-sm 
                     !bg-green-600 !text-white px-3 py-1.5 
                     hover:!bg-green-700 transition-all duration-200
                     transform hover:-translate-y-0.5 hover:shadow-md
                     focus:outline-none focus:ring-0 cursor-pointer"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as AuditPeriod)}
          >
            <option value="all">All Periods</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 md:px-6 py-3 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Activity Details
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Module
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Date & Time
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 md:px-6 py-3 text-right text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">
                  View
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-gray-50 transition-all duration-200 
                           transform hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                >
                  <td className="px-3 md:px-6 py-4">
                    <div className="flex items-center">
                      <FaClock className="h-5 w-5 text-green-600 mr-2 hidden sm:block flex-shrink-0" />
                      <div>
                        <div className="text-sm md:text-base font-medium text-gray-900">
                          {log.action}
                        </div>
                        <div className="text-xs md:text-sm text-gray-500 hidden sm:block break-words max-w-xs">
                          {log.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm md:text-base text-gray-500 hidden md:table-cell">
                    {log.module}
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm md:text-base text-gray-900">
                      {log.performedBy}
                    </div>
                    <div className="text-xs md:text-sm text-gray-500 hidden sm:block">
                      {log.ipAddress}
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm md:text-base text-gray-500 hidden lg:table-cell">
                    {formatDateTime(log.timestamp)}
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs md:text-sm leading-5 font-semibold rounded-full
                               ${statusColors[log.status]}`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-right text-sm md:text-base font-medium">
                    <button
                      className="text-green-600 hover:text-green-700
                               transition-all duration-200 
                               transform hover:-translate-y-0.5 hover:shadow-sm cursor-pointer
                               focus:outline-none focus:ring-0"
                    >
                      <span className="hidden sm:inline">View Details</span>
                      <span className="sm:hidden">View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
