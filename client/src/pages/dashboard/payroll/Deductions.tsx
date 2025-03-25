import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaPlus } from "react-icons/fa";
import { deductionService } from "../../../services/deductionService";
import {
  Deduction,
  DeductionType,
  CalculationMethod,
  CreateVoluntaryDeductionInput,
} from "../../../types/deduction";
import { DeductionsTable } from "../../../components/payroll/deductions/DeductionsTable";
import { DeductionForm } from "../../../components/payroll/deductions/DeductionForm";

interface DeductionsState {
  statutory: Deduction[];
  voluntary: Deduction[];
}

export default function Deductions() {
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

  const fetchDeductions = async () => {
    try {
      setIsInitialLoading(true);
      console.log("🔄 Fetching deductions...");
      const deductionsData = await deductionService.getAllDeductions();
      console.log("📦 Received deductions:", deductionsData);

      if (!deductionsData.statutory || !deductionsData.voluntary) {
        console.warn("⚠️ Unexpected data structure:", deductionsData);
        toast.error("Received unexpected data format from server");
        return;
      }

      setDeductions(deductionsData);
      console.log("✅ Updated deductions state:", deductionsData);
    } catch (error) {
      console.error("❌ Error fetching deductions:", error);
      toast.error("Failed to fetch deductions");
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchDeductions();
  }, []);

  const handleAddDeduction = async (data: Partial<Deduction>) => {
    try {
      await deductionService.createDeduction({
        name: data.name!,
        description: data.description,
        calculationMethod: data.calculationMethod || CalculationMethod.FIXED,
        value: data.value!,
        effectiveDate: data.effectiveDate,
      });
      await fetchDeductions();
      setShowAddForm(false);
      toast.success("Deduction created successfully");
    } catch (error) {
      console.error("Error creating deduction:", error);
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

  const handleToggleStatus = async (id: string) => {
    try {
      setIsLoading(true);
      const { allDeductions } = await deductionService.toggleDeductionStatus(
        id
      );
      setDeductions(allDeductions);
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
      toast.success("Deduction deleted successfully");
    } catch (error) {
      console.error("Error deleting deduction:", error);
    }
  };

  const handleEdit = (deduction: Deduction) => {
    setEditingDeduction(deduction);
    setShowAddForm(true);
  };

  const handleCreateDeduction = async (data: CreateVoluntaryDeductionInput) => {
    try {
      setIsLoading(true);
      await deductionService.createDeduction(data);
      await fetchDeductions();
      setShowAddForm(false);
    } catch (error) {
      console.error("Create deduction failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <button
          onClick={() => {
            setEditingDeduction(undefined);
            setShowAddForm(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent 
                   rounded-md shadow-sm text-sm font-medium text-white 
                   bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 
                   focus:ring-offset-2 focus:ring-green-500"
        >
          <FaPlus className="mr-2 -ml-1 h-4 w-4" />
          Add Deduction
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg">
        <div className="p-6">
          <DeductionsTable
            deductions={deductions}
            isLoading={isInitialLoading}
            isUpdating={isLoading}
            onEdit={handleEdit}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-white bg-opacity-95 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingDeduction ? "Edit Deduction" : "Add Deduction"}
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingDeduction(undefined);
                }}
                className="text-gray-400 hover:text-gray-500 focus:outline-none p-2 hover:bg-gray-100 rounded-full"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
            <DeductionForm
              deduction={editingDeduction}
              onSubmit={async (data) => {
                if (editingDeduction) {
                  await handleUpdate(editingDeduction._id, data);
                } else {
                  await handleCreateDeduction(
                    data as CreateVoluntaryDeductionInput
                  );
                }
                setShowAddForm(false);
                setEditingDeduction(undefined);
              }}
              onCancel={() => {
                setShowAddForm(false);
                setEditingDeduction(undefined);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
