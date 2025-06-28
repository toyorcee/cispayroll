import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { FaSave, FaCalculator, FaCalendar, FaInfoCircle } from "react-icons/fa";
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
import { departmentService } from "../../../services/departmentService";
import { employeeService } from "../../../services/employeeService";
import { Department } from "../../../types/department";
import { Employee } from "../../../types/employee";
import Select from "react-select";
import { formatCurrency } from "../../../utils/formatters";

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
  value: number | null;
  effectiveDate: string;
  taxBrackets?: TaxBracket[];
  category: DeductionCategory;
  scope: DeductionScope;
  isActive: boolean;
  department?: string;
  assignedEmployees?: string[];
  deductionDuration?: "ongoing" | "one-off";
  appliesToPeriod?: {
    periodType: "monthly" | "weekly" | "biweekly" | "quarterly" | "annual";
    month?: number;
    year: number;
    week?: number;
    biweek?: number;
    quarter?: number;
  };
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
  console.log("DeductionForm received deduction:", deduction);
  const [submitting, setSubmitting] = useState(false);
  const isEditing = !!deduction;
  const [_showTaxBrackets, setShowTaxBrackets] = useState(
    deduction?.calculationMethod?.toLowerCase() === "progressive"
  );
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [_loadingDeps, setLoadingDeps] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<
    "ongoing" | "one-off"
  >("ongoing");
  const [selectedPeriodType, setSelectedPeriodType] = useState<
    "monthly" | "weekly" | "biweekly" | "quarterly" | "annual"
  >("monthly");
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedBiweek, setSelectedBiweek] = useState<number>(1);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(1);
  const [valueInput, setValueInput] = useState<string>("");
  const [isValueFocused, setIsValueFocused] = useState(false);

  const typeToUse = deduction?.type || deductionType;

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
      value: deduction?.value || null,
      effectiveDate: deduction?.effectiveDate
        ? new Date(deduction.effectiveDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      taxBrackets: deduction?.taxBrackets || [{ min: 0, max: null, rate: 0 }],
      category:
        (deduction?.category as DeductionCategory) || DeductionCategory.GENERAL,
      scope: deduction?.scope || DeductionScope.COMPANY_WIDE,
      isActive: deduction?.isActive ?? true,
    },
  });

  const calculationMethod = watch("calculationMethod");
  const taxBrackets = watch("taxBrackets");
  const scope = watch("scope");

  // Determine if this is a PAYE deduction (statutory progressive)
  const isPAYE =
    deduction?.type?.toLowerCase() === "statutory" &&
    deduction?.calculationMethod?.toLowerCase() === "progressive";

  // Show tax brackets for progressive calculations or PAYE
  const shouldShowTaxBrackets = calculationMethod === "PROGRESSIVE" || isPAYE;

  // Hide value field for PAYE or progressive calculations
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // const shouldHideValueField = shouldShowTaxBrackets;

  useEffect(() => {
    setLoadingDeps(true);
    departmentService.getAllDepartments().then((deps) => {
      console.log("Departments API response:", deps);
      setDepartments(deps);
      setLoadingDeps(false);
    });
    employeeService
      .getAllEmployees({ status: "active", limit: 1000, page: 1 })
      .then((res) => {
        console.log("Employees API response:", res);
        setEmployees(res.data ? res.data : res.employees ? res.employees : res);
      });
  }, []);

  useEffect(() => {
    if (deduction && deduction.department) {
      setValue("department", deduction.department);
    }
  }, [deduction, setValue]);

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
      console.log("🚀 DeductionForm: Starting form submission...");
      console.log("📝 DeductionForm: Form data received:", formData);
      console.log("🏷️ DeductionForm: Deduction type:", deductionType);
      console.log("⏱️ DeductionForm: Selected duration:", selectedDuration);
      if (selectedDuration === "one-off") {
        console.log("📅 DeductionForm: Period data:", {
          periodType: selectedPeriodType,
          month: selectedMonth,
          year: selectedYear,
          week: selectedWeek,
          biweek: selectedBiweek,
          quarter: selectedQuarter,
        });
      }
      console.log("🎯 DeductionForm: Scope:", formData.scope);
      if (formData.scope === "department") {
        console.log(
          "🏢 DeductionForm: Selected department:",
          formData.department
        );
      }
      if (formData.scope === "individual") {
        console.log(
          "👥 DeductionForm: Selected employees:",
          formData.assignedEmployees
        );
      }

      const submissionData: any = {
        ...formData,
        type: deductionType,
        effectiveDate: formData.effectiveDate
          ? new Date(formData.effectiveDate)
          : new Date(),
      };
      if (formData.scope === "department") {
        submissionData.department = formData.department;
      }
      if (formData.scope === "individual") {
        submissionData.assignedEmployees = formData.assignedEmployees;
      }
      // Attach duration and period if voluntary
      if (deductionType === "voluntary") {
        submissionData.deductionDuration = selectedDuration;
        if (selectedDuration === "one-off") {
          const appliesToPeriod: any = {
            periodType: selectedPeriodType,
            year: selectedYear,
          };
          if (selectedPeriodType === "monthly")
            appliesToPeriod.month = selectedMonth;
          if (selectedPeriodType === "weekly")
            appliesToPeriod.week = selectedWeek;
          if (selectedPeriodType === "biweekly")
            appliesToPeriod.biweek = selectedBiweek;
          if (selectedPeriodType === "quarterly")
            appliesToPeriod.quarter = selectedQuarter;
          submissionData.appliesToPeriod = appliesToPeriod;
        }
      }

      console.log("📤 DeductionForm: Final submission data:", submissionData);

      if (deduction) {
        console.log(
          "✏️ DeductionForm: Updating existing deduction:",
          deduction._id
        );
        // Exclude type field for updates since backend blocks type changes
        const { type, ...updateDataWithoutType } = submissionData;
        const updateData: UpdateDeductionInput = {
          ...updateDataWithoutType,
        };
        await onSubmit(updateData);
      } else {
        console.log("➕ DeductionForm: Creating new deduction");
        const createData: CreateDeductionInput = {
          ...submissionData,
        };
        await onSubmit(createData);
      }
      console.log("✅ DeductionForm: Form submission completed successfully");
    } catch (error) {
      console.error("❌ DeductionForm: Error submitting form:", error);
      console.error("Error submitting form:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Determine available calculation methods based on type
  const getCalculationMethods = () => {
    const type =
      typeof deductionType === "string"
        ? deductionType.toLowerCase()
        : deductionType !== undefined
        ? String(deductionType).toLowerCase()
        : "";

    const dedType =
      typeof deduction?.type === "string"
        ? deduction?.type.toLowerCase()
        : deduction?.type !== undefined
        ? String(deduction?.type).toLowerCase()
        : "";

    if (type === "statutory" || dedType === "statutory") {
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
        {
          value: CalculationMethod.FIXED,
          label: "Fixed Amount",
          description: "Fixed amount regardless of salary",
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
    setValue("value", null);
    setShowTaxBrackets(calculationMethod === CalculationMethod.PROGRESSIVE);
  }, [calculationMethod, setValue]);

  useEffect(() => {
    if (deduction) {
      setValueInput(
        deduction.value !== null && deduction.value !== undefined
          ? deduction.value.toString()
          : ""
      );
      setValue("value", deduction.value ?? null);
    }
  }, [deduction, setValue]);

  const employeeOptions = employees.map((emp) => ({
    value: emp._id,
    label: `${emp.firstName} ${emp.lastName} (${emp.email})`,
  }));
  const departmentOptions = departments.map((dep) => ({
    value: dep._id,
    label: dep.name,
  }));

  // Helper for effective date min value
  const today = new Date();
  const minDate = today.toISOString().split("T")[0];

  if (isLoading) return <FormSkeleton />;

  return (
    <form
      onSubmit={formHandleSubmit(onSubmitForm)}
      className="space-y-8 w-full max-w-none"
    >
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
            <FaCalculator className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {isEditing ? "Edit" : "Create"}{" "}
              {typeToUse === "statutory" ? "Statutory" : "Voluntary"} Deduction
            </h3>
            <p className="text-sm text-gray-500">
              {typeToUse === "statutory"
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
              <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calculation Method *
                </label>
              </div>
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

              {!shouldShowTaxBrackets && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {calculationMethod === "PERCENTAGE"
                      ? "Percentage (%)"
                      : "Amount (₦)"}{" "}
                    *
                  </label>
                  <input
                    type="text"
                    value={
                      isValueFocused
                        ? valueInput
                        : valueInput !== ""
                        ? calculationMethod === "PERCENTAGE"
                          ? valueInput
                          : formatCurrency(Number(valueInput))
                        : ""
                    }
                    onFocus={() => {
                      setIsValueFocused(true);
                      setTimeout(() => {
                        const el = document.activeElement as HTMLInputElement;
                        if (el) el.select();
                      }, 0);
                    }}
                    onBlur={() => {
                      setIsValueFocused(false);
                      const numValue = parseFloat(
                        valueInput.replace(/[^\d.]/g, "")
                      );
                      if (!isNaN(numValue)) {
                        setValue("value", numValue);
                        setValueInput(numValue.toString());
                      } else {
                        setValue("value", null);
                        setValueInput("");
                      }
                    }}
                    onChange={(e) => {
                      // Only allow numbers and dot
                      const raw = e.target.value.replace(/[^\d.]/g, "");
                      setValueInput(raw);
                      setValue("value", raw === "" ? null : parseFloat(raw));
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 ${
                      errors.value ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder={
                      calculationMethod === "PERCENTAGE"
                        ? "e.g., 5"
                        : "e.g., 25000"
                    }
                  />
                  {calculationMethod === "PERCENTAGE" && (
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
                      %
                    </span>
                  )}
                  {errors.value && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.value.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {calculationMethod === "PERCENTAGE"
                      ? "Enter percentage (e.g., 5 for 5%)"
                      : "Enter amount in Naira (e.g., 25000 for ₦25,000)"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tax Brackets for Progressive */}
          {shouldShowTaxBrackets && (
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FaCalculator className="w-5 h-5 text-blue-600 mr-2" />
                Tax Brackets Configuration
              </h4>

              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Configure progressive tax rates based on income brackets. Each
                  bracket applies to income within the specified range.
                </p>

                <div className="space-y-3">
                  {taxBrackets && taxBrackets.length > 0 ? (
                    taxBrackets.map((bracket, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-3 bg-white rounded-lg border"
                      >
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Bracket {index + 1}
                          </label>
                          <div className="flex space-x-2">
                            <div className="flex-1">
                              <input
                                type="number"
                                value={bracket.min}
                                onChange={(e) => {
                                  const newBrackets = [...(taxBrackets || [])];
                                  newBrackets[index].min = Number(
                                    e.target.value
                                  );
                                  setValue("taxBrackets", newBrackets);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                placeholder="Min amount"
                                min={0}
                              />
                            </div>
                            <div className="flex items-center text-gray-500">
                              to
                            </div>
                            <div className="flex-1">
                              <input
                                type="number"
                                value={bracket.max || ""}
                                onChange={(e) => {
                                  const newBrackets = [...(taxBrackets || [])];
                                  newBrackets[index].max = e.target.value
                                    ? Number(e.target.value)
                                    : null;
                                  setValue("taxBrackets", newBrackets);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                placeholder="Max amount (leave empty for unlimited)"
                                min={0}
                              />
                            </div>
                            <div className="flex items-center text-gray-500">
                              at
                            </div>
                            <div className="w-20">
                              <input
                                type="number"
                                value={bracket.rate}
                                onChange={(e) => {
                                  const newBrackets = [...(taxBrackets || [])];
                                  newBrackets[index].rate = Number(
                                    e.target.value
                                  );
                                  setValue("taxBrackets", newBrackets);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                placeholder="Rate %"
                                min={0}
                                max={100}
                                step={0.1}
                              />
                            </div>
                            <div className="text-gray-500">%</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTaxBracket(index)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Remove bracket"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-400 text-sm py-4">
                      No tax brackets defined. <br />
                      <button
                        type="button"
                        onClick={addTaxBracket}
                        className="mt-2 py-1 px-3 border border-gray-300 rounded text-gray-600 hover:border-gray-400 hover:text-gray-800"
                      >
                        + Add Tax Bracket
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-500">
                  <p>• The first bracket should start from ₦0</p>
                  <p>• Each bracket applies to income within its range</p>
                  <p>
                    • Leave the max field empty for the highest bracket
                    (unlimited)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Voluntary Deduction Duration (Ongoing/One-off) */}
          {deductionType === "voluntary" && (
            <div className="bg-gray-50 rounded-xl p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deduction Duration
              </label>
              <div className="flex items-center space-x-6">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="deductionDuration"
                    value="ongoing"
                    checked={selectedDuration === "ongoing"}
                    onChange={() => setSelectedDuration("ongoing")}
                    className="form-radio text-green-600"
                  />
                  <span className="ml-2">Ongoing (applies every payroll)</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="deductionDuration"
                    value="one-off"
                    checked={selectedDuration === "one-off"}
                    onChange={() => setSelectedDuration("one-off")}
                    className="form-radio text-green-600"
                  />
                  <span className="ml-2">One-off (specific period)</span>
                </label>
              </div>
              {selectedDuration === "one-off" && (
                <div className="mt-4 flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Period Type
                    </label>
                    <select
                      value={selectedPeriodType}
                      onChange={(e) =>
                        setSelectedPeriodType(e.target.value as any)
                      }
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Biweekly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annual">Annual</option>
                    </select>
                  </div>
                  {selectedPeriodType === "monthly" && (
                    <div className="flex space-x-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Month
                        </label>
                        <select
                          value={selectedMonth}
                          onChange={(e) =>
                            setSelectedMonth(Number(e.target.value))
                          }
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          {[...Array(12)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {new Date(0, i).toLocaleString("default", {
                                month: "long",
                              })}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Year
                        </label>
                        <input
                          type="number"
                          value={selectedYear}
                          onChange={(e) =>
                            setSelectedYear(Number(e.target.value))
                          }
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm w-24"
                          min={2020}
                          max={2100}
                        />
                      </div>
                    </div>
                  )}
                  {selectedPeriodType === "weekly" && (
                    <div className="flex space-x-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Week
                        </label>
                        <input
                          type="number"
                          value={selectedWeek}
                          onChange={(e) =>
                            setSelectedWeek(Number(e.target.value))
                          }
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm w-24"
                          min={1}
                          max={53}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Year
                        </label>
                        <input
                          type="number"
                          value={selectedYear}
                          onChange={(e) =>
                            setSelectedYear(Number(e.target.value))
                          }
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm w-24"
                          min={2020}
                          max={2100}
                        />
                      </div>
                    </div>
                  )}
                  {selectedPeriodType === "biweekly" && (
                    <div className="flex space-x-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Biweek
                        </label>
                        <input
                          type="number"
                          value={selectedBiweek}
                          onChange={(e) =>
                            setSelectedBiweek(Number(e.target.value))
                          }
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm w-24"
                          min={1}
                          max={27}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Year
                        </label>
                        <input
                          type="number"
                          value={selectedYear}
                          onChange={(e) =>
                            setSelectedYear(Number(e.target.value))
                          }
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm w-24"
                          min={2020}
                          max={2100}
                        />
                      </div>
                    </div>
                  )}
                  {selectedPeriodType === "quarterly" && (
                    <div className="flex space-x-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Quarter
                        </label>
                        <select
                          value={selectedQuarter}
                          onChange={(e) =>
                            setSelectedQuarter(Number(e.target.value))
                          }
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          {[1, 2, 3, 4].map((q) => (
                            <option key={q} value={q}>
                              Q{q}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Year
                        </label>
                        <input
                          type="number"
                          value={selectedYear}
                          onChange={(e) =>
                            setSelectedYear(Number(e.target.value))
                          }
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm w-24"
                          min={2020}
                          max={2100}
                        />
                      </div>
                    </div>
                  )}
                  {selectedPeriodType === "annual" && (
                    <div className="flex space-x-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Year
                        </label>
                        <input
                          type="number"
                          value={selectedYear}
                          onChange={(e) =>
                            setSelectedYear(Number(e.target.value))
                          }
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm w-24"
                          min={2020}
                          max={2100}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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

              {/* Department dropdown if scope is department */}
              {scope === "department" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Department *
                  </label>
                  <Select
                    name="department"
                    options={departmentOptions}
                    className="basic-single"
                    classNamePrefix="select"
                    value={
                      departmentOptions.find(
                        (opt) => opt.value === watch("department")
                      ) || null
                    }
                    onChange={(selected) =>
                      setValue("department", selected?.value)
                    }
                    styles={{
                      menu: (provided) => ({ ...provided, zIndex: 9999 }),
                      control: (provided) => ({
                        ...provided,
                        minHeight: 48,
                        borderRadius: 8,
                        borderColor: "#22c55e",
                      }),
                    }}
                    placeholder="Select department..."
                  />
                  {errors.department && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.department.message}
                    </p>
                  )}
                </div>
              )}

              {/* Employee multi-select if scope is individual */}
              {scope === "individual" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign to Employees *
                  </label>
                  <Select
                    isMulti
                    name="assignedEmployees"
                    options={employeeOptions}
                    className="basic-multi-select"
                    classNamePrefix="select"
                    value={employeeOptions.filter((opt) =>
                      (watch("assignedEmployees") || []).includes(opt.value)
                    )}
                    onChange={(selected) =>
                      setValue(
                        "assignedEmployees",
                        selected ? selected.map((opt) => opt.value) : []
                      )
                    }
                    styles={{
                      menu: (provided) => ({ ...provided, zIndex: 9999 }),
                      control: (provided) => ({
                        ...provided,
                        minHeight: 48,
                        borderRadius: 8,
                        borderColor: "#22c55e",
                      }),
                    }}
                    placeholder="Select employees..."
                  />
                  {errors.assignedEmployees && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.assignedEmployees.message}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Effective Date *
                </label>
                <input
                  type="date"
                  {...register("effectiveDate", {
                    required: "Effective date is required",
                    validate: (value) => {
                      const selectedDate = new Date(value);
                      // Allow any date - deductions will be included if effective during payroll period
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      if (selectedDate < today) {
                        return "Effective date cannot be in the past";
                      }
                      return true;
                    },
                  })}
                  min={minDate}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 ${
                    errors.effectiveDate ? "border-red-300" : "border-gray-300"
                  }`}
                />
                {errors.effectiveDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.effectiveDate.message}
                  </p>
                )}
                {/* Updated helper text for new deduction logic */}
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h5 className="text-sm font-medium text-blue-800 mb-1">
                    📅 Payroll Period Logic
                  </h5>
                  <p className="text-xs text-blue-700 mb-2">
                    <strong>
                      When will this deduction be included in payroll?
                    </strong>
                  </p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>
                      • <strong>Monthly Payroll:</strong> Deduction effective ≤
                      last day of month
                    </li>
                    <li>
                      • <strong>Weekly Payroll:</strong> Deduction effective ≤
                      end of week
                    </li>
                    <li>
                      • <strong>Biweekly Payroll:</strong> Deduction effective ≤
                      end of biweek
                    </li>
                    <li>
                      • <strong>Quarterly Payroll:</strong> Deduction effective
                      ≤ end of quarter
                    </li>
                    <li>
                      • <strong>Annual Payroll:</strong> Deduction effective ≤
                      end of year
                    </li>
                  </ul>
                  <p className="text-xs text-blue-700 mt-2">
                    <strong>Example:</strong> For June 2025 monthly payroll,
                    deductions effective on or before June 30th, 2025 will be
                    included.
                  </p>
                </div>
                {/* Specific guidance for the selected date */}
                {watch("effectiveDate") && (
                  <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded">
                    <p className="text-xs text-gray-600">
                      <strong>Your selection:</strong> Effective{" "}
                      {new Date(watch("effectiveDate")).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-600">
                      This deduction will be included in payroll periods where
                      the effective date falls within the payroll period.
                    </p>
                  </div>
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
