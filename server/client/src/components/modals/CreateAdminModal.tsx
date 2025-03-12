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

// Define the form schema with all required fields
const adminSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[!@#$%^&*]/,
      "Password must contain at least one special character"
    ),
  phone: z.string().min(10, "Valid phone number is required"),
  employeeId: z.string().min(1, "Employee ID is required"),
  position: z.string().min(1, "Position is required"),
  gradeLevel: z.string().min(1, "Grade level is required"),
  workLocation: z.string().min(1, "Work location is required"),
  dateJoined: z.string().min(1, "Date joined is required"),
  department: z.string().min(1, "Department is required"),
  emergencyContact: z.object({
    name: z.string().min(1, "Emergency contact name is required"),
    relationship: z.string().min(1, "Relationship is required"),
    phone: z.string().min(10, "Valid emergency contact phone is required"),
  }),
  bankDetails: z.object({
    bankName: z.string().min(1, "Bank name is required"),
    accountNumber: z.string().min(1, "Account number is required"),
    accountName: z.string().min(1, "Account name is required"),
  }),
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

      const response = await axios.post(
        "http://localhost:5000/api/auth/signup/admin",
        {
          ...data,
          role: UserRole.ADMIN,
          isEmailVerified: true,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Admin created successfully:", response.data);
      toast.success("Admin created successfully!", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
        style: { backgroundColor: "#22c55e" },
      });
      reset();
      onClose();
    } catch (error) {
      console.error("Error creating admin:", error);
      // Better error handling with axios
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || "Failed to create admin"
        : "Failed to create admin";

      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        theme: "colored",
      });
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-y-auto"
          onClose={onClose}
        >
          <div className="min-h-screen px-4 text-center flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50"
              aria-hidden="true"
              onClick={onClose}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 50 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.3,
              }}
              className="inline-block w-full max-w-4xl p-8 my-8 overflow-hidden text-left align-middle bg-white shadow-xl rounded-2xl relative z-10"
            >
              <HeadlessDialog.Title
                as="h3"
                className="text-2xl font-semibold text-gray-900 mb-6 pb-3 border-b border-blue-200"
              >
                Create New Admin
              </HeadlessDialog.Title>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Personal Information */}
                <motion.section
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-4"
                >
                  <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                      1
                    </span>
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
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
                      {...register("password")}
                      label="Password"
                      type="password"
                      variant="outlined"
                      fullWidth
                      error={!!errors.password}
                      helperText={errors.password?.message}
                    />
                    <TextField
                      {...register("phone")}
                      label="Phone"
                      variant="outlined"
                      fullWidth
                      error={!!errors.phone}
                      helperText={errors.phone?.message}
                    />
                  </div>
                </motion.section>

                {/* Employment Details */}
                <motion.section
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-4"
                >
                  <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                      2
                    </span>
                    Employment Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <TextField
                      {...register("employeeId")}
                      label="Employee ID"
                      variant="outlined"
                      fullWidth
                      error={!!errors.employeeId}
                      helperText={errors.employeeId?.message}
                    />
                    <TextField
                      select
                      {...register("department")}
                      variant="outlined"
                      fullWidth
                      error={!!errors.department}
                      helperText={errors.department?.message}
                      SelectProps={{
                        native: true,
                        className: "bg-white",
                      }}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option
                          key={dept.toLowerCase().replace(/\s+/g, "-")}
                          value={dept.toLowerCase().replace(/\s+/g, "-")}
                        >
                          {dept}
                        </option>
                      ))}
                    </TextField>
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
                  </div>
                </motion.section>

                {/* Emergency Contact */}
                <motion.section
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-4"
                >
                  <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                      3
                    </span>
                    Emergency Contact
                  </h4>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <TextField
                      {...register("emergencyContact.name")}
                      label="Contact Name"
                      variant="outlined"
                      fullWidth
                      error={!!errors.emergencyContact?.name}
                      helperText={errors.emergencyContact?.name?.message}
                    />
                    <TextField
                      {...register("emergencyContact.relationship")}
                      label="Relationship"
                      variant="outlined"
                      fullWidth
                      error={!!errors.emergencyContact?.relationship}
                      helperText={
                        errors.emergencyContact?.relationship?.message
                      }
                    />
                    <TextField
                      {...register("emergencyContact.phone")}
                      label="Contact Phone"
                      variant="outlined"
                      fullWidth
                      error={!!errors.emergencyContact?.phone}
                      helperText={errors.emergencyContact?.phone?.message}
                    />
                  </div>
                </motion.section>

                {/* Bank Details */}
                <motion.section
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-4"
                >
                  <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                      4
                    </span>
                    Bank Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <TextField
                      {...register("bankDetails.bankName")}
                      label="Bank Name"
                      variant="outlined"
                      fullWidth
                      error={!!errors.bankDetails?.bankName}
                      helperText={errors.bankDetails?.bankName?.message}
                    />
                    <TextField
                      {...register("bankDetails.accountNumber")}
                      label="Account Number"
                      variant="outlined"
                      fullWidth
                      error={!!errors.bankDetails?.accountNumber}
                      helperText={errors.bankDetails?.accountNumber?.message}
                    />
                    <TextField
                      {...register("bankDetails.accountName")}
                      label="Account Name"
                      variant="outlined"
                      fullWidth
                      error={!!errors.bankDetails?.accountName}
                      helperText={errors.bankDetails?.accountName?.message}
                    />
                  </div>
                </motion.section>

                {/* Form Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex justify-end space-x-4 pt-6 border-t border-gray-200"
                >
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-white rounded-lg border-2 border-gray-300 
                              hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 
                              focus:ring-blue-500 transition-all duration-300 min-w-[120px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-3 text-sm font-medium !text-white !bg-blue-600 rounded-lg
                              hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                              focus:ring-blue-500 transition-all duration-300 flex items-center justify-center
                              space-x-2 min-w-[120px] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <CircularProgress size={20} color="inherit" />
                        <span className="text-white">Creating...</span>
                      </>
                    ) : (
                      <span className="text-white">Create Admin</span>
                    )}
                  </button>
                </motion.div>
              </form>
            </motion.div>
          </div>
        </HeadlessDialog>
      )}
    </AnimatePresence>
  );
};

export default CreateAdminModal;
