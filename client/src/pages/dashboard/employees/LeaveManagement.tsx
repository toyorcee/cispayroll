import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../context/AuthContext";
import { UserRole, Permission } from "../../../types/auth";
import { FaFilter, FaCalendarAlt } from "react-icons/fa";
import { LeaveRequest, LeaveType, LeaveStatus } from "../../../types/employee";
import { Link } from "react-router-dom";
import { employeeService } from "../../../services/employeeService";
import TableSkeleton from "../../../components/skeletons/TableSkeleton";
import { toast } from "react-hot-toast";

const statusColors: Record<LeaveStatus, string> = {
  [LeaveStatus.pending]: "bg-yellow-100 text-yellow-800",
  [LeaveStatus.approved]: "bg-green-100 text-green-800",
  [LeaveStatus.rejected]: "bg-red-100 text-red-800",
  [LeaveStatus.cancelled]: "bg-gray-100 text-gray-800",
};

const leaveTypeLabels: Record<LeaveType, string> = {
  [LeaveType.annual]: "Annual Leave",
  [LeaveType.sick]: "Sick Leave",
  [LeaveType.maternity]: "Maternity Leave",
  [LeaveType.unpaid]: "Unpaid Leave",
};

export default function LeaveManagement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<LeaveStatus | "all">(
    "all"
  );
  const [stats, setStats] = useState({ total: 0, pending: 0 });

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const data = await employeeService.getAllLeaveRequests();
      setLeaveRequests(data);
      calculateStats(data);
    } catch (error) {
      toast.error("Failed to fetch leave requests");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (requests: LeaveRequest[]) => {
    setStats({
      total: requests.length,
      pending: requests.filter((r) => r.status === LeaveStatus.pending).length,
    });
  };

  const handleStatusUpdate = async (
    leaveId: string,
    status: LeaveStatus,
    notes?: string
  ) => {
    try {
      await employeeService.updateLeaveStatus(leaveId, status, notes);
      toast.success(`Leave request ${status}`);
      fetchLeaveRequests();
    } catch (error) {
      toast.error("Failed to update leave status");
    }
  };

  const getFilteredRequests = () => {
    return leaveRequests.filter(
      (request) => selectedStatus === "all" || request.status === selectedStatus
    );
  };

  const calculateDuration = (start: Date, end: Date) => {
    const diffTime = Math.abs(
      new Date(end).getTime() - new Date(start).getTime()
    );
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days`;
  };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      {/* Stats Cards start immediately - no header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center">
            <div className="p-3 bg-green-50 rounded-lg">
              <FaCalendarAlt className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">
                Total Requests
              </p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <FaCalendarAlt className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">
                Pending Approvals
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.pending}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Enhanced Filter Design */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between bg-white rounded-xl shadow-sm p-4 border border-gray-100"
      >
        <div className="flex items-center gap-4">
          <div className="p-2 bg-green-50 rounded-lg">
            <FaFilter className="text-green-600" />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) =>
              setSelectedStatus(e.target.value as LeaveStatus | "all")
            }
            className="border-gray-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500 min-w-[150px]"
          >
            <option value="all">All Status</option>
            <option value={LeaveStatus.pending}>Pending</option>
            <option value={LeaveStatus.approved}>Approved</option>
            <option value={LeaveStatus.rejected}>Rejected</option>
            <option value={LeaveStatus.cancelled}>Cancelled</option>
          </select>
        </div>
        {user?.permissions.includes(Permission.REQUEST_LEAVE) && (
          <Link
            to="/dashboard/leave/request"
            className="inline-flex items-center px-4 py-2 !bg-green-600 !text-white rounded-lg hover:bg-green-700 
                     transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md"
          >
            <FaCalendarAlt className="h-5 w-5 mr-2" />
            Request Leave
          </Link>
        )}
      </motion.div>

      {/* Enhanced Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type & Reason
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
              <AnimatePresence>
                {getFilteredRequests().map((request) => (
                  <motion.tr
                    key={request.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    whileHover={{ backgroundColor: "rgba(249, 250, 251, 0.5)" }}
                    className="transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-normal">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {request.employee.firstName}{" "}
                            {request.employee.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.employee.department}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-normal">
                      <div className="text-sm font-medium text-gray-900">
                        {leaveTypeLabels[request.type]}
                      </div>
                      <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {request.reason}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-normal">
                      <div className="text-sm text-gray-900">
                        {calculateDuration(request.startDate, request.endDate)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(request.startDate).toLocaleDateString()} -{" "}
                        {new Date(request.endDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 text-xs rounded-full ${
                          statusColors[request.status]
                        }`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(request.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {request.status === LeaveStatus.pending &&
                        user?.permissions.includes(
                          Permission.APPROVE_LEAVE
                        ) && (
                          <div className="flex justify-end gap-3">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              onClick={() =>
                                handleStatusUpdate(
                                  request.id,
                                  LeaveStatus.approved
                                )
                              }
                              className="px-3 py-1 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                            >
                              Approve
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              onClick={() =>
                                handleStatusUpdate(
                                  request.id,
                                  LeaveStatus.rejected
                                )
                              }
                              className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                            >
                              Reject
                            </motion.button>
                          </div>
                        )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
