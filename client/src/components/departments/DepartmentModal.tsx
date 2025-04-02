import { Dialog } from "@headlessui/react";
import { FaTimes, FaSpinner, FaEdit, FaTrash } from "react-icons/fa";
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
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-6xl w-full rounded-xl bg-white p-6 shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                Manage Departments
              </Dialog.Title>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                <div className="bg-white p-6 rounded-lg border border-gray-200 overflow-y-auto max-h-[calc(90vh-120px)]">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingId ? "Edit Department" : "Create Department"}
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
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
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
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
                              className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
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
                              <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                {filteredHODs.length > 0 ? (
                                  filteredHODs.map((hod) => (
                                    <Combobox.Option
                                      key={hod._id}
                                      value={hod._id}
                                      className={({ active }) =>
                                        `relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                                          active
                                            ? "bg-green-600 text-white"
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
                      <label className="block text-sm font-medium text-gray-700">
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
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end space-x-3">
                      {editingId && (
                        <button
                          type="button"
                          onClick={resetForm}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
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
                          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                        >
                          Create New
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 overflow-hidden flex flex-col">
                  <h3 className="text-base font-medium text-gray-900 mb-3">
                    Current Departments
                  </h3>
                  <div className="overflow-y-auto flex-1 max-h-[calc(90vh-120px)]">
                    <table className="w-full divide-y divide-gray-200 table-fixed">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase w-[35%]">
                            Name
                          </th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase w-[15%]">
                            Code
                          </th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase w-[35%]">
                            HOD
                          </th>
                          <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase w-[15%]">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {departments.map((dept) => (
                          <tr key={dept._id} className="hover:bg-gray-50">
                            <td className="px-2 py-2 text-sm truncate">
                              {dept.name}
                            </td>
                            <td className="px-2 py-2 text-sm truncate">
                              {dept.code}
                            </td>
                            <td className="px-2 py-2 text-sm truncate">
                              {(() => {
                                const hod = findHODForDepartment(dept._id);
                                if (hod) {
                                  return `${hod.firstName} ${hod.lastName}`;
                                }
                                return "Not Assigned";
                              })()}
                            </td>
                            <td className="px-2 py-2 text-sm text-right">
                              <button
                                onClick={() => handleEdit(dept)}
                                className="inline-flex items-center text-blue-600 hover:text-blue-900 mr-4"
                                title="Edit"
                              >
                                <FaEdit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(dept)}
                                className="inline-flex items-center text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <FaTrash className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
