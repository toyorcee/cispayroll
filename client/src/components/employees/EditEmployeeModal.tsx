import { Dialog } from "@headlessui/react";
import { Employee } from "../../types/employee";
import { useState, useEffect } from "react";
import { FaTimes, FaSpinner, FaEdit } from "react-icons/fa";
import { departmentService } from "../../services/departmentService";
import { toast } from "react-hot-toast";
import { Department } from "../../types/department";

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSave: (data: Partial<Employee>) => Promise<void>;
}

export const EditEmployeeModal = ({
  isOpen,
  onClose,
  employee,
  onSave,
}: EditEmployeeModalProps) => {
  const { data: departments } = departmentService.useGetDepartments();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    position: "",
    phone: "",
    gradeLevel: "",
    workLocation: "",
    department: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log("Employee data:", employee);
    console.log("Available departments:", departments);

    if (employee) {
      // Handle department value
      const departmentValue =
        typeof employee.department === "object" && employee.department !== null
          ? (employee.department as Department)._id
          : employee.department;

      setFormData({
        firstName: employee.firstName || "",
        lastName: employee.lastName || "",
        email: employee.email || "",
        position: employee.position || "",
        phone: employee.phone || "",
        gradeLevel: employee.gradeLevel || "",
        workLocation: employee.workLocation || "",
        department: departmentValue || "", // This will always be a string (ID)
      });
    }
  }, [employee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Only include changed fields in the update
      const changedFields: Partial<Employee> = {};

      if (formData.firstName !== employee?.firstName)
        changedFields.firstName = formData.firstName;
      if (formData.lastName !== employee?.lastName)
        changedFields.lastName = formData.lastName;
      if (formData.email !== employee?.email)
        changedFields.email = formData.email;
      if (formData.position !== employee?.position)
        changedFields.position = formData.position;
      if (formData.phone !== employee?.phone)
        changedFields.phone = formData.phone;
      if (formData.gradeLevel !== employee?.gradeLevel)
        changedFields.gradeLevel = formData.gradeLevel;
      if (formData.workLocation !== employee?.workLocation)
        changedFields.workLocation = formData.workLocation;

      // Fix the department comparison by comparing IDs
      const employeeDepartmentId =
        typeof employee?.department === "object" &&
        employee?.department !== null
          ? (employee.department as Department)._id
          : employee?.department;

      if (formData.department !== employeeDepartmentId) {
        const selectedDepartment = departments?.find(
          (dept) => dept._id === formData.department
        );
        if (selectedDepartment) {
          changedFields.department = selectedDepartment;
        }
      }

      console.log("Sending update data:", changedFields);
      await onSave(changedFields);
      onClose();
    } catch (error) {
      console.error("Failed to update employee:", error);
      toast.error("Failed to update employee");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-2xl shadow-2xl bg-gradient-to-br from-white via-blue-50 to-emerald-50 p-0">
          {/* Gradient Header */}
          <div className="bg-gradient-to-r from-blue-500 via-emerald-500 to-green-500 rounded-t-2xl px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaEdit className="text-white text-xl" />
              <h2 className="text-lg font-bold text-white">Edit Employee</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-emerald-200 focus:outline-none text-xl bg-white/20 rounded-full p-2 hover:bg-white/30 transition-all duration-200"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg border border-gray-200 bg-gradient-to-r from-white to-blue-50 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg border border-gray-200 bg-gradient-to-r from-white to-blue-50 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  className="w-full rounded-lg border border-gray-200 bg-gradient-to-r from-white to-blue-50 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  required
                  className="w-full rounded-lg border border-gray-200 bg-gradient-to-r from-white to-blue-50 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Position
                </label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg border border-gray-200 bg-gradient-to-r from-white to-blue-50 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
                  value={formData.position}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      position: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Grade Level
                </label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg border border-gray-200 bg-gradient-to-r from-white to-blue-50 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
                  value={formData.gradeLevel}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      gradeLevel: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Work Location
                </label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg border border-gray-200 bg-gradient-to-r from-white to-blue-50 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
                  value={formData.workLocation}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      workLocation: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Department
                </label>
                <select
                  required
                  className="w-full rounded-lg border border-gray-200 bg-gradient-to-r from-white to-blue-50 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      department: e.target.value,
                    }))
                  }
                >
                  <option value="">Select Department</option>
                  {departments?.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400 transition"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-emerald-600 hover:from-blue-600 hover:to-emerald-700 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
