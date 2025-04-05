import { useState, useEffect, useRef } from "react";
import { FaPlus } from "react-icons/fa";
import { deductionService } from "../../../services/deductionService";
import {
  Deduction,
  CreateDeductionInput,
  UpdateDeductionInput,
  DeductionType,
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
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [deductionType, setDeductionType] = useState<DeductionType>(
    DeductionType.VOLUNTARY
  );

  const fetchDeductions = async () => {
    try {
      setIsInitialLoading(true);
      const deductionsData = await deductionService.getAllDeductions();
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

  const handleUpdate = async (
    id: string,
    data: Omit<UpdateDeductionInput, "type">
  ) => {
    try {
      setIsLoading(true);
      await deductionService.updateDeduction(id, {
        ...data,
        type: deductionType,
      } as UpdateDeductionInput);
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
      if (deductionType === DeductionType.STATUTORY) {
        await deductionService.createCustomStatutoryDeduction(data);
      } else {
        await deductionService.createVoluntaryDeduction(data);
      }
      await fetchDeductions();
      setShowAddForm(false);
    } catch (error) {
      console.error("Error creating deduction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div className="relative">
          <button
            onClick={() => setShowTypeMenu(!showTypeMenu)}
            className="inline-flex items-center px-4 py-2 border border-transparent 
                     rounded-md shadow-sm text-sm font-medium text-white 
                     bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 
                     focus:ring-offset-2 focus:ring-green-500"
          >
            <FaPlus className="mr-2 -ml-1 h-4 w-4" />
            Add Deduction
            <svg
              className="w-4 h-4 ml-2"
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
            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
              <div className="py-1" role="menu">
                <button
                  onClick={() => {
                    setDeductionType(DeductionType.STATUTORY);
                    setShowAddForm(true);
                    setShowTypeMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                >
                  Add Statutory Deduction
                </button>
                <button
                  onClick={() => {
                    setDeductionType(DeductionType.VOLUNTARY);
                    setShowAddForm(true);
                    setShowTypeMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                >
                  Add Voluntary Deduction
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <DeductionsTable
          deductions={deductions}
          isLoading={isInitialLoading}
          isUpdating={isLoading}
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
        />
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
              deductionType={deductionType}
              onSubmit={async (data) => {
                if (editingDeduction) {
                  await handleUpdate(
                    editingDeduction._id,
                    data as Omit<UpdateDeductionInput, "type">
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
      )}
    </div>
  );
}
