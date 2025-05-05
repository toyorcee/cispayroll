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

export default function BonusManagement() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBonus, setEditingBonus] = useState<Bonus | undefined>(
    undefined
  );
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [employeeBonusLoading, setEmployeeBonusLoading] = useState(false);
  const [deptBonusLoading, setDeptBonusLoading] = useState(false);
  const [formData, setFormData] = useState({
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
    queryFn: departmentService.getAllDepartments,
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
  };

  // const handleEdit = (bonus: Bonus) => {
  //   setEditingBonus(bonus);
  //   setShowAddForm(true);
  // };

  // const handleDelete = async (id: string) => {
  //   console.log("Delete bonus:", id);
  // };

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
    setApprovalLoading(true);
    try {
      await bonusService.approveBonusRequest(selectedBonus._id);
      toast.success("Bonus approved successfully!");
      await queryClient.invalidateQueries({ queryKey: ["bonusRequests"] });
      setShowApprovalModal(false);
      setSelectedBonus(null);
    } catch (err) {
      console.error("[Approve Bonus] API error:", err);
      toast.error("Failed to approve bonus");
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleRejectBonus = async () => {
    if (!selectedBonus) return;
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
    } catch (err) {
      console.error("[Reject Bonus] API error:", err);
      toast.error("Failed to reject bonus");
    } finally {
      setRejectionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Bonuses</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {bonusRequests?.data?.pagination?.total || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">
            Pending Approval
          </h3>
          <p className="mt-2 text-3xl font-semibold text-yellow-600">
            {bonusRequests?.data?.bonuses?.filter(
              (bonus: IBonus) => bonus.approvalStatus === "pending"
            ).length || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">
            Approved Bonuses
          </h3>
          <p className="mt-2 text-3xl font-semibold text-green-600">
            {bonusRequests?.data?.bonuses?.filter(
              (bonus: IBonus) => bonus.approvalStatus === "approved"
            ).length || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
          <p className="mt-2 text-3xl font-semibold text-purple-600">
            ₦
            {bonusRequests?.data?.bonuses
              ?.reduce(
                (sum: number, bonus: IBonus) => sum + (bonus.amount || 0),
                0
              )
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
                onClick={() => setShowDeptBonusModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Add Department Bonus
              </button>
              <button
                onClick={() => setShowEmployeeBonusModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md"
              >
                Add Employee Bonus
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter/Search Bar */}
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
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={filters.type}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
          className="border rounded px-2 py-1"
        >
          <option value="">All Types</option>
          {Object.entries(BonusType).map(([key, value]) => (
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

      {/* Main Content */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="p-6">
          {/* Responsive Table Wrapper */}
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[900px] divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bonusesLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center">
                      <div className="text-gray-500 text-sm">Loading...</div>
                    </td>
                  </tr>
                ) : !bonusRequests?.data?.bonuses?.length ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center">
                      <div className="text-gray-500 text-sm">
                        No bonuses found. Click "Add Bonus" to create one.
                      </div>
                    </td>
                  </tr>
                ) : (
                  bonusRequests.data.bonuses.map((bonus: IBonus) => (
                    <tr
                      key={bonus._id}
                      onClick={() => {
                        setSelectedBonus(bonus);
                        setShowApprovalModal(true);
                      }}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {typeof bonus.employee === "object" &&
                          bonus.employee !== null
                            ? (bonus.employee as any).fullName ||
                              ((bonus.employee as any).firstName &&
                              (bonus.employee as any).lastName
                                ? `${(bonus.employee as any).firstName} ${
                                    (bonus.employee as any).lastName
                                  }`
                                : (bonus.employee as any).email || "-")
                            : bonus.employee || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {bonus.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ₦{bonus.amount?.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {typeof bonus.department === "object" &&
                          bonus.department !== null
                            ? (bonus.department as { name?: string }).name ||
                              "All"
                            : bonus.department || "All"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {bonus.paymentDate
                            ? new Date(bonus.paymentDate).toLocaleDateString()
                            : "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {bonusRequests?.data?.pagination && (
            <div className="flex justify-between items-center mt-4">
              <div>
                Page {bonusRequests.data.pagination.page} of{" "}
                {bonusRequests.data.pagination.pages}
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
                      Math.min(bonusRequests.data.pagination.pages, p + 1)
                    )
                  }
                  disabled={page === bonusRequests.data.pagination.pages}
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
                {editingBonus
                  ? "Edit Employee Bonus"
                  : "Create New Employee Bonus"}
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingBonus(undefined);
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
                    name="employee"
                    value={formData.employee}
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
                    Bonus Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  >
                    {Object.entries(BonusType).map(([key, value]) => (
                      <option key={key} value={value}>
                        {key.replace(/_/g, " ")}
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
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    placeholder="Enter bonus amount"
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
                    value={formData.paymentDate}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    name="approvalStatus"
                    value={formData.approvalStatus}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  >
                    {Object.entries(ApprovalStatus).map(([key, value]) => (
                      <option key={key} value={value}>
                        {key.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
                {isSuperAdmin() && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Department
                    </label>
                    <select
                      name="departmentId"
                      value={formData.departmentId}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
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
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Reason for Bonus
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  placeholder="Enter reason for awarding this bonus"
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
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingBonus(undefined);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  {editingBonus ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeptBonusModal && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
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
            <form onSubmit={handleDeptBonusSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <select
                  name="departmentId"
                  value={deptBonusForm.departmentId}
                  onChange={handleDeptBonusChange}
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
                  value={deptBonusForm.amount}
                  onChange={handleDeptBonusChange}
                  className="mt-1 block w-full rounded-md border-gray-300"
                  placeholder="Enter bonus amount"
                  required
                />
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
                  className="mt-1 block w-full rounded-md border-gray-300"
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
                  className="mt-1 block w-full rounded-md border-gray-300"
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
                  className="mt-1 block w-full rounded-md border-gray-300"
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
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  disabled={deptBonusLoading}
                >
                  {deptBonusLoading ? (
                    <span>
                      <svg
                        className="animate-spin h-4 w-4 inline-block mr-2"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        />
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    "Create"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEmployeeBonusModal && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
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
            <form onSubmit={handleEmployeeBonusSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <select
                  name="departmentId"
                  value={employeeBonusForm.departmentId}
                  onChange={handleEmployeeBonusChange}
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
              {employeeBonusForm.departmentId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Employee
                  </label>
                  <select
                    name="employeeId"
                    value={employeeBonusForm.employeeId}
                    onChange={handleEmployeeBonusChange}
                    className="mt-1 block w-full rounded-md border-gray-300"
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
                  className="mt-1 block w-full rounded-md border-gray-300"
                  placeholder="Enter bonus amount"
                  required
                />
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
                  className="mt-1 block w-full rounded-md border-gray-300"
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
                  className="mt-1 block w-full rounded-md border-gray-300"
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
                  className="mt-1 block w-full rounded-md border-gray-300"
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
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  disabled={employeeBonusLoading}
                >
                  {employeeBonusLoading ? (
                    <span>
                      <svg
                        className="animate-spin h-4 w-4 inline-block mr-2"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        />
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    "Create"
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
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedBonus.approvalStatus === "pending"
                  ? "Approve/Reject Bonus"
                  : "Bonus Details"}
              </h3>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedBonus(null);
                  setRejectionReason("");
                }}
                className="text-gray-400 hover:text-gray-500 p-2 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Employee</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {typeof selectedBonus.employee === "object" &&
                  selectedBonus.employee !== null
                    ? (selectedBonus.employee as any).fullName ||
                      ((selectedBonus.employee as any).firstName &&
                      (selectedBonus.employee as any).lastName
                        ? `${(selectedBonus.employee as any).firstName} ${
                            (selectedBonus.employee as any).lastName
                          }`
                        : (selectedBonus.employee as any).email || "-")
                    : selectedBonus.employee || "-"}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700">Amount</h4>
                <p className="mt-1 text-sm text-gray-900">
                  ₦{selectedBonus.amount?.toLocaleString()}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700">Type</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedBonus.type}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700">
                  Payment Date
                </h4>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedBonus.paymentDate
                    ? new Date(selectedBonus.paymentDate).toLocaleDateString()
                    : "-"}
                </p>
              </div>

              {selectedBonus.approvalStatus === "pending" && (
                <>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">
                      Reason for Rejection
                    </h4>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                      rows={3}
                      placeholder="Enter reason for rejection (required for rejection)"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={handleApproveBonus}
                      disabled={approvalLoading || rejectionLoading}
                      className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      {approvalLoading ? (
                        <span className="flex items-center">
                          <svg
                            className="animate-spin h-4 w-4 mr-2"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8z"
                            />
                          </svg>
                          Approving...
                        </span>
                      ) : (
                        "Approve"
                      )}
                    </button>
                    <button
                      onClick={handleRejectBonus}
                      disabled={approvalLoading || rejectionLoading}
                      className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      {rejectionLoading ? (
                        <span className="flex items-center">
                          <svg
                            className="animate-spin h-4 w-4 mr-2"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8z"
                            />
                          </svg>
                          Rejecting...
                        </span>
                      ) : (
                        "Reject"
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
