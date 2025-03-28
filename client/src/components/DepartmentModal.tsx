import React, { useState } from "react";
import {
  FiEdit2,
  FiPlus,
  FiX,
  FiUser,
  FiMapPin,
  FiCode,
  FiFileText,
  FiHome,
} from "react-icons/fi";
import { Department, DepartmentFormData } from "../types/department";
import { UserRole, Permission } from "../types/auth";


interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (department: DepartmentFormData) => Promise<void>;
  departments?: Department[];
  isLoading: boolean;
  admins: Array<{
    _id: string;
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    status:
      | "active"
      | "inactive"
      | "pending"
      | "suspended"
      | "terminated"
      | "offboarding";
    permissions: Permission[];
  }>;
}

const DepartmentModal: React.FC<DepartmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading: isSubmitting,
  admins = [],
}) => {
  const [department, setDepartment] = useState<DepartmentFormData>({
    name: "",
    code: "",
    description: "",
    location: "",
    headOfDepartment: "",
    status: "active",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setDepartment((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!department.name || !department.code || !department.headOfDepartment) {
      setErrors({
        ...errors,
        name: !department.name ? "Name is required" : "",
        code: !department.code ? "Code is required" : "",
        headOfDepartment: !department.headOfDepartment
          ? "Head of Department is required"
          : "",
      });
      return;
    }
    await onSave(department);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-4 px-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl flex flex-col min-h-[200px] mb-4  border border-red-600">
        <div className="sticky top-0 flex items-center justify-between p-4 border-b bg-white rounded-t-lg">
          <h2 className="text-xl font-semibold md:text-2xl">
            {department.id ? "Update Department" : "Create New Department"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="flex-1 p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="flex items-center gap-2 font-medium"
              >
                <FiHome size={18} />
                Department Name
              </label>
              <input
                id="name"
                name="name"
                value={department.name}
                onChange={handleInputChange}
                placeholder="Enter department name"
                className={`w-full p-2 border rounded-lg ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="code"
                className="flex items-center gap-2 font-medium"
              >
                <FiCode size={18} />
                Department Code
              </label>
              <input
                id="code"
                name="code"
                value={department.code}
                onChange={handleInputChange}
                placeholder="Enter department code (e.g., HR, IT)"
                maxLength={5}
                className={`w-full p-2 border rounded-lg uppercase ${
                  errors.code ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.code && (
                <p className="text-sm text-red-500">{errors.code}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="description"
                className="flex items-center gap-2 font-medium"
              >
                <FiFileText size={18} />
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={department.description}
                onChange={handleInputChange}
                placeholder="Enter department description"
                rows={3}
                className={`w-full p-2 border rounded-lg ${
                  errors.description ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="location"
                className="flex items-center gap-2 font-medium"
              >
                <FiMapPin size={18} />
                Location
              </label>
              <input
                id="location"
                name="location"
                value={department.location}
                onChange={handleInputChange}
                placeholder="Enter department location"
                className={`w-full p-2 border rounded-lg ${
                  errors.location ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.location && (
                <p className="text-sm text-red-500">{errors.location}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="headOfDepartment"
                className="flex items-center gap-2 font-medium"
              >
                <FiUser size={18} />
                Head of Department
              </label>
              <select
                id="headOfDepartment"
                name="headOfDepartment"
                value={department.headOfDepartment}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-lg ${
                  errors.headOfDepartment ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select Head of Department</option>
                {admins.map((admin) => (
                  <option key={admin._id} value={admin._id}>
                    {`${admin.firstName} ${admin.lastName} (${admin.email})`}
                  </option>
                ))}
              </select>
              {errors.headOfDepartment && (
                <p className="text-sm text-red-500">
                  {errors.headOfDepartment}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex flex-col-reverse md:flex-row gap-2 p-4 border-t bg-white md:justify-end rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full md:w-auto px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleClick}
            disabled={isSubmitting}
            className={`w-full md:w-auto px-4 py-2 text-white rounded-lg flex items-center justify-center gap-2 transition-colors ${
              department.id
                ? "bg-orange-500 hover:bg-orange-600"
                : "bg-blue-500 hover:bg-blue-600"
            } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : department.id ? (
              <FiEdit2 size={18} />
            ) : (
              <FiPlus size={18} />
            )}
            {department.id ? "Update Department" : "Create Department"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepartmentModal;
