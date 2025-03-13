import { motion, AnimatePresence } from "framer-motion";
import { Dialog } from "@headlessui/react";
import { EmployeeDetails } from "../../types/employee";
import { FaTimes, FaLinkedin, FaTwitter, FaFileAlt } from "react-icons/fa";

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
              className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl mx-auto p-8"
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>

              <div className="flex flex-col md:flex-row gap-8">
                {/* Profile Image Section */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-r from-green-400 to-blue-500">
                      <div className="w-full h-full rounded-full border-4 border-white overflow-hidden">
                        <img
                          src={employee.profileImage || "/default-avatar.png"}
                          alt={`${employee.firstName} ${employee.lastName}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="absolute -bottom-2 right-0 w-8 h-8 rounded-full bg-green-500 border-4 border-white flex items-center justify-center">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          employee.status === "active"
                            ? "bg-green-400"
                            : employee.status === "inactive"
                            ? "bg-gray-400"
                            : "bg-red-400"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Employee Details */}
                <div className="flex-grow">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {employee.firstName} {employee.lastName}
                  </h2>
                  <p className="text-green-600 font-medium">
                    {employee.position}
                  </p>

                  {/* More details in a grid layout */}
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    {/* ... Add more details here ... */}
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
