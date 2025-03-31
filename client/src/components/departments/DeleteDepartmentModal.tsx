import { Dialog } from "@headlessui/react";
import { FaExclamationTriangle, FaSpinner } from "react-icons/fa";
import { useState } from "react";

interface DeleteDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentName: string;
  onConfirm: () => Promise<void>;
}

export const DeleteDepartmentModal = ({
  isOpen,
  onClose,
  departmentName,
  onConfirm,
}: DeleteDepartmentModalProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white p-6 shadow-xl">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <FaExclamationTriangle className="w-6 h-6" />
            <Dialog.Title className="text-lg font-medium">
              Delete Department
            </Dialog.Title>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Are you sure you want to delete the department "{departmentName}"?
            This action cannot be undone.
          </p>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-red-400 flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <FaSpinner className="animate-spin h-4 w-4" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
