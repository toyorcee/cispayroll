import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { TextField, Select, MenuItem, FormControl } from "@mui/material";
import { CircularProgress } from "@mui/material";
import { toast } from "react-toastify";
import { BaseModal } from "../shared/BaseModal";
import { salaryStructureService } from "../../services/salaryStructureService";
import {
  ISalaryGrade,
  ISalaryComponent,
  ComponentType,
  UpdateSalaryGradeInput,
} from "../../types/salary";
import { useAuth } from "../../context/AuthContext";
import { Permission } from "../../types/auth";
import { departmentService } from "../../services/departmentService";
import { DepartmentBasic } from "../../types/department";
import { SelectChangeEvent } from "@mui/material/Select";

interface EditSalaryGradeProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  grade: ISalaryGrade;
}

const salaryGradeSchema = z.object({
  level: z
    .string()
    .min(1, "Grade level is required")
    .regex(/^GL-\d{2}$/, "Grade level must be in format GL-XX (e.g., GL-01)"),
  basicSalary: z
    .number()
    .min(30000, "Basic salary must be at least ₦30,000")
    .max(1000000, "Basic salary cannot exceed ₦1,000,000"),
  description: z
    .string()
    .optional()
    .transform((val) => val || ""),
  departmentId: z.string().optional(),
});

type SalaryGradeFormData = z.infer<typeof salaryGradeSchema>;

interface ComponentState
  extends Omit<ISalaryComponent, "_id" | "createdBy" | "updatedBy"> {
  _id?: string;
  createdBy?: string;
  updatedBy?: string;
}

export default function EditSalaryGrade({
  isOpen,
  onClose,
  onSuccess,
  grade,
}: EditSalaryGradeProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<DepartmentBasic[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [components, setComponents] = useState<ComponentState[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SalaryGradeFormData>({
    resolver: zodResolver(salaryGradeSchema),
  });

  const canManageAllDepartments = user?.permissions?.includes(
    Permission.MANAGE_SALARY_STRUCTURE
  );

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);

        // Fetch fresh grade data
        const freshGrade = await salaryStructureService.getSalaryGrade(
          grade._id
        );

        // Load departments if user has permission
        if (canManageAllDepartments) {
          const deps = await departmentService.getAllDepartments(
            user?.role,
            user?.permissions
          );
          setDepartments(deps);
        }

        // Set initial values
        setSelectedDept(freshGrade.department?._id || "");
        setComponents(
          freshGrade.components.map((comp) => ({
            _id: comp._id,
            name: comp.name,
            type: comp.type,
            calculationMethod: comp.calculationMethod,
            value: comp.value,
            isActive: comp.isActive,
            createdBy: comp.createdBy,
            updatedBy: comp.updatedBy,
          }))
        );

        // Reset form with fresh data
        reset({
          level: freshGrade.level,
          basicSalary: freshGrade.basicSalary,
          description: freshGrade.description || "",
          departmentId: freshGrade.department?._id || "",
        });
      } catch (error) {
        console.error("Failed to initialize form:", error);
        toast.error("Failed to load grade details");
        onClose();
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      initialize();
    }
  }, [isOpen, grade._id, canManageAllDepartments, reset]);

  const handleDeptChange = (event: SelectChangeEvent<string>) => {
    setSelectedDept(event.target.value);
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
    setComponents(components.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (data: SalaryGradeFormData) => {
    try {
      setIsSubmitting(true);

      const validComponents = components.filter(
        (comp) => comp.name.trim() !== "" && comp.value !== 0
      );

      if (validComponents.length === 0) {
        toast.error("Please add at least one valid salary component");
        return;
      }

      const formData: UpdateSalaryGradeInput = {
        level: data.level,
        basicSalary: Number(data.basicSalary),
        description: data.description,
        department: selectedDept || undefined,
        components: validComponents.map((comp) => ({
          _id: comp._id?.toString(),
          name: comp.name,
          type: "allowance" as ComponentType,
          calculationMethod: comp.calculationMethod,
          value: Number(comp.value),
          isActive: comp.isActive,
          createdBy: comp.createdBy?.toString(),
          updatedBy: user?._id,
        })),
      };

      console.log(
        "Updating salary grade with components:",
        formData.components
      );

      await salaryStructureService.updateSalaryGrade(
        grade._id.toString(),
        formData
      );
      toast.success("Salary grade updated successfully");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to update salary grade"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Salary Grade"
      maxWidth="max-w-4xl"
      className="overflow-hidden"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <CircularProgress size={40} className="!text-green-600" />
          <p className="text-gray-500">Loading grade details...</p>
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
                    <MenuItem value="fixed">Fixed</MenuItem>
                    <MenuItem value="percentage">Percentage</MenuItem>
                  </Select>
                  <TextField
                    value={component.value === 0 ? "" : component.value}
                    onChange={(e) => {
                      const newComponents = [...components];
                      const value =
                        e.target.value === "" ? 0 : parseFloat(e.target.value);
                      if (!isNaN(value)) {
                        newComponents[index] = {
                          ...newComponents[index],
                          value: value,
                        };
                        setComponents(newComponents);
                      }
                    }}
                    label={
                      component.calculationMethod === "percentage"
                        ? "Value (%)"
                        : "Value (₦)"
                    }
                    type="number"
                    variant="outlined"
                    fullWidth
                    inputProps={{
                      step:
                        component.calculationMethod === "percentage"
                          ? "0.01"
                          : "1",
                      min: 0,
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

            {/* Department Selection */}
            {canManageAllDepartments && (
              <div className="space-y-1">
                <FormControl fullWidth>
                  <div className="mb-1">
                    <label className="text-sm font-medium text-gray-700">
                      Select Department
                    </label>
                  </div>
                  <Select
                    value={selectedDept}
                    onChange={handleDeptChange}
                    displayEmpty
                    className="bg-white"
                  >
                    <MenuItem value="">All Departments</MenuItem>
                    {departments.map((dept) => (
                      <MenuItem key={dept._id} value={dept._id}>
                        {dept.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedDept
                      ? `Department: ${
                          departments.find((d) => d._id === selectedDept)
                            ?.name || "Unknown"
                        }`
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
                disabled={isSubmitting}
                className="px-6 py-2 text-sm font-medium text-white !bg-green-600 rounded-md hover:bg-green-700 flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <CircularProgress size={20} color="inherit" />
                    <span>Updating...</span>
                  </>
                ) : (
                  "Update Grade"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </BaseModal>
  );
}
