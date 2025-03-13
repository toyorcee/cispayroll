import { useState } from "react";
import { BaseModal } from "../shared/BaseModal";
import { motion } from "framer-motion";
import { FaExclamationTriangle } from "react-icons/fa";
import { toast } from "react-toastify";
import { LoadingSpinner } from "../shared/LoadingSpinner";

interface DeleteEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeName: string;
  onConfirm: () => Promise<void>;
}

export const DeleteEmployeeModal = ({
  isOpen,
  onClose,
  employeeName,
  onConfirm,
}: DeleteEmployeeModalProps) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onConfirm();
      toast.success("Employee successfully deleted!", {
        className: "bg-green-500 text-white",
      });
      onClose();
    } catch (error) {
      toast.error("Failed to delete employee");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Employee"
      maxWidth="max-w-lg"
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4"
        >
          <FaExclamationTriangle className="w-8 h-8 text-red-600" />
        </motion.div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Are you sure you want to delete this employee?
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          This will permanently delete {employeeName}'s record. This action
          cannot be undone.
        </p>
        <div className="flex justify-center space-x-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 
                     transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete</span>
            )}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};
