import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { UserRole } from "../../../types/auth";
import {
  FaFilter,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
} from "react-icons/fa";
import { LeaveRequest, LeaveType, LeaveStatus } from "../../../types/employee";
import { employees } from "../../../data/employees";
import { Link } from "react-router-dom";

const leaveRequests: LeaveRequest[] = [
  {
    id: "LR001",
    employeeId: "EMP001",
    employee: employees[0],
    type: "annual",
    startDate: new Date("2024-04-10"),
    endDate: new Date("2024-04-15"),
    status: "pending",
    submittedAt: new Date("2024-03-30"),
    reason: "Family vacation",
  },
  {
    id: "LR002",
    employeeId: "EMP002",
    employee: employees[1],
    type: "sick",
    startDate: new Date("2024-04-05"),
    endDate: new Date("2024-04-07"),
    status: "approved",
    submittedAt: new Date("2024-03-29"),
    approvedBy: "Aisha Ibrahim",
    reason: "Medical appointment",
  },
  {
    id: "LR003",
    employeeId: "EMP003",
    employee: employees[2],
    type: "annual",
    startDate: new Date("2024-04-20"),
    endDate: new Date("2024-04-25"),
    status: "rejected",
    submittedAt: new Date("2024-03-28"),
    rejectedBy: "Aisha Ibrahim",
    reason: "Team building retreat",
  },
];

const statusColors: Record<LeaveStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const leaveTypeLabels: Record<LeaveType, string> = {
  annual: "Annual Leave",
  sick: "Sick Leave",
  maternity: "Maternity Leave",
  unpaid: "Unpaid Leave",
};

export default function LeaveManagement() {
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<LeaveStatus | "all">(
    "all"
  );

  const getFilteredRequests = () => {
    let filtered = leaveRequests;

    // Role-based filtering
    if (user?.role === UserRole.USER) {
      filtered = leaveRequests.filter(
        (request) => request.employeeId === user.id
      );
    } else if (user?.role === UserRole.ADMIN) {
      filtered = leaveRequests.filter(
        (request) => request.employee.department === user.department
      );
    }
    // SUPER_ADMIN sees all requests

    // Status filtering
    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (request) => request.status === selectedStatus
      );
    }

    return filtered;
  };

  const canManageRequests = () => {
    return [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(
      user?.role as UserRole
    );
  };

  const getPageTitle = () => {
    switch (user?.role) {
      case UserRole.SUPER_ADMIN:
        return "All Leave Requests";
      case UserRole.ADMIN:
        return "Department Leave Requests";
      default:
        return "My Leave Requests";
    }
  };

  const calculateDuration = (start: Date, end: Date) => {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days`;
  };

  const filteredRequests = getFilteredRequests();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">
          {getPageTitle()}
        </h1>
        <Link
          to="/dashboard/leave/request"
          className="inline-flex items-center px-4 py-2 !bg-green-600 !text-white rounded-lg hover:bg-green-700 
                   transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg
                   animate-bounce-slow cursor-pointer focus:outline-none focus:ring-0"
        >
          <FaCalendarAlt className="h-5 w-5 mr-2" />
          Request Leave
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {user?.role === UserRole.USER ? (
          // User view - personal stats
          <>
            <div
              className="bg-white overflow-hidden shadow rounded-lg transform transition-all duration-300 
                          hover:scale-105 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FaCalendarAlt className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        My Leave Balance
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {user?.leave?.annual || 0} days
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div
              className="bg-white overflow-hidden shadow rounded-lg transform transition-all duration-300 
                          hover:scale-105 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FaCheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Pending Requests
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {
                          filteredRequests.filter((r) => r.status === "pending")
                            .length
                        }
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Admin/Super Admin view
          <>
            <div
              className="bg-white overflow-hidden shadow rounded-lg transform transition-all duration-300 
                          hover:scale-105 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FaCalendarAlt className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Leave Requests
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {filteredRequests.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div
              className="bg-white overflow-hidden shadow rounded-lg transform transition-all duration-300 
                          hover:scale-105 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FaClock className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Pending Approvals
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {
                          filteredRequests.filter((r) => r.status === "pending")
                            .length
                        }
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
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
                     focus:ring-0 focus:outline-none cursor-pointer"
            value={selectedStatus}
            onChange={(e) =>
              setSelectedStatus(e.target.value as LeaveStatus | "all")
            }
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leave Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr
                  key={request.id}
                  className="hover:bg-gray-50 transition-all duration-200 
                           transform hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <FaCalendarAlt className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm md:text-base font-medium text-gray-900">
                          {`${request.employee.firstName} ${request.employee.lastName}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.employee.department}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm md:text-base text-gray-500">
                    {leaveTypeLabels[request.type]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm md:text-base text-gray-900">
                      {calculateDuration(request.startDate, request.endDate)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {request.startDate.toLocaleDateString()} -{" "}
                      {request.endDate.toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs md:text-sm leading-5 font-semibold rounded-full ${
                        statusColors[request.status]
                      }`}
                    >
                      {request.status.charAt(0).toUpperCase() +
                        request.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm md:text-base text-gray-500">
                    {request.submittedAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm md:text-base">
                    {request.status === "pending" && canManageRequests() ? (
                      <>
                        <button
                          className="text-green-600 hover:text-green-700 mr-4 
                                   transition-all duration-200 
                                   transform hover:-translate-y-0.5 hover:shadow-sm cursor-pointer
                                   focus:outline-none focus:ring-0"
                        >
                          Approve
                        </button>
                        <button
                          className="text-red-600 hover:text-red-700
                                   transition-all duration-200 
                                   transform hover:-translate-y-0.5 hover:shadow-sm cursor-pointer
                                   focus:outline-none focus:ring-0"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <button
                        className="text-green-600 hover:text-green-700
                                 transition-all duration-200 
                                 transform hover:-translate-y-0.5 hover:shadow-sm cursor-pointer
                                 focus:outline-none focus:ring-0"
                      >
                        View
                      </button>
                    )}
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
