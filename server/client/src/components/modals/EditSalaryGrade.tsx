import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { TextField, Select, MenuItem, FormControl } from "@mui/material";
import { CircularProgress } from "@mui/material";
import { toast } from "react-toastify";
import { BaseModal } from "../shared/BaseModal";
import { salaryStructureService } from "../../services/salaryStructureService";
import { ISalaryGrade } from "../../types/salary";
import { useAuth } from "../../context/AuthContext";
import { Permission } from "../../types/auth";
import { employeeService } from "../../services/employeeService";
import { DepartmentBasic } from "../../types/employee";
import { Types } from "mongoose";
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

interface ComponentState {
  _id?: string | Types.ObjectId;
  name: string;
  type: "fixed" | "percentage";
  value: number;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
}

export default function EditSalaryGrade({
  isOpen,
  onClose,
  onSuccess,
  grade,
}: EditSalaryGradeProps) {
  console.log("🔄 EditSalaryGrade Initial Data:", {
    gradeDepartment: grade.department,
    deptId: grade.department?._id,
    deptName: grade.department?.name,
  });

  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<DepartmentBasic[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>(() => {
    const deptId = grade.department?._id || "";
    console.log("🏢 Setting initial department:", {
      deptId,
      deptName: grade.department?.name,
      fullDepartment: grade.department,
    });
    return deptId;
  });
  const [components, setComponents] = useState<ComponentState[]>(
    grade.components.map((comp) => ({
      _id: comp._id,
      name: comp.name,
      type: comp.type,
      value: comp.value,
      isActive: comp.isActive,
      createdBy: comp.createdBy,
      updatedBy: comp.updatedBy,
    }))
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SalaryGradeFormData>({
    resolver: zodResolver(salaryGradeSchema),
    defaultValues: {
      level: grade.level,
      basicSalary: grade.basicSalary,
      description: grade.description || "",
      departmentId: grade.department?._id || "",
    },
  });

  const handleDeptChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    console.log("🏢 Department Selection:", {
      selectedValue: value,
      foundDepartment: departments.find((d) => d._id === value),
    });
    setSelectedDept(value);
  };

  const canManageAllDepartments = user?.permissions?.includes(
    Permission.MANAGE_SALARY_STRUCTURE
  );

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        if (canManageAllDepartments) {
          const deps = await employeeService.getDepartments();
          console.log("📋 Loaded departments:", {
            deps,
            currentDeptId: selectedDept,
            gradeDeptId: grade.department?._id,
          });
          setDepartments(deps);
        }
      } catch (error) {
        console.error("❌ Failed to load departments:", error);
        toast.error("Failed to load departments");
      }
    };

    if (isOpen) {
      console.log("🔓 Modal opened, loading departments");
      loadDepartments();
    }
  }, [isOpen, canManageAllDepartments]);

  useEffect(() => {
    console.log("🎨 Render state:", {
      selectedDept,
      departments,
      currentDeptId: grade.department?._id,
      currentDeptName: grade.department?.name,
    });
  }, [selectedDept, departments, grade.department]);

  const addComponent = () => {
    setComponents([
      ...components,
      {
        name: "",
        type: "percentage" as const,
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
      setIsLoading(true);

      const validComponents = components.filter(
        (comp) => comp.name.trim() !== "" && comp.value !== 0
      );

      if (validComponents.length === 0) {
        toast.error("Please add at least one valid salary component");
        return;
      }

      const formattedComponents = validComponents.map((comp) => ({
        ...comp,
        _id: comp._id
          ? new Types.ObjectId(comp._id.toString())
          : new Types.ObjectId(),
      }));

      const formData = {
        level: data.level,
        basicSalary: Number(data.basicSalary),
        description: data.description,
        department: selectedDept || undefined,
        components: formattedComponents.map((comp) => ({
          name: comp.name,
          type: comp.type,
          value: Number(comp.value),
          isActive: comp.isActive,
          _id: comp._id?.toString(),
          createdBy: comp.createdBy?.toString(),
          updatedBy: user?.id,
        })),
      };

      console.log("📤 Submitting form data:", formData);

      await salaryStructureService.updateSalaryGrade(
        grade._id.toString(),
        formData
      );
      toast.success("Salary grade updated successfully");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("❌ Update failed:", error.response?.data || error);
      toast.error(
        error.response?.data?.message || "Failed to update salary grade"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Salary Grade"
      maxWidth="max-w-4xl"
    >
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
                value={component.type}
                onChange={(e) => {
                  const newComponents = [...components];
                  newComponents[index].type = e.target.value as
                    | "fixed"
                    | "percentage";
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
                  component.type === "percentage" ? "Value (%)" : "Value (₦)"
                }
                type="number"
                variant="outlined"
                fullWidth
                inputProps={{
                  step: component.type === "percentage" ? "0.01" : "1",
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
                {departments.map((dept) => {
                  console.log("🏢 Mapping department:", {
                    dept,
                    isSelected: dept._id === selectedDept,
                  });
                  return (
                    <MenuItem key={dept._id} value={dept._id}>
                      {dept.name}
                    </MenuItem>
                  );
                })}
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                {selectedDept
                  ? `Department: ${
                      departments.find((d) => d._id === selectedDept)?.name ||
                      "Unknown"
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
            disabled={isLoading}
            className="px-6 py-2 text-sm font-medium text-white !bg-green-600 rounded-md hover:bg-green-700 flex items-center space-x-2"
          >
            {isLoading ? (
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
    </BaseModal>
  );
}
