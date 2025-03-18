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

axios.defaults.baseURL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";
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
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Just fetch user data directly since we're using cookies
    fetchUserData();
  }, []);

  const hasRole = (role: UserRole): boolean => {
    console.log("=== DEBUG: hasRole ===");
    console.log("Checking role:", role);
    console.log("User role:", user?.role);
    console.log("Is SUPER_ADMIN?", user?.role === UserRole.SUPER_ADMIN);

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
      } else {
        setUser(null);
        // Only show login message if not on auth pages
        if (!window.location.pathname.includes("/auth/")) {
          toast.error("Please login to continue");
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
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
      } else {
        throw new Error("No user data received");
      }
    } catch (error) {
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
    } catch (error) {
      handleAuthError(error);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await axios.get("/api/auth/logout");
      setUser(null);
      toast.success("Logged out successfully");
    } catch (error) {
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
    console.log("=== DEBUG: hasPermission ===");
    console.log("Checking permission:", permission);
    console.log("User permissions:", user?.permissions);

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
  id: data.id || "",
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
  department: data.department,
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
  reportingTo: data.reportingTo || undefined,
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
