import { useState } from "react";
import { BaseModal } from "../shared/BaseModal";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { LoadingSpinner } from "../shared/LoadingSpinner";

interface TransferEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: {
    id: string;
    name: string;
    currentDepartment: string;
  };
  departments: { id: string; name: string }[];
  onTransfer: (departmentId: string) => Promise<void>;
}

export const TransferEmployeeModal = ({
  isOpen,
  onClose,
  employee,
  departments,
  onTransfer,
}: TransferEmployeeModalProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("");

  const handleTransfer = async () => {
    if (!selectedDepartment) {
      toast.error("Please select a department");
      return;
    }

    setLoading(true);
    try {
      await onTransfer(selectedDepartment);
      toast.success("Employee successfully transferred!", {
        className: "bg-green-500 text-white",
      });
      onClose();
    } catch (error) {
      toast.error("Failed to transfer employee");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Transfer Employee"
      maxWidth="max-w-xl"
    >
      <div className="space-y-6">
        <div className="text-gray-600">
          <p>
            Current Department:{" "}
            <span className="font-medium">{employee.currentDepartment}</span>
          </p>
          <p className="mt-2">Select new department for {employee.name}</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4"
        >
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 
                     focus:border-transparent transition-all"
          >
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </motion.div>

        <div className="flex justify-end space-x-4 mt-8">
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
            onClick={handleTransfer}
            disabled={loading || !selectedDepartment}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 
                     transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Transferring...</span>
              </>
            ) : (
              <span>Transfer</span>
            )}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};
