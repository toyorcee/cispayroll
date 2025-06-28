import { useState } from "react";
import { FaEdit } from "react-icons/fa";
import {
  Deduction,
  DeductionType,
  CalculationMethod,
} from "../../../types/deduction";
import { FormSkeleton } from "./Skeletons";

interface StatutoryDeductionsProps {
  deductions: Deduction[];
  isLoading: boolean;
  onUpdate: (id: string, data: Partial<Deduction>) => Promise<void>;
}

export const StatutoryDeductions = ({
  deductions,
  isLoading,
}: StatutoryDeductionsProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_editingId, setEditingId] = useState<string | null>(null);

  if (isLoading) return <FormSkeleton />;

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
                      onClick={() => setEditingId(deduction._id)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <FaEdit className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setEditingId(deduction._id)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <FaEdit className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
