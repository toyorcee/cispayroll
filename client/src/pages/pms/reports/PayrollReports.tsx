import { useState } from "react";
import { FaFileDownload, FaFilter, FaCalendar } from "react-icons/fa";
import { payrollReports } from "../../../data/reports";
import type { ReportPeriod } from "../../../types/reports";
import { Link } from "react-router-dom";

export default function PayrollReports() {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>("all");

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link
          to="/pms/reports/payroll/generate"
          className="inline-flex items-center px-4 py-2 !bg-green-600 !text-white rounded-lg hover:bg-green-700 
                   transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg
                   animate-bounce-slow cursor-pointer focus:outline-none focus:ring-0"
        >
          <FaFileDownload className="h-5 w-5 mr-2" />
          Generate New Report
        </Link>
      </div>

      {/* Filters */}
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
            onChange={(e) => setSelectedPeriod(e.target.value as ReportPeriod)}
          >
            <option value="all">All Periods</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 md:px-6 py-3 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Report Details
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Type
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Date
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Size
                </th>
                <th className="px-3 md:px-6 py-3 text-right text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Download
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payrollReports.map((report) => (
                <tr
                  key={report.id}
                  className="hover:bg-gray-50 transition-all duration-200 
                           transform hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                >
                  <td className="px-3 md:px-6 py-4">
                    <div className="flex items-center">
                      <FaCalendar className="h-5 w-5 text-green-600 mr-2 hidden sm:block flex-shrink-0" />
                      <div className="text-sm md:text-base font-medium text-gray-900 break-words max-w-xs">
                        {report.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm md:text-base text-gray-500 hidden md:table-cell">
                    {report.type}
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm md:text-base text-gray-500 hidden lg:table-cell">
                    {report.date}
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                    <span
                      className="px-2 inline-flex text-xs md:text-sm leading-5 font-semibold rounded-full 
                               bg-green-100 text-green-800"
                    >
                      {report.status}
                    </span>
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm md:text-base text-gray-500 hidden md:table-cell">
                    {report.size}
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-right text-sm md:text-base font-medium">
                    <button
                      className="text-green-600 hover:text-green-700
                               transition-all duration-200 
                               transform hover:-translate-y-0.5 hover:shadow-sm cursor-pointer
                               focus:outline-none focus:ring-0"
                    >
                      <span className="hidden sm:inline">Download Report</span>
                      <span className="sm:hidden">Download</span>
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
