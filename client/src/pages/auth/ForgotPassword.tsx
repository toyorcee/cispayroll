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
import { useAuth } from "../../context/AuthContext";

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

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
    setLoading(true);

    try {
      await forgotPassword(email);
      setSubmitted(true);
      setTimeout(() => {
        navigate("/auth/signin");
      }, 3000);
    } catch (error) {
      console.error("Forgot password error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-full max-w-md px-4 bg-white py-5 rounded-xl shadow-lg">
          <div className="text-center mb-6">
            <Link
              to="/"
              className="inline-flex justify-center items-center gap-2"
            >
              <PeopleMaxIcon />
              <span className="text-2xl font-bold text-gray-900">PMS</span>
            </Link>

            <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">
              Check Your Email
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              We've sent password reset instructions to your email address.
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/auth/signin"
              className="font-medium text-green-600 hover:text-green-500"
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            Forgot Password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we'll send you instructions to reset
            your password.
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
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                    placeholder="Enter your email address"
                  />
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
                  {loading ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Sending...
                    </div>
                  ) : (
                    "Send Reset Instructions"
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{" "}
            <Link
              to="/auth/signin"
              className="font-medium text-green-600 hover:text-green-500"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
