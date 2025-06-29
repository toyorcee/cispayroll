import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { departmentService } from "../../../services/departmentService";
import { useAuth } from "../../../context/AuthContext";
import {
  adminEmployeeService,
  DepartmentEmployeeResponse,
} from "../../../services/adminEmployeeService";
import { bonusService } from "../../../services/bonusService";
import { toast } from "react-toastify";
import { IBonus } from "../../../types/payroll";
import { formatCurrency } from "../../../utils/formatters";
import {
  FaInfoCircle,
  FaCalendarAlt,
  FaUsers,
  FaUser,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaTrophy,
  FaStar,
  FaSpinner,
} from "react-icons/fa";
import { Avatar } from "../../../components/shared/Avatar";
import { getProfileImageUrl } from "../../../utils/imageUtils";

// Constants from the model
const BonusType = {
  PERFORMANCE: "performance",
  THIRTEENTH_MONTH: "thirteenth_month",
  SPECIAL: "special",
  ACHIEVEMENT: "achievement",
  RETENTION: "retention",
  PROJECT: "project",
};

const ApprovalStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

interface Bonus {
  _id: string;
  employee: string;
  type: string;
  amount: number;
  description?: string;
  paymentDate: Date;
  approvalStatus: string;
  department?: string;
  taxable: boolean;
  createdBy?: string;
  updatedBy?: string;
}

// Beautiful Info Section Component for Department Bonus Modal
const DepartmentBonusInfoSection = () => (
  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 mb-4 shadow-sm">
    <div className="flex items-center mb-3">
      <FaInfoCircle className="text-purple-600 text-lg mr-2" />
      <h3 className="text-base font-semibold text-gray-800">
        Department-Wide Bonus Info
      </h3>
    </div>

    <div className="space-y-3">
      {/* Scope Info */}
      <div className="flex items-start space-x-2">
        <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
          <FaUsers className="text-purple-600 text-xs" />
        </div>
        <div>
          <h4 className="font-medium text-gray-800 text-sm mb-1">Scope</h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            This bonus will be awarded to <strong>all active employees</strong>{" "}
            in the selected department.
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
            The bonus will be included in payroll calculations for the month
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
            <strong>Super Admin created bonuses</strong> are automatically
            approved. Department bonuses created by others require approval from
            department head and HR manager before being applied to payroll.
          </p>
        </div>
      </div>
    </div>

    {/* Quick Tips */}
    <div className="mt-4 pt-3 border-t border-purple-200">
      <div className="flex items-center mb-2">
        <FaCheckCircle className="text-purple-600 text-xs mr-1" />
        <span className="text-xs font-medium text-gray-700">Quick Tips</span>
      </div>
      <div className="grid grid-cols-1 gap-1 text-xs text-gray-600">
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
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
          <span>Only active employees will receive the bonus</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
          <span>Bonuses are typically taxable unless specified otherwise</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
          <span>Super Admin bonuses are automatically approved</span>
        </div>
      </div>
    </div>
  </div>
);

// Beautiful Info Section Component for Employee Bonus Modal
const EmployeeBonusInfoSection = () => (
  <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 mb-4 shadow-sm">
    <div className="flex items-center mb-3">
      <FaInfoCircle className="text-orange-600 text-lg mr-2" />
      <h3 className="text-base font-semibold text-gray-800">
        Individual Employee Bonus Info
      </h3>
    </div>

    <div className="space-y-3">
      {/* Scope Info */}
      <div className="flex items-start space-x-2">
        <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
          <FaUser className="text-orange-600 text-xs" />
        </div>
        <div>
          <h4 className="font-medium text-gray-800 text-sm mb-1">Scope</h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            This bonus will be awarded to <strong>one specific employee</strong>{" "}
            in the selected department.
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
            The bonus will be included in the employee's payroll for the month
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
            <strong>Super Admin created bonuses</strong> are automatically
            approved. Individual bonuses created by others require approval from
            department head and HR manager before being applied to payroll.
          </p>
        </div>
      </div>
    </div>

    {/* Quick Tips */}
    <div className="mt-4 pt-3 border-t border-orange-200">
      <div className="flex items-center mb-2">
        <FaCheckCircle className="text-orange-600 text-xs mr-1" />
        <span className="text-xs font-medium text-gray-700">Quick Tips</span>
      </div>
      <div className="grid grid-cols-1 gap-1 text-xs text-gray-600">
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
          <span>Provide specific achievements or reasons for the bonus</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
          <span>Set payment date to the month you want it applied</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
          <span>Ensure the employee is active and eligible</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
          <span>Bonuses are typically taxable unless specified otherwise</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
          <span>Super Admin bonuses are automatically approved</span>
        </div>
      </div>
    </div>
  </div>
);

function isEmployeeObject(emp: any): emp is {
  profileImage?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
} {
  return (
    typeof emp === "object" &&
    emp !== null &&
    ("firstName" in emp ||
      "lastName" in emp ||
      "profileImage" in emp ||
      "email" in emp)
  );
}

function isUserObject(
  user: any
): user is { fullName?: string; firstName?: string; lastName?: string } {
  return (
    typeof user === "object" &&
    user !== null &&
    ("fullName" in user || "firstName" in user || "lastName" in user)
  );
}

function getEmployeeName(employee: any) {
  if (!employee) return "Unknown Employee";

  // If employee is a string (ID), return it
  if (typeof employee === "string") return employee;

  // If employee is an object, handle the name properties
  if (typeof employee === "object" && employee !== null) {
    if (employee.fullName) return employee.fullName;
    if (employee.firstName && employee.lastName)
      return `${employee.firstName} ${employee.lastName}`;
    if (employee.email) return employee.email;
  }

  return "Unknown Employee";
}

export default function BonusManagement() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_showAddForm, _setShowAddForm] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_editingBonus, _setEditingBonus] = useState<Bonus | undefined>(
    undefined
  );
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [employeeBonusLoading, setEmployeeBonusLoading] = useState(false);
  const [deptBonusLoading, setDeptBonusLoading] = useState(false);
  const [_formData, _setFormData] = useState({
    employee: "",
    employeeId: "",
    type: BonusType.PERFORMANCE,
    amount: 0,
    description: "",
    paymentDate: new Date().toISOString().split("T")[0],
    approvalStatus: ApprovalStatus.PENDING,
    department: "",
    taxable: true,
    departmentId: "",
  });
  const { user } = useAuth();
  const { isSuperAdmin } = useAuth();
  const { isAdmin } = useAuth();
  const [showDeptBonusModal, setShowDeptBonusModal] = useState(false);
  const [deptBonusForm, setDeptBonusForm] = useState({
    departmentId: "",
    amount: "",
    reason: "",
    paymentDate: new Date().toISOString().split("T")[0],
    type: "special",
  });
  const [showEmployeeBonusModal, setShowEmployeeBonusModal] = useState(false);
  const [employeeBonusForm, setEmployeeBonusForm] = useState({
    departmentId: "",
    employeeId: "",
    amount: "",
    reason: "",
    paymentDate: new Date().toISOString().split("T")[0],
    type: "performance",
  });
  const [filters, setFilters] = useState({
    employee: "",
    departmentId: "",
    status: "",
    type: "",
    startDate: "",
    endDate: "",
  });
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedBonus, setSelectedBonus] = useState<IBonus | null>(null);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [rejectionLoading, setRejectionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: departments, isLoading: departmentsLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: () =>
      departmentService.getAllDepartments(user?.role, user?.permissions),
  });

  const { data: employeeList, isLoading: employeesLoading } =
    useQuery<DepartmentEmployeeResponse>({
      queryKey: ["departmentEmployees", employeeBonusForm.departmentId],
      queryFn: async () => {
        const response = await adminEmployeeService.getDepartmentEmployees({
          departmentId: employeeBonusForm.departmentId,
          userRole: isSuperAdmin() ? "SUPER_ADMIN" : "ADMIN",
        });

        return response;
      },
      enabled: !!employeeBonusForm.departmentId,
    });

  const { data: bonusRequests, isLoading: bonusesLoading } = useQuery({
    queryKey: ["bonusRequests", page, limit, filters],
    queryFn: () => bonusService.getAllBonuses({ page, limit, ...filters }),
  });

  const queryClient = useQueryClient();

  // Calculate stats for beautiful cards
  const totalBonuses = bonusRequests?.data?.pagination?.total || 0;
  const pendingBonuses =
    bonusRequests?.data?.bonuses?.filter(
      (bonus: IBonus) => bonus.approvalStatus === "pending"
    ).length || 0;
  const approvedBonuses =
    bonusRequests?.data?.bonuses?.filter(
      (bonus: IBonus) => bonus.approvalStatus === "approved"
    ).length || 0;
  const totalAmount =
    bonusRequests?.data?.bonuses?.reduce(
      (sum: number, bonus: IBonus) => sum + (bonus.amount || 0),
      0
    ) || 0;

  const handleDeptBonusChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setDeptBonusForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDeptBonusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeptBonusLoading(true);
    const payload = {
      amount: Number(deptBonusForm.amount),
      reason: deptBonusForm.reason,
      paymentDate: deptBonusForm.paymentDate,
      type: deptBonusForm.type,
      departmentId: deptBonusForm.departmentId,
    };
    try {
      await bonusService.createDepartmentWideBonus(payload);
      toast.success("Department bonus created successfully!");
      await queryClient.invalidateQueries({ queryKey: ["bonusRequests"] });
    } catch (err) {
      console.error("[Department Bonus] API error:", err);
      toast.error("Failed to create department bonus");
    } finally {
      setDeptBonusLoading(false);
      setShowDeptBonusModal(false);
      setDeptBonusForm({
        departmentId: "",
        amount: "",
        reason: "",
        paymentDate: new Date().toISOString().split("T")[0],
        type: "special",
      });
    }
  };

  const handleEmployeeBonusChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setEmployeeBonusForm((prev) => {
      const updated = {
        ...prev,
        [name]: value,
        ...(name === "departmentId" ? { employeeId: "" } : {}),
      };

      return updated;
    });
  };

  const handleEmployeeBonusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmployeeBonusLoading(true);
    const payload = {
      employeeId: employeeBonusForm.employeeId,
      amount: Number(employeeBonusForm.amount),
      reason: employeeBonusForm.reason,
      paymentDate: employeeBonusForm.paymentDate,
      type: employeeBonusForm.type,
    };
    try {
      await bonusService.createDepartmentEmployeeBonus(payload);
      toast.success("Employee bonus created successfully!");
      await queryClient.invalidateQueries({ queryKey: ["bonusRequests"] });
    } catch (err) {
      console.error("[Employee Bonus] API error:", err);
      toast.error("Failed to create employee bonus");
    } finally {
      setEmployeeBonusLoading(false);
      setShowEmployeeBonusModal(false);
      setEmployeeBonusForm({
        departmentId: "",
        employeeId: "",
        amount: "",
        reason: "",
        paymentDate: new Date().toISOString().split("T")[0],
        type: BonusType.PERFORMANCE,
      });
    }
  };

  const handleApproveBonus = async () => {
    if (!selectedBonus) return;

    // Check if bonus is already approved or rejected
    if (selectedBonus.approvalStatus !== "pending") {
      toast.error(
        `Cannot approve bonus that is already ${selectedBonus.approvalStatus}`
      );
      return;
    }

    setApprovalLoading(true);
    try {
      await bonusService.approveBonusRequest(selectedBonus._id);
      toast.success("Bonus approved successfully!");
      await queryClient.invalidateQueries({ queryKey: ["bonusRequests"] });
      setShowApprovalModal(false);
      setSelectedBonus(null);
    } catch (err: any) {
      console.error("[Approve Bonus] API error:", err);
      // Don't show error toast if it's a 400 error (already handled by backend)
      if (err.response?.status !== 400) {
        toast.error(err.message || "Failed to approve bonus");
      }
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleRejectBonus = async () => {
    if (!selectedBonus) return;

    // Check if bonus is already approved or rejected
    if (selectedBonus.approvalStatus !== "pending") {
      toast.error(
        `Cannot reject bonus that is already ${selectedBonus.approvalStatus}`
      );
      return;
    }

    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    setRejectionLoading(true);
    try {
      await bonusService.rejectBonusRequest(selectedBonus._id, rejectionReason);
      toast.success("Bonus rejected successfully!");
      await queryClient.invalidateQueries({ queryKey: ["bonusRequests"] });
      setShowApprovalModal(false);
      setSelectedBonus(null);
      setRejectionReason("");
    } catch (err: any) {
      console.error("[Reject Bonus] API error:", err);
      // Don't show error toast if it's a 400 error (already handled by backend)
      if (err.response?.status !== 400) {
        toast.error(err.message || "Failed to reject bonus");
      }
    } finally {
      setRejectionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bonus Management
            </h1>
            <p className="text-gray-600">
              Manage employee and department bonuses with ease
            </p>
          </div>
          {(isSuperAdmin() || isAdmin()) && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeptBonusModal(true)}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg shadow-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-medium cursor-pointer"
              >
                <FaUsers className="mr-2" />
                Department Bonus
              </button>
              <button
                onClick={() => setShowEmployeeBonusModal(true)}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg shadow-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-200 font-medium cursor-pointer"
              >
                <FaUser className="mr-2" />
                Employee Bonus
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
                  Total Bonuses
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {totalBonuses}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <FaTrophy className="text-purple-600 text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-purple-600 font-medium">Awarded</span>
              <span className="mx-2">•</span>
              <span className="text-gray-500">{approvedBonuses} approved</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Approved Bonuses
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {approvedBonuses}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FaCheckCircle className="text-green-600 text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 font-medium">Ready</span>
              <span className="mx-2">•</span>
              <span className="text-gray-500">For payroll</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Pending Review
                </p>
                <p className="text-3xl font-bold text-yellow-600">
                  {pendingBonuses}
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
                <p className="text-3xl font-bold text-orange-600">
                  ₦{totalAmount.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <FaMoneyBillWave className="text-orange-600 text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-orange-600 font-medium">Value</span>
              <span className="mx-2">•</span>
              <span className="text-gray-500">All bonuses</span>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            >
              <option value="">All Types</option>
              {Object.entries(BonusType).map(([key, value]) => (
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Enhanced Table Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Bonus Requests
          </h3>
        </div>

        <div className="overflow-x-auto">
          {bonusesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Loading bonuses...</p>
              </div>
            </div>
          ) : !bonusRequests?.data?.bonuses?.length ? (
            <div className="flex items-center justify-center py-16 px-6">
              <div className="text-center max-w-md">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FaTrophy className="text-purple-600 text-3xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No bonuses found
                </h3>
                <p className="text-gray-600 mb-6">
                  Get started by creating your first bonus for employees or
                  departments to recognize their achievements.
                </p>
                {(isSuperAdmin() || isAdmin()) && (
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setShowDeptBonusModal(true)}
                      className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      <FaUsers className="mr-2" />
                      Create Department Bonus
                    </button>
                    <button
                      onClick={() => setShowEmployeeBonusModal(true)}
                      className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                    >
                      <FaUser className="mr-2" />
                      Create Employee Bonus
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
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Payment Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Approved By
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bonusRequests.data.bonuses.map((bonus: IBonus) => {
                  console.log("[BonusManagement] Rendering bonus row:", bonus);

                  if (
                    typeof bonus.employee === "object" &&
                    bonus.employee !== null
                  ) {
                    const employeeObj = bonus.employee as any;
                    console.log("[BonusManagement] Employee image data:", {
                      profileImage: employeeObj.profileImage,
                      profileImageUrl: employeeObj.profileImageUrl,
                      fullImageUrl: getProfileImageUrl(employeeObj),
                    });
                  }

                  return (
                    <tr
                      key={bonus._id}
                      onClick={() => {
                        setSelectedBonus(bonus);
                        setShowApprovalModal(true);
                      }}
                      className={`${
                        bonus.approvalStatus === "pending"
                          ? "cursor-pointer hover:bg-gray-50"
                          : "cursor-default"
                      } transition-colors`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Avatar
                            profileImage={
                              isEmployeeObject(bonus.employee)
                                ? bonus.employee.profileImage
                                : undefined
                            }
                            firstName={
                              isEmployeeObject(bonus.employee)
                                ? bonus.employee.firstName
                                : undefined
                            }
                            lastName={
                              isEmployeeObject(bonus.employee)
                                ? bonus.employee.lastName
                                : undefined
                            }
                            size="sm"
                            className="mr-3"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900 break-all">
                              {isEmployeeObject(bonus.employee)
                                ? `${bonus.employee.firstName ?? ""} ${
                                    bonus.employee.lastName ?? ""
                                  }`.trim() ||
                                  bonus.employee.email ||
                                  "Unknown Employee"
                                : bonus.employee}
                            </span>
                            <span className="text-xs text-gray-500 break-all">
                              {isEmployeeObject(bonus.employee)
                                ? bonus.employee.email || ""
                                : ""}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {bonus.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(bonus.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {typeof bonus.department === "object" &&
                          bonus.department !== null
                            ? (bonus.department as { name?: string }).name ||
                              "All"
                            : bonus.department || "All"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {bonus.paymentDate
                            ? new Date(bonus.paymentDate).toLocaleDateString()
                            : "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
              ${
                bonus.approvalStatus === "approved"
                  ? "bg-green-100 text-green-800"
                  : bonus.approvalStatus === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}
                          >
                            {bonus.approvalStatus}
                          </span>
                          {bonus.approvalStatus === "pending" && (
                            <span className="text-xs text-gray-500 mt-1">
                              Click to review
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900 break-all">
                            {isUserObject(bonus.approvedBy) &&
                            bonus.approvedBy.fullName
                              ? bonus.approvedBy.fullName
                              : isUserObject(bonus.approvedBy) &&
                                bonus.approvedBy.firstName &&
                                bonus.approvedBy.lastName
                              ? `${bonus.approvedBy.firstName} ${bonus.approvedBy.lastName}`
                              : "—"}
                          </span>
                          <span className="text-xs text-gray-500 break-all">
                            {bonus.approvedAt
                              ? new Date(bonus.approvedAt).toLocaleDateString()
                              : ""}
                          </span>
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
        {bonusRequests?.data?.pagination && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">{(page - 1) * limit + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(page * limit, bonusRequests.data.pagination.total)}
                </span>{" "}
                of{" "}
                <span className="font-medium">
                  {bonusRequests.data.pagination.total}
                </span>{" "}
                bonuses
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
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                        Math.min(bonusRequests.data.pagination.pages, p + 1)
                      )
                    }
                    disabled={page === bonusRequests.data.pagination.pages}
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

      {showDeptBonusModal && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Create Department Bonus
              </h3>
              <button
                onClick={() => setShowDeptBonusModal(false)}
                className="text-gray-400 hover:text-gray-500 p-2"
              >
                ×
              </button>
            </div>

            {/* Department Bonus Info Section */}
            <DepartmentBonusInfoSection />

            <form onSubmit={handleDeptBonusSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <select
                  name="departmentId"
                  value={deptBonusForm.departmentId}
                  onChange={handleDeptBonusChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
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
                  value={deptBonusForm.amount}
                  onChange={handleDeptBonusChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="Enter bonus amount"
                  required
                  min="0"
                  step="0.01"
                />
                {deptBonusForm.amount && (
                  <p className="mt-1 text-sm text-gray-600">
                    Formatted: {formatCurrency(Number(deptBonusForm.amount))}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Reason
                </label>
                <textarea
                  name="reason"
                  value={deptBonusForm.reason}
                  onChange={handleDeptBonusChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="Enter reason for awarding this bonus"
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
                  value={deptBonusForm.paymentDate}
                  onChange={handleDeptBonusChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Bonus Type
                </label>
                <select
                  name="type"
                  value={deptBonusForm.type}
                  onChange={handleDeptBonusChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  required
                >
                  {Object.entries(BonusType).map(([key, value]) => (
                    <option key={key} value={value}>
                      {key.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowDeptBonusModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg cursor-pointer flex items-center justify-center gap-2"
                  disabled={deptBonusLoading}
                >
                  {deptBonusLoading ? (
                    <>
                      <FaSpinner className="animate-spin" /> Creating...
                    </>
                  ) : (
                    "Create Bonus"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEmployeeBonusModal && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Create Employee Bonus
              </h3>
              <button
                onClick={() => setShowEmployeeBonusModal(false)}
                className="text-gray-400 hover:text-gray-500 p-2"
              >
                ×
              </button>
            </div>

            {/* Employee Bonus Info Section */}
            <EmployeeBonusInfoSection />

            <form onSubmit={handleEmployeeBonusSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <select
                  name="departmentId"
                  value={employeeBonusForm.departmentId}
                  onChange={handleEmployeeBonusChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
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
              {employeeBonusForm.departmentId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Employee
                  </label>
                  <select
                    name="employeeId"
                    value={employeeBonusForm.employeeId}
                    onChange={handleEmployeeBonusChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    required
                    disabled={employeesLoading}
                  >
                    <option value="">
                      {employeesLoading
                        ? "Loading employees..."
                        : "Select Employee"}
                    </option>
                    {employeeList?.data?.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.fullName ||
                          `${emp.firstName || ""} ${emp.lastName || ""}`}{" "}
                        ({emp.employeeId})
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
                  value={employeeBonusForm.amount}
                  onChange={handleEmployeeBonusChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  placeholder="Enter bonus amount"
                  required
                  min="0"
                  step="0.01"
                />
                {employeeBonusForm.amount && (
                  <p className="mt-1 text-sm text-gray-600">
                    Formatted:{" "}
                    {formatCurrency(Number(employeeBonusForm.amount))}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Reason
                </label>
                <textarea
                  name="reason"
                  value={employeeBonusForm.reason}
                  onChange={handleEmployeeBonusChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  placeholder="Enter reason for awarding this bonus"
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
                  value={employeeBonusForm.paymentDate}
                  onChange={handleEmployeeBonusChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Bonus Type
                </label>
                <select
                  name="type"
                  value={employeeBonusForm.type}
                  onChange={handleEmployeeBonusChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  required
                >
                  {Object.entries(BonusType).map(([key, value]) => (
                    <option key={key} value={value}>
                      {key.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEmployeeBonusModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 transition-all duration-200 shadow-lg cursor-pointer flex items-center justify-center gap-2"
                  disabled={employeeBonusLoading}
                >
                  {employeeBonusLoading ? (
                    <>
                      <FaSpinner className="animate-spin" /> Creating...
                    </>
                  ) : (
                    "Create Bonus"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showApprovalModal && selectedBonus && (
        <div
          className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => {
            setShowApprovalModal(false);
            setSelectedBonus(null);
            setRejectionReason("");
          }}
        >
          <div
            className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mr-3">
                  <FaTrophy className="text-purple-600 text-lg" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedBonus.approvalStatus === "pending"
                    ? "Approve/Reject Bonus"
                    : "Bonus Details"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedBonus(null);
                  setRejectionReason("");
                }}
                className="text-gray-400 hover:text-gray-500 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <span className="text-2xl font-bold">×</span>
              </button>
            </div>

            <div className="space-y-4">
              {/* Employee Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <FaUser className="text-gray-600 text-sm mr-2" />
                  <h4 className="text-sm font-medium text-gray-700">
                    Employee
                  </h4>
                </div>
                <p className="text-sm text-gray-900 font-medium">
                  {getEmployeeName(selectedBonus.employee)}
                </p>
              </div>

              {/* Amount Info */}
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <FaMoneyBillWave className="text-green-600 text-sm mr-2" />
                  <h4 className="text-sm font-medium text-gray-700">Amount</h4>
                </div>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(selectedBonus.amount)}
                </p>
              </div>

              {/* Type Info */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <FaStar className="text-blue-600 text-sm mr-2" />
                  <h4 className="text-sm font-medium text-gray-700">Type</h4>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {selectedBonus.type}
                </span>
              </div>

              {/* Payment Date Info */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <FaCalendarAlt className="text-yellow-600 text-sm mr-2" />
                  <h4 className="text-sm font-medium text-gray-700">
                    Payment Date
                  </h4>
                </div>
                <p className="text-sm text-gray-900">
                  {selectedBonus.paymentDate
                    ? new Date(selectedBonus.paymentDate).toLocaleDateString()
                    : "-"}
                </p>
              </div>

              {selectedBonus.approvalStatus === "pending" && (
                <>
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <FaExclamationTriangle className="text-red-600 text-sm mr-2" />
                      <h4 className="text-sm font-medium text-gray-700">
                        Reason for Rejection
                      </h4>
                    </div>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      rows={3}
                      placeholder="Enter reason for rejection (required for rejection)"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleApproveBonus}
                      disabled={approvalLoading || rejectionLoading}
                      className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                    >
                      {approvalLoading ? (
                        <>
                          <FaSpinner className="animate-spin" /> Approving...
                        </>
                      ) : (
                        "Approve Bonus"
                      )}
                    </button>
                    <button
                      onClick={handleRejectBonus}
                      disabled={approvalLoading || rejectionLoading}
                      className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                    >
                      {rejectionLoading ? (
                        <>
                          <FaSpinner className="animate-spin" /> Rejecting...
                        </>
                      ) : (
                        "Reject Bonus"
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
