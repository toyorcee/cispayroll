import { motion, AnimatePresence } from "framer-motion";
import { Dialog } from "@headlessui/react";
import { EmployeeDetails, Department } from "../../types/employee";
import { FaTimes, FaPhone, FaEnvelope, FaUser } from "react-icons/fa";
import { format } from "date-fns";
import { Avatar } from "@mui/material";
import { getProfileImageUrl } from "../../utils/imageUtils";

interface EmployeeDetailsModalProps {
  employee: EmployeeDetails | null;
  departments: Department[];
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeeDetailsModal = ({
  employee,
  departments,
  isOpen,
  onClose,
}: EmployeeDetailsModalProps) => {
  if (!isOpen) {
    return null;
  }

  if (!employee) {
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
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black"
                aria-hidden="true"
                onClick={onClose}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-gradient-to-br from-white via-blue-50 to-emerald-50 rounded-2xl shadow-2xl w-full max-w-4xl mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
              >
                <button
                  onClick={onClose}
                  className="sticky top-0 right-0 float-right z-10 text-gray-400 hover:text-gray-600 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <FaTimes className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mb-4"></div>
                  <p className="text-gray-600">Loading employee details...</p>
                </div>
              </motion.div>
            </div>
          </Dialog>
        )}
      </AnimatePresence>
    );
  }

  // Add logging to debug image data
  console.log("EmployeeDetailsModal - Employee data:", {
    id: employee._id,
    name: `${employee.firstName} ${employee.lastName}`,
    profileImage: employee.profileImage,
    profileImageUrl: employee.profileImageUrl,
    status: employee.status,
  });

  const renderDepartmentName = (department: any) => {
    if (!department) return "No Department";

    if (typeof department === "object" && department !== null) {
      return department.name || "No Department";
    }

    const foundDepartment = departments?.find((d) => d._id === department);
    return foundDepartment?.name || "No Department";
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black backdrop-blur-sm"
              aria-hidden="true"
              onClick={onClose}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-gradient-to-br from-white via-blue-50 to-emerald-50 rounded-2xl shadow-2xl w-full max-w-4xl mx-auto p-0 max-h-[90vh] overflow-y-auto"
            >
              {/* Gradient Header */}
              <div className="sticky top-0 z-10 bg-gradient-to-r from-green-500 via-emerald-500 to-blue-500 rounded-t-2xl px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FaUser className="text-white text-xl" />
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Employee Details
                    </h2>
                    <p className="text-xs text-emerald-100">
                      {employee.fullName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:text-emerald-200 focus:outline-none text-xl bg-white/20 rounded-full p-2 hover:bg-white/30 transition-all duration-200"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                  {/* Left Column */}
                  <div className="w-full md:w-1/3 space-y-4 sm:space-y-6">
                    <div className="relative">
                      <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto rounded-full p-1 bg-gradient-to-r from-green-400 via-emerald-500 to-blue-500 shadow-lg">
                        <div className="w-full h-full rounded-full border-4 border-white overflow-hidden bg-gray-100">
                          <Avatar
                            src={getProfileImageUrl(employee)}
                            alt={`${employee.firstName} ${employee.lastName}`}
                            sx={{
                              width: "100%",
                              height: "100%",
                              border: "4px solid #fff",
                              boxShadow: "0 0 20px rgba(0,0,0,0.1)",
                              backgroundColor: "#e5e7eb",
                            }}
                          >
                            {!employee.profileImage &&
                              !employee.profileImageUrl &&
                              `${employee.firstName?.[0]}${employee.lastName?.[0]}`}
                          </Avatar>
                        </div>
                      </div>
                    </div>

                    <div className="text-center">
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                        {employee.fullName}
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {employee.position}
                      </p>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mt-2 ${
                          employee.status === "active"
                            ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200"
                            : employee.status === "pending"
                            ? "bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-200"
                            : "bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200"
                        }`}
                      >
                        {employee.status}
                      </span>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center justify-center md:justify-start text-gray-600">
                        <FaEnvelope className="w-4 h-4 mr-3 text-green-500" />
                        <div className="text-center md:text-left">
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-sm font-medium">
                            {employee.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-center md:justify-start text-gray-600">
                        <FaPhone className="w-4 h-4 mr-3 text-green-500" />
                        <div className="text-center md:text-left">
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="text-sm font-medium">
                            {employee.phone}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 sm:pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-semibold text-green-600 mb-2 sm:mb-3">
                          System Information
                        </h3>
                        <div className="space-y-2 bg-gradient-to-r from-gray-50 to-blue-50 p-3 rounded-lg">
                          <div>
                            <p className="text-xs text-gray-500">Created</p>
                            <p className="text-sm font-medium">
                              {format(
                                new Date(employee.createdAt),
                                "MMM dd, yyyy"
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">
                              Last Updated
                            </p>
                            <p className="text-sm font-medium">
                              {format(
                                new Date(employee.updatedAt),
                                "MMM dd, yyyy"
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Last Login</p>
                            <p className="text-sm font-medium">
                              {employee.lastLogin
                                ? format(
                                    new Date(employee.lastLogin),
                                    "MMM dd, yyyy"
                                  )
                                : "Never"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="w-full md:w-2/3 space-y-4 sm:space-y-6">
                    {/* Basic Employment Info */}
                    <div className="bg-gradient-to-r from-white to-blue-50 p-4 rounded-xl shadow-sm">
                      <h3 className="text-sm font-semibold text-green-600 mb-3">
                        Employment Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Employee ID</p>
                          <p className="text-sm font-medium">
                            {employee.employeeId || "Not Assigned"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Position</p>
                          <p className="text-sm font-medium">
                            {employee.position || "Not Assigned"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Grade Level</p>
                          <p className="text-sm font-medium">
                            {employee.gradeLevel}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Work Location</p>
                          <p className="text-sm font-medium">
                            {employee.workLocation}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Department</p>
                          <p className="text-sm font-medium">
                            {renderDepartmentName(employee.department)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Personal Details Section */}
                    {employee.personalDetails && (
                      <div className="bg-gradient-to-r from-white to-emerald-50 p-4 rounded-xl shadow-sm">
                        <h3 className="text-sm font-semibold text-green-600 mb-3">
                          Personal Details
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Middle Name</p>
                            <p className="text-sm font-medium">
                              {employee.personalDetails.middleName}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">
                              Date of Birth
                            </p>
                            <p className="text-sm font-medium">
                              {format(
                                new Date(employee.personalDetails.dateOfBirth),
                                "MMM dd, yyyy"
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">
                              Marital Status
                            </p>
                            <p className="text-sm font-medium capitalize">
                              {employee.personalDetails.maritalStatus}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Nationality</p>
                            <p className="text-sm font-medium">
                              {employee.personalDetails.nationality}
                            </p>
                          </div>
                        </div>

                        {/* Address Section */}
                        {employee.personalDetails.address && (
                          <div className="mt-4 bg-gradient-to-r from-gray-50 to-blue-50 p-3 rounded-lg">
                            <h4 className="text-xs font-semibold text-green-600 mb-2">
                              Address
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                              <div>
                                <p className="text-xs text-gray-500">Street</p>
                                <p className="text-sm font-medium">
                                  {employee.personalDetails.address.street}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">City</p>
                                <p className="text-sm font-medium">
                                  {employee.personalDetails.address.city}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">State</p>
                                <p className="text-sm font-medium">
                                  {employee.personalDetails.address.state}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Country</p>
                                <p className="text-sm font-medium">
                                  {employee.personalDetails.address.country}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">
                                  ZIP Code
                                </p>
                                <p className="text-sm font-medium">
                                  {employee.personalDetails.address.zipCode}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Qualifications Section */}
                        {employee.personalDetails.qualifications &&
                          employee.personalDetails.qualifications.length >
                            0 && (
                            <div className="mt-4">
                              <h4 className="text-xs font-semibold text-green-600 mb-2">
                                Qualifications
                              </h4>
                              <div className="space-y-3">
                                {employee.personalDetails.qualifications.map(
                                  (qual, index) => (
                                    <div
                                      key={qual._id || index}
                                      className="bg-gradient-to-r from-gray-50 to-blue-50 p-3 rounded-lg border border-gray-100"
                                    >
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                          <p className="text-xs text-gray-500">
                                            Highest Education
                                          </p>
                                          <p className="text-sm font-medium">
                                            {qual.highestEducation}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-500">
                                            Institution
                                          </p>
                                          <p className="text-sm font-medium">
                                            {qual.institution}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-500">
                                            Year Graduated
                                          </p>
                                          <p className="text-sm font-medium">
                                            {qual.yearGraduated}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    )}

                    {/* Bank Details */}
                    {employee.bankDetails && (
                      <div className="bg-gradient-to-r from-white to-purple-50 p-4 rounded-xl shadow-sm">
                        <h3 className="text-sm font-semibold text-green-600 mb-3">
                          Bank Details
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Bank Name</p>
                            <p className="text-sm font-medium">
                              {employee.bankDetails.bankName}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">
                              Account Number
                            </p>
                            <p className="text-sm font-medium">
                              {employee.bankDetails.accountNumber}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">
                              Account Name
                            </p>
                            <p className="text-sm font-medium">
                              {employee.bankDetails.accountName}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Emergency Contact */}
                    {employee.emergencyContact && (
                      <div className="bg-gradient-to-r from-white to-red-50 p-4 rounded-xl shadow-sm">
                        <h3 className="text-sm font-semibold text-green-600 mb-3">
                          Emergency Contact
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Name</p>
                            <p className="text-sm font-medium">
                              {employee.emergencyContact.name}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">
                              Relationship
                            </p>
                            <p className="text-sm font-medium">
                              {employee.emergencyContact.relationship}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Phone</p>
                            <p className="text-sm font-medium">
                              {employee.emergencyContact.phone}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
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
