import { useState } from "react";
import { toast } from "react-toastify";
import {
  FaPlus,
  FaEdit,
  FaToggleOn,
  FaToggleOff,
  FaTrash,
} from "react-icons/fa";
import { Deduction } from "../../../types/deduction";
import { DeductionType, CalculationMethod } from "../../../types/deduction";
import { FormSkeleton } from "./Skeletons";
import { DeductionForm } from "./DeductionForm";

interface VoluntaryDeductionsProps {
  deductions: Deduction[];
  isLoading: boolean;
  onAdd: (data: Partial<Deduction>) => Promise<void>;
  onUpdate: (id: string, data: Partial<Deduction>) => Promise<void>;
  onToggle: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const VoluntaryDeductions = ({
  deductions,
  isLoading,
  onAdd,
  onUpdate,
  onToggle,
  onDelete,
}: VoluntaryDeductionsProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editingDeduction, setEditingDeduction] = useState<Deduction | null>(
    null
  );
  // Removed unused 'submitting' state

  if (isLoading) return <FormSkeleton />;

  const handleSubmit = async (data: Partial<Deduction>) => {
    try {
      // Removed 'setSubmitting' call
      if (editingDeduction) {
        await onUpdate(editingDeduction._id, data);
        toast.success("Deduction updated successfully");
      } else {
        await onAdd(data);
        toast.success("Deduction added successfully");
      }
      setShowForm(false);
      setEditingDeduction(null);
    } catch {
      toast.error(
        editingDeduction
          ? "Failed to update deduction"
          : "Failed to add deduction"
      );
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await onToggle(id);
      toast.success("Deduction status updated successfully");
    } catch {
      toast.error("Failed to update deduction status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this deduction?"))
      return;

    try {
      await onDelete(id);
      toast.success("Deduction deleted successfully");
    } catch {
      toast.error("Failed to delete deduction");
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            setEditingDeduction(null);
            setShowForm(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent 
                   rounded-md shadow-sm text-sm font-medium text-white 
                   bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 
                   focus:ring-offset-2 focus:ring-green-500"
        >
          <FaPlus className="mr-2 -ml-1 h-4 w-4" />
          Add Voluntary Deduction
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <DeductionForm
              deduction={editingDeduction || undefined}
              deductionType={DeductionType.VOLUNTARY}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingDeduction(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Deductions List */}
      <div className="bg-white shadow-sm rounded-lg divide-y divide-gray-200">
        {deductions
          .filter((d) => d.type === DeductionType.VOLUNTARY)
          .map((deduction) => (
            <div key={deduction._id} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {deduction.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {deduction.description}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Calculation:{" "}
                    {deduction.calculationMethod ===
                    CalculationMethod.PERCENTAGE
                      ? `${deduction.value}% of base amount`
                      : formatCurrency(deduction.value)}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      setEditingDeduction(deduction);
                      setShowForm(true);
                    }}
                    className="text-green-600 hover:text-green-700"
                  >
                    <FaEdit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggle(deduction._id)}
                    className={`${
                      deduction.isActive ? "text-green-600" : "text-gray-400"
                    } hover:text-green-700`}
                  >
                    {deduction.isActive ? (
                      <FaToggleOn className="h-5 w-5" />
                    ) : (
                      <FaToggleOff className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(deduction._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <FaTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);
};
