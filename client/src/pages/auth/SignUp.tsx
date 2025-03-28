import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaMoneyCheckAlt, FaGoogle } from "react-icons/fa";
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
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import { toast } from "react-toastify";

export default function SignUp() {
  const { signUp, googleSignIn } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          backgroundColor: "#ffffff",
          color: "#1f2937",
          border: "1px solid #e5e7eb",
          borderRadius: "0.5rem",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        },
      });
      return;
    }

    if (!agreed) {
      toast.error("Please agree to the Terms of Service and Privacy Policy", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          backgroundColor: "#ffffff",
          color: "#1f2937",
          border: "1px solid #e5e7eb",
          borderRadius: "0.5rem",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        },
      });
      return;
    }

    setLoading(true);

    try {
      await signUp(
        formData.firstName,
        formData.lastName,
        formData.email,
        formData.password
      );
      toast.success("Registration Successful! Kindly login.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          backgroundColor: "#ffffff",
          color: "#1f2937",
          border: "1px solid #e5e7eb",
          borderRadius: "0.5rem",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        },
      });
      navigate("/auth/signin");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create account",
        {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: {
            backgroundColor: "#ffffff",
            color: "#1f2937",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          },
        }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center overflow-y-auto">
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
      <div className="flex items-center justify-center min-h-screen w-full content my-5">
        <div className="max-w-md w-full bg-white p-6 rounded-xl shadow-lg">
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
              Create your account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/auth/signin"
                className="font-medium !text-green-600 !hover:text-green-500"
              >
                Sign in instead
              </Link>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="bg-white/90 backdrop-blur-xl shadow-2xl rounded-xl p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Personal Information */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="block text-sm font-medium text-gray-700"
                      >
                        First Name
                      </label>
                      <div className="mt-1">
                        <input
                          id="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          type="text"
                          required
                          className="block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                          placeholder="First name"
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="lastName"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Last Name
                      </label>
                      <div className="mt-1">
                        <input
                          id="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          type="text"
                          required
                          className="block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                          placeholder="Last name"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="username"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Username
                    </label>
                    <div className="mt-1">
                      <input
                        id="username"
                        value={formData.username}
                        onChange={handleChange}
                        type="text"
                        required
                        className="block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                        placeholder="Choose a username"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email
                    </label>
                    <div className="mt-1">
                      <input
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        type="email"
                        autoComplete="email"
                        required
                        className="block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Password Section */}
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Password
                    </label>
                    <div className="mt-1">
                      <input
                        id="password"
                        value={formData.password}
                        onChange={handleChange}
                        type="password"
                        required
                        className="block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                        placeholder="Create a password"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Confirm Password
                    </label>
                    <div className="mt-1">
                      <input
                        id="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        type="password"
                        required
                        className="block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                        placeholder="Confirm your password"
                      />
                    </div>
                  </div>
                </div>

                {/* Terms and Privacy */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="terms"
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="terms" className="text-gray-500">
                      I agree to the{" "}
                      <a
                        href="#"
                        className="font-medium !text-green-600 !hover:text-green-500"
                      >
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a
                        href="#"
                        className="font-medium !text-green-600 !hover:text-green-500"
                      >
                        Privacy Policy
                      </a>
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={loading || !agreed}
                    className="w-full flex justify-center py-2 px-4 rounded-lg border border-transparent 
                             !bg-green-600 !text-white font-medium hover:!bg-green-700 
                             focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 
                             transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-white px-2 text-gray-500">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={googleSignIn}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg 
                             !bg-green-600 !text-white hover:!bg-white hover:!text-green-600 
                             border border-green-600 font-medium focus:outline-none focus:ring-2 
                             focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    <FaGoogle className="h-5 w-5" />
                    Sign up with Google
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
