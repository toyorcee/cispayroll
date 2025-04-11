import { Link, useNavigate } from "react-router-dom";
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
import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

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

export default function UpdatePassword() {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      // Error will be handled by the toast in the updatePassword function
      return;
    }

    setLoading(true);

    try {
      await updatePassword(currentPassword, newPassword);
      // Show success message and redirect to dashboard
      toast.success(
        "Password updated successfully! Redirecting to dashboard...",
        {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate("/pms/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Update password error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      {/* Background with animations */}
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

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent -z-10" />

      {/* Content */}
      <div className="w-full max-w-md px-4 bg-white py-5 rounded-xl">
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
            Update Password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your current password and choose a new one.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="bg-white/90 backdrop-blur-xl shadow-2xl rounded-xl p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Current Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500 pr-10"
                    placeholder="Enter your current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showCurrentPassword ? (
                      <FaEyeSlash className="h-5 w-5" />
                    ) : (
                      <FaEye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  New Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500 pr-10"
                    placeholder="Enter your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showNewPassword ? (
                      <FaEyeSlash className="h-5 w-5" />
                    ) : (
                      <FaEye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm New Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500 pr-10"
                    placeholder="Confirm your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <FaEyeSlash className="h-5 w-5" />
                    ) : (
                      <FaEye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 rounded-lg border border-transparent 
                           !bg-green-600 !text-white font-medium hover:!bg-green-700 
                           focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 
                           transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </motion.div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Changed your mind?{" "}
            <Link
              to="/dashboard"
              className="font-medium text-green-600 hover:text-green-500"
            >
              Return to Dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
