import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { FaSave, FaTimes } from "react-icons/fa";
import { ImSpinner8 } from "react-icons/im";
import {
  Deduction,
  CalculationMethod,
  DeductionCategory,
  DeductionScope,
  DeductionApplicability,
  TaxBracket,
} from "../../../types/deduction";
import { FormSkeleton } from "./Skeletons";

interface DeductionFormProps {
  deduction?: Deduction;
  isLoading?: boolean;
  deductionType: "statutory" | "voluntary";
  onSubmit: (data: Partial<Deduction>) => Promise<void>;
  onCancel: () => void;
}

interface FormInputs {
  name: string;
  description?: string;
  calculationMethod: CalculationMethod;
  value: number;
  effectiveDate: Date;
  taxBrackets?: TaxBracket[];
  category: DeductionCategory;
  scope: DeductionScope;
  applicability: DeductionApplicability;
  isCustom: boolean;
}

// Add these constants at the top of the file after imports
const STATUTORY_CATEGORIES = [
  { value: "tax", label: "Tax" },
  { value: "pension", label: "Pension" },
  { value: "housing", label: "Housing" },
  { value: "general", label: "General" },
];

const VOLUNTARY_CATEGORIES = [
  { value: "loan", label: "Loan Repayment" },
  { value: "insurance", label: "Insurance" },
  { value: "association", label: "Association Dues" },
  { value: "savings", label: "Savings" },
  { value: "miscellaneous", label: "Miscellaneous" },
];

export const DeductionForm = ({
  deduction,
  isLoading,
  deductionType,
  onSubmit,
  onCancel,
}: DeductionFormProps) => {
  const [submitting, setSubmitting] = useState(false);
  const isEditing = !!deduction;
  const [showTaxBrackets, setShowTaxBrackets] = useState(
    deduction?.calculationMethod === CalculationMethod.PROGRESSIVE
  );

  const {
    register,
    handleSubmit: formHandleSubmit,
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
      category: deduction?.category || DeductionCategory.GENERAL,
      scope: deduction?.scope || DeductionScope.COMPANY_WIDE,
      applicability:
        deduction?.applicability || DeductionApplicability.INDIVIDUAL,
      isCustom: deduction?.isCustom || false,
    },
  });

  // Watch calculationMethod here
  const calculationMethod = watch("calculationMethod");

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

  const onSubmitForm = async (formData: FormInputs) => {
    setSubmitting(true);
    try {
      // Format the data properly
      const formattedData = {
        ...formData,
        // Parse value based on calculation method
        value:
          formData.calculationMethod === CalculationMethod.PERCENTAGE
            ? parseFloat(formData.value.toString())
            : Math.round(formData.value),
        // Use current date if effectiveDate is empty
        effectiveDate: formData.effectiveDate || new Date(),
      };

      await onSubmit(formattedData);
    } catch (error) {
      console.error("Form submission failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Determine available calculation methods based on type
  const getCalculationMethods = () => {
    if (deductionType === "statutory") {
      return [
        { value: CalculationMethod.PROGRESSIVE, label: "Progressive Rate" },
        { value: CalculationMethod.PERCENTAGE, label: "Percentage Based" },
      ];
    }
    return [
      { value: CalculationMethod.FIXED, label: "Fixed Amount" },
      { value: CalculationMethod.PERCENTAGE, label: "Percentage Based" },
    ];
  };

  useEffect(() => {
    setValue("value", 0);
    setShowTaxBrackets(calculationMethod === CalculationMethod.PROGRESSIVE);
  }, [calculationMethod, setValue]);

  if (isLoading) return <FormSkeleton />;

  return (
    <form
      onSubmit={formHandleSubmit(onSubmitForm)}
      className="space-y-6 bg-white p-6 rounded-lg shadow"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">
          {isEditing ? "Edit" : "Add"}{" "}
          {deductionType === "statutory" ? "Statutory" : "Voluntary"} Deduction
        </h3>
      </div>

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
              placeholder={`Enter ${deductionType} deduction name`}
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            >
              {getCalculationMethods().map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {calculationMethod !== CalculationMethod.PROGRESSIVE && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {calculationMethod === CalculationMethod.PERCENTAGE
                  ? "Percentage Value"
                  : "Fixed Amount"}
                <span className="ml-1 text-xs text-gray-500">
                  {calculationMethod === CalculationMethod.PERCENTAGE
                    ? "(0-100%)"
                    : "(NGN)"}
                </span>
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
                    min: {
                      value: 0,
                      message:
                        calculationMethod === CalculationMethod.PERCENTAGE
                          ? "Percentage cannot be negative"
                          : "Amount cannot be negative",
                    },
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
                  className={`block w-full rounded-md border-gray-300 shadow-sm 
                    focus:border-green-500 focus:ring-green-500 sm:text-sm
                    ${errors.value ? "border-red-300" : ""}`}
                  placeholder={
                    calculationMethod === CalculationMethod.PERCENTAGE
                      ? "Enter percentage (e.g., 1.5)"
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
              <span className="ml-1 text-xs text-gray-500">
                (Leave empty for today's date)
              </span>
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

      {/* Add new fields after the calculation method */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700"
          >
            Category
          </label>
          <select
            id="category"
            {...register("category", { required: "Category is required" })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
          >
            <option value="">Select a category</option>
            {(deductionType === "statutory"
              ? STATUTORY_CATEGORIES
              : VOLUNTARY_CATEGORIES
            ).map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">
              {errors.category.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Scope
          </label>
          <select
            {...register("scope")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
          >
            {Object.values(DeductionScope).map((scope) => (
              <option key={scope} value={scope}>
                {scope
                  .split("_")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Applicability
          </label>
          <select
            {...register("applicability")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
          >
            {Object.values(DeductionApplicability).map((applicability) => (
              <option key={applicability} value={applicability}>
                {applicability.charAt(0).toUpperCase() + applicability.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            {...register("isCustom")}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">
            Custom Deduction
          </label>
        </div>
      </div>

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
