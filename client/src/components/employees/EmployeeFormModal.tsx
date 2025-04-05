import { useState, useEffect } from "react";
import { BaseModal } from "../shared/BaseModal";
import { Employee, Department } from "../../types/employee";
import { Status } from "../../types/common";
import { toast } from "react-toastify";
import { LoadingSpinner } from "../shared/LoadingSpinner";

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee | null;
  departments: Department[];
  onSubmit: (data: Partial<Employee>) => Promise<void>;
}

export const EmployeeFormModal = ({
  isOpen,
  onClose,
  employee,
  departments,
  onSubmit,
}: EmployeeFormModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Employee>>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    department: undefined,
    position: "",
    gradeLevel: "",
    workLocation: "",
    status: "active" as Status,
    profileImage: "",
    bankDetails: {
      bankName: "",
      accountNumber: "",
      accountName: "",
      bankCode: "",
    },
    emergencyContact: {
      name: "",
      relationship: "",
      phone: "",
    },
    personalDetails: {
      dateOfBirth: "",
      maritalStatus: "",
      nationality: "",
      middleName: "",
      address: {
        street: "",
        city: "",
        state: "",
        country: "",
        zipCode: "",
      },
      qualifications: [],
    },
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        ...employee,
        department: employee.department || undefined,
      });
    }
  }, [employee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      toast.success(
        `Employee successfully ${employee ? "updated" : "created"}!`,
        { className: "bg-green-500 text-white" }
      );
      onClose();
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "department") {
      const selectedDepartment = departments.find((dept) => dept._id === value);
      setFormData((prev) => ({
        ...prev,
        department: selectedDepartment || undefined,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={employee ? "Edit Employee" : "Add New Employee"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Image Upload Section */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div
              className="w-32 h-32 rounded-full border-2 border-gray-200 overflow-hidden cursor-pointer hover:border-green-500 transition-colors"
              onClick={() => {
                /* Add image upload handler */
              }}
            >
              {formData.profileImage ? (
                <img
                  src={formData.profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-xs text-gray-500 mt-2">
                    Click to upload
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Personal Information */}
          <section className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:!border-green-500 focus:!ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:!border-green-500 focus:!ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:!border-green-500 focus:!ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:!border-green-500 focus:!ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="personalDetails.dateOfBirth"
                  value={formData.personalDetails?.dateOfBirth || ""}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:!border-green-500 focus:!ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Marital Status
                </label>
                <select
                  name="personalDetails.maritalStatus"
                  value={formData.personalDetails?.maritalStatus || ""}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:!border-green-500 focus:!ring-green-500"
                >
                  <option value="">Select Status</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nationality
                </label>
                <input
                  type="text"
                  name="personalDetails.nationality"
                  value={formData.personalDetails?.nationality || ""}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:!border-green-500 focus:!ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Middle Name
                </label>
                <input
                  type="text"
                  name="personalDetails.middleName"
                  value={formData.personalDetails?.middleName || ""}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:!border-green-500 focus:!ring-green-500"
                />
              </div>
            </div>
          </section>

          {/* Address Information */}
          <section className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Address Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Street Address
                </label>
                <input
                  type="text"
                  name="personalDetails.address.street"
                  value={formData.personalDetails?.address?.street || ""}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:!border-green-500 focus:!ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  type="text"
                  name="personalDetails.address.city"
                  value={formData.personalDetails?.address?.city || ""}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:!border-green-500 focus:!ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  State
                </label>
                <input
                  type="text"
                  name="personalDetails.address.state"
                  value={formData.personalDetails?.address?.state || ""}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:!border-green-500 focus:!ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Country
                </label>
                <input
                  type="text"
                  name="personalDetails.address.country"
                  value={formData.personalDetails?.address?.country || ""}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:!border-green-500 focus:!ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  ZIP Code
                </label>
                <input
                  type="text"
                  name="personalDetails.address.zipCode"
                  value={formData.personalDetails?.address?.zipCode || ""}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:!border-green-500 focus:!ring-green-500"
                />
              </div>
            </div>
          </section>

          {/* Employment Information */}
          <section className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Employment Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <select
                  name="department"
                  value={formData.department?._id || ""}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:!border-green-500 focus:!ring-green-500"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Position
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:!border-green-500 focus:!ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Grade Level
                </label>
                <input
                  type="text"
                  name="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:!border-green-500 focus:!ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Work Location
                </label>
                <input
                  type="text"
                  name="workLocation"
                  value={formData.workLocation}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:!border-green-500 focus:!ring-green-500"
                />
              </div>
            </div>
          </section>

          {/* Bank Details */}
          <section className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Bank Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Bank Name
                </label>
                <input
                  type="text"
                  name="bankDetails.bankName"
                  value={formData.bankDetails?.bankName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:!border-green-500 focus:!ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Account Number
                </label>
                <input
                  type="text"
                  name="bankDetails.accountNumber"
                  value={formData.bankDetails?.accountNumber}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:!border-green-500 focus:!ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Account Name
                </label>
                <input
                  type="text"
                  name="bankDetails.accountName"
                  value={formData.bankDetails?.accountName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:!border-green-500 focus:!ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Bank Code
                </label>
                <input
                  type="text"
                  name="bankDetails.bankCode"
                  value={formData.bankDetails?.bankCode}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:!border-green-500 focus:!ring-green-500"
                />
              </div>
            </div>
          </section>

          {/* Emergency Contact */}
          <section className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Emergency Contact
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  name="emergencyContact.name"
                  value={formData.emergencyContact?.name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:!border-green-500 focus:!ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Relationship
                </label>
                <input
                  type="text"
                  name="emergencyContact.relationship"
                  value={formData.emergencyContact?.relationship}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:!border-green-500 focus:!ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="emergencyContact.phone"
                  value={formData.emergencyContact?.phone}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:!border-green-500 focus:!ring-green-500"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-8 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 
                     transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 !bg-green-600 !text-white rounded-lg hover:!bg-green-700 
                     transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{employee ? "Update Employee" : "Add Employee"}</span>
            )}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};
