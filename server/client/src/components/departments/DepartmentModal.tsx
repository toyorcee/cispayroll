import { useState, useEffect } from "react";
import { BaseModal } from "../shared/BaseModal";
import { motion } from "framer-motion";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { toast } from "react-toastify";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";

interface Department {
  id: string;
  name: string;
  description?: string;
}

interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (department: Partial<Department>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  departments: Department[];
}

export const DepartmentModal = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  departments,
}: DepartmentModalProps) => {
  const [loading, setLoading] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null
  );
  const [formData, setFormData] = useState<Partial<Department>>({
    name: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      setFormData({ name: "", description: "" });
      setEditingDepartment(null);
      toast.success(
        editingDepartment ? "Department updated!" : "Department created!"
      );
    } catch (error) {
      toast.error("Failed to save department");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormData(department);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this department?")) {
      try {
        await onDelete(id);
        toast.success("Department deleted!");
      } catch (error) {
        toast.error("Failed to delete department");
      }
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Departments"
      maxWidth="max-w-4xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Department Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-lg shadow-sm"
        >
          <h3 className="text-lg font-medium mb-4">
            {editingDepartment ? "Edit Department" : "Add Department"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Department Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              {editingDepartment && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingDepartment(null);
                    setFormData({ name: "", description: "" });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 
                         transition-colors flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <FaPlus className="w-4 h-4" />
                    <span>{editingDepartment ? "Update" : "Add"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Departments List */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gray-50 p-6 rounded-lg"
        >
          <h3 className="text-lg font-medium mb-4">Existing Departments</h3>
          <div className="space-y-3">
            {departments.map((department) => (
              <motion.div
                key={department.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white p-4 rounded-lg shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{department.name}</h4>
                    {department.description && (
                      <p className="text-sm text-gray-600">
                        {department.description}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(department)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(department.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </BaseModal>
  );
};
