import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { FaSave, FaTimes } from "react-icons/fa";
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
  effectiveDate?: Date;
}

export const DeductionForm = ({
  deduction,
  isLoading,
  onSubmit,
  onCancel,
}: DeductionFormProps) => {
  const [submitting, setSubmitting] = useState(false);
  const isEditing = !!deduction;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<FormInputs>({
    defaultValues: {
      name: deduction?.name || "",
      description: deduction?.description || "",
      calculationMethod:
        deduction?.calculationMethod || CalculationMethod.FIXED,
      value: deduction?.value || 0,
      effectiveDate: deduction?.effectiveDate,
    },
  });

  const calculationMethod = watch("calculationMethod");

  useEffect(() => {
    if (deduction) {
      reset({
        name: deduction.name,
        description: deduction.description,
        calculationMethod: deduction.calculationMethod,
        value: deduction.value,
        effectiveDate: deduction.effectiveDate,
      });
    }
  }, [deduction, reset]);

  if (isLoading) return <FormSkeleton />;

  const onFormSubmit = async (data: FormInputs) => {
    try {
      setSubmitting(true);
      await onSubmit(data);
      toast.success(
        `Deduction ${isEditing ? "updated" : "created"} successfully`
      );
      if (!isEditing) reset();
    } catch (error) {
      toast.error("Failed to save deduction");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className="bg-white shadow-sm rounded-lg p-6 space-y-6"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Deduction Name
        </label>
        <input
          type="text"
          {...register("name", { required: "Name is required" })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                   focus:ring-green-500 focus:border-green-500 sm:text-sm"
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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                   focus:ring-green-500 focus:border-green-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Calculation Method
        </label>
        <select
          {...register("calculationMethod")}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                   focus:ring-green-500 focus:border-green-500 sm:text-sm"
        >
          <option value={CalculationMethod.FIXED}>Fixed Amount</option>
          <option value={CalculationMethod.PERCENTAGE}>Percentage</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          {calculationMethod === CalculationMethod.PERCENTAGE
            ? "Percentage"
            : "Amount"}
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <input
            type="number"
            step={
              calculationMethod === CalculationMethod.PERCENTAGE ? "0.01" : "1"
            }
            {...register("value", {
              required: "Value is required",
              min: {
                value: 0,
                message: "Value must be positive",
              },
              max: {
                value:
                  calculationMethod === CalculationMethod.PERCENTAGE
                    ? 100
                    : 1000000000,
                message:
                  calculationMethod === CalculationMethod.PERCENTAGE
                    ? "Percentage cannot exceed 100"
                    : "Amount is too large",
              },
            })}
            className="block w-full rounded-md border-gray-300 shadow-sm 
                     focus:ring-green-500 focus:border-green-500 sm:text-sm"
          />
          {calculationMethod === CalculationMethod.PERCENTAGE && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">%</span>
            </div>
          )}
        </div>
        {errors.value && (
          <p className="mt-1 text-sm text-red-600">{errors.value.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center px-4 py-2 border border-gray-300 
                   rounded-md shadow-sm text-sm font-medium text-gray-700 
                   bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 
                   focus:ring-offset-2 focus:ring-green-500"
        >
          <FaTimes className="mr-2 -ml-1 h-4 w-4" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center px-4 py-2 border border-transparent 
                   rounded-md shadow-sm text-sm font-medium text-white 
                   bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 
                   focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          <FaSave className="mr-2 -ml-1 h-4 w-4" />
          {submitting ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
};
