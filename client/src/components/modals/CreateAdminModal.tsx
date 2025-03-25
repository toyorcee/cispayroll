import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog as HeadlessDialog } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UserRole } from "../../types/auth";
import { toast } from "react-toastify";
import { CircularProgress } from "@mui/material";
import { TextField } from "@mui/material";
import axios from "axios";

// Simplified schema to match employee form
const adminSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Valid phone number is required"),
  position: z.string().min(1, "Position is required"),
  gradeLevel: z.string().min(1, "Grade level is required"),
  workLocation: z.string().min(1, "Work location is required"),
  dateJoined: z.string().min(1, "Date joined is required"),
  department: z.string().min(1, "Department is required"),
});

type AdminFormData = z.infer<typeof adminSchema>;

interface CreateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: string[];
}

const CreateAdminModal = ({
  isOpen,
  onClose,
  departments,
}: CreateAdminModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AdminFormData>({
    resolver: zodResolver(adminSchema),
  });

  const onSubmit = async (data: AdminFormData) => {
    try {
      setIsLoading(true);

      // Just create the admin in pending state - don't create onboarding entry yet
      const response = await axios.post(
        "http://localhost:5000/api/employees/create",
        {
          ...data,
          role: UserRole.ADMIN,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Remove the newAdmin object creation since it will be handled after registration

      toast.success("Admin invitation sent successfully!");
      reset();
      onClose();
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || "Failed to create admin"
        : "Failed to create admin";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <HeadlessDialog
          as={motion.div}
          static
          open={isOpen}
          className="fixed inset-0 z-50 overflow-y-auto"
          onClose={onClose}
        >
          <div className="min-h-screen px-4 text-center flex items-center justify-center">
            <motion.div
              className="fixed inset-0 bg-black/50"
              aria-hidden="true"
              onClick={onClose}
            />

            <motion.div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle bg-white shadow-xl rounded-2xl relative z-10">
              <HeadlessDialog.Title className="text-xl font-semibold text-gray-900 mb-6">
                Create New Admin
              </HeadlessDialog.Title>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <TextField
                    {...register("firstName")}
                    label="First Name"
                    variant="outlined"
                    fullWidth
                    error={!!errors.firstName}
                    helperText={errors.firstName?.message}
                  />
                  <TextField
                    {...register("lastName")}
                    label="Last Name"
                    variant="outlined"
                    fullWidth
                    error={!!errors.lastName}
                    helperText={errors.lastName?.message}
                  />
                  <TextField
                    {...register("email")}
                    label="Email"
                    type="email"
                    variant="outlined"
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                  <TextField
                    {...register("phone")}
                    label="Phone"
                    variant="outlined"
                    fullWidth
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                  />
                  <TextField
                    {...register("position")}
                    label="Position"
                    variant="outlined"
                    fullWidth
                    error={!!errors.position}
                    helperText={errors.position?.message}
                  />
                  <TextField
                    {...register("gradeLevel")}
                    label="Grade Level"
                    variant="outlined"
                    fullWidth
                    error={!!errors.gradeLevel}
                    helperText={errors.gradeLevel?.message}
                  />
                  <TextField
                    {...register("workLocation")}
                    label="Work Location"
                    variant="outlined"
                    fullWidth
                    error={!!errors.workLocation}
                    helperText={errors.workLocation?.message}
                  />
                  <TextField
                    {...register("dateJoined")}
                    label="Date Joined"
                    type="date"
                    variant="outlined"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.dateJoined}
                    helperText={errors.dateJoined?.message}
                  />
                  <TextField
                    select
                    {...register("department")}
                    label="Department"
                    variant="outlined"
                    fullWidth
                    error={!!errors.department}
                    helperText={errors.department?.message}
                    SelectProps={{
                      native: true,
                    }}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    className="col-span-2"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </TextField>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white !bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-70 flex items-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <CircularProgress size={20} color="inherit" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      "Create Admin"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </HeadlessDialog>
      )}
    </AnimatePresence>
  );
};

export default CreateAdminModal;
