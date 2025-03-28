import { useState } from "react";
import { toast } from "react-toastify";
import { FaTimes } from "react-icons/fa";
import { Deduction, TaxBracket } from "../../../types/deduction";

interface TaxBracketFormProps {
  deduction?: Deduction;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<Deduction>) => Promise<void>;
}

export const TaxBracketForm = ({
  deduction,
  onClose,
  onUpdate,
}: TaxBracketFormProps) => {
  const [brackets, setBrackets] = useState<TaxBracket[]>(
    deduction?.taxBrackets || []
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!deduction) return;

    try {
      setSubmitting(true);
      await onUpdate(deduction._id, { taxBrackets: brackets });
      toast.success("Tax brackets updated successfully");
      onClose();
    } catch{
      toast.error("Failed to update tax brackets");
    } finally {
      setSubmitting(false);
    }
  };

  const updateBracket = (
    index: number,
    field: keyof TaxBracket,
    value: number
  ) => {
    const newBrackets = [...brackets];
    newBrackets[index] = { ...newBrackets[index], [field]: value };
    setBrackets(newBrackets);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            PAYE Tax Brackets
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {brackets.map((bracket, index) => (
            <div key={index} className="flex space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Min Amount
                </label>
                <input
                  type="number"
                  value={bracket.min}
                  onChange={(e) =>
                    updateBracket(index, "min", Number(e.target.value))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                           focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Max Amount
                </label>
                <input
                  type="number"
                  value={bracket.max || ""}
                  onChange={(e) =>
                    updateBracket(index, "max", Number(e.target.value))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                           focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Rate (%)
                </label>
                <input
                  type="number"
                  value={bracket.rate}
                  onChange={(e) =>
                    updateBracket(index, "rate", Number(e.target.value))
                  }
                  min="0"
                  max="100"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                           focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium 
                     text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 
                     focus:ring-offset-2 focus:ring-green-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm 
                     font-medium text-white bg-green-600 hover:bg-green-700 
                     focus:outline-none focus:ring-2 focus:ring-offset-2 
                     focus:ring-green-500 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};
