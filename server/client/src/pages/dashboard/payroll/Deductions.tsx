import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaPlus } from "react-icons/fa";
import { deductionService } from "../../../services/deductionService";
import type {
  Deduction,
  CreateVoluntaryDeductionInput,
  CalculationMethod,
} from "../../../types/deduction";
import { StatutoryDeductions } from "../../../components/payroll/deductions/StatutoryDeductions";
import { VoluntaryDeductions } from "../../../components/payroll/deductions/VoluntaryDeductions";
import { DeductionsTable } from "../../../components/payroll/deductions/DeductionsTable";
import { DeductionForm } from "../../../components/payroll/deductions/DeductionForm";

export default function Deductions() {
  const [activeTab, setActiveTab] = useState<
    "table" | "statutory" | "voluntary"
  >("table");
  const [isLoading, setIsLoading] = useState(true);
  const [deductions, setDeductions] = useState<{
    statutory: Deduction[];
    voluntary: Deduction[];
  }>({ statutory: [], voluntary: [] });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchDeductions();
  }, []);

  const fetchDeductions = async () => {
    try {
      setIsLoading(true);
      const data = await deductionService.getAllDeductions();
      setDeductions(data);
    } catch (error) {
      toast.error("Failed to fetch deductions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (formData: Partial<Deduction>) => {
    try {
      // Convert formData to CreateVoluntaryDeductionInput
      const deductionInput: CreateVoluntaryDeductionInput = {
        name: formData.name || "",
        description: formData.description,
        calculationMethod: formData.calculationMethod as CalculationMethod,
        value: formData.value || 0,
        effectiveDate: formData.effectiveDate,
      };

      await deductionService.createVoluntaryDeduction(deductionInput);
      await fetchDeductions();
      setShowAddForm(false);
      toast.success("Deduction created successfully");
    } catch (error) {
      toast.error("Failed to create deduction");
    }
  };

  const handleUpdate = async (id: string, data: Partial<Deduction>) => {
    try {
      await deductionService.updateDeduction(id, data);
      await fetchDeductions();
    } catch (error) {
      toast.error("Failed to update deduction");
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await deductionService.toggleDeductionStatus(id);
      await fetchDeductions();
    } catch (error) {
      toast.error("Failed to toggle deduction status");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deductionService.deleteDeduction(id);
      await fetchDeductions();
    } catch (error) {
      toast.error("Failed to delete deduction");
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">
          Deductions Management
        </h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent 
                   rounded-md shadow-sm text-sm font-medium text-white 
                   bg-green-600 hover:bg-green-700 
                   transition-all duration-300 transform hover:-translate-y-1 
                   hover:shadow-lg animate-bounce-slow cursor-pointer 
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <FaPlus className="mr-2 -ml-1 h-4 w-4" />
          Add Deduction
        </button>
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <DeductionForm
              onSubmit={handleAdd}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "table", name: "All Deductions" },
            { id: "statutory", name: "Statutory Deductions" },
            { id: "voluntary", name: "Voluntary Deductions" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`${
                activeTab === tab.id
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              transition-all duration-200`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Section */}
      <div className="mt-6">
        {activeTab === "table" && (
          <DeductionsTable
            deductions={deductions}
            isLoading={isLoading}
            onEdit={(deduction) => {
              setShowAddForm(true);
            }}
            onView={() => {}}
            onToggleStatus={handleToggle}
          />
        )}

        {activeTab === "statutory" && (
          <StatutoryDeductions
            deductions={deductions.statutory}
            isLoading={isLoading}
            onUpdate={handleUpdate}
          />
        )}

        {activeTab === "voluntary" && (
          <VoluntaryDeductions
            deductions={deductions.voluntary}
            isLoading={isLoading}
            onAdd={handleAdd}
            onUpdate={handleUpdate}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mt-8">
        <div
          className="bg-white overflow-hidden shadow rounded-lg 
                    transform transition-all duration-300 hover:scale-105"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 text-lg font-semibold">
                    S
                  </span>
                </div>
              </div>
              <div className="ml-5">
                <h3 className="text-lg font-medium text-gray-900">
                  Statutory Deductions
                </h3>
                <p className="text-sm text-gray-500">
                  {deductions.statutory.length} active
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          className="bg-white overflow-hidden shadow rounded-lg 
                    transform transition-all duration-300 hover:scale-105"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 text-lg font-semibold">
                    V
                  </span>
                </div>
              </div>
              <div className="ml-5">
                <h3 className="text-lg font-medium text-gray-900">
                  Voluntary Deductions
                </h3>
                <p className="text-sm text-gray-500">
                  {deductions.voluntary.length} active
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          className="bg-white overflow-hidden shadow rounded-lg 
                    transform transition-all duration-300 hover:scale-105"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 text-lg font-semibold">
                    T
                  </span>
                </div>
              </div>
              <div className="ml-5">
                <h3 className="text-lg font-medium text-gray-900">
                  Total Deductions
                </h3>
                <p className="text-sm text-gray-500">
                  {deductions.statutory.length + deductions.voluntary.length}{" "}
                  total
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
