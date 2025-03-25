import { useState } from "react";
import { useForm } from "react-hook-form";
import { FaSave, FaTimes } from "react-icons/fa";
import { ImSpinner8 } from "react-icons/im";
import { Deduction, CalculationMethod } from "../../../types/deduction";
import { FormSkeleton } from "./Skeletons";

interface DeductionFormProps {
  deduction?: Deduction;
  isLoading?: boolean;
  onSubmit: (data: Partial<Deduction>) => Promise<void>;
  onCancel: () => void;
}

interface FormInputs {
  name: string;
  description?: string;
  calculationMethod: CalculationMethod;
  value: number;
  effectiveDate: Date;
  taxBrackets?: {
    min: number;
    max: number | null;
    rate: number;
  }[];
}

export const DeductionForm = ({
  deduction,
  isLoading,
  onSubmit,
  onCancel,
}: DeductionFormProps) => {
  const [submitting, setSubmitting] = useState(false);
  const isEditing = !!deduction;
  const [showTaxBrackets, setShowTaxBrackets] = useState(
    deduction?.calculationMethod === CalculationMethod.PROGRESSIVE
  );
  const [calculationMethod, setCalculationMethod] = useState(
    deduction?.calculationMethod || CalculationMethod.FIXED
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormInputs>({
    defaultValues: {
      name: deduction?.name || "",
      description: deduction?.description || "",
      calculationMethod:
        deduction?.calculationMethod || CalculationMethod.FIXED,
      value: deduction?.value || 0,
      effectiveDate: deduction?.effectiveDate || new Date(),
      taxBrackets: deduction?.taxBrackets || [{ min: 0, max: null, rate: 0 }],
    },
  });

  const taxBrackets = watch("taxBrackets");

  const addTaxBracket = () => {
    const lastBracket = taxBrackets?.[taxBrackets.length - 1];
    const newBracket = {
      min: lastBracket?.max || 0,
      max: null,
      rate: 0,
    };
    setValue("taxBrackets", [...(taxBrackets || []), newBracket]);
  };

  const removeTaxBracket = (index: number) => {
    const newBrackets = taxBrackets?.filter((_, i) => i !== index);
    setValue("taxBrackets", newBrackets);
  };

  const formatValue = (value: number) => {
    if (calculationMethod === CalculationMethod.FIXED) {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
      }).format(value);
    }
    return `${value}%`;
  };

  const handleSubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(watch());
    } catch (error) {
      console.error("Form submission failed:", error);
    }
  };

  if (isLoading) return <FormSkeleton />;

  return (
    <form
      onSubmit={handleSubmitForm}
      className="space-y-6 bg-white p-6 rounded-lg shadow"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Deduction Name
            </label>
            <input
              type="text"
              {...register("name", { required: "Name is required" })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="Enter deduction name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              {...register("description")}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="Enter description (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Calculation Method
            </label>
            <select
              {...register("calculationMethod")}
              onChange={(e) => {
                setValue(
                  "calculationMethod",
                  e.target.value as CalculationMethod
                );
                setShowTaxBrackets(
                  e.target.value === CalculationMethod.PROGRESSIVE
                );
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            >
              <option value={CalculationMethod.FIXED}>Fixed Amount</option>
              <option value={CalculationMethod.PERCENTAGE}>
                Percentage Based
              </option>
              <option value={CalculationMethod.PROGRESSIVE}>
                Progressive Rate
              </option>
            </select>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {calculationMethod !== CalculationMethod.PROGRESSIVE && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Value{" "}
                {calculationMethod === CalculationMethod.FIXED
                  ? "(NGN)"
                  : "(%)"}
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="number"
                  step={
                    calculationMethod === CalculationMethod.PERCENTAGE
                      ? "0.01"
                      : "1"
                  }
                  {...register("value", {
                    required: "Value is required",
                    min: { value: 0, message: "Value must be positive" },
                    max: {
                      value:
                        calculationMethod === CalculationMethod.PERCENTAGE
                          ? 100
                          : 1000000000,
                      message:
                        calculationMethod === CalculationMethod.PERCENTAGE
                          ? "Percentage cannot exceed 100%"
                          : "Amount is too large",
                    },
                  })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  placeholder={
                    calculationMethod === CalculationMethod.PERCENTAGE
                      ? "Enter percentage"
                      : "Enter amount"
                  }
                />
                {calculationMethod === CalculationMethod.PERCENTAGE && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">%</span>
                  </div>
                )}
              </div>
              {errors.value && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.value.message}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Effective Date
            </label>
            <input
              type="date"
              {...register("effectiveDate")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Tax Brackets Section - Full Width */}
      {showTaxBrackets && (
        <div className="col-span-2 space-y-4 border-t pt-6 mt-6">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium text-gray-700">Tax Brackets</h4>
            <button
              type="button"
              onClick={addTaxBracket}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Add Bracket
            </button>
          </div>
          {taxBrackets?.map((_, index) => (
            <div key={index} className="grid grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Min Amount
                </label>
                <input
                  type="number"
                  {...register(`taxBrackets.${index}.min` as const)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Max Amount
                </label>
                <input
                  type="number"
                  {...register(`taxBrackets.${index}.max` as const)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Rate (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    {...register(`taxBrackets.${index}.rate` as const)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  />
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeTaxBracket(index)}
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons - Full Width */}
      <div className="flex justify-end space-x-3 border-t pt-6">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <FaTimes className="mr-2" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <ImSpinner8 className="animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <FaSave className="mr-2" />
              {isEditing ? "Update" : "Create"}
            </>
          )}
        </button>
      </div>
    </form>
  );
};
