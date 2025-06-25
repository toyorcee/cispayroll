import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  FaSave,
  FaTimes,
  FaCalculator,
  FaCalendar,
  FaInfoCircle,
} from "react-icons/fa";
import { ImSpinner8 } from "react-icons/im";
import {
  Deduction,
  CalculationMethod,
  DeductionCategory,
  DeductionScope,
  TaxBracket,
  CreateDeductionInput,
  UpdateDeductionInput,
} from "../../../types/deduction";
import { FormSkeleton } from "./Skeletons";

interface DeductionFormProps {
  deduction?: Deduction;
  isLoading?: boolean;
  deductionType: "statutory" | "voluntary";
  onSubmit: (
    data: CreateDeductionInput | UpdateDeductionInput
  ) => Promise<void>;
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
  isActive: boolean;
}

// Categories based on deduction type
const STATUTORY_CATEGORIES = [
  {
    value: "tax",
    label: "Tax",
    description: "Income tax and related deductions",
  },
  {
    value: "pension",
    label: "Pension",
    description: "Retirement savings contributions",
  },
  {
    value: "housing",
    label: "Housing",
    description: "National Housing Fund contributions",
  },
  {
    value: "general",
    label: "General",
    description: "Other statutory requirements",
  },
];

const VOLUNTARY_CATEGORIES = [
  {
    value: "loan",
    label: "Loan Repayment",
    description: "Personal or company loan deductions",
  },
  {
    value: "insurance",
    label: "Insurance",
    description: "Health, life, or other insurance",
  },
  {
    value: "association",
    label: "Association Dues",
    description: "Professional or trade association fees",
  },
  {
    value: "savings",
    label: "Savings",
    description: "Voluntary savings contributions",
  },
  {
    value: "transport",
    label: "Transport",
    description: "Transportation-related deductions",
  },
  {
    value: "cooperative",
    label: "Cooperative",
    description: "Cooperative society contributions",
  },
  {
    value: "general",
    label: "General",
    description: "Other voluntary deductions",
  },
];

const SCOPE_OPTIONS = [
  {
    value: "company_wide",
    label: "Company Wide",
    description: "Applies to all employees",
  },
  {
    value: "department",
    label: "Department Specific",
    description: "Applies to specific department",
  },
  {
    value: "individual",
    label: "Individual",
    description: "Applies to specific employees",
  },
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
      effectiveDate: deduction?.effectiveDate
        ? new Date(deduction.effectiveDate)
        : new Date(),
      taxBrackets: deduction?.taxBrackets || [{ min: 0, max: null, rate: 0 }],
      category: deduction?.category || DeductionCategory.GENERAL,
      scope: deduction?.scope || DeductionScope.COMPANY_WIDE,
      isActive: deduction?.isActive ?? true,
    },
  });

  const calculationMethod = watch("calculationMethod");
  const taxBrackets = watch("taxBrackets");
  const scope = watch("scope");

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
      const submissionData = {
        ...formData,
        type: deductionType,
        effectiveDate:
          formData.effectiveDate instanceof Date
            ? formData.effectiveDate
            : new Date(formData.effectiveDate),
      };

      if (deduction) {
        const updateData: UpdateDeductionInput = {
          name: submissionData.name,
          description: submissionData.description,
          calculationMethod: submissionData.calculationMethod,
          value: submissionData.value,
          taxBrackets: submissionData.taxBrackets,
          isActive: submissionData.isActive,
          effectiveDate: submissionData.effectiveDate,
          category: submissionData.category,
          scope: submissionData.scope,
          type: submissionData.type as "statutory" | "voluntary",
        };
        await onSubmit(updateData);
      } else {
        const createData: CreateDeductionInput = {
          name: submissionData.name,
          description: submissionData.description,
          calculationMethod: submissionData.calculationMethod,
          value: submissionData.value,
          taxBrackets: submissionData.taxBrackets,
          isActive: submissionData.isActive,
          effectiveDate: submissionData.effectiveDate,
          category: submissionData.category,
          scope: submissionData.scope,
          type: submissionData.type as "statutory" | "voluntary",
        };
        await onSubmit(createData);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Determine available calculation methods based on type
  const getCalculationMethods = () => {
    if (deductionType === "statutory") {
      return [
        {
          value: CalculationMethod.PROGRESSIVE,
          label: "Progressive Rate",
          description: "Tax brackets with different rates",
        },
        {
          value: CalculationMethod.PERCENTAGE,
          label: "Percentage Based",
          description: "Fixed percentage of salary",
        },
      ];
    }
    return [
      {
        value: CalculationMethod.FIXED,
        label: "Fixed Amount",
        description: "Fixed amount regardless of salary",
      },
      {
        value: CalculationMethod.PERCENTAGE,
        label: "Percentage Based",
        description: "Percentage of salary",
      },
    ];
  };

  const getCategories = () => {
    return deductionType === "statutory"
      ? STATUTORY_CATEGORIES
      : VOLUNTARY_CATEGORIES;
  };

  useEffect(() => {
    setValue("value", 0);
    setShowTaxBrackets(calculationMethod === CalculationMethod.PROGRESSIVE);
  }, [calculationMethod, setValue]);

  if (isLoading) return <FormSkeleton />;

  return (
    <form onSubmit={formHandleSubmit(onSubmitForm)} className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
            <FaCalculator className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {isEditing ? "Edit" : "Create"}{" "}
              {deductionType === "statutory" ? "Statutory" : "Voluntary"}{" "}
              Deduction
            </h3>
            <p className="text-sm text-gray-500">
              {deductionType === "statutory"
                ? "Configure mandatory deductions for all employees"
                : "Set up optional deductions that employees can choose"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FaInfoCircle className="w-5 h-5 text-green-600 mr-2" />
              Basic Information
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deduction Name *
                </label>
                <input
                  type="text"
                  {...register("name", {
                    required: "Deduction name is required",
                  })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 ${
                    errors.name ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="e.g., Transport Allowance, Health Insurance"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  {...register("description")}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                  placeholder="Brief description of the deduction..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  {...register("category", {
                    required: "Category is required",
                  })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 ${
                    errors.category ? "border-red-300" : "border-gray-300"
                  }`}
                >
                  <option value="">Select a category</option>
                  {getCategories().map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.category.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Calculation Settings */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FaCalculator className="w-5 h-5 text-blue-600 mr-2" />
              Calculation Settings
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calculation Method *
                </label>
                <select
                  {...register("calculationMethod", {
                    required: "Calculation method is required",
                  })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 ${
                    errors.calculationMethod
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                >
                  <option value="">Select calculation method</option>
                  {getCalculationMethods().map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
                {errors.calculationMethod && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.calculationMethod.message}
                  </p>
                )}
              </div>

              {!showTaxBrackets && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {calculationMethod === "PERCENTAGE"
                      ? "Percentage (%)"
                      : "Amount (₦)"}{" "}
                    *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("value", {
                      required: "Value is required",
                      min: { value: 0, message: "Value must be positive" },
                      max:
                        calculationMethod === "PERCENTAGE"
                          ? {
                              value: 100,
                              message: "Percentage cannot exceed 100%",
                            }
                          : undefined,
                    })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 ${
                      errors.value ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder={
                      calculationMethod === "PERCENTAGE"
                        ? "e.g., 5.5"
                        : "e.g., 5000"
                    }
                  />
                  {errors.value && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.value.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Scope and Applicability */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FaCalendar className="w-5 h-5 text-purple-600 mr-2" />
              Scope & Timing
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Applicable Scope *
                </label>
                <select
                  {...register("scope", { required: "Scope is required" })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 ${
                    errors.scope ? "border-red-300" : "border-gray-300"
                  }`}
                >
                  <option value="">Select scope</option>
                  {SCOPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.scope && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.scope.message}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {
                    SCOPE_OPTIONS.find((opt) => opt.value === scope)
                      ?.description
                  }
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Effective Date *
                </label>
                <input
                  type="date"
                  {...register("effectiveDate", {
                    required: "Effective date is required",
                  })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 ${
                    errors.effectiveDate ? "border-red-300" : "border-gray-300"
                  }`}
                />
                {errors.effectiveDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.effectiveDate.message}
                  </p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register("isActive")}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Active (Enable this deduction)
                </label>
              </div>
            </div>
          </div>

          {/* Tax Brackets for Progressive */}
          {showTaxBrackets && (
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Tax Brackets Configuration
              </h4>
              <div className="space-y-4">
                {taxBrackets?.map((bracket, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Min Amount (₦)
                          </label>
                          <input
                            type="number"
                            value={bracket.min}
                            onChange={(e) => {
                              const newBrackets = [...(taxBrackets || [])];
                              newBrackets[index].min =
                                parseFloat(e.target.value) || 0;
                              setValue("taxBrackets", newBrackets);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Max Amount (₦)
                          </label>
                          <input
                            type="number"
                            value={bracket.max || ""}
                            onChange={(e) => {
                              const newBrackets = [...(taxBrackets || [])];
                              newBrackets[index].max = e.target.value
                                ? parseFloat(e.target.value)
                                : null;
                              setValue("taxBrackets", newBrackets);
                            }}
                            placeholder="No limit"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Rate (%)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={bracket.rate}
                          onChange={(e) => {
                            const newBrackets = [...(taxBrackets || [])];
                            newBrackets[index].rate =
                              parseFloat(e.target.value) || 0;
                            setValue("taxBrackets", newBrackets);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                    </div>
                    {taxBrackets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTaxBracket(index)}
                        className="text-red-600 hover:text-red-800 p-2"
                      >
                        <FaTimes className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTaxBracket}
                  className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors duration-200"
                >
                  + Add Tax Bracket
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 border border-transparent rounded-lg text-sm font-medium text-white hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
        >
          {submitting ? (
            <>
              <ImSpinner8 className="animate-spin -ml-1 mr-2 h-4 w-4" />
              Saving...
            </>
          ) : (
            <>
              <FaSave className="mr-2 h-4 w-4" />
              {isEditing ? "Update Deduction" : "Create Deduction"}
            </>
          )}
        </button>
      </div>
    </form>
  );
};
