import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { departmentService } from "../../../services/departmentService";
import { employeeService } from "../../../services/employeeService";
import { allowanceService } from "../../../services/allowanceService";
import {
  Allowance,
  AllowanceType,
  CalculationMethod,
  PayrollFrequency,
  AllowanceStatus,
  AllowancesListResponse,
} from "../../../types/allowance";

interface DeptAllowanceForm {
  departmentId: string;
  amount: string;
  reason: string;
  paymentDate: string;
  type: AllowanceType;
}

interface EmployeeAllowanceForm {
  departmentId: string;
  employeeId: string;
  amount: string;
  reason: string;
  paymentDate: string;
  type: AllowanceType;
}

interface Department {
  _id: string;
  name: string;
}

interface Employee {
  _id: string;
  fullName: string;
  employeeId: string;
}

interface DepartmentEmployee {
  _id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  email: string;
}

interface DepartmentEmployeeResponse {
  data: {
    employees: DepartmentEmployee[];
    page: number;
    limit: number;
    total: number;
  };
}

export default function AllowanceManagement() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAllowance, setEditingAllowance] = useState<
    Allowance | undefined
  >(undefined);
  const [formData, setFormData] = useState({
    employeeName: "",
    employeeId: "",
    type: AllowanceType.TRANSPORT,
    value: 0,
    calculationMethod: CalculationMethod.FIXED,
    frequency: PayrollFrequency.MONTHLY,
    description: "",
    taxable: true,
    status: AllowanceStatus.PENDING,
    isActive: true,
    effectiveDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
    scope: "department" as const,
    priority: 1,
  });

  // Add these state variables
  const [deptAllowanceLoading, setDeptAllowanceLoading] = useState(false);
  const [employeeAllowanceLoading, setEmployeeAllowanceLoading] =
    useState(false);
  const [employeeList, setEmployeeList] = useState<{ data: Employee[] } | null>(
    null
  );
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showDeptAllowanceModal, setShowDeptAllowanceModal] = useState(false);
  const [showEmployeeAllowanceModal, setShowEmployeeAllowanceModal] =
    useState(false);
  const [deptAllowanceForm, setDeptAllowanceForm] = useState<DeptAllowanceForm>(
    {
      departmentId: "",
      amount: "",
      reason: "",
      paymentDate: "",
      type: AllowanceType.TRANSPORT,
    }
  );
  const [employeeAllowanceForm, setEmployeeAllowanceForm] =
    useState<EmployeeAllowanceForm>({
      departmentId: "",
      employeeId: "",
      amount: "",
      reason: "",
      paymentDate: "",
      type: AllowanceType.TRANSPORT,
    });

  // Add these state variables at the top with other states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState({
    employee: "",
    departmentId: "",
    status: "",
    type: "",
    startDate: "",
    endDate: "",
  });

  // Inside your component, add these queries
  const queryClient = useQueryClient();

  const { data: departmentsData, isLoading: isDepartmentsLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const response = await departmentService.getAllDepartments();
      return response;
    },
  });

  // Remove the onSuccess and onError handlers from the query and use this effect instead
  useEffect(() => {
    if (isDepartmentsLoading) {
      setDepartmentsLoading(true);
    } else if (departmentsData) {
      setDepartments(departmentsData);
      setDepartmentsLoading(false);
    }
  }, [departmentsData, isDepartmentsLoading]);

  // Update the query to match the actual response structure
  const { data: employeesData, isLoading: isEmployeesLoading } =
    useQuery<DepartmentEmployeeResponse>({
      queryKey: ["employees", employeeAllowanceForm.departmentId],
      queryFn: async () => {
        const response = await employeeService.getDepartmentEmployees(
          employeeAllowanceForm.departmentId,
          { page: 1, limit: 100 }
        );
        return {
          data: {
            employees: response.employees,
            page: response.page,
            limit: response.limit,
            total: response.total,
          },
        };
      },
      enabled: !!employeeAllowanceForm.departmentId,
    });

  // Update the effect with proper typing
  useEffect(() => {
    if (isEmployeesLoading) {
      setEmployeesLoading(true);
    } else if (employeesData) {
      // Transform the employees data to match the expected format
      const transformedEmployees = employeesData.data.employees.map(
        (emp: DepartmentEmployee) => ({
          _id: emp._id,
          fullName: `${emp.firstName} ${emp.lastName}`,
          employeeId: emp.employeeId,
        })
      );
      setEmployeeList({ data: transformedEmployees });
      setEmployeesLoading(false);
    }
  }, [employeesData, isEmployeesLoading]);

  const { data: allowanceData, isLoading: isAllowancesLoading } =
    useQuery<AllowancesListResponse>({
      queryKey: ["allowances", page, limit, filters],
      queryFn: async (): Promise<AllowancesListResponse> => {
        // Create a clean filter object removing empty values
        const cleanFilters = Object.entries(filters).reduce(
          (acc, [key, value]) => {
            if (value) {
              acc[key] = value;
            }
            return acc;
          },
          {} as Record<string, string>
        );

        const response = await allowanceService.getAllowanceRequests({
          page,
          limit,
          ...cleanFilters,
        });

        // Filter the allowances based on the criteria
        const filteredAllowances = response.data.allowances.filter(
          (allowance) => {
            let matches = true;

            if (filters.employee) {
              matches =
                matches &&
                (allowance.employee?.fullName
                  ?.toLowerCase()
                  .includes(filters.employee.toLowerCase()) ||
                  allowance.employee?.email
                    ?.toLowerCase()
                    .includes(filters.employee.toLowerCase()));
            }

            if (filters.departmentId) {
              matches =
                matches && allowance.department?._id === filters.departmentId;
            }

            if (filters.status) {
              matches =
                matches &&
                (allowance.approvalStatus === filters.status ||
                  allowance.approvalStatus === filters.status);
            }

            if (filters.type) {
              matches = matches && allowance.type === filters.type;
            }

            if (filters.startDate) {
              const startDate = new Date(filters.startDate);
              const allowanceDate = new Date(allowance.paymentDate);
              matches = matches && allowanceDate >= startDate;
            }

            if (filters.endDate) {
              const endDate = new Date(filters.endDate);
              const allowanceDate = new Date(allowance.paymentDate);
              matches = matches && allowanceDate <= endDate;
            }

            return matches;
          }
        );

        return {
          success: response.success,
          message: response.message,
          data: {
            ...response.data,
            allowances: filteredAllowances,
            pagination: {
              ...response.data.pagination,
              total: filteredAllowances.length,
              pages: Math.ceil(filteredAllowances.length / limit),
            },
          },
        };
      },
    });

  // Add this effect
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    setShowAddForm(false);
    setFormData({
      employeeName: "",
      employeeId: "",
      type: AllowanceType.TRANSPORT,
      value: 0,
      calculationMethod: CalculationMethod.FIXED,
      frequency: PayrollFrequency.MONTHLY,
      description: "",
      taxable: true,
      status: AllowanceStatus.PENDING,
      isActive: true,
      effectiveDate: new Date().toISOString().split("T")[0],
      expiryDate: "",
      scope: "department" as const,
      priority: 1,
    });
  };

  // Add these handlers
  const handleDeptAllowanceChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setDeptAllowanceForm((prev: DeptAllowanceForm) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEmployeeAllowanceChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setEmployeeAllowanceForm((prev: EmployeeAllowanceForm) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDeptAllowanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeptAllowanceLoading(true);
    try {
      console.log("Submitting department allowance:", deptAllowanceForm);
      const response = await allowanceService.createDepartmentAllowance(
        deptAllowanceForm
      );
      console.log("Department allowance response:", response);
      setShowDeptAllowanceModal(false);
      queryClient.invalidateQueries({ queryKey: ["allowances"] });
      toast.success("Department allowance created successfully");
    } catch (error: any) {
      console.error("Department allowance error:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to create department allowance"
      );
    } finally {
      setDeptAllowanceLoading(false);
    }
  };

  const handleEmployeeAllowanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmployeeAllowanceLoading(true);
    try {
      console.log("Submitting employee allowance:", employeeAllowanceForm);
      const response = await allowanceService.createDepartmentEmployeeAllowance(
        employeeAllowanceForm
      );
      console.log("Employee allowance response:", response);
      setShowEmployeeAllowanceModal(false);
      queryClient.invalidateQueries({ queryKey: ["allowances"] });
      toast.success("Employee allowance created successfully");
    } catch (error: any) {
      console.error("Employee allowance error:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to create employee allowance"
      );
    } finally {
      setEmployeeAllowanceLoading(false);
    }
  };

  // Add these helper functions
  const isSuperAdmin = () => {
    // Replace with your actual role check logic
    return true; // Temporary return for testing
  };

  const isAdmin = () => {
    // Replace with your actual role check logic
    return true; // Temporary return for testing
  };

  return (
    <div className="space-y-6">
      {/* Header Section with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">
            Total Allowances
          </h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {(allowanceData as AllowancesListResponse)?.data?.pagination
              ?.total || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">
            Active Allowances
          </h3>
          <p className="mt-2 text-3xl font-semibold text-green-600">
            {(
              allowanceData as AllowancesListResponse
            )?.data?.allowances?.filter(
              (a: Allowance) => a.approvalStatus === "approved"
            ).length || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Departments</h3>
          <p className="mt-2 text-3xl font-semibold text-blue-600">
            {new Set(
              (allowanceData as AllowancesListResponse)?.data?.allowances?.map(
                (a: Allowance) => a.department
              )
            ).size || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
          <p className="mt-2 text-3xl font-semibold text-purple-600">
            ₦
            {(allowanceData as AllowancesListResponse)?.data?.allowances
              ?.reduce((sum: number, a: Allowance) => sum + (a.amount || 0), 0)
              .toLocaleString() || 0}
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4"></div>
          {(isSuperAdmin() || isAdmin()) && (
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeptAllowanceModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Add Department Allowance
              </button>
              <button
                onClick={() => setShowEmployeeAllowanceModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md"
              >
                Add Employee Allowance
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <input
              type="text"
              placeholder="Employee name or email"
              value={filters.employee}
              onChange={(e) =>
                setFilters((f) => ({ ...f, employee: e.target.value }))
              }
              className="border rounded px-2 py-1"
            />
            <select
              value={filters.departmentId}
              onChange={(e) =>
                setFilters((f) => ({ ...f, departmentId: e.target.value }))
              }
              className="border rounded px-2 py-1"
            >
              <option value="">All Departments</option>
              {departments?.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((f) => ({ ...f, status: e.target.value }))
              }
              className="border rounded px-2 py-1"
            >
              <option value="">All Statuses</option>
              {Object.entries(AllowanceStatus).map(([key, value]) => (
                <option key={key} value={value}>
                  {key.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <select
              value={filters.type}
              onChange={(e) =>
                setFilters((f) => ({ ...f, type: e.target.value }))
              }
              className="border rounded px-2 py-1"
            >
              <option value="">All Types</option>
              {Object.entries(AllowanceType).map(([key, value]) => (
                <option key={key} value={value}>
                  {key.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters((f) => ({ ...f, startDate: e.target.value }))
              }
              className="border rounded px-2 py-1"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters((f) => ({ ...f, endDate: e.target.value }))
              }
              className="border rounded px-2 py-1"
            />
            <button
              onClick={() =>
                setFilters({
                  employee: "",
                  departmentId: "",
                  status: "",
                  type: "",
                  startDate: "",
                  endDate: "",
                })
              }
              className="border rounded px-2 py-1 bg-gray-100"
              type="button"
            >
              Reset
            </button>
          </div>
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Employee
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Department
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Reason
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Payment Date
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Approved By
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isAllowancesLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-2 text-center">
                    <div className="text-gray-500">Loading allowances...</div>
                  </td>
                </tr>
              ) : (allowanceData as AllowancesListResponse)?.data?.allowances
                  ?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-2 text-center">
                    <div className="text-gray-500">
                      No allowances found. Click "Add Allowance" to create one.
                    </div>
                  </td>
                </tr>
              ) : (
                (
                  allowanceData as AllowancesListResponse
                )?.data?.allowances?.map((allowance: Allowance) => (
                  <tr key={allowance._id}>
                    <td className="px-4 py-2">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {allowance.employee?.firstName}{" "}
                          {allowance.employee?.lastName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {allowance.employee?.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="text-sm text-gray-900">
                        {allowance.department?.name}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {allowance.type}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="text-sm text-gray-900">
                        ₦{allowance.amount?.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="text-sm text-gray-900">
                        {allowance.reason}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full
                          ${
                            allowance.approvalStatus === "approved"
                              ? "bg-green-100 text-green-800"
                              : allowance.approvalStatus === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                      >
                        {allowance.approvalStatus}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="text-sm text-gray-900">
                        {new Date(allowance.paymentDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="text-sm text-gray-900">
                        {allowance.approvedBy?.fullName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {allowance.approvedAt
                          ? new Date(allowance.approvedAt).toLocaleDateString()
                          : ""}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {allowanceData?.data?.pagination && (
            <div className="flex justify-between items-center mt-4">
              <div>
                Page {allowanceData.data.pagination.page} of{" "}
                {allowanceData.data.pagination.pages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPage((p) =>
                      Math.min(allowanceData.data.pagination.pages, p + 1)
                    )
                  }
                  disabled={page === allowanceData.data.pagination.pages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1); // Reset to first page on limit change
                  }}
                  className="border rounded px-2 py-1"
                >
                  {[10, 20, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size} per page
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-lg bg-white lg:ml-[25%] md:ml-[20%] sm:ml-[10%]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingAllowance
                  ? "Edit Employee Allowance"
                  : "Create New Employee Allowance"}
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingAllowance(undefined);
                }}
                className="text-gray-400 hover:text-gray-500 focus:outline-none p-2 hover:bg-gray-100 rounded-full"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Employee Name
                  </label>
                  <input
                    type="text"
                    name="employeeName"
                    value={formData.employeeName || ""}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    placeholder="Enter employee name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    name="employeeId"
                    value={formData.employeeId || ""}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    placeholder="Enter employee ID"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Allowance Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  >
                    {Object.entries(AllowanceType).map(([key, value]) => (
                      <option key={key} value={value}>
                        {key.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Value
                  </label>
                  <input
                    type="number"
                    name="value"
                    value={formData.value}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    placeholder="Enter allowance value"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Calculation Method
                  </label>
                  <select
                    name="calculationMethod"
                    value={formData.calculationMethod}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  >
                    {Object.entries(CalculationMethod).map(([key, value]) => (
                      <option key={key} value={value}>
                        {key.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Frequency
                  </label>
                  <select
                    name="frequency"
                    value={formData.frequency}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  >
                    {Object.entries(PayrollFrequency).map(([key, value]) => (
                      <option key={key} value={value}>
                        {key.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Effective Date
                  </label>
                  <input
                    type="date"
                    name="effectiveDate"
                    value={formData.effectiveDate}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  placeholder="Enter reason for this allowance"
                />
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="taxable"
                    checked={formData.taxable}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Taxable</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingAllowance(undefined);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  {editingAllowance ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Department Allowance Modal */}
      {showDeptAllowanceModal && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Create Department Allowance
              </h3>
              <button
                onClick={() => setShowDeptAllowanceModal(false)}
                className="text-gray-400 hover:text-gray-500 p-2"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleDeptAllowanceSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <select
                  name="departmentId"
                  value={deptAllowanceForm.departmentId}
                  onChange={handleDeptAllowanceChange}
                  className="mt-1 block w-full rounded-md border-gray-300"
                  required
                  disabled={departmentsLoading}
                >
                  <option value="">
                    {departmentsLoading
                      ? "Loading departments..."
                      : "Select Department"}
                  </option>
                  {departments?.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Amount
                </label>
                <input
                  type="number"
                  name="amount"
                  value={deptAllowanceForm.amount}
                  onChange={handleDeptAllowanceChange}
                  className="mt-1 block w-full rounded-md border-gray-300"
                  placeholder="Enter allowance amount"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Reason
                </label>
                <textarea
                  name="reason"
                  value={deptAllowanceForm.reason}
                  onChange={handleDeptAllowanceChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300"
                  placeholder="Enter reason for this allowance"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Payment Date
                </label>
                <input
                  type="date"
                  name="paymentDate"
                  value={deptAllowanceForm.paymentDate}
                  onChange={handleDeptAllowanceChange}
                  className="mt-1 block w-full rounded-md border-gray-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Allowance Type
                </label>
                <select
                  name="type"
                  value={deptAllowanceForm.type}
                  onChange={handleDeptAllowanceChange}
                  className="mt-1 block w-full rounded-md border-gray-300"
                  required
                >
                  {Object.entries(AllowanceType).map(([key, value]) => (
                    <option key={key} value={value}>
                      {key.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowDeptAllowanceModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  disabled={deptAllowanceLoading}
                >
                  {deptAllowanceLoading ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Allowance Modal */}
      {showEmployeeAllowanceModal && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Create Employee Allowance
              </h3>
              <button
                onClick={() => setShowEmployeeAllowanceModal(false)}
                className="text-gray-400 hover:text-gray-500 p-2"
              >
                ×
              </button>
            </div>
            <form
              onSubmit={handleEmployeeAllowanceSubmit}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <select
                  name="departmentId"
                  value={employeeAllowanceForm.departmentId}
                  onChange={handleEmployeeAllowanceChange}
                  className="mt-1 block w-full rounded-md border-gray-300"
                  required
                  disabled={departmentsLoading}
                >
                  <option value="">
                    {departmentsLoading
                      ? "Loading departments..."
                      : "Select Department"}
                  </option>
                  {departments?.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              {employeeAllowanceForm.departmentId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Employee
                  </label>
                  <select
                    name="employeeId"
                    value={employeeAllowanceForm.employeeId}
                    onChange={handleEmployeeAllowanceChange}
                    className="mt-1 block w-full rounded-md border-gray-300"
                    required
                    disabled={employeesLoading}
                  >
                    <option value="">
                      {employeesLoading
                        ? "Loading employees..."
                        : "Select Employee"}
                    </option>
                    {employeeList?.data?.map((emp: any) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.fullName} ({emp.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Amount
                </label>
                <input
                  type="number"
                  name="amount"
                  value={employeeAllowanceForm.amount}
                  onChange={handleEmployeeAllowanceChange}
                  className="mt-1 block w-full rounded-md border-gray-300"
                  placeholder="Enter allowance amount"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Reason
                </label>
                <textarea
                  name="reason"
                  value={employeeAllowanceForm.reason}
                  onChange={handleEmployeeAllowanceChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300"
                  placeholder="Enter reason for this allowance"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Payment Date
                </label>
                <input
                  type="date"
                  name="paymentDate"
                  value={employeeAllowanceForm.paymentDate}
                  onChange={handleEmployeeAllowanceChange}
                  className="mt-1 block w-full rounded-md border-gray-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Allowance Type
                </label>
                <select
                  name="type"
                  value={employeeAllowanceForm.type}
                  onChange={handleEmployeeAllowanceChange}
                  className="mt-1 block w-full rounded-md border-gray-300"
                  required
                >
                  {Object.entries(AllowanceType).map(([key, value]) => (
                    <option key={key} value={value}>
                      {key.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEmployeeAllowanceModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  disabled={employeeAllowanceLoading}
                >
                  {employeeAllowanceLoading ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
