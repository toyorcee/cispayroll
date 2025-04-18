import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";
import { User, UserRole, Permission } from "../types/auth";
import { toast } from "react-toastify";
import { useQueryClient, QueryClient } from "@tanstack/react-query";
import {
  prefetchDepartments,
  departmentService,
  DEPARTMENTS_QUERY_KEY,
} from "../services/departmentService";

axios.defaults.baseURL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";
axios.defaults.withCredentials = true;

axios.interceptors.response.use(
  (response) => {
    if (response.headers?.["x-refresh-payrolls"] === "true") {
      const queryClient = new QueryClient();
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
      queryClient.invalidateQueries({ queryKey: ["departmentPayrolls"] });
    }

    if (response.headers?.["x-refresh-audit-logs"] === "true") {
      const queryClient = new QueryClient();
      queryClient.invalidateQueries({ queryKey: ["departmentPayrolls"] });
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }

    if (response.headers?.["x-refresh-finance-director"] === "true") {
      const queryClient = new QueryClient();
      queryClient.invalidateQueries({ queryKey: ["departmentPayrolls"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  googleSignIn: () => void;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  hasRole: (role: UserRole) => boolean;
  refreshUser: () => Promise<void>;
  isSuperAdmin: () => boolean;
  isAdmin: () => boolean;
  isUser: () => boolean;
  updateUser: (user: User) => void;
  // Password management functions
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  updatePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  checkPasswordStatus: () => Promise<{ requiresChange: boolean }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

// Create and export the queryClient instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, 
      gcTime: 30 * 60 * 1000, 
    },
  },
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const isCompletingRegistration = window.location.pathname.includes(
      "/auth/complete-registration"
    );

    if (!isCompletingRegistration) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, []);

  const hasRole = (role: UserRole): boolean => {
    if (!user) return false;
    if (user.role === UserRole.SUPER_ADMIN) return true;
    if (user.role === UserRole.ADMIN && role === UserRole.USER) return true;
    return user.role === role;
  };

  const fetchUserData = async () => {
    try {
      const { data } = await axios.get("/api/auth/me");
      if (data.user) {
        setUser(parseUserData(data.user));
        await prefetchDepartments(queryClient);
      } else {
        setUser(null);
      }
    } catch (error: unknown) {
      // Only show error toast if not on registration completion page
      if (!window.location.pathname.includes("/auth/complete-registration")) {
        console.error(
          "❌ Auth check failed:",
          axios.isAxiosError(error) ? error.response?.data || error : error
        );
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data } = await axios.post("/api/auth/login", {
        email,
        password,
      });
      if (data.user) {
        setUser(parseUserData(data.user));

        // Prefetch departments using updated options
        await queryClient.prefetchQuery({
          queryKey: DEPARTMENTS_QUERY_KEY,
          queryFn: departmentService.getAllDepartments,
          staleTime: 5 * 60 * 1000,
          gcTime: 30 * 60 * 1000,
        });
      } else {
        throw new Error("No user data received");
      }
    } catch (error: unknown) {
      handleAuthError(error);
    }
  };

  const signUp = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ) => {
    try {
      const { data } = await axios.post("/api/auth/signup", {
        firstName,
        lastName,
        email,
        password,
      });

      if (data.user) {
        setUser(parseUserData(data.user));
      } else {
        throw new Error("No user data received");
      }
    } catch (error: unknown) {
      handleAuthError(error);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await axios.get("/api/auth/logout");
      setUser(null);
      toast.success("Logged out successfully");
    } catch (error: unknown) {
      console.error("Logout failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const googleSignIn = () => {
    window.location.href = "/api/auth/google";
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!user) return false;
    return permissions.some((permission) =>
      user.permissions.includes(permission)
    );
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    if (!user) return false;
    return permissions.every((permission) =>
      user.permissions.includes(permission)
    );
  };

  const refreshUser = async () => {
    try {
      await fetchUserData();
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      toast.error("Failed to refresh user data");
    }
  };

  const isSuperAdmin = (): boolean => {
    return user?.role === UserRole.SUPER_ADMIN;
  };

  const isAdmin = (): boolean => {
    return user?.role === UserRole.ADMIN;
  };

  const isUser = (): boolean => {
    return user?.role === UserRole.USER;
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  // Password management functions
  const forgotPassword = async (email: string): Promise<void> => {
    try {
      const response = await axios.post("/api/password/forgot", { email });

      console.log(
        "✅ Frontend: Password reset request successful:",
        response.data
      );
      toast.success("Password reset instructions sent to your email");
    } catch (error) {
      console.error("❌ Frontend: Forgot password error:", error);
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || "Failed to process your request"
        );
      } else {
        toast.error("An unexpected error occurred");
      }
      throw error;
    }
  };

  const resetPassword = async (
    token: string,
    newPassword: string
  ): Promise<void> => {
    try {
      await axios.post("/api/password/reset", { token, newPassword });
    } catch (error) {
      console.error("Reset password error:", error);
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || "Failed to reset your password"
        );
      } else {
        toast.error("An unexpected error occurred");
      }
      throw error;
    }
  };

  const updatePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<void> => {
    try {
      await axios.post("/api/password/update", {
        currentPassword,
        newPassword,
      });
      toast.success("Password updated successfully");
    } catch (error) {
      console.error("Update password error:", error);
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || "Failed to update your password"
        );
      } else {
        toast.error("An unexpected error occurred");
      }
      throw error;
    }
  };

  const checkPasswordStatus = async (): Promise<{
    requiresChange: boolean;
  }> => {
    try {
      const { data } = await axios.get("/api/password/status");
      return data;
    } catch (error) {
      console.error("Check password status error:", error);
      // Default to not requiring change on error
      return { requiresChange: false };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        googleSignIn,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole,
        refreshUser,
        isSuperAdmin,
        isAdmin,
        isUser,
        updateUser,
        // Password management functions
        forgotPassword,
        resetPassword,
        updatePassword,
        checkPasswordStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Helper function to map API response to User type
const parseUserData = (data: Partial<User>): User => ({
  _id: data._id || "",
  employeeId: data.employeeId || "",
  firstName: data.firstName || "",
  lastName: data.lastName || "",
  email: data.email || "",
  phone: data.phone || "",
  role: data.role || UserRole.USER,
  permissions: Array.isArray(data.permissions) ? data.permissions : [],
  department: data.department || {
    _id: "",
    name: "",
    code: "",
  },
  position: data.position || "",
  status: data.status || "active",
  gradeLevel: data.gradeLevel || "",
  workLocation: data.workLocation || "",
  dateJoined: data.dateJoined ? new Date(data.dateJoined) : new Date(),
  emergencyContact: {
    name: data.emergencyContact?.name || "",
    relationship: data.emergencyContact?.relationship || "",
    phone: data.emergencyContact?.phone || "",
  },
  bankDetails: {
    bankName: data.bankDetails?.bankName || "",
    accountNumber: data.bankDetails?.accountNumber || "",
    accountName: data.bankDetails?.accountName || "",
  },
  profileImage: data.profileImage || "",
  reportingTo: data.reportingTo || undefined,
  isEmailVerified: Boolean(data.isEmailVerified),
  lastLogin: data.lastLogin ? new Date(data.lastLogin) : undefined,
  createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
  updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
});

// Handle authentication errors from API
const handleAuthError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message || "Authentication failed";
    throw new Error(message);
  }
  throw error;
};
