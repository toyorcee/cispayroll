import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import { toast } from "react-toastify";

// Define the API response structure
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
}

// Define the error response structure
interface ApiErrorResponse {
  success: boolean;
  message: string;
  error?: any;
}

// Get API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create axios instance with default config
export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, 
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    // Handle different types of errors
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || "An error occurred";

      // Handle specific error cases
      switch (error.response.status) {
        case 401:
          // Handle unauthorized (e.g., redirect to login)
          toast.error("Session expired. Please login again.");
          // You might want to redirect to login page here
          break;
        case 403:
          toast.error("You do not have permission to perform this action");
          break;
        case 404:
          toast.error("Resource not found");
          break;
        case 500:
          toast.error("Server error. Please try again later");
          break;
        default:
          toast.error(message);
      }
    } else if (error.request) {
      // Request was made but no response received
      toast.error("Network error. Please check your connection");
    } else {
      // Something else went wrong
      toast.error("An unexpected error occurred");
    }

    return Promise.reject(error);
  }
);

// Helper function to handle API responses
export const handleApiResponse = <T>(
  response: AxiosResponse<ApiResponse<T>>
): T => {
  if (!response.data.success) {
    throw new Error(response.data.message || "Request failed");
  }
  return response.data.data;
};

// Helper function to handle API errors
export const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    throw new Error(error.response?.data?.message || error.message);
  }
  throw error;
};
