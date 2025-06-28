import { Dialog } from "@headlessui/react";
import {
  FaTimes,
  FaSpinner,
  FaEdit,
  FaTrash,
  FaBuilding,
} from "react-icons/fa";
import { useState, useMemo } from "react";
import { Department, DepartmentFormData } from "../../types/department";
// import { User } from "../../types/user";
import { employeeService } from "../../services/employeeService";
import { Combobox } from "@headlessui/react";
import { AdminResponse } from "../../services/employeeService";
import { departmentService } from "../../services/departmentService";
import { DeleteDepartmentModal } from "./DeleteDepartmentModal";

interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  admins: AdminResponse[];
  isLoading: boolean;
  onSuccess?: () => Promise<void>;
}

interface HODResponse {
  _id: string;
  firstName: string;
  lastName: string;
  department: {
    _id: string;
    name: string;
  };
  position?: string;
}

export const DepartmentModal = ({
  isOpen,
  onClose,
  departments,
  onSuccess,
}: DepartmentModalProps) => {
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: "",
    code: "",
    description: "",
    headOfDepartment: "",
    location: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] =
    useState<Department | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const submissionData = {
        ...formData,
        headOfDepartment: formData.headOfDepartment || query || "",
      };

      console.log("🔵 Submitting department with:", {
        editingId,
        submissionData,
      });

      if (editingId) {
        await departmentService.updateDepartment(editingId, submissionData);
      } else {
        await departmentService.createDepartment(submissionData);
      }

      if (onSuccess) {
        await onSuccess();
      }
      resetForm();
    } catch (error) {
      console.error("Failed to save department:", error);
      // Toast notifications are now handled in the service
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (dept: Department) => {
    console.log("📝 Editing department:", {
      department: dept,
      hodInfo: dept.headOfDepartment,
    });

    setEditingId(dept._id);

    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description || "",
      location: dept.location || "",
      headOfDepartment: dept.headOfDepartment?._id || "",
    });

    if (dept.headOfDepartment) {
      setQuery(
        `${dept.headOfDepartment.firstName} ${dept.headOfDepartment.lastName}`
      );
    }

    console.log("📝 Form data set to:", {
      formData: {
        name: dept.name,
        code: dept.code,
        description: dept.description || "",
        location: dept.location || "",
        headOfDepartment: dept.headOfDepartment?._id || "",
      },
      query: dept.headOfDepartment
        ? `${dept.headOfDepartment.firstName} ${dept.headOfDepartment.lastName}`
        : "",
    });
  };

  const handleDelete = async (dept: Department) => {
    setDepartmentToDelete(dept);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!departmentToDelete) return;

    try {
      await departmentService.deleteDepartment(departmentToDelete._id);
      if (onSuccess) {
        await onSuccess();
      }
    } catch (error) {
      console.error("Failed to delete department:", error);
      // Toast notifications are now handled in the service
    } finally {
      setShowDeleteModal(false);
      setDepartmentToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      headOfDepartment: "",
      location: "",
    });
    setEditingId(null);
  };

  const findHODForDepartment = (departmentId: string) => {
    if (!hodsData) return null;

    const hod = hodsData.find(
      (admin: HODResponse) => admin.department?._id === departmentId
    );

    return hod;
  };

  const handleInputChange = (
    e:
      | React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
      | { target: { name: string; value: string } }
  ) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: value,
    }));
  };

  const { data: hodsData } = employeeService.useGetHODs();

  const filteredHODs = useMemo(() => {
    if (!hodsData) return [];
    return query === ""
      ? hodsData
      : hodsData.filter((hod) => {
          const fullName = `${hod.firstName} ${hod.lastName}`.toLowerCase();
          return fullName.includes(query.toLowerCase());
        });
  }, [hodsData, query]);

  return (
    <>
      <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          aria-hidden="true"
        />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-6xl w-full rounded-2xl shadow-2xl bg-gradient-to-br from-white via-blue-50 to-emerald-50 p-0 max-h-[90vh] flex flex-col">
            {/* Beautiful Gradient Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-green-500 via-emerald-500 to-blue-500 rounded-t-2xl px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaBuilding className="text-white text-xl" />
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Manage Departments
                  </h2>
                  <p className="text-xs text-emerald-100">
                    {departments.length} departments
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-emerald-200 focus:outline-none text-xl bg-white/20 rounded-full p-2 hover:bg-white/30 transition-all duration-200"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                {/* Form Section with Gradient Background */}
                <div className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-xl shadow-sm border border-gray-100 overflow-y-auto max-h-[calc(90vh-120px)]">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FaBuilding className="text-green-500" />
                    {editingId ? "Edit Department" : "Create Department"}
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-200 bg-gradient-to-r from-white to-blue-50 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.code}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            code: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full rounded-lg border border-gray-200 bg-gradient-to-r from-white to-blue-50 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Head of Department
                      </label>
                      <div className="relative">
                        <Combobox
                          value={formData.headOfDepartment || ""}
                          onChange={(hodId: string | null) => {
                            const syntheticEvent = {
                              target: {
                                name: "headOfDepartment",
                                value: hodId || "",
                              },
                            };
                            handleInputChange(syntheticEvent);
                          }}
                          nullable
                        >
                          <div className="relative">
                            <Combobox.Input
                              className="w-full rounded-lg border border-gray-200 bg-gradient-to-r from-white to-blue-50 shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
                              onChange={(event) => {
                                const newValue = event.target.value;
                                setQuery(newValue);

                                if (!newValue.trim()) {
                                  handleInputChange({
                                    target: {
                                      name: "headOfDepartment",
                                      value: "",
                                    },
                                  });
                                }
                              }}
                              onBlur={() => {
                                if (
                                  !query.trim() &&
                                  formData.headOfDepartment &&
                                  hodsData
                                ) {
                                  const currentHod = hodsData.find(
                                    (h) => h._id === formData.headOfDepartment
                                  );
                                  if (currentHod) {
                                    setQuery(
                                      `${currentHod.firstName} ${currentHod.lastName}`
                                    );
                                  }
                                }
                              }}
                              displayValue={(hodId: string) => {
                                if (query) return query;

                                if (hodId && hodsData) {
                                  const hod = hodsData.find(
                                    (h) => h._id === hodId
                                  );
                                  if (hod)
                                    return `${hod.firstName} ${hod.lastName}`;
                                }

                                return "";
                              }}
                              placeholder="Search or enter HOD name..."
                            />
                            {query && (
                              <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                {filteredHODs.length > 0 ? (
                                  filteredHODs.map((hod) => (
                                    <Combobox.Option
                                      key={hod._id}
                                      value={hod._id}
                                      className={({ active }) =>
                                        `relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                                          active
                                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                                            : "text-gray-900"
                                        }`
                                      }
                                    >
                                      {({ selected }) => (
                                        <>
                                          <span
                                            className={`block truncate ${
                                              selected
                                                ? "font-medium"
                                                : "font-normal"
                                            }`}
                                          >
                                            {`${hod.firstName} ${hod.lastName}`}
                                            {hod.department && (
                                              <span className="ml-2 text-sm text-gray-400">
                                                ({hod.department.name})
                                              </span>
                                            )}
                                          </span>
                                        </>
                                      )}
                                    </Combobox.Option>
                                  ))
                                ) : (
                                  <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                    No HODs found. Continue typing to use custom
                                    input.
                                  </div>
                                )}
                              </Combobox.Options>
                            )}
                          </div>
                        </Combobox>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={formData.description || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-200 bg-gradient-to-r from-white to-blue-50 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      {editingId && (
                        <button
                          type="button"
                          onClick={resetForm}
                          className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400 transition"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400 transition disabled:opacity-50"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <FaSpinner className="animate-spin h-5 w-5" />
                        ) : editingId ? (
                          "Update"
                        ) : (
                          "Create"
                        )}
                      </button>
                      {editingId && (
                        <button
                          type="button"
                          onClick={resetForm}
                          className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition"
                        >
                          Create New
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Departments Table Section with Gradient Background */}
                <div className="bg-gradient-to-br from-white to-emerald-50 p-4 rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                  <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FaBuilding className="text-green-500" />
                    Current Departments
                  </h3>
                  <div className="overflow-y-auto flex-1 max-h-[calc(90vh-120px)]">
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg overflow-hidden">
                      <table className="w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-green-500 to-emerald-500">
                          <tr>
                            <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase w-[35%]">
                              Name
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase w-[15%]">
                              Code
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase w-[35%]">
                              HOD
                            </th>
                            <th className="px-3 py-3 text-right text-xs font-bold text-white uppercase w-[15%]">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {departments.map((dept, index) => (
                            <tr
                              key={dept._id}
                              className={`hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200 ${
                                index % 2 === 0 ? "bg-white" : "bg-gray-50"
                              }`}
                            >
                              <td className="px-3 py-3 text-sm font-medium text-gray-900">
                                {dept.name}
                              </td>
                              <td className="px-3 py-3 text-sm text-gray-600 font-mono">
                                {dept.code}
                              </td>
                              <td className="px-3 py-3 text-sm text-gray-600">
                                {(() => {
                                  const hod = findHODForDepartment(dept._id);
                                  if (hod) {
                                    return `${hod.firstName} ${hod.lastName}`;
                                  }
                                  return "Not Assigned";
                                })()}
                              </td>
                              <td className="px-3 py-3 text-sm text-right">
                                <div className="flex items-center justify-end gap-3">
                                  <button
                                    onClick={() => handleEdit(dept)}
                                    className="inline-flex items-center text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                                    title="Edit"
                                  >
                                    <FaEdit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(dept)}
                                    className="inline-flex items-center text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                                    title="Delete"
                                  >
                                    <FaTrash className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      <DeleteDepartmentModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDepartmentToDelete(null);
        }}
        departmentName={departmentToDelete?.name || ""}
        onConfirm={confirmDelete}
      />
    </>
  );
};
