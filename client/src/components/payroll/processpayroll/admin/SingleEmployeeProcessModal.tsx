import { useState, useRef, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import {
  FaTimes,
  FaSpinner,
  FaSearch,
  FaIdCard,
  FaBriefcase,
  FaCheckCircle,
  FaLeaf,
} from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import { adminEmployeeService } from "../../../../services/adminEmployeeService";
import { salaryStructureService } from "../../../../services/salaryStructureService";
import { adminPayrollService } from "../../../../services/adminPayrollService";
import { departmentService } from "../../../../services/departmentService";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../../context/AuthContext";
import { UserRole } from "../../../../types/auth";
import axios from "axios";

interface SingleEmployeeProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
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

// Add Success Animation Component
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

const MAIN_GREEN = "#27ae60";
const LIGHT_GREEN_BG = "#f6fcf7";
const LIGHT_GREEN_ACCENT = "#eafaf1";

const SingleEmployeeProcessModal = ({
  isOpen,
  onClose,
}: SingleEmployeeProcessModalProps) => {
  const { isSuperAdmin } = useAuth();
  const [formData, setFormData] = useState({
    employeeIds: [] as string[],
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    frequency: "monthly",
    departmentId: "",
  });

  // Add search state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState<
    DepartmentEmployee[]
  >([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showEmployeeList, setShowEmployeeList] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();

  const queryClient = useQueryClient();

  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch admin's department when modal opens
  useEffect(() => {
    const fetchAdminDepartment = async () => {
      if (!isSuperAdmin() && isOpen) {
        setIsLoadingEmployees(true);
        try {
          if (user && user.department) {
            const departmentId =
              typeof user.department === "string"
                ? user.department
                : user.department._id;

            setFormData((prev) => ({
              ...prev,
              departmentId: departmentId,
            }));

            // Check if we already have the data in the cache
            const cachedData = queryClient.getQueryData([
              "departmentEmployees",
              departmentId,
              10,
            ]);

            if (cachedData) {
              setTimeout(() => {
                setIsLoadingEmployees(false);
              }, 500);
              return;
            }

            const employeesResponse = await axios.get(
              `${
                import.meta.env.VITE_API_URL
              }/admin/departments/${departmentId}/employees`,
              {
                withCredentials: true,
              }
            );
            const employeesData = employeesResponse.data;

            if (employeesData.success && employeesData.employees) {
              // Format the employees data directly from the response
              const formattedEmployees = employeesData.employees.map(
                (emp: any) => ({
                  _id: emp._id,
                  firstName: emp.firstName,
                  lastName: emp.lastName,
                  employeeId: emp.employeeId,
                  fullName: emp.fullName,
                  position: emp.position,
                  status: emp.status,
                  salaryGrade: emp.salaryGrade,
                })
              );

              // Set the data in the cache
              queryClient.setQueryData(
                ["departmentEmployees", departmentId, 10],
                { users: formattedEmployees }
              );

              // Set the query options separately
              queryClient.setQueryDefaults(
                ["departmentEmployees", departmentId, 10],
                {
                  staleTime: 5 * 60 * 1000,
                  gcTime: 30 * 60 * 1000,
                }
              );
            }
          }
        } catch (error) {
          console.error("Error fetching admin's data:", error);
        } finally {
          setTimeout(() => {
            setIsLoadingEmployees(false);
          }, 500);
        }
      }
    };

    fetchAdminDepartment();
  }, [isOpen, isSuperAdmin, queryClient, user]);

  const { data: departments, isLoading: departmentsLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: () =>
      departmentService.getAllDepartments(user?.role, user?.permissions),
    enabled: isSuperAdmin(),
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowEmployeeList(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const { data: employees, isLoading: employeesLoading } = useQuery<
    any,
    Error,
    DepartmentEmployee[]
  >({
    queryKey: ["departmentEmployees", formData.departmentId, 10],
    queryFn: async () => {
      console.log("Fetching employees with params:", {
        departmentId: formData.departmentId,
        limit: 10,
        page: 1,
      });

      if (!formData.departmentId) {
        console.log("Department ID is required");
        return { users: [] };
      }

      const result = await adminEmployeeService.getDepartmentEmployees({
        departmentId: formData.departmentId,
        userRole: isSuperAdmin() ? UserRole.SUPER_ADMIN : UserRole.ADMIN,
      });
      console.log("Fetched employees response:", result);
      return result;
    },
    enabled: !isSuperAdmin() || Boolean(formData.departmentId),
    select: (data) => {
      console.log("Selected data:", data);

      if (data.employees && Array.isArray(data.employees)) {
        console.log(
          "Using employees array from response, count:",
          data.employees.length
        );
        return data.employees.map((emp: any) => ({
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

      // Fallback to the old structure if needed
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

  const filteredEmployees =
    employees?.filter((employee) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        employee.fullName.toLowerCase().includes(searchLower) ||
        employee.employeeId.toLowerCase().includes(searchLower) ||
        employee.position.toLowerCase().includes(searchLower)
      );
    }) || [];

  // console.log("Search term:", searchTerm);
  // console.log("Filtered employees:", filteredEmployees);

  // Fetch salary grades
  const { isLoading: gradesLoading } = useQuery({
    queryKey: ["salaryGrades"],
    queryFn: () => salaryStructureService.getAllSalaryGrades(),
  });

  // Handle search input focus
  const handleSearchFocus = () => {
    setShowEmployeeList(true);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("🔄 Starting payroll submission process");
    console.log("📋 Form data:", formData);
    console.log("👥 Selected employees:", selectedEmployees);

    if (!selectedEmployees.length) {
      console.log("❌ No employees selected");
      toast.error("Please select at least one employee");
      return;
    }

    if (isSuperAdmin() && !formData.departmentId) {
      console.log("❌ No department selected for super admin");
      toast.error("Please select a department first");
      return;
    }

    setIsSubmitting(true);
    console.log("⏳ Setting isSubmitting to true");

    try {
      console.log("📤 Making API call to process payroll");

      if (selectedEmployees.length === 1) {
        // Process single employee
        await adminPayrollService.processSingleEmployeePayroll({
          employeeId: selectedEmployees[0]._id,
          month: formData.month,
          year: formData.year,
          frequency: formData.frequency,
          departmentId: formData.departmentId,
          userRole: user?.role,
        });

        console.log("✅ Single payroll processed successfully");
        toast.success("Payroll processed successfully");
      } else {
        // Process multiple employees
        const employeeIds = selectedEmployees.map((emp) => emp._id);
        const multipleResult =
          await adminPayrollService.processMultipleEmployeesPayroll({
            employeeIds: employeeIds,
            month: formData.month,
            year: formData.year,
            frequency: formData.frequency,
            departmentId: formData.departmentId,
            userRole: user?.role,
          });

        console.log("✅ Multiple payrolls processed:", multipleResult);

        if (multipleResult.processed > 0) {
          toast.success(
            `Successfully processed ${multipleResult.processed} out of ${multipleResult.total} payrolls`
          );

          if (multipleResult.skipped > 0) {
            toast.info(
              `${multipleResult.skipped} payrolls were skipped (already exist)`
            );
          }

          if (multipleResult.failed > 0) {
            toast.error(`${multipleResult.failed} payrolls failed to process`);
            console.error("Payroll processing errors:", multipleResult.errors);
          }
        } else {
          toast.warning("No payrolls were processed");
        }
      }

      setShowSuccess(true);

      console.log("🔄 Invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["departmentEmployees"] });
      queryClient.invalidateQueries({ queryKey: ["departmentPayrolls"] });
      queryClient.invalidateQueries({ queryKey: ["departmentPayrollStats"] });
      queryClient.invalidateQueries({ queryKey: ["payrollProcessingStats"] });
      queryClient.invalidateQueries({ queryKey: ["adminPayrolls"] });

      // Force a refetch of the department payrolls
      console.log("🔄 Forcing refetch of department payrolls");
      queryClient.refetchQueries({ queryKey: ["departmentPayrolls"] });

      // Wait for animation to complete before closing
      setTimeout(() => {
        console.log("⏳ Animation complete, closing modal");
        setShowSuccess(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error("❌ Error processing payroll:", error);

      // Handle specific error cases with better messages
      let errorMessage = "Failed to process payroll";

      if (error instanceof Error) {
        if (error.message.includes("already exists")) {
          errorMessage =
            "A payroll for this employee already exists for this period";
        } else if (error.message.includes("No grade level assigned")) {
          errorMessage = "Employee does not have a grade level assigned";
        } else if (error.message.includes("No active salary grade")) {
          errorMessage = "No active salary grade found for employee";
        } else {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      console.log("🏁 Setting isSubmitting to false");
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    setFormData({
      employeeIds: [],
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      frequency: "monthly",
      departmentId: "",
    });
    setSelectedEmployees([]);
    setSearchTerm("");
    setSelectAll(false);
    setShowEmployeeList(true);
    setIsLoadingEmployees(false);
    setIsSubmitting(false);

    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      if (!isSuperAdmin() && user?.department) {
        const departmentId =
          typeof user.department === "string"
            ? user.department
            : user.department._id;

        setFormData((prev) => ({
          ...prev,
          departmentId,
        }));
      }
    }

    // When modal closes, reset state
    if (!isOpen) {
      // Reset all state when modal is closed
      setFormData({
        employeeIds: [],
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        frequency: "monthly",
        departmentId: "",
      });
      setSelectedEmployees([]);
      setSearchTerm("");
      setSelectAll(false);
      setShowEmployeeList(true);
      setIsLoadingEmployees(false);
      setIsSubmitting(false);
    }
  }, [isOpen, isSuperAdmin, user]);

  // Handle department change
  const handleDepartmentChange = (departmentId: string) => {
    setFormData((prev) => ({ ...prev, departmentId }));
    setSelectedEmployees([]);
    setFormData((prev) => ({ ...prev, employeeIds: [] }));
    setShowEmployeeList(true);
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      {showSuccess && <SuccessAnimation />}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          className="mx-auto max-w-4xl w-full rounded-xl shadow-lg max-h-[90vh] flex flex-col"
          style={{
            background: MAIN_GREEN,
            borderRadius: 18,
            boxShadow: "0 4px 24px 0 rgba(39, 174, 96, 0.10)",
            border: `2px solid ${LIGHT_GREEN_ACCENT}`,
          }}
        >
          {/* Fixed Header */}
          <div
            className="p-4 border-b"
            style={{
              borderBottom: `3px solid #fff`,
              background: MAIN_GREEN,
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              boxShadow: "0 1px 6px 0 rgba(39, 174, 96, 0.04)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Dialog.Title
              className="text-xl font-bold"
              style={{ color: "#fff", letterSpacing: 0.5 }}
            >
              <FaLeaf style={{ marginRight: 8, verticalAlign: "middle" }} />
              Process Payroll for Selected Employees
            </Dialog.Title>
            <button
              onClick={handleClose}
              className="text-gray-100 hover:text-gray-200"
              style={{ fontSize: 22, cursor: "pointer" }}
            >
              <FaTimes />
            </button>
          </div>

          {/* Scrollable Content */}
          <div
            className="flex-1 overflow-y-auto p-6"
            style={{
              background: "#fff",
              borderBottomLeftRadius: 18,
              borderBottomRightRadius: 18,
            }}
          >
            <div className="space-y-4">
              {/* Department Selection for Super Admin */}
              {isSuperAdmin() && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Department
                  </label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-green-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 sm:text-sm rounded-md bg-white"
                    disabled={departmentsLoading}
                    style={{
                      cursor: "pointer",
                      background: LIGHT_GREEN_BG,
                      fontWeight: 600,
                    }}
                  >
                    <option value="">
                      {departmentsLoading
                        ? "Loading departments..."
                        : "Select a department"}
                    </option>
                    {departments?.map((dept: any) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Show message if Super Admin hasn't selected department */}
              {isSuperAdmin() && !formData.departmentId && (
                <div className="text-center py-4 text-black">
                  Please select a department to view employees
                </div>
              )}

              {/* Employee Selection - Show for both admin types when department is selected */}
              {(formData.departmentId || !isSuperAdmin()) && (
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
                        className="w-full p-2 pl-10 border border-green-200 rounded-md focus:ring-2 focus:ring-green-400 focus:border-green-400"
                        placeholder="Search by name, ID, or position"
                      />
                      <FaSearch className="absolute left-3 top-3 text-gray-400" />
                      {employeesLoading && (
                        <FaSpinner className="absolute right-3 top-3 animate-spin text-gray-400" />
                      )}
                    </div>

                    {/* Employee List - Always visible */}
                    <div className="mt-2 border border-green-200 rounded-md shadow-lg max-h-[200px] overflow-y-auto">
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
                            onClick={() =>
                              setShowEmployeeList(!showEmployeeList)
                            }
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

                      {isLoadingEmployees || employeesLoading ? (
                        <div className="flex justify-center items-center h-32">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full border-4 border-green-200"></div>
                            <div className="w-12 h-12 rounded-full border-4 border-green-500 border-t-transparent animate-spin absolute top-0"></div>
                          </div>
                        </div>
                      ) : (
                        showEmployeeList && (
                          <>
                            {filteredEmployees.length > 0 ? (
                              <ul className="py-1">
                                {filteredEmployees.map((employee) => {
                                  const isSelectable =
                                    employee.status === "active";
                                  const isSelected = selectedEmployees.some(
                                    (emp) => emp._id === employee._id
                                  );

                                  return (
                                    <li
                                      key={employee._id}
                                      className={`px-4 py-2 ${
                                        isSelectable
                                          ? "hover:bg-green-50 cursor-pointer"
                                          : "opacity-60 bg-gray-50"
                                      }`}
                                      title={
                                        !isSelectable
                                          ? `Cannot process payroll for ${employee.status} employees`
                                          : ""
                                      }
                                      onClick={() =>
                                        isSelectable &&
                                        handleCheckboxChange(employee)
                                      }
                                    >
                                      <div className="flex items-center">
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
                                            onClick={(e) => e.stopPropagation()}
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
                                                : employee.status ===
                                                  "terminated"
                                                ? "bg-red-100 text-red-800"
                                                : "bg-yellow-100 text-yellow-800"
                                            }`}
                                          >
                                            {employee.status}
                                          </span>
                                        </div>
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
                        )
                      )}
                    </div>
                  </div>

                  {/* Selected Employees Tags */}
                  {selectedEmployees.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700">
                        Selected Employees ({selectedEmployees.length}):
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1 max-h-[80px] overflow-y-auto p-1 border border-gray-200 rounded-md">
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
              )}

              {/* Rest of the form fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Month
                  </label>
                  <select
                    className="mt-1 block w-full rounded-md border-green-200 focus:ring-2 focus:ring-green-400 focus:border-green-400"
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
                    className="mt-1 block w-full rounded-md border-green-200 focus:ring-2 focus:ring-green-400 focus:border-green-400"
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
                  className="mt-1 block w-full rounded-md border-green-200 focus:ring-2 focus:ring-green-400 focus:border-green-400"
                  value={formData.frequency}
                  onChange={(e) =>
                    setFormData({ ...formData, frequency: e.target.value })
                  }
                  required
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
            </div>
          </div>

          {/* Fixed Footer with buttons */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSubmit(e);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                disabled={
                  employeesLoading ||
                  gradesLoading ||
                  formData.employeeIds.length === 0 ||
                  isSubmitting
                }
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <div className="relative mr-2">
                      <div className="w-4 h-4 rounded-full border-2 border-white border-opacity-30"></div>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin absolute top-0"></div>
                    </div>
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
    </Dialog>
  );
};

export default SingleEmployeeProcessModal;
