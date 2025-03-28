import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaPlus, FaEdit, FaTrash, FaHistory } from "react-icons/fa";
import { allowanceService } from "../../../services/allowanceService";
import AllowanceForm from "../../../components/payroll/allowance/AllowanceForm";
import type { AllowanceWithId } from "../../../types/payroll";

export default function AllowanceManagement() {
  const [allowances, setAllowances] = useState<AllowanceWithId[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAllowance, setEditingAllowance] = useState<
    AllowanceWithId | undefined
  >(undefined);
  const [view, setView] = useState<"list" | "analytics">("list");

  const fetchAllowances = async () => {
    try {
      console.log("🔄 Fetching allowances...");
      const response = await allowanceService.getAllAllowances();
      console.log("📦 Received allowances:", response.data);
      setAllowances(response.data as AllowanceWithId[]);
    } catch (error) {
      console.error("❌ Error fetching allowances:", error);
      toast.error("Failed to fetch allowances");
    } finally {
      // Removed isInitialLoading setter
    }
  };

  useEffect(() => {
    fetchAllowances();
  }, []);

  // const handleUpdate = async (id: string, data: Partial<ISalaryComponent>) => {
  //   try {
  //     const updateData = {
  //       ...data,
  //       type: data.type as "allowance" | "deduction",
  //     };
  //     await allowanceService.updateAllowance(id, updateData);
  //     await fetchAllowances();
  //     toast.success("Allowance updated successfully");
  //   } catch {
  //     toast.error("Failed to update allowance");
  //   }
  // };

  const handleToggleStatus = async (id: string) => {
    try {
      // setIsLoading(true);
      await allowanceService.toggleAllowanceStatus(id);
      await fetchAllowances();
      toast.success("Status updated successfully");
    } catch (error) {
      console.error("Toggle status failed:", error);
      toast.error("Failed to toggle status");
    } finally {
      // setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await allowanceService.deleteAllowance(id);
      await fetchAllowances();
      toast.success("Allowance deleted successfully");
    } catch (error) {
      console.error("Error deleting allowance:", error);
      toast.error("Failed to delete allowance");
    }
  };

  const handleEdit = (allowance: AllowanceWithId) => {
    setEditingAllowance(allowance);
    setShowAddForm(true);
  };

  // const handleCreateAllowance = async () => {
  //   // try {
  //   //   setIsLoading(true);
  //   //   const createData = {
  //   //     ...data,
  //   //     type: data.type as "allowance" | "deduction",
  //   //   };
  //   //   await allowanceService.createAllowance(createData);
  //   //   await fetchAllowances();
  //   //   setShowAddForm(false);
  //   //   toast.success("Allowance created successfully");
  //   // } catch (error) {
  //   //   console.error("Create allowance failed:", error);
  //   //   toast.error("Failed to create allowance");
  //   // } finally {
  //   //   setIsLoading(false);
  //   // }
  // };

  return (
    <div className="space-y-6">
      {/* Header Section with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">
            Total Allowances
          </h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {allowances.length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">
            Active Allowances
          </h3>
          <p className="mt-2 text-3xl font-semibold text-green-600">
            {allowances.filter((a) => a.isActive).length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">
            Departments Using
          </h3>
          <p className="mt-2 text-3xl font-semibold text-blue-600">
            {/* This would come from your actual data */}5
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Monthly Impact</h3>
          <p className="mt-2 text-3xl font-semibold text-purple-600">₦2.5M</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <button
              onClick={() => setView("list")}
              className={`px-4 py-2 rounded-md ${
                view === "list"
                  ? "bg-green-50 text-green-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setView("analytics")}
              className={`px-4 py-2 rounded-md ${
                view === "analytics"
                  ? "bg-green-50 text-green-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Analytics
            </button>
          </div>
          <button
            onClick={() => {
              setEditingAllowance(undefined);
              setShowAddForm(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent 
                     rounded-md shadow-sm text-sm font-medium text-white 
                     bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 
                     focus:ring-offset-2 focus:ring-green-500"
          >
            <FaPlus className="mr-2 -ml-1 h-4 w-4" />
            Create Allowance
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Calculation Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Departments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allowances.map((allowance) => (
                  <tr key={allowance._id.toString()}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {allowance.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        Last modified:{" "}
                        {new Date(
                          allowance.lastModified || Date.now()
                        ).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {allowance.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {allowance.calculationMethod === "percentage"
                          ? `${allowance.value}%`
                          : `₦${allowance.value.toLocaleString()}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {allowance.calculationMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {allowance.departmentsApplied || "All"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {allowance.employeesAffected || 0} employees
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          handleToggleStatus(allowance._id.toString())
                        }
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${
                            allowance.isActive
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                      >
                        {allowance.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(allowance)}
                        className="text-green-600 hover:text-green-900 mr-4"
                        title="Edit Allowance"
                      >
                        <FaEdit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(allowance._id.toString())}
                        className="text-red-600 hover:text-red-900 mr-4"
                        title="Delete Allowance"
                      >
                        <FaTrash className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          /* View history */
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View History"
                      >
                        <FaHistory className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingAllowance ? "Edit Allowance" : "Create New Allowance"}
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
            <AllowanceForm
              // allowance={editingAllowance}
              // isLoading={isLoading}
              // onSubmit={async (data: Partial<ISalaryComponent>) => {
              //   if (editingAllowance) {
              //     await handleUpdate(editingAllowance._id.toString(), data);
              //   } else {
              //     await handleCreateAllowance(data);
              //   }
              //   setShowAddForm(false);
              //   setEditingAllowance(undefined);
              // }}
              // onCancel={() => {
              //   setShowAddForm(false);
              //   setEditingAllowance(undefined);
              // }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
