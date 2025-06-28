import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { departmentService } from "../../../services/departmentService";
import { employeeService } from "../../../services/employeeService";
import { allowanceService } from "../../../services/allowanceService";
import { useAuth } from "../../../context/AuthContext";
import { formatCurrency } from "../../../utils/formatters";
import { Avatar } from "../../../components/shared/Avatar";
import {
  FaInfoCircle,
  FaCalendarAlt,
  FaHandHoldingUsd,
  FaUsers,
  FaUser,
  FaClock,
  FaCheckCircle,
  FaMoneyBillWave,
  FaSpinner,
} from "react-icons/fa";
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

const DepartmentAllowanceInfoSection = () => (
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-4 shadow-sm">
    <div className="flex items-center mb-3">
      <FaInfoCircle className="text-blue-600 text-lg mr-2" />
      <h3 className="text-base font-semibold text-gray-800">
        Department-Wide Allowance Info
      </h3>
    </div>

    <div className="space-y-3">
      {/* Scope Info */}
      <div className="flex items-start space-x-2">
        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
          <FaUsers className="text-blue-600 text-xs" />
        </div>
        <div>
          <h4 className="font-medium text-gray-800 text-sm mb-1">Scope</h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            This allowance will be applied to{" "}
            <strong>all active employees</strong> in the selected department.
          </p>
        </div>
      </div>

      {/* Payment Date Info */}
      <div className="flex items-start space-x-2">
        <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
          <FaCalendarAlt className="text-green-600 text-xs" />
        </div>
        <div>
          <h4 className="font-medium text-gray-800 text-sm mb-1">
            Payment Date
          </h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            The allowance will be included in payroll calculations for the month
            containing this payment date.
          </p>
        </div>
      </div>

      {/* Approval Process */}
      <div className="flex items-start space-x-2">
        <div className="flex-shrink-0 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
          <FaClock className="text-yellow-600 text-xs" />
        </div>
        <div>
          <h4 className="font-medium text-gray-800 text-sm mb-1">
            Approval Process
          </h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            <strong>Super Admin created allowances</strong> are automatically
            approved. Department allowances created by others require approval
            from department head and HR manager before being applied to payroll.
          </p>
        </div>
      </div>
    </div>

    {/* Quick Tips */}
    <div className="mt-4 pt-3 border-t border-blue-200">
      <div className="flex items-center mb-2">
        <FaCheckCircle className="text-blue-600 text-xs mr-1" />
        <span className="text-xs font-medium text-gray-700">Quick Tips</span>
      </div>
      <div className="grid grid-cols-1 gap-1 text-xs text-gray-600">
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
          <span>
            Use clear, descriptive reasons for better approval process
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
          <span>Set payment date to the month you want it applied</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
          <span>Only active employees will receive the allowance</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
          <span>Super Admin allowances are automatically approved</span>
        </div>
      </div>
    </div>
  </div>
);

// Beautiful Info Section Component for Employee Allowance Modal
const EmployeeAllowanceInfoSection = () => (
  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-4 shadow-sm">
    <div className="flex items-center mb-3">
      <FaInfoCircle className="text-green-600 text-lg mr-2" />
      <h3 className="text-base font-semibold text-gray-800">
        Individual Employee Allowance Info
      </h3>
    </div>

    <div className="space-y-3">
      {/* Scope Info */}
      <div className="flex items-start space-x-2">
        <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
          <FaUser className="text-green-600 text-xs" />
        </div>
        <div>
          <h4 className="font-medium text-gray-800 text-sm mb-1">Scope</h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            This allowance will be applied to{" "}
            <strong>one specific employee</strong> in the selected department.
          </p>
        </div>
      </div>

      {/* Payment Date Info */}
      <div className="flex items-start space-x-2">
        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
          <FaCalendarAlt className="text-blue-600 text-xs" />
        </div>
        <div>
          <h4 className="font-medium text-gray-800 text-sm mb-1">
            Payment Date
          </h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            The allowance will be included in the employee's payroll for the
            month containing this payment date.
          </p>
        </div>
      </div>

      {/* Approval Process */}
      <div className="flex items-start space-x-2">
        <div className="flex-shrink-0 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
          <FaClock className="text-yellow-600 text-xs" />
        </div>
        <div>
          <h4 className="font-medium text-gray-800 text-sm mb-1">
            Approval Process
          </h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            <strong>Super Admin created allowances</strong> are automatically
            approved. Individual allowances created by others require approval
            from department head and HR manager before being applied to payroll.
          </p>
        </div>
      </div>
    </div>

    {/* Quick Tips */}
    <div className="mt-4 pt-3 border-t border-green-200">
      <div className="flex items-center mb-2">
        <FaCheckCircle className="text-green-600 text-xs mr-1" />
        <span className="text-xs font-medium text-gray-700">Quick Tips</span>
      </div>
      <div className="grid grid-cols-1 gap-1 text-xs text-gray-600">
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
          <span>
            Provide specific achievements or reasons for the allowance
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
          <span>Set payment date to the month you want it applied</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
          <span>Ensure the employee is active and eligible</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
          <span>Super Admin allowances are automatically approved</span>
        </div>
      </div>
    </div>
  </div>
);

export default function AllowanceManagement() {
  const { isSuperAdmin, isAdmin } = useAuth();
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

        return {
          success: response.success,
          message: response.message,
          data: response.data,
        };
      },
    });

  // Add this effect
  useEffect(() => {
    setPage(1);
  }, [filters]);

  // Add effect to log data changes
  useEffect(() => {
    console.log("📊 [AllowanceManagement] Current allowance data:", {
      total: allowanceData?.data?.pagination?.total,
      allowances: allowanceData?.data?.allowances?.length,
      isLoading: isAllowancesLoading,
    });
  }, [allowanceData, isAllowancesLoading]);

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
      console.log(
        "🔵 [AllowanceManagement] Submitting department allowance:",
        deptAllowanceForm
      );
      const response = await allowanceService.createDepartmentAllowance(
        deptAllowanceForm
      );
      console.log(
        "✅ [AllowanceManagement] Department allowance created:",
        response
      );
      toast.success("Department allowance created successfully!");
      setShowDeptAllowanceModal(false);

      // Invalidate and refetch allowances
      console.log("🔄 [AllowanceManagement] Invalidating allowances query...");
      await queryClient.invalidateQueries({ queryKey: ["allowances"] });
      const newData = await queryClient.fetchQuery({
        queryKey: ["allowances", page, limit, filters],
        queryFn: async () => {
          const response = await allowanceService.getAllowanceRequests({
            page,
            limit,
            ...filters,
          });
          console.log(
            "✅ [AllowanceManagement] Refetched allowances:",
            response
          );
          return response;
        },
      });
      console.log("✅ [AllowanceManagement] Updated data:", newData);
    } catch (error) {
      console.error(
        "❌ [AllowanceManagement] Error creating department allowance:",
        error
      );
      toast.error("Failed to create department allowance");
    } finally {
      setDeptAllowanceLoading(false);
    }
  };

  const handleEmployeeAllowanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmployeeAllowanceLoading(true);
    try {
      console.log(
        "🔵 [AllowanceManagement] Submitting employee allowance:",
        employeeAllowanceForm
      );
      const response = await allowanceService.createDepartmentEmployeeAllowance(
        employeeAllowanceForm
      );
      console.log(
        "✅ [AllowanceManagement] Employee allowance created:",
        response
      );
      toast.success("Employee allowance created successfully!");
      setShowEmployeeAllowanceModal(false);

      // Invalidate and refetch allowances
      console.log("🔄 [AllowanceManagement] Invalidating allowances query...");
      await queryClient.invalidateQueries({ queryKey: ["allowances"] });
      const newData = await queryClient.fetchQuery({
        queryKey: ["allowances", page, limit, filters],
        queryFn: async () => {
          const response = await allowanceService.getAllowanceRequests({
            page,
            limit,
            ...filters,
          });
          console.log(
            "✅ [AllowanceManagement] Refetched allowances:",
            response
          );
          return response;
        },
      });
      console.log("✅ [AllowanceManagement] Updated data:", newData);
    } catch (error) {
      console.error(
        "❌ [AllowanceManagement] Error creating employee allowance:",
        error
      );
      toast.error("Failed to create employee allowance");
    } finally {
      setEmployeeAllowanceLoading(false);
    }
  };

  // Calculate stats for beautiful cards
  const totalAllowances =
    (allowanceData as AllowancesListResponse)?.data?.pagination?.total || 0;
  const activeAllowances =
    (allowanceData as AllowancesListResponse)?.data?.allowances?.filter(
      (a: Allowance) => a.approvalStatus === "approved"
    ).length || 0;
  const pendingAllowances =
    (allowanceData as AllowancesListResponse)?.data?.allowances?.filter(
      (a: Allowance) => a.approvalStatus === "PENDING"
    ).length || 0;
  const totalAmount =
    (allowanceData as AllowancesListResponse)?.data?.allowances?.reduce(
      (sum: number, a: Allowance) => sum + (a.amount || 0),
      0
    ) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Allowance Management
            </h1>
            <p className="text-gray-600">
              Manage employee and department allowances with ease
            </p>
          </div>
          {(isSuperAdmin() || isAdmin()) && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeptAllowanceModal(true)}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium"
              >
                <FaUsers className="mr-2" />
                Department Allowance
              </button>
              <button
                onClick={() => setShowEmployeeAllowanceModal(true)}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg shadow-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium"
              >
                <FaUser className="mr-2" />
                Employee Allowance
              </button>
            </div>
          )}
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Total Allowances
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {totalAllowances}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FaHandHoldingUsd className="text-blue-600 text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 font-medium">Active</span>
              <span className="mx-2">•</span>
              <span className="text-gray-500">{activeAllowances} approved</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Active Allowances
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {activeAllowances}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FaCheckCircle className="text-green-600 text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 font-medium">Approved</span>
              <span className="mx-2">•</span>
              <span className="text-gray-500">Ready for payroll</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Pending Review
                </p>
                <p className="text-3xl font-bold text-yellow-600">
                  {pendingAllowances}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <FaClock className="text-yellow-600 text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-yellow-600 font-medium">Awaiting</span>
              <span className="mx-2">•</span>
              <span className="text-gray-500">Approval needed</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Total Amount
                </p>
                <p className="text-3xl font-bold text-purple-600">
                  ₦{totalAmount.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <FaMoneyBillWave className="text-purple-600 text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-purple-600 font-medium">Value</span>
              <span className="mx-2">•</span>
              <span className="text-gray-500">All allowances</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
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
            className="text-sm text-gray-600 hover:text-gray-800 font-medium"
          >
            Clear all
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee
            </label>
            <input
              type="text"
              placeholder="Search by name or email"
              value={filters.employee}
              onChange={(e) =>
                setFilters((f) => ({ ...f, employee: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              value={filters.departmentId}
              onChange={(e) =>
                setFilters((f) => ({ ...f, departmentId: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">All Departments</option>
              {departments?.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((f) => ({ ...f, status: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">All Statuses</option>
              {Object.entries(AllowanceStatus).map(([key, value]) => (
                <option key={key} value={value}>
                  {key.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={filters.type}
              onChange={(e) =>
                setFilters((f) => ({ ...f, type: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">All Types</option>
              {Object.entries(AllowanceType).map(([key, value]) => (
                <option key={key} value={value}>
                  {key.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters((f) => ({ ...f, startDate: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters((f) => ({ ...f, endDate: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Enhanced Table Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Allowance Requests
          </h3>
        </div>

        <div className="overflow-x-auto">
          {isAllowancesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">
                  Loading allowances...
                </p>
              </div>
            </div>
          ) : (allowanceData as AllowancesListResponse)?.data?.allowances
              ?.length === 0 ? (
            <div className="flex items-center justify-center py-16 px-6">
              <div className="text-center max-w-md">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FaHandHoldingUsd className="text-blue-600 text-3xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No allowances found
                </h3>
                <p className="text-gray-600 mb-6">
                  Get started by creating your first allowance for employees or
                  departments.
                </p>
                {(isSuperAdmin() || isAdmin()) && (
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setShowDeptAllowanceModal(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <FaUsers className="mr-2" />
                      Create Department Allowance
                    </button>
                    <button
                      onClick={() => setShowEmployeeAllowanceModal(true)}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      <FaUser className="mr-2" />
                      Create Employee Allowance
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Payment Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Approved By
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(
                  allowanceData as AllowancesListResponse
                )?.data?.allowances?.map((allowance: Allowance) => {
                  // Add log for each allowance row
                  console.log(
                    "[AllowanceManagement] Rendering allowance row:",
                    allowance
                  );
                  return (
                    <tr
                      key={allowance._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Avatar
                            profileImage={allowance.employee?.profileImage}
                            firstName={allowance.employee?.firstName}
                            lastName={allowance.employee?.lastName}
                            size="sm"
                            className="mr-3"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900 break-all">
                              {allowance.employee?.firstName}{" "}
                              {allowance.employee?.lastName}
                            </span>
                            <span className="text-xs text-gray-500 break-all">
                              {allowance.employee?.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {allowance.department?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {allowance.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">
                          ₦{allowance.amount?.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className="text-sm text-gray-900 max-w-xs truncate"
                          title={allowance.reason}
                        >
                          {allowance.reason}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
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
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {new Date(allowance.paymentDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {allowance.approvedBy?.fullName ||
                            (allowance.approvedBy?.firstName &&
                            allowance.approvedBy?.lastName
                              ? `${allowance.approvedBy.firstName} ${allowance.approvedBy.lastName}`
                              : "—")}
                        </div>
                        <div className="text-xs text-gray-500">
                          {allowance.approvedAt
                            ? new Date(
                                allowance.approvedAt
                              ).toLocaleDateString()
                            : ""}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Enhanced Pagination */}
        {allowanceData?.data?.pagination && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">{(page - 1) * limit + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(page * limit, allowanceData.data.pagination.total)}
                </span>{" "}
                of{" "}
                <span className="font-medium">
                  {allowanceData.data.pagination.total}
                </span>{" "}
                allowances
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Show</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {[10, 20, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-700">per page</span>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setPage((p) =>
                        Math.min(
                          Math.ceil(
                            allowanceData.data.pagination.total / limit
                          ),
                          p + 1
                        )
                      )
                    }
                    disabled={
                      page >=
                      Math.ceil(allowanceData.data.pagination.total / limit)
                    }
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
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

            {/* Department Allowance Info Section */}
            <DepartmentAllowanceInfoSection />

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
                {deptAllowanceForm.amount && (
                  <p className="mt-1 text-sm text-gray-600">
                    Formatted:{" "}
                    {formatCurrency(Number(deptAllowanceForm.amount))}
                  </p>
                )}
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
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
                  disabled={deptAllowanceLoading}
                  aria-busy={deptAllowanceLoading}
                >
                  {deptAllowanceLoading ? (
                    <>
                      <FaSpinner className="animate-spin" /> Creating...
                    </>
                  ) : (
                    "Create"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Allowance Modal */}
      {showEmployeeAllowanceModal && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
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

            {/* Employee Allowance Info Section */}
            <EmployeeAllowanceInfoSection />

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
                {employeeAllowanceForm.amount && (
                  <p className="mt-1 text-sm text-gray-600">
                    Formatted:{" "}
                    {formatCurrency(Number(employeeAllowanceForm.amount))}
                  </p>
                )}
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
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                  disabled={employeeAllowanceLoading}
                  aria-busy={employeeAllowanceLoading}
                >
                  {employeeAllowanceLoading ? (
                    <>
                      <FaSpinner className="animate-spin" /> Creating...
                    </>
                  ) : (
                    "Create"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
