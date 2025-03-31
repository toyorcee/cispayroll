import { useState } from "react";
import {
  FaEdit,
  FaToggleOn,
  FaToggleOff,
  FaInfoCircle,
  FaTrash,
} from "react-icons/fa";
import { Deduction, TaxBracket } from "../../../types/deduction";
import { TableSkeleton } from "./Skeletons";

interface DeductionsTableProps {
  deductions: {
    statutory: Deduction[];
    voluntary: Deduction[];
  };
  isLoading: boolean;
  isUpdating: boolean;
  onEdit: (deduction: Deduction) => void;
  onToggleStatus: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const TaxBracketsModal = ({
  isOpen,
  onClose,
  brackets,
}: {
  isOpen: boolean;
  onClose: () => void;
  brackets: TaxBracket[];
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-95 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div
        className="relative mx-auto p-5 border w-full max-w-md shadow-xl rounded-lg bg-white"
        style={{ maxHeight: "80vh" }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            PAYE Tax Brackets
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none p-2 cursor-pointer"
          >
            <span className="text-2xl shadow-lg rounded-lg">×</span>
          </button>
        </div>
        <div
          className="space-y-2 overflow-y-auto"
          style={{ maxHeight: "60vh" }}
        >
          {brackets.map((bracket, index) => (
            <div
              key={index}
              className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-150"
            >
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  From ₦{bracket.min.toLocaleString()}
                  {bracket.max
                    ? ` to ₦${bracket.max.toLocaleString()}`
                    : " and above"}
                </div>
                <div className="text-base font-semibold text-green-600">
                  {bracket.rate}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Removed unused formatValue function

export const DeductionsTable = ({
  deductions,
  isLoading,
  isUpdating,
  onEdit,
  onToggleStatus,
  onDelete,
}: DeductionsTableProps) => {
  const [typeFilter, setTypeFilter] = useState<
    "all" | "statutory" | "voluntary"
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "both" | "active" | "inactive"
  >("both");
  const [selectedBrackets, setSelectedBrackets] = useState<TaxBracket[] | null>(
    null
  );
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    id: string | null;
  }>({
    show: false,
    id: null,
  });

  console.log("Received deductions:", deductions);

  const handleDelete = async (id: string) => {
    setDeleteConfirm({ show: true, id });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.id) {
      await onDelete(deleteConfirm.id);
      setDeleteConfirm({ show: false, id: null });
    }
  };

  const handleToggle = async (id: string) => {
    try {
      setTogglingId(id);
      await onToggleStatus(id);
    } finally {
      setTogglingId(null);
    }
  };

  if (isLoading) return <TableSkeleton />;

  const allDeductions = [...deductions.statutory, ...deductions.voluntary];
  const filteredDeductions = allDeductions.filter((d) => {
    // Type filter
    if (typeFilter !== "all" && d.type.toLowerCase() !== typeFilter) {
      return false;
    }
    // Status filter
    if (statusFilter !== "both") {
      return statusFilter === "active" ? d.isActive : !d.isActive;
    }
    return true;
  });

  console.log("Filtered deductions:", filteredDeductions);

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <select
            className="form-select rounded-md border-gray-300 text-sm focus:ring-green-500 focus:border-green-500 bg-green-50 text-green-900 hover:bg-green-100 transition-colors duration-200"
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as "all" | "statutory" | "voluntary")
            }
          >
            <option value="all">All Deductions</option>
            <option value="statutory">Statutory</option>
            <option value="voluntary">Voluntary</option>
          </select>

          <select
            className="form-select rounded-md border-gray-300 text-sm focus:ring-green-500 focus:border-green-500 bg-green-50 text-green-900 hover:bg-green-100 transition-colors duration-200"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "both" | "active" | "inactive")
            }
          >
            <option value="both">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Calculation Method
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Value
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredDeductions.map((deduction) => (
              <tr
                key={deduction._id}
                className="hover:bg-gray-50 transition-all duration-200"
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {deduction.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {deduction.description}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {deduction.type.toLowerCase()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {deduction.calculationMethod.toLowerCase()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center justify-start">
                    {deduction.calculationMethod.toLowerCase() ===
                    "progressive" ? (
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          Progressive Tax
                        </span>
                        <button
                          onClick={() =>
                            deduction.taxBrackets &&
                            setSelectedBrackets(deduction.taxBrackets)
                          }
                          className="text-green-600 hover:text-green-700 focus:outline-none"
                        >
                          <FaInfoCircle className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-900">
                        {deduction.calculationMethod.toLowerCase() ===
                        "percentage"
                          ? `${deduction.value}%`
                          : deduction.value.toLocaleString()}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        deduction.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {deduction.isActive ? "Active" : "Inactive"}
                    </span>
                    <button
                      onClick={() => handleToggle(deduction._id)}
                      disabled={isUpdating || togglingId === deduction._id}
                      className={`${
                        deduction.isActive ? "text-green-600" : "text-gray-400"
                      } hover:text-green-900 transition-opacity ${
                        isUpdating || togglingId === deduction._id
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      title={deduction.isActive ? "Deactivate" : "Activate"}
                    >
                      {isUpdating || togglingId === deduction._id ? (
                        <div className="animate-pulse">
                          {deduction.isActive ? (
                            <FaToggleOn className="w-5 h-5" />
                          ) : (
                            <FaToggleOff className="w-5 h-5" />
                          )}
                        </div>
                      ) : (
                        <>
                          {deduction.isActive ? (
                            <FaToggleOn className="w-5 h-5" />
                          ) : (
                            <FaToggleOff className="w-5 h-5" />
                          )}
                        </>
                      )}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onEdit(deduction)}
                    className="text-green-600 hover:text-green-900 mr-4"
                  >
                    <FaEdit className="inline-block w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(deduction._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <FaTrash className="inline-block w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-white bg-opacity-95 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-full max-w-sm shadow-lg rounded-lg bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <FaTrash className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                Delete Deduction
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this deduction? This action
                  cannot be undone.
                </p>
              </div>
              <div className="flex justify-center gap-4 mt-5">
                <button
                  onClick={() => setDeleteConfirm({ show: false, id: null })}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Existing Tax Brackets Modal */}
      <TaxBracketsModal
        isOpen={!!selectedBrackets}
        onClose={() => setSelectedBrackets(null)}
        brackets={selectedBrackets || []}
      />
    </div>
  );
};
