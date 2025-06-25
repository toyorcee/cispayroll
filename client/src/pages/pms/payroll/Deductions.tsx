import { useState, useEffect, useRef } from "react";
import { FaPlus, FaFilter, FaSearch, FaChartBar, FaCog } from "react-icons/fa";
import { deductionService } from "../../../services/deductionService";
import {
  Deduction,
  CreateDeductionInput,
  UpdateDeductionInput,
  DeductionType,
} from "../../../types/deduction";
import { DeductionsTable } from "../../../components/payroll/deductions/DeductionsTable";
import { DeductionForm } from "../../../components/payroll/deductions/DeductionForm";
import { useAuth } from "../../../context/AuthContext";

interface DeductionsState {
  statutory: Deduction[];
  voluntary: Deduction[];
}

export default function Deductions() {
  const { user } = useAuth();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [deductions, setDeductions] = useState<DeductionsState>({
    statutory: [],
    voluntary: [],
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDeduction, setEditingDeduction] = useState<
    Deduction | undefined
  >(undefined);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const [deductionType, setDeductionType] = useState<DeductionType>(
    DeductionType.VOLUNTARY
  );

  const fetchDeductions = async () => {
    try {
      setIsInitialLoading(true);
      const deductionsData =
        user?.role === "ADMIN"
          ? await deductionService.adminService.getAllDeductions()
          : await deductionService.getAllDeductions();
      setDeductions(deductionsData);
    } catch (error) {
      console.error("❌ Error fetching deductions:", error);
      setDeductions({ statutory: [], voluntary: [] });
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchDeductions();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowTypeMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUpdate = async (id: string, data: UpdateDeductionInput) => {
    try {
      setIsLoading(true);
      await deductionService.updateDeduction(id, data);
      await fetchDeductions();
      setShowAddForm(false);
      setEditingDeduction(undefined);
    } catch (error) {
      console.error("Error updating deduction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      setIsLoading(true);
      const { deduction } = await deductionService.toggleDeductionStatus(id);

      // Update only the specific deduction in the state
      setDeductions((prevDeductions) => ({
        statutory: prevDeductions.statutory.map((d) =>
          d._id === id ? { ...d, isActive: deduction.isActive } : d
        ),
        voluntary: prevDeductions.voluntary.map((d) =>
          d._id === id ? { ...d, isActive: deduction.isActive } : d
        ),
      }));
    } catch (error) {
      console.error("Toggle status failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deductionService.deleteDeduction(id);
      await fetchDeductions();
    } catch (error) {
      console.error("Error deleting deduction:", error);
    }
  };

  const handleEdit = (deduction: Deduction) => {
    setEditingDeduction(deduction);
    setShowAddForm(true);
  };

  const handleCreateDeduction = async (data: CreateDeductionInput) => {
    try {
      setIsLoading(true);
      if (data.type === "statutory") {
        await deductionService.createCustomStatutoryDeduction(data);
      } else {
        await deductionService.createVoluntaryDeduction(data);
      }
      await fetchDeductions();
      setShowAddForm(false);
      setEditingDeduction(undefined);
    } catch (error) {
      console.error("Error creating deduction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalDeductions =
    deductions.statutory.length + deductions.voluntary.length;
  const activeDeductions = [
    ...deductions.statutory,
    ...deductions.voluntary,
  ].filter((d) => d.isActive).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Deductions Management
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage statutory and voluntary deductions for your organization
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-4">
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowTypeMenu(!showTypeMenu)}
                  className="inline-flex items-center px-4 py-2 border border-transparent 
                           rounded-lg shadow-sm text-sm font-medium text-white 
                           bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 
                           transition-all duration-200 transform hover:scale-105"
                >
                  <FaPlus className="mr-2 h-4 w-4" />
                  Add Deduction
                  <svg
                    className="w-4 h-4 ml-2 transition-transform duration-200"
                    style={{
                      transform: showTypeMenu
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showTypeMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 border border-gray-200">
                    <div className="py-1" role="menu">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Choose Deduction Type
                      </div>
                      <button
                        onClick={() => {
                          setDeductionType(DeductionType.STATUTORY);
                          setShowAddForm(true);
                          setShowTypeMenu(false);
                        }}
                        className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors duration-150"
                        role="menuitem"
                      >
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                          <div>
                            <div className="font-medium">
                              Statutory Deduction
                            </div>
                            <div className="text-xs text-gray-500">
                              Mandatory for all employees
                            </div>
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setDeductionType(DeductionType.VOLUNTARY);
                          setShowAddForm(true);
                          setShowTypeMenu(false);
                        }}
                        className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors duration-150"
                        role="menuitem"
                      >
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                          <div>
                            <div className="font-medium">
                              Voluntary Deduction
                            </div>
                            <div className="text-xs text-gray-500">
                              Optional for employees
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaChartBar className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Deductions
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalDeductions}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <FaCog className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Active Deductions
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {activeDeductions}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FaFilter className="w-4 h-4 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Statutory</p>
                <p className="text-2xl font-bold text-gray-900">
                  {deductions.statutory.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search deductions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg 
                           focus:ring-2 focus:ring-green-500 focus:border-green-500 
                           placeholder-gray-400 text-sm transition-colors duration-200"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Found {totalDeductions} deductions</span>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <DeductionsTable
            deductions={deductions}
            isLoading={isInitialLoading}
            isUpdating={isLoading}
            onEdit={handleEdit}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
            searchTerm={searchTerm}
            onAddDeduction={() => {
              setDeductionType(DeductionType.VOLUNTARY);
              setShowAddForm(true);
            }}
          />
        </div>
      </div>

      {/* Inline Form Section - always inline, never overlay */}
      {showAddForm && (
        <div className="flex justify-center w-full mt-8">
          <div
            className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mx-auto relative"
            style={{ maxHeight: "80vh", overflowY: "auto" }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingDeduction ? "Edit Deduction" : "Add New Deduction"}
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingDeduction(undefined);
                }}
                className="text-gray-400 hover:text-gray-600 focus:outline-none p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "65vh" }}>
              <DeductionForm
                deduction={editingDeduction}
                deductionType={
                  deductionType === DeductionType.STATUTORY
                    ? "statutory"
                    : "voluntary"
                }
                onSubmit={async (data) => {
                  if (editingDeduction) {
                    await handleUpdate(
                      editingDeduction._id,
                      data as UpdateDeductionInput
                    );
                  } else {
                    await handleCreateDeduction(data as CreateDeductionInput);
                  }
                }}
                onCancel={() => {
                  setShowAddForm(false);
                  setEditingDeduction(undefined);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
