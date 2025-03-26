import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  NativeSelect,
} from "@mui/material";
import { CircularProgress } from "@mui/material";
import { toast } from "react-toastify";
import { BaseModal } from "../shared/BaseModal";
import { salaryStructureService } from "../../services/salaryStructureService";
import {
  ComponentType,
  CalculationMethod,
  ISalaryComponentInput,
  CreateSalaryGradeDTO,
} from "../../types/salary";
import { useAuth } from "../../context/AuthContext";
import { Permission } from "../../types/auth";
import {
  departmentService,
  Department,
} from "../../services/departmentService";
import { DepartmentBasic } from "../../types/employee";

const salaryGradeSchema = z.object({
  level: z
    .string()
    .min(1, "Grade level is required")
    .regex(/^GL-\d{2}$/, "Grade level must be in format GL-XX (e.g., GL-01)"),
  basicSalary: z
    .number()
    .min(30000, "Basic salary must be at least ₦30,000")
    .max(1000000, "Basic salary cannot exceed ₦1,000,000")
    .optional()
    .transform((val) => (val === undefined ? null : val)),
  description: z
    .string()
    .optional()
    .transform((val) => val || ""),
  departmentId: z.string().optional(),
});

type SalaryGradeFormData = z.infer<typeof salaryGradeSchema>;

interface NewSalaryGradeProps {
  onClose: () => void;
  onSuccess: () => void;
  isOpen: boolean;
}

const defaultComponent: ISalaryComponentInput = {
  name: "",
  type: "allowance",
  calculationMethod: "fixed",
  value: 0,
  isActive: true,
};

export default function NewSalaryGrade({
  onClose,
  onSuccess,
  isOpen,
}: NewSalaryGradeProps) {
  const { user } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SalaryGradeFormData>({
    resolver: zodResolver(salaryGradeSchema),
    defaultValues: {
      level: "",
      basicSalary: undefined,
      description: "",
      departmentId: "",
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [components, setComponents] = useState<ISalaryComponentInput[]>([
    defaultComponent,
  ]);
  const [departments, setDepartments] = useState<DepartmentBasic[]>([]);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  // Watch the departmentId value
  const selectedDepartmentWatch = watch("departmentId");

  // Update the department change handler
  const handleDeptChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    console.log("🏢 Department Selection:", {
      selectedValue: value,
      foundDepartment: departments.find((d) => d._id === value),
    });
    setSelectedDept(value || null);
  };

  // Check if user can manage all departments' salary structure
  const canManageAllDepartments = user?.permissions?.includes(
    Permission.MANAGE_SALARY_STRUCTURE
  );

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        if (canManageAllDepartments) {
          const deps = await departmentService.getAllDepartments();
          if (deps && deps.length > 0) {
            const formattedDeps = deps.map((dept: Department) => ({
              _id: dept._id,
              name: dept.name,
              code: dept.code,
            }));
            setDepartments(formattedDeps);
          } else {
            console.warn("⚠️ No departments returned from API");
          }
        } else {
          console.log("🚫 User cannot manage all departments");
        }
      } catch (error) {
        console.error("❌ Failed to load departments:", error);
        toast.error("Failed to load departments");
      }
    };

    if (isOpen) {
      loadDepartments();
    }
  }, [isOpen, canManageAllDepartments]);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log("Form validation errors:", errors);
    }
  }, [errors]);

  useEffect(() => {
    console.log("👤 User permissions:", {
      permissions: user?.permissions,
      canManageAll: canManageAllDepartments,
      hasViewPermission: user?.permissions?.includes(
        Permission.VIEW_ALL_DEPARTMENTS
      ),
    });
  }, [user, canManageAllDepartments]);

  const handleComponentChange = (
    index: number,
    field: keyof ISalaryComponentInput,
    value: any
  ) => {
    const newComponents = [...components];
    newComponents[index] = {
      ...newComponents[index],
      [field]: value,
    };
    setComponents(newComponents);
  };

  const handleFormSubmit = async (data: SalaryGradeFormData) => {
    try {
      setIsLoading(true);
      console.log("🚀 Starting form submission");

      // Validate components
      if (components.length === 0) {
        toast.error("At least one salary component is required");
        return;
      }

      // Validate component data
      const invalidComponents = components.filter(
        (comp) => !comp.name || comp.value <= 0
      );
      if (invalidComponents.length > 0) {
        toast.error("All components must have a name and positive value");
        return;
      }

      const payload: CreateSalaryGradeDTO = {
        level: data.level,
        basicSalary: Number(data.basicSalary),
        description: data.description || "",
        department: selectedDept,
        components: components.map((comp) => ({
          name: comp.name.trim(),
          type: comp.type,
          calculationMethod: comp.calculationMethod,
          value: Number(comp.value),
          isActive: comp.isActive,
        })),
      };

      console.log("📤 Sending formatted data:", payload);

      await salaryStructureService.createSalaryGrade(payload);
      toast.success("Salary grade created successfully");
      reset();
      setComponents([defaultComponent]);
      onSuccess();
    } catch (error: any) {
      console.error("❌ Submission error:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to create salary grade. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const addComponent = () => {
    setComponents([...components, { ...defaultComponent }]);
  };

  const removeComponent = (index: number) => {
    if (components.length === 1) {
      toast.warning("At least one component is required");
      return;
    }
    const newComponents = [...components];
    newComponents.splice(index, 1);
    setComponents(newComponents);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Salary Grade"
      maxWidth="max-w-4xl"
    >
      <div className="max-h-[80vh] overflow-y-auto p-4">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                1
              </span>
              Basic Information
            </h4>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <TextField
                {...register("level")}
                label="Grade Level"
                error={!!errors.level}
                helperText={errors.level?.message}
                required
              />
              <TextField
                {...register("basicSalary", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
                label="Basic Salary"
                type="number"
                error={!!errors.basicSalary}
                helperText={errors.basicSalary?.message}
                required
              />
              <TextField
                {...register("description")}
                label="Description"
                error={!!errors.description}
                helperText={errors.description?.message}
                multiline
                rows={4}
                className="col-span-2"
              />
            </div>
          </div>

          {/* Salary Components */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  2
                </span>
                Salary Components
              </h4>
              <button
                type="button"
                onClick={addComponent}
                className="text-green-600 hover:text-green-700"
              >
                + Add Component
              </button>
            </div>

            {components.map((component, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg"
              >
                <TextField
                  value={component.name}
                  onChange={(e) =>
                    handleComponentChange(index, "name", e.target.value)
                  }
                  label="Component Name"
                  variant="outlined"
                  fullWidth
                />
                <Select
                  value={component.type}
                  onChange={(e) =>
                    handleComponentChange(
                      index,
                      "type",
                      e.target.value as ComponentType
                    )
                  }
                  fullWidth
                >
                  <MenuItem value="allowance">Allowance</MenuItem>
                  <MenuItem value="deduction">Deduction</MenuItem>
                </Select>
                <Select
                  value={component.calculationMethod}
                  onChange={(e) =>
                    handleComponentChange(
                      index,
                      "calculationMethod",
                      e.target.value as CalculationMethod
                    )
                  }
                  fullWidth
                >
                  <MenuItem value="fixed">Fixed Amount</MenuItem>
                  <MenuItem value="percentage">Percentage</MenuItem>
                </Select>
                <TextField
                  value={component.value === 0 ? "" : component.value}
                  onChange={(e) =>
                    handleComponentChange(
                      index,
                      "value",
                      Number(e.target.value)
                    )
                  }
                  label={
                    component.calculationMethod === "percentage"
                      ? "Value (%)"
                      : "Value (₦)"
                  }
                  type="text"
                  variant="outlined"
                  fullWidth
                  InputProps={{
                    endAdornment: (
                      <span
                        className={`text-sm ${
                          component.calculationMethod === "percentage"
                            ? "text-green-600"
                            : "text-green-600"
                        }`}
                      >
                        {component.calculationMethod === "percentage"
                          ? "% of Basic"
                          : "Fixed Amount"}
                      </span>
                    ),
                  }}
                  className="component-value-field"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "&.Mui-focused fieldset": {
                        borderColor:
                          component.calculationMethod === "percentage"
                            ? "#2563eb"
                            : "#059669",
                      },
                    },
                  }}
                />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={component.isActive}
                      onChange={(e) => {
                        const newComponents = [...components];
                        newComponents[index].isActive = e.target.checked;
                        setComponents(newComponents);
                      }}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <label className="text-sm text-gray-600">Active</label>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeComponent(index)}
                    className="text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Only show department selection if user has permission */}
          {canManageAllDepartments && (
            <div className="space-y-1">
              <FormControl fullWidth>
                <div className="mb-1">
                  <label
                    htmlFor="department-select"
                    className="text-sm font-medium text-gray-700"
                  >
                    Select Department
                  </label>
                </div>
                <NativeSelect
                  value={selectedDept ?? ""}
                  onChange={handleDeptChange}
                  inputProps={{
                    id: "department-select",
                    className: "p-2 border rounded w-full bg-white",
                  }}
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </NativeSelect>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedDept
                    ? "This grade will be specific to the selected department"
                    : "Leave empty to make this grade available to all departments"}
                </p>
              </FormControl>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="px-6 py-2 text-sm font-medium text-white !bg-green-600 rounded-md hover:bg-green-700 flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <CircularProgress size={20} color="inherit" />
                  <span>Creating...</span>
                </>
              ) : (
                "Create Grade"
              )}
            </button>
          </div>
        </form>
      </div>
    </BaseModal>
  );
}
