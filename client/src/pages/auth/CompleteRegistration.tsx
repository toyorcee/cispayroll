import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { FaMoneyCheckAlt } from "react-icons/fa";
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

axios.defaults.baseURL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";
axios.defaults.withCredentials = true;

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  position: string;
  department?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

const CompleteRegistration = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    emergencyContact: {
      name: "",
      relationship: "",
      phone: "",
    },
    bankDetails: {
      bankName: "",
      accountNumber: "",
      accountName: "",
    },
  });

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

  useEffect(() => {
    let mounted = true;

    const verifyToken = async () => {
      try {
        console.log("Verifying token:", token);
        const response = await axios.get(`/api/invitation/verify/${token}`);

        if (mounted) {
          if (response.data.success) {
            setUserData(response.data.userData);
            toast.success("Invitation verified successfully");
          } else {
            throw new Error(response.data.message);
          }
        }
      } catch (err) {
        if (mounted) {
          console.error("Verification error:", err);
          const message = axios.isAxiosError(err)
            ? err.response?.data?.message ||
              "Invalid or expired invitation link"
            : "An error occurred";
          setError(message);
          toast.error(message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    if (token) {
      verifyToken();
    }

    return () => {
      mounted = false;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("token", token!);
      formDataToSend.append("password", password);
      formDataToSend.append("confirmPassword", confirmPassword);

      // Add emergency contact and bank details
      formDataToSend.append(
        "emergencyContact",
        JSON.stringify(formData.emergencyContact)
      );
      formDataToSend.append(
        "bankDetails",
        JSON.stringify(formData.bankDetails)
      );

      if (profileImage) {
        formDataToSend.append("profileImage", profileImage);
      }

      const response = await axios.post(
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
            message: "Registration completed successfully. Please login.",
          },
        });
      }
    } catch (err) {
      console.error("Registration error:", err);
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || "Failed to complete registration"
        : "An error occurred";
      toast.error(message);
    }
  };

  if (loading) {
    return <AuthSkeleton />;
  }

  if (error || !userData) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 -z-20">
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
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent -z-10" />
        <div className="w-full max-w-md px-4">
          <div className="bg-white rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Registration Error
            </h2>
            <p className="text-gray-600 mb-6">
              {error || "Invalid invitation link"}
            </p>
            <button
              onClick={() => navigate("/auth/signin")}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

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

      {/* Content - Added more margin and made container scrollable */}
      <div className="w-full max-w-md px-4 bg-white py-5 rounded-xl mt-[20px] mb-20">
        <div className="max-h-[70vh] overflow-y-auto px-4">
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
              <FaMoneyCheckAlt className="h-8 w-8 text-green-600" />
              <span className="text-2xl font-bold text-gray-900">PAYROLL</span>
            </Link>

            <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">
              Complete Your Registration
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="bg-white/90 backdrop-blur-xl shadow-2xl rounded-xl p-6">
              {/* Pre-filled Information */}
              <div className="bg-green-600 p-4 rounded-lg shadow-md mb-6">
                <h3 className="font-semibold text-lg mb-3 text-white">
                  Your Information
                </h3>
                <div className="space-y-2 text-sm text-white">
                  <p className="flex justify-between items-center">
                    <span className="text-white/80">Name:</span>
                    <span className="font-medium">
                      {userData.firstName} {userData.lastName}
                    </span>
                  </p>
                  <p className="flex justify-between items-center">
                    <span className="text-white/80">Email:</span>
                    <span className="font-medium">{userData.email}</span>
                  </p>
                  <p className="flex justify-between items-center">
                    <span className="text-white/80">Employee ID:</span>
                    <span className="font-medium">{userData.employeeId}</span>
                  </p>
                  <p className="flex justify-between items-center">
                    <span className="text-white/80">Position:</span>
                    <span className="font-medium">{userData.position}</span>
                  </p>
                  {userData.department && (
                    <p className="flex justify-between items-center">
                      <span className="text-white/80">Department:</span>
                      <span className="font-medium">{userData.department}</span>
                    </p>
                  )}
                </div>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Profile Image Upload */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Profile Image (Optional)
                  </label>
                  <ImageUpload
                    onImageSelect={(file) => setProfileImage(file)}
                  />
                </div>

                {/* Emergency Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                        value={formData.emergencyContact.name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            emergencyContact: {
                              ...prev.emergencyContact,
                              name: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Relationship
                      </label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                        value={formData.emergencyContact.relationship}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            emergencyContact: {
                              ...prev.emergencyContact,
                              relationship: e.target.value,
                            },
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
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                        value={formData.emergencyContact.phone}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            emergencyContact: {
                              ...prev.emergencyContact,
                              phone: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Bank Details
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                        value={formData.bankDetails.bankName}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            bankDetails: {
                              ...prev.bankDetails,
                              bankName: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Account Number
                      </label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                        value={formData.bankDetails.accountNumber}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            bankDetails: {
                              ...prev.bankDetails,
                              accountNumber: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Account Name
                      </label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                        value={formData.bankDetails.accountName}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            bankDetails: {
                              ...prev.bankDetails,
                              accountName: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Password Fields */}
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Create Password
                    </label>
                    <div className="mt-1">
                      <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        className="block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                        placeholder="Create a secure password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Confirm Password
                    </label>
                    <div className="mt-1">
                      <input
                        id="confirm-password"
                        name="confirm-password"
                        type="password"
                        required
                        className="block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 rounded-lg border border-transparent 
                         !bg-green-600 text-white font-medium hover:bg-green-700 
                         focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 
                         transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Complete Registration
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
