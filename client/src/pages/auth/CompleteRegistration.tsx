import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import {
  TbCurrencyDollar,
  TbCurrencyEuro,
  TbCurrencyPound,
  TbCurrencyYen,
  TbCurrencyNaira,
  TbCurrencyRupee,
  TbCurrencyReal,
  TbCurrencyRubel,
} from "react-icons/tb";
import { AuthSkeleton } from "../../components/skeletons/AuthSkeleton";
import { ImageUpload } from "../../components/ImageUpload";
import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
import { useFieldArray } from "react-hook-form";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL || "https://payrollapi.digitalentshub.net",
  withCredentials: true,
});

const PeopleMaxIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 512 512"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-8 w-8"
  >
    <rect
      width="512"
      height="512"
      rx="100"
      fill="currentColor"
      className="text-green-600"
    />
    <path
      d="M156 256C156 238.327 170.327 224 188 224H324C341.673 224 356 238.327 356 256V352C356 369.673 341.673 384 324 384H188C170.327 384 156 369.673 156 352V256Z"
      fill="white"
    />
    <path
      d="M256 128C282.51 128 304 149.49 304 176C304 202.51 282.51 224 256 224C229.49 224 208 202.51 208 176C208 149.49 229.49 128 256 128Z"
      fill="white"
    />
  </svg>
);

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-white">
    <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    <p className="mt-4 text-lg text-gray-600">Verifying invitation...</p>
  </div>
);

// const registrationSchema = z
//   .object({
//     password: z.string().min(8, "Password must be at least 8 characters"),
//     confirmPassword: z.string(),
//     personalDetails: z.object({
//       middleName: z.string().optional(),
//       dateOfBirth: z
//         .string()
//         .transform((str) => new Date(str).toISOString().split("T")[0]),
//       address: z.object({
//         street: z.string().min(1, "Street is required"),
//         city: z.string().min(1, "City is required"),
//         state: z.string().min(1, "State is required"),
//         zipCode: z.string().min(1, "Zip Code is required"),
//         country: z.string().min(1, "Country is required"),
//       }),
//       maritalStatus: z.string().min(1, "Marital Status is required"),
//       nationality: z.string().min(1, "Nationality is required"),
//       nextOfKin: z.object({
//         name: z.string().min(1, "Next of Kin Name is required"),
//         relationship: z.string().min(1, "Next of Kin Relationship is required"),
//         phone: z.string().min(1, "Next of Kin Phone is required"),
//         address: z.object({
//           street: z.string().min(1, "Next of Kin Street is required"),
//           city: z.string().min(1, "Next of Kin City is required"),
//           state: z.string().min(1, "Next of Kin State is required"),
//           zipCode: z.string().min(1, "Next of Kin Zip Code is required"),
//           country: z.string().min(1, "Next of Kin Country is required"),
//         }),
//       }),
//       qualifications: z.array(
//         z.object({
//           highestEducation: z.string().min(1, "Highest Education is required"),
//           institution: z.string().min(1, "Institution is required"),
//           yearGraduated: z.string().min(1, "Year Graduated is required"),
//         })
//       ),
//     }),
//     emergencyContact: z.object({
//       name: z.string().min(1, "Name is required"),
//       relationship: z.string().min(1, "Relationship is required"),
//       phone: z.string().min(1, "Phone is required"),
//     }),
//     bankDetails: z.object({
//       bankName: z.string().min(1, "Bank name is required"),
//       accountNumber: z.string().min(1, "Account number is required"),
//       accountName: z.string().min(1, "Account name is required"),
//       bankCode: z.string().min(1, "Bank Code is required"),
//     }),
//   })
//   .refine((data) => data.password === data.confirmPassword, {
//     message: "Passwords don't match",
//     path: ["confirmPassword"],
//   });

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  position: string;
  department?: string;
}

type FormData = {
  password: string;
  confirmPassword: string;
  personalDetails: {
    middleName?: string;
    dateOfBirth: string;
    maritalStatus: string;
    nationality: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    qualifications: Array<{
      highestEducation: string;
      institution: string;
      yearGraduated: string;
    }>;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    bankCode: string;
  };
};

const renderDepartmentName = (department: any) => {
  if (typeof department === "object" && department !== null) {
    return department.name || "No Department";
  }
  return "No Department";
};

const CompleteRegistration = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [isTokenValid, setIsTokenValid] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<FormData>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "personalDetails.qualifications",
  });

  useEffect(() => {
    const verifyToken = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`/api/invitation/verify/${token}`);
        console.log(response);

        if (response.data.success) {
          setUserData(response.data.user);
          setIsTokenValid(true);
        } else {
          setIsTokenValid(false);
        }
      } catch (error) {
        setIsTokenValid(false);
        // Handle error appropriately
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      verifyToken();
    } else {
      setIsTokenValid(false);
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get(`/auth/verify-invitation/${token}`);
        console.log("User Data Received:", response.data);
        setUserData(response.data.user);
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load user information");
      }
    };
    fetchUserData();
  }, [token]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isTokenValid) {
    return (
      <div>
        <h1>Invalid or Expired Link</h1>
        <p>The invitation link is invalid or has expired.</p>
      </div>
    );
  }

  if (!userData) {
    return <AuthSkeleton />;
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("token", token!);
      formDataToSend.append("password", data.password);
      formDataToSend.append("confirmPassword", data.confirmPassword);
      formDataToSend.append(
        "emergencyContact",
        JSON.stringify(data.emergencyContact)
      );
      formDataToSend.append("bankDetails", JSON.stringify(data.bankDetails));
      formDataToSend.append(
        "personalDetails",
        JSON.stringify(data.personalDetails)
      );

      if (profileImage) {
        formDataToSend.append("profileImage", profileImage);
      }

      const response = await api.post(
        "/api/invitation/complete-registration",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success("Registration completed successfully!");
        navigate("/auth/signin", {
          state: {
            message:
              "Registration completed successfully. Please login with your credentials.",
          },
        });
      }
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || "Failed to complete registration"
        : "An error occurred";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currencies = [
    TbCurrencyDollar,
    TbCurrencyEuro,
    TbCurrencyPound,
    TbCurrencyYen,
    TbCurrencyNaira,
    TbCurrencyRupee,
    TbCurrencyReal,
    TbCurrencyRubel,
  ];

  return (
    <div className="fixed inset-0 flex items-start justify-center">
      {/* Background with animations */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 -z-20">
        {currencies.map((Currency, index) =>
          Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={`${index}-${i}`}
              initial={{ opacity: 0.1 }}
              animate={{
                opacity: [0.2, 0.4, 0.2],
                scale: [1, 1.2, 1],
                rotate: [0, 360],
              }}
              transition={{
                duration: Math.random() * 15 + 10,
                repeat: Infinity,
                repeatType: "reverse",
                delay: Math.random() * 5,
              }}
              className="absolute text-gray-400/30"
              style={{
                left: `${Math.random() * 95}%`,
                top: `${Math.random() * 95}%`,
                fontSize: `${Math.random() * 60 + 30}px`,
                transform: `rotate(${Math.random() * 360}deg)`,
                filter: "blur(0.5px)",
              }}
            >
              <Currency />
            </motion.div>
          ))
        )}
      </div>

      {/* Overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-white/50 to-transparent -z-10" />

      {/* Content */}
      <div className="w-full max-w-4xl px-4 bg-white py-5 rounded-xl mt-[20px] mb-20">
        <div className="max-h-[80vh] overflow-y-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-6"
          >
            <Link
              to="/"
              className="inline-flex justify-center items-center gap-2"
            >
              <PeopleMaxIcon />
              <span className="text-2xl font-bold text-gray-900">PMS</span>
            </Link>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">
              Complete Your Registration
            </h2>
          </motion.div>

          {/* Display user information */}
          {userData && (
            <div className="bg-green-600 p-4 rounded-lg shadow-md mb-6">
              <h3 className="font-semibold text-lg mb-3 text-white">
                Your Information
              </h3>
              <div className="space-y-2 text-sm text-white">
                <p className="flex justify-between items-center">
                  <span className="text-white/80">Name:</span>
                  <span className="font-medium">
                    {userData?.firstName} {userData?.lastName}
                  </span>
                </p>
                <p className="flex justify-between items-center">
                  <span className="text-white/80">Email:</span>
                  <span className="font-medium">{userData?.email}</span>
                </p>
                <p className="flex justify-between items-center">
                  <span className="text-white/80">Employee ID:</span>
                  <span className="font-medium">{userData?.employeeId}</span>
                </p>
                <p className="flex justify-between items-center">
                  <span className="text-white/80">Position:</span>
                  <span className="font-medium">{userData?.position}</span>
                </p>
                {userData?.department && (
                  <p className="flex justify-between items-center">
                    <span className="text-white/80">Department:</span>
                    <span className="font-medium">
                      {renderDepartmentName(userData.department)}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="bg-white/90 backdrop-blur-xl shadow-2xl rounded-xl p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Profile Image Upload */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Profile Image
                  </label>
                  <ImageUpload
                    onImageSelect={(file) => setProfileImage(file)}
                  />
                </div>

                {/* Personal Details Section */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-4">Personal Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Middle Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Middle Name (Optional)
                      </label>
                      <input
                        type="text"
                        {...register("personalDetails.middleName")}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      />
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        {...register("personalDetails.dateOfBirth")}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      />
                      {errors.personalDetails?.dateOfBirth && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.personalDetails.dateOfBirth.message}
                        </p>
                      )}
                    </div>

                    {/* Marital Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Marital Status
                      </label>
                      <select
                        {...register("personalDetails.maritalStatus")}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      >
                        <option value="">Select status</option>
                        <option value="single">Single</option>
                        <option value="married">Married</option>
                        <option value="divorced">Divorced</option>
                        <option value="widowed">Widowed</option>
                      </select>
                      {errors.personalDetails?.maritalStatus && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.personalDetails.maritalStatus.message}
                        </p>
                      )}
                    </div>

                    {/* Nationality */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nationality
                      </label>
                      <input
                        type="text"
                        {...register("personalDetails.nationality")}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      />
                      {errors.personalDetails?.nationality && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.personalDetails.nationality.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="mt-6">
                    <h4 className="text-md font-medium mb-3">Address</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Street */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Street
                        </label>
                        <input
                          type="text"
                          {...register("personalDetails.address.street")}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        />
                      </div>

                      {/* City */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          City
                        </label>
                        <input
                          type="text"
                          {...register("personalDetails.address.city")}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        />
                      </div>

                      {/* State */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          State
                        </label>
                        <input
                          type="text"
                          {...register("personalDetails.address.state")}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        />
                      </div>

                      {/* Zip Code */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Zip Code
                        </label>
                        <input
                          type="text"
                          {...register("personalDetails.address.zipCode")}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        />
                      </div>

                      {/* Country */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Country
                        </label>
                        <input
                          type="text"
                          {...register("personalDetails.address.country")}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact Section */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-4">
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <input
                        type="text"
                        {...register("emergencyContact.name")}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      />
                      {errors.emergencyContact?.name && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.emergencyContact.name.message}
                        </p>
                      )}
                    </div>

                    {/* Relationship */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Relationship
                      </label>
                      <input
                        type="text"
                        {...register("emergencyContact.relationship")}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      />
                      {errors.emergencyContact?.relationship && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.emergencyContact.relationship.message}
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        {...register("emergencyContact.phone")}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      />
                      {errors.emergencyContact?.phone && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.emergencyContact.phone.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bank Details Section */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-4">Bank Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Bank Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        {...register("bankDetails.bankName")}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      />
                      {errors.bankDetails?.bankName && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.bankDetails.bankName.message}
                        </p>
                      )}
                    </div>

                    {/* Account Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Account Number
                      </label>
                      <input
                        type="text"
                        {...register("bankDetails.accountNumber")}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      />
                      {errors.bankDetails?.accountNumber && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.bankDetails.accountNumber.message}
                        </p>
                      )}
                    </div>

                    {/* Account Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Account Name
                      </label>
                      <input
                        type="text"
                        {...register("bankDetails.accountName")}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      />
                      {errors.bankDetails?.accountName && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.bankDetails.accountName.message}
                        </p>
                      )}
                    </div>

                    {/* Bank Code */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Bank Code
                      </label>
                      <input
                        type="text"
                        {...register("bankDetails.bankCode")}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      />
                      {errors.bankDetails?.bankCode && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.bankDetails.bankCode.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Password Section */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-4">Set Password</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <input
                        type="password"
                        {...register("password")}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      />
                      {errors.password && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.password.message}
                        </p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        {...register("confirmPassword")}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      />
                      {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Qualifications Section */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-4">Qualifications</h3>
                  {fields.map((field, index) => (
                    <div key={field.id} className="mb-4 p-4 border rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Highest Education
                          </label>
                          <input
                            type="text"
                            {...register(
                              `personalDetails.qualifications.${index}.highestEducation`
                            )}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Institution
                          </label>
                          <input
                            type="text"
                            {...register(
                              `personalDetails.qualifications.${index}.institution`
                            )}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Year Graduated
                          </label>
                          <input
                            type="text"
                            {...register(
                              `personalDetails.qualifications.${index}.yearGraduated`
                            )}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="mt-2 text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      append({
                        highestEducation: "",
                        institution: "",
                        yearGraduated: "",
                      })
                    }
                    className="mt-2 text-green-600 hover:text-green-800"
                  >
                    Add Qualification
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Complete Registration"}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CompleteRegistration;
