import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import { FaExclamationCircle } from "react-icons/fa";
import { Employee } from "../../types/employee";
import { OffboardingType } from "../../types/offboarding";
import { offboardingService } from "../../services/offboardingService";
import { toast } from "react-toastify";

interface OffboardingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  onSuccess: () => void;
}

export const OffboardingFormModal: React.FC<OffboardingFormModalProps> = ({
  isOpen,
  onClose,
  employee,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    type: "" as OffboardingType,
    reason: "",
    targetExitDate: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type || !formData.reason || !formData.targetExitDate) {
      console.log("[OFFBOARDING FORM] Form validation failed:", formData);
      toast.error("Please fill in all required fields");
      return;
    }

    console.log("[OFFBOARDING FORM] Submitting form for employee:", {
      id: employee._id,
      name: `${employee.firstName} ${employee.lastName}`,
      formData,
    });

    setIsSubmitting(true);
    try {
      // Convert string date to Date object for the service
      const targetExitDate = new Date(formData.targetExitDate);

      console.log("[OFFBOARDING FORM] Calling offboarding service with data:", {
        employeeId: employee._id,
        type: formData.type,
        reason: formData.reason,
        targetExitDate,
      });

      await offboardingService.initiateOffboarding(employee._id, {
        type: formData.type,
        reason: formData.reason,
        targetExitDate: targetExitDate,
      });

      console.log(
        "[OFFBOARDING FORM] Offboarding process initiated successfully"
      );
      toast.success("Offboarding process initiated successfully");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("[OFFBOARDING FORM] Error initiating offboarding:", error);
      toast.error("Failed to initiate offboarding process");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full rounded-xl bg-white p-6 shadow-xl">
          <Dialog.Title className="text-xl font-semibold text-gray-900 mb-4">
            Initiate Offboarding Process
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type of Offboarding*
              </label>
              <select
                value={formData.type}
                onChange={(e) => {
                  console.log(
                    "[OFFBOARDING FORM] Type changed to:",
                    e.target.value
                  );
                  setFormData({
                    ...formData,
                    type: e.target.value as OffboardingType,
                  });
                }}
                className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select type</option>
                <option value="voluntary_resignation">
                  Voluntary Resignation
                </option>
                <option value="involuntary_termination">
                  Involuntary Termination
                </option>
                <option value="retirement">Retirement</option>
                <option value="contract_end">Contract End</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason*
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => {
                  console.log("[OFFBOARDING FORM] Reason updated");
                  setFormData({ ...formData, reason: e.target.value });
                }}
                className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                required
                placeholder="Please provide detailed reason for offboarding"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Exit Date*
              </label>
              <input
                type="date"
                value={formData.targetExitDate}
                onChange={(e) => {
                  console.log(
                    "[OFFBOARDING FORM] Target exit date changed to:",
                    e.target.value
                  );
                  setFormData({ ...formData, targetExitDate: e.target.value });
                }}
                className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaExclamationCircle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Please ensure all information is accurate. This will
                    initiate the formal offboarding process and notify relevant
                    departments.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Initiating..." : "Start Offboarding"}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
