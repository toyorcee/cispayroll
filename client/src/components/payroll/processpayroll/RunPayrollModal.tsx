import { useState, useEffect } from "react";
import { BaseModal } from "../../shared/BaseModal";
import { employeeService } from "../../../services/employeeService";
import { departmentService } from "../../../services/departmentService";
import { payrollService } from "../../../services/payrollService";
import {
  useQuery,
  UseQueryResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "react-toastify";
import { FaSpinner, FaCheckCircle } from "react-icons/fa";
import {
  DepartmentEmployee,
  DepartmentEmployeeResponse,
} from "../../../types/employee";
import { PayrollFrequency, PayrollData } from "../../../types/payroll";
import React from "react";

interface PayrollFormData {
  month: number;
  year: number;
  employee: string;
  salaryGrade: string;
  basicSalary: number;
  components: Array<{
    name: string;
    type: "allowance" | "deduction";
    value: number;
    calculationMethod: "fixed" | "percentage";
  }>;
}

interface RunPayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: PayrollData | null;
}

// Success Animation Component
const SuccessAnimation = () => (
  <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="text-center">
      <FaCheckCircle className="mx-auto h-16 w-16 text-green-500 animate-bounce" />
      <p className="mt-4 text-lg font-medium text-gray-900">
        Payroll Processed Successfully!
      </p>
    </div>
  </div>
);

export const RunPayrollModal = ({
  isOpen,
  onClose,
  onSuccess,
  editData,
}: RunPayrollModalProps) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [payrollData, setPayrollData] = useState<PayrollFormData>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    employee: "",
    salaryGrade: "",
    basicSalary: 0,
    components: [],
  });
  const [showSuccess, setShowSuccess] = useState(false);

  // Add updatePayrollMutation
  const updatePayrollMutation = useMutation({
    mutationFn: (data: { payrollId: string; updateData: PayrollFormData }) =>
      payrollService.updatePayroll(data.payrollId, data.updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
      toast.success("Payroll updated successfully");
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      console.error("Error updating payroll:", error);
      toast.error(error.message || "Failed to update payroll");
    },
  });

  // Add createPayrollMutation
  const createPayrollMutation = useMutation({
    mutationFn: (data: PayrollFormData) =>
      payrollService.createPayroll({
        ...data,
        frequency: PayrollFrequency.MONTHLY,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
      toast.success("Payroll created successfully");
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      console.error("Error creating payroll:", error);
      toast.error(error.message || "Failed to create payroll");
    },
  });

  // Prefill form data when editing
  useEffect(() => {
    if (editData) {
      console.log("Populating edit data:", editData);

      // Set department and employee
      setSelectedDepartment(editData.department._id);
      setSelectedEmployee(editData.employee._id);

      // Get components from allowances
      const allowanceComponents =
        editData.allowances?.gradeAllowances?.map((allowance) => ({
          name: allowance.name,
          type: "allowance" as const,
          value: allowance.value,
          calculationMethod:
            allowance.type === "fixed"
              ? ("fixed" as const)
              : ("percentage" as const),
        })) || [];

      // Set payroll data with pre-populated values
      setPayrollData({
        month: editData.month,
        year: editData.year,
        employee: editData.employee._id,
        salaryGrade: editData.salaryGrade.level || "",
        basicSalary: editData.basicSalary,
        components: allowanceComponents,
      });
    }
  }, [editData]);

  // Disable fields when editing
  const isEditing = Boolean(editData);

  // Add salary grade fetching
  const { data: salaryGrades } = useQuery({
    queryKey: ["salaryGrades"],
    queryFn: () => payrollService.getSalaryGrades(),
  });

  // Fetch departments
  const { data: departments = [], isLoading: isLoadingDepartments } =
    departmentService.useGetDepartments();

  console.log("🏢 Departments Data:", {
    isLoading: isLoadingDepartments,
    departmentsCount: departments.length,
    departments,
  });

  // Fetch employees only when department is selected
  const {
    data: employeeResponse,
    isLoading: isLoadingEmployees,
    error: employeeError,
  }: UseQueryResult<DepartmentEmployeeResponse, Error> = useQuery({
    queryKey: ["departmentEmployees", selectedDepartment],
    queryFn: async () => {
      console.log("👥 Fetching employees for dept:", selectedDepartment);
      const result = await employeeService.getDepartmentEmployees(
        selectedDepartment,
        { page: 1, limit: 100 }
      );
      return result;
    },
    enabled: Boolean(selectedDepartment),
  });

  // Handle errors separately
  React.useEffect(() => {
    if (employeeError) {
      console.error("❌ Query error:", employeeError);
      toast.error("Failed to fetch employees");
    }
  }, [employeeError]);

  // Type guard to ensure employeeResponse is DepartmentEmployeeResponse
  const employees = employeeResponse?.employees ?? [];
  console.log("👥 Processed Employees:", {
    count: employees.length,
    employees,
  });

  // Get selected employee data for preview
  const selectedEmployeeData = selectedEmployee
    ? employees.find((emp) => emp._id === selectedEmployee)
    : null;

  // Get salary grade for preview
  const selectedSalaryGrade = selectedEmployeeData
    ? salaryGrades?.find(
        (grade) => grade.level === selectedEmployeeData.gradeLevel
      )
    : null;

  const handleDepartmentChange = (departmentId: string) => {
    setSelectedDepartment(departmentId);
    setSelectedEmployee("");
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setShowSuccess(false);

      const selectedEmployeeData = employees.find(
        (emp) => emp._id === selectedEmployee
      );

      if (!selectedEmployeeData) {
        toast.error("Please select an employee");
        return;
      }

      const salaryGrade = salaryGrades?.find(
        (grade) => grade.level === selectedEmployeeData.gradeLevel
      );

      if (!salaryGrade?._id) {
        toast.error("Invalid salary grade for employee");
        return;
      }

      const formData: PayrollFormData = {
        month: payrollData.month,
        year: payrollData.year,
        employee: selectedEmployee,
        salaryGrade: salaryGrade._id,
        basicSalary: salaryGrade.basicSalary,
        components: payrollData.components,
      };

      if (editData) {
        await updatePayrollMutation.mutateAsync({
          payrollId: editData._id,
          updateData: formData,
        });
      } else {
        await createPayrollMutation.mutateAsync(formData);
      }

      // Show success animation
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      console.error("❌ Payroll operation failed:", error);
      toast.error(
        editData ? "Failed to update payroll" : "Failed to create payroll"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Log when modal opens/closes
  console.log("🔄 Modal State:", { isOpen, isSubmitting });

  return (
    <>
      {/* Success Animation Overlay */}
      {showSuccess && <SuccessAnimation />}
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title={isEditing ? "Edit Payroll" : "Run New Payroll"}
      >
        <div className="space-y-6 p-6 max-h-[70vh] overflow-y-auto">
          {/* Period Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Month
              </label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300"
                value={payrollData.month}
                onChange={(e) =>
                  setPayrollData((prev) => ({
                    ...prev,
                    month: parseInt(e.target.value),
                  }))
                }
                disabled={isEditing}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2000, i).toLocaleString("default", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Year
              </label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300"
                value={payrollData.year}
                onChange={(e) =>
                  setPayrollData((prev) => ({
                    ...prev,
                    year: parseInt(e.target.value),
                  }))
                }
                disabled={isEditing}
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Department Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Department
            </label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300"
              value={selectedDepartment}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              disabled={isLoadingDepartments || isEditing}
            >
              <option value="">
                {isLoadingDepartments
                  ? "Loading departments..."
                  : "Select a department"}
              </option>
              {!isLoadingDepartments &&
                departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Employee Selection */}
          {(selectedDepartment || isEditing) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Employee
              </label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                disabled={isLoadingEmployees || isEditing}
              >
                <option value="">
                  {isLoadingEmployees
                    ? "Loading employees..."
                    : "Select an employee"}
                </option>
                {!isLoadingEmployees &&
                  employees.map((employee: DepartmentEmployee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.firstName} {employee.lastName} (
                      {employee.employeeId}){employee.isHOD ? " - HOD" : ""} -{" "}
                      {employee.position}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Add preview section */}
          {selectedEmployee && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium">Payroll Preview</h3>
              <div className="mt-2 text-sm space-y-2">
                <p>
                  Employee: {selectedEmployeeData?.firstName}{" "}
                  {selectedEmployeeData?.lastName}
                </p>
                <p>Grade Level: {selectedEmployeeData?.gradeLevel}</p>
                <p>
                  Basic Salary: ₦
                  {selectedSalaryGrade?.basicSalary?.toLocaleString()}
                </p>
                <p>
                  Period:{" "}
                  {new Date(
                    payrollData.year,
                    payrollData.month - 1
                  ).toLocaleDateString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Additional logging for employee selection */}
          {selectedDepartment && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Employees
              </label>
              <span className="text-sm text-gray-500">
                {employeeResponse?.employees?.length || 0} employees available
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedEmployee}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 cursor-pointer inline-flex items-center"
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Processing...
              </>
            ) : editData ? (
              "Update Payroll"
            ) : (
              "Run Payroll"
            )}
          </button>
        </div>
      </BaseModal>
    </>
  );
};