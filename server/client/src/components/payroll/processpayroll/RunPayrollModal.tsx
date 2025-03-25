import { useState } from "react";
import { BaseModal } from "../../shared/BaseModal";
import { employeeService } from "../../../services/employeeService";
import { departmentService } from "../../../services/departmentService";
import { payrollService } from "../../../services/payrollService";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { FaSpinner } from "react-icons/fa";
import {
  Employee,
  EmployeeResponse,
  DepartmentEmployee,
  DepartmentEmployeeResponse,
} from "../../../types/employee";
import { Department } from "../../../types/department";
import { PayrollCalculationRequest } from "../../../types/payroll";
import React from "react";

interface RunPayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RunPayrollModal = ({
  isOpen,
  onClose,
  onSuccess,
}: RunPayrollModalProps) => {
  console.log("🔄 Initializing RunPayrollModal");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [payrollData, setPayrollData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  console.log("📊 Current State:", {
    selectedDepartment,
    selectedEmployee,
    payrollData,
    isSubmitting,
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
      console.log("👥 Employees found:", result?.employees?.length || 0);
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

  // Reset employee selection when department changes
  const handleDepartmentChange = (departmentId: string) => {
    console.log("🏢 Selected department:", departmentId);
    setSelectedDepartment(departmentId);
    setSelectedEmployee(""); // Reset employee selection
  };

  const handleSubmit = async () => {
    console.log("🚀 Starting payroll submission");
    try {
      setIsSubmitting(true);
      console.log("🔍 Finding selected employee data...");

      const selectedEmployeeData = employees.find(
        (emp: DepartmentEmployee) => emp._id === selectedEmployee
      );

      console.log("👤 Selected Employee Data:", selectedEmployeeData);

      if (!selectedEmployeeData) {
        console.error("❌ No employee selected");
        toast.error("Please select an employee");
        return;
      }

      const calculationRequest: PayrollCalculationRequest = {
        month: payrollData.month,
        year: payrollData.year,
        employee: selectedEmployee,
        salaryGrade: selectedEmployeeData.gradeLevel,
      };

      console.log("📝 Payroll Calculation Request:", calculationRequest);

      await payrollService.calculatePayroll(calculationRequest);
      console.log("✅ Payroll calculation successful");

      toast.success("Payroll calculation initiated");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("❌ Payroll calculation error:", error);
      toast.error("Failed to initiate payroll calculation");
    } finally {
      setIsSubmitting(false);
      console.log("🏁 Payroll submission process completed");
    }
  };

  // Log when modal opens/closes
  console.log("🔄 Modal State:", { isOpen, isSubmitting });

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Run New Payroll">
      <div className="space-y-6 p-6">
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
            disabled={isLoadingDepartments}
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

        {/* Employee Selection - Only show when department is selected */}
        {selectedDepartment && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Employee
            </label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              disabled={isLoadingEmployees}
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

            {/* Add loading indicator and count */}
            <div className="mt-2 text-sm">
              {isLoadingEmployees ? (
                <span className="text-blue-600 flex items-center">
                  <FaSpinner className="animate-spin mr-2" />
                  Loading department employees...
                </span>
              ) : employees.length > 0 ? (
                <span className="text-green-600">
                  Found {employees.length} employee
                  {employees.length !== 1 ? "s" : ""}
                </span>
              ) : (
                <span className="text-gray-500">
                  No employees found in this department
                </span>
              )}
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
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedEmployee}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? "Processing..." : "Run Payroll"}
        </button>
      </div>
    </BaseModal>
  );
};
