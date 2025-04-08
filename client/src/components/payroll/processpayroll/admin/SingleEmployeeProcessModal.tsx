import { useState, useRef, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import {
  FaTimes,
  FaSpinner,
  FaCheck,
  FaSearch,
  FaUser,
  FaIdCard,
  FaBriefcase,
} from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import { adminEmployeeService } from "../../../../services/adminEmployeeService";
import { salaryStructureService } from "../../../../services/salaryStructureService";
import { adminPayrollService } from "../../../../services/adminPayrollService";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import { SuccessAnimation } from "./SuccessAnimation";
import { useNotifications } from "../../../shared/DashboardLayout";

interface SingleEmployeeProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    employeeIds: string[];
    month: number;
    year: number;
    frequency: string;
    salaryGrade?: string;
  }) => void;
  onSuccess?: () => void;
}

// Add this interface
interface DepartmentEmployee {
  _id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  salaryGrade?: {
    _id: string;
    level: string;
    basicSalary: number;
  };
  fullName: string;
  position: string;
  status: string;
}

const SingleEmployeeProcessModal = ({
  isOpen,
  onClose,
  onSubmit,
  onSuccess,
}: SingleEmployeeProcessModalProps) => {
  const [formData, setFormData] = useState({
    employeeIds: [] as string[],
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    frequency: "monthly",
  });

  // Add search state
  const [searchTerm, setSearchTerm] = useState("");
  const [employeeLimit, setEmployeeLimit] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allEmployeesLoaded, setAllEmployeesLoaded] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<
    DepartmentEmployee[]
  >([]);

  // Add dropdown state
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Add state for select all functionality
  const [selectAll, setSelectAll] = useState(false);

  // Add state for dropdown visibility
  const [showEmployeeList, setShowEmployeeList] = useState(true);

  // Add state for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add state for success animation
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [processingResults, setProcessingResults] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );

  const { checkForNewNotifications } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch employees from department
  const {
    data: employees,
    isLoading: employeesLoading,
    refetch,
  } = useQuery<any, Error, DepartmentEmployee[]>({
    queryKey: ["departmentEmployees", employeeLimit],
    queryFn: async () => {
      console.log("Fetching employees with params:", {
        limit: employeeLimit,
        page: 1,
        // No status filter to get all employees
      });
      const result = await adminEmployeeService.getDepartmentEmployees({
        limit: employeeLimit,
        page: 1,
      });
      console.log("Fetched employees response:", result);
      return result;
    },
    select: (data) => {
      console.log("Selected data:", data);
      if (data.users && Array.isArray(data.users)) {
        console.log(
          "Using users array from response, count:",
          data.users.length
        );
        return data.users.map((user: any) => ({
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          employeeId: user.employeeId,
          fullName: user.fullName,
          position: user.position,
          status: user.status,
          salaryGrade: user.salaryGrade,
        }));
      }

      if (data.data && Array.isArray(data.data)) {
        console.log(
          "Using data.data array from response, count:",
          data.data.length
        );
        return data.data.map((emp: any) => ({
          _id: emp._id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          employeeId: emp.employeeId,
          fullName: emp.fullName,
          position: emp.position,
          status: emp.status,
          salaryGrade: emp.salaryGrade,
        }));
      }

      console.log("No valid data structure found, returning empty array");
      return [];
    },
  });

  // Filter employees based on search term
  const filteredEmployees =
    employees?.filter((employee) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        employee.fullName.toLowerCase().includes(searchLower) ||
        employee.employeeId.toLowerCase().includes(searchLower) ||
        employee.position.toLowerCase().includes(searchLower)
      );
    }) || [];

  console.log("Search term:", searchTerm);
  console.log("Filtered employees:", filteredEmployees);

  // Function to load more employees
  const loadMoreEmployees = async (limit: number) => {
    setIsLoadingMore(true);
    setEmployeeLimit(limit);
    await refetch();
    setIsLoadingMore(false);
  };

  // Function to load all employees
  const loadAllEmployees = async () => {
    setIsLoadingMore(true);
    setEmployeeLimit(1000); // A large number to get all employees
    await refetch();
    setAllEmployeesLoaded(true);
    setIsLoadingMore(false);
  };

  // Fetch salary grades
  const { data: salaryGrades, isLoading: gradesLoading } = useQuery({
    queryKey: ["salaryGrades"],
    queryFn: () => salaryStructureService.getAllSalaryGrades(),
  });

  // When employee is selected, no need to pre-fill salary grade
  const handleEmployeeChange = (employeeId: string) => {
    const selectedEmployee = employees?.find((emp) => emp._id === employeeId);

    if (selectedEmployee) {
      // Check if employee is already selected
      if (formData.employeeIds.includes(employeeId)) {
        // Remove employee if already selected
        setFormData((prev) => ({
          ...prev,
          employeeIds: prev.employeeIds.filter((id) => id !== employeeId),
        }));
        setSelectedEmployees((prev) =>
          prev.filter((emp) => emp._id !== employeeId)
        );
      } else {
        // Add employee if not selected
        setFormData((prev) => ({
          ...prev,
          employeeIds: [...prev.employeeIds, employeeId],
        }));
        setSelectedEmployees((prev) => [...prev, selectedEmployee]);
      }
    }
  };

  // Handle search input focus
  const handleSearchFocus = () => {
    setShowDropdown(true);
  };

  // Function to handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      // Deselect all
      setSelectedEmployees([]);
      setFormData((prev) => ({ ...prev, employeeIds: [] }));
    } else {
      // Select all active employees
      const activeEmployees = filteredEmployees.filter(
        (emp) => emp.status === "active"
      );
      setSelectedEmployees(activeEmployees);
      setFormData((prev) => ({
        ...prev,
        employeeIds: activeEmployees.map((emp) => emp._id),
      }));
    }
    setSelectAll(!selectAll);
  };

  // Function to handle individual checkbox selection
  const handleCheckboxChange = (employee: DepartmentEmployee) => {
    const isSelected = selectedEmployees.some(
      (emp) => emp._id === employee._id
    );

    if (isSelected) {
      // Remove employee
      setSelectedEmployees((prev) =>
        prev.filter((emp) => emp._id !== employee._id)
      );
      setFormData((prev) => ({
        ...prev,
        employeeIds: prev.employeeIds.filter((id) => id !== employee._id),
      }));
    } else {
      // Add employee
      setSelectedEmployees((prev) => [...prev, employee]);
      setFormData((prev) => ({
        ...prev,
        employeeIds: [...prev.employeeIds, employee._id],
      }));
    }
  };

  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployees.length) {
      toast.error("Please select at least one employee");
      return;
    }

    setIsSubmitting(true);
    setShowSuccessAnimation(true);
    setIsProcessing(true);
    setErrorMessage(undefined);

    try {
      if (selectedEmployees.length === 1) {
        const employee = selectedEmployees[0];
        const result = await adminPayrollService.processSingleEmployeePayroll({
          employeeId: employee._id,
          month: formData.month,
          year: formData.year,
          frequency: formData.frequency,
          salaryGrade: employee.salaryGrade?._id,
        });
        setProcessingResults(result);

        // Wait for animation to complete (4 seconds)
        await new Promise((resolve) => setTimeout(resolve, 4000));

        toast.success("Payroll processed successfully");

        // Check for new notifications after payroll creation
        console.log(
          "🔔 Checking for new notifications after payroll creation..."
        );
        await checkForNewNotifications();

        queryClient.invalidateQueries({ queryKey: ["payrolls"] });
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      } else {
        const result =
          await adminPayrollService.processMultipleEmployeesPayroll({
            employeeIds: selectedEmployees.map((employee) => employee._id),
            month: formData.month,
            year: formData.year,
            frequency: formData.frequency,
          });
        setProcessingResults(result);

        // Wait for animation to complete (4 seconds)
        await new Promise((resolve) => setTimeout(resolve, 4000));

        toast.success("Payroll processed successfully for multiple employees");

        // Check for new notifications after payroll creation
        console.log(
          "🔔 Checking for new notifications after multiple payroll creation..."
        );
        await checkForNewNotifications();

        // Invalidate queries to refresh the data
        queryClient.invalidateQueries({ queryKey: ["payrolls"] });
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      }

      // Close the modal and trigger success callback
      setIsProcessing(false);
      setShowSuccessAnimation(false);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Error processing payroll:", error);
      setIsProcessing(false);

      // Handle specific error cases
      if (error.response?.data?.message) {
        // Server returned a specific error message
        const errorMsg = error.response.data.message;
        setErrorMessage(errorMsg);
        toast.error(errorMsg);
      } else if (
        error.message?.includes("duplicate key error") ||
        error.message?.includes("already exists")
      ) {
        // Duplicate payroll error - provide a more user-friendly message
        const monthName = new Date(0, formData.month - 1).toLocaleString(
          "default",
          { month: "long" }
        );
        const errorMsg = `A payroll record already exists for ${
          selectedEmployees.length === 1
            ? selectedEmployees[0].fullName
            : "one or more selected employees"
        } for ${monthName} ${formData.year}. 
        Please select a different month/year or update the existing payroll.`;
        setErrorMessage(errorMsg);
        toast.error(errorMsg);
      } else if (error.message?.includes("Failed to calculate payroll")) {
        // Payroll calculation error
        setErrorMessage(error.message);
        toast.error(error.message);
      } else {
        // Generic error
        const errorMsg = "Failed to process payroll. Please try again later.";
        setErrorMessage(errorMsg);
        toast.error(errorMsg);
      }

      // Keep the error animation visible for a few seconds
      setTimeout(() => {
        setShowSuccessAnimation(false);
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={() => onClose()} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-lg max-h-[90vh] flex flex-col">
          {/* Fixed Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                Process Payroll for Selected Employees
              </Dialog.Title>
              <button
                onClick={() => onClose()}
                className="text-gray-400 hover:text-gray-500"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Employee Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Employees
                </label>
                <div className="relative" ref={dropdownRef}>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onFocus={handleSearchFocus}
                      className="w-full p-2 pl-10 border border-gray-300 rounded-md"
                      placeholder="Search by name, ID, or position"
                    />
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    {employeesLoading && (
                      <FaSpinner className="absolute right-3 top-3 animate-spin text-gray-400" />
                    )}
                  </div>

                  {/* Employee List - Always visible */}
                  <div className="mt-2 border border-gray-300 rounded-md shadow-lg max-h-[30vh] overflow-auto">
                    {/* Select All Button and Toggle */}
                    <div className="sticky top-0 bg-white border-b px-4 py-2 flex items-center justify-between z-10">
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={handleSelectAll}
                          className="text-sm text-green-600 hover:text-green-800 font-medium"
                        >
                          {selectAll ? "Deselect All" : "Select All Active"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowEmployeeList(!showEmployeeList)}
                          className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
                        >
                          {showEmployeeList ? (
                            <>
                              <span>Hide List</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 ml-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 15l7-7 7 7"
                                />
                              </svg>
                            </>
                          ) : (
                            <>
                              <span>Show List</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 ml-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </>
                          )}
                        </button>
                      </div>
                      <span className="text-xs text-gray-500">
                        {selectedEmployees.length} selected
                      </span>
                    </div>

                    {showEmployeeList && (
                      <>
                        {filteredEmployees.length > 0 ? (
                          <ul className="py-1">
                            {filteredEmployees.map((employee) => {
                              const isSelectable = employee.status === "active";
                              const isSelected = selectedEmployees.some(
                                (emp) => emp._id === employee._id
                              );

                              return (
                                <li
                                  key={employee._id}
                                  className={`px-4 py-2 flex items-center ${
                                    isSelectable
                                      ? "hover:bg-green-50"
                                      : "opacity-60 bg-gray-50"
                                  }`}
                                  title={
                                    !isSelectable
                                      ? `Cannot process payroll for ${employee.status} employees`
                                      : ""
                                  }
                                >
                                  {/* Checkbox */}
                                  <div className="flex-shrink-0 mr-3">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() =>
                                        isSelectable &&
                                        handleCheckboxChange(employee)
                                      }
                                      disabled={!isSelectable}
                                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                    />
                                  </div>

                                  <div className="flex-shrink-0 mr-3">
                                    <div
                                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                        isSelectable
                                          ? "bg-green-100 text-green-600"
                                          : "bg-gray-100 text-gray-600"
                                      }`}
                                    >
                                      {employee.firstName.charAt(0)}
                                      {employee.lastName.charAt(0)}
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">
                                      {employee.fullName}
                                    </div>
                                    <div className="text-sm text-gray-500 flex items-center">
                                      <FaIdCard className="mr-1 text-gray-400" />
                                      {employee.employeeId}
                                    </div>
                                    <div className="text-sm text-gray-500 flex items-center">
                                      <FaBriefcase className="mr-1 text-gray-400" />
                                      {employee.position}
                                    </div>
                                  </div>
                                  <div className="flex-shrink-0">
                                    <span
                                      className={`px-2 py-1 text-xs rounded-full ${
                                        employee.status === "active"
                                          ? "bg-green-100 text-green-800"
                                          : employee.status === "terminated"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-yellow-100 text-yellow-800"
                                      }`}
                                    >
                                      {employee.status}
                                    </span>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <div className="px-4 py-3 text-gray-500 text-center">
                            No employees found
                          </div>
                        )}
                        <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500">
                          Note: Only active employees can be selected for
                          payroll processing
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Selected Employees Tags */}
                {selectedEmployees.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700">
                      Selected Employees ({selectedEmployees.length}):
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedEmployees.map((employee) => (
                        <span
                          key={employee._id}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                        >
                          {employee.fullName}
                          <button
                            type="button"
                            onClick={() => handleCheckboxChange(employee)}
                            className="ml-1 text-green-600 hover:text-green-800"
                          >
                            <FaTimes size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Rest of the form fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Month
                  </label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    value={formData.month}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        month: Number(e.target.value),
                      })
                    }
                    required
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(0, i).toLocaleString("default", {
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
                  <input
                    type="number"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    value={formData.year}
                    onChange={(e) =>
                      setFormData({ ...formData, year: Number(e.target.value) })
                    }
                    min={2000}
                    max={2100}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Frequency
                </label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  value={formData.frequency}
                  onChange={(e) =>
                    setFormData({ ...formData, frequency: e.target.value })
                  }
                  required
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                </select>
              </div>
            </form>
          </div>

          {/* Fixed Footer with buttons */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => onClose()}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                disabled={
                  employeesLoading ||
                  gradesLoading ||
                  formData.employeeIds.length === 0 ||
                  isSubmitting
                }
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <FaSpinner className="animate-spin mr-2" />
                    Processing...
                  </span>
                ) : (
                  "Process Payroll"
                )}
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>

      {/* Success Animation */}
      {showSuccessAnimation && (
        <SuccessAnimation
          type={selectedEmployees.length === 1 ? "single" : "multiple"}
          results={processingResults}
          isProcessing={isProcessing}
          error={errorMessage}
        />
      )}
    </Dialog>
  );
};

export default SingleEmployeeProcessModal;
