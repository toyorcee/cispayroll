import React, { useState, useRef } from "react";
import { Dialog } from "@headlessui/react";
import { FaExclamationCircle, FaUserTie, FaCheckCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Employee } from "../../types/employee";
import { OffboardingType } from "../../types/offboarding";
import { offboardingService } from "../../services/offboardingService";
import { toast } from "react-toastify";
import Confetti from "react-dom-confetti";

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
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type || !formData.reason || !formData.targetExitDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsSubmitting(true);
    try {
      const targetExitDate = new Date(formData.targetExitDate);
      await offboardingService.initiateOffboarding(employee._id, {
        type: formData.type,
        reason: formData.reason,
        targetExitDate: targetExitDate,
      });
      toast.success("Offboarding process initiated successfully");
      setShowSuccess(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
      onSuccess();
    } catch (error) {
      toast.error("Failed to initiate offboarding process");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="mx-auto max-w-md w-full rounded-2xl shadow-2xl bg-gradient-to-br from-white via-blue-50 to-emerald-50 p-0"
            >
              {/* Gradient Header */}
              <div className="rounded-t-2xl bg-gradient-to-r from-green-500 via-emerald-500 to-blue-500 px-6 py-5 flex items-center gap-3 relative">
                <FaUserTie className="text-white text-2xl" />
                <div>
                  <h2 className="text-lg font-bold text-white leading-tight">
                    Initiate Offboarding
                  </h2>
                  <div className="text-xs text-emerald-100 font-medium">
                    {employee.firstName} {employee.lastName}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="ml-auto text-white hover:text-emerald-200 focus:outline-none text-xl"
                  aria-label="Close"
                  type="button"
                >
                  ×
                </button>
                {/* Confetti celebration */}
                <div
                  ref={confettiRef}
                  className="absolute left-1/2 -translate-x-1/2 top-0"
                >
                  <Confetti active={showConfetti} />
                </div>
              </div>

              {showSuccess ? (
                <div className="flex flex-col items-center justify-center py-12 px-6">
                  <FaCheckCircle className="text-green-500 text-5xl mb-4 animate-bounceIn" />
                  <h3 className="text-2xl font-bold text-green-700 mb-2 text-center">
                    Offboarding Initiated!
                  </h3>
                  <p className="text-gray-600 text-center mb-4 max-w-xs">
                    The offboarding process has been started for{" "}
                    <span className="font-semibold">
                      {employee.firstName} {employee.lastName}
                    </span>
                    .<br />
                    All relevant departments have been notified and tasks are
                    now available for management.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-2 px-8 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Type of Offboarding*
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            type: e.target.value as OffboardingType,
                          })
                        }
                        className="w-full rounded-lg border border-gray-200 bg-gradient-to-r from-white to-blue-50 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
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
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Reason*
                      </label>
                      <textarea
                        value={formData.reason}
                        onChange={(e) =>
                          setFormData({ ...formData, reason: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-200 bg-gradient-to-r from-white to-blue-50 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
                        rows={3}
                        required
                        placeholder="Please provide detailed reason for offboarding"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Target Exit Date*
                      </label>
                      <input
                        type="date"
                        value={formData.targetExitDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            targetExitDate: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-200 bg-gradient-to-r from-white to-blue-50 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
                        required
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                  </div>
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg flex items-start gap-3 mt-2">
                    <FaExclamationCircle className="h-5 w-5 text-yellow-400 mt-1" />
                    <p className="text-sm text-yellow-700">
                      Please ensure all information is accurate. This will
                      initiate the formal offboarding process and notify
                      relevant departments.
                    </p>
                  </div>
                  <div className="flex justify-end space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400 transition"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400 transition disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Initiating..." : "Start Offboarding"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};
