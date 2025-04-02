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
import { ComponentType, CreateSalaryGradeDTO } from "../../types/salary";
import { useAuth } from "../../context/AuthContext";
import { Permission } from "../../types/auth";
import { departmentService } from "../../services/departmentService";
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

interface ComponentState {
  name: string;
  type: ComponentType;
  calculationMethod: "fixed" | "percentage";
  value: number;
  isActive: boolean;
}

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
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<DepartmentBasic[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [components, setComponents] = useState<ComponentState[]>([
    {
      name: "",
      type: "allowance",
      calculationMethod: "fixed",
      value: 0,
      isActive: true,
    },
  ]);

  // Update the department change handler
  const handleDeptChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    console.log("🏢 Department Selection:", {
      selectedValue: value,
      foundDepartment: departments.find((d) => d._id === value),
    });
    setSelectedDept(value || "");
  };

  // Check if user can manage all departments' salary structure
  const canManageAllDepartments = user?.permissions?.includes(
    Permission.MANAGE_SALARY_STRUCTURE
  );

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        if (canManageAllDepartments) {
          const deps = await departmentService.getAllDepartments();
          setDepartments(deps);
        }
      } catch (error) {
        toast.error("Failed to initialize form");
        onClose();
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      initialize();
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

  const handleFormSubmit = async (data: SalaryGradeFormData) => {
    try {
      setLoading(true);

      const validComponents = components.filter(
        (comp) => comp.name.trim() !== "" && comp.value !== 0
      );

      if (validComponents.length === 0) {
        toast.error("Please add at least one valid salary component");
        return;
      }

      const formData: CreateSalaryGradeDTO = {
        level: data.level,
        basicSalary: Number(data.basicSalary),
        description: data.description || `Grade Level ${data.level.slice(-2)}`,
        department: selectedDept || null,
        components: validComponents.map((comp) => ({
          name: comp.name.trim(),
          type: "allowance",
          calculationMethod: comp.calculationMethod,
          value: Number(comp.value),
          isActive: comp.isActive,
        })),
      };

      console.log("📤 Creating salary grade with data:", formData);

      await salaryStructureService.createSalaryGrade(formData);
      toast.success("Salary grade created successfully");
      reset();
      setComponents([
        {
          name: "",
          type: "allowance",
          calculationMethod: "fixed",
          value: 0,
          isActive: true,
        },
      ]);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("❌ Creation error:", error);
      toast.error(
        error.response?.data?.message || "Failed to create salary grade"
      );
    } finally {
      setLoading(false);
    }
  };

  const addComponent = () => {
    setComponents([
      ...components,
      {
        name: "",
        type: "allowance",
        calculationMethod: "fixed",
        value: 0,
        isActive: true,
      },
    ]);
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
      className="overflow-hidden"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <CircularProgress size={40} className="!text-green-600" />
          <p className="text-gray-500">Initializing form...</p>
        </div>
      ) : (
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
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
                  className="grid grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg"
                >
                  <TextField
                    value={component.name}
                    onChange={(e) => {
                      const newComponents = [...components];
                      newComponents[index].name = e.target.value;
                      setComponents(newComponents);
                    }}
                    label="Component Name"
                    variant="outlined"
                    fullWidth
                  />
                  <Select
                    value={component.calculationMethod}
                    onChange={(e) => {
                      const newComponents = [...components];
                      newComponents[index].calculationMethod = e.target
                        .value as "fixed" | "percentage";
                      setComponents(newComponents);
                    }}
                    fullWidth
                  >
                    <MenuItem value="fixed">Fixed Amount</MenuItem>
                    <MenuItem value="percentage">Percentage of Basic</MenuItem>
                  </Select>
                  <TextField
                    value={component.value === 0 ? "" : component.value}
                    onChange={(e) => {
                      const newComponents = [...components];
                      const value =
                        e.target.value === "" ? 0 : Number(e.target.value);
                      newComponents[index] = {
                        ...newComponents[index],
                        value: value,
                      };
                      setComponents(newComponents);
                    }}
                    label={
                      component.calculationMethod === "percentage"
                        ? "Value (%)"
                        : "Value (₦)"
                    }
                    type="number"
                    variant="outlined"
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <span
                          className={`text-sm ${
                            component.calculationMethod === "percentage"
                              ? "text-blue-600"
                              : "text-green-600"
                          }`}
                        >
                          {component.calculationMethod === "percentage"
                            ? "% of Basic"
                            : "Fixed Amount"}
                        </span>
                      ),
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
                    value={selectedDept}
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

            {/* Form Actions - Note: These should stay visible while scrolling */}
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
                disabled={loading || isSubmitting}
                className="px-6 py-2 text-sm font-medium text-white !bg-green-600 rounded-md hover:bg-green-700 flex items-center space-x-2"
              >
                {loading ? (
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
      )}
    </BaseModal>
  );
}
