import { useState } from "react";
import {
  FaEdit,
  FaToggleOn,
  FaToggleOff,
  FaInfoCircle,
  FaTrash,
  FaSearch,
  FaFilter,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { Deduction, TaxBracket } from "../../../types/deduction";
import { TableSkeleton } from "./Skeletons";
import { EmptyState } from "./EmptyState";

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
  searchTerm?: string;
  onAddDeduction?: () => void;
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
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative mx-auto w-full max-w-2xl bg-white rounded-2xl shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            Tax Brackets Configuration
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {brackets.map((bracket, index) => (
              <div
                key={index}
                className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      Bracket {index + 1}
                    </div>
                    <div className="text-sm text-gray-600">
                      ₦{bracket.min.toLocaleString()}
                      {bracket.max
                        ? ` - ₦${bracket.max.toLocaleString()}`
                        : " and above"}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                    {bracket.rate}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const DeductionsTable = ({
  deductions,
  isLoading,
  isUpdating,
  onEdit,
  onToggleStatus,
  onDelete,
  searchTerm = "",
  onAddDeduction,
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

  // Combine statutory and voluntary deductions into a single array
  const allDeductions = [
    ...(deductions.statutory || []),
    ...(deductions.voluntary || []),
  ];

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

  // Filter deductions based on search term and filters
  const filteredDeductions = allDeductions.filter((d) => {
    // Search filter
    const matchesSearch = searchTerm
      ? d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.category?.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    // Type filter
    const matchesType =
      typeFilter === "all" || d.type.toLowerCase() === typeFilter;

    // Status filter
    const matchesStatus =
      statusFilter === "both" ||
      (statusFilter === "active" && d.isActive) ||
      (statusFilter === "inactive" && !d.isActive);

    return matchesSearch && matchesType && matchesStatus;
  });

  const formatValue = (deduction: Deduction) => {
    if (deduction.calculationMethod === "PERCENTAGE") {
      return `${deduction.value}%`;
    } else if (deduction.calculationMethod === "PROGRESSIVE") {
      return "Progressive";
    } else {
      return `₦${deduction.value.toLocaleString()}`;
    }
  };

  const getTypeBadge = (type: string) => {
    if (type.toLowerCase() === "statutory") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></div>
          Statutory
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></div>
          Voluntary
        </span>
      );
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-1.5"></div>
        Inactive
      </span>
    );
  };

  return (
    <div className="bg-white">
      {/* Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FaFilter className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                Filters:
              </span>
            </div>
            <select
              className="form-select rounded-lg border-gray-300 text-sm focus:ring-green-500 focus:border-green-500 bg-gray-50 text-gray-900 hover:bg-gray-100 transition-colors duration-200"
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(
                  e.target.value as "all" | "statutory" | "voluntary"
                )
              }
            >
              <option value="all">All Types</option>
              <option value="statutory">Statutory</option>
              <option value="voluntary">Voluntary</option>
            </select>

            <select
              className="form-select rounded-lg border-gray-300 text-sm focus:ring-green-500 focus:border-green-500 bg-gray-50 text-gray-900 hover:bg-gray-100 transition-colors duration-200"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as "both" | "active" | "inactive"
                )
              }
            >
              <option value="both">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
          <div className="text-sm text-gray-500">
            Showing {filteredDeductions.length} of {allDeductions.length}{" "}
            deductions
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {filteredDeductions.length === 0 ? (
          <EmptyState searchTerm={searchTerm} onAddDeduction={onAddDeduction} />
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deduction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDeductions.map((deduction) => (
                <tr
                  key={deduction._id}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {deduction.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {deduction.name}
                        </div>
                        {deduction.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {deduction.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getTypeBadge(deduction.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatValue(deduction)}
                    </div>
                    {deduction.calculationMethod === "PROGRESSIVE" && (
                      <button
                        onClick={() =>
                          setSelectedBrackets(deduction.taxBrackets || [])
                        }
                        className="text-xs text-green-600 hover:text-green-800 font-medium"
                      >
                        View brackets
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(deduction.isActive)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                      {deduction.category || "general"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onEdit(deduction)}
                        className="text-green-600 hover:text-green-900 p-1 rounded-md hover:bg-green-50 transition-colors duration-150"
                        title="Edit deduction"
                      >
                        <FaEdit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggle(deduction._id)}
                        disabled={togglingId === deduction._id || isUpdating}
                        className={`p-1 rounded-md transition-colors duration-150 ${
                          deduction.isActive
                            ? "text-red-600 hover:text-red-900 hover:bg-red-50"
                            : "text-green-600 hover:text-green-900 hover:bg-green-50"
                        }`}
                        title={deduction.isActive ? "Deactivate" : "Activate"}
                      >
                        {togglingId === deduction._id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        ) : deduction.isActive ? (
                          <FaToggleOn className="h-4 w-4" />
                        ) : (
                          <FaToggleOff className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(deduction._id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors duration-150"
                        title="Delete deduction"
                      >
                        <FaTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Tax Brackets Modal */}
      <TaxBracketsModal
        isOpen={!!selectedBrackets}
        onClose={() => setSelectedBrackets(null)}
        brackets={selectedBrackets || []}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto w-full max-w-md bg-white rounded-2xl shadow-2xl">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <FaTrash className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Delete Deduction
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to delete this deduction? This action
                  cannot be undone.
                </p>
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => setDeleteConfirm({ show: false, id: null })}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
