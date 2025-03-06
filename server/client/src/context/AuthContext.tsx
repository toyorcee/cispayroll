import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";

axios.defaults.baseURL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";
axios.defaults.withCredentials = true;

interface User {
  id: string;
  firstName: string;
  lastName: string;
  username?: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    firstName: string,
    lastName: string,
    username: string,
    email: string,
    password: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  googleSignIn: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Checking auth state...");
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data } = await axios.get("/auth/me");
      setUser({
        id: data.user.id,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        email: data.user.email,
        username: data.user.username,
        role: data.user.isAdmin ? "Administrator" : "User",
      });
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Attempting login with:", email);
      const { data } = await axios.post("/auth/login", {
        email,
        password,
      });
      console.log("Full login response data:", data);

      if (data.user) {
        setUser({
          id: data.user.id,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          email: data.user.email,
          username: data.user.username,
          role: data.user.isAdmin ? "Administrator" : "User",
        });
        console.log("User set in context with full data:", data.user);
      } else {
        console.log("No user data in response:", data);
        throw new Error("No user data received");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log("Login error details:", error.response?.data);
        const message = error.response?.data?.message || "Failed to sign in";
        throw new Error(message);
      }
      throw error;
    }
  };

  const signUp = async (
    firstName: string,
    lastName: string,
    username: string,
    email: string,
    password: string
  ) => {
    try {
      const { data } = await axios.post("/auth/signup", {
        firstName,
        lastName,
        username,
        email,
        password,
      });

      if (data.user) {
        setUser({
          id: data.user.id,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          email: data.user.email,
          username: data.user.username,
          role: data.user.isAdmin ? "Administrator" : "User",
        });
      } else {
        throw new Error("No user data received");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || "Failed to sign up";
        throw new Error(message);
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await axios.get("/auth/logout");
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const googleSignIn = () => {
    window.location.href = "/auth/google";
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, signOut, googleSignIn }}
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
