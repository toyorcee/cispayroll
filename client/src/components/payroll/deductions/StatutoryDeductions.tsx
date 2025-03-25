import { useState } from "react";
import { toast } from "react-toastify";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa";
import {
  Deduction,
  DeductionType,
  CalculationMethod,
} from "../../../types/deduction";
import { FormSkeleton } from "./Skeletons";
import { TaxBracketForm } from "./TaxBracketForm";

interface StatutoryDeductionsProps {
  deductions: Deduction[];
  isLoading: boolean;
  onUpdate: (id: string, data: Partial<Deduction>) => Promise<void>;
}

export const StatutoryDeductions = ({
  deductions,
  isLoading,
  onUpdate,
}: StatutoryDeductionsProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showTaxBrackets, setShowTaxBrackets] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) return <FormSkeleton />;

  const handleUpdate = async (deduction: Deduction, newValue: number) => {
    try {
      setSubmitting(true);
      await onUpdate(deduction._id, { value: newValue });
      toast.success("Statutory deduction updated successfully");
      setEditingId(null);
    } catch (error) {
      toast.error("Failed to update statutory deduction");
    } finally {
      setSubmitting(false);
    }
  };

  const getDeductionLabel = (deduction: Deduction) => {
    switch (deduction.name) {
      case "PAYE Tax":
        return "Pay As You Earn (PAYE) Tax";
      case "Pension":
        return "Pension Contribution";
      case "NHF":
        return "National Housing Fund (NHF)";
      default:
        return deduction.name;
    }
  };

  return (
    <div className="space-y-6">
      {showTaxBrackets && (
        <TaxBracketForm
          deduction={deductions.find((d) => d.name === "PAYE Tax")}
          onClose={() => setShowTaxBrackets(false)}
          onUpdate={onUpdate}
        />
      )}

      <div className="bg-white shadow-sm rounded-lg divide-y divide-gray-200">
        {deductions
          .filter((d) => d.type === DeductionType.STATUTORY)
          .map((deduction) => (
            <div key={deduction._id} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {getDeductionLabel(deduction)}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {deduction.description}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  {editingId === deduction._id ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        defaultValue={deduction.value}
                        step="0.01"
                        min="0"
                        max={
                          deduction.calculationMethod ===
                          CalculationMethod.PERCENTAGE
                            ? 100
                            : undefined
                        }
                        className="w-24 rounded-md border-gray-300 shadow-sm 
                                 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleUpdate(
                              deduction,
                              parseFloat(e.currentTarget.value)
                            );
                          }
                        }}
                      />
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-gray-400 hover:text-gray-500"
                        disabled={submitting}
                      >
                        <FaTimes className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-lg font-semibold text-gray-900">
                        {deduction.calculationMethod ===
                        CalculationMethod.PERCENTAGE
                          ? `${deduction.value}%`
                          : deduction.value.toLocaleString("en-NG", {
                              style: "currency",
                              currency: "NGN",
                            })}
                      </span>
                      {deduction.name === "PAYE Tax" ? (
                        <button
                          onClick={() => setShowTaxBrackets(true)}
                          className="text-green-600 hover:text-green-700"
                        >
                          View Tax Brackets
                        </button>
                      ) : (
                        <button
                          onClick={() => setEditingId(deduction._id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <FaEdit className="h-4 w-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
