import { Dialog } from "@headlessui/react";
import { Employee, DepartmentBasic } from "../../types/employee";
import { useState, useEffect } from "react";
import { FaTimes, FaSpinner } from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import { employeeService } from "../../services/employeeService";
import { departmentService } from "../../services/departmentService";
import { toast } from "react-hot-toast";

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
        typeof employee.department === "object"
          ? employee.department._id
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
      if (formData.department !== employee?.department)
        changedFields.department = formData.department;

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
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-xl bg-white p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-xl font-semibold text-gray-900">
              Edit Employee
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
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
                <label className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
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
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
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
                <label className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
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
                <label className="block text-sm font-medium text-gray-700">
                  Position
                </label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
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
                <label className="block text-sm font-medium text-gray-700">
                  Grade Level
                </label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
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
                <label className="block text-sm font-medium text-gray-700">
                  Work Location
                </label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
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
                <label className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <select
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
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
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
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
