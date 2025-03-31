import { motion, AnimatePresence } from "framer-motion";
import { Dialog } from "@headlessui/react";
import { EmployeeDetails } from "../../types/employee";
import {
  FaTimes,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaUserTie,
  FaIdCard,
  FaBuilding,
} from "react-icons/fa";
import { format } from "date-fns";

interface EmployeeDetailsModalProps {
  employee: EmployeeDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeeDetailsModal = ({
  employee,
  isOpen,
  onClose,
}: EmployeeDetailsModalProps) => {
  if (!employee) return null;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "offboarding":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "suspended":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "terminated":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          as="div"
          className="fixed inset-0 z-50 overflow-y-auto"
          onClose={onClose}
          open={isOpen}
        >
          <div className="min-h-screen px-4 text-center flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black"
              aria-hidden="true"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl mx-auto p-8"
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="w-5 h-5" />
              </button>

              <div className="flex flex-col md:flex-row gap-8">
                {/* Left Column - Profile Image & Basic Info */}
                <div className="md:w-1/3">
                  <div className="relative mb-6">
                    <div className="w-40 h-40 mx-auto rounded-full p-1 bg-gradient-to-r from-green-400 to-blue-500">
                      <div className="w-full h-full rounded-full border-4 border-white overflow-hidden bg-gray-100">
                        <img
                          src={employee.profileImage || "/default-avatar.png"}
                          alt={`${employee.firstName} ${employee.lastName}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="absolute -bottom-2 right-1/3 w-8 h-8 rounded-full bg-white border-4 border-white flex items-center justify-center">
                      <div
                        className={`w-full h-full rounded-full ${getStatusColor(
                          employee.status
                        )}`}
                      />
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {employee.firstName} {employee.lastName}
                    </h2>
                    <p className="text-green-600 font-medium mt-1">
                      {employee.position}
                    </p>
                    <div
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${getStatusColor(
                        employee.status
                      )}`}
                    >
                      {employee.status.charAt(0).toUpperCase() +
                        employee.status.slice(1)}
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-600">
                      <FaEnvelope className="w-4 h-4 mr-3" />
                      <span className="text-sm">{employee.email}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FaPhone className="w-4 h-4 mr-3" />
                      <span className="text-sm">{employee.phone}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FaMapMarkerAlt className="w-4 h-4 mr-3" />
                      <span className="text-sm">{employee.workLocation}</span>
                    </div>
                  </div>
                </div>

                {/* Right Column - Detailed Information */}
                <div className="md:w-2/3 border-t md:border-t-0 md:border-l border-gray-200 pt-6 md:pt-0 md:pl-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Employee Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Employee Information
                      </h3>

                      <div className="space-y-3">
                        <div className="flex items-center text-gray-600">
                          <FaIdCard className="w-4 h-4 mr-3" />
                          <div>
                            <p className="text-xs text-gray-500">Employee ID</p>
                            <p className="text-sm font-medium">
                              {employee.employeeId}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center text-gray-600">
                          <FaUserTie className="w-4 h-4 mr-3" />
                          <div>
                            <p className="text-xs text-gray-500">Role</p>
                            <p className="text-sm font-medium">
                              {employee.role === "SUPER_ADMIN"
                                ? "Super Admin"
                                : employee.role === "ADMIN"
                                ? "Department Admin"
                                : "Regular Employee"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center text-gray-600">
                          <FaBuilding className="w-4 h-4 mr-3" />
                          <div>
                            <p className="text-xs text-gray-500">Department</p>
                            <p className="text-sm font-medium">
                              {typeof employee.department === "object"
                                ? employee.department.name
                                : employee.department || "No Department"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center text-gray-600">
                          <FaClock className="w-4 h-4 mr-3" />
                          <div>
                            <p className="text-xs text-gray-500">Grade Level</p>
                            <p className="text-sm font-medium">
                              {employee.gradeLevel}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Employment Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Employment Details
                      </h3>

                      <div className="space-y-3">
                        <div className="flex items-center text-gray-600">
                          <FaCalendarAlt className="w-4 h-4 mr-3" />
                          <div>
                            <p className="text-xs text-gray-500">Date Joined</p>
                            <p className="text-sm font-medium">
                              {format(
                                new Date(employee.dateJoined),
                                "MMM dd, yyyy"
                              )}
                            </p>
                          </div>
                        </div>

                        {employee.lastLogin && (
                          <div className="flex items-center text-gray-600">
                            <FaClock className="w-4 h-4 mr-3" />
                            <div>
                              <p className="text-xs text-gray-500">
                                Last Login
                              </p>
                              <p className="text-sm font-medium">
                                {format(
                                  new Date(employee.lastLogin),
                                  "MMM dd, yyyy HH:mm"
                                )}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Additional Employment Information */}
                      {employee.status === "PENDING" && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            Invitation sent - Waiting for account activation
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* System Information */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      System Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p className="text-xs text-gray-500">Created At</p>
                        <p className="font-medium">
                          {format(
                            new Date(employee.createdAt),
                            "MMM dd, yyyy HH:mm"
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Last Updated</p>
                        <p className="font-medium">
                          {format(
                            new Date(employee.updatedAt),
                            "MMM dd, yyyy HH:mm"
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};
