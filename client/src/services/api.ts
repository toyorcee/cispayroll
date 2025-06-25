import axios from "axios";
import { toast } from "react-toastify";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Log the base URL for debugging
console.log("🔧 API Base URL:", import.meta.env.VITE_API_URL);
console.log("🔧 API Instance created with baseURL:", api.defaults.baseURL);

// Request interceptor: Attach auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
      console.log("🔑 Request with token:", config.url);
    } else {
      console.log("🔓 Request without token:", config.url);
    }
    console.log(
      "📤 Making request to:",
      (config.baseURL || "") + (config.url || "")
    );
    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor: Handle errors globally
api.interceptors.response.use(
  (response) => {
    console.log("✅ Response received:", response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error(
      "❌ Response error:",
      error.config?.url,
      error.response?.status,
      error.response?.data
    );

    if (error.response) {
      if (error.response.status === 401) {
        // Optionally, clear auth and redirect to login
        localStorage.removeItem("token");
        toast.error("Session expired. Please log in again.");
        window.location.href = "/auth/signin";
      } else if (error.response.data?.message) {
        toast.error(error.response.data.message);
      }
    } else {
      toast.error("Network error. Please try again.");
    }
    return Promise.reject(error);
  }
);

export default api;
