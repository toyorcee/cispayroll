import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { TextField } from "@mui/material";
import { CircularProgress } from "@mui/material";
import { toast } from "react-toastify";
import { departmentService } from "../../services/departmentService";
import { BaseModal } from "../shared/BaseModal";

const departmentSchema = z.object({
  name: z.string().min(2, "Department name is required"),
  code: z.string().min(2, "Department code is required").toUpperCase(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(2, "Location is required"),
  headOfDepartment: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

export default function CreateDepartmentModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
  });

  const onSubmit = async (data: DepartmentFormData) => {
    try {
      setIsLoading(true);
      const auth = JSON.parse(localStorage.getItem("auth") || "{}");

      // Clean up empty strings but keep headOfDepartment as string
      const cleanData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          value === "" ? undefined : value,
        ])
      );

      await departmentService.createDepartment(cleanData, auth.token);

      toast.success("Department created successfully!");
      reset();
      onClose();
    } catch (error: any) {
      console.error("Full error:", error.response?.data);
      toast.error(
        error.response?.data?.message || "Failed to create department"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Create New Department">
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden transform transition-all">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                Create New Department
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Form Content - existing form structure remains the same */}
          <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
                <div className="mb-6">
                  <TextField
                    {...register("name")}
                    label="Department Name"
                    variant="outlined"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                </div>

                <div className="mb-6">
                  <TextField
                    {...register("code")}
                    label="Department Code"
                    variant="outlined"
                    fullWidth
                    error={!!errors.code}
                    helperText={errors.code?.message}
                  />
                </div>

                <div className="mb-6">
                  <TextField
                    {...register("description")}
                    label="Description"
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={4}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                </div>

                <div className="mb-6">
                  <TextField
                    {...register("location")}
                    label="Location"
                    variant="outlined"
                    fullWidth
                    error={!!errors.location}
                    helperText={errors.location?.message}
                  />
                </div>

                <div className="mb-6">
                  <TextField
                    {...register("headOfDepartment")}
                    label="Head of Department Name (Optional)"
                    variant="outlined"
                    fullWidth
                    error={!!errors.headOfDepartment}
                    helperText={errors.headOfDepartment?.message}
                    placeholder="Enter name for now, selection coming soon"
                  />
                </div>

                <div className="mb-6">
                  <TextField
                    {...register("email")}
                    label="Email (Optional)"
                    type="email"
                    variant="outlined"
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                </div>

                <div>
                  <TextField
                    {...register("phone")}
                    label="Phone (Optional)"
                    variant="outlined"
                    fullWidth
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center"
            >
              {isLoading ? (
                <>
                  <CircularProgress
                    size={16}
                    color="inherit"
                    className="mr-2"
                  />
                  Creating...
                </>
              ) : (
                "Create Department"
              )}
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
