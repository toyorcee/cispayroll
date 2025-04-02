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
  import.meta.env.VITE_API_URL || "https://payrollapi.digitalentshub.net";
axios.defaults.withCredentials = true;

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
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

// Create and export the queryClient instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (previously called cacheTime)
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
  permissions: Array.isArray(data.permissions)
    ? data.permissions.filter((p): p is Permission =>
        Object.values(Permission).includes(p as Permission)
      )
    : [],
  department: data.department || "",
  position: data.position || "",
  gradeLevel: data.gradeLevel || "",
  workLocation: data.workLocation || "",
  dateJoined: data.dateJoined ? new Date(data.dateJoined) : new Date(),
  status: data.status || "inactive",
  emergencyContact: data.emergencyContact || {
    name: "",
    relationship: "",
    phone: "",
  },
  bankDetails: data.bankDetails || {
    bankName: "",
    accountNumber: "",
    accountName: "",
  },
  profileImage: data.profileImage,
  reportingTo: data.reportingTo,
  isEmailVerified: data.isEmailVerified || false,
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
