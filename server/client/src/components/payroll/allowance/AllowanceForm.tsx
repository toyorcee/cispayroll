import { useState } from "react";
import { useForm } from "react-hook-form";
import { FaSave, FaTimes } from "react-icons/fa";
import { ImSpinner8 } from "react-icons/im";
import type { ISalaryComponent } from "../../../types/payroll";

interface AllowanceFormProps {
  allowance?: ISalaryComponent | null;
  isLoading?: boolean;
  onSubmit: (data: Partial<ISalaryComponent>) => Promise<void>;
  onCancel: () => void;
}

// This should match the ISalaryComponent interface
interface FormInputs {
  name: string;
  type: "allowance" | "deduction";
  value: number;
  calculationMethod: "fixed" | "percentage";
  amount: number;
  isActive: boolean;
}

export const AllowanceForm = ({
  allowance,
  isLoading,
  onSubmit,
  onCancel,
}: AllowanceFormProps) => {
  const [submitting, setSubmitting] = useState(false);
  const isEditing = !!allowance;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormInputs>({
    defaultValues: {
      name: allowance?.name || "",
      type: allowance?.type || "allowance",
      value: allowance?.value || 0,
      calculationMethod: allowance?.calculationMethod || "fixed",
      amount: allowance?.amount || 0,
      isActive: allowance?.isActive ?? true,
    },
  });

  const calculationMethod = watch("calculationMethod");

  const handleSubmitForm = async (data: FormInputs) => {
    setSubmitting(true);
    try {
      // Calculate amount based on calculation method
      const amount =
        data.calculationMethod === "percentage" ? data.value / 100 : data.value;

      await onSubmit({
        ...data,
        amount,
      });
    } catch (error) {
      console.error("Form submission failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <form
      onSubmit={handleSubmit(handleSubmitForm)}
      className="space-y-6 bg-white p-6 rounded-lg shadow"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Allowance Name
            </label>
            <input
              type="text"
              {...register("name", { required: "Name is required" })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="Enter allowance name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              {...register("type")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            >
              <option value="allowance">Allowance</option>
              <option value="deduction">Deduction</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Calculation Method
            </label>
            <select
              {...register("calculationMethod")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            >
              <option value="fixed">Fixed Amount</option>
              <option value="percentage">Percentage Based</option>
            </select>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Value {calculationMethod === "fixed" ? "(NGN)" : "(%)"}
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="number"
                step={calculationMethod === "percentage" ? "0.01" : "1"}
                {...register("value", {
                  required: "Value is required",
                  min: { value: 0, message: "Value must be positive" },
                  max: {
                    value:
                      calculationMethod === "percentage" ? 100 : 1000000000,
                    message:
                      calculationMethod === "percentage"
                        ? "Percentage cannot exceed 100%"
                        : "Amount is too large",
                  },
                })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                placeholder={
                  calculationMethod === "percentage"
                    ? "Enter percentage"
                    : "Enter amount"
                }
              />
              {calculationMethod === "percentage" && (
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

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <div className="mt-1">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  {...register("isActive")}
                  className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-600">Active</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
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

export default AllowanceForm;
